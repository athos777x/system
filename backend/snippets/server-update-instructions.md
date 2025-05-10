# Instructions for Updating Student Enrollment

## Issue
When enrolling an old student to a new school year, the system doesn't update the `current_yr_lvl` of the student in the `student` table of the MySQL database.

## Fix
You need to update the `/students/:studentId/enroll-student` endpoint in your server.js file to update the student table after inserting into the `student_school_year` table.

## Steps to Fix

1. Open your `backend/server.js` file.

2. Find this code section (around line 6180) in the app.put('/students/:studentId/enroll-student', ...) function:

```javascript
db.query(insertSSYQuery, [studentId, schoolYearId, student_name, grade_level], (err) => {
  if (err) {
    console.error('Error creating student_school_year:', err);
    return res.status(500).json({ error: 'Database error during student_school_year insert' });
  }

  console.log(`Successfully enrolled student ID: ${studentId}`);
  return res.json({ message: 'Student enrolled successfully' });
});
```

3. Replace this code with the following to add the update to the student table:

```javascript
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
```

4. Save the file and restart your server.

## What This Fix Does

1. After inserting the record into the `student_school_year` table, the code now adds a SQL query to update the `current_yr_lvl` field in the `student` table.
2. It uses the `grade_level` value that was passed in the request to update the student's current year level.
3. This ensures that when a student is enrolled in a new school year, their grade level in the student record is also updated.

## Additional Notes

If you also want to update the `section_id` in the student table, you would need to modify the enrollment process to include a section assignment as part of enrollment, and then update both fields:

```javascript
UPDATE student 
SET current_yr_lvl = ?, section_id = ? 
WHERE student_id = ?
```

However, section assignment often happens separately from enrollment, so you may want to keep these processes separate depending on your application workflow. 