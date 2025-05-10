# Enrollment Process Logic Fix Instructions

## Issue
Currently, the student's `current_yr_lvl` is being updated in the student table when initially requesting enrollment in EnrollStudentManagement.js. However, this should only happen when the enrollment request is approved in EnrollmentRequests.js.

## Solution
We need to modify two endpoints:
1. Remove the student table grade level update from the enrollment request process
2. Add the student table grade level update to the enrollment approval process

## Step 1: Modify the `/students/:studentId/enroll-student` Endpoint

This endpoint is called from EnrollStudentManagement.js when requesting enrollment.

1. Open your `backend/server.js` file

2. Find the `/students/:studentId/enroll-student` section (around line 6150)

3. Look for the code that updates the student's `current_yr_lvl` after adding records to student_school_year:

```javascript
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
```

4. Replace this entire block with the following code (which simply returns success without updating the student table):

```javascript
console.log(`Successfully enrolled student ID: ${studentId} for grade level: ${grade_level}`);
return res.json({ message: 'Student enrollment request submitted successfully' });
```

## Step 2: Modify the `/validate-enrollment` Endpoint

This endpoint is called from EnrollmentRequests.js when approving enrollment.

1. Find the `/validate-enrollment` endpoint in your `backend/server.js` file

2. In the 'approve' action section, locate this line (around line 1144):

```javascript
console.log(`Enrollment status updated to 'active' for student ID: ${studentId}`);
```

3. Add the following code immediately after that line and before the section assignment code:

```javascript
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
```

4. Make sure to properly nest the rest of the code after this addition. The existing section assignment code should be moved inside this new callback.

5. For the manual section assignment case (where a section is provided), make sure it also updates both the grade level and section ID.

## Result of Changes

After making these changes:
1. When requesting enrollment (EnrollStudentManagement.js), the system will only create enrollment and student_school_year records with "pending" status
2. When approving the enrollment (EnrollmentRequests.js), the system will:
   - Update the enrollment and student_school_year records to "active" status
   - Update the student's `current_yr_lvl` in the student table
   - Update the student's `section_id` in the student table (if a section is assigned)

This provides a more logical flow for your enrollment process, where student record updates only happen after administrative approval. 