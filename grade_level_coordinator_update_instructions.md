# Instructions for Adding Grade Level Coordinator Update Functionality

Follow these instructions to implement the ability for grade level coordinators to edit their assigned grade level instead of just assigning a new one.

## Backend Changes

### 1. Create a new file `backend/routes/gradelevel-endpoints.js`

Create this file with the following content:

```javascript
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
```

### 2. Update `backend/server.js` to include the new endpoint file

Add the following code after the subject coordinator routes initialization in your server.js file (approximately around line 40):

```javascript
// Import and initialize grade level endpoints
const gradeLevelRoutes = require('./routes/gradelevel-endpoints');
gradeLevelRoutes(app, db);
```

## Frontend Changes

### 1. Update the `handleAssignGradeLevel` function in `src/TeacherPages/TeacherManagement.js`

Replace the existing function with this updated version:

```javascript
const handleAssignGradeLevel = (employeeId) => {
  setCurrentTeacherId(employeeId);
  setShowAssignGradeLevelModal(true);
  
  // If the coordinator already has a grade level assigned, pre-select it
  if (teacherGradeLevel && teacherGradeLevel.length > 0) {
    const currentAssignment = teacherGradeLevel[0]; // Get the first assignment
    // Remove "Grade " prefix and convert to string
    const gradeLevel = currentAssignment.grade_level.replace('Grade ', '');
    setSelectedGradeLevelForCoordinator(gradeLevel);
  } else {
    // Default to grade 7 for new assignments
    setSelectedGradeLevelForCoordinator('7');
  }
};
```

### 2. Update the `handleGradeLevelAssignment` function 

Replace the existing function with this updated version:

```javascript
const handleGradeLevelAssignment = async () => {
  if (!selectedGradeLevelForCoordinator || !selectedSchoolYear) {
    alert('Please select a grade level and school year');
    return;
  }
  
  const isEditing = teacherGradeLevel && teacherGradeLevel.length > 0;
  const method = isEditing ? 'put' : 'post';

  try {
    console.log(`${isEditing ? 'Updating' : 'Assigning'} grade level with:`, {
      teacherId: currentTeacherId,
      gradeLevel: selectedGradeLevelForCoordinator,
      schoolYearId: selectedSchoolYear,
    });

    const response = await axios[method](`http://localhost:3001/assign-grade-level/${currentTeacherId}`, {
      grade_level: selectedGradeLevelForCoordinator,
      school_year_id: selectedSchoolYear,
    });

    if (response.status === 200) {
      alert(isEditing ? 'Grade level updated successfully' : 'Grade level assigned successfully');
      setShowAssignGradeLevelModal(false);
      setSelectedGradeLevelForCoordinator('7');
      fetchTeacherGradeLevel(currentTeacherId, selectedSchoolYear);
    }
  } catch (error) {
    console.error('Error assigning grade level:', error);
    alert('Error assigning grade level: ' + (error.response?.data?.error || error.message));
  }
};
```

### 3. Update the Grade Level Coordinator Button 

Find the button for grade level coordinators (around line 1180) and update it:

```jsx
{teacher.role_id === 5 && (
  <button 
    className={`teacher-mgmt-btn ${teacher.status !== 'active' ? 'teacher-mgmt-btn-disabled' : 'teacher-mgmt-btn-view'}`}
    onClick={() => handleAssignGradeLevel(teacher.employee_id)}
    disabled={teacher.status !== 'active'}
    title={teacher.status !== 'active' ? "Cannot assign grade level to archived employee" : ""}
  >
    {teacherGradeLevel && teacherGradeLevel.length > 0 ? "Edit Grade Level" : "Assign Grade Level"}
  </button>
)}
```

### 4. Update the Grade Level Assignment Modal Title

Find the modal title (around line 1740) and update it:

```jsx
<h2 className="teacher-mgmt-modal-title">
  {teacherGradeLevel && teacherGradeLevel.length > 0 ? 'Edit Grade Level' : 'Assign Grade Level'}
</h2>
```

### 5. Update the Grade Level Assignment Modal Button

Find the submit button in the modal (around line 1775) and update it:

```jsx
<button 
  className="teacher-mgmt-btn teacher-mgmt-btn-view teacher-mgmt-modal-button"
  onClick={handleGradeLevelAssignment}
>
  {teacherGradeLevel && teacherGradeLevel.length > 0 ? 'Update Grade Level' : 'Assign Grade Level'}
</button>
```

## Restart Your Backend Server

After making these changes, restart your backend server for the changes to take effect.

## Verification

Verify that the endpoint is working by:

1. Starting your frontend application
2. Logging in as a teacher or administrator
3. Going to the Teacher Management page
4. Finding a grade level coordinator with an assigned grade level
5. Clicking the "Edit Grade Level" button
6. Selecting a different grade level
7. Clicking "Update Grade Level"
8. Verifying that the change is reflected 