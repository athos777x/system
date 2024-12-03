import React, { useState, useEffect } from 'react';
import axios from 'axios';
import '../StudentPagesCss/Student_EnrollmentPage.css';

function Student_EnrollmentPage() {
  const userId = localStorage.getItem('userId'); // Get user_id from localStorage
  const [enrollmentData, setEnrollmentData] = useState([]);
  const [loading, setLoading] = useState(true); // State to handle loading
  const [error, setError] = useState(null); // State to handle errors
  const [activeSchoolYear, setActiveSchoolYear] = useState(''); // State to handle the active school year
  const [enrollmentStatus, setEnrollmentStatus] = useState('Pending'); // State to handle the enrollment status
  const [showElectiveModal, setShowElectiveModal] = useState(false); // State to handle modal visibility
  const [electiveChoice, setElectiveChoice] = useState(''); // State for selected elective
  const [electiveStatus, setElectiveStatus] = useState(''); // New state to track elective status

  useEffect(() => {
    console.log('User ID:', userId);

    const fetchActiveSchoolYear = async () => {
      try {
        console.log('Fetching active school year');
        const response = await axios.get('http://localhost:3001/active-school-year');
        setActiveSchoolYear(response.data.activeSchoolYear);
        console.log('Active School Year:', response.data.activeSchoolYear);
      } catch (error) {
        console.error('Error fetching active school year:', error.response ? error.response.data : error.message);
        setError('Failed to fetch the active school year.');
      }
    };

    const fetchEnrollmentData = async () => {
      try {
        console.log(`Making request to: http://localhost:3001/enrollment/${userId}`);

        // Fetch the enrollment data
        const response = await axios.get(`http://localhost:3001/enrollment/${userId}`);
        console.log('Enrollment Data:', response.data);
        setEnrollmentData(response.data); // Set the enrollment data to state

        // Fetch the enrollment status
        const statusResponse = await axios.get(`http://localhost:3001/enrollment-status/${userId}`);
        if (statusResponse.data) {
          setEnrollmentStatus(statusResponse.data.status || 'Pending');
        }

        // Fetch elective-specific status
        const electiveResponse = await axios.get(`http://localhost:3001/elective-status/${userId}`);
        if (electiveResponse.data) {
          setElectiveStatus(electiveResponse.data.status || '');
        }

        setLoading(false); // Stop loading when data is fetched
      } catch (error) {
        console.error('Error fetching enrollment data:', error.response ? error.response.data : error.message);
        setError(error.response ? error.response.data.error : 'An error occurred while fetching data.');
        setLoading(false); // Stop loading even in case of an error
      }
    };

    // Fetch the active school year and enrollment data
    fetchActiveSchoolYear();
    if (userId) {
      fetchEnrollmentData();
    } else {
      setError('No user ID found in localStorage.');
      setLoading(false);
    }
  }, [userId]);

  const handleApplyEnrollment = async () => {
    try {
      console.log(`Applying for enrollment for userId: ${userId}`);
      const response = await axios.post(`http://localhost:3001/apply-enrollment`, { userId });

      console.log('Enrollment application response:', response.data);

      // Check if there's a success message instead of checking `status`
      if (response.data.message) {
        setEnrollmentStatus('pending'); // Manually set enrollment status to 'pending'
        alert(response.data.message);
      } else {
        alert('Enrollment status update failed. Please try again.');
      }
    } catch (error) {
      console.error('Error applying for enrollment:', error.response ? error.response.data : error.message);
      setError('Failed to apply for enrollment. Please try again.');
    }
  };


  const handleAddElective = () => {
    setShowElectiveModal(true); // Show the elective modal
  };

  const handleElectiveSubmit = async () => {
    try {
      // Adjust the endpoint URL and payload to match what the backend expects
      const response = await axios.post(`http://localhost:3001/enroll-elective`, {
        studentId: userId, 
        electiveId: electiveChoice 
      });
  
      if (response.data.message) {
        alert('Elective enrollment request submitted successfully.');
      } else {
        alert('Failed to add elective. Please try again.');
      }
  
      setShowElectiveModal(false); // Close the modal
    } catch (error) {
      console.error('Error adding elective:', error);
      alert('An error occurred while adding elective. Please try again.');
    }
  };
  

  if (loading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  return (
    <div className='student-enrollment-container'>
      <div className='enrollment-status-container'>
        <span className='enrollment-status'>Status: {enrollmentStatus}</span>
      </div>
      <h1 className='student-enrollment-title'>SY - {activeSchoolYear}</h1>
      
      {enrollmentStatus === 'active' ? (
        <>
          <table className='student-enrollment-table'>
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
                  <td colSpan="3">No enrollment data found</td>
                </tr>
              )}
            </tbody>
          </table>

          {/* Conditionally show Add Elective Button */}
          {electiveStatus !== 'approved' && (
            <button 
              type="button" 
              className="add-elective-button" 
              onClick={handleAddElective}
            >
              Add Elective
            </button>
          )}

          <div className="clearfix"></div> {/* To clear the float */}
        </>
      ) : (
        enrollmentStatus === 'inactive' && (
          <button 
            type="button" 
            className="student-enrollment-button" 
            onClick={handleApplyEnrollment}
          >
            Apply Enrollment
          </button>
        )
      )}

      {showElectiveModal && (
        <div className="elective-modal">
          <div className="elective-modal-content">
            <span className="elective-modal-close" onClick={() => setShowElectiveModal(false)}>&times;</span>
            <h2>Select Elective</h2>
            <form className="elective-form" onSubmit={handleElectiveSubmit}>
              <label htmlFor="electiveChoice">Choose an Elective:</label>
              <select
                id="electiveChoice"
                value={electiveChoice}
                onChange={(e) => setElectiveChoice(e.target.value)}
              >
                <option value="">Select</option>
                <option value="1">Elective 1</option>
                <option value="2">Elective 2</option>
              </select>
              <button type="button" className="confirm-button" onClick={handleElectiveSubmit}>Confirm</button>
              <button type="button" className="cancel-button" onClick={() => setShowElectiveModal(false)}>Cancel</button>
            </form>
          </div>
        </div>
      )}  
    </div>
  );
}

export default Student_EnrollmentPage;