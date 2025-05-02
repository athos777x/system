# Grade Level Coordinator Assignment Feature

This feature allows assigning grade levels (7, 8, 9, or 10) to employees with the role of "grade_level_coordinator".

## Setup Instructions

### 1. Database Update

Run the SQL script `src/assets/sqldump/grade_level_assigned_update.sql` to update the database structure:

```sql
-- SQL script to update grade_level_assigned table structure

-- Drop and recreate the table with AUTO_INCREMENT
DROP TABLE IF EXISTS `grade_level_assigned`;

CREATE TABLE `grade_level_assigned` (
  `grade_level_assigned_id` int(12) NOT NULL AUTO_INCREMENT,
  `employee_id` int(12) DEFAULT NULL,
  `grade_level` int(12) DEFAULT NULL,
  `school_year_id` int(12) DEFAULT NULL,
  PRIMARY KEY (`grade_level_assigned_id`),
  UNIQUE KEY `unique_grade_level_assigned` (`employee_id`,`grade_level`,`school_year_id`)
) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8;
```

### 2. API Endpoints

Add the following endpoints to `backend/server.js`. A good place would be after the `/assign-section/:teacherId` endpoint or the `/teacher-section/:teacherId` endpoint:

```javascript
// ENDPOINT USED:
// TEACHER PAGE
app.post('/assign-grade-level/:teacherId', (req, res) => {
  const teacherId = req.params.teacherId;
  const { grade_level, school_year_id } = req.body;
  
  const query = `
    INSERT INTO grade_level_assigned 
    (grade_level_assigned_id, employee_id, grade_level, school_year_id) 
    VALUES (NULL, ?, ?, ?)
    ON DUPLICATE KEY UPDATE 
      employee_id = VALUES(employee_id),
      grade_level = VALUES(grade_level),
      school_year_id = VALUES(school_year_id)
  `;

  db.query(query, [teacherId, grade_level, school_year_id], (err, result) => {
    if (err) {
      console.error('Error assigning grade level:', err);
      res.status(500).json({ error: 'Internal server error' });
      return;
    }
    console.log('Grade level assigned successfully');
    res.json({ message: 'Grade level assigned successfully' });
  });
});

// ENDPOINT USED:
// TEACHER PAGE
app.get('/teacher-grade-level/:teacherId', (req, res) => {
  const teacherId = req.params.teacherId;
  const schoolYearId = req.query.school_year_id; // Get school_year_id from query parameters

  const query = `
    SELECT CONCAT('Grade ', grade_level) AS grade_level 
    FROM grade_level_assigned 
    WHERE employee_id = ? AND school_year_id = ?
  `;

  db.query(query, [teacherId, schoolYearId], (err, results) => {
    if (err) {
      console.error('Error fetching assigned grade levels:', err);
      return res.status(500).json({ error: 'Internal server error' });
    }
    res.json(results);
  });
});
```

For convenience, these endpoints are also available in the `endpoints_to_add.js` file.

### 3. Frontend Updates

The following updates have already been made to `src/TeacherPages/TeacherManagement.js`:

1. Added state variables and functions to manage grade level assignment
2. Added UI components to display assigned grade levels and assignment buttons
3. Created a modal for assigning grade levels to coordinators

## Usage

1. In the Employee Management screen, click "View" on a grade level coordinator (an employee with role_id=5)
2. In the expanded details section, you will see an "Assigned Grade Level" section 
3. Click the "Assign Grade Level" button to open the assignment modal
4. Select a school year and grade level (7-10)
5. Click "Assign Grade Level" to save the assignment

## Notes

- Each coordinator can be assigned to only one grade level per school year
- The unique constraint in the database prevents duplicate assignments
- Only employees with the "grade_level_coordinator" role (role_id=5) will have this option available 