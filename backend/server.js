const express = require('express');
const mysql = require('mysql');
const bodyParser = require('body-parser');
const cors = require('cors');
const bcrypt = require('bcrypt');
const multer = require('multer');
const path = require('path');
const fs = require('fs-extra');

const app = express();
app.use(bodyParser.json());
app.use(express.json());
app.use(cors());

// Database connection
const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: 'root',
  database: 'lnhsportal'
});
  
db.connect(err => {
  if (err) throw err;
  console.log('Connected to database');
});

// Middleware to pass db to routes
app.use((req, res, next) => {
  req.db = db;
  next();
});

// Import routes
const teacherRoutes = require('./routes/teacher');

// Use routes
app.use('/', teacherRoutes);

// Import and initialize subject coordinator endpoints
const subjectCoordinatorRoutes = require('./routes/subject-coordinator-endpoints');
subjectCoordinatorRoutes(app, db);

// Serve static files from the uploads directory
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const dir = path.join(__dirname, 'uploads/profile-pictures');
    fs.ensureDirSync(dir); // Make sure the directory exists
    cb(null, dir);
  },
  filename: function (req, file, cb) {
    // The userId is not available in req.body at this point
    // We'll use a temporary name and rename it after processing the request
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 15);
    const fileExt = path.extname(file.originalname);
    cb(null, `temp_${timestamp}_${randomString}${fileExt}`);
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: function (req, file, cb) {
    // Accept only image files
    const filetypes = /jpeg|jpg|png|gif/;
    const mimetype = filetypes.test(file.mimetype);
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    
    if (mimetype && extname) {
      return cb(null, true);
    }
    cb(new Error('Only image files are allowed!'));
  }
});

const roleMap = {
  1: 'principal',
  2: 'student',
  3: 'subject_teacher',
  4: 'class_adviser',
  5: 'grade_level_coordinator',
  6: 'registrar',
  7: 'academic_coordinator',
  8: 'subject_coordinator'
};

// Login endpoint
// Function: Authenticates a user based on provided username and password
// Pages: LoginForm.js
app.post('/login', (req, res) => {
  const { username, password } = req.body;
  console.log(`Login attempt: username=${username}, password=${password}`);
  const query = 'SELECT * FROM users WHERE username = ? AND password = ?';
  db.query(query, [username, password], (err, results) => {
    if (err) {
      console.error('Database query error:', err);
      res.status(500).json({ error: 'Internal server error' });
      return;
    }
    if (results.length > 0) {
      const user = results[0];
      const role = roleMap[user.role_id];
      console.log('Login successful:', user);
      res.json({ authenticated: true, userId: user.user_id, role });
    } else {
      console.log('Login failed: invalid username or password');
      res.json({ authenticated: false });
    }
  });
});


// Endpoint to fetch user details by ID
// Function: Fetches detailed information about a user based on their user ID
// Pages: Layout.js
app.get('/users/:userId', (req, res) => {
  const userId = req.params.userId;
  console.log(`Fetching user details for userId: ${userId}`);
  
  const queryUser = 'SELECT username, role_id FROM users WHERE user_id = ?';
  db.query(queryUser, [userId], (err, userResults) => {
    if (err) {
      console.error('Database query error:', err);
      res.status(500).json({ error: 'Database error' });
      return;
    }
    if (userResults.length > 0) {
      const user = userResults[0];
      const roleId = user.role_id;
      let queryDetails;
      
      if (roleId === 2) { // Student
        queryDetails = `
          SELECT u.username, u.role_id, s.firstname, s.lastname, s.middlename, s.student_id
          FROM users u
          JOIN student s ON u.user_id = s.user_id
          WHERE u.user_id = ?
        `;
      } else { // Employee roles
        queryDetails = `
          SELECT u.username, u.role_id, e.firstname, e.lastname, e.middlename
          FROM users u
          JOIN employee e ON u.user_id = e.user_id
          WHERE u.user_id = ?
        `;
      }

      db.query(queryDetails, [userId], (err, detailsResults) => {
        if (err) {
          console.error('Database query error:', err);
          res.status(500).json({ error: 'Database error' });
          return;
        }
        if (detailsResults.length > 0) {
          const details = detailsResults[0];
          const fullName = `${details.firstname} ${details.middlename ? details.middlename + ' ' : ''}${details.lastname}`;
          res.json({ username: details.username, role_id: details.role_id, fullName });
        } else {
          console.log('User details not found for userId:', userId);
          res.status(404).json({ error: 'User details not found' });
        }
      });
    } else {
      console.log('User not found for userId:', userId);
      res.status(404).json({ error: 'User not found' });
    }
  });
});


// ENDPOINTS USED:
// ATTENDANCE PAGE
// STUDENTS PAGE
app.get('/students', (req, res) => {
  const { searchID, searchTerm, grade, section, school_year } = req.query;

  console.log('Received filters:', { searchID, searchTerm, grade, section, school_year });

  // Query to fetch the active school year (ONLY IF school_year is not provided AND searchID is also not provided)
  let latestSchoolYear = school_year; // Default to user-provided school_year
  if (!school_year && !searchID) { // Only fetch active year if no school_year is selected AND no searchID
    const getActiveSchoolYearQuery = `SELECT school_year FROM school_year WHERE status = 'active' LIMIT 1`;

    db.query(getActiveSchoolYearQuery, (err, results) => {
      if (err) {
        console.error('Error fetching active school year:', err);
        res.status(500).json({ error: 'Failed to fetch active school year' });
        return;
      }

      latestSchoolYear = results[0]?.school_year;
      if (!latestSchoolYear) {
        console.error('No active school year found');
        res.status(404).json({ error: 'No active school year found' });
        return;
      }
      console.log('Using active school year:', latestSchoolYear);
      fetchStudents();
    });
  } else {
    fetchStudents();
  }

  function fetchStudents() {
    let query = `
      SELECT s.student_id, s.user_id, s.lrn, s.section_id,
      CONCAT(s.lastname, ', ', s.firstname, ' ', 
      IF(s.middlename IS NOT NULL AND s.middlename != '', CONCAT(LEFT(s.middlename, 1), '.'), '')) AS stud_name,
      s.lastname, s.firstname, s.middlename, 
      s.current_yr_lvl, DATE_FORMAT(s.birthdate, '%M %e, %Y') AS birthdate, s.gender, s.age, 
      s.home_address, s.barangay, s.city_municipality, s.province, 
      s.contact_number, s.email_address, z.section_name, sy.school_year, sy.school_year_id,
      s.mother_name, s.father_name, s.parent_address, s.father_occupation, 
      s.mother_occupation, FORMAT(s.annual_hshld_income,2) AS annual_hshld_income, s.number_of_siblings, 
      s.father_educ_lvl, s.mother_educ_lvl, s.father_contact_number, 
      s.mother_contact_number, bd.brigada_status AS brigada_eskwela, s.brigada_id,
      s.emergency_number, s.emergency_contactperson,
      (SELECT ss.enrollment_status FROM enrollment ss
      JOIN school_year sy ON ss.school_year_id = sy.school_year_id
      WHERE ss.student_id = s.student_id AND sy.status = 'active' LIMIT 1) as active_status,
      se.enrollment_status, se.student_elective_id
      FROM student s
      LEFT JOIN student_elective se ON s.student_id = se.student_id
      LEFT JOIN section z ON s.section_id=z.section_id
      LEFT JOIN student_school_year ss ON s.student_id = ss.student_id
      LEFT JOIN school_year sy ON ss.school_year_id = sy.school_year_id
      LEFT JOIN brigada_details bd ON s.brigada_id=bd.brigada_id
      WHERE s.active_status = 'unarchive'
    `;

    const queryParams = [];
    const conditions = [];

    // ✅ If searchID is used, it should work independently
    if (searchID) {
      conditions.push(`s.student_id = ?`);
      queryParams.push(searchID);
    } else {
      // ✅ Apply filters only if searchID is NOT used
      if (searchTerm) {
        conditions.push(`(s.firstname LIKE ? OR s.lastname LIKE ? OR s.student_id LIKE ? )`);
        queryParams.push(`%${searchTerm}%`, `%${searchTerm}%`, `%${searchTerm}%`);
      }
      if (grade) {
        conditions.push(`s.current_yr_lvl = ?`);
        queryParams.push(grade);
      }
      if (section) {
        conditions.push(`z.section_name = ?`);
        queryParams.push(section);
      }
      if (latestSchoolYear) {
        conditions.push(`sy.school_year = ?`);
        queryParams.push(latestSchoolYear);
      }
    }

    if (conditions.length > 0) {
      query += ' AND ' + conditions.join(' AND ');
    }

    // ✅ Move GROUP BY to the end before ORDER BY
    query += ' GROUP BY s.student_id ORDER BY s.lastname ASC';

    console.log('Final SQL Query:', query);
    console.log('With parameters:', queryParams);

    // ✅ Execute the main query
    db.query(query, queryParams, (err, results) => {
      if (err) {
        console.error('Error fetching students:', err);
        res.status(500).json({ error: 'Internal server error' });
        return;
      }
      res.json(results);
    });
  }
});

app.get('/students/active', (req, res) => {
  const { searchID, searchTerm, grade, section, school_year } = req.query;

  console.log('Received filters:', { searchID, searchTerm, grade, section, school_year });

  // Query to fetch the active school year (ONLY IF school_year is not provided AND searchID is also not provided)
  let latestSchoolYear = school_year; // Default to user-provided school_year
  if (!school_year && !searchID) { // Only fetch active year if no school_year is selected AND no searchID
    const getActiveSchoolYearQuery = `SELECT school_year FROM school_year WHERE status = 'active' LIMIT 1`;

    db.query(getActiveSchoolYearQuery, (err, results) => {
      if (err) {
        console.error('Error fetching active school year:', err);
        res.status(500).json({ error: 'Failed to fetch active school year' });
        return;
      }

      latestSchoolYear = results[0]?.school_year;
      if (!latestSchoolYear) {
        console.error('No active school year found');
        res.status(404).json({ error: 'No active school year found' });
        return;
      }
      console.log('Using active school year:', latestSchoolYear);
      fetchStudents();
    });
  } else {
    fetchStudents();
  }

  function fetchStudents() {
    let query = `
      SELECT s.student_id, s.user_id, s.lrn, s.section_id,
      CONCAT(s.lastname, ', ', s.firstname, ' ', 
      IF(s.middlename IS NOT NULL AND s.middlename != '', CONCAT(LEFT(s.middlename, 1), '.'), '')) AS stud_name,
      s.lastname, s.firstname, s.middlename, 
      s.current_yr_lvl, DATE_FORMAT(s.birthdate, '%M %e, %Y') AS birthdate, s.gender, s.age, 
      s.home_address, s.barangay, s.city_municipality, s.province, 
      s.contact_number, s.email_address, z.section_name, sy.school_year, sy.school_year_id,
      s.mother_name, s.father_name, s.parent_address, s.father_occupation, 
      s.mother_occupation, FORMAT(s.annual_hshld_income,2) AS annual_hshld_income, s.number_of_siblings, 
      s.father_educ_lvl, s.mother_educ_lvl, s.father_contact_number, 
      s.mother_contact_number, bd.brigada_status AS brigada_eskwela, s.brigada_id,
      s.emergency_number, s.emergency_contactperson,
      (SELECT ss.enrollment_status FROM enrollment ss
      JOIN school_year sy ON ss.school_year_id = sy.school_year_id
      WHERE ss.student_id = s.student_id AND sy.status = 'active' LIMIT 1) as active_status,
      se.enrollment_status, se.student_elective_id
      FROM student s
      LEFT JOIN student_elective se ON s.student_id = se.student_id
      LEFT JOIN section z ON s.section_id=z.section_id
      LEFT JOIN student_school_year ss ON s.student_id = ss.student_id
      LEFT JOIN school_year sy ON ss.school_year_id = sy.school_year_id
      LEFT JOIN brigada_details bd ON s.brigada_id=bd.brigada_id
      WHERE s.active_status = 'unarchive' and ss.status='active'
    `;

    const queryParams = [];
    const conditions = [];

    // ✅ If searchID is used, it should work independently
    if (searchID) {
      conditions.push(`s.student_id = ?`);
      queryParams.push(searchID);
    } else {
      // ✅ Apply filters only if searchID is NOT used
      if (searchTerm) {
        conditions.push(`(s.firstname LIKE ? OR s.lastname LIKE ? OR s.student_id LIKE ? )`);
        queryParams.push(`%${searchTerm}%`, `%${searchTerm}%`, `%${searchTerm}%`);
      }
      if (grade) {
        conditions.push(`s.current_yr_lvl = ?`);
        queryParams.push(grade);
      }
      if (section) {
        conditions.push(`z.section_name = ?`);
        queryParams.push(section);
      }
      if (latestSchoolYear) {
        conditions.push(`sy.school_year = ?`);
        queryParams.push(latestSchoolYear);
      }
    }

    if (conditions.length > 0) {
      query += ' AND ' + conditions.join(' AND ');
    }

    // ✅ Move GROUP BY to the end before ORDER BY
    query += ' GROUP BY s.student_id ORDER BY s.lastname ASC';

    console.log('Final SQL Query:', query);
    console.log('With parameters:', queryParams);

    // ✅ Execute the main query
    db.query(query, queryParams, (err, results) => {
      if (err) {
        console.error('Error fetching students:', err);
        res.status(500).json({ error: 'Internal server error' });
        return;
      }
      res.json(results);
    });
  }
});

app.get('/students/pending-enrollment', (req, res) => {
  const { searchTerm, grade, section, school_year } = req.query;

  console.log('Received params:', { searchTerm, grade, section, school_year });

  // Query to fetch the active school year
  const getActiveSchoolYearQuery = `
    SELECT school_year 
    FROM school_year 
    WHERE status = 'active' 
    LIMIT 1
  `;

  db.query(getActiveSchoolYearQuery, (err, results) => {
    if (err) {
      console.error('Error fetching active school year:', err);
      res.status(500).json({ error: 'Failed to fetch active school year' });
      return;
    }

    const latestSchoolYear = results[0]?.school_year;

    if (!latestSchoolYear) {
      console.error('No active school year found');
      res.status(404).json({ error: 'No active school year found' });
      return;
    }

    console.log('Active school year:', latestSchoolYear);

    // Build the main query
    let query = `
      SELECT s.student_id, s.user_id, s.lastname, s.firstname, s.middlename, 
      xx.grade_level, s.birthdate, s.gender, s.age, 
      s.home_address, s.barangay, s.city_municipality, s.province, 
      s.contact_number, s.email_address, s.status as stud_status,
      s.mother_name, s.father_name, s.parent_address, s.father_occupation, 
      s.mother_occupation, s.annual_hshld_income, s.number_of_siblings, 
      s.father_educ_lvl, s.mother_educ_lvl, s.father_contact_number, 
      s.mother_contact_number, bd.brigada_status AS brigada_eskwela,
      xx.enrollment_status as active_status,
      se.enrollment_status, se.student_elective_id, xx.school_year_id,
      (SELECT COUNT(en.student_id) FROM enrollment en WHERE en.student_id = s.student_id) 
      AS enrollment_count
      FROM enrollment xx
      LEFT JOIN student s ON s.student_id=xx.student_id
      LEFT JOIN student_elective se ON s.student_id = se.student_id 
      LEFT JOIN brigada_details bd ON s.brigada_id=bd.brigada_id
      WHERE s.active_status = 'unarchive' AND xx.enrollment_status='pending'
    `;

    const queryParams = [];
    const conditions = [];

    if (searchTerm) {
      conditions.push(`(s.firstname LIKE ? OR s.lastname LIKE ?)`);
      queryParams.push(`%${searchTerm}%`, `%${searchTerm}%`);
    }

    if (grade) {
      conditions.push(`s.current_yr_lvl = ?`);
      queryParams.push(grade);
    }

    if (section) {
      conditions.push(`s.section_id = ?`);
      queryParams.push(section);
    }

    if (conditions.length > 0) {
      query += ' AND ' + conditions.join(' AND ');
    }

    query += ' ORDER BY s.firstname';

    console.log('Final query:', query);
    console.log('With parameters:', queryParams);

    // Execute the main query
    db.query(query, queryParams, (err, results) => {
      if (err) {
        console.error('Error fetching students:', err);
        res.status(500).json({ error: 'Internal server error' });
        return;
      }
      res.json(results);
    });
  });
});


app.put('/students/:id', (req, res) => {
  const studentId = req.params.id;
  const updatedData = req.body;

  const updateQuery = `
    UPDATE student 
    SET firstname = ?, lastname = ?, middlename = ?, 
        current_yr_lvl = ?, birthdate = ?, gender = ?, 
        age = ?, home_address = ?, barangay = ?, city_municipality = ?, 
        province = ?, contact_number = ?, email_address = ?, 
        mother_name = ?, father_name = ?, parent_address = ?, 
        father_occupation = ?, mother_occupation = ?, 
        annual_hshld_income = ?, number_of_siblings = ?, 
        father_educ_lvl = ?, mother_educ_lvl = ?, 
        father_contact_number = ?, mother_contact_number = ?,
        emergency_number = ?, emergency_contactperson = ?, section_id = ?,
        lrn = ?
    WHERE student_id = ?
  `;

  const VALUES = [
    updatedData.firstname, updatedData.lastname, updatedData.middlename,
    updatedData.current_yr_lvl, updatedData.birthdate, updatedData.gender,
    updatedData.age, updatedData.home_address, updatedData.barangay, updatedData.city_municipality,
    updatedData.province, updatedData.contact_number, updatedData.email_address,
    updatedData.mother_name, updatedData.father_name, updatedData.parent_address,
    updatedData.father_occupation, updatedData.mother_occupation,
    updatedData.annual_hshld_income, updatedData.number_of_siblings,
    updatedData.father_educ_lvl, updatedData.mother_educ_lvl,
    updatedData.father_contact_number, updatedData.mother_contact_number,
    updatedData.emergency_number, updatedData.emergency_contactperson,
    updatedData.section_id, updatedData.lrn,
    studentId
  ];

  // Update student information first
  db.query(updateQuery, VALUES, (err, result) => {
    if (err) {
      console.error('Error updating student:', err);
      return res.status(500).json({ error: 'Failed to update student' });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Student not found' });
    }

    // Get active school year
    const getSchoolYearQuery = `SELECT school_year_id FROM school_year WHERE status = 'active' LIMIT 1`;

    db.query(getSchoolYearQuery, (err, schoolYearResult) => {
      if (err) {
        console.error('Error getting active school year:', err);
        return res.status(500).json({ error: 'Failed to retrieve school year' });
      }

      if (schoolYearResult.length === 0) {
        return res.status(400).json({ error: 'No active school year found' });
      }

      const school_year_id = schoolYearResult[0].school_year_id;

      // Update the section_id in the enrollment table
      const updateEnrollmentQuery = `
        UPDATE enrollment 
        SET section_id = ? 
        WHERE student_id = ? AND school_year_id = ?
      `;

      db.query(updateEnrollmentQuery, [updatedData.section_id, studentId, school_year_id], (err, enrollResult) => {
        if (err) {
          console.error('Error updating enrollment section:', err);
          return res.status(500).json({ error: 'Failed to update section in enrollment' });
        }

        res.json({ message: 'Student and enrollment section updated successfully' });
      });
    });
  });
});


