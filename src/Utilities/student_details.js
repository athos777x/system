import React, { useState, useEffect } from 'react';
import '../CssFiles/student_detail.css';

const StudentDetails = ({ student, isEditing, onSave, onCancel }) => {
  const [editableStudent, setEditableStudent] = useState(student);

  useEffect(() => {
    setEditableStudent(student); // Update the student data when it changes
  }, [student]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setEditableStudent((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  return (
    <div className="student-details-container">
      <div className="student-details-grid">
        <div>
          <strong>Firstname:</strong>
          {isEditing ? (
            <input
              type="text"
              name="firstname"
              value={editableStudent.firstname}
              onChange={handleChange}
            />
          ) : (
            <span>{editableStudent.firstname}</span>
          )}
        </div>
        <div>
          <strong>Middlename:</strong>
          {isEditing ? (
            <input
              type="text"
              name="middlename"
              value={editableStudent.middlename || ''}
              onChange={handleChange}
            />
          ) : (
            <span>{editableStudent.middlename || 'N/A'}</span>
          )}
        </div>
        <div>
          <strong>Lastname:</strong>
          {isEditing ? (
            <input
              type="text"
              name="lastname"
              value={editableStudent.lastname}
              onChange={handleChange}
            />
          ) : (
            <span>{editableStudent.lastname}</span>
          )}
        </div>
        <div>
          <strong>Year Level:</strong>
          {isEditing ? (
            <input
              type="text"
              name="current_yr_lvl"
              value={editableStudent.current_yr_lvl}
              onChange={handleChange}
            />
          ) : (
            <span>{editableStudent.current_yr_lvl}</span>
          )}
        </div>
        <div>
          <strong>Birthdate:</strong>
          {isEditing ? (
            <input
              type="date"
              name="birthdate"
              value={editableStudent.birthdate}
              onChange={handleChange}
            />
          ) : (
            <span>{editableStudent.birthdate}</span>
          )}
        </div>
        <div>
          <strong>Gender:</strong>
          {isEditing ? (
            <input
              type="text"
              name="gender"
              value={editableStudent.gender}
              onChange={handleChange}
            />
          ) : (
            <span>{editableStudent.gender}</span>
          )}
        </div>
        <div>
          <strong>Age:</strong>
          {isEditing ? (
            <input
              type="number"
              name="age"
              value={editableStudent.age}
              onChange={handleChange}
            />
          ) : (
            <span>{editableStudent.age}</span>
          )}
        </div>
        <div>
          <strong>Home Address:</strong>
          {isEditing ? (
            <input
              type="text"
              name="home_address"
              value={editableStudent.home_address}
              onChange={handleChange}
            />
          ) : (
            <span>{editableStudent.home_address}</span>
          )}
        </div>
        <div>
          <strong>Barangay:</strong>
          {isEditing ? (
            <input
              type="text"
              name="barangay"
              value={editableStudent.barangay}
              onChange={handleChange}
            />
          ) : (
            <span>{editableStudent.barangay}</span>
          )}
        </div>
        <div>
          <strong>City Municipality:</strong>
          {isEditing ? (
            <input
              type="text"
              name="city_municipality"
              value={editableStudent.city_municipality}
              onChange={handleChange}
            />
          ) : (
            <span>{editableStudent.city_municipality}</span>
          )}
        </div>
        <div>
          <strong>Province:</strong>
          {isEditing ? (
            <input
              type="text"
              name="province"
              value={editableStudent.province}
              onChange={handleChange}
            />
          ) : (
            <span>{editableStudent.province}</span>
          )}
        </div>
        <div>
          <strong>Contact Number:</strong>
          {isEditing ? (
            <input
              type="text"
              name="contact_number"
              value={editableStudent.contact_number}
              onChange={handleChange}
            />
          ) : (
            <span>{editableStudent.contact_number}</span>
          )}
        </div>
        <div>
          <strong>Email Address:</strong>
          {isEditing ? (
            <input
              type="email"
              name="email_address"
              value={editableStudent.email_address}
              onChange={handleChange}
            />
          ) : (
            <span>{editableStudent.email_address}</span>
          )}
        </div>
        <div>
          <strong>Mother's Name:</strong>
          {isEditing ? (
            <input
              type="text"
              name="mother_name"
              value={editableStudent.mother_name}
              onChange={handleChange}
            />
          ) : (
            <span>{editableStudent.mother_name}</span>
          )}
        </div>
        <div>
          <strong>Father's Name:</strong>
          {isEditing ? (
            <input
              type="text"
              name="father_name"
              value={editableStudent.father_name}
              onChange={handleChange}
            />
          ) : (
            <span>{editableStudent.father_name}</span>
          )}
        </div>
        <div>
          <strong>Brigada Eskwela:</strong>
          {isEditing ? (
            <input
              type="text"
              name="brigada_eskwela"
              value={editableStudent.brigada_eskwela}
              onChange={handleChange}
            />
          ) : (
            <span>{editableStudent.brigada_eskwela === '1' ? 'Yes' : 'No'}</span>
          )}
        </div>
      </div>
      {isEditing && (
        <div className="student-details-buttons">
          <button onClick={() => onSave(editableStudent)}>Save</button>
          <button onClick={onCancel}>Cancel</button>
        </div>
      )}
    </div>
  );
};

export default StudentDetails;
