# Student Addition Process

## Overview
This document outlines the complete process that occurs when a new student is added to the LNHS Portal system. The process involves multiple steps including form validation, data formatting, and database operations across several tables.

## Step 1: Form Completion

When the "Add New Student" button is clicked, a modal form appears with the following sections:

1. **Basic Information Tab**
   - LRN (Learner Reference Number) - 12 digits
   - Last Name
   - Middle Name (optional)
   - First Name
   - Grade Level
   - Birthdate
   - Gender
   - Age (auto-calculated)
   - Brigada Eskwela Attendance

2. **Contact Information Tab**
   - Home Address
   - Barangay
   - City/Municipality
   - Province
   - Contact Number
   - Email Address
   - Emergency Contact Person
   - Emergency Contact Number

3. **Family Information Tab**
   - Mother's Name
   - Mother's Contact Number
   - Mother's Occupation
   - Mother's Education Level
   - Father's Name
   - Father's Contact Number
   - Father's Occupation
   - Father's Education Level
   - Parent Address
   - Annual Household Income
   - Number of Siblings

## Step 2: Client-Side Validation

Before submission, the system performs client-side validation:

- **Required Fields**: LRN, Last Name, First Name, Grade Level, Birthdate, Gender
- **Format Validation**:
  - LRN: Must be exactly 12 digits
  - Names: Only letters, spaces, and hyphens
  - Phone Numbers: Must start with '09' and be exactly 11 digits
  - Email: Must be a valid email format
  - Age: Must be between 10 and 20
  - Annual Income: Must be a valid number (optional)
  - Number of Siblings: Must be a non-negative integer (optional)

## Step 3: Data Formatting

Before saving to the database:

- Names and addresses are formatted with proper capitalization
- Dates are converted to ISO format
- Numeric fields are converted to appropriate data types

## Step 4: Database Operations

### Stage 1: Student Record Creation

1. A new student ID is generated (incremented from the last ID)
2. A record is inserted into the `student` table with all personal information:

```sql
INSERT INTO student (
  student_id, lrn, lastname, firstname, middlename, current_yr_lvl,
  birthdate, gender, age, home_address, barangay, city_municipality,
  province, contact_number, email_address, mother_name, father_name,
  parent_address, father_occupation, mother_occupation, annual_hshld_income,
  number_of_siblings, father_educ_lvl, mother_educ_lvl, father_contact_number,
  mother_contact_number, emergency_number, emergency_contactperson, status, active_status
) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
```

### Stage 2: Brigada Eskwela Details

1. The active school year ID is retrieved
2. Brigada attendance information is inserted into the `brigada_details` table:

```sql
INSERT INTO brigada_details (student_id, remarks, school_year_id, brigada_status)
VALUES (?, ?, ?, ?)
```

3. The `brigada_id` is retrieved and updated in the student record:

```sql
UPDATE student SET brigada_id = ? WHERE student_id = ?
```

### Stage 3: Enrollment and User Account Creation

When the student is enrolled (which happens automatically after adding):

1. A username is generated in the format `lastname.firstname@lnhs.com` (lowercase with spaces replaced by underscores)
2. A default password (`1234`) is assigned
3. A new record is created in the `users` table:

```sql
INSERT INTO users (username, password, role_id, role_name)
VALUES (?, ?, ?, ?)
```

4. The student record is updated with the new user ID and enrollment date:

```sql
UPDATE student
SET user_id = ?, enroll_date = CURRENT_DATE()
WHERE student_id = ?
```

5. Enrollment record is created:

```sql
INSERT INTO enrollment (
  student_id, school_year_id, enrollee_type, enrollment_status, 
  enrollment_date, grade_level, student_name, brigada_id
)
VALUES (?, ?, 'Regular', 'inactive', NOW(), ?, ?, ?)
```

6. Student-school year association is created:

```sql
INSERT INTO student_school_year (
  student_school_year_id, student_id, school_year_id, 
  status, student_name, grade_level
)
VALUES (NULL, ?, ?, ?, ?, ?)
```

## Post-Process Operations

After successful addition, the system:

1. Refreshes the student list to display the new student
2. Shows a success message
3. Optionally triggers the `cron/level-up-students` endpoint

## Error Handling

The system includes comprehensive error handling at each step:
- Database connection errors
- Validation errors
- Duplicate record errors
- Missing required data errors

Each error is appropriately logged and displayed to the user with helpful messages.

## Security Considerations

- All database operations use parameterized queries to prevent SQL injection
- Input validation is performed both client-side and server-side
- Default passwords should be changed upon first login (best practice) 