// ENDPOINT USED:
// STUDENTS PAGE
app.post('/students', (req, res) => {
  console.log('Received data:', req.body);

  const {
    lastname, firstname, middlename, current_yr_lvl, birthdate, gender, age,
    home_address, barangay, city_municipality, province, contact_number,
    email_address, mother_name, father_name, parent_address, father_occupation,
    mother_occupation, annual_hshld_income, number_of_siblings, father_educ_lvl,
    mother_educ_lvl, father_contact_number, mother_contact_number, emergency_number,
    emergency_contactperson, STATUS, active_status, brigada_eskwela = '0', brigada_remarks, lrn
  } = req.body;

  const brigada_eskwela_value = brigada_eskwela || '0';

  const getLastStudentQuery = `SELECT student_id FROM student ORDER BY student_id DESC LIMIT 1`;

  db.query(getLastStudentQuery, (err, result) => {
    if (err) {
      console.error('Failed to fetch last student ID:', err);
      return res.status(500).json({ error: 'Failed to fetch last student ID' });
    }

    let nextStudentId = 1;
    if (result.length > 0) {
      nextStudentId = result[0].student_id + 1;
    }

    const QUERY = `
      INSERT INTO student (
        student_id, lrn, lastname, firstname, middlename, current_yr_lvl,
        birthdate, gender, age, home_address, barangay, city_municipality,
        province, contact_number, email_address, mother_name, father_name,
        parent_address, father_occupation, mother_occupation, annual_hshld_income,
        number_of_siblings, father_educ_lvl, mother_educ_lvl, father_contact_number,
        mother_contact_number, emergency_number, emergency_contactperson, status, active_status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const studentData = [
      nextStudentId,
      lrn || null,
      lastname,
      firstname,
      middlename || '',
      current_yr_lvl,
      birthdate,
      gender,
      age,
      home_address,
      barangay,
      city_municipality,
      province,
      contact_number,
      email_address,
      mother_name,
      father_name,
      parent_address || '',
      father_occupation || '',
      mother_occupation || '',
      annual_hshld_income || '',
      number_of_siblings || 0,
      father_educ_lvl || '',
      mother_educ_lvl || '',
      father_contact_number,
      mother_contact_number,
      emergency_number,
      emergency_contactperson || '',
      STATUS || 'active',
      active_status || 'unarchive'
    ];

    db.query(QUERY, studentData, (error, result) => {
      if (error) {
        console.error('Failed to add student:', error);
        return res.status(500).json({ error: 'Failed to add student' });
      }

        const getSchoolYearQuery = `SELECT school_year_id FROM school_year WHERE status = 'active' LIMIT 1`;

        db.query(getSchoolYearQuery, (err2, syResult) => {
          if (err2) {
            console.error('Failed to get school year ID:', err2);
            return res.status(500).json({ error: 'Failed to get school year ID' });
          }

          if (syResult.length === 0) {
            return res.status(404).json({ error: 'No active school year found' });
          }

          const schoolYearId = syResult[0].school_year_id;
          const brigadaStatus = brigada_eskwela === '0' || brigada_eskwela === 0 ? 'Not Attended' : 'Attended';


          const insertBrigadaDetailsQuery = `
            INSERT INTO brigada_details (student_id, remarks, school_year_id, brigada_status)
            VALUES (?, ?, ?, ?)
          `;

          db.query(insertBrigadaDetailsQuery, [nextStudentId, brigada_remarks || '', schoolYearId, brigadaStatus], (err3) => {
            if (err3) {
              console.error('Failed to insert brigada details:', err3);
              return res.status(500).json({ error: 'Failed to insert brigada details' });
            }

            const selectBrigadaIdQuery = `SELECT brigada_id FROM brigada_details WHERE student_id = ?`;

            db.query(selectBrigadaIdQuery, [nextStudentId], (err4, brigadaResult) => {
              if (err4) {
                console.error('Failed to fetch brigada_id:', err4);
                return res.status(500).json({ error: 'Failed to fetch brigada_id' });
              }

              if (brigadaResult.length === 0) {
                return res.status(404).json({ error: 'Brigada ID not found' });
              }

              const brigadaId = brigadaResult[0].brigada_id;

              const updateStudentQuery = `UPDATE student SET brigada_id = ? WHERE student_id = ?`;

              db.query(updateStudentQuery, [brigadaId, nextStudentId], (err5) => {
                if (err5) {
                  console.error('Failed to update student with brigada_id:', err5);
                  return res.status(500).json({ error: 'Failed to update student with brigada_id' });
                }

                return res.status(201).json({
                  message: 'Student and brigada details added successfully',
                  studentId: nextStudentId
                });
              });
            });
          });
        });
    });
  });
});

// Endpoint for student attendance in web app
app.get('/attendance/:userId', async (req, res) => {
  try {
    const userId = req.params.userId;
    const schoolYearId = req.query.schoolYearId || null;
    
    console.log(`Fetching attendance for userId: ${userId}, schoolYearId: ${schoolYearId}`);
    
    // Build the query with proper joins to get all required data
    const query = `
      SELECT 
        a.attendance_id,
        a.date,
        s.subject_name,
        s.subject_id,
        sch.time_start,
        sch.time_end,
        sch.schedule_id,
        sch.day,
        CONCAT(e.firstname, ' ', e.lastname) AS teacher_name,
        e.employee_id AS teacher_id,
        CASE 
          WHEN a.status = 'P' THEN 'Present'
          WHEN a.status = 'A' THEN 'Absent'
          WHEN a.status = 'L' THEN 'Late'
          ELSE 'No Record'
        END AS status,
        sy.school_year,
        sy.school_year_id,
        st.current_yr_lvl AS grade_level,
        sec.section_name
      FROM attendance a
      JOIN schedule sch ON a.schedule_id = sch.schedule_id
      JOIN subject s ON sch.subject_id = s.subject_id
      LEFT JOIN employee e ON sch.teacher_id = e.employee_id
      LEFT JOIN school_year sy ON a.school_year_id = sy.school_year_id
      JOIN student st ON a.student_id = st.student_id
      LEFT JOIN section sec ON st.section_id = sec.section_id
      WHERE a.student_id = (
        SELECT student_id FROM student WHERE user_id = ?
      )
      ${schoolYearId ? 'AND a.school_year_id = ?' : ''}
      ORDER BY a.date DESC
    `;
    
    const queryParams = schoolYearId ? [userId, schoolYearId] : [userId];
    
    db.query(query, queryParams, (err, results) => {
      if (err) {
        console.error('Error fetching attendance:', err);
        return res.status(500).json({ success: false, error: 'Database error', details: err.message });
      }
      
      console.log(`Retrieved ${results.length} attendance records`);
      
      // Process the day field
      const processedResults = results.map(record => {
        try {
          if (record.day && typeof record.day === 'string' && record.day.startsWith('[')) {
            try {
              const days = JSON.parse(record.day);
              record.day = days.join(', '); // Join all days with a comma
            } catch (e) {
              console.error('Error parsing day JSON:', e);
              record.day = 'N/A';
            }
          }
          return record;
        } catch (error) {
          console.error('Error processing record:', error);
          return record;
        }
      });
      
      
      res.json(processedResults);
    });
  } catch (error) {
    console.error('Server error:', error);
    res.status(500).json({ success: false, error: 'Server error', details: error.message });
  }
});

// Get detailed attendance for a specific date
app.get('/attendance/:userId/date/:date', async (req, res) => {
  try {
    const { userId, date } = req.params;
    const schoolYearId = req.query.schoolYearId || null;
    
    console.log(`Fetching attendance for date: ${date}, userId: ${userId}, schoolYearId: ${schoolYearId}`);
    
    // Format date for comparison
    const formattedDate = new Date(date).toISOString().split('T')[0];
    
    const query = `
      SELECT 
        a.attendance_id,
        a.date,
        s.subject_name,
        s.subject_id,
        sch.day,
        sch.time_start,
        sch.time_end,
        sch.schedule_id,
        CONCAT(e.firstname, ' ', e.lastname) AS teacher_name,
        e.employee_id AS teacher_id,
        CASE 
          WHEN a.status = 'P' THEN 'Present'
          WHEN a.status = 'A' THEN 'Absent'
          WHEN a.status = 'L' THEN 'Late'
          ELSE 'No Record'
        END AS status,
        sy.school_year,
        sy.school_year_id,
        st.current_yr_lvl AS grade_level,
        sec.section_name
      FROM attendance a
      JOIN schedule sch ON a.schedule_id = sch.schedule_id
      JOIN subject s ON sch.subject_id = s.subject_id
      LEFT JOIN employee e ON sch.teacher_id = e.employee_id
      LEFT JOIN school_year sy ON a.school_year_id = sy.school_year_id
      JOIN student st ON a.student_id = st.student_id
      LEFT JOIN section sec ON st.section_id = sec.section_id
      WHERE a.student_id = (
        SELECT student_id FROM student WHERE user_id = ?
      )
      AND DATE(a.date) = ?
      ${schoolYearId ? 'AND a.school_year_id = ?' : ''}
    `;
    
    const queryParams = schoolYearId ? [userId, formattedDate, schoolYearId] : [userId, formattedDate];
    
    db.query(query, queryParams, (err, results) => {
      if (err) {
        console.error('Error fetching attendance for date:', err);
        return res.status(500).json({ success: false, error: 'Database error', details: err.message });
      }
      
      console.log(`Retrieved ${results.length} attendance records for date ${date}`);
      
      // Process the day field
      const processedResults = results.map(record => {
        try {
          if (record.day && typeof record.day === 'string' && record.day.startsWith('[')) {
            try {
              const days = JSON.parse(record.day);
              record.day = days.join(', '); // Join all days with a comma
            } catch (e) {
              console.error('Error parsing day JSON:', e);
              record.day = 'N/A';
            }
          }
          return record;
        } catch (error) {
          console.error('Error processing record:', error);
          return record;
        }
      });
      
      res.json(processedResults);
    });
  } catch (error) {
    console.error('Server error:', error);
    res.status(500).json({ success: false, error: 'Server error', details: error.message });
  }
});






// ENDPOINT USED:
// STUDENTS PAGE
app.put('/students/:id/enroll', (req, res) => {
  const studentId = req.params.id;
  const { school_year, status } = req.body;

  console.log(`Enrolling student with ID: ${studentId}, School Year: ${school_year}, Status: ${status}`);

  const checkStudentQuery = 'SELECT * FROM student WHERE student_id = ?';
  db.query(checkStudentQuery, [studentId], (err, studentResult) => {
    if (err) {
      console.error('Error checking student existence:', err);
      return res.status(500).json({ error: 'Failed to check student existence', details: err.message });
    }

    if (studentResult.length === 0) {
      console.error('No student found with ID:', studentId);
      return res.status(404).json({ error: `No student found with ID: ${studentId}` });
    }

    const student = studentResult[0];
    console.log('Student found:', student);

    const username = `${student.lastname}.${student.firstname.replace(/ /g, '_')}@lnhs.com`.toLowerCase();
    const password = '1234';
    const role_id = 2;
    const role_name = 'student';

    const userInsertQuery = `
      INSERT INTO users (username, password, role_id, role_name)
      VALUES (?, ?, ?, ?)
    `;
    const userInsertValues = [username, password, role_id, role_name];

    console.log('Inserting into users table:', userInsertValues);

    db.query(userInsertQuery, userInsertValues, (userInsertErr, userInsertResult) => {
      if (userInsertErr) {
        console.error('Error inserting user:', userInsertErr.sqlMessage || userInsertErr);
        return res.status(500).json({ error: 'Failed to insert user', details: userInsertErr.message });
      }

      const newUserId = userInsertResult.insertId;
      console.log('User inserted successfully with user_id:', newUserId);

      const updateStudentQuery = `
        UPDATE student
        SET user_id = ?, enroll_date = CURRENT_DATE()
        WHERE student_id = ?
      `;
      const updateStudentValues = [newUserId, studentId];

      db.query(updateStudentQuery, updateStudentValues, (updateStudentErr) => {
        if (updateStudentErr) {
          console.error('Error updating student:', updateStudentErr);
          return res.status(500).json({ error: 'Failed to update student with user_id', details: updateStudentErr.message });
        }

        const schoolYearQuery = 'SELECT school_year_id FROM school_year WHERE school_year = ?';
        db.query(schoolYearQuery, [school_year], (schoolYearErr, schoolYearResult) => {
          if (schoolYearErr) {
            console.error('Error fetching school_year_id:', schoolYearErr);
            return res.status(500).json({ error: 'Failed to fetch school_year_id', details: schoolYearErr.message });
          }

          if (schoolYearResult.length === 0) {
            console.error('No school year found:', school_year);
            return res.status(404).json({ error: `No school year found for: ${school_year}` });
          }

          const schoolYearId = schoolYearResult[0].school_year_id;

          const selectBrigadaIdQuery = 'SELECT brigada_id FROM brigada_details WHERE student_id = ?';
          db.query(selectBrigadaIdQuery, [student.student_id], (brigadaErr, brigadaResult) => {
            if (brigadaErr) {
              console.error('Failed to fetch brigada_id:', brigadaErr);
              return res.status(500).json({ error: 'Failed to fetch brigada_id' });
            }

            if (brigadaResult.length === 0) {
              return res.status(404).json({ error: 'Brigada ID not found' });
            }

            const brigada_id = brigadaResult[0].brigada_id;
            const middleInitial = student.middlename ? student.middlename.charAt(0).toLowerCase() + '.' : '';
            const studentName = `${student.firstname.toLowerCase()} ${middleInitial} ${student.lastname.toLowerCase()}`.trim();

            const enrollmentInsertQuery = `
              INSERT INTO enrollment (student_id, school_year_id, enrollee_type, enrollment_status, enrollment_date, grade_level, student_name, brigada_id)
              VALUES (?, ?, 'Regular', 'inactive', NOW(), ?, ?, ?)
            `;
            const enrollmentInsertValues = [
              student.student_id,
              schoolYearId,
              student.current_yr_lvl,
              studentName,
              brigada_id
            ];

            db.query(enrollmentInsertQuery, enrollmentInsertValues, (enrollmentErr, enrollmentResult) => {
              if (enrollmentErr) {
                console.error('Error inserting student enrollment:', enrollmentErr);
                return res.status(500).json({ error: 'Failed to enroll student', details: enrollmentErr.message });
              }

              const studentSchoolYearInsertQuery = `
                INSERT INTO student_school_year (student_school_year_id, student_id, school_year_id, status, student_name, grade_level)
                VALUES (NULL, ?, ?, ?, ?, ?)
              `;
              const studentSchoolYearValues = [
                student.student_id,
                schoolYearId,
                status || 'inactive',
                studentName,
                student.current_yr_lvl
              ];

              db.query(studentSchoolYearInsertQuery, studentSchoolYearValues, (studentSchoolYearErr, studentSchoolYearResult) => {
                if (studentSchoolYearErr) {
                  console.error('Error inserting into student_school_year:', studentSchoolYearErr);
                  return res.status(500).json({ error: 'Failed to insert into student_school_year', details: studentSchoolYearErr.message });
                }

                res.status(200).json({
                  message: 'Student enrolled successfully. Enrollment and student_school_year records created.'
                });
              });
            });
          });
        });
      });
    });
  });
});





// ENDPOINT USED:
// STUDENTS PAGE
app.post('/validate-enrollment', (req, res) => {
  const { studentId, action, sectionId } = req.body; // Added sectionId to the request body

  // Fetch active school year
  const getSchoolYearQuery = 'SELECT school_year_id FROM school_year WHERE status = "active"';

  db.query(getSchoolYearQuery, (err, schoolYearResults) => {
    if (err) {
      console.error('Error fetching school year ID:', err);
      return res.status(500).json({ error: 'Database error' });
    }

    if (schoolYearResults.length === 0) {
      console.error('No active school year found');
      return res.status(404).json({ error: 'No active school year found' });
    }

    const schoolYearId = schoolYearResults[0].school_year_id;

    if (action === 'reject') {
      // Handle reject action (existing logic)
      const rejectQuery = `UPDATE student_school_year SET status = 'inactive' WHERE student_id = ?;`;
      const updateEnrollmentQuery = `UPDATE enrollment SET enrollment_status = 'inactive' WHERE student_id = ? AND school_year_id = ?;`;

      db.query(rejectQuery, [studentId], (err1, result1) => {
        if (err1) {
          console.error('Error updating student_school_year:', err1.message);
          return res.status(500).json({ error: 'Database error: ' + err1.message });
        }

        if (result1.affectedRows === 0) {
          console.error(`No record found in student_school_year for student ID: ${studentId}`);
          return res.status(404).json({ error: 'No matching record found in student_school_year' });
        }

        // Update the enrollment status to 'inactive'
        db.query(updateEnrollmentQuery, [studentId,schoolYearId], (err2, result2) => {
          if (err2) {
            console.error('Error updating enrollment:', err2.message);
            return res.status(500).json({ error: 'Database error: ' + err2.message });
          }

          console.log(`Student ID: ${studentId} enrollment rejected (status set to 'inactive').`);
          return res.status(200).json({ message: 'Enrollment rejected successfully.' });
        });
      });

    } else if (action === 'approve') {
      // Step for Approve: Perform all the steps except rejection
      const updateStudentSchoolYearQuery = `UPDATE student_school_year SET status = 'active' WHERE student_id = ?;`;

      db.query(updateStudentSchoolYearQuery, [studentId], (err1, result1) => {
        if (err1) {
          console.error('Error updating student_school_year:', err1.message);
          return res.status(500).json({ error: 'Database error: ' + err1.message });
        }

        if (result1.affectedRows === 0) {
          console.error(`No record found in student_school_year for student ID: ${studentId}`);
          return res.status(404).json({ error: 'No matching record found in student_school_year' });
        }

        console.log(`student_school_year status updated to 'active' for student ID: ${studentId}`);

        // Step 2: Update enrollment table to 'active' and include school_year_id
        const updateEnrollmentQuery = `UPDATE enrollment SET enrollment_status = 'active' WHERE student_id = ? AND school_year_id = ? ;`;

        db.query(updateEnrollmentQuery, [studentId,schoolYearId], (err2, result2) => {
          if (err2) {
            console.error('Error updating enrollment:', err2.message);
            return res.status(500).json({ error: 'Database error: ' + err2.message });
          }

          if (result2.affectedRows === 0) {
            console.error(`No record found in enrollment for student ID: ${studentId}`);
            return res.status(404).json({ error: 'No matching record found in enrollment' });
          }

          console.log(`Enrollment status updated to 'active' for student ID: ${studentId}`);

          // Step 3: Assign student to a section based on grade level & gender if sectionId is not provided
          if (!sectionId) {
            const getStudentDetailsQuery = `SELECT current_yr_lvl, gender FROM student WHERE student_id = ?;`;

            db.query(getStudentDetailsQuery, [studentId], (err3, result3) => {
              if (err3) {
                console.error('Error fetching student details:', err3.message);
                return res.status(500).json({ error: 'Database error: ' + err3.message });
              }

              if (result3.length === 0) {
                console.error(`No details found for student ID: ${studentId}`);
                return res.status(404).json({ error: 'No details found for the student' });
              }

              const { current_yr_lvl: gradeLevel, gender } = result3[0];

              // Fetch available sections for this grade level
              const fetchSectionsQuery = `
                SELECT section_id, max_capacity,
                  (SELECT COUNT(*) FROM student WHERE section_id = section.section_id AND gender = 'male') AS male_count,
                  (SELECT COUNT(*) FROM student WHERE section_id = section.section_id AND gender = 'female') AS female_count,
                  (SELECT COUNT(*) FROM student WHERE section_id = section.section_id) AS total_count
                FROM section
                WHERE grade_level = ?;
              `;

              db.query(fetchSectionsQuery, [gradeLevel], (err4, sections) => {
                if (err4) {
                  console.error('Error fetching sections:', err4.message);
                  return res.status(500).json({ error: 'Database error: ' + err4.message });
                }

                if (sections.length === 0) {
                  console.error(`No sections found for grade level: ${gradeLevel}`);
                  return res.status(404).json({ error: 'No sections available for this grade level' });
                }

                // Logic to distribute students by gender and capacity
                let selectedSection = null;
                let smallestDifference = Infinity;

                sections.forEach(section => {
                  const { section_id, male_count, female_count, total_count, max_capacity } = section;

                  // Ensure the section has space
                  if (total_count < max_capacity) {
                    let difference = gender === 'male'
                      ? Math.abs((male_count + 1) - female_count)
                      : Math.abs(male_count - (female_count + 1));

                    if (difference < smallestDifference || (difference === smallestDifference && Math.random() < 0.5)) {
                      smallestDifference = difference;
                      selectedSection = section_id;
                    }
                  }
                });

                if (!selectedSection) {
                  console.error('No suitable section found with available capacity.');
                  return res.status(500).json({ error: 'No suitable section found with available capacity.' });
                }

                // Assign student to section
                const updateStudentSectionQuery = `UPDATE student SET section_id = ? WHERE student_id = ?;`;

                db.query(updateStudentSectionQuery, [selectedSection, studentId], (err5, result5) => {
                  if (err5) {
                    console.error('Error assigning section to student:', err5.message);
                    return res.status(500).json({ error: 'Database error: ' + err5.message });
                  }

                  // Update enrollment table with selected section
                  const updateEnrollmentWithSectionQuery = `UPDATE enrollment SET section_id = ? WHERE student_id = ? AND school_year_id = ?;`;

                  db.query(updateEnrollmentWithSectionQuery, [selectedSection, studentId, schoolYearId], (err6, result6) => {
                    if (err6) {
                      console.error('Error updating enrollment with section:', err6.message);
                      return res.status(500).json({ error: 'Database error: ' + err6.message });
                    }

                    console.log(`Student ID: ${studentId} assigned to section ID: ${selectedSection}`);
                    res.status(200).json({ message: 'Enrollment approved, section assigned, and updated in enrollment successfully' });
                  });
                });
              });
            });
          } else {
            console.log(`Student ID: ${studentId} already has a section ID: ${sectionId}`);
            
            // Update enrollment table with provided sectionId
            const updateEnrollmentWithProvidedSectionQuery = `UPDATE enrollment SET section_id = ? WHERE student_id = ? AND school_year_id = ?;`;

            db.query(updateEnrollmentWithProvidedSectionQuery, [sectionId, studentId, schoolYearId], (err7, result7) => {
              if (err7) {
                console.error('Error updating enrollment with provided section:', err7.message);
                return res.status(500).json({ error: 'Database error: ' + err7.message });
              }

              res.status(200).json({ message: 'Enrollment approved, section updated successfully' });
            });
          }
        });
      });

    } else {
      return res.status(400).json({ error: 'Invalid action' });
    }
  });
});




// ENDPOINT USED:
// STUDENTS PAGE
app.post('/approve-elective', (req, res) => {
  const { studentId, action } = req.body; // Get studentId and action ('approve' or 'reject')

  if (!studentId || !action) {
    return res.status(400).json({ error: 'Missing required parameters: studentId and action' });
  }

  // Determine the correct status based on action
  let status = action === 'approve' ? 'approved' : 'rejected';

  const updateQuery = `
    UPDATE student_elective 
    SET enrollment_status = ? 
    WHERE student_id = ?;
  `;

  db.query(updateQuery, [status, studentId], (err, result) => {
    if (err) {
      console.error(`Error updating elective status to '${status}' for student ID: ${studentId}`, err.message);
      return res.status(500).json({ error: 'Database error: ' + err.message });
    }

    if (result.affectedRows === 0) {
      console.warn(`No record found in student_elective for student ID: ${studentId}`);
      return res.status(404).json({ error: 'No matching elective enrollment found.' });
    }

    console.log(`Elective enrollment status updated to '${status}' for student ID: ${studentId}`);
    res.status(200).json({ message: `Elective enrollment ${status} successfully.` });
  });
});




// ENDPOINT USED:
// STUDENT ENROLLMENT PAGE
app.get('/elective-status/:user_id', (req, res) => {
  const userId = req.params.user_id;

  // First, get the student's section_id based on user_id
  const getSectionQuery = `SELECT section_id, student_id FROM student WHERE user_id = ?`;

  db.query(getSectionQuery, [userId], (err, sectionResult) => {
    if (err) {
      console.error('Error fetching section_id:', err);
      return res.status(500).json({ error: 'Database error' });
    }

    if (sectionResult.length === 0) {
      return res.json({ status: '', hasElective: 0 }); // No student found
    }

    const sectionId = sectionResult[0].section_id;
    const studentId = sectionResult[0].student_id;

    // Now, check if the student has any elective enrollment
    const checkElectiveQuery = `
      SELECT enrollment_status
      FROM student_elective 
      WHERE user_id = ?
      LIMIT 1
    `;

    db.query(checkElectiveQuery, [userId], (err, electiveResult) => {
      if (err) {
        console.error('Error checking elective status:', err);
        return res.status(500).json({ error: 'Database error' });
      }

      // Check if there are any elective records
      const hasElective = electiveResult.length > 0 ? 1 : 0;
      const status = electiveResult.length > 0 ? electiveResult[0].enrollment_status : '';
      
      res.json({ 
        status: status, 
        hasElective: hasElective 
      });
    });
  });
});

// ENDPOINT USED:
// STUDENT ENROLLMENT PAGE
app.get('/enrollment-status/:user_id', (req, res) => {
  const userId = req.params.user_id;

  const query = `
    SELECT b.enrollment_status AS status
    FROM student a
    LEFT JOIN enrollment b ON a.student_id = b.student_id
    LEFT JOIN school_year c ON b.school_year_id = c.school_year_id
    WHERE a.user_id = ? AND c.school_year = '2025-2026';
  `;

  db.query(query, [userId], (err, results) => {
    if (err) {
      console.error('Error executing query:', err.message);
      return res.status(500).json({ error: 'Database error: ' + err.message });
    }

    if (results.length > 0) {
      res.json({ status: results[0].status });
    } else {
      res.status(404).json({ error: 'No enrollment status found for this user' });
    }
  });
});

// ENDPOINT USED:
// STUDENT ENROLLMENT PAGE
app.get('/enrollment/:user_id', (req, res) => {
  const userId = req.params.user_id;

  // Step 1: Get section_id from student
  const getSectionQuery = 'SELECT section_id FROM student WHERE user_id = ? LIMIT 1';

  db.query(getSectionQuery, [userId], (err, sectionResult) => {
    if (err) {
      console.error('Error fetching section_id:', err.message);
      return res.status(500).json({ error: 'Failed to fetch section_id' });
    }

    if (sectionResult.length === 0) {
      return res.status(404).json({ error: 'Student not found' });
    }

    const sectionId = sectionResult[0].section_id;

    // Step 2: Use user_id and section_id in the subject query
    const subjectQuery = `
      SELECT DISTINCT 
        a.subject_name, 
        REPLACE(REPLACE(REPLACE(REPLACE(d.day, '[', ''), ']', ''), '"', ''), ',', ', ') AS day,
        CONCAT(c.lastname, ', ', c.firstname, ' ', IFNULL(c.middlename, '')) AS teacher, 
        CASE 
          WHEN d.time_start IS NOT NULL AND d.time_end IS NOT NULL 
          THEN CONCAT(d.time_start, ' - ', d.time_end)
          ELSE ''
        END AS schedule
      FROM subject a 
      LEFT JOIN schedule d ON a.subject_id = d.subject_id 
      INNER JOIN student b ON b.section_id = d.section_id
      LEFT JOIN employee c ON d.teacher_id = c.employee_id 
      WHERE b.user_id = ? 
        AND b.section_id = ?
        AND a.status = 'active' 
        AND a.elective = 'N'

      UNION

      SELECT DISTINCT 
        b.subject_name,
        REPLACE(REPLACE(REPLACE(REPLACE(d.day, '[', ''), ']', ''), '"', ''), ',', ', ') AS day,
        CONCAT(e.lastname, ', ', e.firstname, ' ', IFNULL(e.middlename, '')) AS teacher, 
        CASE 
          WHEN d.time_start IS NOT NULL AND d.time_end IS NOT NULL 
          THEN CONCAT(d.time_start, ' - ', d.time_end)
          ELSE ''
        END AS schedule
      FROM student_elective a
      LEFT JOIN subject b ON a.elective_id = b.subject_id
      LEFT JOIN schedule d ON b.subject_id = d.subject_id
      LEFT JOIN employee e ON d.teacher_id = e.employee_id
      WHERE a.user_id = ?
        AND a.section_id = ?
        AND b.status = 'active'
        AND a.enrollment_status = 'approved'

      ORDER BY subject_name
    `;

    db.query(subjectQuery, [userId, sectionId, userId, sectionId], (err, results) => {
      if (err) {
        console.error('Error executing enrollment query:', err.message);
        return res.status(500).json({ error: 'Failed to fetch enrollment data' });
      }

      res.json(results || []);
    });
  });
});


// ENDPOINT USED:
// STUDENT ENROLLMENT PAGE
app.get('/active-school-year', (req, res) => {
  const query = 'SELECT school_year FROM school_year WHERE STATUS = "active"';
  
  db.query(query, (err, results) => {
    if (err) {
      console.error('Error fetching active school year:', err);
      return res.status(500).json({ error: 'Failed to fetch active school year' });
    }

    if (results.length > 0) {
      const activeSchoolYear = results[0].school_year;
      res.json({ activeSchoolYear });
    } else {
      res.status(404).json({ error: 'No active school year found' });
    }
  });
});

// ENDPOINT USED:
// STUDENT ENROLLMENT PAGE
app.post('/apply-enrollment', (req, res) => {
  const { studentId } = req.body; // Get userId from request body

  // Query to fetch student and school year information
  const queryFetch = `
    SELECT a.student_id, a.current_yr_lvl, a.lastname, a.firstname, a.middlename, c.school_year_id 
    FROM student a
    JOIN school_year c ON c.status = 'active' 
    WHERE a.student_id = ?;
  `;

  db.query(queryFetch, [studentId], (err, results) => {
    if (err) {
      console.error('Error fetching student or school year:', err.message);
      return res.status(500).json({ error: 'Database error: ' + err.message });
    }

    if (results.length === 0) {
      console.error('No matching student or active school year found for userId:', userId);
      return res.status(404).json({ error: 'No matching student or active school year found' });
    }

    const student = results[0];
    const { student_id, school_year_id } = student;

    // Step 1: Update the status in the student_school_year table to 'pending'
    const queryUpdateStudentSchoolYear = `
      UPDATE student_school_year SET status = 'pending' WHERE student_id = ? AND school_year_id = ?;
    `;
    const updateValues1 = [student_id, school_year_id];

    db.query(queryUpdateStudentSchoolYear, updateValues1, (updateErr1, updateResult1) => {
      if (updateErr1) {
        console.error('Error updating student_school_year:', updateErr1.message);
        return res.status(500).json({ error: 'Database error: ' + updateErr1.message });
      }

      if (updateResult1.affectedRows === 0) {
        console.error(`No record updated in student_school_year for student ID: ${student_id} and school_year_id: ${school_year_id}`);
        return res.status(404).json({ error: 'No matching record found in student_school_year' });
      }

      console.log(`student_school_year status updated to 'pending' for student ID: ${student_id}`);

      // Step 2: Update the status in the enrollment table to 'pending'
      const queryUpdateEnrollment = `
        UPDATE enrollment SET enrollment_status = 'pending' WHERE student_id = ? AND school_year_id = ?;
      `;
      const updateValues2 = [student_id, school_year_id];

      db.query(queryUpdateEnrollment, updateValues2, (updateErr2, updateResult2) => {
        if (updateErr2) {
          console.error('Error updating enrollment status:', updateErr2.message);
          return res.status(500).json({ error: 'Database error: ' + updateErr2.message });
        }

        if (updateResult2.affectedRows === 0) {
          console.error(`No record updated in enrollment for student ID: ${student_id} and school_year_id: ${school_year_id}`);
          return res.status(404).json({ error: 'No matching record found in enrollment' });
        }

        console.log(`Enrollment status updated to 'pending' for student ID: ${student_id}`);
        res.status(200).json({
          message: 'Enrollment status updated to pending successfully',
          status: 'pending'  // Add this field
        });
      });
    });
  });
});

// ENDPOINT USED:
// STUDENT ENROLLMENT PAGE
app.post('/enroll-elective', (req, res) => {
  const { userId, studentId, electiveId, grade_level, section_id } = req.body;

  // Validate required fields
  if (!studentId || !electiveId || !grade_level) {
    return res.status(400).json({ error: 'Missing required fields.' });
  }

  const getActiveSchoolYearQuery = `SELECT school_year_id FROM school_year WHERE status = 'active' LIMIT 1`;

  db.query(getActiveSchoolYearQuery, (err, schoolYearResult) => {
    if (err) {
      console.error('Error fetching active school year:', err);
      return res.status(500).json({ error: 'Failed to fetch active school year', details: err.message });
    }

    if (schoolYearResult.length === 0) {
      return res.status(400).json({ error: 'No active school year found' });
    }

    const school_year_id = schoolYearResult[0].school_year_id;

    // Check if the student is already enrolled in the elective
    const checkEnrollmentQuery = `SELECT * FROM student_elective WHERE student_id = ? AND elective_id = ?`;

    db.query(checkEnrollmentQuery, [studentId, electiveId], (err, existing) => {
      if (err) {
        console.error('Error checking existing enrollment:', err);
        return res.status(500).json({ error: 'Database error' });
      }

      if (existing.length > 0) {
        return res.status(400).json({ error: 'Student is already enrolled in this elective.' });
      }

      // Insert the elective enrollment
      const enrollQuery = `
        INSERT INTO student_elective 
        (user_id, student_id, elective_id, enrollment_status, grade_level, school_year_id, section_id)
        VALUES (?, ?, ?, 'pending', ?, ?, ?);
      `;

      db.query(enrollQuery, [userId, studentId, electiveId, grade_level, school_year_id, section_id], (err, result) => {
        if (err) {
          console.error('Error enrolling in elective:', err);
          return res.status(500).json({ error: 'Database error' });
        }

        res.status(200).json({ message: 'Elective enrollment request submitted successfully.' });
      });
    });
  });
});






// New endpoint to get students without enrollment status
app.get('/unregistered-students', (req, res) => {
  const query = `
    SELECT s.student_id, s.lastname, s.firstname, s.middlename, s.current_yr_lvl, s.birthdate, s.gender, s.age, 
    s.home_address, s.barangay, s.city_municipality, s.province, s.contact_number, s.email_address, 
    s.mother_name, s.father_name, s.parent_address, s.father_occupation, s.mother_occupation, 
    s.annual_hshld_income, s.number_of_siblings, s.father_educ_lvl, s.mother_educ_lvl, 
    s.father_contact_number, s.mother_contact_number, bd.brigada_status AS brigada_eskwela,
    FROM student s 
    LEFT JOIN student_school_year ss ON s.student_id = ss.student_id 
    LEFT JOIN enrollment b ON s.student_id = b.student_id
    LEFT JOIN school_year sy ON ss.school_year_id = sy.school_year_id 
    LEFT JOIN brigada_details bd ON s.brigada_id=bd.brigada_id
    WHERE b.enrollment_status IS NULL
  `;

  db.query(query, (err, results) => {
    if (err) {
      console.error('Error fetching unregistered students:', err);
      return res.status(500).json({ error: 'Failed to fetch unregistered students' });
    }

    res.json(results);
  });
});

// New endpoint to get all student names for auto-suggest
// Endpoint to get student names for auto-suggest
app.get('/students/names', (req, res) => {
  const { searchTerm, gradeLevel, sectionName, lrn } = req.query;

  // Start with base query
  let query = `
    SELECT CONCAT(a.lastname, ', ', a.firstname, ' ', IFNULL(a.middlename, '')) AS stud_name, a.lrn 
    FROM student a
    LEFT JOIN section b ON a.section_id = b.section_id
    WHERE 1=1
  `;

  const queryParams = [];

  // Optional filters
  if (gradeLevel) {
    query += ' AND a.current_yr_lvl = ?';
    queryParams.push(gradeLevel);
  }

  if (sectionName) {
    query += ' AND b.section_name = ?';
    queryParams.push(sectionName);
  }

  if (lrn) {
    query += ' AND a.lrn = ?';
    queryParams.push(lrn);
  }

  if (searchTerm) {
    query += ' AND (a.firstname LIKE ? OR a.lastname LIKE ?)';
    queryParams.push(`%${searchTerm}%`, `%${searchTerm}%`);
  }

  // Execute the query
  db.query(query, queryParams, (err, results) => {
    if (err) {
      console.error('Error fetching student names:', err);
      return res.status(500).json({ error: 'Internal server error' });
    }
    res.json(results);
  });
});



app.get('/sections-report', async (req, res) => {
  const gradeLevel = req.query.gradeLevel;

  // Check if gradeLevel is provided
  if (!gradeLevel) {
    return res.status(400).json({ error: 'Grade level is required' });
  }

  try {
    console.log(`Fetching sections for grade level: ${gradeLevel}`); // Log the incoming gradeLevel

    // Execute the query
    db.query('SELECT * FROM section WHERE grade_level = ?', [gradeLevel], (err, results) => {
      if (err) {
        console.error('Error fetching sections:', err);
        return res.status(500).json({ error: 'Internal server error' });
      }

      // Check if results is an array
      if (!Array.isArray(results)) {
        console.error('Unexpected result format:', results);
        return res.status(500).json({ error: 'Unexpected result format' });
      }

      // Now it's safe to iterate over results
      results.forEach(section => {
        // Process each section
      });

      res.json(results); // Send the results back to the client
    });
  } catch (error) {
    console.error('Error fetching sections:', error);
    res.status(500).json({ error: 'Failed to fetch sections' });
  }
});

app.get(`/api/student/details`, (req, res) => {
  const { firstName, lastName } = req.query;

  const query = `
    SELECT 
      a.student_id, 
      CONCAT(a.firstname, ' ', IFNULL(a.middlename, ''), ' ', a.lastname) AS stud_name, 
      a.age, 
      a.gender, 
      CONCAT('Grade',' ', a.current_yr_lvl, ' - ', b.section_name) AS grade_section, 
      d.school_year,
      a.lrn,
      a.home_address, a.barangay, a.city_municipality, a.province,
      DATE_FORMAT(a.birthdate, '%M %e, %Y') AS birthdate
    FROM student a
    LEFT JOIN section b ON a.section_id = b.section_id
    LEFT JOIN student_school_year c ON a.student_id = c.student_id
    LEFT JOIN school_year d ON c.school_year_id = d.school_year_id
    WHERE (a.firstname LIKE ? OR a.lastname LIKE ?)
  `;

  db.query(query, [`%${firstName}%`, `%${lastName}%`], (err, results) => {
    if (err) {
      console.error("Error querying the database:", err);
      return res.status(500).send("Database query error");
    }
    res.json(results);
  });
});

app.get('/api/subjects-card', (req, res) => {
  const { studentId, gradeLevel, schoolYearId } = req.query;

  console.log('Subjects-card API called with:', { studentId, gradeLevel, schoolYearId });

  if (!studentId || !gradeLevel || !schoolYearId) {
    console.error('Missing required parameters');
    return res.status(400).json({ error: 'Student ID, Grade Level, and School Year ID are required' });
  }

  const getSectionQuery = `SELECT section_id FROM student WHERE student_id = ?`;

  db.query(getSectionQuery, [studentId], (err, sectionResult) => {
    if (err) {
      console.error('Error fetching section_id:', err);
      return res.status(500).json({ error: 'Failed to get student section_id' });
    }

    // If student has no section, we'll still try to fetch subjects for their grade level
    const sectionId = sectionResult.length > 0 ? sectionResult[0].section_id : null;
    console.log(`Student ${studentId} section_id: ${sectionId || 'Not assigned'}`);

    // If no section assigned, get subjects for the grade level without section filter
    if (!sectionId) {
      console.log('Fetching subjects without section filter');
      const gradeSubjectsQuery = `
        SELECT 
          s.subject_name,
          s.grade_level
        FROM subject s
        WHERE s.status = 'active'
          AND s.elective = 'N'
          AND s.grade_level = ?
          AND s.school_year_id = ?
        ORDER BY subject_name;
      `;

      db.query(gradeSubjectsQuery, [gradeLevel, schoolYearId], (err, results) => {
        if (err) {
          console.error('Error querying the database:', err);
          return res.status(500).json({ error: 'Database query error' });
        }

        console.log(`Found ${results.length} subjects for student without section`);
        res.json(results);
      });
      return;
    }

    // For students with sections, use the original query
    const QUERY = `
      SELECT 
        s.subject_name,
        s.grade_level
      FROM subject s
      JOIN enrollment st ON s.grade_level = st.grade_level 
                        AND s.school_year_id = st.school_year_id
                        AND st.student_id = ?
                        AND st.section_id = ?
      WHERE s.status = 'active'
        AND s.elective = 'N'
        AND s.grade_level = ?
        AND s.school_year_id = ?

      UNION

      SELECT 
        s.subject_name,
        s.grade_level
      FROM subject s
      JOIN student_elective se ON s.subject_id = se.elective_id
      JOIN enrollment st ON se.section_id = st.section_id
      WHERE s.status = 'active'
        AND s.elective = 'Y'
        AND se.student_id = ?
        AND se.enrollment_status = 'approved'
        AND s.school_year_id = ?
        AND st.section_id = ?
      ORDER BY subject_name;
    `;

    const params = [
      studentId, sectionId, gradeLevel, schoolYearId,  // For regular subjects
      studentId, schoolYearId, sectionId               // For electives
    ];

    db.query(QUERY, params, (err, results) => {
      if (err) {
        console.error('Error querying the database:', err);
        return res.status(500).json({ error: 'Database query error' });
      }

      console.log(`Found ${results.length} subjects for student with section ${sectionId}`);
      res.json(results);
    });
  });
});



// Backend: Fetch grades for all subjects and periods for a student
app.get('/api/grades', (req, res) => {
  const { studentId, gradeLevel, schoolYearId, section_id } = req.query; // Extract query parameters
  
  console.log('Grades API called with:', { studentId, gradeLevel, schoolYearId, section_id });

  // Validate required parameters
  if (!studentId || !gradeLevel || !schoolYearId) {
    console.error('Missing required parameters');
    return res.status(400).json({ 
      success: false, 
      message: 'Student ID, Grade Level, and School Year ID are required.' 
    });
  }

  // For students without a section, we adjust the query
  let query;
  let queryParams;

  if (!section_id) {
    console.log('No section_id provided, fetching grades without section filter');
    query = `
      SELECT subject_name, 
        MAX(CASE WHEN period = 1 THEN grade ELSE NULL END) AS q1,
        MAX(CASE WHEN period = 2 THEN grade ELSE NULL END) AS q2,
        MAX(CASE WHEN period = 3 THEN grade ELSE NULL END) AS q3,
        MAX(CASE WHEN period = 4 THEN grade ELSE NULL END) AS q4
      FROM grades
      WHERE student_id = ? AND grade_level = ? AND school_year_id = ? AND (section_id IS NULL OR section_id = 0)
      GROUP BY subject_name;
    `;
    queryParams = [studentId, gradeLevel, schoolYearId];
  } else {
    console.log('Fetching grades with section filter, section_id:', section_id);
    query = `
      SELECT subject_name, 
        MAX(CASE WHEN period = 1 THEN grade ELSE NULL END) AS q1,
        MAX(CASE WHEN period = 2 THEN grade ELSE NULL END) AS q2,
        MAX(CASE WHEN period = 3 THEN grade ELSE NULL END) AS q3,
        MAX(CASE WHEN period = 4 THEN grade ELSE NULL END) AS q4
      FROM grades
      WHERE student_id = ? AND grade_level = ? AND school_year_id = ? AND section_id = ?
      GROUP BY subject_name;
    `;
    queryParams = [studentId, gradeLevel, schoolYearId, section_id];
  }

  db.query(query, queryParams, (err, results) => {
    if (err) {
      console.error('Error fetching grades:', err);
      return res.status(500).json({ success: false, message: 'Failed to fetch grades.' });
    }

    console.log('Grades fetched successfully, count:', results.length);
    
    // Return success even if there are no results
    res.json({ success: true, grades: results });
  });
});




// Endpoint to fetch sections for select section filter
// Function: Retrieves sections for filtering in various pages
// Pages: StudentsPage.js, GradesPage.js, AttendancePage.js
// Filters: SectionListSearchFilter.js, SectionSearchFilter.js, SearchFilter.js
app.get('/api/sections', (req, res) => {
  const query = 'SELECT section_id, section_name FROM section';
  db.query(query, (err, results) => {
    if (err) {
      console.error('Error fetching sections:', err);
      res.status(500).json({ error: 'Internal server error' });
      return;
    }
    res.json(results);
  });
});

// Endpoint to fetch positions
// Function: Retrieves distinct positions from the employee table
// Pages: EmployeeSearchFilter.js
app.get('/api/positions', (req, res) => {
  const query = 'SELECT DISTINCT role_name FROM employee';
  db.query(query, (err, results) => {
    if (err) {
      console.error('Error fetching positions:', err);
      res.status(500).json({ error: 'Internal server error' });
      return;
    }
    res.json(results.map(role => role.role_name));
  });
});

// Endpoint to fetch departments
// Function: Retrieves distinct departments from the employee table
// Pages: EmployeePage.js
app.get('/api/departments', (req, res) => {
  const query = 'SELECT DISTINCT department FROM employee';
  db.query(query, (err, results) => {
    if (err) {
      console.error('Error fetching departments:', err);
      res.status(500).json({ error: 'Internal server error' });
      return;
    }
    res.json(results.map(department => department.department));
  });
});

// Fetch filter options for school year and grades
// Function: Retrieves filter options for school years, grades, and sections
// Pages: SchoolYearPage.js, SearchFilter.js
// Filters: SectionListSearchFilter.js, SectionSearchFilter.js
app.get('/filters', (req, res) => {
  const filters = {
    schoolYears: [],
    grades: ['7', '8', '9', '10'],
    sections: []
  };

  const sqlSchoolYears = 'SELECT DISTINCT current_yr_lvl AS year FROM student ORDER BY current_yr_lvl';

  db.query(sqlSchoolYears, (err, result) => {
    if (err) {
      console.error('Error fetching school years:', err);
      res.status(500).send(err);
      return;
    } else {
      filters.schoolYears = result;

      const sqlSections = 'SELECT * FROM section';
      db.query(sqlSections, (err, result) => {
        if (err) {
          console.error('Error fetching sections:', err);
          res.status(500).send(err);
          return;
        } else {
          filters.sections = result;
          res.send(filters);
        }
      });
    }
  });
});

// ENDPOINT FOR ATTENDANCE PAGE
app.get('/attendance/:studentId', (req, res) => {
  const studentId = req.params.studentId;
  const query = `
    SELECT 
      s.subject_name,
      COUNT(CASE WHEN a.status = 'P' THEN 1 END) as days_present,
      COUNT(CASE WHEN a.status = 'A' THEN 1 END) as days_absent,
      COUNT(*) as total_days,
      sy.school_year,
      MAX(CASE WHEN a.status = 'B' THEN 'Yes' ELSE 'No' END) as brigada_attendance
    FROM attendance a
    JOIN enrollment e ON a.enrollment_id = e.enrollment_id
    LEFT JOIN school_year sy ON e.school_year_id = sy.school_year_id
    JOIN subject s ON a.subject_id = s.subject_id
    WHERE e.student_id = ?
    GROUP BY s.subject_name, sy.school_year
  `;

  db.query(query, [studentId], (err, results) => {
    if (err) {
      console.error('Error fetching attendance data:', err);
      res.status(500).send('Error fetching attendance data');
      return;
    }
    if (results.length === 0) {
      res.status(404).send('Attendance data not found');
      return;
    }

    res.json(results);
  });
});

// Get student attendance summary for teacher page
app.get('/student-attendance-summary/:studentId', (req, res) => {
  const studentId = req.params.studentId;
  const schoolYearId = req.query.schoolYearId;

  // First, get the section ID for this student
  const getSectionQuery = `
    SELECT section_id 
    FROM student 
    WHERE student_id = ?
  `;

  db.query(getSectionQuery, [studentId], (err, sectionResult) => {
    if (err) {
      console.error('Error fetching student section:', err);
      return res.status(500).json({ 
        success: false, 
        error: 'Database error', 
        details: err.message 
      });
    }

    if (sectionResult.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Student not found'
      });
    }

    const sectionId = sectionResult[0].section_id;

    // Build the query to get attendance summary with proper counts
    // Using nested subqueries instead of CTEs for compatibility with older MySQL versions
    const query = `
      SELECT 
        sd.subject_name AS subject,
        IFNULL(sa.total_days_present, 0) AS totalDaysPresent,
        (sd.total_days_of_classes - IFNULL(sa.total_days_present, 0)) AS totalDaysAbsent,
        sd.total_days_of_classes AS totalDaysOfClasses
      FROM (
        -- SubjectDays: Get all distinct days when attendance was recorded for this section and subject
        SELECT 
          s.subject_id,
          s.subject_name,
          COUNT(DISTINCT a.date) AS total_days_of_classes
        FROM attendance a
        JOIN schedule sch ON a.schedule_id = sch.schedule_id
        JOIN subject s ON sch.subject_id = s.subject_id
        JOIN student st ON a.student_id = st.student_id
        WHERE st.section_id = ?
        ${schoolYearId ? 'AND a.school_year_id = ?' : ''}
        GROUP BY s.subject_id, s.subject_name
      ) AS sd
      LEFT JOIN (
        -- StudentAttendance: Get this student's attendance records
        SELECT 
          s.subject_id,
          COUNT(CASE WHEN a.status = 'P' OR a.status = 'L' THEN 1 END) AS total_days_present
        FROM attendance a
        JOIN schedule sch ON a.schedule_id = sch.schedule_id
        JOIN subject s ON sch.subject_id = s.subject_id
        WHERE a.student_id = ?
        ${schoolYearId ? 'AND a.school_year_id = ?' : ''}
        GROUP BY s.subject_id
      ) AS sa ON sd.subject_id = sa.subject_id
      ORDER BY sd.subject_name
    `;

    // Prepare the query parameters based on whether schoolYearId is provided
    const queryParams = schoolYearId 
      ? [sectionId, schoolYearId, studentId, schoolYearId]
      : [sectionId, studentId];

    console.log('Executing query:', query);
    console.log('With params:', queryParams);

    db.query(query, queryParams, (err, results) => {
      if (err) {
        console.error('Error fetching student attendance summary:', err);
        return res.status(500).json({ 
          success: false, 
          error: 'Database error', 
          details: err.message 
        });
      }

      // If no results found, return empty array
      if (results.length === 0) {
        console.log(`No attendance records found for student ID: ${studentId}`);
      }
      
      res.json(results);
    });
  });
});

// Fetch school years
// Function: Retrieves all school years in descending order
// Pages: SchoolYearSearchFilter.js, SearchFilter.js
app.get('/api/school_years', (req, res) => {
  const query = 'SELECT school_year, school_year_id FROM school_year ORDER BY school_year DESC';
  db.query(query, (err, results) => {
    if (err) {
      console.error('Error fetching school years:', err);
      res.status(500).send('Error fetching school years');
      return;
    }
    res.json(results);
  });
});

// Endpoint to fetch the current school year
// Function: Retrieves the current active school year
// Pages: SchoolYearPage.js
app.get('/current-school-year', (req, res) => {
  const query = `
    SELECT school_year, school_year_id
    FROM school_year 
    WHERE status = 'active' 
    LIMIT 1
  `;
  
  db.query(query, (err, results) => {
    if (err) {
      console.error('Error fetching current school year:', err);
      res.status(500).send('Error fetching current school year');
    } else {
      res.json(results[0] || { school_year: 'N/A' });
    }
  });
});

// Endpoint to fetch student details
// Function: Retrieves detailed information about a student based on their student ID
// Pages: StudentDetailPage.js
app.get('/students/:id/details', (req, res) => {
  const studentId = req.params.id;

  const query = `
    SELECT s.student_id, s.lastname, s.firstname, s.middlename, s.current_yr_lvl, s.birthdate, s.gender, s.age,
    s.home_address, s.barangay, s.city_municipality, s.province, s.contact_number, s.email_address,
    s.mother_name, s.father_name, s.parent_address, s.father_occupation, s.mother_occupation, s.annual_hshld_income,
    s.number_of_siblings, s.father_educ_lvl, s.mother_educ_lvl, s.father_contact_number, s.mother_contact_number,
    ss.status, sy.school_year
    FROM student s
    LEFT JOIN student_school_year ss ON s.student_id = ss.student_id
    LEFT JOIN school_year sy ON ss.school_year_id = sy.school_year_id
    WHERE s.student_id = ?
  `;
  db.query(query, [studentId], (err, results) => {
    if (err) {
      console.error('Error fetching student details:', err);
      res.status(500).json({ error: 'Internal server error' });
      return;
    }

    const studentDetails = results.map(result => ({
      studentId: result.student_id,
      lastname: result.lastname,
      firstname: result.firstname,
      middlename: result.middlename,
      currentYearLevel: result.current_yr_lvl,
      birthdate: result.birthdate,
      gender: result.gender,
      age: result.age,
      homeAddress: result.home_address,
      barangay: result.barangay,
      cityMunicipality: result.city_municipality,
      province: result.province,
      contactNumber: result.contact_number,
      emailAddress: result.email_address,
      motherName: result.mother_name,
      fatherName: result.father_name,
      parentAddress: result.parent_address,
      fatherOccupation: result.father_occupation,
      motherOccupation: result.mother_occupation,
      annualHouseholdIncome: result.annual_hshld_income,
      numberOfSiblings: result.number_of_siblings,
      fatherEducationLevel: result.father_educ_lvl,
      motherEducationLevel: result.mother_educ_lvl,
      fatherContactNumber: result.father_contact_number,
      motherContactNumber: result.mother_contact_number,
      status: result.status,
      schoolYear: result.school_year
    }));

    res.json(studentDetails);
  });
});

// ENDPOINT USED:
// TEACHER PAGE
app.get('/employees', (req, res) => {
  const { searchID, status, position, department, searchTerm, showArchive } = req.query;

  let query = `
    SELECT employee.*,  
      CONCAT(employee.lastname, ', ', employee.firstname, ' ', 
        IF(employee.middlename IS NOT NULL AND employee.middlename != '', 
        CONCAT(LEFT(employee.middlename, 1), '.'), '')) AS emp_name
    FROM employee WHERE 1=1
  `;
  const queryParams = [];

  if (status && status !== 'showAll') {
    query += ' AND status = ?';
    queryParams.push(status);
  }

  if (showArchive) {
    query += ' AND archive_status = ?';
    queryParams.push(showArchive);
  }

  if (position) {
    query += ' AND role_name = ?';
    queryParams.push(position);
  }

  if (department) {
    query += ' AND department = ?';
    queryParams.push(department);
  }

  if (searchID) {
    query += ' AND employee_id = ?';
    queryParams.push(searchID);
  }

  if (searchTerm) {
    query += ' AND (firstname LIKE ? OR lastname LIKE ?)';
    queryParams.push(`%${searchTerm}%`, `%${searchTerm}%`);
  }

  query += ' ORDER BY firstname';

  console.log('Final query:', query);
  console.log('With parameters:', queryParams);

  db.query(query, queryParams, (err, results) => {
    if (err) {
      console.error('Error fetching employees:', err);
      res.status(500).json({ error: 'Internal server error' });
      return;
    }
    console.log('Results:', results); // ✅ Check if emp_name exists
    res.json(results);
  });
});



// ENDPOINT USED:
// TEACHER PAGE
app.post('/employees', (req, res) => {
  console.log('Received employee data:', req.body);

  const {
    lastname,
    firstname,
    middlename,
    birthday,
    gender,
    contact_number,
    address,
    year_started,
    role_name,
    email_address
  } = req.body;

  // First, get the role_id based on the role_name
  const getRoleIdQuery = `SELECT role_id FROM roles WHERE role_name = ?`;

  db.query(getRoleIdQuery, [role_name], (roleError, roleResult) => {
    if (roleError) {
      console.error('Failed to retrieve role_id:', roleError);
      return res.status(500).json({ error: 'Failed to retrieve role_id' });
    }

    if (roleResult.length === 0) {
      return res.status(400).json({ error: 'Invalid role_name' });
    }

    const role_id = roleResult[0].role_id;

    // Insert employee details with role_id, birthday, and gender
    const employeeQuery = `
      INSERT INTO employee (
        lastname,
        firstname,
        middlename,
        birthday,
        gender,
        contact_number,
        address,
        year_started,
        role_id,
        role_name,
        status,
        archive_status,
        email_address
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'active', 'unarchive',?)
    `;

    const employeeValues = [
      lastname,
      firstname,
      middlename,
      birthday,
      gender,
      contact_number,
      address,
      year_started,
      role_id,
      role_name,
      email_address
    ];

    db.query(employeeQuery, employeeValues, (employeeError, employeeResult) => {
      if (employeeError) {
        console.error('Failed to add employee:', employeeError);
        return res.status(500).json({ error: 'Failed to add employee' });
      }

      const employeeId = employeeResult.insertId;
      const username = `${lastname.toLowerCase()}.${firstname.toLowerCase().replace(/ /g, '_')}@lnhs.com`;
      const defaultPassword = '1234'; // Default password
      const encryptedPassword = `SHA1('${defaultPassword}')`; // SHA1 encryption (consider bcrypt for security)

      // Insert user account with role_id
      const userQuery = `
        INSERT INTO users (username, password, role_id, role_name, password1)
        VALUES (?, ${defaultPassword}, ?, ?, ${encryptedPassword})
      `;

      const userValues = [username, role_id, role_name];

      db.query(userQuery, userValues, (userError, userResult) => {
        if (userError) {
          console.error('Failed to create user account:', userError);
          return res.status(500).json({ error: 'Failed to create user account' });
        }

        const userId = userResult.insertId;

        // Update the employee table with the user_id
        const updateEmployeeQuery = `
          UPDATE employee SET user_id = ? WHERE employee_id = ?
        `;

        db.query(updateEmployeeQuery, [userId, employeeId], (updateError) => {
          if (updateError) {
            console.error('Failed to update employee with user_id:', updateError);
            return res.status(500).json({ error: 'Failed to update employee user_id' });
          }

          res.status(201).json({
            message: 'Employee and user account added successfully, user_id linked',
            employeeId,
            userId
          });
        });
      });
    });
  });
});






// ENDPOINT USED:
// TEACHER PAGE
app.put('/employees/:employeeId/archive', (req, res) => {
  const { employeeId } = req.params;
  const { status } = req.body;

  console.log('Received status:', status); // Log the status received
  console.log('Employee ID:', employeeId);

  if (!status) {
    return res.status(400).json({ error: 'Status is required.' });
  }

  const query = `
    UPDATE employee
    SET archive_status = 'archived', status = ?
    WHERE employee_id = ?;
  `;

  console.log('Executing query:', query, 'with params:', [status, employeeId]); // Log query details

  db.query(query, [status, employeeId], (err, results) => {
    if (err) {
      console.error('Database error:', err); // Log database errors
      return res.status(500).json({ error: 'Database query failed.' });
    }

    res.status(200).json({ message: 'Employee archived successfully.' });
  });
});

// ENDPOINT USED:
// TEACHER PAGE
app.post('/assign-subject/:teacherId', (req, res) => {
  const teacherId = req.params.teacherId;
  const { subject_id, grade_level, section_id, type, school_year_id } = req.body;

  const insertQuery = `
    INSERT INTO subject_assigned 
    (subject_assigned_id, subject_id, level, section_id, employee_id, elective, school_year_id) 
    VALUES (NULL, ?, ?, ?, ?, ?, ?)
    ON DUPLICATE KEY UPDATE 
      subject_id = VALUES(subject_id),
      level = VALUES(level),
      section_id = VALUES(section_id),
      employee_id = VALUES(employee_id),
      elective = VALUES(elective),
      school_year_id = VALUES(school_year_id)
  `;

  const isElective = type === 'elective' ? 1 : 0;
  const assignedSubjectId = isElective ? subject_id : subject_id;

  // Insert or update subject assignment
  db.query(
    insertQuery,
    [assignedSubjectId, grade_level, section_id, teacherId, isElective, school_year_id],
    (err, result) => {
      if (err) {
        console.error('Error assigning subject:', err);
        return res.status(500).json({ error: 'Internal server error' });
      }

      console.log('Subject assigned successfully');

      // Get user_id from employee table
      const userIdQuery = `SELECT user_id FROM employee WHERE employee_id = ?`;
      db.query(userIdQuery, [teacherId], (err, userResult) => {
        if (err) {
          console.error('Error fetching user ID from employee table:', err);
          return res.status(500).json({ error: 'Internal server error' });
        }

        if (userResult.length === 0) {
          return res.status(404).json({ error: 'User not found for this employee' });
        }

        const userId = userResult[0]?.user_id;

        // Check current role from users table
        const roleQuery = `SELECT role_name FROM users WHERE user_id = ?`;
        db.query(roleQuery, [userId], (err, roleResult) => {
          if (err) {
            console.error('Error fetching role from users table:', err);
            return res.status(500).json({ error: 'Internal server error' });
          }

          const currentRole = roleResult[0]?.role_name;

          // If the role is not already subject_teacher, update other_role_name
          if (currentRole !== 'subject_teacher') {
            const updateRoleQuery = `
              UPDATE users 
              SET other_role_name = 'subject_teacher' 
              WHERE user_id = ?
            `;

            db.query(updateRoleQuery, [userId], (err, updateResult) => {
              if (err) {
                console.error('Error updating role:', err);
                return res.status(500).json({ error: 'Internal server error' });
              }

              return res.json({ message: 'Subject assigned and role updated successfully' });
            });
          } else {
            return res.json({ message: 'Subject assigned successfully' });
          }
        });
      });
    }
  );
});




// ENDPOINT USED:
// TEACHER PAGE
app.post('/assign-section/:teacherId', (req, res) => {
  const teacherId = req.params.teacherId;
  const { section_id, grade_level, school_year_id } = req.body;  // Use section_id instead of section_name
  
  const query = `
    INSERT INTO section_assigned (section_assigned_id, section_id, LEVEL, employee_id, school_year_id) 
    VALUES (NULL, ?, ?, ?, ?)
    ON DUPLICATE KEY UPDATE 
      section_id = VALUES(section_id), 
      LEVEL = VALUES(LEVEL), 
      employee_id = VALUES(employee_id),
      school_year_id =VALUES(school_year_id)
  `;

  db.query(query, [section_id, grade_level, teacherId, school_year_id], (err, result) => {
    if (err) {
      console.error('Error assigning section:', err);
      res.status(500).json({ error: 'Internal server error' });
      return;
    }
    console.log('Section assigned successfully');
    res.json({ message: 'Section assigned successfully' });
  });
});

// ENDPOINT USED:
// TEACHER PAGE
app.post('/assign-grade-level/:teacherId', (req, res) => {
  const teacherId = req.params.teacherId;
  const { grade_level, school_year_id } = req.body;
  
  const query = `
    INSERT INTO grade_level_assigned 
    (grade_level_assigned_id, employee_id, grade_level, school_year_id) 
    VALUES (NULL, ?, ?, ?)
    ON DUPLICATE KEY UPDATE 
      employee_id = VALUES(employee_id),
      grade_level = VALUES(grade_level),
      school_year_id = VALUES(school_year_id)
  `;

  db.query(query, [teacherId, grade_level, school_year_id], (err, result) => {
    if (err) {
      console.error('Error assigning grade level:', err);
      res.status(500).json({ error: 'Internal server error' });
      return;
    }
    console.log('Grade level assigned successfully');
    res.json({ message: 'Grade level assigned successfully' });
  });
});

// ENDPOINT USED:
// TEACHER PAGE
app.get('/teacher-subjects/:teacherId', (req, res) => {
  const teacherId = req.params.teacherId;
  const schoolYearId = req.query.school_year_id; // Get school_year_id from query parameters

  const query = `
    SELECT CONCAT('Grade ', c.grade_level) AS grade_level, 
    CASE WHEN a.elective = 1 THEN d.name  
    ELSE b.subject_name END AS subject_name,
    c.section_name, REPLACE(REPLACE(REPLACE(REPLACE(a.day, '[', ''), ']', ''), '"', ''), ',', ', ') AS day,
    CONCAT(a.time_start,' - ', a.time_end) AS time
    FROM SCHEDULE a 
    LEFT JOIN SUBJECT b ON a.subject_id = b.subject_id
    LEFT JOIN elective d ON a.subject_id = d.elective_id
    LEFT JOIN section c ON a.section_id = c.section_id
    WHERE a.teacher_id = ? AND a.schedule_status = 'Approved' AND a.school_year_id = ?
  `;

  db.query(query, [teacherId, schoolYearId], (err, results) => {
    if (err) {
      console.error('Error fetching assigned subjects:', err);
      return res.status(500).json({ error: 'Internal server error' });
    }
    res.json(results);
  });
});

// ENDPOINT USED:
// TEACHER PAGE
app.get('/teacher-grade-level/:teacherId', (req, res) => {
  const teacherId = req.params.teacherId;
  const schoolYearId = req.query.school_year_id; // Get school_year_id from query parameters

  const query = `
    SELECT CONCAT('Grade ', grade_level) AS grade_level 
    FROM grade_level_assigned 
    WHERE employee_id = ? AND school_year_id = ?
  `;

  db.query(query, [teacherId, schoolYearId], (err, results) => {
    if (err) {
      console.error('Error fetching assigned grade levels:', err);
      return res.status(500).json({ error: 'Internal server error' });
    }
    res.json(results);
  });
});

// ENDPOINT USED:
// SCHEDULE MANAGEMENT PAGE
app.get('/coordinator-grade-level/:userId', (req, res) => {
  const userId = req.params.userId;
  
  // First, get the employee_id from the user_id
  const employeeQuery = `
    SELECT employee_id FROM employee WHERE user_id = ?
  `;
  
  db.query(employeeQuery, [userId], (err, employeeResults) => {
    if (err) {
      console.error('Error fetching employee ID:', err);
      return res.status(500).json({ error: 'Internal server error' });
    }
    
    if (employeeResults.length === 0) {
      return res.status(404).json({ error: 'Employee not found' });
    }
    
    const employeeId = employeeResults[0].employee_id;
    
    // Get the active school year
    const schoolYearQuery = `SELECT school_year_id FROM school_year WHERE status = 'active'`;
    
    db.query(schoolYearQuery, (err, schoolYearResults) => {
      if (err) {
        console.error('Error fetching active school year:', err);
        return res.status(500).json({ error: 'Internal server error' });
      }
      
      if (schoolYearResults.length === 0) {
        return res.status(404).json({ error: 'No active school year found' });
      }
      
      const schoolYearId = schoolYearResults[0].school_year_id;
      
      // Get the grade level assigned to this coordinator for the active school year
      const query = `
        SELECT grade_level 
        FROM grade_level_assigned 
        WHERE employee_id = ? AND school_year_id = ?
      `;
      
      db.query(query, [employeeId, schoolYearId], (err, results) => {
        if (err) {
          console.error('Error fetching coordinator grade level:', err);
          return res.status(500).json({ error: 'Internal server error' });
        }
        
        if (results.length === 0) {
          return res.json({ gradeLevel: null });
        }
        
        res.json({ gradeLevel: results[0].grade_level });
      });
    });
  });
});

app.get('/subject-assigned/:teacherId', (req, res) => {
  const teacherId = req.params.teacherId;
  const schoolYearId = req.query.school_year_id; // Get school_year_id from query parameters

  const query = `
    SELECT a.level as grade_level, b.subject_name, c.section_name 
    FROM subject_assigned a LEFT JOIN SUBJECT b ON a.subject_id=b.subject_id 
    LEFT JOIN section c ON a.section_id=c.section_id 
    WHERE a.employee_id= ? AND a.school_year_id= ? 
  `;

  db.query(query, [teacherId, schoolYearId], (err, results) => {
    if (err) {
      console.error('Error fetching assigned subjects:', err);
      return res.status(500).json({ error: 'Internal server error' });
    }
    res.json(results);
  });
});


// ENDPOINT USED:
// TEACHER PAGE
app.get('/teacher-section/:teacherId', (req, res) => {
  const teacherId = req.params.teacherId;
  const schoolYearId = req.query.school_year_id; // Get school_year_id from query parameters

  const query = `
    SELECT b.section_name, CONCAT('Grade ', a.level) AS grade_level
    FROM section_assigned a
    LEFT JOIN section b ON a.section_id = b.section_id
    WHERE a.employee_id = ? AND a.school_year_id = ?
  `;

  db.query(query, [teacherId, schoolYearId], (err, results) => {
    if (err) {
      console.error('Error fetching assigned sections:', err);
      return res.status(500).json({ error: 'Internal server error' });
    }
    res.json(results);
  });
});


// Endpoint to fetch employee details by ID
// Function: Fetches detailed information about an employee based on their employee ID
// Pages: EmployeePage.js
app.put('/employees/:employeeId', (req, res) => {
  const { employeeId } = req.params;
  let updatedEmployee = req.body;

  // Convert birthday to YYYY-MM-DD format
  if (updatedEmployee.birthday) {
    const date = new Date(updatedEmployee.birthday);
    updatedEmployee.birthday = date.toISOString().split('T')[0];
  }

  console.log(`Updating employee with ID: ${employeeId}`, updatedEmployee);

  // Step 1: Fetch role_id from roles table
  const roleQuery = 'SELECT role_id FROM roles WHERE role_name = ?';
  db.query(roleQuery, [updatedEmployee.role_name], (err, roleResults) => {
    if (err) {
      console.error('Error fetching role ID:', err);
      return res.status(500).json({ error: 'Internal server error' });
    }

    if (roleResults.length === 0) {
      console.error('Role not found:', updatedEmployee.role_name);
      return res.status(404).json({ error: 'Role not found' });
    }

    const roleId = roleResults[0].role_id;
    updatedEmployee.role_id = roleId;

    // Step 2: Fetch user_id from employee table
    const fetchUserIdQuery = 'SELECT user_id FROM employee WHERE employee_id = ?';
    db.query(fetchUserIdQuery, [employeeId], (err, userResults) => {
      if (err) {
        console.error('Error fetching user ID:', err);
        return res.status(500).json({ error: 'Internal server error' });
      }

      if (userResults.length === 0) {
        console.error(`No user_id found for employee_id: ${employeeId}`);
        return res.status(404).json({ error: 'No user found for this employee' });
      }

      const userId = userResults[0].user_id;

      // Step 3: Update employee table
      const updateEmployeeQuery = 'UPDATE employee SET ? WHERE employee_id = ?';
      db.query(updateEmployeeQuery, [updatedEmployee, employeeId], (err, results) => {
        if (err) {
          console.error('Error updating employee details:', err);
          return res.status(500).json({ error: 'Internal server error' });
        }

        if (results.affectedRows === 0) {
          console.error(`Employee with ID ${employeeId} not found`);
          return res.status(404).json({ error: 'Employee not found' });
        }

        console.log(`Employee with ID ${employeeId} updated successfully`);

        // Step 4: Update users table
        const updateUserQuery = 'UPDATE users SET role_id = ?, role_name = ? WHERE user_id = ?';
        db.query(updateUserQuery, [roleId, updatedEmployee.role_name, userId], (err, userUpdateResults) => {
          if (err) {
            console.error('Error updating user role:', err);
            return res.status(500).json({ error: 'Internal server error while updating user role' });
          }

          if (userUpdateResults.affectedRows === 0) {
            console.error(`User with ID ${userId} not found`);
            return res.status(404).json({ error: 'User not found' });
          }

          console.log(`User role updated for user_id: ${userId}`);
          return res.json({ message: 'Employee and user role updated successfully' });
        });
      });
    });
  });
});





// Endpoint to unarchive an employee
// Function: Unarchives an employee by updating their status to active and archive status to unarchive
// Pages: EmployeePage.js
app.put('/employees/:employeeId/unarchive', (req, res) => {
  const { employeeId } = req.params;
  const query = 'UPDATE employee SET archive_status = "unarchive", status = "active" WHERE employee_id = ?';
  db.query(query, [employeeId], (err, results) => {
    if (err) {
      console.error('Error unarchiving employee:', err);
      res.status(500).json({ error: 'Internal server error' });
      return;
    }
    if (results.affectedRows > 0) {
      res.json({ message: 'Employee unarchived and set to active successfully' });
    } else {
      res.status(404).json({ error: 'Employee not found' });
    }
  });
});

// ENDPOINT USED:
// TEACHER PAGE
app.get('/roles', (req, res) => {
  const query = `
    SELECT role_id, role_name, role_description 
    FROM roles 
    WHERE role_name != 'student'
    ORDER BY role_name
  `;

  db.query(query, (error, results) => {
    if (error) {
      console.error('Error fetching roles:', error);
      return res.status(500).json({ error: 'Failed to fetch roles' });
    }
    
    // Log the results to verify the data structure
    console.log('Roles being sent:', results);
    
    // Ensure we're sending an array
    res.json(Array.isArray(results) ? results : []);
  });
});

// ENDPOINT USED:
// SCHOOL_YEAR PAGE
// SECTION PAGE
app.get('/school-years', (req, res) => {
  const { searchTerm, school_year } = req.query;

  let query = 'SELECT * FROM school_year';
  const queryParams = [];

  if (searchTerm || school_year) {
    query += ' WHERE';
    if (searchTerm) {
      query += ' school_year LIKE ?';
      queryParams.push(`%${searchTerm}%`);
    }
    if (school_year) {
      if (searchTerm) query += ' AND';
      query += ' school_year = ?';
      queryParams.push(school_year);
    }
  }

  console.log('Query:', query);
  console.log('QueryParams:', queryParams);

  db.query(query, queryParams, (err, result) => {
    if (err) {
      console.error('Error fetching school years:', err); // Detailed error logging
      res.status(500).send({ error: 'Error fetching school years', details: err.message });
    } else {
      console.log('Result:', result);
      res.send(result);
    }
  });
});

app.get('/school-years-assign', (req, res) => {
  const { searchTerm, school_year } = req.query;

  let query = 'SELECT * FROM school_year';
  const queryParams = [];

  console.log('Query:', query);
  console.log('QueryParams:', queryParams);

  db.query(query, queryParams, (err, result) => {
    if (err) {
      console.error('Error fetching school years:', err); // Detailed error logging
      res.status(500).send({ error: 'Error fetching school years', details: err.message });
    } else {
      console.log('Result:', result);
      res.send(result);
    }
  });
});

// ENDPOINT FOR SCHOOL_YEAR PAGE
app.get('/school-years/:id', (req, res) => {
  const { id } = req.params;
  const query = 'SELECT * FROM school_year WHERE school_year_id = ?';
  db.query(query, [id], (err, result) => {
    if (err) {
      console.error('Error fetching school year details:', err); // Detailed error logging
      res.status(500).send({ error: 'Error fetching school year details', details: err.message });
    } else {
      res.send(result);
    }
  });
});

// ENDPOINT FOR SCHOOL_YEAR PAGE
app.post('/school-years', (req, res) => {
  const { school_year, school_year_start, school_year_end, enrollment_start, enrollment_end, status } = req.body;
  const query = 'INSERT INTO school_year (school_year, school_year_start, school_year_end, enrollment_start, enrollment_end, status) VALUES (?, ?, ?, ?, ?, ?)';
  
  db.query(query, [school_year, school_year_start, school_year_end, enrollment_start, enrollment_end, status], (err, result) => {
    if (err) {
      console.error('Error adding school year:', err);
      res.status(500).send({ error: 'Error adding school year', details: err.message });
    } else {
      res.status(201).send({ message: 'School year added successfully' });
    }
  });
});

// ENDPOINT FOR SCHOOL_YEAR PAGE
app.put('/school-years/:schoolYearId', (req, res) => {
  const { schoolYearId } = req.params;
  const updatedSchoolYear = req.body;

  const query = 'UPDATE school_year SET ? WHERE school_year_id = ?';
  db.query(query, [updatedSchoolYear, schoolYearId], (err, results) => {
    if (err) {
      console.error('Error updating school year details:', err);
      res.status(500).json({ error: 'Internal server error' });
      return;
    }
    if (results.affectedRows > 0) {
      res.json({ message: 'School year updated successfully' });
    } else {
      res.status(404).json({ error: 'School year not found' });
    }
  });
});

// ENDPOINTS USED:
// SECTION_lIST PAGE
// SECTION PAGE
// SCHEDULE PAGE
app.get('/sections', (req, res) => {
  const { searchTerm, grade, showArchive } = req.query;
  let query = `
    SELECT s.section_id, s.section_name, s.grade_level, s.status, s.max_capacity, sy.school_year, s.archive_status, s.room_number,
    MAX(CASE WHEN b.section_id IS NOT NULL THEN '1' ELSE '0' END) AS hasSched
    FROM section s
    JOIN school_year sy ON s.school_year_id = sy.school_year_id
    LEFT JOIN schedule b on s.section_id=b.section_id and s.grade_level=b.grade_level
    WHERE sy.status = 'active' GROUP BY s.section_name, s.grade_level
  `;
  const queryParams = [];

  if (searchTerm) {
    query += ' AND s.section_name LIKE ?';
    queryParams.push(`%${searchTerm}%`);
  }

  if (grade) {
    query += ' AND s.grade_level = ?';
    queryParams.push(grade);
  }

  if (showArchive) {
    query += ' AND s.archive_status = ?';
    queryParams.push(showArchive);
  }

  db.query(query, queryParams, (err, results) => {
    if (err) {
      console.error('Error fetching sections:', err);
      res.status(500).json({ error: 'Internal server error' });
      return;
    }
    res.json(results);
  });
});

app.get('/sections/active', (req, res) => {
  const { searchTerm, grade, showArchive } = req.query;
  let query = `
    SELECT s.section_id, s.section_name, s.grade_level, s.status, s.max_capacity, sy.school_year, s.archive_status, s.room_number,
    MAX(CASE WHEN b.section_id IS NOT NULL THEN '1' ELSE '0' END) AS hasSched
    FROM section s
    JOIN school_year sy ON s.school_year_id = sy.school_year_id
    LEFT JOIN schedule b on s.section_id=b.section_id and s.grade_level=b.grade_level
    WHERE sy.status = 'active' and s.status='active' GROUP BY s.section_name, s.grade_level
  `;
  const queryParams = [];

  if (searchTerm) {
    query += ' AND s.section_name LIKE ?';
    queryParams.push(`%${searchTerm}%`);
  }

  if (grade) {
    query += ' AND s.grade_level = ?';
    queryParams.push(grade);
  }

  if (showArchive) {
    query += ' AND s.archive_status = ?';
    queryParams.push(showArchive);
  }

  db.query(query, queryParams, (err, results) => {
    if (err) {
      console.error('Error fetching sections:', err);
      res.status(500).json({ error: 'Internal server error' });
      return;
    }
    res.json(results);
  });
});

// ENDPOINT USED:
// SECTION_LST PAGE
// SECTION PAGE
app.get('/sections/:id', (req, res) => {
  const { id } = req.params;
  const query = `
    SELECT s.section_id, s.section_name, s.grade_level, s.status, s.max_capacity, sy.school_year, s.room_number, s.archive_status
    FROM section s
    JOIN school_year sy ON s.school_year_id = sy.school_year_id
    WHERE s.section_id = ?
  `;
  db.query(query, [id], (err, result) => {
    if (err) {
      console.error('Error fetching section details:', err); // Detailed error logging
      res.status(500).json({ error: 'Internal server error' });
      return;
    }
    if (result.length === 0) {
      res.status(404).json({ error: 'Section not found' });
    } else {
      res.json(result[0]);
    }
  });
});

// ENDPOINT USED:
// SECTION_LIST PAGE
app.get('/sections/:id/students', (req, res) => {
  const { id } = req.params;
  const sql = 'SELECT * FROM student WHERE section_id = ?';
  db.query(sql, [id], (err, result) => {
    if (err) {
      console.error('Error fetching students:', err); // Detailed error logging
      return res.status(500).send({ error: 'Error fetching students', details: err.message });
    }
    console.log('Fetched students:', result); // Log the fetched students
    const boys = result.filter(student => student.gender === 'Male');
    const girls = result.filter(student => student.gender === 'Female');
    res.json({ boys, girls });
  });
});

// ENDPOINT USED:
// SECTION PAGE
app.put('/sections/:sectionId/archive', (req, res) => {
  const { sectionId } = req.params;
  const { status, archive_status } = req.body;
  const query = 'UPDATE section SET status = ?, archive_status = ? WHERE section_id = ?';
  db.query(query, [status, archive_status, sectionId], (err, results) => {
    if (err) {
      console.error('Error archiving section:', err);
      res.status(500).json({ error: 'Internal server error' });
      return;
    }
    if (results.affectedRows > 0) {
      res.json({ message: 'Section archived and status updated successfully' });
    } else {
      res.status(404).json({ error: 'Section not found' });
    }
  });
});


// ENDPOINT USED
// SECTION PAGE
app.post('/sections', (req, res) => {
  const { section_name, grade_level, status, max_capacity, school_year_id, room_number, archive_status } = req.body;

  // First check if section name already exists
  const checkDuplicateQuery = `
    SELECT COUNT(*) as count 
    FROM section 
    WHERE LOWER(section_name) = LOWER(?)
  `;
  
  db.query(checkDuplicateQuery, [section_name], (checkErr, checkResults) => {
    if (checkErr) {
      console.error('Error checking for duplicate section:', checkErr);
      return res.status(500).json({ error: 'Internal server error' });
    }
    
    if (checkResults[0].count > 0) {
      return res.status(400).json({ error: 'Section name already exists' });
    }
    
    // If no duplicate, proceed with insertion
    const query = `
      INSERT INTO section (section_name, grade_level, status, max_capacity, school_year_id, room_number, archive_status)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `;
    const values = [section_name, grade_level, status, max_capacity, school_year_id, room_number, archive_status || 'unarchive'];

    db.query(query, values, (err, results) => {
      if (err) {
        console.error('Error adding section:', err);
        return res.status(500).json({ error: 'Internal server error' });
      }
      res.status(201).json({ message: 'Section added successfully', sectionId: results.insertId });
    });
  });
});

// ENDPOINT USED:
// STUDENTS PAGE
app.put('/students/:studentId/archive', (req, res) => {
  const { studentId } = req.params; // Extract the student ID from the URL
  const { status } = req.body; // Extract the new status from the request body

  // Validate the status
  if (!status || !['inactive', 'withdrawn', 'transferred'].includes(status)) {
    return res.status(400).json({ error: 'Invalid status provided' });
  }

  // SQL query to update the student's status and active_status
  const query = `
    UPDATE student
    SET status = ?, active_status = 'archived'
    WHERE student_id = ?;
  `;

  // Execute the query with parameterized inputs
  db.query(query, [status, studentId], (err, result) => {
    if (err) {
      console.error('Error archiving student:', err);
      return res.status(500).json({ error: 'Failed to archive student' });
    }

    if (result.affectedRows > 0) {
      res.status(200).json({ message: 'Student archived successfully' });
    } else {
      res.status(404).json({ error: 'Student not found' });
    }
  });
});

//ENDPOINT USED:
// STUDENTS PAGE
app.get('/user-role/:userId', (req, res) => {
  const { userId } = req.params; // Extract userId from the URL parameter

  const query = `SELECT role_name FROM users WHERE user_id = ?`;

  db.query(query, [userId], (err, results) => {
    if (err) {
      console.error('Error fetching role_name:', err);
      return res.status(500).json({ error: 'Internal server error' });
    }

    if (results.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({ role_name: results[0].role_name }); // Return the role_name
  });
});


// ENDPOINT FOR ENROLLED_STUDENTS PAGE
app.get('/enrolled-students', (req, res) => {
  const { status, grade, section, searchTerm, school_year_id } = req.query;

  // Ensure school_year_id is provided
  if (!school_year_id) {
    return res.status(400).json({ error: "Missing school_year_id parameter" });
  }

  let query = `
    SELECT s.student_id, s.firstname, s.middlename, s.lastname, 
      CONCAT(s.lastname, ', ', s.firstname, ' ', 
      IF(s.middlename IS NOT NULL AND s.middlename != '', CONCAT(LEFT(s.middlename, 1), '.'), '')) AS stud_name, 
      e.grade_level, e.enrollment_status, sec.section_name
    FROM student s
    JOIN enrollment e ON s.student_id = e.student_id
    JOIN section sec ON e.section_id = sec.section_id
    WHERE e.school_year_id = ?
  `;

  const queryParams = [school_year_id]; // Ensure school_year_id is first param

  if (status) {
    query += ' AND e.enrollment_status = ?';
    queryParams.push(status);
  }

  if (grade) {
    query += ' AND e.grade_level = ?';
    queryParams.push(grade);
  }

  if (section) {
    query += ' AND e.section_id = ?';
    queryParams.push(section);
  }

  if (searchTerm) {
    query += ' AND (s.firstname LIKE ? OR s.lastname LIKE ?)';
    queryParams.push(`%${searchTerm}%`, `%${searchTerm}%`);
  }

  console.log('Final query:', query);
  console.log('Query parameters:', queryParams);

  db.query(query, queryParams, (err, results) => {
    if (err) {
      console.error('Error fetching enrolled students:', err);
      res.status(500).json({ error: 'Internal server error', details: err.message });
      return;
    }
    res.json(results);
  });
});



// Endpoint to fetch schedules
// Function: Retrieves a list of schedules with optional filtering by search term, date, and section
// Pages: SchedulePage.js
app.get('/schedules', (req, res) => {
  const { searchTerm, date } = req.query;
  let query = `
    SELECT s.schedule_id, s.section_name, sc.date, sc.time
    FROM schedule sc
    JOIN section s ON sc.section_id = s.section_id
    WHERE 1=1
  `;
  const queryParams = [];

  if (searchTerm) {
    query += ' AND s.section_name LIKE ?';
    queryParams.push(`%${searchTerm}%`);
  }

  if (date) {
    query += ' AND sc.date = ?';
    queryParams.push(date);
  }

  db.query(query, queryParams, (err, results) => {
    if (err) {
      console.error('Error fetching schedules:', err);
      res.status(500).json({ error: 'Internal server error' });
      return;
    }
    res.json(results);
  });
});

// ENDPOINT USED:
// SCHEDULE PAGE
app.get('/sections/:sectionId/schedules', (req, res) => {
  const { sectionId } = req.params;
  const query = `
    SELECT 
    sc.schedule_id, 
    sc.teacher_id,
    sb.subject_name AS subject_name,
    TIME_FORMAT(sc.time_start, '%h:%i %p') AS time_start, 
    TIME_FORMAT(sc.time_end, '%h:%i %p') AS time_end, 
    sc.day, 
    sc.section_id, 
    sc.schedule_status,
    CONCAT(
        e.firstname, ' ',
        IF(e.middlename IS NOT NULL AND e.middlename != '', CONCAT(LEFT(e.middlename, 1), '. '), ''),
        e.lastname
    ) AS teacher_name
FROM SCHEDULE sc
LEFT JOIN SUBJECT sb ON sc.subject_id = sb.subject_id 
LEFT JOIN employee e ON sc.teacher_id = e.employee_id
WHERE sc.section_id = ?
ORDER BY sc.time_start;
  `;
  db.query(query, [sectionId], (err, results) => {
    if (err) {
      console.error('Error fetching schedules:', err);
      res.status(500).json({ error: 'Internal server error' });
      return;
    }
    res.json(results);
  });
});

// ENDPOINT USED:
// SCHEDULE PAGE
app.put('/schedules/:scheduleId', (req, res) => {
  const { scheduleId } = req.params;
  const { teacher_id, time_start, time_end, day, schedule_status } = req.body;

  // First check if the schedule is already approved
  const checkQuery = 'SELECT schedule_status FROM schedule WHERE schedule_id = ?';
  db.query(checkQuery, [scheduleId], (checkErr, checkResults) => {
    if (checkErr) {
      console.error('Error checking schedule status:', checkErr);
      return res.status(500).json({ error: 'Internal server error' });
    }

    if (checkResults.length === 0) {
      return res.status(404).json({ error: 'Schedule not found' });
    }

    if (checkResults[0].schedule_status === 'Approved') {
      return res.status(403).json({ error: 'Cannot edit approved schedules' });
    }

    // If schedule is not approved, proceed with the update
    const query = 'UPDATE schedule SET teacher_id = ?, time_start = ?, time_end = ?, day = ?, schedule_status = ? WHERE schedule_id = ?';
    db.query(query, [teacher_id, time_start, time_end, day, schedule_status, scheduleId], (err, results) => {
      if (err) {
        console.error('Error updating schedule details:', err);
        return res.status(500).json({ error: 'Internal server error' });
      }
      if (results.affectedRows > 0) {
        res.json({ message: 'Schedule updated successfully' });
      } else {
        res.status(404).json({ error: 'Schedule not found' });
      }
    });
  });
});

// ENDPOINT USED:
// SCHEDULE PAGE
app.put('/schedules/:scheduleId/approve', (req, res) => {
  const { scheduleId } = req.params;
  const { schedule_status } = req.body;
  
  const query = 'UPDATE schedule SET schedule_status = ? WHERE schedule_id = ?';
  db.query(query, [schedule_status, scheduleId], (err, result) => {
    if (err) {
      console.error('Error approving schedule:', err);
      return res.status(500).json({ error: 'Failed to approve schedule' });
    }
    res.json({ message: 'Schedule approved successfully' });
  });
});

// Delete a schedule
app.delete('/schedules/:scheduleId', (req, res) => {
  const { scheduleId } = req.params;
  
  // First check if the schedule exists and is in 'Pending Approval' status
  const checkQuery = 'SELECT * FROM schedule WHERE schedule_id = ?';
  db.query(checkQuery, [scheduleId], (err, results) => {
    if (err) {
      console.error('Error checking schedule:', err);
      return res.status(500).json({ error: 'Failed to check schedule' });
    }
    
    if (results.length === 0) {
      return res.status(404).json({ error: 'Schedule not found' });
    }
    
    const schedule = results[0];
    if (schedule.schedule_status !== 'Pending Approval') {
      return res.status(403).json({ error: 'Only pending schedules can be deleted' });
    }
    
    // If schedule exists and is pending, delete it
    const deleteQuery = 'DELETE FROM schedule WHERE schedule_id = ?';
    db.query(deleteQuery, [scheduleId], (err, result) => {
      if (err) {
        console.error('Error deleting schedule:', err);
        return res.status(500).json({ error: 'Failed to delete schedule' });
      }
      
      if (result.affectedRows === 0) {
        return res.status(404).json({ error: 'Schedule not found' });
      }
      
      res.json({ message: 'Schedule deleted successfully' });
    });
  });
});

// ENDPOINT USED:
// SUBJECT PAGE
app.get('/subjects', (req, res) => {
  const { searchTerm, school_year, grade, archive_status } = req.query;
  console.log('Received filters:', req.query);

  const queryParams = [];
  let whereClause = ' WHERE 1=1'; // Base WHERE clause

  // Apply archive_status filter
  if (archive_status) {
    whereClause += ' AND s.archive_status = ?';
    queryParams.push(archive_status);
  }

  // Apply search filter
  let searchCondition = '';
  if (searchTerm && searchTerm.trim() !== '') {
    searchCondition = ` AND LOWER(s.subject_name) LIKE LOWER(?)`;
    queryParams.push(`%${searchTerm}%`);
  }

  // Filter by grade (applies only to subjects)
  let gradeCondition = '';
  if (grade) {
    gradeCondition = ' AND s.grade_level = ?';
    queryParams.push(grade);
  }

  // Filter by school_year (applies only to subjects)
  let schoolYearCondition = '';
  if (school_year) {
    schoolYearCondition = ' AND sy.school_year = ?';
    queryParams.push(school_year);
  }

  const mainQuery = `
      SELECT DISTINCT
          s.subject_id,
          s.grade_level,
          s.subject_name,
          s.status,
          s.grading_criteria,
          s.description,
          s.archive_status,
          s.school_year_id,
          s.elective,
          sy.school_year,
          sy.status AS sy_status,
          IF(s.elective='Y','elective','regular') AS subject_type,
          MAX(CASE WHEN sch.subject_id IS NOT NULL THEN '1' ELSE '0' END) AS hasSched
      FROM SUBJECT s
      LEFT JOIN school_year sy ON s.school_year_id = sy.school_year_id
      LEFT JOIN SCHEDULE sch ON s.subject_id=sch.subject_id
      ${whereClause}
      ${searchCondition}
      ${gradeCondition}
      ${schoolYearCondition}
      GROUP BY s.subject_id
  `;

  console.log('Query:', mainQuery);
  console.log('Parameters:', queryParams);

  db.query(mainQuery, queryParams, (error, results) => {
    if (error) {
      console.error('Error fetching subjects:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
    res.json(results);
  });
});



app.put('/update-subjects-status', (req, res) => {
  const query = `
    UPDATE subject 
    SET status = CASE 
      WHEN school_year_id IN (SELECT school_year_id FROM school_year WHERE status = 'active') THEN 'active'
      WHEN school_year_id IN (SELECT school_year_id FROM school_year WHERE status = 'inactive') THEN 'inactive'
      ELSE status
    END
  `;

  db.query(query, (error, results) => {
    if (error) {
      return res.status(500).send(error);
    }
    res.send({ message: 'Subjects status updated successfully', affectedRows: results.affectedRows });
  });
});

// ENDPOINT USED:
// SUBJECT PAGE
app.post('/subjects', (req, res) => {
  const {
    subject_name,
    grade_level,
    status,
    grading_criteria,
    description,
    archive_status,
    subject_type,       // "elective" or "regular"
    max_capacity        // only for elective
  } = req.body;

  const lowerName = subject_name.toLowerCase();

  // Decide target table and column names based on subject_type
  const isElective = subject_type === 'elective';
  const checkDuplicateQuery = `
    SELECT COUNT(*) AS count 
    FROM subject WHERE elective = 'Y' and subject_name = ?
  `;

  db.query(checkDuplicateQuery, [lowerName], (checkErr, checkResults) => {
    if (checkErr) {
      console.error('Error checking for duplicate:', checkErr);
      return res.status(500).json({ error: 'Internal server error' });
    }

    if (checkResults[0].count > 0) {
      return res.status(400).json({ error: 'Subject already exists' });
    }

    // 👉 Insert into ELECTIVE table
    if (isElective) {
      const insertElectiveQuery = `
        INSERT INTO subject (subject_name, max_capacity, school_year_id, description, elective)
        VALUES (?, ?, (SELECT school_year_id FROM school_year WHERE status = 'active'), ?, 'Y')
      `;

      const electiveParams = [
        subject_name,
        max_capacity || 30,
        description
      ];

      db.query(insertElectiveQuery, electiveParams, (electiveErr, electiveResult) => {
        if (electiveErr) {
          console.error('Error inserting elective:', electiveErr);
          return res.status(500).json({ error: 'Failed to insert elective' });
        }

        return res.status(201).json({
          message: 'Elective added successfully',
          electiveId: electiveResult.insertId
        });
      });

    } else {
      // 👉 Insert into SUBJECT table for "regular"
      const insertSubjectQuery = `
        INSERT INTO subject (
          subject_name, grade_level, status, grading_criteria,
          description, school_year_id, archive_status
        )
        VALUES (?, ?, ?, ?, ?, 
          (SELECT school_year_id FROM school_year WHERE status = 'active'), 
          ?
        )
      `;

      const subjectParams = [
        subject_name,
        grade_level,
        status,
        grading_criteria,
        description,
        archive_status || 'unarchive'
      ];

      db.query(insertSubjectQuery, subjectParams, (subjectErr, subjectResult) => {
        if (subjectErr) {
          console.error('Error inserting subject:', subjectErr);
          return res.status(500).json({ error: 'Failed to insert subject' });
        }

        return res.status(201).json({
          message: 'Subject added successfully',
          subjectId: subjectResult.insertId
        });
      });
    }
  });
});





// ENDPOINT USED:
// SUBJECT PAGE
app.put('/subjects/:subjectId', (req, res) => {
  const { subjectId } = req.params;
  const updatedSubject = req.body;

  // Ensure that updatedSubject only contains valid columns for the subject table
  const allowedFields = ['subject_name', 'grade_level', 'status', 'grading_criteria', 'description', 'archive_status', 'school_year_id'];
  Object.keys(updatedSubject).forEach(key => {
    if (!allowedFields.includes(key)) {
      delete updatedSubject[key];
    }
  });

  // First check if subject name already exists (excluding current subject)
  const checkDuplicateQuery = `
    SELECT COUNT(*) as count 
    FROM subject 
    WHERE LOWER(subject_name) = LOWER(?)
    AND subject_id != ?
  `;
  
  db.query(checkDuplicateQuery, [updatedSubject.subject_name, subjectId], (checkErr, checkResults) => {
    if (checkErr) {
      console.error('Error checking for duplicate subject:', checkErr);
      return res.status(500).json({ error: 'Internal server error' });
    }
    
    if (checkResults[0].count > 0) {
      return res.status(400).json({ error: 'Subject already exists' });
    }

    // If no duplicate, proceed with update
    const query = 'UPDATE subject SET ? WHERE subject_id = ?';
    db.query(query, [updatedSubject, subjectId], (err, results) => {
      if (err) {
        console.error('Error updating subject details:', err);
        res.status(500).json({ error: 'Internal server error' });
        return;
      }
      if (results.affectedRows > 0) {
        res.json({ message: 'Subject updated successfully' });
      } else {
        res.status(404).json({ error: 'Subject not found' });
      }
    });
  });
});

// ENDPOINT USED:
// SUBJECT PAGE
app.put('/subjects/:subjectId/archive', (req, res) => {
  const { subjectId } = req.params;
  const { elective_id, action } = req.body; // Get elective_id and action from the request body

  // Determine status and archive_status based on action
  const status = action === 'unarchive' ? 'active' : 'inactive';
  const archive_status = action === 'unarchive' ? 'unarchive' : 'archive';

  if (elective_id > 0) {
    // If elective_id is greater than 0, update the elective table
    const electiveQuery = 'UPDATE subject SET status = ?, archive_status = ? WHERE subject_id = ?';
    db.query(electiveQuery, [status, archive_status, elective_id], (err, results) => {
      if (err) {
        console.error(`Error ${action}ing elective:`, err);
        res.status(500).json({ error: 'Internal server error' });
        return;
      }
      res.json({ message: `Elective ${action}d successfully` });
    });
  } else {
    // Query to get the correct school_year_id
    const schoolYearQuery = `
      SELECT 
        MAX(CASE WHEN status = 'inactive' THEN school_year_id END) AS inactive_school_year_id,
        MAX(CASE WHEN status = 'active' THEN school_year_id END) AS active_school_year_id
      FROM school_year
    `;

    db.query(schoolYearQuery, (err, result) => {
      if (err) {
        console.error('Error fetching school year:', err);
        res.status(500).json({ error: 'Internal server error' });
        return;
      }

      const school_year_id = action === 'unarchive' ? result[0].active_school_year_id : result[0].inactive_school_year_id;

      if (!school_year_id) {
        res.status(400).json({ error: 'No matching school year found' });
        return;
      }

      // Update subject with the correct school_year_id
      const subjectQuery = 'UPDATE subject SET archive_status = ?, school_year_id = ? WHERE subject_id = ?';
      db.query(subjectQuery, [archive_status, school_year_id, subjectId], (err, results) => {
        if (err) {
          console.error(`Error ${action}ing subject:`, err);
          res.status(500).json({ error: 'Internal server error' });
          return;
        }
        res.json({ message: `Subject ${action}d successfully` });
      });
    });
  }
});


// Endpoint to update section details by ID
// Function: Updates section details
// Pages: SectionPage.js
app.put('/sections/:sectionId', (req, res) => {
  const { sectionId } = req.params;
  const updatedSection = req.body;

  // First check if section name already exists (excluding current section)
  const checkDuplicateQuery = `
    SELECT COUNT(*) as count 
    FROM section 
    WHERE LOWER(section_name) = LOWER(?)
    AND section_id != ?
  `;
  
  db.query(checkDuplicateQuery, [updatedSection.section_name, sectionId], (checkErr, checkResults) => {
    if (checkErr) {
      console.error('Error checking for duplicate section:', checkErr);
      return res.status(500).json({ error: 'Internal server error' });
    }
    
    if (checkResults[0].count > 0) {
      return res.status(400).json({ error: 'Section name already exists' });
    }

    // If no duplicate, proceed with update
    const query = 'UPDATE section SET ? WHERE section_id = ?';
    db.query(query, [updatedSection, sectionId], (err, results) => {
      if (err) {
        console.error('Error updating section details:', err);
        res.status(500).json({ error: 'Internal server error' });
        return;
      }
      if (results.affectedRows > 0) {
        res.json({ message: 'Section updated successfully' });
      } else {
        res.status(404).json({ error: 'Section not found' });
      }
    });
  });
});

// ENDPOINT USED:
// STUDENT PROFILE PAGE
app.get('/student/profile/:userId', (req, res) => {
  const userId = req.params.userId;
  console.log(`Fetching student profile details for userId: ${userId}`);

  const query = `
    SELECT s.student_id, s.lastname, s.firstname, s.middlename, s.current_yr_lvl, s.birthdate, s.gender,
    s.age, s.home_address, s.barangay, s.city_municipality, s.province, s.contact_number, s.email_address,
    s.mother_name, s.father_name, s.parent_address, s.father_occupation, s.mother_occupation,
    s.annual_hshld_income, s.number_of_siblings, s.father_educ_lvl, s.mother_educ_lvl,
    s.father_contact_number, s.mother_contact_number, s.id_picture, s.birth_certificate, 
    s.form_138, s.goodmoral_cert, s.rcv_test, s.section_id, s.user_id, u.username
    FROM student s
    JOIN users u ON s.user_id = u.user_id
    WHERE s.user_id = ?
  `;

  db.query(query, [userId], (err, results) => {
    if (err) {
      console.error('Database query error:', err);
      res.status(500).json({ error: 'Database error' });
      return;
    }
    if (results.length > 0) {
      res.json(results[0]);
    } else {
      console.log('Student profile details not found for userId:', userId);
      res.status(404).json({ error: 'Student profile details not found' });
    }
  });
});


// ENDPOINT USED:
// STUDENT SCHEDULE PAGE
app.get('/user/:userId/schedule', (req, res) => {
  const userId = req.params.userId;
  const schoolYearId = req.query.schoolYearId; // Get school year ID from request query

  if (!schoolYearId) {
    return res.status(400).json({ error: "Missing schoolYearId parameter" });
  }

  const query = `
    SELECT s.subject_name AS subject_name, sc.day, 
    TIME_FORMAT(sc.time_start, '%H:%i:%s') as time_start, 
    TIME_FORMAT(sc.time_end, '%h:%i %p') as time_end
    FROM schedule sc
    LEFT JOIN subject s ON sc.subject_id = s.subject_id 
    JOIN section sec ON sc.section_id = sec.section_id
    JOIN enrollment e ON e.section_id = sec.section_id
    JOIN student st ON st.student_id = e.student_id
    WHERE st.user_id = ? AND e.enrollment_status = 'active' 
    AND sc.schedule_status = 'Approved' 
    AND sc.school_year_id = ?
    ORDER BY FIELD(sc.day, 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'), sc.time_start;
  `;

  db.query(query, [userId, schoolYearId], (err, results) => {
    if (err) {
      console.error('Error fetching schedule:', err);
      res.status(500).send('Error fetching schedule');
    } else {
      res.json(results);
    }
  });
});


// TEACHER SCHEDULE PAGE
app.get('/teacher/:userId/schedule', (req, res) => {
  const userId = req.params.userId;

  // Query to fetch employee_id based on user_id
  const getEmployeeIdQuery = 'SELECT employee_id FROM employee WHERE user_id = ? LIMIT 1';

  db.query(getEmployeeIdQuery, [userId], (err, employeeResults) => {
    if (err) {
      console.error('Error fetching employee ID:', err);
      return res.status(500).send('Error fetching employee ID');
    }

    if (employeeResults.length === 0) {
      console.log('Employee not found for userId:', userId);
      return res.status(404).send('Employee not found');
    }

    const employeeId = employeeResults[0].employee_id;

    // Query to fetch teacher's schedule based on employee_id
    const scheduleQuery = `
      SELECT s.subject_name, sc.day, 
        TIME_FORMAT(sc.time_start, '%H:%i:%s') AS time_start, 
        TIME_FORMAT(sc.time_end, '%h:%i %p') AS time_end,
        sec.section_name, sec.grade_level
      FROM schedule sc
      JOIN subject s ON sc.subject_id = s.subject_id
      JOIN section sec ON sc.section_id = sec.section_id
      JOIN employee t ON sc.teacher_id = t.employee_id
      WHERE t.employee_id = ? AND sc.schedule_status = 'Approved'
      ORDER BY FIELD(sc.day, 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'), sc.time_start;
    `;

    db.query(scheduleQuery, [employeeId], (err, scheduleResults) => {
      if (err) {
        console.error('Error fetching teacher schedule:', err);
        return res.status(500).send('Error fetching teacher schedule');
      }

      if (scheduleResults.length === 0) {
        console.log('No schedule found for employeeId:', employeeId);
        return res.status(404).json({ message: 'No schedule found' });
      }

      return res.json(scheduleResults);
    });
  });
});


//ENDPOINTS USED:
// REGISTRAR ACCOUNT PAGE
// STUDENT ACCOUNT PAGE
app.put('/user/:userId/change-password', (req, res) => {
  const { userId } = req.params;
  const { currentPassword, newPassword } = req.body;

  const userQuery = 'SELECT * FROM users WHERE user_id = ?';
  db.query(userQuery, [userId], (err, userResults) => {
    if (err) {
      console.error('Database query error:', err);
      res.status(500).json({ error: 'Database error' });
      return;
    }
    if (userResults.length === 0) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const user = userResults[0];
    if (currentPassword !== user.password) {
      return res.status(400).json({ success: false, message: 'Current password is incorrect' });
    }

    const updateQuery = 'UPDATE users SET password = ? WHERE user_id = ?';
    db.query(updateQuery, [newPassword, userId], (err, updateResults) => {
      if (err) {
        console.error('Error updating password:', err);
        res.status(500).json({ error: 'Database error' });
        return;
      }
      res.json({ success: true, message: 'Password changed successfully' });
    });
  });
});



// Endpoint to fetch grades from marks table
app.get('/students/:studentId/marks', (req, res) => {
  const studentId = req.params.studentId;
  const query = `
    SELECT * FROM marks 
    WHERE student_id = ?
  `;

  db.query(query, [studentId], (err, results) => {
    if (err) {
      console.error('Error fetching marks:', err);
      res.status(500).json({ error: 'Internal server error' });
      return;
    }
    res.json(results);
  });
});

// Add this new endpoint for deleting an employee
// app.delete('/employees/:employeeId', (req, res) => {
//   const { employeeId } = req.params;
  
//   // First check if the employee exists
//   const checkQuery = 'SELECT * FROM employee WHERE employee_id = ?';
  
//   db.query(checkQuery, [employeeId], (checkError, checkResult) => {
//     if (checkError) {
//       console.error('Error checking employee:', checkError);
//       return res.status(500).json({ error: 'Database error while checking employee' });
//     }
    
//     if (checkResult.length === 0) {
//       return res.status(404).json({ error: 'Employee not found' });
//     }

//     // If employee exists, proceed with deletion
//     const deleteQuery = 'DELETE FROM employee WHERE employee_id = ?';
    
//     db.query(deleteQuery, [employeeId], (deleteError, deleteResult) => {
//       if (deleteError) {
//         console.error('Error deleting employee:', deleteError);
//         return res.status(500).json({ error: 'Failed to delete employee' });
//       }
      
//       if (deleteResult.affectedRows === 0) {
//         return res.status(404).json({ error: 'Employee not found' });
//       }
      
//       console.log(`Employee ${employeeId} deleted successfully`);
//       res.status(200).json({ 
//         message: 'Employee deleted successfully',
//         employeeId: employeeId
//       });
//     });
//   });
// });


// ENDPOINT USED:
// GRADES PAGE
// TEACHER PAGE
app.get('/sections-for-assignment/:gradeLevel', (req, res) => {
  const gradeLevel = req.params.gradeLevel;
  
  const query = `
    SELECT section_name , section_id
    FROM section 
    WHERE grade_level = ?
    ORDER BY section_id ASC
  `;

  db.query(query, [gradeLevel], (err, results) => {
    if (err) {
      console.error('Error fetching sections:', err);
      res.status(500).json({ error: 'Internal server error' });
      return;
    }
    console.log('Fetched sections:', results);
    res.json(results);
  });
});

// ENDPOINT USED:
// GRADES PAGE
// TEACHER PAGE
app.get('/subjects-for-assignment/:gradeLevel', (req, res) => {
  const gradeLevel = req.params.gradeLevel;
  
  const query = `
    SELECT 
      a.subject_name,
      IF(a.elective='Y','elective','subject') as type,
      a.subject_id
    FROM subject a  
    WHERE 
    (a.elective = 'N' AND a.grade_level = ?) 
    OR a.elective = 'Y'
    ORDER BY subject_name ASC
  `;

  db.query(query, [gradeLevel], (err, results) => {
    if (err) {
      console.error('Error fetching subjects:', err);
      res.status(500).json({ error: 'Internal server error' });
      return;
    }
    console.log('Fetched subjects:', results); // Debug log
    res.json(results);
  });
});

// ENDPOINT FOR GRADES PAGE
app.get('/get-components', (req, res) => {
  const { student_id, subject_name, component_id, period } = req.query;

  const query = `
    SELECT id, remarks, scores, total_items, component_id
    FROM components
    WHERE student_id = ? 
    AND subject_name = ? 
    AND component_id = ? 
    AND period = ?
  `;

  db.query(
    query,
    [student_id, subject_name, component_id, period], // Added period to match all placeholders
    (error, results) => {
      if (error) {
        console.error('Error fetching components:', error);
        return res.status(500).json({
          success: false,
          message: 'Error fetching components',
          error: error.message,
        });
      }

      res.json(results);
    }
  );
});

//ENDPOINT USED:
//GRADES PAGES
app.delete('/delete-component', (req, res) => {
  const { id, component_id } = req.body;  // Get id and component_id from request body
  console.log('Received delete request with id:', id, 'and component_id:', component_id); // Log received data
  const query = 'DELETE FROM components WHERE id = ? AND component_id = ?';

  db.query(query, [id, component_id], (error, results) => {
    if (error) {
      console.error('Error deleting component:', error);
      return res.status(500).json({
        success: false,
        message: 'Error deleting component',
        error: error.message,
      });
    }

    // If the deletion was successful, send a response
    if (results.affectedRows > 0) {
      res.json({
        success: true,
        message: 'Component deleted successfully',
      });
    } else {
      res.json({
        success: false,
        message: 'Component not found or deletion failed',
      });
    }
  });
});



//ENDPOINT USED:
//GRADES PAGES
app.get('/section-students/:sectionId/:gradeLevel/:subjectId?/:type?', (req, res) => {
  const { sectionId, gradeLevel, subjectId, type } = req.params;
  
  let query;
  let queryParams;

  if (!type && !subjectId) {
    // Case 1: No type and no subjectId - fetch all students in section
    query = `
      SELECT 
        student_id,
        CONCAT(
          UPPER(SUBSTRING(a.lastname, 1, 1)),
          LOWER(SUBSTRING(a.lastname FROM 2)),
          ', ',
          UPPER(SUBSTRING(a.firstname, 1, 1)),
          LOWER(SUBSTRING(a.firstname FROM 2)),
          ' ',
          UPPER(SUBSTRING(IFNULL(a.middlename, ''), 1, 1)),
          LOWER(SUBSTRING(IFNULL(a.middlename, '') FROM 2))
        ) AS name
      FROM student a 
      LEFT JOIN SUBJECT b ON a.current_yr_lvl = b.grade_level
      WHERE a.section_id = ? AND a.current_yr_lvl = ?
      GROUP BY NAME
      ORDER BY a.lastname, a.firstname
    `;
    queryParams = [sectionId, gradeLevel];
  } else if (type === 'subject') {
    // Case 2: Regular subject
    query = `
      SELECT 
        student_id,
        CONCAT(
          UPPER(SUBSTRING(a.lastname, 1, 1)),
          LOWER(SUBSTRING(a.lastname FROM 2)),
          ', ',
          UPPER(SUBSTRING(a.firstname, 1, 1)),
          LOWER(SUBSTRING(a.firstname FROM 2)),
          ' ',
          UPPER(SUBSTRING(IFNULL(a.middlename, ''), 1, 1)),
          LOWER(SUBSTRING(IFNULL(a.middlename, '') FROM 2))
        ) AS name, 
        b.subject_name AS subject_name
      FROM student a 
      LEFT JOIN SUBJECT b ON a.current_yr_lvl = b.grade_level
      WHERE a.section_id = ? 
      AND b.grade_level = ? 
      AND b.subject_id = ?
      ORDER BY a.lastname, a.firstname
    `;
    queryParams = [sectionId, gradeLevel, subjectId];
  } else if (type === 'elective') {
    // Case 3: Elective
    query = `
      SELECT 
        a.student_id,
        CONCAT(
          UPPER(SUBSTRING(a.lastname, 1, 1)),
          LOWER(SUBSTRING(a.lastname FROM 2)),
          ', ',
          UPPER(SUBSTRING(a.firstname, 1, 1)),
          LOWER(SUBSTRING(a.firstname FROM 2)),
          ' ',
          UPPER(SUBSTRING(IFNULL(a.middlename, ''), 1, 1)),
          LOWER(SUBSTRING(IFNULL(a.middlename, '') FROM 2))
        ) AS name, 
        c.name AS elective_name 
      FROM student a 
      LEFT JOIN student_elective b ON a.student_id=b.student_id 
      LEFT JOIN elective c ON b.elective_id=c.elective_id
      WHERE a.section_id = ? 
      AND a.current_yr_lvl = ? 
      AND b.elective_id = ?
      ORDER BY a.lastname, a.firstname
    `;
    queryParams = [sectionId, gradeLevel, subjectId];
  }

  console.log('Executing query with params:', queryParams); // Debug log

  db.query(query, queryParams, (err, results) => {
    if (err) {
      console.error('Error fetching students:', err);
      return res.status(500).json({ error: 'Internal server error' });
    }
    console.log('Query results:', results); // Debug log
    res.json(results);
  });
});

// ENDPOINT FOR GRADES PAGE
app.post('/submit-grade', (req, res) => {
  const {
    grade_level,
    subject_name,
    grade,
    period,
    student_id,
    student_name,
    school_year_id,
    written_works,
    performance_task,
    quarterly_assessment,
  } = req.body;

  const query = `
    INSERT INTO grades (
      grade_level,
      subject_name,
      grade,
      period,
      student_id,
      student_name,
      school_year_id
    ) 
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `;

  db.query(
    query,
    [grade_level, subject_name, grade, period, student_id, student_name, school_year_id],
    (err, result) => {
      if (err) {
        console.error('Error inserting/updating grade:', err);
        return res.status(500).json({
          success: false,
          message: 'Failed to submit grade.',
          error: err.message,
        });
      }

      const fetchQuery = `
        SELECT grades_id FROM grades 
        WHERE student_id = ? AND subject_name = ? AND period = ? 
        ORDER BY grades_id DESC LIMIT 1;
      `;

      db.query(fetchQuery, [student_id, subject_name, period], (fetchErr, fetchResult) => {
        if (fetchErr) {
          console.error('Error fetching grades_id:', fetchErr);
          return res.status(500).json({
            success: false,
            message: 'Failed to fetch grades_id.',
            error: fetchErr.message,
          });
        }

        if (fetchResult.length === 0) {
          return res.status(404).json({
            success: false,
            message: 'No grades found for the specified criteria.',
          });
        }

        const gradesId = fetchResult[0].grades_id;

        if (!gradesId) {
          return res.status(500).json({
            success: false,
            message: 'Failed to retrieve grades ID for grades detail insertion.',
          });
        }

        const detailQuery = `
          INSERT INTO grades_detail (
            grades_id,
            written_works,
            performance_task,
            quarterly_assessment,
            student_id,
        period
          ) 
          VALUES (?, ?, ?, ?, ?, ?)  
          ON DUPLICATE KEY UPDATE
            written_works = VALUES(written_works),
            performance_task = VALUES(performance_task),
            quarterly_assessment = VALUES(quarterly_assessment),
            student_id = VALUES(student_id),
            period = VALUES(period)
        `;

        db.query(
          detailQuery,
          [gradesId, written_works, performance_task, quarterly_assessment, student_id, period],
          (detailErr) => {
            if (detailErr) {
              console.error('Error inserting into grades_detail:', detailErr);
              return res.status(500).json({
                success: false,
                message: 'Failed to insert grade details.',
                error: detailErr.message,
              });
            }

            console.log('Grade details successfully inserted:', { gradesId, written_works, performance_task, quarterly_assessment });

            res.json({
              success: true,
              message: result.insertId
                ? 'Grade submitted successfully!'
                : 'Grade updated successfully!',
              id: gradesId,
            });
          }
        );
      });
    }
  );
});

app.get('/student-section/:studentId', (req, res) => {
  try {
    const { studentId } = req.params;
    const { schoolYearId } = req.query; // Retrieve schoolYearId from query parameters

    console.log('Fetching section for studentId:', studentId, 'School Year ID:', schoolYearId);

    if (!studentId || !schoolYearId) {
      console.error('Missing required parameters');
      return res.status(400).json({ 
        error: 'Student ID and School Year ID are required'
      });
    }

    // First check if student exists in student table
    const studentCheckQuery = 'SELECT * FROM student WHERE student_id = ?';
    
    db.query(studentCheckQuery, [studentId], (err, studentResult) => {
      if (err) {
        console.error('Database error checking student:', err);
        return res.status(500).json({ 
          error: 'Failed to check student existence',
          details: err.message 
        });
      }

      if (studentResult.length === 0) {
        console.log('Student not found in database');
        return res.status(404).json({ 
          error: 'Student not found'
        });
      }

      // Now check for enrollment and section
      const query = `
        SELECT b.section_name, a.section_id 
        FROM enrollment a 
        LEFT JOIN section b ON a.section_id = b.section_id 
          AND a.grade_level = b.grade_level 
        WHERE a.student_id = ? AND a.school_year_id = ?
      `;

      console.log('Executing query:', query, 'with values:', [studentId, schoolYearId]);

      db.query(query, [studentId, schoolYearId], (err, results) => {
        if (err) {
          console.error('Database error:', err);
          return res.status(500).json({ 
            error: 'Failed to fetch student section',
            details: err.message 
          });
        }

        console.log('Section query results:', results);

        if (results.length > 0 && results[0].section_id) {
          console.log('Section found:', results[0].section_name, 'Section ID:', results[0].section_id);
          res.json({ 
            section: results[0].section_name,
            section_id: results[0].section_id
          });
        } else {
          console.log('No section found for student in selected school year');
          res.json({ 
            section: null,
            section_id: null
          });
        }
      });
    });
  } catch (error) {
    console.error('Error in route handler:', error);
    res.status(500).json({ 
      error: 'Failed to fetch student section',
      details: error.message 
    });
  }
});



app.post('/insert-component', (req, res) => {
  console.log('Request body:', req.body); // Log the entire request body

  const { 
    id, 
    component_id,
    scores,
    total_items,
    remarks,
    student_id,
    subject_name,
    period 
  } = req.body;

  console.log('Received period:', period); // Log specifically the period value

  const query = `
    INSERT INTO components (
      id,
      component_id,
      scores,
      total_items,
      remarks,
      student_id,
      subject_name,
      period
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    ON DUPLICATE KEY UPDATE
      component_id = VALUES(component_id),
      scores = VALUES(scores),
      total_items = VALUES(total_items),
      remarks = VALUES(remarks),
      student_id = VALUES(student_id),
      subject_name = VALUES(subject_name),
      period = VALUES(period)
  `;

  db.query(query, [
    id, 
    component_id, 
    scores, 
    total_items, 
    remarks,
    student_id,
    subject_name,
    period
  ], (error, result) => {
    if (error) {
      console.error('Error inserting/updating component:', error);
      return res.status(500).json({ 
        success: false, 
        message: 'Error inserting/updating component',
        error: error.message 
      });
    }

    res.json({ 
      success: true, 
      message: 'Component inserted/updated successfully',
      data: result 
    });
  });
});




// API Endpoint to fetch user information
app.get('/api/user-info/:userId', (req, res) => {
  const userId = req.params.userId;
  console.log(`Fetching user info for userId: ${userId}`);

  const query = `
    SELECT u.username, u.role_id, u.password,
    COALESCE(s.firstname, e.firstname) AS firstname, 
    COALESCE(s.lastname, e.lastname) AS lastname, 
    COALESCE(s.middlename, e.middlename) AS middle_name,
    IF(u.role_id=2,s.contact_number,e.contact_number) AS contact_number,
    IF(u.role_id=2,s.email_address,e.email_address) AS email_address
    FROM users u
    LEFT JOIN student s ON u.user_id = s.user_id
    LEFT JOIN employee e ON u.user_id = e.user_id
    WHERE u.user_id = ?
  `;

  db.query(query, [userId], (err, results) => {
    if (err) {
      console.error('Database query error:', err);
      return res.status(500).json({ error: 'Internal server error' });
    }
    if (results.length > 0) {
      res.json(results[0]);
    } else {
      res.status(404).json({ error: 'User not found' });
    }
  });
});

app.put('/api/user-info/:userId', (req, res) => {
  const { userId } = req.params;
  const { firstname, middle_name, lastname, username, password } = req.body;

  console.log('Incoming request for user update:', { userId, firstname, middle_name, lastname, username, password });

  const roleQuery = `SELECT role_name FROM users WHERE user_id = ?`;

  db.query(roleQuery, [userId], (err, roleResults) => {
    if (err) {
      console.error('Error fetching role:', err);
      res.status(500).json({ error: 'Database error while fetching role' });
      return;
    }

    if (roleResults.length === 0) {
      console.warn('User not found for userId:', userId);
      res.status(404).json({ error: 'User not found' });
      return;
    }

    const roleName = roleResults[0].role_name;
    console.log('User role:', roleName);

    let updateQuery = `
      UPDATE users
      SET username = ?, password = ?
      WHERE user_id = ?;
    `;
    // Execute the first update query
    db.query(updateQuery, [username, password, userId], (updateErr, updateResults) => {
      if (updateErr) {
        console.error('Error updating user info:', updateErr);
        res.status(500).json({ error: 'Database error while updating user info' });
        return;
      }

      // Now update the employee or student based on the role
      const roleUpdateQuery = roleName === 'student' ? `
        UPDATE student
        SET firstname = ?, middlename = ?, lastname = ?
        WHERE user_id = ?;
      ` : `
        UPDATE employee
        SET firstname = ?, middlename = ?, lastname = ?
        WHERE user_id = ?;
      `;

      const roleUpdateParams = roleName === 'student' ? 
        [firstname, middle_name, lastname, userId] : 
        [firstname, middle_name, lastname, userId];

      // Execute the second update query
      db.query(roleUpdateQuery, roleUpdateParams, (roleUpdateErr, roleUpdateResults) => {
        if (roleUpdateErr) {
          console.error('Error updating user info:', roleUpdateErr);
          res.status(500).json({ error: 'Database error while updating user info' });
          return;
        }

        console.log('User info updated successfully for userId:', userId);
        res.status(200).json({ message: 'User info updated successfully' });
      });
    });
  });
});

// ENDPOINT FOR BRIGADA_ESKWELA
app.get('/brigada-eskwela', (req, res) => {
  const { searchTerm, grade, section, school_year } = req.query; // Extract query parameters

  let query = `
    SELECT 
      CONCAT(a.lastname, ', ', a.firstname, ' ', IFNULL(a.middlename, '')) AS stud_name, 
      a.student_id,
      a.current_yr_lvl AS grade_lvl, 
      b.section_name as section_name, 
      b.section_id as section_id,
      dd.brigada_status AS brigada_attendance,
      s.school_year, 
      a.lrn,
      IF(dd.brigada_status='Attended','Attended',dd.remarks) AS remarks
    FROM student a 
    LEFT JOIN section b ON a.section_id = b.section_id 
    LEFT JOIN student_school_year c ON a.student_id=c.student_id
    LEFT JOIN school_year s ON c.school_year_id = s.school_year_id
    LEFT JOIN brigada_details dd ON a.student_id=dd.student_id
    WHERE a.section_id != ''
  `;

  const queryParams = [];
  const conditions = [];

  if (searchTerm) {
    conditions.push(`(a.firstname LIKE ? OR a.lastname LIKE ?)`); // Use correct table alias
    queryParams.push(`%${searchTerm}%`, `%${searchTerm}%`);
  }

  if (grade) {
    conditions.push(`a.current_yr_lvl = ?`);
    queryParams.push(grade);
  }

  if (section) {
    conditions.push(`b.section_name = ?`);
    queryParams.push(section);
  }

  if (school_year) {
    conditions.push(`s.school_year = ?`); // Ensure `school_year` exists in `student` table
    queryParams.push(school_year);
  }

  if (conditions.length > 0) {
    query += ' AND ' + conditions.join(' AND ');
  }

  query += ' GROUP BY a.student_id ORDER BY a.lastname ASC';

  db.query(query, queryParams, (err, results) => { // Pass queryParams
    if (err) {
      console.error('Error fetching brigada eskwela data:', err);
      return res.status(500).json({ error: 'Internal server error' });
    }
    res.json(results);
  });
});

app.post('/brigada-eskwela/remarks', (req, res) => {
  const { studentId, remarks } = req.body; // Extract studentId and remarks from the request body

  if (!studentId || !remarks) {
    return res.status(400).json({ error: 'Missing studentId or remarks' });
  }

  const query = `
    UPDATE brigada_details SET remarks = ? WHERE student_id = ?
  `;

  const queryParams = [remarks, studentId];

  db.query(query, queryParams, (err, results) => {
    if (err) {
      console.error('Error inserting brigada details:', err);
      return res.status(500).json({ error: 'Failed to insert brigada details' });
    }

    res.status(201).json({ message: 'Brigada details added successfully' });
  });
});

app.put('/brigada-eskwela/:studentId', (req, res) => {
  const { studentId } = req.params;
  const { brigada_attendance } = req.body; // Only brigada_attendance is required

  // Check if brigada_attendance is provided (0 or 1)
  if (brigada_attendance === undefined) {
    return res.status(400).json({ error: 'Missing brigada_attendance' });
  }

  // Update the brigada_eskwela value in the student table
  const query = `
    UPDATE brigada_details
    SET brigada_status = ?
    WHERE student_id = ?
  `;

  const queryParams = [brigada_attendance === '0' || brigada_attendance === 0 || brigada_attendance === false ? 'Not Attended' : 'Attended', studentId]; // Set brigada_eskwela to 1 for "Present" or 0 for "No"

  db.query(query, queryParams, (err, results) => {
    if (err) {
      console.error('Error updating student attendance:', err);
      return res.status(500).json({ error: 'Failed to update student attendance' });
    }

    res.status(200).json({ message: 'Student attendance updated successfully' });
  });
});



app.get('/get-students', async (req, res) => {
  const { grade, section } = req.query;

  if (!grade || !section) {
    return res.status(400).json({ error: 'Grade and section are required' });
  }

  const query = `
    SELECT CONCAT(a.lastname, ', ', a.firstname, ' ', IFNULL(a.middlename, '')) AS student_name, 
    a.current_yr_lvl AS grade_level, 
    b.section_name AS section 
    FROM student a 
    LEFT JOIN section b ON a.section_id = b.section_id 
    WHERE a.current_yr_lvl = ? AND b.section_name = ?
  `;

  try {
    const [results] = await db.query(query, [grade, section]);
    res.json({ students: results });
  } catch (err) {
    console.error('Error fetching students:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});


// ENDPOINT USED:
// LATE ENROLLEE REPORT
app.get('/late-enrollees', (req, res) => {
  const { section, grade_lvl } = req.query;

  if (!section || !grade_lvl) {
    res.status(400).json({ error: 'Section and grade level are required.' });
    return;
  }

  const query = `
    SELECT * FROM (
      SELECT 
        CONCAT(a.firstname, ' ', 
          IF(a.middlename IS NOT NULL AND a.middlename <> '', 
            CONCAT(SUBSTRING(a.middlename, 1, 1), '.'), ''), 
          ' ', a.lastname) AS full_name, 
        a.current_yr_lvl AS grade_lvl,
        d.section_name AS section,
        IF(a.enroll_date > c.enrollment_end, 'Late', 'On Time') AS enrollment_status 
      FROM student a  
      LEFT JOIN student_school_year b ON a.student_id = b.student_id 
      LEFT JOIN school_year c ON b.school_year_id = c.school_year_id
      LEFT JOIN section d ON a.section_id = d.section_id 
    ) AS subquery 
    WHERE enrollment_status = 'Late' AND section = ? AND grade_lvl = ?;
  `;

  db.query(query, [section, grade_lvl], (err, results) => {
    if (err) {
      console.error('Error fetching late enrollees:', err);
      res.status(500).json({ error: 'Failed to fetch late enrollees' });
      return;
    }
    res.json(results);
  });
});


// Add this new endpoint
app.get('/student-grades', (req, res) => {
  const { grade_level, subject_name, student_id } = req.query;

  const query = `
    SELECT ROUND(grade,0) AS grade, period 
      FROM grades
    WHERE grade_level = ? 
    AND subject_name = ? 
    AND student_id = ?
    ORDER BY period ASC`;

  db.query(query, [grade_level, subject_name, student_id], (err, results) => {
    if (err) {
      console.error('Error fetching student grades:', err);
      return res.status(500).json({ error: 'Internal server error' });
    }
    res.json(results);
  });
});

// Add this new endpoint to check if grades exist
app.get('/check-grade', (req, res) => {
  const { student_id, subject_name, period } = req.query;

  const query = `
    SELECT grades_id, grade 
    FROM grades 
    WHERE student_id = ? 
    AND subject_name = ? 
    AND period = ?
  `;

  db.query(query, [student_id, subject_name, period], (error, results) => {
    if (error) {
      console.error('Error checking grades:', error);
      return res.status(500).json({
        success: false,
        message: 'Error checking grades',
        error: error.message
      });
    }

    res.json({
      exists: results.length > 0,
      gradeData: results[0] || null
    });
  });
});

// New endpoint to fetch all grades detail for a specific student
app.get('/grades-detail', (req, res) => {
  const studentId = req.query.student_id; // Get student_id from query parameters

  console.log(`Received request for grades detail with student ID: ${studentId}`); // Log the received student ID

  if (!studentId) {
    console.error('Student ID is missing in the request'); // Log if student_id is missing
    return res.status(400).json({ error: 'Student ID is required' }); // Handle missing student_id
  }

  const query = `
    SELECT * FROM grades_detail WHERE student_id = ?
  `;

  db.query(query, [studentId], (err, results) => {
    if (err) {
      console.error('Error fetching grades detail:', err);
      return res.status(500).json({ error: 'Internal server error' });
    }

    console.log('Fetched grades detail for student ID:', studentId);
    console.log('Grades Detail:', results); // Log the results to see what is returned

    res.json(results);
  });
});

// New endpoint to get all student names for auto-suggest
app.get('/students/names', (req, res) => {
  const { searchTerm } = req.query; // Get searchTerm from query parameters
  let query = `
    SELECT CONCAT(lastname, ', ', firstname, ' ', IFNULL(middlename, '')) AS stud_name 
    FROM student
  `;

  const queryParams = [];
  if (searchTerm) {
    query += ' WHERE firstname LIKE ? OR lastname LIKE ?';
    queryParams.push(`%${searchTerm}%`, `%${searchTerm}%`);
  }

  db.query(query, queryParams, (err, results) => {
    if (err) {
      console.error('Error fetching student names:', err);
      return res.status(500).json({ error: 'Internal server error' });
    }
    res.json(results);
  });
});


app.get('/user-id/convert/student-id', (req, res) => {
  const { userId, schoolYearId } = req.query;

  // Validate inputs
  if (!userId || !schoolYearId) {
    return res.status(400).json({ success: false, message: 'User ID and School Year ID are required.' });
  }

  try {
    // SQL query to fetch student_id and grade_level based on selected school year
    const query = `
      SELECT 
        a.student_id, 
        b.grade_level 
      FROM student a 
      LEFT JOIN enrollment b 
        ON a.student_id = b.student_id 
      WHERE a.user_id = ? AND b.school_year_id = ? AND b.enrollment_status = 'active'
    `;

    // Execute the query
    db.query(query, [userId, schoolYearId], (err, results) => {
      if (err) {
        console.error('Error executing query:', err);
        return res.status(500).json({ success: false, message: 'Database error occurred.' });
      }

      // Check if results exist
      if (results.length === 0) {
        return res.status(404).json({ success: false, message: 'No student found for the given User ID and School Year.' });
      }

      // Respond with student_id and grade_level
      res.status(200).json({
        success: true,
        studentId: results[0].student_id,
        gradeLevel: results[0].grade_level, // Updated grade level per school year
      });
    });
  } catch (error) {
    console.error('Unexpected error:', error);
    res.status(500).json({ success: false, message: 'An unexpected error occurred.' });
  }
});


app.get('/api/students/search', (req, res) => {
  const searchQuery = req.query.q || ''; // Get query parameter (q)
  
  const sql = `
      SELECT CONCAT(lastname, ', ', firstname, ' ', IFNULL(middlename, '')) AS stud_name 
      FROM student 
      WHERE lastname LIKE ? OR firstname LIKE ? OR middlename LIKE ?
  `;

  const queryParams = [`%${searchQuery}%`, `%${searchQuery}%`, `%${searchQuery}%`];

  db.query(sql, queryParams, (err, results) => {
      if (err) {
          console.error("Error fetching students:", err);
          return res.status(500).json({ error: "Internal Server Error" });
      }
      res.json(results);
  });
});

// ENDPOINT USED:
// SCHEDULE PAGE
app.post('/api/schedules', (req, res) => {
  const {
    subject_id,
    teacher_id,
    time_start,
    time_end,
    day,
    section_id,
    schedule_status,
    grade_level,
    elective = 0, // Default to 0 if not provided
  } = req.body;

  const getActiveSchoolYearQuery = `SELECT school_year_id FROM school_year WHERE status = 'active' LIMIT 1`;

  db.query(getActiveSchoolYearQuery, (err, schoolYearResult) => {
    if (err) {
      console.error('Error fetching active school year:', err);
      return res.status(500).json({ error: 'Failed to fetch active school year', details: err.message });
    }

    if (schoolYearResult.length === 0) {
      return res.status(400).json({ error: 'No active school year found' });
    }

    const school_year_id = schoolYearResult[0].school_year_id;

    const insertScheduleQuery = `
      INSERT INTO schedule 
      (subject_id, teacher_id, time_start, time_end, day, section_id, schedule_status, grade_level, school_year_id, elective)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    db.query(
      insertScheduleQuery,
      [
        subject_id,
        teacher_id,
        time_start,
        time_end,
        day,
        section_id,
        schedule_status,
        grade_level,
        school_year_id,
        elective,
      ],
      (err, result) => {
        if (err) {
          console.error('Error adding schedule:', err);
          return res.status(500).json({ error: 'Failed to insert schedule', details: err.message });
        }

        const scheduleId = result.insertId;

        const insertOrUpdateTeacherSubjectQuery = `
          INSERT INTO teacher_subject 
          (subject_id, LEVEL, section_id, employee_id, elective, school_year_id)
          VALUES (?, ?, ?, ?, ?, ?)
          ON DUPLICATE KEY UPDATE
            subject_id = VALUES(subject_id),
            LEVEL = VALUES(LEVEL),
            section_id = VALUES(section_id),
            employee_id = VALUES(employee_id),
            elective = VALUES(elective),
            school_year_id = VALUES(school_year_id)
        `;

        db.query(
          insertOrUpdateTeacherSubjectQuery,
          [
            subject_id,
            grade_level,
            section_id,
            teacher_id,
            elective,
            school_year_id,
          ],
          (err2) => {
            if (err2) {
              console.error('Error inserting/updating teacher_subject:', err2);
              return res.status(500).json({ error: 'Schedule inserted but failed to link teacher and subject', details: err2.message });
            }

            res.status(201).json({ message: 'Schedule and teacher-subject entry added/updated successfully', scheduleId });
          }
        );
      }
    );
  });
});



app.post("/api/save-grade", (req, res) => {
  const { student_id, student_name, grade_level, school_year_id, subjects, section_id } = req.body;

  if (!student_id || !subjects || subjects.length === 0) {
    return res.status(400).json({ success: false, message: "Invalid request data." });
  }

  // SQL query for inserting/updating grades
  const query = `
    INSERT INTO grades (
      grade_level,
      subject_name,
      grade,
      period,
      student_id,
      student_name,
      school_year_id,
      section_id
    ) 
    VALUES ?
    ON DUPLICATE KEY UPDATE 
      grade = VALUES(grade),
      grade_level = VALUES(grade_level),
      subject_name = VALUES(subject_name),
      student_name = VALUES(student_name),
      school_year_id = VALUES(school_year_id),
      section_id = VALUES(section_id)
  `;

  // Prepare the values array
  let values = [];

  subjects.forEach(subject => {
    if (subject.q1 !== null) values.push([grade_level, subject.subject_name, subject.q1, 1, student_id, student_name, school_year_id,section_id]);
    if (subject.q2 !== null) values.push([grade_level, subject.subject_name, subject.q2, 2, student_id, student_name, school_year_id,section_id]);
    if (subject.q3 !== null) values.push([grade_level, subject.subject_name, subject.q3, 3, student_id, student_name, school_year_id,section_id]);
    if (subject.q4 !== null) values.push([grade_level, subject.subject_name, subject.q4, 4, student_id, student_name, school_year_id,section_id]);
  });

  if (values.length === 0) {
    return res.status(400).json({ success: false, message: "No valid grades to insert." });
  }

  // Execute the query
  db.query(query, [values], (err, result) => {
    if (err) {
      console.error("Error inserting/updating grades:", err);
      return res.status(500).json({ success: false, message: "Failed to save grades." });
    }
    res.json({ success: true, message: "Grades saved successfully!" });
  });
});





app.listen(3001, () => {
  console.log('Server running on port 3001');
});

// Profile Picture Upload Endpoint
app.post('/api/upload-profile-picture', upload.single('profilePicture'), (req, res) => {
  try {
    const userId = req.body.userId;
    
    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }
    
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    
    // Rename the file to include the userId
    const fileExt = path.extname(req.file.originalname);
    const oldPath = req.file.path;
    const fileName = `user_${userId}${fileExt}`;
    const newPath = path.join(path.dirname(oldPath), fileName);
    
    // Remove existing file with the same name if it exists
    if (fs.existsSync(newPath)) {
      fs.unlinkSync(newPath);
    }
    
    // Rename the file
    fs.renameSync(oldPath, newPath);
    
    // Create the URL for the uploaded file
    const fileUrl = `${req.protocol}://${req.get('host')}/uploads/profile-pictures/${fileName}`;
    
    // Update the user's profile picture URL in the database
    const updateQuery = `
      UPDATE users
      SET profile_picture_url = ?
      WHERE user_id = ?
    `;
    
    db.query(updateQuery, [fileUrl, userId], (err, results) => {
      if (err) {
        console.error('Error updating profile picture URL:', err);
        return res.status(500).json({ error: 'Database error while updating profile picture URL' });
      }
      
      console.log(`Profile picture updated for user ${userId}`);
      res.status(200).json({ 
        message: 'Profile picture uploaded successfully',
        imageUrl: fileUrl
      });
    });
  } catch (error) {
    console.error('Error in profile picture upload:', error);
    res.status(500).json({ error: 'Server error during file upload' });
  }
});

// Profile Picture Retrieval Endpoint
app.get('/api/profile-picture/:userId', (req, res) => {
  const userId = req.params.userId;
  
  if (!userId) {
    return res.status(400).json({ error: 'User ID is required' });
  }
  
  const query = `
    SELECT profile_picture_url
    FROM users
    WHERE user_id = ?
  `;
  
  db.query(query, [userId], (err, results) => {
    if (err) {
      console.error('Error fetching profile picture URL:', err);
      return res.status(500).json({ error: 'Database error while fetching profile picture URL' });
    }
    
    if (results.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const profilePictureUrl = results[0].profile_picture_url;
    
    if (!profilePictureUrl) {
      return res.status(404).json({ error: 'Profile picture not found' });
    }
    
    res.status(200).json({ imageUrl: profilePictureUrl });
  });
});

app.put('/api/update-contact/:userId', (req, res) => {
  const { userId } = req.params;
  const { contact_number } = req.body;

  if (!contact_number) {
    return res.status(400).json({ error: 'Contact number is required' });
  }

  // First, get the role_id of the user
  const getUserRoleQuery = `SELECT role_id FROM users WHERE user_id = ?`;

  db.query(getUserRoleQuery, [userId], (err, result) => {
    if (err) {
      console.error('Error fetching role:', err);
      return res.status(500).json({ error: 'Failed to fetch user role' });
    }

    if (result.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const roleId = result[0].role_id;
    const table = roleId === 2 ? 'student' : 'employee';

    const updateQuery = `UPDATE ${table} SET contact_number = ? WHERE user_id = ?`;

    db.query(updateQuery, [contact_number, userId], (err2, result2) => {
      if (err2) {
        console.error(`Error updating contact number in ${table}:`, err2);
        return res.status(500).json({ error: 'Failed to update contact number' });
      }

      return res.status(200).json({ message: 'Contact number updated successfully' });
    });
  });
});


app.get('/students/pending-elective', (req, res) => {
  const { searchTerm, grade, section, school_year } = req.query;

  console.log('Received params:', { searchTerm, grade, section, school_year });

  // Query to fetch the active school year
  const getActiveSchoolYearQuery = `
    SELECT school_year 
    FROM school_year 
    WHERE status = 'active' 
    LIMIT 1
  `;

  db.query(getActiveSchoolYearQuery, (err, results) => {
    if (err) {
      console.error('Error fetching active school year:', err);
      res.status(500).json({ error: 'Failed to fetch active school year' });
      return;
    }

    const latestSchoolYear = results[0]?.school_year;

    if (!latestSchoolYear) {
      console.error('No active school year found');
      res.status(404).json({ error: 'No active school year found' });
      return;
    }

    console.log('Active school year:', latestSchoolYear);

    // Build the main query with fixed subquery
    let query = `
      SELECT s.student_id, s.user_id, s.lastname, s.firstname, s.middlename, 
      s.current_yr_lvl, s.birthdate, s.gender, s.age, 
      s.home_address, s.barangay, s.city_municipality, s.province, 
      s.contact_number, s.email_address, s.status as stud_status,
      s.mother_name, s.father_name, s.parent_address, s.father_occupation, 
      s.mother_occupation, s.annual_hshld_income, s.number_of_siblings, 
      s.father_educ_lvl, s.mother_educ_lvl, s.father_contact_number, 
      s.mother_contact_number, bd.brigada_status AS brigada_eskwela,
      (SELECT MAX(ss.status) FROM student_school_year ss
      JOIN school_year sy ON ss.school_year_id = sy.school_year_id
      WHERE ss.student_id = s.student_id AND sy.status = 'active' LIMIT 1) as active_status,
      se.enrollment_status, se.student_elective_id,
      e.subject_name as subject_name, e.description, CONCAT(f.time_start,' - ',f.time_end) AS time,
      f.day, CONCAT(ee.firstname,' ',LEFT(IFNULL(ee.middlename,''),1),' ',ee.lastname) AS teacher,
      sa.section_name
      FROM student s
      LEFT JOIN student_elective se ON s.student_id = se.student_id 
      LEFT JOIN enrollment xx ON s.student_id=xx.student_id
      LEFT JOIN subject e on se.elective_id=e.subject_id
      LEFT JOIN schedule f ON e.subject_id=f.subject_id AND f.elective=1
      LEFT JOIN employee ee ON f.teacher_id=ee.employee_id
      LEFT JOIN section sa ON s.section_id=sa.section_id
      LEFT JOIN brigada_details bd ON s.brigada_id=bd.brigada_id
      WHERE se.enrollment_status='pending'
    `;

    const queryParams = [];
    const conditions = [];

    if (searchTerm) {
      conditions.push(`(s.firstname LIKE ? OR s.lastname LIKE ?)`);
      queryParams.push(`%${searchTerm}%`, `%${searchTerm}%`);
    }

    if (grade) {
      conditions.push(`s.current_yr_lvl = ?`);
      queryParams.push(grade);
    }

    if (section) {
      conditions.push(`s.section_id = ?`);
      queryParams.push(section);
    }

    if (conditions.length > 0) {
      query += ' AND ' + conditions.join(' AND ');
    }

    query += ' ORDER BY s.firstname';

    console.log('Final query:', query);
    console.log('With parameters:', queryParams);

    // Execute the main query
    db.query(query, queryParams, (err, results) => {
      if (err) {
        console.error('Error fetching students:', err);
        res.status(500).json({ error: 'Internal server error' });
        return;
      }
      res.json(results);
    });
  });
});

// Get student schedules
app.get('/students/:studentId/schedules', (req, res) => {
  const studentId = req.params.studentId;
  const query = `
    SELECT 
      s.subject_name,
      sc.day,
      TIME_FORMAT(sc.time_start, '%H:%i') as time_start,
      TIME_FORMAT(sc.time_end, '%H:%i') as time_end,
      CONCAT(e.firstname, ' ', IF(e.middlename IS NOT NULL AND e.middlename != '', CONCAT(LEFT(e.middlename, 1), '. '), ''), e.lastname) as teacher_name,
      sc.schedule_status
    FROM schedule sc
    JOIN subject s ON sc.subject_id = s.subject_id
    JOIN section sec ON sc.section_id = sec.section_id
    JOIN enrollment en ON en.section_id = sec.section_id
    JOIN employee e ON sc.teacher_id = e.employee_id
    WHERE en.student_id = ? AND en.enrollment_status = 'active'
    ORDER BY FIELD(sc.day, 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'), sc.time_start;
  `;

  db.query(query, [studentId], (err, results) => {
    if (err) {
      console.error('Error fetching student schedules:', err);
      res.status(500).send('Error fetching student schedules');
    } else {
      res.json(results);
    }
  });
});

app.get('/student/:userId/school-years', (req, res) => {
  const { userId } = req.params;

  // Validate input
  if (!userId) {
    return res.status(400).json({ success: false, message: 'User ID is required.' });
  }

  try {
    // SQL query to get only the school years where the student is enrolled
    const query = `
      SELECT DISTINCT sy.school_year_id, sy.school_year 
      FROM school_year sy
      INNER JOIN enrollment e ON sy.school_year_id = e.school_year_id
      INNER JOIN student s ON e.student_id = s.student_id
      WHERE s.user_id = ?
      ORDER BY sy.school_year DESC
    `;

    // Execute the query
    db.query(query, [userId], (err, results) => {
      if (err) {
        console.error('Error executing query:', err);
        return res.status(500).json({ success: false, message: 'Database error occurred.' });
      }

      res.status(200).json(results);
    });
  } catch (error) {
    console.error('Unexpected error:', error);
    res.status(500).json({ success: false, message: 'An unexpected error occurred.' });
  }
});

// Endpoint to get grade_level based on school_year_id and student_id
app.get('/get-grade-level/:student_id', (req, res) => {
  const { student_id } = req.params;

  const query = `
    SELECT a.grade_level, b.school_year, b.school_year_id
    FROM enrollment a 
    LEFT JOIN school_year b 
    ON a.school_year_id = b.school_year_id 
    WHERE a.student_id = ? ORDER BY school_year_id DESC
  `;

  db.query(query, [student_id], (err, results) => {
    if (err) {
      console.error('Error fetching grade level:', err);
      return res.status(500).json({ error: 'Internal server error' });
    }

    if (results.length === 0) {
      return res.status(404).json({ message: 'No enrollment data found' });
    }

    res.json(results); // Send full list, not just the first result
  });
});

app.get('/api/student/:student_id/brigada-remarks', async (req, res) => {
  const { student_id } = req.params;

  try {
    // Query to get the brigada remarks from the brigada_details table
    const query = 'SELECT remarks FROM brigada_details WHERE student_id = ?';
    const [rows] = await db.execute(query, [student_id]);

    // If no remarks found
    if (rows.length === 0) {
      return res.status(404).json({ message: 'No remarks found' });
    }

    res.json({ remarks: rows[0].remarks });  // Send the remarks in response
  } catch (error) {
    console.error('Error fetching brigada remarks:', error);
    res.status(500).json({ message: 'Server error' });
  }
});


app.get('/students/by-adviser', (req, res) => {
  const { user_id, searchTerm, grade, section, school_year } = req.query;

  if (!user_id) {
    return res.status(400).json({ error: 'Missing user_id' });
  }

  // Step 1: Get employee_id from user_id
  const getEmployeeIdQuery = 'SELECT employee_id FROM employee WHERE user_id = ? LIMIT 1';
  db.query(getEmployeeIdQuery, [user_id], (err, empResult) => {
    if (err) {
      console.error('Error fetching employee_id:', err);
      return res.status(500).json({ error: 'Failed to fetch employee_id' });
    }

    if (empResult.length === 0) {
      return res.status(404).json({ error: 'Employee not found' });
    }

    const employee_id = empResult[0].employee_id;

    // Step 2: Get active school year if not provided
    let latestSchoolYear = school_year;

    function fetchStudents() {
      let query = `
        SELECT s.student_id, s.user_id, s.lrn, s.section_id,
        CONCAT(s.lastname, ', ', s.firstname, ' ', 
        IF(s.middlename IS NOT NULL AND s.middlename != '', CONCAT(LEFT(s.middlename, 1), '.'), '')) AS stud_name,
        s.lastname, s.firstname, s.middlename, 
        s.current_yr_lvl, DATE_FORMAT(s.birthdate, '%M %e, %Y') AS birthdate, s.gender, s.age, 
        s.home_address, s.barangay, s.city_municipality, s.province, 
        s.contact_number, s.email_address, z.section_name, sy.school_year, sy.school_year_id,
        s.mother_name, s.father_name, s.parent_address, s.father_occupation, 
        s.mother_occupation, FORMAT(s.annual_hshld_income,2) AS annual_hshld_income, s.number_of_siblings, 
        s.father_educ_lvl, s.mother_educ_lvl, s.father_contact_number, 
        s.mother_contact_number, bd.brigada_status AS brigada_eskwela,
        s.emergency_number, s.emergency_contactperson,
          (SELECT ss.status FROM student_school_year ss
          JOIN school_year sy ON ss.school_year_id = sy.school_year_id
          WHERE ss.student_id = s.student_id AND sy.status = 'active' LIMIT 1) as active_status,
          se.enrollment_status, se.student_elective_id
        FROM student s
        LEFT JOIN student_elective se ON s.student_id = se.student_id
        LEFT JOIN section z ON s.section_id = z.section_id
        LEFT JOIN student_school_year ss ON s.student_id = ss.student_id
        LEFT JOIN school_year sy ON ss.school_year_id = sy.school_year_id
        LEFT JOIN section_assigned zz on z.section_id = zz.section_id
        LEFT JOIN brigada_details bd ON s.brigada_id=bd.brigada_id
        WHERE s.active_status = 'unarchive' AND zz.employee_id = ?
      `;

      const queryParams = [employee_id];
      const conditions = [];

      if (searchTerm) {
        conditions.push(`(s.firstname LIKE ? OR s.lastname LIKE ? OR s.student_id LIKE ? OR s.lrn LIKE ?)`);
        queryParams.push(`%${searchTerm}%`, `%${searchTerm}%`, `%${searchTerm}%`, `%${searchTerm}%`);
      }
      if (grade) {
        conditions.push(`s.current_yr_lvl = ?`);
        queryParams.push(grade);
      }
      if (section) {
        conditions.push(`z.section_name = ?`);
        queryParams.push(section);
      }
      if (latestSchoolYear) {
        conditions.push(`sy.school_year = ?`);
        queryParams.push(latestSchoolYear);
      }

      if (conditions.length > 0) {
        query += ' AND ' + conditions.join(' AND ');
      }

      query += ' GROUP BY s.student_id ORDER BY s.lastname ASC';

      console.log('Adviser SQL Query:', query);
      console.log('Params:', queryParams);

      db.query(query, queryParams, (err, results) => {
        if (err) {
          console.error('Error fetching students:', err);
          return res.status(500).json({ error: 'Failed to fetch students' });
        }

        res.json(results);
      });
    }

    // If school_year not provided, fetch active one
    if (!school_year) {
      const getActiveSY = `SELECT school_year FROM school_year WHERE status = 'active' LIMIT 1`;
      db.query(getActiveSY, (err, result) => {
        if (err) {
          console.error('Error getting active school year:', err);
          return res.status(500).json({ error: 'Failed to get active school year' });
        }

        latestSchoolYear = result[0]?.school_year;
        if (!latestSchoolYear) {
          return res.status(404).json({ error: 'No active school year found' });
        }

        fetchStudents();
      });
    } else {
      fetchStudents();
    }
  });
});

// Backend Route
// Backend Route
app.get('/sections/by-adviser/:user_id', (req, res) => {
  const { user_id } = req.params;  // Correctly retrieve user_id from route parameters
  const { searchTerm, grade, showArchive, schoolYearId } = req.query;

  if (!user_id) {
    return res.status(400).json({ error: 'Missing user_id in request' });
  }

  // Step 1: Get employee_id from user_id
  const getEmployeeQuery = 'SELECT employee_id FROM employee WHERE user_id = ? LIMIT 1';
  db.query(getEmployeeQuery, [user_id], (empErr, empResult) => {
    if (empErr) {
      console.error('Error fetching employee_id:', empErr);
      return res.status(500).json({ error: 'Internal server error (employee lookup)' });
    }

    if (empResult.length === 0) {
      return res.status(404).json({ error: 'Employee not found for provided user_id' });
    }

    const employeeId = empResult[0].employee_id;
    // Step 2: Get sections based on employee_id
    let query = `
      SELECT s.section_id, s.section_name, s.grade_level, s.status, s.max_capacity, 
             sy.school_year, s.archive_status, s.room_number,
             MAX(CASE WHEN b.section_id IS NOT NULL THEN '1' ELSE '0' END) AS hasSched
      FROM section s
      JOIN school_year sy ON s.school_year_id = sy.school_year_id
      LEFT JOIN schedule b ON s.section_id = b.section_id AND s.grade_level = b.grade_level
      LEFT JOIN section_assigned c ON s.section_id = c.section_id AND s.grade_level = c.level
      WHERE sy.status = 'active' AND c.employee_id = ?
    `;

    const queryParams = [employeeId];

    // Apply filters if provided
    if (searchTerm) {
      query += ' AND s.section_name LIKE ?';
      queryParams.push(`%${searchTerm}%`);
    }

    if (grade) {
      query += ' AND s.grade_level = ?';
      queryParams.push(grade);
    }

    if (showArchive) {
      query += ' AND s.archive_status = ?';
      queryParams.push(showArchive);
    }

    if (schoolYearId) {
      query += ' AND sy.school_year = ?';
      queryParams.push(schoolYearId);
    }

    query += ' GROUP BY s.section_name, s.grade_level';

    console.log('📤 Executing section query with params:', queryParams);
    console.log('📤 Final SQL query:', query);  // Log the final query for debugging

    db.query(query, queryParams, (err, results) => {
      if (err) {
        console.error('❌ Error fetching sections:', err);
        return res.status(500).json({ error: 'Internal server error' });
      }

      if (results.length === 0) {
        console.log('⚠️ No sections found for employee_id:', employeeId);
        return res.status(404).json({ error: 'No sections found for this adviser' });
      }

      console.log('✅ Sections found:', results);
      res.json(results);
    });
  });
});

// GET schedules by adviser for a specific section
app.get('/sections/:sectionId/schedules/by-adviser', (req, res) => {
  const { user_id } = req.query;
  const { sectionId } = req.params;

  if (!user_id) {
    return res.status(400).json({ error: 'user_id is required' });
  }

  const getEmployeeIdQuery = 'SELECT employee_id FROM employee WHERE user_id = ? LIMIT 1';
  db.query(getEmployeeIdQuery, [user_id], (err, empResult) => {
    if (err) {
      console.error('❌ Error fetching employee_id:', err);
      return res.status(500).json({ error: 'Failed to fetch employee_id' });
    }

    if (empResult.length === 0) {
      console.warn('⚠️ No employee found for user_id:', user_id);
      return res.status(404).json({ error: 'Employee not found' });
    }

    const employee_id = empResult[0].employee_id;
    console.log('✅ Found employee_id:', employee_id);

    // Modified query that handles both regular subjects and elective subjects directly
    const scheduleQuery = `
    SELECT 
      sc.schedule_id, 
      sc.teacher_id, 
      sb.subject_name, 
      TIME_FORMAT(sc.time_start, '%h:%i %p') AS time_start, 
      TIME_FORMAT(sc.time_end, '%h:%i %p') AS time_end, 
      sc.day, 
      sc.section_id, 
      s.section_name, 
      sc.schedule_status,
      CONCAT(
        emp.firstname, ' ', 
        IF(emp.middlename IS NOT NULL AND emp.middlename != '', 
          CONCAT(LEFT(emp.middlename, 1), '. '), ''), 
        emp.lastname
      ) AS teacher_name
    FROM schedule sc
    LEFT JOIN subject sb ON sc.subject_id = sb.subject_id
    LEFT JOIN employee emp ON sc.teacher_id = emp.employee_id
    LEFT JOIN section s ON sc.section_id = s.section_id
    WHERE sc.section_id = ?
    ORDER BY sc.time_start`;

    db.query(scheduleQuery, [sectionId], (err, schedules) => {
      if (err) {
        console.error('❌ Error fetching section schedules:', err);
        return res.status(500).json({ error: 'Failed to fetch schedules' });
      }

      console.log('✅ Schedules retrieved:', schedules.length);
      res.json(schedules);
    });
  });
});


app.get('/sections/by-class-adviser', (req, res) => {
  const userId = req.query.user_id;
  const { searchTerm, grade, showArchive } = req.query;

  console.log('Received user_id:', userId);  // Log the incoming user_id.

  if (!userId) {
    return res.status(400).json({ error: 'Missing user_id in query' });
  }

  const getEmployeeIdQuery = 'SELECT employee_id FROM employee WHERE user_id = ? LIMIT 1';

  db.query(getEmployeeIdQuery, [userId], (err, employeeResult) => {
    if (err) {
      console.error('Error fetching employee_id:', err);
      return res.status(500).json({ error: 'Failed to fetch employee ID', details: err });
    }

    console.log('Employee lookup result:', employeeResult);  // Log query result.

    if (employeeResult.length === 0) {
      return res.status(404).json({ error: 'Employee not found for this user' });
    }

    const employeeId = employeeResult[0].employee_id;

    let query = `SELECT s.section_id, s.section_name, s.grade_level, s.status, s.max_capacity, sy.school_year, s.archive_status, s.room_number,
        MAX(CASE WHEN b.section_id IS NOT NULL THEN '1' ELSE '0' END) AS hasSched
      FROM section s
      JOIN school_year sy ON s.school_year_id = sy.school_year_id
      LEFT JOIN schedule b on s.section_id = b.section_id AND s.grade_level = b.grade_level
      LEFT JOIN section_assigned c ON s.section_id = c.section_id AND s.grade_level = c.level
      WHERE sy.status = 'active' AND c.employee_id = ?`;

    const queryParams = [employeeId];

    if (searchTerm) {
      query += ' AND s.section_name LIKE ?';
      queryParams.push(`%${searchTerm}%`);
    }

    if (grade) {
      query += ' AND s.grade_level = ?';
      queryParams.push(grade);
    }

    if (showArchive) {
      query += ' AND s.archive_status = ?';
      queryParams.push(showArchive);
    }

    query += ' GROUP BY s.section_name, s.grade_level';

    db.query(query, queryParams, (err, results) => {
      if (err) {
        console.error('Error fetching sections:', err);
        return res.status(500).json({ error: 'Internal server error', details: err });
      }
      console.log('Query results:', results);  // Log query results.
      res.json(results);
    });
  });
});


app.get('/subjects/by-coordinator/:user_id', (req, res) => {
  const { user_id } = req.params;  // Get user_id from URL path
  const { searchTerm, school_year, grade, archive_status } = req.query;

  console.log('Received filters:', req.query);
  console.log('User ID:', user_id);

  if (!user_id) {
    return res.status(400).json({ error: 'Missing user_id in request' });
  }

  // Step 1: Get employee_id from user_id
  const getEmployeeQuery = 'SELECT employee_id FROM employee WHERE user_id = ? LIMIT 1';
  db.query(getEmployeeQuery, [user_id], (empErr, empResult) => {
    if (empErr) {
      console.error('Error fetching employee_id:', empErr);
      return res.status(500).json({ error: 'Internal server error (employee lookup)' });
    }

    if (empResult.length === 0) {
      return res.status(404).json({ error: 'Employee not found for provided user_id' });
    }

    const employeeId = empResult[0].employee_id;

    // --- Query building ---
    const queryParams = [];
    let whereClause = ' WHERE 1=1'; // Base WHERE clause for both subject and elective queries

    // Archive status for regular subjects
    whereClause += ' AND s.archive_status = ?';
    queryParams.push('unarchive'); // For regular subjects

    // Search term (subject_name) for both subject and elective
    if (searchTerm && searchTerm.trim() !== '') {
      whereClause += ' AND (LOWER(s.subject_name) LIKE LOWER(?) OR LOWER(e.name) LIKE LOWER(?))';
      queryParams.push(`%${searchTerm}%`, `%${searchTerm}%`);
    }

    // Grade level filter for subject only
    if (grade) {
      whereClause += ' AND s.grade_level = ?';
      queryParams.push(grade);
    }

    // School year filter for subject only
    if (school_year) {
      whereClause += ' AND sy.school_year = ?';
      queryParams.push(school_year);
    }

    // Main query logic
    const mainQuery = `
      SELECT * FROM (
        -- Regular subjects
        SELECT 
            s.subject_id,
            s.grade_level,
            s.subject_name,
            s.status,
            s.grading_criteria,
            s.description,
            s.archive_status,
            s.school_year_id,
            sy.school_year,
            sy.status AS sy_status,
            0 AS elective_id,
            sch.employee_id, 
            MAX(CASE WHEN sch.subject_id IS NOT NULL THEN '1' ELSE '0' END) AS hasSched
        FROM SUBJECT s
        LEFT JOIN school_year sy ON s.school_year_id = sy.school_year_id
        LEFT JOIN (
            SELECT DISTINCT subject_id, employee_id
            FROM subject_assigned
            WHERE elective = 0
        ) sch ON s.subject_id = sch.subject_id
        ${whereClause}  -- Filters for regular subject
        GROUP BY 
            s.subject_id, s.grade_level, s.subject_name, s.status, s.grading_criteria,
            s.description, s.archive_status, s.school_year_id, sy.school_year, sy.status, sch.employee_id

        UNION

        -- Elective subjects
        SELECT 
            e.elective_id AS subject_id,
            NULL AS grade_level,
            e.name AS subject_name,
            e.status,
            NULL AS grading_criteria,
            NULL AS description,
            e.archive_status,
            NULL AS school_year_id,
            NULL AS school_year,
            e.status AS sy_status,
            e.elective_id,
            sch.employee_id,
            MAX(CASE WHEN sch.subject_id IS NOT NULL THEN '1' ELSE '0' END) AS hasSched
        FROM elective e
        LEFT JOIN (
            SELECT DISTINCT subject_id, employee_id
            FROM subject_assigned
            WHERE elective = 1
        ) sch ON e.elective_id = sch.subject_id
        WHERE e.archive_status = 'unarchive'  -- Filter for elective subjects
        GROUP BY 
            e.elective_id, e.name, e.status, e.archive_status, sch.employee_id
      ) combined
      WHERE employee_id = ? 
      ORDER BY grade_level DESC, subject_name ASC;
    `;

    // Add the final parameter for teacher_id
    queryParams.push(employeeId);

    console.log('Query:', mainQuery);
    console.log('Parameters:', queryParams);

    // Execute the query
    db.query(mainQuery, queryParams, (error, results) => {
      if (error) {
        console.error('Error fetching subjects:', error);
        return res.status(500).json({ error: 'Internal server error' });
      }

      if (results.length === 0) {
        return res.status(404).json({ error: 'No subjects found matching the criteria' });
      }

      res.json(results);
    });
  });
});


app.get('/students/by-teacher', (req, res) => {
  const { user_id, searchTerm, grade, section, school_year } = req.query;

  if (!user_id) {
    return res.status(400).json({ error: 'Missing user_id' });
  }

  // Step 1: Get employee_id from user_id
  const getEmployeeIdQuery = 'SELECT employee_id FROM employee WHERE user_id = ? LIMIT 1';
  db.query(getEmployeeIdQuery, [user_id], (err, empResult) => {
    if (err) {
      console.error('Error fetching employee_id:', err);
      return res.status(500).json({ error: 'Failed to fetch employee_id' });
    }

    if (empResult.length === 0) {
      return res.status(404).json({ error: 'Employee not found' });
    }

    const employee_id = empResult[0].employee_id;

    // Step 2: Get active school year if not provided
    let latestSchoolYear = school_year;

    function fetchStudents() {
      let query = `
        SELECT s.student_id, s.user_id, s.lrn, s.section_id,
        CONCAT(s.lastname, ', ', s.firstname, ' ', 
        IF(s.middlename IS NOT NULL AND s.middlename != '', CONCAT(LEFT(s.middlename, 1), '.'), '')) AS stud_name,
        s.lastname, s.firstname, s.middlename, 
        s.current_yr_lvl, DATE_FORMAT(s.birthdate, '%M %e, %Y') AS birthdate, s.gender, s.age, 
        s.home_address, s.barangay, s.city_municipality, s.province, 
        s.contact_number, s.email_address, z.section_name, sy.school_year, sy.school_year_id,
        s.mother_name, s.father_name, s.parent_address, s.father_occupation, 
        s.mother_occupation, FORMAT(s.annual_hshld_income,2) AS annual_hshld_income, s.number_of_siblings, 
        s.father_educ_lvl, s.mother_educ_lvl, s.father_contact_number, 
        s.mother_contact_number, bd.brigada_status AS brigada_eskwela,
        s.emergency_number, s.emergency_contactperson,
        (SELECT ss.status FROM student_school_year ss
        JOIN school_year sy ON ss.school_year_id = sy.school_year_id
        WHERE ss.student_id = s.student_id AND sy.status = 'active' LIMIT 1) AS active_status,
        se.enrollment_status, se.student_elective_id
        FROM student s
        LEFT JOIN student_elective se ON s.student_id = se.student_id
        LEFT JOIN section z ON s.section_id = z.section_id
        LEFT JOIN student_school_year ss ON s.student_id = ss.student_id
        LEFT JOIN school_year sy ON ss.school_year_id = sy.school_year_id
        LEFT JOIN teacher_subject d ON z.grade_level=d.level AND z.section_id=d.section_id AND d.school_year_id=z.school_year_id
        LEFT JOIN brigada_details bd ON s.brigada_id=bd.brigada_id
        WHERE s.active_status = 'unarchive' AND d.employee_id = ?
      `;

      const queryParams = [employee_id];
      const conditions = [];

      if (searchTerm) {
        conditions.push(`(s.firstname LIKE ? OR s.lastname LIKE ? OR s.student_id LIKE ? OR s.lrn LIKE ?)`);
        queryParams.push(`%${searchTerm}%`, `%${searchTerm}%`, `%${searchTerm}%`, `%${searchTerm}%`);
      }
      if (grade) {
        conditions.push(`s.current_yr_lvl = ?`);
        queryParams.push(grade);
      }
      if (section) {
        conditions.push(`z.section_name = ?`);
        queryParams.push(section);
      }
      if (latestSchoolYear) {
        conditions.push(`sy.school_year = ?`);
        queryParams.push(latestSchoolYear);
      }

      if (conditions.length > 0) {
        query += ' AND ' + conditions.join(' AND ');
      }

      query += ' GROUP BY s.student_id ORDER BY s.lastname ASC';

      console.log('Adviser SQL Query:', query);
      console.log('Params:', queryParams);

      db.query(query, queryParams, (err, results) => {
        if (err) {
          console.error('Error fetching students:', err);
          return res.status(500).json({ error: 'Failed to fetch students' });
        }

        res.json(results);
      });
    }

    // If school_year not provided, fetch active one
    if (!school_year) {
      const getActiveSY = `SELECT school_year FROM school_year WHERE status = 'active' LIMIT 1`;
      db.query(getActiveSY, (err, result) => {
        if (err) {
          console.error('Error getting active school year:', err);
          return res.status(500).json({ error: 'Failed to get active school year' });
        }

        latestSchoolYear = result[0]?.school_year;
        if (!latestSchoolYear) {
          return res.status(404).json({ error: 'No active school year found' });
        }

        fetchStudents();
      });
    } else {
      fetchStudents();
    }
  });
});

app.get('/students/apply-enrollment', (req, res) => {
  const { searchID, searchTerm, grade, section, school_year } = req.query;

  console.log('Received filters:', { searchID, searchTerm, grade, section, school_year });

  // Query to fetch the active school year (ONLY IF school_year is not provided AND searchID is also not provided)
  let latestSchoolYear = school_year; // Default to user-provided school_year
  if (!school_year && !searchID) { // Only fetch active year if no school_year is selected AND no searchID
    const getActiveSchoolYearQuery = `SELECT school_year FROM school_year WHERE status = 'active' LIMIT 1`;

    db.query(getActiveSchoolYearQuery, (err, results) => {
      if (err) {
        console.error('Error fetching active school year:', err);
        res.status(500).json({ error: 'Failed to fetch active school year' });
        return;
      }

      latestSchoolYear = results[0]?.school_year;
      if (!latestSchoolYear) {
        console.error('No active school year found');
        res.status(404).json({ error: 'No active school year found' });
        return;
      }
      console.log('Using active school year:', latestSchoolYear);
      fetchStudents();
    });
  } else {
    fetchStudents();
  }

  function fetchStudents() {
    let query = `
      SELECT * FROM(SELECT s.student_id, s.user_id, s.lrn, s.section_id,
      CONCAT(s.lastname, ', ', s.firstname, ' ', 
      IF(s.middlename IS NOT NULL AND s.middlename != '', CONCAT(LEFT(s.middlename, 1), '.'), '')) AS stud_name,
      s.lastname, s.firstname, s.middlename, 
      s.current_yr_lvl, DATE_FORMAT(s.birthdate, '%M %e, %Y') AS birthdate, s.gender, s.age, 
      s.home_address, s.barangay, s.city_municipality, s.province, 
      s.contact_number, s.email_address, z.section_name, sy.school_year, sy.school_year_id,
      s.mother_name, s.father_name, s.parent_address, s.father_occupation, 
      s.mother_occupation, FORMAT(s.annual_hshld_income,2) AS annual_hshld_income, s.number_of_siblings, 
      s.father_educ_lvl, s.mother_educ_lvl, s.father_contact_number, 
      s.mother_contact_number, bd.brigada_status AS brigada_eskwela,
      s.emergency_number, s.emergency_contactperson,
      (SELECT ss.enrollment_status FROM enrollment ss
      JOIN school_year sy ON ss.school_year_id = sy.school_year_id
      WHERE ss.student_id = s.student_id AND sy.status = 'active' LIMIT 1) as active_status,
      se.enrollment_status, se.student_elective_id
      FROM student s
      LEFT JOIN student_elective se ON s.student_id = se.student_id
      LEFT JOIN section z ON s.section_id=z.section_id
      LEFT JOIN student_school_year ss ON s.student_id = ss.student_id
      LEFT JOIN school_year sy ON ss.school_year_id = sy.school_year_id
      LEFT JOIN brigada_details bd ON s.brigada_id=bd.brigada_id
      WHERE s.active_status = 'unarchive' ) a WHERE active_status = 'inactive'
    `;

    const queryParams = [];
    const conditions = [];

    // ✅ If searchID is used, it should work independently
    if (searchID) {
      conditions.push(`student_id = ?`);
      queryParams.push(searchID);
    } else {
      // ✅ Apply filters only if searchID is NOT used
      if (searchTerm) {
        conditions.push(`(firstname LIKE ? OR lastname LIKE ? OR student_id LIKE ? )`);
        queryParams.push(`%${searchTerm}%`, `%${searchTerm}%`, `%${searchTerm}%`);
      }
      if (grade) {
        conditions.push(`current_yr_lvl = ?`);
        queryParams.push(grade);
      }
      if (section) {
        conditions.push(`section_name = ?`);
        queryParams.push(section);
      }
      if (latestSchoolYear) {
        conditions.push(`school_year = ?`);
        queryParams.push(latestSchoolYear);
      }
    }

    if (conditions.length > 0) {
      query += ' AND ' + conditions.join(' AND ');
    }

    // ✅ Move GROUP BY to the end before ORDER BY
    query += ' GROUP BY student_id ORDER BY lastname ASC';

    console.log('Final SQL Query:', query);
    console.log('With parameters:', queryParams);

    // ✅ Execute the main query
    db.query(query, queryParams, (err, results) => {
      if (err) {
        console.error('Error fetching students:', err);
        res.status(500).json({ error: 'Internal server error' });
        return;
      }
      res.json(results);
    });
  }
});

// Endpoint to get students available for enrollment
// Function: Fetches students who are registered but not actively enrolled
// Pages: EnrollStudentManagement.js
app.get('/students/available-for-enrollment', (req, res) => {
  console.log('Fetching students available for enrollment');
  
  const query = `
  SELECT e.student_id, e.student_name, e.grade_level, e.school_year_id, e.enrollment_status
  FROM enrollment e
  WHERE e.enrollment_status = 'inactive'
  AND e.grade_level != 10
  AND e.school_year_id = (
      SELECT MAX(sy.school_year_id)
      FROM school_year sy
      WHERE sy.status = 'inactive'
  )
  AND e.student_id IN (
      SELECT student_id
      FROM enrollment
      GROUP BY student_id
      HAVING COUNT(*) >= 1 
  )
  AND NOT EXISTS (
      SELECT 1
      FROM enrollment e2
      WHERE e2.student_id = e.student_id
        AND e2.enrollment_status IN ('pending','active')
  );
  `;
  
  db.query(query, (err, results) => {
    if (err) {
      console.error('Error fetching available students:', err);
      res.status(500).json({ error: 'Database error' });
      return;
    }
    
    console.log(`Found ${results.length} students available for enrollment`);
    res.json(results);
  });
});

// Endpoint to enroll a student
// Function: Updates a student's enrollment status to 'active' for the current school year
// Pages: EnrollStudentManagement.js
app.put('/students/:studentId/enroll-student', (req, res) => {
  const studentId = req.params.studentId;
  const { school_year, status, grade_level } = req.body;

  console.log(`Enrolling student ID: ${studentId} for school year: ${school_year} with status: ${status}`);

  // First, get the school year ID from the school_year table
  const getSchoolYearQuery = 'SELECT school_year_id FROM school_year WHERE status = "active"';

  db.query(getSchoolYearQuery, (err, schoolYearResults) => {
    if (err) {
      console.error('Error fetching school year ID:', err);
      return res.status(500).json({ error: 'Database error' });
    }

    if (schoolYearResults.length === 0) {
      console.error(`School year '${school_year}' not found or not active`);
      return res.status(404).json({ error: 'School year not found or not active' });
    }

    const schoolYearId = schoolYearResults[0].school_year_id;

    // Now, fetch the student_name using the student_id
    const getStudentNameQuery = `
      SELECT CONCAT(firstname, ' ', LEFT(IFNULL(middlename, ''), 1), '.', ' ', lastname) AS student_name,
      brigada_id 
      FROM student 
      WHERE student_id = ?
    `;
    
    db.query(getStudentNameQuery, [studentId], (err, studentResults) => {
      if (err) {
        console.error('Error fetching student name:', err);
        return res.status(500).json({ error: 'Database error fetching student name' });
      }

      if (studentResults.length === 0) {
        console.error(`Student with ID ${studentId} not found`);
        return res.status(404).json({ error: 'Student not found' });
      }

      const student_name = studentResults[0].student_name;
      const brigada_id= studentResults[0].brigada_id;

      // First, insert into `enrollment`
      const insertEnrollmentQuery = `
        INSERT INTO enrollment (student_id, school_year_id, enrollee_type, enrollment_status, enrollment_date, grade_level, student_name, brigada_id)
        VALUES (?, ?, 'Regular', 'pending', NOW(), ?, ?, 1)
      `;

      db.query(insertEnrollmentQuery, [studentId, schoolYearId, grade_level, student_name, brigada_id], (err) => {
        if (err) {
          console.error('Error creating enrollment:', err);
          return res.status(500).json({ error: 'Database error during enrollment' });
        }

        // Then insert into `student_school_year` including grade_level
        const insertSSYQuery = `
          INSERT INTO student_school_year (student_id, school_year_id, status, student_name, grade_level)
          VALUES (?, ?, 'pending', ?, ?)
        `;

        db.query(insertSSYQuery, [studentId, schoolYearId, student_name, grade_level], (err) => {
          if (err) {
            console.error('Error creating student_school_year:', err);
            return res.status(500).json({ error: 'Database error during student_school_year insert' });
          }

          console.log(`Successfully enrolled student ID: ${studentId}`);
          return res.json({ message: 'Student enrolled successfully' });
        });
      });
    });
  });
});



app.get('/list-subject-teacher', (req, res) => {

  let query = `
    SELECT CONCAT(firstname,' ',LEFT(IFNULL(middlename,''),1),' ',lastname) AS teacher, 
    employee_id FROM employee WHERE role_name = 'subject_teacher'
  `;

  db.query(query, (err, results) => {
    if (err) {
      console.error('Error fetching employees:', err);
      res.status(500).json({ error: 'Internal server error' });
      return;
    }
    console.log('Results:', results); // ✅ Check if emp_name exists
    res.json(results);
  });
});

app.put('/cron/level-up-students', (req, res) => {
  const activeStudentsQuery = `
    SELECT e.student_id, e.section_id, e.grade_level, e.enrollment_status 
    FROM enrollment e
    LEFT JOIN school_year sy ON e.school_year_id = sy.school_year_id
    WHERE sy.status = 'active'
  `;

  db.query(activeStudentsQuery, (err, results) => {
    if (err) {
      console.error('Error fetching active enrolled students:', err);
      return res.status(500).json({ error: 'Database error fetching students' });
    }

    if (results.length === 0) {
      return res.status(200).json({ message: 'No active students found to level up' });
    }

    let updatesCompleted = 0;

    results.forEach((student) => {
      const { student_id, section_id, grade_level } = student;
      const newGradeLevel = parseInt(grade_level);
      const newStatus = 'active'; // you can change this as needed

      const updateStudentQuery = `
        UPDATE student 
        SET current_yr_lvl = ?, 
            section_id = ?, 
            status = ?
        WHERE student_id = ?
      `;

      const values = [newGradeLevel, section_id, newStatus, student_id];

      db.query(updateStudentQuery, values, (updateErr) => {
        if (updateErr) {
          console.error(`Error updating student ID ${student_id}:`, updateErr);
          // Log or store error if needed
        }

        updatesCompleted++;

        if (updatesCompleted === results.length) {
          // When all students are processed, run the 2 update queries
          const updateEnrollmentQuery = `
            UPDATE enrollment 
            SET enrollment_status = CASE 
              WHEN school_year_id IN (SELECT school_year_id FROM school_year WHERE status = 'inactive') THEN 'inactive'
              ELSE enrollment_status
            END
          `;

          const updateStudentSchoolYearQuery = `
            UPDATE student_school_year 
            SET status = CASE 
              WHEN school_year_id IN (SELECT school_year_id FROM school_year WHERE status = 'inactive') THEN 'inactive'
              ELSE status
            END
          `;

          db.query(updateEnrollmentQuery, (enrollmentErr) => {
            if (enrollmentErr) {
              console.error('Error updating enrollment statuses:', enrollmentErr);
              return res.status(500).json({ error: 'Failed to update enrollment statuses' });
            }

            db.query(updateStudentSchoolYearQuery, (ssyErr) => {
              if (ssyErr) {
                console.error('Error updating student_school_year statuses:', ssyErr);
                return res.status(500).json({ error: 'Failed to update student_school_year statuses' });
              }

              res.status(200).json({ message: 'All students leveled up and statuses updated successfully' });
            });
          });
        }
      });
    });
  });
});

app.get('/list-elective', (req, res) => {
  const query = `
    SELECT subject_id as elective_id,  subject_name AS elective_name 
    FROM subject 
    WHERE STATUS = 'active' AND elective='Y' 
    AND school_year_id IN (
      SELECT school_year_id 
      FROM school_year 
      WHERE STATUS = 'active'
    )
  `;

  db.query(query, (err, results) => {
    if (err) {
      console.error('Error fetching active electives:', err);
      return res.status(500).json({ error: 'Database error' });
    }
    res.json(results);
  });
});

//REPORTS
//SF 2
app.get('/api/sf2-enrollment', (req, res) => {
  const schoolYearId = req.query.school_year_id;

  const query = `
    SELECT 
      CONCAT('Grade',' ',e.grade_level) as grade_level,
      COUNT(CASE WHEN s.gender = 'Male' THEN 1 END) AS male_count,
      COUNT(CASE WHEN s.gender = 'Female' THEN 1 END) AS female_count,
      COUNT(*) AS total,
      sy.school_year
    FROM enrollment e
    LEFT JOIN student s ON e.student_id = s.student_id
    LEFT JOIN school_year sy ON e.school_year_id=sy.school_year_id
    WHERE e.school_year_id = ?
    GROUP BY e.grade_level
    ORDER BY e.grade_level
  `;

  db.query(query, [schoolYearId], (err, results) => {
    if (err) {
      console.error('Error fetching SF2 data:', err);
      return res.status(500).send('Error fetching data');
    }

    let totalMale = 0;
    let totalFemale = 0;
    const grades = {};

    results.forEach(row => {
      grades[row.grade_level] = {
        male: row.male_count,
        female: row.female_count
      };
      totalMale += row.male_count;
      totalFemale += row.female_count;
    });

    res.json({
      grades,
      totalMale,
      totalFemale,
      grandTotal: totalMale + totalFemale,
      schoolYear: results[0]?.school_year // Assume school_year is the same for all grades
    });
  });
});

app.get('/api/class_list', (req, res) => {
  const { school_year_id, grade_level, section_id } = req.query;

  if (!school_year_id || !grade_level || !section_id) {
    return res.status(400).json({ message: 'Missing required query parameters.' });
  }

  // First query - class info
  db.query(
    `SELECT 
      sy.school_year, 
      CONCAT(em.firstname, ' ', LEFT(IFNULL(em.middlename, ''), 1), '.', em.lastname) AS class_adviser, 
      CONCAT('Grade ', e.grade_level, ' - ', s.section_name) AS grade_section, 
      DATE_FORMAT(CURDATE(), '%m/%d/%Y') AS date_generated
    FROM enrollment e 
    LEFT JOIN section s ON e.section_id = s.section_id 
    LEFT JOIN employee em ON s.section_adviser = em.employee_id 
    LEFT JOIN school_year sy ON e.school_year_id = sy.school_year_id 
    WHERE e.school_year_id = ? AND e.grade_level = ? AND e.section_id = ?
    LIMIT 1`,
    [school_year_id, grade_level, section_id],
    (error, classInfo) => {
      if (error) {
        console.error('Error in /api/class_list (classInfo query):', error);
        return res.status(500).json({ message: 'Server error', error });
      }

      // Second query - student list
      db.query(
        `SELECT 
          s.lrn, 
          CONCAT(s.lastname, ', ', s.firstname, ' ', LEFT(IFNULL(s.middlename, ''), 1), '.') AS student_name, 
          s.gender, 
          s.home_address, 
          s.contact_number,
          s.age,
          DATE_FORMAT(s.birthdate, '%Y-%m-%d') AS birthdate, 
          IF(s.father_name = '', s.mother_name, s.father_name) AS parent_name, 
          IF(s.father_contact_number = '', s.mother_contact_number, s.father_contact_number) AS parent_contact_no,
          s.father_name, s.mother_name, DATE_FORMAT(e.enrollment_date, '%Y-%m-%d') AS enrollment_date, IF(e.enrollment_status='active','Enrolled','Not Enrolled') enrollment_status
        FROM enrollment e 
        LEFT JOIN student s ON e.student_id = s.student_id 
        WHERE e.grade_level = ? AND e.section_id = ? AND e.school_year_id = ?`,
        [grade_level, section_id, school_year_id],
        (error, students) => {
          if (error) {
            console.error('Error in /api/class_list (students query):', error);
            return res.status(500).json({ message: 'Server error', error });
          }

          res.json({
            classInfo: classInfo[0] || null,
            students
          });
        }
      );
    }
  );
});


app.get('/api/subject-statistics', (req, res) => {
  const { grade_level, section_id, school_year_id, period } = req.query;

  if (!grade_level || !section_id || !school_year_id || !period) {
    return res.status(400).json({ error: 'Missing required query parameters.' });
  }

  const metaInfoQuery = `
    SELECT 
      a.section_name, b.school_year 
    FROM section a
    LEFT JOIN school_year b ON a.school_year_id = b.school_year_id
    WHERE a.section_id = ? AND a.grade_level = ? AND a.school_year_id = ?
  `;

  const subjectStatsQuery = `
    SELECT  
        a.subject_name,
        COUNT(a.student_id) AS total_students,
        MAX(a.grade) AS highest_grade,
        MIN(a.grade) AS lowest_grade,
        ROUND(AVG(a.grade), 2) AS mean_grade,
        ROUND(STDDEV_POP(a.grade), 2) AS standard_deviation,
        SUM(CASE WHEN a.grade BETWEEN 90 AND 100 THEN 1 ELSE 0 END) AS grade_90_100,
        SUM(CASE WHEN a.grade BETWEEN 85 AND 89 THEN 1 ELSE 0 END) AS grade_85_89,
        SUM(CASE WHEN a.grade BETWEEN 75 AND 79 THEN 1 ELSE 0 END) AS grade_75_79,
        SUM(CASE WHEN a.grade < 75 THEN 1 ELSE 0 END) AS grade_below_75
    FROM grades a
    LEFT JOIN subject b ON a.subject_name = b.subject_name
    LEFT JOIN section c ON a.section_id = c.section_id
    WHERE 
        a.grade_level = ?
        AND a.section_id = ?
        AND a.school_year_id = ?
        AND a.period = ?
    GROUP BY a.subject_name
  `;

  // Run metaInfoQuery first
  db.query(metaInfoQuery, [section_id, grade_level, school_year_id], (err, metaResults) => {
    if (err) {
      console.error('Meta info error:', err);
      return res.status(500).json({ error: 'Meta info query failed.' });
    }

    db.query(subjectStatsQuery, [grade_level, section_id, school_year_id, period], (err, subjectResults) => {
      if (err) {
        console.error('Subject stats error:', err);
        return res.status(500).json({ error: 'Subject statistics query failed.' });
      }

      return res.json({
        subjects: subjectResults,
        meta: metaResults[0] || {}
      });
    });
  });
});

app.get('/api/reports/class-honor-roll', (req, res) => {
  const { school_year_id, grade_level, section_id, quarter } = req.query;

  const headerQuery = `
    SELECT 
      sy.school_year, 
      CONCAT(em.firstname, ' ', LEFT(IFNULL(em.middlename, ''), 1), '.', em.lastname) AS class_adviser, 
      CONCAT('Grade ', e.grade_level, ' - ', s.section_name) AS grade_section, 
      DATE_FORMAT(CURDATE(), '%m/%d/%Y') AS date_generated
    FROM enrollment e 
    LEFT JOIN section s ON e.section_id = s.section_id 
    LEFT JOIN employee em ON s.section_adviser = em.employee_id 
    LEFT JOIN school_year sy ON e.school_year_id = sy.school_year_id 
    WHERE e.school_year_id = ? AND e.grade_level = ? AND e.section_id = ?
    LIMIT 1
  `;

  const honorRollQuery = `
    SELECT 
      b.lrn, 
      CONCAT(b.lastname, ', ', b.firstname, ' ', LEFT(IFNULL(b.middlename, ''), 1)) AS stud_name, 
      IF(b.gender = 'Male', 'M', 'F') AS sex, 
      AVG(c.grade) AS general_average,
      CASE
        WHEN AVG(c.grade) >= 90 THEN 'With Highest Honor'
        WHEN AVG(c.grade) >= 85 THEN 'With High Honor'
        WHEN AVG(c.grade) >= 80 THEN 'With Honors'
        ELSE 'No Honors'
      END AS remarks
    FROM 
      enrollment a 
    LEFT JOIN student b ON a.student_id = b.student_id
    LEFT JOIN grades c ON a.student_id = c.student_id
    WHERE 
      a.grade_level = ? AND 
      a.section_id = ? AND 
      a.school_year_id = ? AND 
      c.period = ?
    GROUP BY a.student_id
    ORDER BY general_average DESC
  `;

  db.query(headerQuery, [school_year_id, grade_level, section_id], (err, headerResults) => {
    if (err) {
      console.error('Error fetching header data:', err);
      return res.status(500).json({ error: 'Internal server error' });
    }

    db.query(honorRollQuery, [grade_level, section_id, school_year_id, quarter], (err, results) => {
      if (err) {
        console.error('Error fetching honor roll:', err);
        return res.status(500).json({ error: 'Internal server error' });
      }

      const rankedResults = results.map((student, index) => ({
        ...student,
        rank: index + 1
      }));

      res.json({
        header: headerResults[0],
        honorRoll: rankedResults
      });
    });
  });
});

app.get('/api/reports/subject-statistics', (req, res) => {
  const sectionId = req.query.section_id;
  const gradeLevel = req.query.grade_level;
  const schoolYearId = req.query.school_year_id;

  if (!sectionId || !gradeLevel || !schoolYearId) {
    return res.status(400).json({ error: 'Missing required query parameters' });
  }

  const sectionInfoQuery = `
    SELECT 
      a.section_name, 
      b.school_year as school_year_name 
    FROM section a
    LEFT JOIN school_year b ON a.school_year_id = b.school_year_id
    WHERE a.section_id = ? AND a.grade_level = ? AND a.school_year_id = ?
  `;

  db.query(sectionInfoQuery, [sectionId, gradeLevel, schoolYearId], (err, sectionResult) => {
    if (err) {
      console.error('Section info query error:', err);
      return res.status(500).json({ error: 'Failed to fetch section info' });
    }

    const subjectStatsQuery = `
      SELECT 
        t.subject_name,
        COUNT(*) AS total_students,

        -- Male
        COUNT(CASE WHEN t.gender = 'Male' AND t.avg_grade >= 75 THEN 1 END) AS male_passed,
        COUNT(CASE WHEN t.gender = 'Male' AND t.avg_grade < 75 THEN 1 END) AS male_failed,

        -- Female
        COUNT(CASE WHEN t.gender = 'Female' AND t.avg_grade >= 75 THEN 1 END) AS female_passed,
        COUNT(CASE WHEN t.gender = 'Female' AND t.avg_grade < 75 THEN 1 END) AS female_failed,

        -- Total
        COUNT(CASE WHEN t.avg_grade >= 75 THEN 1 END) AS total_passed,
        COUNT(CASE WHEN t.avg_grade < 75 THEN 1 END) AS total_failed,

        -- Promotion
        COUNT(CASE WHEN t.gender = 'Male' AND t.avg_grade >= 75 THEN 1 END) AS male_promoted,
        COUNT(CASE WHEN t.gender = 'Male' AND t.avg_grade < 75 THEN 1 END) AS male_retained,
        COUNT(CASE WHEN t.gender = 'Female' AND t.avg_grade >= 75 THEN 1 END) AS female_promoted,
        COUNT(CASE WHEN t.gender = 'Female' AND t.avg_grade < 75 THEN 1 END) AS female_retained

      FROM (
        SELECT 
          s.subject_name,
          g.student_id,
          st.gender,
          AVG(g.grade) AS avg_grade
        FROM SUBJECT s
        LEFT JOIN grades g ON s.subject_name = g.subject_name AND s.school_year_id = g.school_year_id
        LEFT JOIN enrollment e ON g.student_id = e.student_id AND g.school_year_id = e.school_year_id
        LEFT JOIN student st ON e.student_id = st.student_id

        WHERE 
          s.school_year_id = ?
          AND s.grade_level = ?
          AND e.section_id = ?
          AND g.period IN ('1st', '2nd', '3rd', '4th')

        GROUP BY s.subject_name, g.student_id
      ) AS t

      GROUP BY t.subject_name
    `;

    db.query(subjectStatsQuery, [schoolYearId, gradeLevel, sectionId], (err, statsResult) => {
      if (err) {
        console.error('Subject stats query error:', err);
        return res.status(500).json({ error: 'Failed to fetch subject statistics' });
      }

      res.json({
        section_info: sectionResult[0] || {},
        subject_statistics: statsResult
      });
    });
  });
});

app.get('/api/student-stats', (req, res) => {
  const { school_year_id, section_id, grade_level } = req.query;

  // Check if all required parameters are provided
  if (!school_year_id || !section_id || !grade_level) {
    return res.status(400).json({ error: 'Missing required query parameters' });
  }

  // First query to get the school year information
  const schoolYearQuery = `
    SELECT 
      school_year AS school_year_name, 
      CONCAT(DATE_FORMAT(enrollment_start, '%M %d'), ' - ', DATE_FORMAT(enrollment_end, '%d, %Y')) AS enrollment_dates
    FROM school_year 
    WHERE school_year_id = ?;
  `;

  // Execute the school year query
  db.query(schoolYearQuery, [school_year_id], (err, schoolYearResult) => {
    if (err) {
      console.error('School year query error:', err);
      return res.status(500).json({ error: 'Failed to fetch school year information' });
    }

    // Get the school year details (if any)
    const schoolYearInfo = schoolYearResult[0];

    // SQL query for student stats
    const studentStatsQuery = `
      SELECT 
        CONCAT('Grade', ' ', a.grade_level) AS LEVEL,
        IFNULL(COUNT(CASE WHEN b.gender = 'Male' THEN 1 END), 0) AS male_count,
        IFNULL(COUNT(CASE WHEN b.gender = 'Female' THEN 1 END), 0) AS female_count,
        IFNULL(COUNT(*), 0) AS total_students
      FROM enrollment a
      LEFT JOIN student b ON a.student_id = b.student_id
      LEFT JOIN school_year c ON a.school_year_id = c.school_year_id
      WHERE a.school_year_id = ?
        AND a.section_id = ?
        AND a.enrollment_date <= c.enrollment_end
        AND a.grade_level = ?
      GROUP BY a.grade_level
      ORDER BY a.grade_level;
    `;

    // Execute the student stats query with parameters
    db.query(studentStatsQuery, [school_year_id, section_id, grade_level], (err, studentStatsResult) => {
      if (err) {
        console.error('Student stats query error:', err);
        return res.status(500).json({ error: 'Failed to fetch student statistics' });
      }

      // Return the combined results
      res.json({
        school_year_info: schoolYearInfo || {},
        student_statistics: studentStatsResult
      });
    });
  });
});

app.get('/api/sf6-summary', (req, res) => {
  const { grade_level, school_year_id } = req.query;

  // Query to get the school year name based on the school year ID
  const getSchoolYearQuery = `
    SELECT school_year AS school_year_name 
    FROM school_year 
    WHERE school_year_id = ?
  `;

  // Query to get the promotion summary data based on grade and school year
  const promotionSummaryQuery = `
    SELECT 
        CONCAT('Grade ', t.grade_level) AS level,
        COUNT(CASE WHEN t.gender = 'Male' AND t.avg_grade >= 75 THEN 1 END) AS male_promoted,
        COUNT(CASE WHEN t.gender = 'Male' AND t.avg_grade < 75 THEN 1 END) AS male_retained,
        COUNT(CASE WHEN t.gender = 'Female' AND t.avg_grade >= 75 THEN 1 END) AS female_promoted,
        COUNT(CASE WHEN t.gender = 'Female' AND t.avg_grade < 75 THEN 1 END) AS female_retained
    FROM (
        SELECT 
            g.grade_level,
            g.student_id,
            st.gender,
            AVG(g.grade) AS avg_grade
        FROM grades g
        LEFT JOIN enrollment e ON g.student_id = e.student_id AND g.school_year_id = e.school_year_id
        LEFT JOIN student st ON e.student_id = st.student_id
        WHERE 
            g.school_year_id = ?
            AND g.grade_level = ? 
            AND g.student_id IN (
                SELECT student_id 
                FROM grades 
                WHERE school_year_id = ? AND period = '4th'
            )
            AND g.period IN ('1st', '2nd', '3rd', '4th')
        GROUP BY g.grade_level, g.student_id
    ) AS t
    GROUP BY t.grade_level
  `;

  // Fetch the school year name
  db.query(getSchoolYearQuery, [school_year_id], (err, yearResult) => {
    if (err) {
      console.error('Error fetching school year:', err);
      return res.status(500).json({ error: 'Internal server error' });
    }

    if (yearResult.length === 0) {
      return res.status(404).json({ error: 'School year not found' });
    }

    const schoolYearName = yearResult[0].school_year_name;

    // Fetch the promotion summary data for the given grade level and school year
    db.query(promotionSummaryQuery, [school_year_id, grade_level, school_year_id], (err, summaryResults) => {
      if (err) {
        console.error('Error fetching promotion summary:', err);
        return res.status(500).json({ error: 'Internal server error' });
      }

      res.json({
        school_year: schoolYearName,
        summary: summaryResults
      });
    });
  });
});

app.get('/api/student-grades', (req, res) => {
  const { school_year_id, grade, section, studentName } = req.query;

  const studentInfoQuery = `
    SELECT 
      CONCAT(b.firstname, ' ', LEFT(IFNULL(b.middlename, ''), 1), '.', ' ', b.lastname) AS stud_name,
      b.gender,
      b.age,
      b.lrn,
      c.school_year AS school_year_name,
      a.student_id,
      d.section_name
    FROM enrollment a
    LEFT JOIN student b ON a.student_id = b.student_id
    LEFT JOIN school_year c ON a.school_year_id = c.school_year_id
    LEFT JOIN section d ON a.section_id=d.section_id
    WHERE a.grade_level = ? AND b.lastname = ? AND a.school_year_id = ? AND a.section_id = ?
  `;

  db.query(studentInfoQuery, [grade, studentName, school_year_id, section], (err, studentInfoResults) => {
    if (err) {
      console.error('Error fetching student info:', err);
      return res.status(500).json({ error: 'Internal server error' });
    }

    if (studentInfoResults.length === 0) {
      return res.status(404).json({ error: 'Student not found' });
    }

    const studentId = studentInfoResults[0].student_id;

    const gradesQuery = `
      SELECT subject_name, 
            MAX(CASE WHEN period = 1 THEN grade ELSE NULL END) AS q1,
            MAX(CASE WHEN period = 2 THEN grade ELSE NULL END) AS q2,
            MAX(CASE WHEN period = 3 THEN grade ELSE NULL END) AS q3,
            MAX(CASE WHEN period = 4 THEN grade ELSE NULL END) AS q4,
            ROUND(
                (MAX(CASE WHEN period = 1 THEN grade ELSE NULL END) + 
                  MAX(CASE WHEN period = 2 THEN grade ELSE NULL END) + 
                  MAX(CASE WHEN period = 3 THEN grade ELSE NULL END) + 
                  MAX(CASE WHEN period = 4 THEN grade ELSE NULL END)) / 4, 0
                ) AS final, 
              IF(
                ROUND(
                    (MAX(CASE WHEN period = 1 THEN grade ELSE NULL END) + 
                      MAX(CASE WHEN period = 2 THEN grade ELSE NULL END) + 
                      MAX(CASE WHEN period = 3 THEN grade ELSE NULL END) + 
                      MAX(CASE WHEN period = 4 THEN grade ELSE NULL END)) / 4, 0
                ) > 74, 
                'passed', 
                'failed') AS status 
      FROM grades
      WHERE student_id = ? AND grade_level = ? AND school_year_id = ? AND section_id = ?
      GROUP BY subject_name;
    `;

    db.query(gradesQuery, [studentId, grade, school_year_id, section], (err, gradesResults) => {
      if (err) {
        console.error('Error fetching student grades:', err);
        return res.status(500).json({ error: 'Internal server error' });
      }

      const attendanceQuery = `
        SELECT 
          month_names.month,
          COALESCE(SUM(CASE WHEN MONTH(a.date) = month_names.month_num AND a.status = 'P' THEN 1 ELSE 0 END), 0) AS present_count,
          COALESCE(SUM(CASE WHEN MONTH(a.date) = month_names.month_num AND a.status = 'A' THEN 1 ELSE 0 END), 0) AS absent_count
        FROM (
          SELECT 6 AS month_num, 'June' AS month UNION
          SELECT 7, 'July' UNION
          SELECT 8, 'August' UNION
          SELECT 9, 'September' UNION
          SELECT 10, 'October' UNION
          SELECT 11, 'November' UNION
          SELECT 12, 'December' UNION
          SELECT 1, 'January' UNION
          SELECT 2, 'February' UNION
          SELECT 3, 'March' UNION
          SELECT 4, 'April'
        ) AS month_names
        LEFT JOIN attendance a ON MONTH(a.date) = month_names.month_num 
            AND a.student_id = ? 
            AND a.date <= NOW()
            AND a.school_year_id = ?
        GROUP BY month_names.month_num
        ORDER BY FIELD(month_names.month_num, 6,7,8,9,10,11,12,1,2,3,4);
      `;

      db.query(attendanceQuery, [studentId, school_year_id], (err, attendanceResults) => {
        if (err) {
          console.error('Error fetching attendance summary:', err);
          return res.status(500).json({ error: 'Internal server error' });
        }

        res.json({
          studentInfo: studentInfoResults[0],
          grades: gradesResults,
          attendance: attendanceResults
        });
      });
    });
  });
});


app.get('/api/form137-data', (req, res) => {
  const { studentId } = req.query;  // Get student ID from the request

  if (!studentId) {
    return res.status(400).send('Student ID is required');
  }

  // First Query: Fetch School Year and Grade Level (only once)
  const schoolYearQuery = `
    SELECT b.school_year, a.grade_level, b.school_year_id
    FROM enrollment a
    LEFT JOIN school_year b ON a.school_year_id = b.school_year_id
    WHERE a.student_id = ?
    ORDER BY a.grade_level ASC
  `;

  // Second Query: Fetch Grades and Status for Each Subject (only once for each grade level)
  const gradesQuery = `
    SELECT subject_name, 
           MAX(CASE WHEN period = 1 THEN grade ELSE NULL END) AS q1,
           MAX(CASE WHEN period = 2 THEN grade ELSE NULL END) AS q2,
           MAX(CASE WHEN period = 3 THEN grade ELSE NULL END) AS q3,
           MAX(CASE WHEN period = 4 THEN grade ELSE NULL END) AS q4,
           ROUND(
               (MAX(CASE WHEN period = 1 THEN grade ELSE NULL END) + 
                MAX(CASE WHEN period = 2 THEN grade ELSE NULL END) + 
                MAX(CASE WHEN period = 3 THEN grade ELSE NULL END) + 
                MAX(CASE WHEN period = 4 THEN grade ELSE NULL END)) / 4, 0
           ) AS final, 
           IF(
             ROUND(
               (MAX(CASE WHEN period = 1 THEN grade ELSE NULL END) + 
                MAX(CASE WHEN period = 2 THEN grade ELSE NULL END) + 
                MAX(CASE WHEN period = 3 THEN grade ELSE NULL END) + 
                MAX(CASE WHEN period = 4 THEN grade ELSE NULL END)) / 4, 0
             ) > 74, 
             'passed', 
             'failed'
           ) AS status
    FROM grades
    WHERE student_id = ? AND grade_level = ? AND school_year_id = ?
    GROUP BY subject_name
  `;

  // Attendance Query: Count the total days, present and absent (only once per school year)
  const attendanceQuery = `
    SELECT 
      COUNT(*) AS days,
      COUNT(CASE WHEN STATUS = 'P' THEN 1 END) AS present,
      COUNT(CASE WHEN STATUS = 'A' THEN 1 END) AS absent
    FROM attendance
    WHERE student_id = ? AND school_year_id = ?
  `;

  // Query: Get school year and grade level only once
  db.query(schoolYearQuery, [studentId], (err, schoolYearData) => {
    if (err) {
      console.error('Error executing school year query: ' + err.stack);
      return res.status(500).send('Database error');
    }

    if (schoolYearData.length === 0) {
      return res.status(404).send('No school year or grade level found for this student');
    }

    const results = {
      studentId: studentId,  // Only add studentId once
      schoolYears: []  // Array to hold all school year data
    };

    let completedQueries = 0;

    // Fetch the academic records for each school year (but only once per school year)
    schoolYearData.forEach((schoolYearRow) => {
      const schoolYearId = schoolYearRow.school_year_id;
      const gradeLevel = schoolYearRow.grade_level;

      // Fetch Grades for the current school year and grade level (execute once)
      db.query(gradesQuery, [studentId, gradeLevel, schoolYearId], (err, gradesData) => {
        if (err) {
          console.error('Error executing grades query: ' + err.stack);
          return res.status(500).send('Database error');
        }

        // Fetch Attendance for the current school year (execute once)
        db.query(attendanceQuery, [studentId, schoolYearId], (err, attendanceData) => {
          if (err) {
            console.error('Error executing attendance query: ' + err.stack);
            return res.status(500).send('Database error');
          }

          // Combine the data for this school year and add it to results
          results.schoolYears.push({
            schoolYear: schoolYearRow.school_year,
            gradeLevel: gradeLevel,
            schoolYearId: schoolYearId,
            grades: gradesData,
            attendance: attendanceData[0] // Attendance data, first entry (there should be only one)
          });

          completedQueries++;

          // Once all queries are completed, send the final response
          if (completedQueries === schoolYearData.length) {
            res.json(results);  // Send all data in a single response
          }
        });
      });
    });
  });
});

// SF2 - Daily Attendance Report
app.get('/api/sf2-attendance', (req, res) => {
  const schoolYearId = req.query.school_year_id;
  const date = req.query.date;

  if (!schoolYearId || !date) {
    return res.status(400).json({ error: 'School year ID and date are required' });
  }

  // Query to get students with their attendance status for the specified date
  const query = `
    SELECT 
      s.student_id AS studentId,
      CONCAT(s.lastname, ', ', s.firstname, ' ', IFNULL(LEFT(s.middlename, 1), ''), '.') AS studentName,
      a.status,
      sy.school_year
    FROM student s
    JOIN enrollment e ON s.student_id = e.student_id
    LEFT JOIN attendance a ON s.student_id = a.student_id AND DATE(a.date) = ? AND a.school_year_id = ?
    JOIN school_year sy ON e.school_year_id = sy.school_year_id
    WHERE e.school_year_id = ? AND e.enrollment_status = 'active'
    ORDER BY s.lastname, s.firstname
  `;

  db.query(query, [date, schoolYearId, schoolYearId], (err, results) => {
    if (err) {
      console.error('Error fetching SF2 attendance data:', err);
      return res.status(500).json({ error: 'Database error' });
    }

    let totalPresent = 0;
    let totalAbsent = 0;
    let totalLate = 0;
    const students = [];

    results.forEach(row => {
      // Add each student to the array
      students.push({
        studentId: row.studentId,
        studentName: row.studentName,
        status: row.status || 'A' // Default to absent if no status
      });

      // Count totals
      if (row.status === 'P') totalPresent++;
      else if (row.status === 'A') totalAbsent++;
      else if (row.status === 'L') totalLate++;
      else totalAbsent++; // Count as absent if no record
    });

    res.json({
      students,
      totalPresent,
      totalAbsent,
      totalLate,
      totalStudents: students.length,
      schoolYear: results.length > 0 ? results[0].school_year : ''
    });
  });
});

app.get('/api/sf2-combined', (req, res) => {
  const { month, gradeLevel, section, year } = req.query;

  const currentYear = new Date().getFullYear();
  const finalYear = year || currentYear;

  const query = `
    SELECT 
      d.date,
      DAYNAME(d.date) AS day_name,
      DAY(d.date) AS day_of_month,
      CONCAT(s.lastname, ', ', s.firstname, ' ', LEFT(IFNULL(s.middlename, ''), 1), '.') AS stud_name,
      s.student_id,
      s.gender,
      -- Prioritize statuses: If any Absent, then Absent; If any Late, then Late; Otherwise Present
      CASE 
        WHEN GROUP_CONCAT(a.status) LIKE '%A%' THEN 'A'
        WHEN GROUP_CONCAT(a.status) LIKE '%L%' THEN 'L'
        WHEN GROUP_CONCAT(a.status) LIKE '%P%' THEN 'P'
        ELSE NULL
      END AS status
    FROM (
      SELECT DATE(CONCAT(?, '-', 
        CASE ?
          WHEN 'January' THEN '01'
          WHEN 'February' THEN '02'
          WHEN 'March' THEN '03'
          WHEN 'April' THEN '04'
          WHEN 'May' THEN '05'
          WHEN 'June' THEN '06'
          WHEN 'July' THEN '07'
          WHEN 'August' THEN '08'
          WHEN 'September' THEN '09'
          WHEN 'October' THEN '10'
          WHEN 'November' THEN '11'
          WHEN 'December' THEN '12'
        END, '-', LPAD(n.n, 2, '0'))) as date
      FROM (
        SELECT a.N + b.N * 10 + 1 n
        FROM (SELECT 0 AS N UNION SELECT 1 UNION SELECT 2 UNION SELECT 3 UNION SELECT 4 UNION SELECT 5 UNION SELECT 6 UNION SELECT 7 UNION SELECT 8 UNION SELECT 9) a,
             (SELECT 0 AS N UNION SELECT 1 UNION SELECT 2 UNION SELECT 3) b
        ORDER BY n
      ) n
      WHERE n.n <= DAY(LAST_DAY(CONCAT(?, '-', 
        CASE ?
          WHEN 'January' THEN '01'
          WHEN 'February' THEN '02'
          WHEN 'March' THEN '03'
          WHEN 'April' THEN '04'
          WHEN 'May' THEN '05'
          WHEN 'June' THEN '06'
          WHEN 'July' THEN '07'
          WHEN 'August' THEN '08'
          WHEN 'September' THEN '09'
          WHEN 'October' THEN '10'
          WHEN 'November' THEN '11'
          WHEN 'December' THEN '12'
        END, '-01')))
    ) d
    CROSS JOIN (
      SELECT DISTINCT s.student_id, s.lastname, s.firstname, s.middlename, s.gender
      FROM student s
      JOIN enrollment e ON s.student_id = e.student_id
      WHERE e.grade_level = ? 
      AND e.section_id = ?
      AND e.enrollment_status = 'active'
    ) s
    LEFT JOIN attendance a ON s.student_id = a.student_id 
      AND DATE(a.date) = d.date
    WHERE DAYOFWEEK(d.date) BETWEEN 2 AND 6  -- Only Monday to Friday
    GROUP BY d.date, s.student_id  -- Group by date and student to get single record per day
    ORDER BY d.date, s.lastname, s.firstname;
  `;

  db.query(query, [finalYear, month, finalYear, month, gradeLevel, section], (err, results) => {
    if (err) {
      console.error('Error fetching combined data:', err);
      return res.status(500).json({ error: 'Database error' });
    }
    res.json(results);
  });
});

app.get('/api/school_year/section_name', (req, res) => {
  const { school_year_id, section } = req.query; // Get parameters from the query string

  if (!school_year_id || !section) {
    return res.status(400).json({ error: "Missing required parameters: school_year_id and section" });
  }

  // Define the SQL query
  const query = `
    SELECT 
      a.section_name, 
      b.school_year AS school_year_name 
    FROM section a 
    LEFT JOIN school_year b 
      ON a.school_year_id = b.school_year_id 
    WHERE a.school_year_id = ? 
      AND a.section_id = ?
  `;

  // Execute the query
  db.query(query, [school_year_id, section], (err, results) => {
    if (err) {
      return res.status(500).json({ error: "Database query failed", details: err.message });
    }

    if (results.length === 0) {
      return res.status(404).json({ error: "No data found" });
    }

    // Return the result
    res.json(results[0]); // Sending the first result (assuming one result will be returned)
  });
});


app.put('/students/section/:id', (req, res) => {
  const studentId = req.params.id;
  const updatedData = req.body;

  const updateQuery = `
    UPDATE student 
    SET section_id = ?
    WHERE student_id = ?
  `;

  const VALUES = [
    updatedData.section_id,
    studentId
  ];

  // Update student information first
  db.query(updateQuery, VALUES, (err, result) => {
    if (err) {
      console.error('Error updating student:', err);
      return res.status(500).json({ error: 'Failed to update student' });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Student not found' });
    }

    // Get active school year
    const getSchoolYearQuery = `SELECT school_year_id FROM school_year WHERE status = 'active' LIMIT 1`;

    db.query(getSchoolYearQuery, (err, schoolYearResult) => {
      if (err) {
        console.error('Error getting active school year:', err);
        return res.status(500).json({ error: 'Failed to retrieve school year' });
      }

      if (schoolYearResult.length === 0) {
        return res.status(400).json({ error: 'No active school year found' });
      }

      const school_year_id = schoolYearResult[0].school_year_id;

      // Update the section_id in the enrollment table
      const updateEnrollmentQuery = `
        UPDATE enrollment 
        SET section_id = ? 
        WHERE student_id = ? AND school_year_id = ?
      `;

      db.query(updateEnrollmentQuery, [updatedData.section_id, studentId, school_year_id], (err, enrollResult) => {
        if (err) {
          console.error('Error updating enrollment section:', err);
          return res.status(500).json({ error: 'Failed to update section in enrollment' });
        }

        res.json({ message: 'Student and enrollment section updated successfully' });
      });
    });
  });
});