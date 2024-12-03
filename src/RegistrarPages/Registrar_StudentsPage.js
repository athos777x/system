import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import SearchFilter from '../RoleSearchFilters/SearchFilter';
import axios from 'axios';
import '../RegistrarPagesCss/Registrar_StudentsPage.css';

function Registrar_StudentsPage() {
  const [students, setStudents] = useState([]);
  const [filteredStudents, setFilteredStudents] = useState([]);
  const [selectedStudentId, setSelectedStudentId] = useState(null);
  const [filters, setFilters] = useState({
    searchTerm: '',
    school_year: '',
    grade: '',
    section: '',
    status: ''
  });
  const [isAdding, setIsAdding] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [newStudentData, setNewStudentData] = useState({
    lastname: '',
    middlename: '',
    firstname: '',
    current_yr_lvl: '',
    birthdate: '',
    gender: '',
    age: '',
    home_address: '',
    barangay: '', 
    city_municipality: '',
    province: '',
    contact_number: '',
    email_address: '',
    mother_name: '',
    father_name: '',
    parent_address: '',
    father_occupation: '',
    mother_occupation: '',
    annual_hshld_income: '',
    number_of_siblings: '',
    father_educ_lvl: '',
    mother_educ_lvl: '',
    father_contact_number: '',
    mother_contact_number: '',
    emergency_number: '',
    status: 'active',
    archive_status: 'unarchive', // Default value
    section_id: ''
  });


  const navigate = useNavigate();

  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async (appliedFilters = {}) => {
    try {
      // Log the applied filters to check what's being passed to the backend
      console.log('Applied filters:', appliedFilters);
  
      // Make the API request to get students with the applied filters
      const response = await axios.get('http://localhost:3001/students', {
        params: appliedFilters
      });
  
      // Log the full response from the server to see if it's working as expected
      console.log('Full response from server:', response);
  
      // Sort the students by first name
      const sortedStudents = response.data.sort((a, b) => a.firstname.localeCompare(b.firstname));
  
      // Log the sorted students before setting the state
      console.log('Sorted students:', sortedStudents);
  
      // Update the students and filteredStudents state
      setStudents(sortedStudents);
      setFilteredStudents(sortedStudents);
  
      // Log the state after setting it to ensure it's correct
      console.log('Students state updated:', sortedStudents);
  
    } catch (error) {
      // Log the error in detail if the request fails
      if (error.response) {
        console.error('Error response from server:', error.response.data);
      } else if (error.request) {
        console.error('No response received from server. Request was:', error.request);
      } else {
        console.error('Error setting up request:', error.message);
      }
    }
  };
  

  const handleSearch = (searchTerm) => {
    setFilters(prevFilters => {
      const updatedFilters = { ...prevFilters, searchTerm };
      applyFilters(updatedFilters);
      return updatedFilters;
    });
  };

  const handleFilterChange = (type, value) => {
    setFilters((prevFilters) => {
      const updatedFilters = { ...prevFilters, [type]: value };
      applyFilters(updatedFilters); // Apply filters immediately after update
      return updatedFilters;
    });
  };
  

  const applyFilters = (updatedFilters) => {
    let filtered = students;

    if (updatedFilters.school_year) {
      filtered = filtered.filter(student => String(student.school_year) === updatedFilters.school_year);
    }
    if (updatedFilters.grade) {
      filtered = filtered.filter(student => student.current_yr_lvl === updatedFilters.grade);
    }
    if (updatedFilters.section) {
      filtered = filtered.filter(student => String(student.section_id) === updatedFilters.section);
    }
    if (updatedFilters.status) {
      filtered = filtered.filter(student => student.student_status === updatedFilters.status);
    }
    if (updatedFilters.searchTerm) {
      filtered = filtered.filter(student =>
        student.firstname.toLowerCase().includes(updatedFilters.searchTerm.toLowerCase()) ||
        student.lastname.toLowerCase().includes(updatedFilters.searchTerm.toLowerCase())
      );
    }

    setFilteredStudents(filtered);
    console.log('Filtered students:', filtered);
  };

  const handleApplyFilters = () => {
    console.log('Applying filters:', filters);
    fetchStudents(filters);
  };

  const startAdding = () => {
    setIsAdding(true);
    setNewStudentData({
      lastname: '',
      middlename: '',
      firstname: '',
      current_yr_lvl: '',
      birthdate: '',
      gender: '',
      age: '',
      home_address: '',
      barangay: '', 
      city_municipality: '',
      province: '',
      contact_number: '',
      email_address: '',
      mother_name: '',
      father_name: '',
      parent_address: '',
      father_occupation: '',
      mother_occupation: '',
      annual_hshld_income: '',
      number_of_siblings: '',
      father_educ_lvl: '',
      mother_educ_lvl: '',
      father_contact_number: '',  
      mother_contact_number: '',
      emergency_number: '',
      status: 'active',
      active_status: 'unarchive', // Default value
      section_id: '',
      user_id: ''
    });
    setShowModal(true);
  };

  const   handleAddChange = (e) => {
    const { name, value } = e.target;
    setNewStudentData((prevState) => ({
      ...prevState,
      [name]: value // This should update section_id in newStudentData
    }));
  };
  
  
  const saveNewSection = async () => {
    try {
      // Correct data structure with the required fields
      const correctedStudentData = {
        ...newStudentData, // Spread in existing data fields
        status: newStudentData.status || 'active', // Default 'active' status
        active_status: newStudentData.archive_status || 'unarchive', // Default 'unarchive' status
        section_id: newStudentData.section_id, // Use user-provided section_id
        user_id: newStudentData.user_id || '1'
      };
  
      // Log the data before sending to the server for debugging
      console.log('Student data to be sent:', correctedStudentData);
  
      // Send the POST request
      const response = await axios.post('http://localhost:3001/students', correctedStudentData);
      
      // If successful, reset the form and close modal
      if (response.status === 201) {
        console.log('Student added successfully:', response.data);
        await fetchStudents(); // Refresh student list
        setIsAdding(false);
        setShowModal(false); // Close the modal
      } else {
        console.error('Failed to add student. Response:', response);
        alert('Failed to add student. Please try again.');
      }
    } catch (error) {
      if (error.response) {
        console.error('Error response:', error.response.data);
        alert(`Error adding student: ${error.response.data.error || 'Unknown error'}. Please check the input fields and try again.`);
      } else if (error.request) {
        console.error('No response received:', error.request);
        alert('No response from the server. Please check your connection and try again.');
      } else {
        console.error('Error in request setup:', error.message);
        alert('There was an error setting up the request. Please try again.');
      }
    }
  };
  
  

  
const cancelAdding = () => {
  // Reset form data and close modal
  setNewStudentData({
    lastname: '',
    middlename: '',
    firstname: '',
    current_yr_lvl: '',
    birthdate: '',
    gender: '',
    age: '',
    home_address: '',
    barangay: '',
    city_municipality: '',
    province: '',
    contact_number: '',
    email_address: '',
    mother_name: '',
    father_name: '',
    parent_address: '',
    father_occupation: '',
    mother_occupation: '',
    annual_hshld_income: '',
    number_of_siblings: '',
    father_educ_lvl: '',
    mother_educ_lvl: '',
    father_contact_number: '',
    mother_contact_number: '',
    emergency_number: '',
    status: 'active',
    active_status: 'unarchive',
    section_id: '',
    user_id: ''  
  });
  setShowModal(false);  // Close the modal
};

const enrollStudent = async (studentId) => {
  try {
    // Log the attempt to enroll a student
    console.log('Attempting to enroll student with ID:', studentId);

    // Define the payload with status 'active'
    const payload = {
      school_year: '2023-2024', // Adjust this value to the current school year
      status: 'active'
    };

    // Send the PUT request to enroll the student
    const response = await axios.put(`http://localhost:3001/students/${studentId}/enroll`, payload);

    // Log and check for successful response
    if (response.status === 200 || response.status === 201) {
      console.log('Enrollment successful:', response.data);
      alert('Student registered successfully');
      await fetchStudents(); // Refresh the student l ist after enrolling
    } else {
      console.warn('Failed to enroll student, non-200 response:', response);
      alert('Failed to enroll student.');
    }
  } catch (error) {
    // Log errors for better debugging
    if (error.response) {
      console.error('Error response:', error.response.data);
      alert('Error enrolling the student: ' + (error.response.data.error || 'Unknown error'));
    } else if (error.request) {
      console.error('No response from server:', error.request);
      alert('No response from the server. Please check your connection.');
    } else {
      console.error('Error setting up request:', error.message);
      alert('An error occurred: ' + error.message);
    }
  }
};

const validateStudent = async (studentId) => {
  try {
    console.log('Validating enrollment for student ID:', studentId);

    // Send the POST request to validate the enrollment
    const response = await axios.post('http://localhost:3001/validate-enrollment', { studentId });

    // Log and check for successful response
    if (response.status === 200) {
      console.log('Validation successful:', response.data);
      alert('Enrollment validated successfully');
      await fetchStudents(); // Refresh the student list after validating
    } else {
      console.warn('Failed to validate enrollment, non-200 response:', response);
      alert('Failed to validate enrollment.');
    }
  } catch (error) {
    if (error.response) {
      console.error('Error response:', error.response.data);
      alert('Error validating the enrollment: ' + (error.response.data.error || 'Unknown error'));
    } else if (error.request) {
      console.error('No response from server:', error.request);
      alert('No response from the server. Please check your connection.');
    } else {
      console.error('Error setting up request:', error.message);
      alert('An error occurred: ' + error.message);
    }
  }
};

const approveElective = async (studentElectiveId) => {
  try {
      const response = await axios.post('http://localhost:3001/approve-elective', {
          studentElectiveId
      });

      if (response.data.message) {
          alert(response.data.message);
          await fetchStudents(); // Refresh student list after approval
      } else {
          alert('Failed to approve elective.');
      }
  } catch (error) {
      console.error('Error approving elective:', error);
      alert('An error occurred while approving the elective.');
  }
};
const archiveStudent = async (studentId, status) => {
  try {
    console.log('Archiving student ID:', studentId, 'with status:', status);

    const response = await axios.put(`http://localhost:3001/students/${studentId}/archive`, { status });

    if (response.status === 200) {
      alert('Student archived successfully');
      await fetchStudents(); // Refresh the student list after archiving
    } else {
      console.warn('Failed to archive student, non-200 response:', response);
      alert('Failed to archive student.');
    }
  } catch (error) {
    if (error.response) {
      console.error('Error response:', error.response.data);
      alert('Error archiving the student: ' + (error.response.data.error || 'Unknown error'));
    } else if (error.request) {
      console.error('No response from server:', error.request);
      alert('No response from the server. Please check your connection.');
    } else {
      console.error('Error setting up request:', error.message);
      alert('An error occurred: ' + error.message);
    }
  }
};

// New Modal State
const [showArchiveModal, setShowArchiveModal] = useState(false);
const [archiveStudentId, setArchiveStudentId] = useState(null);
const [archiveStatus, setArchiveStatus] = useState('');

const openArchiveModal = (studentId) => {
  setArchiveStudentId(studentId);
  setShowArchiveModal(true);
};

const closeArchiveModal = () => {
  setArchiveStudentId(null);
  setArchiveStatus('');
  setShowArchiveModal(false);
};

const handleArchive = () => {
  if (!archiveStatus) {
    alert('Please select an archive status.');
    return;
  }
  archiveStudent(archiveStudentId, archiveStatus);
  closeArchiveModal();
};

  const formatDate = (isoString) => {
    const date = new Date(isoString);
    return date.toLocaleDateString();
  };

  const toggleStudentDetails = (studentId) => {
    setSelectedStudentId(selectedStudentId === studentId ? null : studentId);
  };

  return (
    <div className="students-container">
      <h1 className="students-title">Students</h1>
      <div className="students-search-filter-container">
        <SearchFilter
          handleSearch={handleSearch}
          handleFilter={handleFilterChange}
          handleApplyFilters={handleApplyFilters}
        />
      </div>
      <div className="students-add-student-button-container">
        <button className="students-add-student-button" onClick={startAdding}>Add New Student</button>
      </div>
      <div className="students-list">
        {filteredStudents.map((student, index) => (
          <div key={student.student_id} className="students-student-item-container">
            <div className="students-student-item">
              <p className="students-student-name">
                {index + 1}. {student.firstname} {student.middlename && `${student.middlename[0]}.`} {student.lastname}
              </p>
              <span className="students-student-info">Grade {student.current_yr_lvl} - {student.active_status}</span>
              <button 
                className="students-view-button" 
                onClick={() => toggleStudentDetails(student.student_id)}
              >
                View
              </button>
              {student.active_status === null && (
                <button 
                  className="students-enroll-button" 
                  onClick={(e) => {
                    e.stopPropagation();
                    enrollStudent(student.student_id);
                  }}
                >
                  Register
                </button> 
              )}
              {student.active_status === 'pending' && (
                <button 
                  className="students-validate-button" 
                  onClick={(e) => {
                    e.stopPropagation();
                    validateStudent(student.student_id);
                  }}
                >
                  Validate
                </button> 
              )}
              {student.enrollment_status === 'pending' && (
                <button 
                  className="students-approve-button" 
                  onClick={(e) => {
                    e.stopPropagation();
                    approveElective(student.student_elective_id);
                  }}
                >
                  Approve
                </button>
              )}
            </div>
            {selectedStudentId === student.student_id && (
              <div className="students-student-details">
                <table>
                  <tbody>
                    <tr>
                      <th>Last Name:</th>
                      <td>{student.lastname}</td>
                    </tr>
                    <tr>
                      <th>First Name:</th>
                      <td>{student.firstname}</td>
                    </tr>
                    <tr>
                      <th>Middle Name:</th>
                      <td>{student.middlename}</td>
                    </tr>
                    <tr>
                      <th>Grade Level:</th>
                      <td>{student.current_yr_lvl}</td>
                    </tr>
                    <tr>
                      <th>Birthdate:</th>
                      <td>{formatDate(student.birthdate)}</td>
                    </tr>
                    <tr>
                      <th>Gender:</th>
                      <td>{student.gender}</td>
                    </tr>
                    <tr>
                      <th>Age:</th>
                      <td>{student.age}</td>
                    </tr>
                    <tr>
                      <th>Contact Number:</th>
                      <td>{student.contact_number}</td>
                    </tr>
                    <tr>
                      <th>Email:</th>
                      <td>{student.email_address}</td>
                    </tr>
                    <tr>
                      <th>Mother's Name:</th>
                      <td>{student.mother_name}</td>
                    </tr>
                    <tr>
                      <th>Father's Name:</th>
                      <td>{student.father_name}</td>
                    </tr>
                    <tr>
                      <th>Parent Address:</th>
                      <td>{student.parent_address}</td>
                    </tr>
                    <tr>
                      <th>Father's Occupation:</th>
                      <td>{student.father_occupation}</td>
                    </tr>
                    <tr>
                      <th>Mother's Occupation:</th>
                      <td>{student.mother_occupation}</td>
                    </tr>
                    <tr>
                      <th>Annual Household Income:</th>
                      <td>{student.annual_hshld_income}</td>
                    </tr>
                    <tr>
                      <th>Number of Siblings:</th>
                      <td>{student.number_of_siblings}</td>
                    </tr>
                    <tr>
                      <th>Father's Education Level:</th>
                      <td>{student.father_educ_lvl}</td>
                    </tr>
                    <tr>
                      <th>Mother's Education Level:</th>
                      <td>{student.mother_educ_lvl}</td>
                    </tr>
                    <tr>
                      <th>Father's Contact Number:</th>
                      <td>{student.father_contact_number}</td>
                    </tr>
                    <tr>
                      <th>Mother's Contact Number:</th>
                      <td>{student.mother_contact_number}</td>
                    </tr>
                    <tr>
                      <th>Emergency Contact Number:</th>
                      <td>{student.emergency_number}</td>
                    </tr>
                  </tbody>
                </table>
                <div className="action-buttons">
                  <button 
                    className="archive-button"
                    onClick={() => openArchiveModal(student.student_id)}
                  >
                    Archive Student
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
      {showArchiveModal && (
        <div className="archive-modal">
          <div className="archive-modal-content">
            <h2>Archive Student</h2>
            <p>Choose an archive status for the student:</p>
            <select
              value={archiveStatus}
              onChange={(e) => setArchiveStatus(e.target.value)}
              required
            >
              <option value="">Select Status</option>
              <option value="inactive">Inactive</option>
              <option value="withdrawn">Withdrawn</option>
              <option value="transferred">Transferred</option>
            </select>
            <div className="archive-modal-buttons">
              <button className="confirm-button" onClick={handleArchive}>
                Confirm
              </button>
              <button className="cancel-button" onClick={closeArchiveModal}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
      {showModal && (
  <div className="section-modal">
    <div className="section-modal-content">
      <h2>Add New Student</h2>
      <label>
        Lastname:
        <input
          type="text"
          name="lastname"
          value={newStudentData.lastname}
          onChange={handleAddChange}
          required
        />
      </label>
      <label>
        Middlename:
        <input
          type="text"
          name="middlename"
          value={newStudentData.middlename}
          onChange={handleAddChange}
        />
      </label>
      <label>
        Firstname:
        <input
          type="text"
          name="firstname"
          value={newStudentData.firstname}
          onChange={handleAddChange}
          required
        />
      </label>
      <label>
        Year Level:
        <select
          name="current_yr_lvl"
          value={newStudentData.current_yr_lvl}
          onChange={handleAddChange}
          required
        >
          <option value="">Select Year Level</option>
          <option value="7">7</option>
          <option value="8">8</option>
          <option value="9">9</option>
          <option value="10">10</option>
        </select>
      </label>
      <label>
        Birthdate:
        <input
          type="date"
          name="birthdate"
          value={newStudentData.birthdate}
          onChange={handleAddChange}
          required
        />
      </label>
      <label>
        Gender:
        <select
          name="gender"
          value={newStudentData.gender}
          onChange={handleAddChange}
          required
        >
          <option value="">Select Gender</option>
          <option value="Male">Male</option>
          <option value="Female">Female</option>
        </select>
      </label>
      <label>
        Age:
        <input
          type="number"
          name="age"
          value={newStudentData.age}
          onChange={handleAddChange}
          required
        />
      </label>
      <label>
        Home Address:
        <input
          type="text"
          name="home_address"
          value={newStudentData.home_address}
          onChange={handleAddChange}
          required
        />
      </label>
      <label>
        Barangay:
        <input
          type="text"
          name="barangay"
          value={newStudentData.barangay}
          onChange={handleAddChange}
          required
        />
      </label>
      <label>
        City Municipality:
        <input
          type="text"
          name="city_municipality"
          value={newStudentData.city_municipality}
          onChange={handleAddChange}
          required
        />
      </label>
      <label>
        Province:
        <input
          type="text"
          name="province"
          value={newStudentData.province}
          onChange={handleAddChange}
          required
        />
      </label>
      <label>
        Contact Number:
        <input
          type="number"
          name="contact_number"
          value={newStudentData.contact_number}
          onChange={handleAddChange}
          required
        />
      </label>
      <label>
        Email Address:
        <input
          type="email"
          name="email_address"
          value={newStudentData.email_address}
          onChange={handleAddChange}
          required
        />
      </label>
      <label>
        Mother's Name:
        <input
          type="text"
          name="mother_name"
          value={newStudentData.mother_name}
          onChange={handleAddChange}
          required
        />
      </label>
      <label>
        Father's Name:
        <input
          type="text"
          name="father_name"
          value={newStudentData.father_name}
          onChange={handleAddChange}
          required
        />
      </label>
      <label>
        Parent Address:
        <input
          type="text"
          name="parent_address"
          value={newStudentData.parent_address}
          onChange={handleAddChange}
          required
        />
      </label>

      {/* Optional fields without required attribute */}
      <label>
        Father's Occupation:
        <input
          type="text"
          name="father_occupation"
          value={newStudentData.father_occupation}
          onChange={handleAddChange}
        />
      </label>
      <label>
        Mother's Occupation:
        <input
          type="text"
          name="mother_occupation"
          value={newStudentData.mother_occupation}
          onChange={handleAddChange}
        />
      </label>
      <label>
        Annual Household Income:
        <input
          type="number"
          name="annual_hshld_income"
          value={newStudentData.annual_hshld_income}
          onChange={handleAddChange}
        />
      </label>
      <label>
        Number of Siblings:
        <input
          type="number"
          name="number_of_siblings"
          value={newStudentData.number_of_siblings}
          onChange={handleAddChange}
        />
      </label>
      <label>
        Father's Education Level:
        <input
          type="text"
          name="father_educ_lvl"
          value={newStudentData.father_educ_lvl}
          onChange={handleAddChange}
        />
      </label>
      <label>
        Mother's Education Level:
        <input
          type="text"
          name="mother_educ_lvl"
          value={newStudentData.mother_educ_lvl}
          onChange={handleAddChange}
        />
      </label>
      <label>
        Father's Contact Number:
        <input
          type="number"
          name="father_contact_number"
          value={newStudentData.father_contact_number}
          onChange={handleAddChange}
          required
        />
      </label>
      <label>
        Mother's Contact Number:
        <input
          type="number"
          name="mother_contact_number"
          value={newStudentData.mother_contact_number}
          onChange={handleAddChange}
          required
        />
      </label>
      <label>
        Emergency Contact Number:
        <input
          type="number"
          name="emergency_number"
          value={newStudentData.emergency_number}
          onChange={handleAddChange}
          required
        />
      </label>

      {/* Section Button Group */}
      <div className="section-button-group">
        <button className="section-save-button" onClick={saveNewSection}>Save</button>
        <button className="section-cancel-button" onClick={cancelAdding}>Cancel</button>
      </div>
    </div>
  </div>
)}  

    </div>
  );
}

export default Registrar_StudentsPage;
