# Honor Roll Fix

To exclude students without honors from the honor roll list, you need to modify the SQL query in `backend/server.js`. Here's the change you should make:

## Modification to server.js

Find the honorRollQuery (around line 6470) and add a HAVING clause to filter out students with "No Honors" remarks. Here's the modified query:

```sql
const honorRollQuery = `
  SELECT 
    b.lrn, 
    CONCAT(b.lastname, ', ', b.firstname, ' ', LEFT(IFNULL(b.middlename, ''), 1)) AS stud_name, 
    IF(b.gender = 'Male', 'M', 'F') AS sex, 
    AVG(c.grade) AS general_average,
    CASE
      WHEN AVG(c.grade) >= 98 THEN 'With Highest Honors'
      WHEN AVG(c.grade) >= 95 THEN 'With High Honors'
      WHEN AVG(c.grade) >= 90 THEN 'With Honors'
      ELSE 'No Honors'
    END AS remarks
  FROM 
    enrollment a 
  LEFT JOIN student b ON a.student_id = b.student_id
  LEFT JOIN grades c ON a.student_id = c.student_id
  WHERE 
    a.grade_level = ? AND 
    a.section_id = ? AND 
    a.school_year_id = ? AND 
    c.period = ?
  GROUP BY a.student_id
  HAVING remarks != 'No Honors'
  ORDER BY general_average DESC
`;
```

The key addition is the `HAVING remarks != 'No Honors'` line that filters out any student with a "No Honors" remark. 