import React, { useState, useEffect } from 'react';
import axios from 'axios';
import '../StudentPagesCss/Student_EnrollmentPage.css';

function Student_EnrollmentPage() {
  const userId = localStorage.getItem('userId');
  const [enrollmentData, setEnrollmentData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeSchoolYear, setActiveSchoolYear] = useState('');
  const [enrollmentStatus, setEnrollmentStatus] = useState('Pending');
  const [showElectiveModal, setShowElectiveModal] = useState(false);
  const [electiveChoice, setElectiveChoice] = useState('');
  const [electiveStatus, setElectiveStatus] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch active school year
        const schoolYearResponse = await axios.get('http://localhost:3001/school-years');
        const activeSchoolYear = schoolYearResponse.data[0]?.school_year;
        setActiveSchoolYear(activeSchoolYear || 'Not Set');

        if (userId) {
          // Fetch enrollment data
          const enrollmentResponse = await axios.get(`http://localhost:3001/enrollment/${userId}`);
          setEnrollmentData(enrollmentResponse.data);

          // Fetch enrollment status
          const statusResponse = await axios.get(`http://localhost:3001/enrollment-status/${userId}`);
          setEnrollmentStatus(statusResponse.data?.status || 'Pending');

          // Fetch elective status
          const electiveResponse = await axios.get(`http://localhost:3001/elective-status/${userId}`);
          setElectiveStatus(electiveResponse.data?.status || '');
        }
      } catch (error) {
        console.error('Error fetching data:', error);
        setError('Failed to load enrollment information. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [userId]);

  const handleApplyEnrollment = async () => {
    try {
      const response = await axios.post('http://localhost:3001/apply-enrollment', { userId });
      if (response.data.message) {
        setEnrollmentStatus('pending');
        alert(response.data.message);
      } else {
        alert('Failed to apply for enrollment. Please try again.');
      }
    } catch (error) {
      console.error('Error applying for enrollment:', error);
      alert('Failed to apply for enrollment. Please try again.');
    }
  };

  const handleAddElective = () => {
    setShowElectiveModal(true);
  };

  const handleCloseModal = () => {
    setShowElectiveModal(false);
  };

  const handleElectiveSubmit = async () => {
    try {
      if (!electiveChoice) {
        alert('Please select an elective before submitting.');
        return;
      }

      // Fetch student details to get student_id and grade_level
      const { data: studentData } = await axios.get(`http://localhost:3001/student/profile/${userId}`);

      if (!studentData?.student_id || !studentData?.current_yr_lvl) {
        alert('Failed to retrieve student details.');
        return;
      }

      // Send the enrollment request
      const { data } = await axios.post('http://localhost:3001/enroll-elective', {
        studentId: studentData.student_id,
        electiveId: electiveChoice,
        grade_level: studentData.current_yr_lvl
      });

      alert(data.message);
      handleCloseModal();
    } catch (error) {
      console.error('Error adding elective:', error);
      if (error.response?.data?.error) {
        alert(error.response.data.error);
      } else {
        alert('Failed to add elective. Please try again.');
      }
    }
};

  

  if (loading) {
    return (
      <div className="student-enrollment-container">
        <div className="student-enrollment-card">
          <div className="student-enrollment-loading-message">Loading enrollment information...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="student-enrollment-container">
        <div className="student-enrollment-card">
          <div className="student-enrollment-error-message">{error}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="student-enrollment-container">
      <div className="student-enrollment-card">
        <span className={`student-enrollment-status student-enrollment-status-${enrollmentStatus.toLowerCase()}`}>
          {enrollmentStatus}
        </span>
        
        <h1 className="student-enrollment-title">SY - {activeSchoolYear}</h1>
        
        {enrollmentStatus === 'active' ? (
          <>
            <div className="student-enrollment-table-container">
              <table className="student-enrollment-table">
                <thead>
                  <tr>
                    <th>Subject</th>
                    <th>Teacher</th>
                    <th>Schedule</th>
                  </tr>
                </thead>
                <tbody>
                  {enrollmentData.length > 0 ? (
                    enrollmentData.map((row, index) => (
                      <tr key={index}>
                        <td>{row.subject_name}</td>
                        <td>{row.teacher_name}</td>
                        <td>{row.schedule}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="3">No enrollment data available</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {electiveStatus !== 'approved' && (
              <button 
                type="button" 
                className="student-enrollment-add-elective-button" 
                onClick={handleAddElective}
              >
                Add Elective
              </button>
            )}
          </>
        ) : (
          enrollmentStatus === 'inactive' && (
            <button 
              type="button" 
              className="student-enrollment-button" 
              onClick={handleApplyEnrollment}
            >
              Apply for Enrollment
            </button>
          )
        )}

        {showElectiveModal && (
          <div 
            className="student-enrollment-modal"
            onClick={(e) => {
              if (e.target.className === 'student-enrollment-modal') {
                handleCloseModal();
              }
            }}
          >
            <div className="student-enrollment-modal-content">
              <div className="student-enrollment-modal-header">
                <h2>Select Elective</h2>
                <span className="student-enrollment-modal-close" onClick={handleCloseModal}>&times;</span>
              </div>
              <div className="student-enrollment-form">
                <div className="student-enrollment-form-group">
                  <label htmlFor="electiveChoice">Choose an Elective:</label>
                  <select
                    id="electiveChoice"
                    value={electiveChoice}
                    onChange={(e) => setElectiveChoice(e.target.value)}
                  >
                    <option value="">Select an elective</option>
                    <option value="1">Elective 1</option>
                    <option value="2">Elective 2</option>
                  </select>
                </div>
                <div className="student-enrollment-button-container">
                  <button type="button" className="student-enrollment-confirm-button" onClick={handleElectiveSubmit}>
                    Confirm
                  </button>
                  <button type="button" className="student-enrollment-cancel-button" onClick={handleCloseModal}>
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Student_EnrollmentPage;