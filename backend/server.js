const express = require('express');
const mysql = require('mysql');
const bodyParser = require('body-parser');
const cors = require('cors');
const bcrypt = require('bcrypt');

const app = express();
app.use(bodyParser.json());
app.use(cors());

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
          SELECT u.username, u.role_id, s.firstname, s.lastname, s.middlename
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


// Endpoint to fetch all students
// Function: Retrieves a list of all students with optional filtering by search term, grade, section, and school year
// Pages: StudentsPage.js, SectionPage.js, GradesPage.js, AttendancePage.js
// Filters: SearchFilter.js
app.get('/students', (req, res) => {
  const { searchTerm, grade, section, school_year } = req.query;      
  console.log('Received params:', { searchTerm, grade, section, school_year });

  const latestSchoolYear = '2023-2024'; // Define the latest school year

  let query = `
    SELECT s  .student_id, s.lastname, s.firstname, s.middlename, s.current_yr_lvl, s.birthdate, s.gender, s.age, 
           s.home_address, s.barangay, s.city_municipality, s.province, s.contact_number, s.email_address, 
           s.mother_name, s.father_name, s.parent_address, s.father_occupation, s.mother_occupation, s.annual_hshld_income, 
           s.number_of_siblings, s.father_educ_lvl, s.mother_educ_lvl, s.father_contact_number, s.mother_contact_number,
           (SELECT ss.status FROM student_school_year ss
            JOIN school_year sy ON ss.school_year_id = sy.school_year_id
            WHERE ss.student_id = s.student_id AND sy.school_year = '${latestSchoolYear}') as active_status
    FROM student s
  `;
  const queryParams = [];
  const conditions = [];

  if (school_year) {
    query = `
      SELECT s.student_id, s.lastname, s.firstname, s.middlename, s.current_yr_lvl, s.birthdate, s.gender, s.age, 
             s.home_address, s.barangay, s.city_municipality, s.province, s.contact_number, s.email_address, 
             s.mother_name, s.father_name, s.parent_address, s.father_occupation, s.mother_occupation, s.annual_hshld_income, 
             s.number_of_siblings, s.father_educ_lvl, s.mother_educ_lvl, s.father_contact_number, s.mother_contact_number, 
             ss.status, sy.school_year,
             (CASE WHEN sy.school_year = '${latestSchoolYear}' THEN ss.status ELSE 'inactive' END) as active_status
      FROM student s
      JOIN student_school_year ss ON s.student_id = ss.student_id
      JOIN school_year sy ON ss.school_year_id = sy.school_year_id
      WHERE sy.school_year = ?
    `;
    queryParams.push(school_year);

    if (school_year === latestSchoolYear) {
      conditions.push(`ss.status = 'active'`);
    }
  }

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
    query += (school_year ? ' AND ' : ' WHERE ') + conditions.join(' AND ');
  }

  query += ' ORDER BY s.firstname'; // Add ORDER BY clause to sort by first name

  console.log('Final query:', query);
  console.log('With parameters:', queryParams);

  db.query(query, queryParams, (err, results) => {
    if (err) {
      console.error('Error fetching students:', err);
      res.status(500).json({ error: 'Internal server error' });
      return;
    }
    console.log('Query results:', results);
    res.json(results);
  });
});

