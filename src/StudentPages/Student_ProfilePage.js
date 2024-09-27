import React, { useEffect, useState } from 'react';
import axios from 'axios';
import '../StudentPagesCss/Student_ProfilePage.css'; // Import the CSS file

function Student_ProfilePage() {
  const [studentData, setStudentData] = useState(null);
  const userId = localStorage.getItem('userId'); 

  useEffect(() => {
    const fetchStudentData = async () => {
      try {
        const response = await axios.get(`http://localhost:3001/student/profile/${userId}`);
        setStudentData(response.data);
      } catch (error) {
        console.error('Error fetching student data:', error);
      }
    };

    fetchStudentData();
  }, [userId]);

  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  if (!studentData) {
    return <div>Loading...</div>;
  }

  return (
    <div className="student-profile-container">
      <div className="student-profile-header">
        <img src="/path/to/profile-picture.jpg" alt="" className="student-profile-picture" />
        <div className="student-profile-info">
          <h1>{`${studentData.firstname} ${studentData.middlename} ${studentData.lastname}`}</h1>
          <p>{studentData.username}</p>
          <p>Grade {studentData.current_yr_lvl}</p>
        </div>
      </div>
      <div className="student-profile-details">
        <h2>Student Details</h2>
        <div className="student-details-row">
          <div className="student-details-column">
            <p><strong>Birthday:</strong> {formatDate(studentData.birthdate)}</p>
            <p><strong>Gender:</strong> {studentData.gender}</p>
          </div>
          <div className="student-details-column">
            <p><strong>Current Grade Level:</strong> Grade {studentData.current_yr_lvl}</p>
            <p><strong>Age:</strong> {studentData.age}</p>
          </div>
        </div>
        <h2>Standard Information</h2>
        <div className="student-details-row">
          <div className="student-details-column">
            <p><strong>First Name:</strong> {studentData.firstname}</p>
            <p><strong>Middle Name:</strong> {studentData.middlename}</p>
          </div>
          <div className="student-details-column">
            <p><strong>Last Name:</strong> {studentData.lastname}</p>
            <p><strong>Email Address:</strong> {studentData.email_address}</p>
          </div>
        </div>
        <div className="student-details-row">
          <div className="student-details-column">
            <p><strong>Home Address:</strong> {studentData.home_address}</p>
            <p><strong>Barangay:</strong> {studentData.barangay}</p>
          </div>
          <div className="student-details-column">
            <p><strong>City/Municipality:</strong> {studentData.city_municipality}</p>
            <p><strong>Province:</strong> {studentData.province}</p>
          </div>
        </div>
        <div className="student-details-row">
          <div className="student-details-column">
            <p><strong>Contact Number:</strong> {studentData.contact_number}</p>
            <p><strong>Email Address:</strong> {studentData.email_address}</p>
          </div>
          <div className="student-details-column">
            <p><strong>Mother's Name:</strong> {studentData.mother_name}</p>
            <p><strong>Father's Name:</strong> {studentData.father_name}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Student_ProfilePage;
