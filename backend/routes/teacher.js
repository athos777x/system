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

module.exports = router; 