app.post('/registrar-students', (req, res) => {
  const newStudent = req.body; // Get student data from request body
  
  // SQL insert query (make sure your column names match)
  const query = `
    INSERT INTO student (lastname, firstname, middlename, current_yr_lvl, birthdate, gender, age, 
                         home_address, barangay, city_municipality, province, contact_number, 
                         email_address, mother_name, father_name, parent_address, father_occupation, 
                         mother_occupation, annual_hshld_income, number_of_siblings, 
                         father_educ_lvl, mother_educ_lvl, father_contact_number, mother_contact_number, 
                         emergency_number, status, archive_status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;
  
  const queryParams = [
    newStudent.lastname,
    newStudent.firstname,
    newStudent.middlename,
    newStudent.current_yr_lvl,
    newStudent.birthdate,
    newStudent.gender,
    newStudent.age,
    newStudent.home_address,
    newStudent.barangay,
    newStudent.city_municipality,
    newStudent.province,
    newStudent.contact_number,
    newStudent.email_address,
    newStudent.mother_name,
    newStudent.father_name,
    newStudent.parent_address,
    newStudent.father_occupation,
    newStudent.mother_occupation,
    newStudent.annual_hshld_income,
    newStudent.number_of_siblings,
    newStudent.father_educ_lvl,
    newStudent.mother_educ_lvl,
    newStudent.father_contact_number,
    newStudent.mother_contact_number,
    newStudent.emergency_number,
    newStudent.status,
    newStudent.archive_status
  ];
  
  db.query(query, queryParams, (err, result) => {
    if (err) {
      console.error('Error adding new student:', err);
      return res.status(500).json({ error: 'Failed to add student' });
    }
    res.status(201).json({ message: 'Student added successfully', studentId: result.insertId });
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

// Endpoint to fetch attendance data for a specific student
// Function: Retrieves the attendance records of a student based on their student ID
// Pages: AttendancePage.js
app.get('/attendance/:studentId', (req, res) => {
  const studentId = req.params.studentId;
  const query = `
    SELECT a.status, COUNT(*) as count
    FROM attendance a
    JOIN enrollment e ON a.enrollment_id = e.enrollment_id
    WHERE e.student_id = ?
    GROUP BY a.status
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

    const attendanceData = {
      total_school_days: results.reduce((acc, curr) => acc + curr.count, 0),
      days_present: results.find(r => r.status === 'P')?.count || 0,
      days_absent: results.find(r => r.status === 'A')?.count || 0,
      days_late: results.find(r => r.status === 'L')?.count || 0,
      brigada_attendance: results.find(r => r.status === 'B')?.count || 0
    };

    res.json(attendanceData);
  });
});

