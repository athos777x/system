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

          // Update the student's current_yr_lvl in the student table
          const updateStudentQuery = `
            UPDATE student 
            SET current_yr_lvl = ? 
            WHERE student_id = ?
          `;

          db.query(updateStudentQuery, [grade_level, studentId], (err) => {
            if (err) {
              console.error('Error updating student grade level:', err);
              return res.status(500).json({ error: 'Database error during student update' });
            }

            console.log(`Successfully enrolled student ID: ${studentId} and updated grade level to: ${grade_level}`);
            return res.json({ message: 'Student enrolled successfully' });
          });
        });
      });
    });
  });
}); 