# Fix for Updating Student's Section ID During Enrollment

## Issue
When an enrollment request is approved with a specific section ID in the EnrollmentRequests.js file, the `section_id` is only updated in the `enrollment` table but not in the `student` table.

## Solution
We need to modify the `/validate-enrollment` endpoint in the server.js file to also update the `section_id` in the `student` table when a specific section is provided.

## Instructions

1. Open your `backend/server.js` file

2. Find the 'else' block in the `/validate-enrollment` endpoint that handles when a `sectionId` is provided (around line 1200).
   It should look like this:

```javascript
} else {
  console.log(`Student ID: ${studentId} already has a section ID: ${sectionId}`);
  
  // Update enrollment table with provided sectionId
  const updateEnrollmentWithProvidedSectionQuery = `UPDATE enrollment SET section_id = ? WHERE student_id = ? AND school_year_id = ?;`;

  db.query(updateEnrollmentWithProvidedSectionQuery, [sectionId, studentId, schoolYearId], (err7, result7) => {
    if (err7) {
      console.error('Error updating enrollment with provided section:', err7.message);
      return res.status(500).json({ error: 'Database error: ' + err7.message });
    }

    res.status(200).json({ message: 'Enrollment approved, section updated successfully' });
  });
}
```

3. Replace this block with the following code that also updates the student table:

```javascript
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
```

4. Save the file and restart your server.

## What This Change Does

1. First, it updates the `section_id` in the `student` table using the provided section ID
2. Then it updates the `section_id` in the `enrollment` table (which was already being done)
3. This ensures that both the student record and the enrollment record are updated with the correct section ID

With this change, when you approve an enrollment request and assign a section in the EnrollmentRequests.js interface, both the student table and enrollment table will be updated with the correct section ID. 