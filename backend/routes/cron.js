const express = require('express');
const router = express.Router();

// Endpoint to level up students and update their statuses
router.put('/level-up-students', (req, res) => {
  const activeStudentsQuery = `
    SELECT e.student_id, e.section_id, e.grade_level, e.enrollment_status 
    FROM enrollment e
    LEFT JOIN school_year sy ON e.school_year_id = sy.school_year_id
    WHERE sy.status = 'active'
  `;

  req.db.query(activeStudentsQuery, (err, results) => {
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

      req.db.query(updateStudentQuery, values, (updateErr) => {
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

          req.db.query(updateEnrollmentQuery, (enrollmentErr) => {
            if (enrollmentErr) {
              console.error('Error updating enrollment statuses:', enrollmentErr);
              return res.status(500).json({ error: 'Failed to update enrollment statuses' });
            }

            req.db.query(updateStudentSchoolYearQuery, (ssyErr) => {
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

module.exports = router; 