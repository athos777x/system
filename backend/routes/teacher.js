const express = require('express');
const router = express.Router();

// API endpoint to get all subjects assigned to a teacher
router.get('/api/teacher/assigned-subjects', (req, res) => {
  const { userId } = req.query;
  
  if (!userId) {
    return res.status(400).json({ error: 'User ID is required' });
  }

  // Get employee ID first
  const employeeQuery = `
    SELECT employee_id FROM employee WHERE user_id = ?
  `;
  
  req.db.query(employeeQuery, [userId], (employeeErr, employeeResults) => {
    if (employeeErr) {
      console.error('Error fetching employee:', employeeErr);
      return res.status(500).json({ error: 'Failed to fetch employee information' });
    }
    
    if (employeeResults.length === 0) {
      return res.status(404).json({ error: 'Employee not found' });
    }
    
    const employeeId = employeeResults[0].employee_id;
    
    // Now fetch all subjects assigned to this teacher
    const subjectQuery = `
      SELECT s.subject_id, s.subject_name, ts.section_id, s.grade_level
      FROM subject s
      JOIN teacher_subject ts ON s.subject_id = ts.subject_id
      WHERE ts.employee_id = ?
    `;
    
    req.db.query(subjectQuery, [employeeId], (subjectErr, subjectResults) => {
      if (subjectErr) {
        console.error('Error fetching subjects:', subjectErr);
        return res.status(500).json({ error: 'Failed to fetch assigned subjects' });
      }
      
      res.json(subjectResults);
    });
  });
});

// Endpoint to submit grades (sets their state to 'submitted')
router.post("/api/submit-grade", (req, res) => {
  const { student_id, student_name, grade_level, school_year_id, subjects, section_id, period } = req.body;
  const db = req.db;

  if (!student_id || !subjects || subjects.length === 0 || !period) {
    return res.status(400).json({ success: false, message: "Invalid request data." });
  }

  // SQL query for updating grades with submitted state
  const query = `
    INSERT INTO grades (
      grade_level,
      subject_name,
      grade,
      period,
      student_id,
      student_name,
      school_year_id,
      section_id,
      grade_state
    ) 
    VALUES ?
    ON DUPLICATE KEY UPDATE 
      grade = VALUES(grade),
      grade_level = VALUES(grade_level),
      subject_name = VALUES(subject_name),
      student_name = VALUES(student_name),
      school_year_id = VALUES(school_year_id),
      section_id = VALUES(section_id),
      grade_state = VALUES(grade_state)
  `;

  // Prepare the values array
  let values = [];

  subjects.forEach(subject => {
    // Only update for the specified period/quarter
    const quarterField = `q${period}`;
    if (subject[quarterField] !== null) {
      values.push([
        grade_level, 
        subject.subject_name, 
        subject[quarterField], 
        period, 
        student_id, 
        student_name, 
        school_year_id, 
        section_id,
        'submitted' // Set grade_state to 'submitted'
      ]);
    }
  });

  if (values.length === 0) {
    return res.status(400).json({ success: false, message: "No valid grades to submit." });
  }

  // Execute the query
  db.query(query, [values], (err, result) => {
    if (err) {
      console.error("Error submitting grades:", err);
      return res.status(500).json({ success: false, message: "Failed to submit grades." });
    }
    res.json({ success: true, message: "Grades submitted successfully!" });
  });
});

// Endpoint to get grade submission status for a student
router.get("/api/grade-submission-status", (req, res) => {
  const { studentId, gradeLevel, schoolYearId, section_id } = req.query;
  const db = req.db;
  
  if (!studentId || !gradeLevel || !schoolYearId) {
    return res.status(400).json({ 
      success: false, 
      message: 'Student ID, Grade Level, and School Year ID are required.' 
    });
  }
  
  let query;
  let queryParams;
  
  if (!section_id) {
    query = `
      SELECT subject_name, period, grade_state
      FROM grades
      WHERE student_id = ? AND grade_level = ? AND school_year_id = ? 
            AND (section_id IS NULL OR section_id = 0)
            AND grade_state IS NOT NULL
    `;
    queryParams = [studentId, gradeLevel, schoolYearId];
  } else {
    query = `
      SELECT subject_name, period, grade_state
      FROM grades
      WHERE student_id = ? AND grade_level = ? AND school_year_id = ? 
            AND section_id = ?
            AND grade_state IS NOT NULL
    `;
    queryParams = [studentId, gradeLevel, schoolYearId, section_id];
  }
  
  db.query(query, queryParams, (err, results) => {
    if (err) {
      console.error('Error fetching grade submission status:', err);
      return res.status(500).json({ 
        success: false, 
        message: 'Failed to fetch grade submission status.' 
      });
    }
    
    // Transform the results into a more usable format
    const statusMap = {};
    
    results.forEach(row => {
      if (!statusMap[row.subject_name]) {
        statusMap[row.subject_name] = {};
      }
      
      // Map period number to corresponding quarter
      const quarter = `q${row.period}`;
      statusMap[row.subject_name][quarter] = row.grade_state;
    });
    
    res.json({ 
      success: true, 
      submissionStatus: statusMap 
    });
  });
});

// Endpoint to check if a school year is active
router.get('/school-year-status/:id', (req, res) => {
  const { id } = req.params;
  const db = req.db;
  
  if (!id) {
    return res.status(400).json({ error: 'School year ID is required' });
  }
  
  const query = 'SELECT status FROM school_year WHERE school_year_id = ?';
  
  db.query(query, [id], (err, results) => {
    if (err) {
      console.error('Error fetching school year status:', err);
      return res.status(500).json({ error: 'Database error' });
    }
    
    if (results.length === 0) {
      return res.status(404).json({ error: 'School year not found' });
    }
    
    res.json({ status: results[0].status });
  });
});

module.exports = router; 