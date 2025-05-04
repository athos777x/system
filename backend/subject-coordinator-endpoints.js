// Endpoint for assigning subjects to subject coordinators
// Function: Assigns a subject to a subject coordinator for a specific school year
module.exports = function(app, db) {
  app.post('/assign-subject-to-coordinator', (req, res) => {
    const { subject_id, employee_id, school_year_id } = req.body;
    
    if (!subject_id || !employee_id || !school_year_id) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Check if the employee is a subject coordinator
    const checkRoleQuery = `
      SELECT u.role_id 
      FROM employee e
      JOIN users u ON e.user_id = u.user_id
      WHERE e.employee_id = ?
    `;

    db.query(checkRoleQuery, [employee_id], (err, results) => {
      if (err) {
        console.error('Error checking employee role:', err);
        return res.status(500).json({ error: 'Database error' });
      }

      if (results.length === 0) {
        return res.status(404).json({ error: 'Employee not found' });
      }

      const role_id = results[0].role_id;
      if (role_id !== 8) { // 8 is subject_coordinator role_id
        return res.status(403).json({ error: 'Employee is not a subject coordinator' });
      }

      // Check if this subject is already assigned to another coordinator
      const checkExistingQuery = `
        SELECT * FROM subject_assigned 
        WHERE subject_id = ? AND school_year_id = ?
      `;

      db.query(checkExistingQuery, [subject_id, school_year_id], (err, results) => {
        if (err) {
          console.error('Error checking existing assignment:', err);
          return res.status(500).json({ error: 'Database error' });
        }

        if (results.length > 0) {
          // There's an existing assignment
          const existingAssignment = results[0];
          if (existingAssignment.employee_id === parseInt(employee_id)) {
            return res.status(409).json({ 
              error: 'This subject is already assigned to this coordinator',
              existing: existingAssignment 
            });
          } else {
            return res.status(409).json({ 
              error: 'This subject is already assigned to another coordinator',
              existing: existingAssignment 
            });
          }
        }

        // Proceed with the assignment
        const insertQuery = `
          INSERT INTO subject_assigned 
          (subject_id, employee_id, school_year_id) 
          VALUES (?, ?, ?)
        `;

        db.query(insertQuery, [subject_id, employee_id, school_year_id], (err, results) => {
          if (err) {
            console.error('Error assigning subject to coordinator:', err);
            return res.status(500).json({ error: 'Failed to assign subject to coordinator' });
          }

          res.status(201).json({ 
            message: 'Subject assigned to coordinator successfully',
            assignment_id: results.insertId
          });
        });
      });
    });
  });

  // Endpoint to get all subjects assigned to a coordinator
  // Function: Retrieves all subjects assigned to a specific subject coordinator
  app.get('/coordinator-subjects/:employee_id', (req, res) => {
    const employee_id = req.params.employee_id;
    const school_year_id = req.query.school_year_id;
    
    if (!school_year_id) {
      return res.status(400).json({ error: 'School year ID is required' });
    }

    const query = `
      SELECT sa.subjectcoordinator_assigned_id, sa.subject_id, sa.employee_id, sa.school_year_id,
             s.subject_name, s.grade_level, s.description, s.status, s.elective,
             sy.school_year
      FROM subject_assigned sa
      JOIN subject s ON sa.subject_id = s.subject_id
      JOIN school_year sy ON sa.school_year_id = sy.school_year_id
      WHERE sa.employee_id = ? AND sa.school_year_id = ?
    `;

    db.query(query, [employee_id, school_year_id], (err, results) => {
      if (err) {
        console.error('Error fetching coordinator subjects:', err);
        return res.status(500).json({ error: 'Database error' });
      }

      res.json(results);
    });
  });

  // Endpoint to get all unassigned subjects
  // Function: Retrieves all subjects that are not yet assigned to any subject coordinator
  app.get('/unassigned-subjects', (req, res) => {
    const school_year_id = req.query.school_year_id;
    
    if (!school_year_id) {
      return res.status(400).json({ error: 'School year ID is required' });
    }

    const query = `
      SELECT s.subject_id, s.subject_name, s.grade_level, s.description, s.status, s.elective,
             sy.school_year
      FROM subject s
      JOIN school_year sy ON s.school_year_id = sy.school_year_id
      WHERE s.school_year_id = ? 
      AND s.subject_id NOT IN (
        SELECT subject_id FROM subject_assigned WHERE school_year_id = ?
      )
    `;

    db.query(query, [school_year_id, school_year_id], (err, results) => {
      if (err) {
        console.error('Error fetching unassigned subjects:', err);
        return res.status(500).json({ error: 'Database error' });
      }

      res.json(results);
    });
  });

  // Endpoint to remove subject assignment from a coordinator
  // Function: Removes a subject assignment from a coordinator
  app.delete('/coordinator-subject/:assignment_id', (req, res) => {
    const assignment_id = req.params.assignment_id;

    const query = `
      DELETE FROM subject_assigned 
      WHERE subjectcoordinator_assigned_id = ?
    `;

    db.query(query, [assignment_id], (err, results) => {
      if (err) {
        console.error('Error removing subject assignment:', err);
        return res.status(500).json({ error: 'Database error' });
      }

      if (results.affectedRows === 0) {
        return res.status(404).json({ error: 'Assignment not found' });
      }

      res.json({ message: 'Subject assignment removed successfully' });
    });
  });

  // Endpoint to get subjects for a subject coordinator
  // Function: Retrieves all subjects assigned to a specific coordinator based on userId
  app.get('/subjects/by-coordinator/:userId', (req, res) => {
    const userId = req.params.userId;
    const { school_year, grade, searchTerm, archive_status } = req.query;
    
    // Get the employee_id from the userId
    const getEmployeeIdQuery = `
      SELECT employee_id 
      FROM employee 
      WHERE user_id = ?
    `;
    
    db.query(getEmployeeIdQuery, [userId], (err, employeeResults) => {
      if (err) {
        console.error('Error getting employee ID:', err);
        return res.status(500).json({ error: 'Database error' });
      }
      
      if (employeeResults.length === 0) {
        return res.status(404).json({ error: 'Employee not found' });
      }
      
      const employeeId = employeeResults[0].employee_id;
      
      // Now get the subjects assigned to this coordinator
      let query = `
        SELECT s.subject_id, s.subject_name, s.grade_level, s.description, s.status, 
          s.archive_status, s.elective as subject_type, sa.subjectcoordinator_assigned_id,
          sy.school_year
        FROM subject_assigned sa
        JOIN subject s ON sa.subject_id = s.subject_id
        JOIN school_year sy ON sa.school_year_id = sy.school_year_id
        WHERE sa.employee_id = ?
      `;
      
      const queryParams = [employeeId];
      
      // Add filters if provided
      if (school_year) {
        query += ` AND sy.school_year = ?`;
        queryParams.push(school_year);
      }
      
      if (grade) {
        query += ` AND s.grade_level = ?`;
        queryParams.push(grade);
      }
      
      if (searchTerm) {
        query += ` AND s.subject_name LIKE ?`;
        queryParams.push(`%${searchTerm}%`);
      }
      
      if (archive_status) {
        query += ` AND s.archive_status = ?`;
        queryParams.push(archive_status);
      }
      
      db.query(query, queryParams, (err, results) => {
        if (err) {
          console.error('Error fetching subjects by coordinator:', err);
          return res.status(500).json({ error: 'Database error' });
        }
        
        // Format the results to match the expected structure in the frontend
        const formattedResults = results.map(subject => ({
          ...subject,
          subject_type: subject.subject_type === 'Y' ? 'elective' : 'regular'
        }));
        
        res.json(formattedResults);
      });
    });
  });

  // Endpoint to allow subject coordinators to edit subjects
  // Function: Updates a subject assigned to a coordinator
  app.put('/subjects/coordinator-edit/:subjectId', (req, res) => {
    const subjectId = req.params.subjectId;
    const { userId, description, status } = req.body;
    
    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }
    
    // Get the employee_id from the userId
    const getEmployeeIdQuery = `
      SELECT employee_id 
      FROM employee 
      WHERE user_id = ?
    `;
    
    db.query(getEmployeeIdQuery, [userId], (err, employeeResults) => {
      if (err) {
        console.error('Error getting employee ID:', err);
        return res.status(500).json({ error: 'Database error' });
      }
      
      if (employeeResults.length === 0) {
        return res.status(404).json({ error: 'Employee not found' });
      }
      
      const employeeId = employeeResults[0].employee_id;
      
      // Check if this subject is assigned to this coordinator
      const checkAssignmentQuery = `
        SELECT * FROM subject_assigned 
        WHERE subject_id = ? AND employee_id = ?
      `;
      
      db.query(checkAssignmentQuery, [subjectId, employeeId], (err, assignmentResults) => {
        if (err) {
          console.error('Error checking subject assignment:', err);
          return res.status(500).json({ error: 'Database error' });
        }
        
        if (assignmentResults.length === 0) {
          return res.status(403).json({ error: 'Not authorized to edit this subject' });
        }
        
        // Update the subject (allow limited fields for coordinator to edit)
        const updateQuery = `
          UPDATE subject 
          SET description = ?, status = ?
          WHERE subject_id = ?
        `;
        
        db.query(updateQuery, [description, status, subjectId], (err, results) => {
          if (err) {
            console.error('Error updating subject:', err);
            return res.status(500).json({ error: 'Failed to update subject' });
          }
          
          if (results.affectedRows === 0) {
            return res.status(404).json({ error: 'Subject not found' });
          }
          
          res.json({ message: 'Subject updated successfully' });
        });
      });
    });
  });
}; 