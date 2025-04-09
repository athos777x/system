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
      s.mother_contact_number, IF(s.brigada_eskwela=1,'Attended','Not Attended') AS brigada_eskwela,
      s.emergency_number, s.emergency_contactperson,
      (SELECT ss.status FROM student_school_year ss
      JOIN school_year sy ON ss.school_year_id = sy.school_year_id
      WHERE ss.student_id = s.student_id AND sy.status = 'active') as active_status,
      se.enrollment_status, se.student_elective_id
      FROM student s
      LEFT JOIN student_elective se ON s.student_id = se.student_id
      LEFT JOIN section z ON s.section_id=z.section_id
      LEFT JOIN student_school_year ss ON s.student_id = ss.student_id
      LEFT JOIN school_year sy ON ss.school_year_id = sy.school_year_id
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
      s.current_yr_lvl, s.birthdate, s.gender, s.age, 
      s.home_address, s.barangay, s.city_municipality, s.province, 
      s.contact_number, s.email_address, s.status as stud_status,
      s.mother_name, s.father_name, s.parent_address, s.father_occupation, 
      s.mother_occupation, s.annual_hshld_income, s.number_of_siblings, 
      s.father_educ_lvl, s.mother_educ_lvl, s.father_contact_number, 
      s.mother_contact_number, IF(s.brigada_eskwela=1,'Attended','Not Attended') AS brigada_eskwela,
      (SELECT ss.status FROM student_school_year ss
      JOIN school_year sy ON ss.school_year_id = sy.school_year_id
      WHERE ss.student_id = s.student_id AND sy.status = 'active') as active_status,
      se.enrollment_status, se.student_elective_id
      FROM student s
      LEFT JOIN student_elective se ON s.student_id = se.student_id 
      LEFT JOIN enrollment xx ON s.student_id=xx.student_id
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

    // if (school_year) {
    //   conditions.push(`
    //     s.student_id IN (
    //       SELECT ss.student_id FROM student_school_year ss 
    //       JOIN school_year sy ON ss.school_year_id = sy.school_year_id 
    //       WHERE sy.school_year = ?
    //     )
    //   `);
    //   queryParams.push(school_year);
    // } else {
    //   // Default to the latest school year if no specific year is provided
    //   conditions.push(`
    //     s.student_id IN (
    //       SELECT ss.student_id FROM student_school_year ss 
    //       JOIN school_year sy ON ss.school_year_id = sy.school_year_id 
    //       WHERE sy.school_year = ?
    //     )
    //   `);
    //   queryParams.push(latestSchoolYear);
    // }

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
        emergency_number = ?, emergency_contactperson = ?, section_id = ?
    WHERE student_id = ?
  `;

  const values = [
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
    updatedData.section_id,
    studentId
  ];

  db.query(updateQuery, values, (err, result) => {
    if (err) {
      console.error('Error updating student:', err);
      res.status(500).json({ error: 'Failed to update student' });
      return;
    }

    if (result.affectedRows === 0) {
      res.status(404).json({ error: 'Student not found' });
      return;
    }

    res.json({ message: 'Student updated successfully' });
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
    emergency_contactperson, status, active_status, brigada_eskwela = '0', brigada_remarks, lrn
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

    const query = `
      INSERT INTO student (
        student_id, lrn, lastname, firstname, middlename, current_yr_lvl,
        birthdate, gender, age, home_address, barangay, city_municipality,
        province, contact_number, email_address, mother_name, father_name,
        parent_address, father_occupation, mother_occupation, annual_hshld_income,
        number_of_siblings, father_educ_lvl, mother_educ_lvl, father_contact_number,
        mother_contact_number, emergency_number, emergency_contactperson, status, active_status,
        brigada_eskwela
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
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
      status || 'active',
      active_status || 'unarchive',
      brigada_eskwela_value
    ];

    db.query(query, studentData, (error, result) => {
      if (error) {
        console.error('Failed to add student:', error);
        return res.status(500).json({ error: 'Failed to add student' });
      }

      // Proceed with brigada_details insert if brigada_eskwela is '0'
      if (brigada_eskwela === '0') {
        const brigada_id = brigada_eskwela; // assume same as student_id

        const insertBrigadaDetailsQuery = `
          INSERT INTO brigada_details (student_id, brigada_id, remarks)
          VALUES (?, ?, ?)
        `;
        db.query(insertBrigadaDetailsQuery, [nextStudentId, brigada_id, brigada_remarks || ''], (err3) => {
          if (err3) {
            console.error('Failed to insert brigada_remarks:', err3);
            return res.status(500).json({ error: 'Failed to insert brigada remarks' });
          }

          res.status(201).json({
            message: 'Student and brigada details added successfully',
            studentId: nextStudentId
          });
        });
      } else {
        res.status(201).json({ message: 'Student added successfully', studentId: nextStudentId });
      }
    });
  });
});




