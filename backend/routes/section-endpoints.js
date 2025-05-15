// This file contains endpoints for section assignment operations
module.exports = function(app, db) {
  // ENDPOINT USED:
  // TEACHER PAGE - UPDATE SECTION ASSIGNMENT
  app.put('/assign-section/:teacherId', (req, res) => {
    const teacherId = req.params.teacherId;
    const { section_id, grade_level, school_year_id } = req.body;
    
    // First check if an assignment exists
    const checkQuery = `
      SELECT section_assigned_id 
      FROM section_assigned 
      WHERE employee_id = ? AND school_year_id = ?
    `;
    
    db.query(checkQuery, [teacherId, school_year_id], (err, results) => {
      if (err) {
        console.error('Error checking existing section assignment:', err);
        return res.status(500).json({ error: 'Internal server error' });
      }
      
      if (results.length === 0) {
        // No existing assignment, so insert a new one
        const insertQuery = `
          INSERT INTO section_assigned (section_id, LEVEL, employee_id, school_year_id) 
          VALUES (?, ?, ?, ?)
        `;
        
        db.query(insertQuery, [section_id, grade_level, teacherId, school_year_id], (err, result) => {
          if (err) {
            console.error('Error creating section assignment:', err);
            return res.status(500).json({ error: 'Internal server error' });
          }
          
          console.log('Section assigned successfully');
          return res.json({ message: 'Section assigned successfully' });
        });
      } else {
        // Existing assignment, so update it
        const sectionAssignedId = results[0].section_assigned_id;
        const updateQuery = `
          UPDATE section_assigned 
          SET section_id = ?, LEVEL = ? 
          WHERE section_assigned_id = ?
        `;
        
        db.query(updateQuery, [section_id, grade_level, sectionAssignedId], (err, result) => {
          if (err) {
            console.error('Error updating section assignment:', err);
            return res.status(500).json({ error: 'Internal server error' });
          }
          
          console.log('Section assignment updated successfully');
          return res.json({ message: 'Section assignment updated successfully' });
        });
      }
    });
  });
}; 