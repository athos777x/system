// This code replaces the 'else' block starting around line 1200 in server.js
// When a section is provided during enrollment approval

} else {
  console.log(`Student ID: ${studentId} with section ID: ${sectionId}`);
  
  // Update student table with provided sectionId
  const updateStudentSectionQuery = `UPDATE student SET section_id = ? WHERE student_id = ?;`;
  
  db.query(updateStudentSectionQuery, [sectionId, studentId], (err6, result6) => {
    if (err6) {
      console.error('Error updating student section:', err6.message);
      return res.status(500).json({ error: 'Database error: ' + err6.message });
    }
    
    console.log(`Updated student ID: ${studentId} with section ID: ${sectionId} in student table`);
    
    // Update enrollment table with provided sectionId
    const updateEnrollmentWithProvidedSectionQuery = `UPDATE enrollment SET section_id = ? WHERE student_id = ? AND school_year_id = ?;`;

    db.query(updateEnrollmentWithProvidedSectionQuery, [sectionId, studentId, schoolYearId], (err7, result7) => {
      if (err7) {
        console.error('Error updating enrollment with provided section:', err7.message);
        return res.status(500).json({ error: 'Database error: ' + err7.message });
      }

      res.status(200).json({ message: 'Enrollment approved, student and enrollment section updated successfully' });
    });
  });
} 