# Restricting Grade Level Filters for Grade Level Coordinators

This document explains how to implement a feature that restricts grade level coordinators to only see and interact with sections/data from their assigned grade level.

## Overview

Grade level coordinators should only be able to work with data related to their assigned grade level. This means:
1. The grade level filter should be pre-set to their assigned grade level
2. The grade level filter should be disabled (non-changeable)
3. Only data from their assigned grade level should be displayed

## Implementation Steps

### 1. Backend: Create an API Endpoint to Fetch Coordinator's Grade Level

```javascript
// Add this endpoint to server.js
app.get('/coordinator-grade-level/:userId', (req, res) => {
  const userId = req.params.userId;
  
  // First, get the employee_id from the user_id
  const employeeQuery = `
    SELECT employee_id FROM employee WHERE user_id = ?
  `;
  
  db.query(employeeQuery, [userId], (err, employeeResults) => {
    if (err) {
      console.error('Error fetching employee ID:', err);
      return res.status(500).json({ error: 'Internal server error' });
    }
    
    if (employeeResults.length === 0) {
      return res.status(404).json({ error: 'Employee not found' });
    }
    
    const employeeId = employeeResults[0].employee_id;
    
    // Get the active school year
    const schoolYearQuery = `SELECT school_year_id FROM school_year WHERE status = 'active'`;
    
    db.query(schoolYearQuery, (err, schoolYearResults) => {
      if (err) {
        console.error('Error fetching active school year:', err);
        return res.status(500).json({ error: 'Internal server error' });
      }
      
      if (schoolYearResults.length === 0) {
        return res.status(404).json({ error: 'No active school year found' });
      }
      
      const schoolYearId = schoolYearResults[0].school_year_id;
      
      // Get the grade level assigned to this coordinator for the active school year
      const query = `
        SELECT grade_level 
        FROM grade_level_assigned 
        WHERE employee_id = ? AND school_year_id = ?
      `;
      
      db.query(query, [employeeId, schoolYearId], (err, results) => {
        if (err) {
          console.error('Error fetching coordinator grade level:', err);
          return res.status(500).json({ error: 'Internal server error' });
        }
        
        if (results.length === 0) {
          return res.json({ gradeLevel: null });
        }
        
        res.json({ gradeLevel: results[0].grade_level });
      });
    });
  });
});
```

### 2. Frontend: Add State for Coordinator's Grade Level

In your React component, add a state variable to store the coordinator's assigned grade level:

```javascript
const [coordinatorGradeLevel, setCoordinatorGradeLevel] = useState(null);
```

### 3. Frontend: Fetch the Coordinator's Grade Level

Modify your `fetchUserRole` function to call the new endpoint when the user is a grade level coordinator:

```javascript
const fetchUserRole = async (userId) => {
  try {
    const response = await axios.get(`http://localhost:3001/user-role/${userId}`);
    if (response.status === 200) {
      setRoleName(response.data.role_name);
      
      // If user is a grade level coordinator, fetch their assigned grade level
      if (response.data.role_name === 'grade_level_coordinator') {
        fetchCoordinatorGradeLevel(userId);
      }
    }
  } catch (error) {
    console.error('Error fetching user role:', error);
  }
};

const fetchCoordinatorGradeLevel = async (userId) => {
  try {
    const response = await axios.get(`http://localhost:3001/coordinator-grade-level/${userId}`);
    if (response.status === 200 && response.data.gradeLevel) {
      console.log('Coordinator grade level:', response.data.gradeLevel);
      setCoordinatorGradeLevel(response.data.gradeLevel);
      // Auto-set the grade filter to the coordinator's assigned grade level
      setFilters(prev => ({ ...prev, grade: response.data.gradeLevel.toString() }));
    }
  } catch (error) {
    console.error('Error fetching coordinator grade level:', error);
  }
};
```

### 4. Frontend: Modify the Grade Level Filter Dropdown

Update your grade level filter dropdown to be disabled for coordinators and only show their assigned grade level:

```jsx
<select
  value={filters.grade}
  onChange={handleGradeChange}
  disabled={roleName === 'grade_level_coordinator'}
>
  <option value="">Select Grade Level</option>
  {roleName === 'grade_level_coordinator' && coordinatorGradeLevel ? (
    <option value={coordinatorGradeLevel}>Grade {coordinatorGradeLevel}</option>
  ) : (
    [7, 8, 9, 10].map(grade => (
      <option key={grade} value={grade}>Grade {grade}</option>
    ))
  )}
</select>
```

### 5. Frontend: Filter Data Based on Coordinator's Grade Level

Modify your data fetching function to filter results based on the coordinator's grade level:

```javascript
const fetchData = useCallback(async () => {
  try {
    const response = await axios.get('http://localhost:3001/your-endpoint');
    let data = response.data;
    
    // For grade level coordinators, filter the data by their assigned grade level
    if (roleName === 'grade_level_coordinator' && coordinatorGradeLevel) {
      data = data.filter(item => 
        item.grade_level.toString() === coordinatorGradeLevel.toString()
      );
    }
    
    setYourData(data);
  } catch (error) {
    console.error('Error fetching data:', error);
  }
}, [roleName, coordinatorGradeLevel]);
```

### 6. Frontend: Refetch Data When Coordinator's Grade Level Changes

Add a useEffect hook to refetch data when the coordinator's grade level changes:

```javascript
useEffect(() => {
  if (coordinatorGradeLevel) {
    fetchData();
  }
}, [coordinatorGradeLevel, fetchData]);
```

## Applying to Other Components

When adding this feature to other components:

1. Ensure you have the `coordinatorGradeLevel` state and the `fetchCoordinatorGradeLevel` function
2. Update all grade level dropdowns to be disabled for coordinators
3. Make sure all data fetching/filtering functions consider the coordinator's grade level
4. Add useEffect hooks to trigger refetching when coordinatorGradeLevel changes

## Database Requirements

This implementation relies on the following database tables:

1. `grade_level_assigned` - stores which grade level is assigned to each coordinator
2. `employee` - links user_id to employee_id
3. `school_year` - provides the active school year

Make sure these tables exist and have the necessary data for the implementation to work correctly. 