// Fetch school years
// Function: Retrieves all school years in descending order
// Pages: SchoolYearSearchFilter.js, SearchFilter.js
app.get('/api/school_years', (req, res) => {
  const query = 'SELECT school_year FROM school_year ORDER BY school_year DESC';
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
  try {
    const currentSchoolYear = '2023-2024'; // Replace with actual logic to fetch from database
    res.json({ schoolYear: currentSchoolYear });
  } catch (error) {
    res.status(500).send('Error fetching current school year');
  }
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

// Endpoint to fetch all employees
// Function: Retrieves a list of all employees with optional filtering by status, position, department, search term, and archive status
// Pages: EmployeePage.js
// Filters: EmployeeSearchFilter.js
app.get('/employees', (req, res) => {
  const { status, position, department, searchTerm, showArchive } = req.query;

  let query = 'SELECT * FROM employee WHERE 1=1';
  const queryParams = [];

  if (status === 'showAll') {
    // Show all employees, including archived ones
  } else if (status) {
    // Filter by status and exclude archived employees
    query += ' AND status = ?';
    queryParams.push(status);
  }

  if (showArchive === 'archive') {
    query += ' AND archive_status = "archive"';
  } else if (showArchive === 'unarchive') {
    query += ' AND archive_status = "unarchive"';
  }

  if (position) {
    const formattedPosition = position.replace(/\s/g, '_').toLowerCase();
    query += ' AND role_name = ?';
    queryParams.push(formattedPosition);
  }

  if (department) {
    query += ' AND department = ?';
    queryParams.push(department);
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
    res.json(results);
  });
});

// Endpoint to fetch employee details by ID
// Function: Fetches detailed information about an employee based on their employee ID
// Pages: EmployeePage.js
app.get('/employees/:employeeId', (req, res) => {
  const { employeeId } = req.params;
  const query = 'SELECT * FROM employee WHERE employee_id = ?';
  db.query(query, [employeeId], (err, results) => {
    if (err) {
      console.error('Error fetching employee details:', err);
      res.status(500).json({ error: 'Internal server error' });
      return;
    }
    if (results.length > 0) {
      res.json(results[0]);
    } else {
      res.status(404).json({ error: 'Employee not found' });
    }
  });
});


// Endpoint to update employee details by ID
// Function: Updates an employee's details based on their employee ID
// Pages: EmployeePage.js
app.put('/employees/:employeeId', (req, res) => {
  const { employeeId } = req.params;
  const updatedEmployee = req.body;

  console.log(`Updating employee with ID: ${employeeId}`, updatedEmployee);

  // Fetch the role_id based on the role_name
  const roleQuery = 'SELECT role_id FROM roles WHERE role_name = ?';
  db.query(roleQuery, [updatedEmployee.role_name], (err, roleResults) => {
    if (err) {
      console.error('Error fetching role ID:', err);
      res.status(500).json({ error: 'Internal server error' });
      return;
    }

    if (roleResults.length > 0) {
      const roleId = roleResults[0].role_id;
      updatedEmployee.role_id = roleId;

      console.log('Role ID fetched:', roleId);

      const query = 'UPDATE employee SET ? WHERE employee_id = ?';
      db.query(query, [updatedEmployee, employeeId], (err, results) => {
        if (err) {
          console.error('Error updating employee details:', err);
          res.status(500).json({ error: 'Internal server error' });
          return;
        }
        if (results.affectedRows > 0) {
          res.json({ message: 'Employee updated successfully' });
        } else {
          res.status(404).json({ error: 'Employee not found' });
        }
      });
    } else {
      console.error('Role not found:', updatedEmployee.role_name);
      res.status(404).json({ error: 'Role not found' });
    }
  });
});

// Endpoint to archive an employee
// Function: Archives an employee by updating their status to inactive and archive status to archive
// Pages: EmployeePage.js
app.put('/employees/:employeeId/archive', (req, res) => {
  const { employeeId } = req.params;
  const query = 'UPDATE employee SET archive_status = "archive", status = "inactive" WHERE employee_id = ?';
  db.query(query, [employeeId], (err, results) => {
    if (err) {
      console.error('Error archiving employee:', err);
      res.status(500).json({ error: 'Internal server error' });
      return;
    }
    if (results.affectedRows > 0) {
      res.json({ message: 'Employee archived and set to inactive successfully' });
    } else {
      res.status(404).json({ error: 'Employee not found' });
    }
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

// Endpoint to fetch roles
// Function: Retrieves a list of roles from the roles table
// Pages: EmployeePage.js
app.get('/roles', (req, res) => {
  const query = 'SELECT role_name FROM roles';
  db.query(query, (err, results) => {
    if (err) {
      console.error('Error fetching roles:', err);
      res.status(500).json({ error: 'Internal server error' });
      return;
    }
    res.json(results.map(role => role.role_name));
  });
});

// Fetch all school years
// Function: Retrieves a list of all school years
// Pages: SchoolYearPage.js, SchoolYearSearchFilter.js
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
  } else {
    query += ' WHERE status = "active"'; // Default filter to show only active school years
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

// Fetch specific school year details
// Function: Retrieves detailed information about a specific school year based on its ID
// Pages: SchoolYearPage.js
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

// Endpoint to add a new school year
// Function: Adds a new school year to the database
// Pages: SchoolYearPage.js
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

// Endpoint to update school year details by ID
// Function: Updates the details of a school year based on its ID
// Pages: SchoolYearPage.js
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

// Endpoint to fetch sections
// Function: Retrieves sections with optional filtering by search term, grade, and archive status
// Pages: SectionPage.js, SectionListPage.js
// Filters: SectionListSearchFilter.js, SectionSearchFilter.js, SearchFilter.js
app.get('/sections', (req, res) => {
  const { searchTerm, grade, showArchive } = req.query;
  let query = `
    SELECT s.section_id, s.section_name, s.grade_level, s.status, s.max_capacity, sy.school_year, s.archive_status, s.room_number
    FROM section s
    JOIN school_year sy ON s.school_year_id = sy.school_year_id
    WHERE sy.status = 'active'
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

// Endpoint to fetch section details by ID
// Function: Retrieves detailed information about a section based on its ID
// Pages: SectionPage.js, SectionListPage.js
app.get('/sections/:id', (req, res) => {
  const { id } = req.params;
  const query = `
    SELECT s.section_id, s.section_name, s.grade_level, s.status, s.max_capacity, sy.school_year, s.room_number
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

// Fetch students by section ID and segregate by gender
// Function: Retrieves students in a specific section and segregates them by gender
// Pages: SectionPage.js, SectionListPage.js
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

// Endpoint to add a new section
// Function: Adds a new section to the database
// Pages: SectionPage.js
app.post('/sections', (req, res) => {
  const { section_name, grade_level, status, max_capacity, school_year_id, room_number } = req.body;

  // Log the request body to see the received data
  console.log('Request body:', req.body);

  // SQL query to insert a new section with archive_status defaulted to 'unarchive'
  const query = `
    INSERT INTO section (section_name, grade_level, status, max_capacity, school_year_id, room_number, archive_status)
    VALUES (?, ?, ?, ?, ?, ?, 'unarchive')
  `;

  // Execute the query
  db.query(query, [section_name, grade_level, status, max_capacity, school_year_id, room_number], (err, result) => {
    if (err) {
      // Log the error for detailed analysis
      console.error('Error adding new section:', err);
      res.status(500).json({ error: 'Internal server error', details: err.message });
      return;
    }
    res.status(201).json({ message: 'Section added successfully' });
  });
});

// Endpoint to archive a section
// Function: Archives a section by updating its status to inactive and archive status to archive
// Pages: SectionPage.js
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

// Endpoint to fetch enrolled students
// Function: Retrieves a list of all enrolled students with optional filtering by status, grade, section, etc.
// Pages: EnrolledStudentsPage.js
app.get('/enrolled-students', (req, res) => {
  const { status, grade, section, searchTerm } = req.query;
  let query = `
    SELECT s.student_id, s.firstname, s.middlename, s.lastname, e.grade_level, e.enrollment_status
    FROM student s
    JOIN enrollment e ON s.student_id = e.student_id
    WHERE 1=1
  `;
  const queryParams = [];

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

// Endpoint to fetch schedules for a specific section
app.get('/sections/:sectionId/schedules', (req, res) => {
  const { sectionId } = req.params;
  const query = `
    SELECT sc.schedule_id, sc.teacher_id, sb.subject_name, 
           TIME_FORMAT(sc.time_start, '%h:%i %p') as time_start, 
           TIME_FORMAT(sc.time_end, '%h:%i %p') as time_end, 
           sc.day, sc.section_id, sc.schedule_status
    FROM schedule sc
    JOIN subject sb ON sc.subject_id = sb.subject_id
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

// New endpoint to approve a schedule
app.put('/schedules/:scheduleId/approve', (req, res) => {
  const { scheduleId } = req.params;
  const query = 'UPDATE schedule SET schedule_status = "Approved" WHERE schedule_id = ?';
  db.query(query, [scheduleId], (err, results) => {
    if (err) {
      console.error('Error approving schedule:', err);
      res.status(500).json({ error: 'Internal server error' });
      return;
    }
    if (results.affectedRows > 0) {
      res.json({ message: 'Schedule approved successfully' });
    } else {
      res.status(404).json({ error: 'Schedule not found' });
    }
  });
});

// Endpoint to update schedule details by ID
app.put('/schedules/:scheduleId', (req, res) => {
  const { scheduleId } = req.params;
  const { teacher_id, time_start, time_end, day, schedule_status } = req.body;
  const query = 'UPDATE schedule SET teacher_id = ?, time_start = ?, time_end = ?, day = ?, schedule_status = ? WHERE schedule_id = ?';
  db.query(query, [teacher_id, time_start, time_end, day, schedule_status, scheduleId], (err, results) => {
    if (err) {
      console.error('Error updating schedule details:', err);
      res.status(500).json({ error: 'Internal server error' });
      return;
    }
    if (results.affectedRows > 0) {
      res.json({ message: 'Schedule updated successfully' });
    } else {
      res.status(404).json({ error: 'Schedule not found' });
    }
  });
});

// Endpoint to get subjects and subjects details
// Function: Retrieves subjects with optional filtering by search term, school year, grade, and archive status
// Pages: SubjectsPage.js
// Filters: SubjectsSearchFilter.js
app.get('/subjects', (req, res) => {
  const { searchTerm, school_year, grade, archive_status } = req.query;
  
  let query = `
    SELECT s.subject_id, s.grade_level, s.subject_name, s.status, s.grading_criteria, s.description, s.archive_status, sy.school_year
    FROM subject s
    JOIN school_year sy ON s.school_year_id = sy.school_year_id
    WHERE s.archive_status = ?
  `;
  const queryParams = [archive_status];

  if (searchTerm) {
    query += ' AND s.subject_name LIKE ?';
    queryParams.push(`%${searchTerm}%`);
  }

  if (school_year) {
    query += ' AND sy.school_year = ?';
    queryParams.push(school_year);
  }

  if (grade) {
    query += ' AND s.grade_level = ?';
    queryParams.push(grade);
  }

  db.query(query, queryParams, (error, results) => {
    if (error) {
      return res.status(500).send(error);
    }
    res.send(results);
  });
});

// Endpoint to update subject details
// Function: Updates a subject's details based on its subject ID
// Pages: SubjectsPage.js
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

  console.log(`Updating subject with ID: ${subjectId}`, updatedSubject);

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

// Endpoint to archive or unarchive a subject
// Function: Archives or unarchives a subject by updating its status and archive status
// Pages: SubjectsPage.js
app.put('/subjects/:subjectId/archive', (req, res) => {
  const { subjectId } = req.params;
  const { status, archive_status } = req.body;
  const query = 'UPDATE subject SET status = ?, archive_status = ? WHERE subject_id = ?';
  db.query(query, [status, archive_status, subjectId], (err, results) => {
    if (err) {
      console.error('Error updating subject:', err);
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

// Endpoint to add a new subject
// Function: Adds a new subject to the database
// Pages: SubjectsPage.js
app.post('/subjects', (req, res) => {
  const { subject_name, grade_level, status, grading_criteria, description, school_year, archive_status } = req.body;
  const query = `
    INSERT INTO subject (subject_name, grade_level, status, grading_criteria, description, school_year_id, archive_status)
    VALUES (?, ?, ?, ?, ?, (SELECT school_year_id FROM school_year WHERE school_year = ?), ?)
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

// Endpoint to update section details by ID
// Function: Updates section details
// Pages: SectionPage.js
app.put('/sections/:sectionId', (req, res) => {
  const { sectionId } = req.params;
  const updatedSection = req.body;

  // Remove any fields that don't exist in the 'section' table
  const allowedFields = ['section_name', 'grade_level', 'status', 'max_capacity', 'school_year_id', 'room_number', 'archive_status'];
  const sanitizedUpdate = {};
  for (const key in updatedSection) {
    if (allowedFields.includes(key)) {
      sanitizedUpdate[key] = updatedSection[key];
    }
  }

  const query = 'UPDATE section SET ? WHERE section_id = ?';
  db.query(query, [sanitizedUpdate, sectionId], (err, results) => {
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

// Endpoint to fetch student profile details by user ID
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

// Endpoint to fetch grades for the currently logged in student using userId
app.get('/user/:userId/grades', (req, res) => {
  const userId = req.params.userId;
  const query = `
    SELECT g.first_quarter, g.second_quarter, g.third_quarter, g.fourth_quarter, g.final_grade, g.remarks, s.subject_name, g.grade_level
    FROM grades g
    JOIN schedule sc ON g.schedule_id = sc.schedule_id
    JOIN subject s ON sc.subject_id = s.subject_id
    WHERE g.user_id = ?
  `;
  console.log(`Fetching grades for userId: ${userId}`); // Debug log

  db.query(query, [userId], (err, results) => {
    if (err) {
      console.error('Error fetching grades:', err);
      res.status(500).send('Error fetching grades');
    } else {
      console.log('Grades fetched from DB:', results); // Debug log
      res.json(results);
    }
  });
});

// Endpoint to fetch schedule for the currently logged-in student
app.get('/user/:userId/schedule', (req, res) => {
  const userId = req.params.userId;
  const query = `
    SELECT s.subject_name, sc.day, 
           TIME_FORMAT(sc.time_start, '%H:%i:%s') as time_start, 
           TIME_FORMAT(sc.time_end, '%h:%i %p') as time_end
    FROM schedule sc
    JOIN subject s ON sc.subject_id = s.subject_id
    JOIN section sec ON sc.section_id = sec.section_id
    JOIN enrollment e ON e.section_id = sec.section_id
    JOIN student st ON st.student_id = e.student_id
    WHERE st.user_id = ? AND e.enrollment_status = 'active' AND sc.schedule_status = 'Approved'
    ORDER BY FIELD(sc.day, 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'), sc.time_start;
  `;
  db.query(query, [userId], (err, results) => {
    if (err) {
      console.error('Error fetching schedule:', err);
      res.status(500).send('Error fetching schedule');
    } else {
      res.json(results);
    }
  });
});

// New endpoint to change the user's password
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






app.listen(3001, () => {
  console.log('Server running on port 3001');
});
