import React, { useEffect, useState } from 'react';
import axios from 'axios';
import '../StudentPagesCss/Student_ProfilePage.css';

function Student_ProfilePage() {
  const [studentData, setStudentData] = useState(null);
  const userId = localStorage.getItem('userId');

  useEffect(() => {
    const fetchStudentData = async () => {
      try {
        const response = await axios.get(`http://localhost:3001/student/profile/${userId}`);
        setStudentData(response.data);
        
        // Check if we have a cached profile picture URL in localStorage
        const cachedProfilePicture = localStorage.getItem('profilePictureUrl');
        if (cachedProfilePicture && response.data) {
          // Add a cache-busting parameter
          const timestamp = new Date().getTime();
          const imageUrlWithCacheBuster = `${cachedProfilePicture}?t=${timestamp}`;
          setStudentData(prev => ({
            ...prev,
            profile_picture: imageUrlWithCacheBuster
          }));
        } else if (response.data && !response.data.profile_picture) {
          // If no profile picture is set, try to fetch it
          try {
            const profilePicResponse = await axios.get(`http://localhost:3001/api/profile-picture/${userId}`);
            if (profilePicResponse.data && profilePicResponse.data.imageUrl) {
              const imageUrl = profilePicResponse.data.imageUrl;
              // Add a cache-busting parameter
              const timestamp = new Date().getTime();
              const imageUrlWithCacheBuster = `${imageUrl}?t=${timestamp}`;
              
              // Update the student data with the profile picture
              setStudentData(prev => ({
                ...prev,
                profile_picture: imageUrlWithCacheBuster
              }));
              
              // Cache the URL in localStorage
              localStorage.setItem('profilePictureUrl', imageUrl);
            }
          } catch (err) {
            console.log('Profile picture not available or error fetching it:', err.message);
          }
        }
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
    return (
      <div className="student-profile-container">
        <div className="loading-state">Loading student information...</div>
      </div>
    );
  }

  return (
    <div className="student-profile-container">
      <div className="student-profile-header">
        <img 
          src={studentData.profile_picture || '/default-avatar.png'} 
          alt="" 
          className="student-profile-picture" 
        />
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
            <p>
              <strong>Birthday</strong>
              <span>{formatDate(studentData.birthdate)}</span>
            </p>
            <p>
              <strong>Gender</strong>
              <span>{studentData.gender}</span>
            </p>
          </div>
          <div className="student-details-column">
            <p>
              <strong>Current Grade Level</strong>
              <span>Grade {studentData.current_yr_lvl}</span>
            </p>
            <p>
              <strong>Age</strong>
              <span>{studentData.age}</span>
            </p>
          </div>
        </div>

        <h2>Standard Information</h2>
        <div className="student-details-row">
          <div className="student-details-column">
            <p>
              <strong>First Name</strong>
              <span>{studentData.firstname}</span>
            </p>
            <p>
              <strong>Middle Name</strong>
              <span>{studentData.middlename}</span>
            </p>
          </div>
          <div className="student-details-column">
            <p>
              <strong>Last Name</strong>
              <span>{studentData.lastname}</span>
            </p>
          </div>
        </div>

        <h2>Contact Information</h2>
        <div className="student-details-row">
          <div className="student-details-column">
            <p>
              <strong>Home Address</strong>
              <span>{studentData.home_address}</span>
            </p>
            <p>
              <strong>Barangay</strong>
              <span>{studentData.barangay}</span>
            </p>
            <p data-type="contact">
              <strong>Contact Number</strong>
              <span>{studentData.contact_number}</span>
            </p>
          </div>
          <div className="student-details-column">
            <p>
              <strong>City/Municipality</strong>
              <span>{studentData.city_municipality}</span>
            </p>
            <p>
              <strong>Province</strong>
              <span>{studentData.province}</span>
            </p>
            <p data-type="email">
              <strong>Email Address</strong>
              <span>{studentData.email_address}</span>
            </p>
          </div>
        </div>

        <h2>Parent Information</h2>
        <div className="student-details-row">
          <div className="student-details-column">
            <p>
              <strong>Mother's Name</strong>
              <span>{studentData.mother_name}</span>
            </p>
          </div>
          <div className="student-details-column">
            <p>
              <strong>Father's Name</strong>
              <span>{studentData.father_name}</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Student_ProfilePage;
