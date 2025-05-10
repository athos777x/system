# Complete Revised Code for `/validate-enrollment` Endpoint

Below is the complete code for the `/validate-enrollment` endpoint with the proper grade level update included:

```javascript
app.post('/validate-enrollment', (req, res) => {
  const { studentId, action, sectionId } = req.body; // Added sectionId to the request body

  // Fetch active school year
  const getSchoolYearQuery = 'SELECT school_year_id FROM school_year WHERE status = "active"';

  db.query(getSchoolYearQuery, (err, schoolYearResults) => {
    if (err) {
      console.error('Error fetching school year ID:', err);
      return res.status(500).json({ error: 'Database error' });
    }

    if (schoolYearResults.length === 0) {
      console.error('No active school year found');
      return res.status(404).json({ error: 'No active school year found' });
    }

    const schoolYearId = schoolYearResults[0].school_year_id;

    if (action === 'reject') {
      // Handle reject action (existing logic)
      const rejectQuery = `UPDATE student_school_year SET status = 'inactive' WHERE student_id = ?;`;
      const updateEnrollmentQuery = `UPDATE enrollment SET enrollment_status = 'inactive' WHERE student_id = ? AND school_year_id = ?;`;

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
        db.query(updateEnrollmentQuery, [studentId, schoolYearId], (err2, result2) => {
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

        // Step 2: Update enrollment table to 'active' and include school_year_id
        const updateEnrollmentQuery = `UPDATE enrollment SET enrollment_status = 'active' WHERE student_id = ? AND school_year_id = ? ;`;

        db.query(updateEnrollmentQuery, [studentId, schoolYearId], (err2, result2) => {
          if (err2) {
            console.error('Error updating enrollment:', err2.message);
            return res.status(500).json({ error: 'Database error: ' + err2.message });
          }

          if (result2.affectedRows === 0) {
            console.error(`No record found in enrollment for student ID: ${studentId}`);
            return res.status(404).json({ error: 'No matching record found in enrollment' });
          }

          console.log(`Enrollment status updated to 'active' for student ID: ${studentId}`);

          // Get the student's current grade level from the enrollment
          const getGradeLevelQuery = `SELECT grade_level FROM enrollment WHERE student_id = ? AND school_year_id = ?`;

          db.query(getGradeLevelQuery, [studentId, schoolYearId], (err3, gradeResult) => {
            if (err3) {
              console.error('Error fetching grade level:', err3.message);
              return res.status(500).json({ error: 'Database error: ' + err3.message });
            }

            if (gradeResult.length === 0) {
              console.error(`No grade level found for student ID: ${studentId}`);
              return res.status(404).json({ error: 'No grade level found for the student' });
            }

            const gradeLevel = gradeResult[0].grade_level;

            // Update the student's current_yr_lvl in the student table
            const updateStudentGradeQuery = `UPDATE student SET current_yr_lvl = ? WHERE student_id = ?`;

            db.query(updateStudentGradeQuery, [gradeLevel, studentId], (err4, result4) => {
              if (err4) {
                console.error('Error updating student grade level:', err4.message);
                return res.status(500).json({ error: 'Database error: ' + err4.message });
              }

              console.log(`Updated student ID: ${studentId} grade level to: ${gradeLevel}`);

              // Step 3: Assign student to a section based on grade level & gender if sectionId is not provided
              if (!sectionId) {
                const getStudentDetailsQuery = `SELECT gender FROM student WHERE student_id = ?;`;

                db.query(getStudentDetailsQuery, [studentId], (err5, result5) => {
                  if (err5) {
                    console.error('Error fetching student details:', err5.message);
                    return res.status(500).json({ error: 'Database error: ' + err5.message });
                  }

                  if (result5.length === 0) {
                    console.error(`No details found for student ID: ${studentId}`);
                    return res.status(404).json({ error: 'No details found for the student' });
                  }

                  const { gender } = result5[0];

                  // Fetch available sections for this grade level
                  const fetchSectionsQuery = `
                    SELECT section_id, max_capacity,
                      (SELECT COUNT(*) FROM student WHERE section_id = section.section_id AND gender = 'male') AS male_count,
                      (SELECT COUNT(*) FROM student WHERE section_id = section.section_id AND gender = 'female') AS female_count,
                      (SELECT COUNT(*) FROM student WHERE section_id = section.section_id) AS total_count
                    FROM section
                    WHERE grade_level = ?;
                  `;

                  db.query(fetchSectionsQuery, [gradeLevel], (err6, sections) => {
                    if (err6) {
                      console.error('Error fetching sections:', err6.message);
                      return res.status(500).json({ error: 'Database error: ' + err6.message });
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

                    db.query(updateStudentSectionQuery, [selectedSection, studentId], (err7, result7) => {
                      if (err7) {
                        console.error('Error assigning section to student:', err7.message);
                        return res.status(500).json({ error: 'Database error: ' + err7.message });
                      }

                      // Update enrollment table with selected section
                      const updateEnrollmentWithSectionQuery = `UPDATE enrollment SET section_id = ? WHERE student_id = ? AND school_year_id = ?;`;

                      db.query(updateEnrollmentWithSectionQuery, [selectedSection, studentId, schoolYearId], (err8, result8) => {
                        if (err8) {
                          console.error('Error updating enrollment with section:', err8.message);
                          return res.status(500).json({ error: 'Database error: ' + err8.message });
                        }

                        console.log(`Student ID: ${studentId} assigned to section ID: ${selectedSection}`);
                        res.status(200).json({ message: 'Enrollment approved, section assigned, and updated in enrollment successfully' });
                      });
                    });
                  });
                });
              } else {
                console.log(`Student ID: ${studentId} with section ID: ${sectionId}`);
                
                // Update student table with provided sectionId
                const updateStudentSectionQuery = `UPDATE student SET section_id = ? WHERE student_id = ?;`;
                
                db.query(updateStudentSectionQuery, [sectionId, studentId], (err9, result9) => {
                  if (err9) {
                    console.error('Error updating student section:', err9.message);
                    return res.status(500).json({ error: 'Database error: ' + err9.message });
                  }
                  
                  console.log(`Updated student ID: ${studentId} with section ID: ${sectionId} in student table`);
                  
                  // Update enrollment table with provided sectionId
                  const updateEnrollmentWithProvidedSectionQuery = `UPDATE enrollment SET section_id = ? WHERE student_id = ? AND school_year_id = ?;`;
              
                  db.query(updateEnrollmentWithProvidedSectionQuery, [sectionId, studentId, schoolYearId], (err10, result10) => {
                    if (err10) {
                      console.error('Error updating enrollment with provided section:', err10.message);
                      return res.status(500).json({ error: 'Database error: ' + err10.message });
                    }
              
                    res.status(200).json({ message: 'Enrollment approved, student and enrollment section updated successfully' });
                  });
                });
              }
            });
          });
        });
      });
    } else {
      return res.status(400).json({ error: 'Invalid action' });
    }
  });
});
```

# Complete Revised Code for `/students/:studentId/enroll-student` Endpoint

And here is the modified endpoint for enrollment requests that no longer updates the student's grade level:

```javascript
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
        
          // No longer updating student's current_yr_lvl here
          // That will happen only when enrollment is approved
          
          console.log(`Successfully enrolled student ID: ${studentId} for grade level: ${grade_level}`);
          return res.json({ message: 'Student enrollment request submitted successfully' });
        });
      });
    });
  });
}); 