// ENDPOINT USED:
// STUDENTS PAGE
app.put('/students/:id/enroll', (req, res) => {
  const studentId = req.params.id; // Get student_id from the URL
  const { school_year, status } = req.body; // Get school_year and status from the request body

  console.log(`Enrolling student with ID: ${studentId}, School Year: ${school_year}, Status: ${status}`);

  // Step 1: Check if the student exists in the student table
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

    // Step 2: Insert into the `users` table with generated username and default password
    const username = `${student.lastname}.${student.firstname}@lnhs.com`.toLowerCase(); // Generate username
    const password = '1234'; // Default password
    const role_id = 2; // Role ID for students
    const role_name = 'student'; // Role name

    const userInsertQuery = `
      INSERT INTO users (username, password, role_id, role_name)
      VALUES (?, ?, ?, ?)
    `;
    const userInsertValues = [username, password, role_id, role_name];

    console.log('Inserting into users table:', userInsertValues);

    // Insert into users table
    db.query(userInsertQuery, userInsertValues, (userInsertErr, userInsertResult) => {
      if (userInsertErr) {
        console.error('Error inserting user:', userInsertErr.sqlMessage || userInsertErr);
        return res.status(500).json({ error: 'Failed to insert user', details: userInsertErr.message });
      }

      console.log('User inserted successfully with user_id:', userInsertResult.insertId);

      const newUserId = userInsertResult.insertId;

      // Step 3: Update the `student` table with the new `user_id`
      const updateStudentQuery = `
        UPDATE student
        SET user_id = ?, enroll_date = CURRENT_DATE()
        WHERE student_id = ?
      `;
      const updateStudentValues = [newUserId, studentId];

      console.log('Updating student with user_id and setting enroll_date:', newUserId);

      db.query(updateStudentQuery, updateStudentValues, (updateStudentErr) => {
        if (updateStudentErr) {
          console.error('Error updating student:', updateStudentErr);
          return res.status(500).json({ error: 'Failed to update student with user_id', details: updateStudentErr.message });
        }

        console.log(`Student with ID: ${studentId} updated successfully with user_id: ${newUserId}`);

        // Step 4: Get the school_year_id based on the provided school_year
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

          // Step 5: Insert the enrollment record
          const enrollmentInsertQuery = `
            INSERT INTO enrollment (student_id, school_year_id, enrollee_type, enrollment_status, enrollment_date, grade_level, student_name, brigada_attendance)
            VALUES (?, ?, 'Regular', 'inactive', NOW(), ?, ?, 1);
          `;
          const studentName = `${student.lastname} ${student.firstname} ${student.middlename || ''}`.trim();
          const enrollmentInsertValues = [
            student.student_id,
            schoolYearId,
            student.current_yr_lvl,
            studentName
          ];

          console.log('Attempting to insert enrollment record with values:', enrollmentInsertValues);

          db.query(enrollmentInsertQuery, enrollmentInsertValues, (enrollmentErr, enrollmentResult) => {
            if (enrollmentErr) {
              console.error('Error inserting student enrollment:', enrollmentErr);
              return res.status(500).json({ error: 'Failed to enroll student', details: enrollmentErr.message });
            }

            console.log(`Student enrolled successfully with enrollment ID: ${enrollmentResult.insertId}`);

            // Step 6: Insert into the student_school_year table
            const studentSchoolYearInsertQuery = `
              INSERT INTO student_school_year (student_school_year_id, student_id, school_year_id, status, student_name)
              VALUES (NULL, ?, ?, 'inactive', ?);
            `;
            const studentName = `${student.lastname} ${student.firstname} ${student.middlename || ''}`.trim();
            const studentSchoolYearValues = [
              student.student_id,
              schoolYearId,
              studentName
            ];

            console.log('Attempting to insert record into student_school_year with values:', studentSchoolYearValues);

            db.query(studentSchoolYearInsertQuery, studentSchoolYearValues, (studentSchoolYearErr, studentSchoolYearResult) => {
              if (studentSchoolYearErr) {
                console.error('Error inserting into student_school_year:', studentSchoolYearErr);
                return res.status(500).json({ error: 'Failed to insert into student_school_year', details: studentSchoolYearErr.message });
              }

              console.log(`Record inserted into student_school_year with ID: ${studentSchoolYearResult.insertId}`);
              res.status(200).json({ message: 'Student enrolled, enrollment record, and student_school_year record created successfully' });
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
  const { studentId, action } = req.body; // Get action (approve or reject)

  if (action === 'reject') {
    // Step for Reject: Update student_school_year and enrollment to 'inactive'
    const rejectQuery = `UPDATE student_school_year SET status = 'inactive' WHERE student_id = ?;`;
    const updateEnrollmentQuery = `UPDATE enrollment SET enrollment_status = 'inactive' WHERE student_id = ?;`;

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
      db.query(updateEnrollmentQuery, [studentId], (err2, result2) => {
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

      // Step 2: Update enrollment table to 'active'
      const updateEnrollmentQuery = `UPDATE enrollment SET enrollment_status = 'active' WHERE student_id = ?;`;

      db.query(updateEnrollmentQuery, [studentId], (err2, result2) => {
        if (err2) {
          console.error('Error updating enrollment:', err2.message);
          return res.status(500).json({ error: 'Database error: ' + err2.message });
        }

        if (result2.affectedRows === 0) {
          console.error(`No record found in enrollment for student ID: ${studentId}`);
          return res.status(404).json({ error: 'No matching record found in enrollment' });
        }

        console.log(`Enrollment status updated to 'active' for student ID: ${studentId}`);

        // Step 3: Assign student to a section based on grade level & gender
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

              console.log(`Student ID: ${studentId} assigned to section ID: ${selectedSection}`);
              res.status(200).json({ message: 'Enrollment approved and section assigned successfully' });
            });
          });
        });
      });
    });

  } else {
    return res.status(400).json({ error: 'Invalid action' });
  }
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
  const query = `
    SELECT enrollment_status 
    FROM student_elective 
    WHERE user_id = ? 
    LIMIT 1;  -- Assuming you only want to check if there's one active elective
  `;

  db.query(query, [userId], (err, results) => {
    if (err) {
      console.error('Error fetching elective status:', err);
      return res.status(500).json({ error: 'Database error' });
    }
    if (results.length > 0) {
      res.json({ status: results[0].enrollment_status });
    } else {
      res.json({ status: '' }); // No active elective
    }
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
  console.log(`Fetching enrollment data for user_id: ${userId}`);

  const query = `
    SELECT DISTINCT 
      a.subject_name, 
      CONCAT(c.lastname, ', ', c.firstname, ' ', IFNULL(c.middlename, '')) AS teacher, 
      CASE 
        WHEN d.time_start IS NOT NULL AND d.time_end IS NOT NULL 
        THEN CONCAT(d.time_start, ' - ', d.time_end)
        ELSE ''
      END AS schedule
    FROM subject a 
    INNER JOIN student b ON a.grade_level = b.current_yr_lvl 
    LEFT JOIN employee c ON a.employee_id = c.employee_id 
    LEFT JOIN schedule d ON a.subject_id = d.subject_id
    WHERE b.user_id = ? 
      AND a.status = 'active'

    UNION 

    SELECT 
      e.name AS subject_name, 
      CONCAT(emp.lastname, ', ', emp.firstname, ' ', IFNULL(emp.middlename, '')) AS teacher, 
      '' AS schedule
    FROM elective e 
    INNER JOIN student_elective se ON se.elective_id = e.elective_id 
    LEFT JOIN employee emp ON e.employee_id = emp.employee_id
    WHERE se.user_id = ? 
      AND se.enrollment_status = 'approved'
    ORDER BY subject_name;
  `;

  db.query(query, [userId, userId], (err, results) => {
    if (err) {
      console.error('Error executing enrollment query:', {
        error: err.message,
        userId: userId,
        sqlState: err.sqlState,
        sqlMessage: err.sqlMessage
      });
      return res.status(500).json({ 
        error: 'Failed to fetch enrollment data',
        details: err.message 
      });
    }

    // Return empty array instead of 404 if no results
    res.json(results || []);
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
  const { userId } = req.body; // Get userId from request body

  // Query to fetch student and school year information
  const queryFetch = `
    SELECT a.student_id, a.current_yr_lvl, a.lastname, a.firstname, a.middlename, c.school_year_id 
    FROM student a
    JOIN school_year c ON c.status = 'active' 
    WHERE a.user_id = ?;
  `;

  db.query(queryFetch, [userId], (err, results) => {
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
  const { studentId, electiveId, grade_level } = req.body;

  // Validate required fields
  if (!studentId || !electiveId || !grade_level) {
    return res.status(400).json({ error: 'Missing required fields.' });
  }

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
      INSERT INTO student_elective (student_id, elective_id, enrollment_status, grade_level)
      VALUES (?, ?, 'pending', ?);
    `;

    db.query(enrollQuery, [studentId, electiveId, grade_level], (err, result) => {
      if (err) {
        console.error('Error enrolling in elective:', err);
        return res.status(500).json({ error: 'Database error' });
      }
      res.status(200).json({ message: 'Elective enrollment request submitted successfully.' });
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
    s.father_contact_number, s.mother_contact_number, IF(s.brigada_eskwela=1,'Attended','Not Attended') AS brigada_eskwela
    FROM student s 
    LEFT JOIN student_school_year ss ON s.student_id = ss.student_id 
    LEFT JOIN enrollment b ON s.student_id = b.student_id
    LEFT JOIN school_year sy ON ss.school_year_id = sy.school_year_id 
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
      d.school_year  
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
  const { studentId, gradeLevel, schoolYearId } = req.query; // Extract schoolYearId

  // Validate that all required parameters are provided
  if (!studentId || !gradeLevel || !schoolYearId) {
    return res.status(400).json({ error: 'Student ID, Grade Level, and School Year ID are required' });
  }

  const query = `
    SELECT DISTINCT 
      s.subject_name,
      s.grade_level
    FROM SUBJECT s
    INNER JOIN student st ON s.grade_level = st.current_yr_lvl 
    WHERE st.student_id = ?
      AND s.status = 'active'
      AND s.grade_level = ?
      AND s.school_year_id = ? 

    UNION 

    SELECT 
      e.name AS subject_name,
      se.grade_level
    FROM elective e 
    INNER JOIN student_elective se ON se.elective_id = e.elective_id 
    WHERE se.student_id = ?
      AND se.enrollment_status = 'approved'
      AND se.grade_level = ?
      AND e.school_year_id = ? 

    ORDER BY subject_name;
  `;

  // Execute the query with correctly ordered parameters
  db.query(query, [studentId, gradeLevel, schoolYearId, studentId, gradeLevel, schoolYearId], (err, results) => {
    if (err) {
      console.error('Error querying the database:', err);
      return res.status(500).json({ error: 'Database query error' });
    }

    res.json(results);
  });
});

// Backend: Fetch grades for all subjects and periods for a student
app.get('/api/grades', (req, res) => {
  const { studentId, gradeLevel, schoolYearId } = req.query; // Extract schoolYearId

  const query = `
    SELECT subject_name, 
      MAX(CASE WHEN period = 1 THEN grade ELSE NULL END) AS q1,
      MAX(CASE WHEN period = 2 THEN grade ELSE NULL END) AS q2,
      MAX(CASE WHEN period = 3 THEN grade ELSE NULL END) AS q3,
      MAX(CASE WHEN period = 4 THEN grade ELSE NULL END) AS q4
    FROM grades
    WHERE student_id = ? AND grade_level = ? AND school_year_id = ?
    GROUP BY subject_name;
  `;

  db.query(query, [studentId, gradeLevel, schoolYearId], (err, results) => {
    if (err) {
      console.error('Error fetching grades:', err);
      return res.status(500).json({ success: false, message: 'Failed to fetch grades.' });
    }

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
    role_name
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
        archive_status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'active', 'unarchive')
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
      role_name
    ];

    db.query(employeeQuery, employeeValues, (employeeError, employeeResult) => {
      if (employeeError) {
        console.error('Failed to add employee:', employeeError);
        return res.status(500).json({ error: 'Failed to add employee' });
      }

      const employeeId = employeeResult.insertId;
      const username = `${lastname.toLowerCase()}.${firstname.toLowerCase()}@lnhs.com`;
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
app.get('/teacher-subjects/:teacherId', (req, res) => {
  const teacherId = req.params.teacherId;
  const schoolYearId = req.query.school_year_id; // Get school_year_id from query parameters

  const query = `
    SELECT CONCAT('Grade ', c.grade_level) AS grade_level, 
    CASE WHEN a.elective = 1 THEN d.name  
    ELSE b.subject_name END AS subject_name,
    c.section_name 
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
      e.grade_level, e.enrollment_status
    FROM student s
    JOIN enrollment e ON s.student_id = e.student_id
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
    SELECT sc.schedule_id, sc.teacher_id,
           IF(sc.elective='0',sb.subject_name,f.name) AS subject_name, 
           TIME_FORMAT(sc.time_start, '%h:%i %p') as time_start, 
           TIME_FORMAT(sc.time_end, '%h:%i %p') as time_end, 
           sc.day, sc.section_id, sc.schedule_status,
           CONCAT(e.firstname, ' ', IF(e.middlename IS NOT NULL AND e.middlename != '', CONCAT(LEFT(e.middlename, 1), '. '), ''), e.lastname) as teacher_name
    FROM schedule sc
    JOIN subject sb ON sc.subject_id = sb.subject_id
    LEFT JOIN employee e ON sc.teacher_id = e.employee_id
    LEFT JOIN elective f ON sc.elective=f.elective_id
    WHERE sc.section_id = ?
    ORDER BY sc.time_start
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
    SELECT * FROM (
      SELECT DISTINCT
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
          MAX(CASE WHEN sch.subject_id IS NOT NULL THEN '1' ELSE '0' END) AS hasSched
      FROM SUBJECT s
      LEFT JOIN school_year sy ON s.school_year_id = sy.school_year_id
      LEFT JOIN (
          SELECT DISTINCT subject_id 
          FROM SCHEDULE 
          WHERE elective = 0
      ) sch ON s.subject_id = sch.subject_id
      ${whereClause}
      ${searchCondition}
      ${gradeCondition}
      ${schoolYearCondition}
      GROUP BY s.subject_id

      UNION

      SELECT DISTINCT
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
          MAX(CASE WHEN sch.subject_id IS NOT NULL THEN '1' ELSE '0' END) AS hasSched
      FROM elective e
      LEFT JOIN (
          SELECT DISTINCT subject_id 
          FROM SCHEDULE 
          WHERE elective = 1
      ) sch ON e.elective_id = sch.subject_id
      WHERE 1=1
      ${archive_status ? ' AND e.archive_status = ?' : ''}
      ${searchTerm && searchTerm.trim() !== '' ? ' AND LOWER(e.name) LIKE LOWER(?)' : ''}
      GROUP BY e.elective_id
    ) combined
    ORDER BY grade_level DESC, subject_name ASC
  `;

  // Add parameters for electives section if needed
  if (archive_status) {
    queryParams.push(archive_status);
  }
  if (searchTerm && searchTerm.trim() !== '') {
    queryParams.push(`%${searchTerm}%`);
  }

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
  const { subject_name, grade_level, status, grading_criteria, description, school_year, archive_status } = req.body;
  
  // First check if subject name already exists
  const checkDuplicateQuery = `
    SELECT COUNT(*) as count 
    FROM subject 
    WHERE LOWER(subject_name) = LOWER(?)
  `;
  
  db.query(checkDuplicateQuery, [subject_name], (checkErr, checkResults) => {
    if (checkErr) {
      console.error('Error checking for duplicate subject:', checkErr);
      return res.status(500).json({ error: 'Internal server error' });
    }
    
    if (checkResults[0].count > 0) {
      return res.status(400).json({ error: 'Subject already exists' });
    }
    
    // If no duplicate, proceed with insertion
    const query = `
      INSERT INTO subject (subject_name, grade_level, status, grading_criteria, description, school_year_id, archive_status)
      VALUES (?, ?, ?, ?, ?, (SELECT school_year_id FROM school_year WHERE status='active'), 'unarchive')
    `;
    const queryParams = [subject_name, grade_level, status, grading_criteria, description, school_year, archive_status];

    db.query(query, queryParams, (err, results) => {
      if (err) {
        console.error('Error adding subject:', err);
        res.status(500).json({ error: 'Internal server error' });
        return;
      }
      res.status(201).json({ message: 'Subject added successfully', subjectId: results.insertId });
    });
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
    const electiveQuery = 'UPDATE elective SET status = ?, archive_status = ? WHERE elective_id = ?';
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
    SELECT s.subject_name, sc.day, 
    TIME_FORMAT(sc.time_start, '%H:%i:%s') as time_start, 
    TIME_FORMAT(sc.time_end, '%h:%i %p') as time_end
    FROM schedule sc
    JOIN subject s ON sc.subject_id = s.subject_id
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
      'subject' as type,
      a.subject_id
    FROM subject a  
    WHERE a.grade_level = ? 
    UNION 
    SELECT 
      b.name as subject_name,
      'elective' as type,
      b.elective_id as id
    FROM elective b 
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
    ON DUPLICATE KEY UPDATE
      grade = VALUES(grade),
      grade_level = VALUES(grade_level),
      subject_name = VALUES(subject_name),
      student_name = VALUES(student_name),
      school_year_id = VALUES(school_year_id)
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

    const query = `
      SELECT b.section_name 
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

      console.log('Query results:', results);

      if (results.length > 0) {
        console.log('Section found:', results[0].section_name);
        res.json({ section: results[0].section_name });
      } else {
        console.log('No section found for student in selected school year');
        res.json({ section: null });
      }
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
    COALESCE(s.middlename, e.middlename) AS middle_name
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
      IF(a.brigada_eskwela = 1, 'Present', 'Absent') AS brigada_attendance,
      s.school_year, 
      a.lrn,
      dd.remarks
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
    INSERT INTO brigada_details (student_id, remarks)
    VALUES (?, ?)
  `;

  const queryParams = [studentId, remarks];

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
    UPDATE student
    SET brigada_eskwela = ?
    WHERE student_id = ?
  `;

  const queryParams = [brigada_attendance ? 1 : 0, studentId]; // Set brigada_eskwela to 1 for "Present" or 0 for "No"

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
      WHERE a.user_id = ? AND b.school_year_id = ?
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

  // First, get the active school year ID
  const getActiveSchoolYearQuery = `SELECT school_year_id FROM school_year WHERE status = 'active' LIMIT 1`;

  db.query(getActiveSchoolYearQuery, (err, schoolYearResult) => {
    if (err) {
      console.error('Error fetching active school year:', err);
      res.status(500).json({ error: 'Failed to fetch active school year', details: err.message });
      return;
    }

    if (schoolYearResult.length === 0) {
      res.status(400).json({ error: 'No active school year found' });
      return;
    }

    const school_year_id = schoolYearResult[0].school_year_id;

    // Insert the schedule with elective status
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
        elective, // Insert elective flag
      ],
      (err, result) => {
        if (err) {
          console.error('Error adding schedule:', err);
          res.status(500).json({ error: 'Internal server error', details: err.message });
          return;
        }
        res.status(201).json({ message: 'Schedule added successfully', scheduleId: result.insertId });
      }
    );
  });
});

app.post("/api/save-grade", (req, res) => {
  const { student_id, student_name, grade_level, school_year_id, subjects } = req.body;

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
      school_year_id
    ) 
    VALUES ?
    ON DUPLICATE KEY UPDATE 
      grade = VALUES(grade),
      grade_level = VALUES(grade_level),
      subject_name = VALUES(subject_name),
      student_name = VALUES(student_name),
      school_year_id = VALUES(school_year_id)
  `;

  // Prepare the values array
  let values = [];

  subjects.forEach(subject => {
    if (subject.q1 !== null) values.push([grade_level, subject.subject_name, subject.q1, 1, student_id, student_name, school_year_id]);
    if (subject.q2 !== null) values.push([grade_level, subject.subject_name, subject.q2, 2, student_id, student_name, school_year_id]);
    if (subject.q3 !== null) values.push([grade_level, subject.subject_name, subject.q3, 3, student_id, student_name, school_year_id]);
    if (subject.q4 !== null) values.push([grade_level, subject.subject_name, subject.q4, 4, student_id, student_name, school_year_id]);
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

    // Build the main query
    let query = `
      SELECT s.student_id, s.user_id, s.lastname, s.firstname, s.middlename, 
      s.current_yr_lvl, s.birthdate, s.gender, s.age, 
      s.home_address, s.barangay, s.city_municipality, s.province, 
      s.contact_number, s.email_address, s.status as stud_status,
      s.mother_name, s.father_name, s.parent_address, s.father_occupation, 
      s.mother_occupation, s.annual_hshld_income, s.number_of_siblings, 
      s.father_educ_lvl, s.mother_educ_lvl, s.father_contact_number, 
      s.mother_contact_number, IF(s.brigada_eskwela=1,'Attended','Not Attended') AS brigada_eskwela,
      (SELECT ss.status FROM student_school_year ss
      JOIN school_year sy ON ss.school_year_id = sy.school_year_id
      WHERE ss.student_id = s.student_id AND sy.status = 'active') as active_status,
      se.enrollment_status, se.student_elective_id
      FROM student s
      LEFT JOIN student_elective se ON s.student_id = se.student_id 
      LEFT JOIN enrollment xx ON s.student_id=xx.student_id
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
    WHERE a.student_id = ?
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
        s.mother_contact_number, IF(s.brigada_eskwela=1,'Attended','Not Attended') AS brigada_eskwela,
        s.emergency_number, s.emergency_contactperson,
          (SELECT ss.status FROM student_school_year ss
          JOIN school_year sy ON ss.school_year_id = sy.school_year_id
          WHERE ss.student_id = s.student_id AND sy.status = 'active') as active_status,
          se.enrollment_status, se.student_elective_id
        FROM student s
        LEFT JOIN student_elective se ON s.student_id = se.student_id
        LEFT JOIN section z ON s.section_id = z.section_id
        LEFT JOIN student_school_year ss ON s.student_id = ss.student_id
        LEFT JOIN school_year sy ON ss.school_year_id = sy.school_year_id
        WHERE s.active_status = 'unarchive' AND z.section_adviser = ?
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

    const scheduleQuery = `
      SELECT sc.schedule_id, sc.teacher_id,
           IF(sc.elective='0',sb.subject_name,f.name) AS subject_name, 
           TIME_FORMAT(sc.time_start, '%h:%i %p') AS time_start, 
           TIME_FORMAT(sc.time_end, '%h:%i %p') AS time_end, 
           sc.day, sc.section_id, sc.schedule_status,
           CONCAT(e.firstname, ' ', IF(e.middlename IS NOT NULL AND e.middlename != '', CONCAT(LEFT(e.middlename, 1), '. '), ''), e.lastname) AS teacher_name
    FROM SCHEDULE sc
    JOIN SUBJECT sb ON sc.subject_id = sb.subject_id
    LEFT JOIN employee e ON sc.teacher_id = e.employee_id
    LEFT JOIN elective f ON sc.elective=f.elective_id
    LEFT JOIN section_assigned g ON sc.section_id=g.section_id AND sc.teacher_id=g.employee_id
    WHERE g.employee_id= ? and sc.section_id = ?
    ORDER BY sc.time_start
    `;

    db.query(scheduleQuery, [employee_id, sectionId], (err, schedules) => {
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
            sch.teacher_id, 
            sch.schedule_status,
            MAX(CASE WHEN sch.subject_id IS NOT NULL THEN '1' ELSE '0' END) AS hasSched
        FROM SUBJECT s
        LEFT JOIN school_year sy ON s.school_year_id = sy.school_year_id
        LEFT JOIN (
            SELECT DISTINCT subject_id, teacher_id, schedule_status
            FROM SCHEDULE
            WHERE elective = 0
        ) sch ON s.subject_id = sch.subject_id
        ${whereClause}  -- Filters for regular subject
        GROUP BY 
            s.subject_id, s.grade_level, s.subject_name, s.status, s.grading_criteria,
            s.description, s.archive_status, s.school_year_id, sy.school_year, sy.status, sch.teacher_id

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
            sch.teacher_id,
            sch.schedule_status,
            MAX(CASE WHEN sch.subject_id IS NOT NULL THEN '1' ELSE '0' END) AS hasSched
        FROM elective e
        LEFT JOIN (
            SELECT DISTINCT subject_id, teacher_id, schedule_status
            FROM SCHEDULE
            WHERE elective = 1
        ) sch ON e.elective_id = sch.subject_id
        WHERE e.archive_status = 'unarchive'  -- Filter for elective subjects
        GROUP BY 
            e.elective_id, e.name, e.status, e.archive_status, sch.teacher_id
      ) combined
      WHERE teacher_id = ? AND schedule_status='Approved'
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
        s.mother_contact_number, IF(s.brigada_eskwela=1,'Attended','Not Attended') AS brigada_eskwela,
        s.emergency_number, s.emergency_contactperson,
        (SELECT ss.status FROM student_school_year ss
        JOIN school_year sy ON ss.school_year_id = sy.school_year_id
        WHERE ss.student_id = s.student_id AND sy.status = 'active') AS active_status,
        se.enrollment_status, se.student_elective_id
        FROM student s
        LEFT JOIN student_elective se ON s.student_id = se.student_id
        LEFT JOIN section z ON s.section_id = z.section_id
        LEFT JOIN student_school_year ss ON s.student_id = ss.student_id
        LEFT JOIN school_year sy ON ss.school_year_id = sy.school_year_id
        LEFT JOIN subject_assigned d ON z.grade_level=d.level AND z.section_id=d.section_id AND d.school_year_id=z.school_year_id
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