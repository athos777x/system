// Grade Level assignment endpoints
module.exports = function(app, db) {
  // ENDPOINT USED:
  // TEACHER PAGE - UPDATE GRADE LEVEL ASSIGNMENT
  app.put('/assign-grade-level/:teacherId', (req, res) => {
    const teacherId = req.params.teacherId;
    const { grade_level, school_year_id } = req.body;
    
    // First check if an assignment exists
    const checkQuery = `
      SELECT grade_level_assigned_id 
      FROM grade_level_assigned 
      WHERE employee_id = ? AND school_year_id = ?
    `;
    
    db.query(checkQuery, [teacherId, school_year_id], (err, results) => {
      if (err) {
        console.error('Error checking existing grade level assignment:', err);
        return res.status(500).json({ error: 'Internal server error' });
      }
      
      if (results.length === 0) {
        // No existing assignment, so insert a new one
        const insertQuery = `
          INSERT INTO grade_level_assigned 
          (employee_id, grade_level, school_year_id) 
          VALUES (?, ?, ?)
        `;
        
        db.query(insertQuery, [teacherId, grade_level, school_year_id], (err, result) => {
          if (err) {
            console.error('Error creating grade level assignment:', err);
            return res.status(500).json({ error: 'Internal server error' });
          }
          
          console.log('Grade level assigned successfully');
          return res.json({ message: 'Grade level assigned successfully' });
        });
      } else {
        // Existing assignment, so update it
        const gradeLevelAssignedId = results[0].grade_level_assigned_id;
        const updateQuery = `
          UPDATE grade_level_assigned 
          SET grade_level = ? 
          WHERE grade_level_assigned_id = ?
        `;
        
        db.query(updateQuery, [grade_level, gradeLevelAssignedId], (err, result) => {
          if (err) {
            console.error('Error updating grade level assignment:', err);
            return res.status(500).json({ error: 'Internal server error' });
          }
          
          console.log('Grade level assignment updated successfully');
          return res.json({ message: 'Grade level assignment updated successfully' });
        });
      }
    });
  });
}; 