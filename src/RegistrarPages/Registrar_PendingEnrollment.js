import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import SearchFilter from '../RoleSearchFilters/SearchFilter';
import Pagination from '../Utilities/pagination';
import axios from 'axios';
import '../RegistrarPagesCss/Registrar_StudentsPage.css';

function Registrar_PendingEnrollmentPage() {
  const [students, setStudents] = useState([]);
  const [filteredStudents, setFilteredStudents] = useState([]);
  const [selectedStudentId, setSelectedStudentId] = useState(null);
  const [studentsPerPage] = useState(5); // Adjust this number to set how many students per page
  const [currentPage, setCurrentPage] = useState(1);
  const [isEditing, setIsEditing] = useState(false); // Tracks edit mode
  const [editStudentData, setEditStudentData] = useState(null); // Stores the editable student data
  const [showCancelModal, setShowCancelModal] = useState(false); // Tracks cancel confirmation modal

  const [filters, setFilters] = useState({
    searchTerm: '',
    school_year: '',
    grade: '',
    section: '',
    status: ''
  });




  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async (appliedFilters = {}) => {
    try {
      // Log the applied filters to check what's being passed to the backend
      console.log('Applied filters:', appliedFilters);
  
      // Make the API request to get students with the applied filters
      const response = await axios.get('http://localhost:3001/students/pending-enrollment', {
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
    setFilters(prevFilters => ({
        ...prevFilters,
        searchTerm
    }));
};

const handleFilterChange = (type, value) => {
    setFilters(prevFilters => ({
        ...prevFilters,
        [type]: value
    }));
};

const applyFilters = () => {
    let filtered = students;

    if (filters.school_year) {
        filtered = filtered.filter(student => String(student.school_year) === filters.school_year);
    }
    if (filters.grade) {
        filtered = filtered.filter(student => student.current_yr_lvl === filters.grade);
    }
    if (filters.section) {
        filtered = filtered.filter(student => String(student.section_id) === filters.section);
    }
    if (filters.status) {
        filtered = filtered.filter(student => student.student_status === filters.status);
    }
    if (filters.searchTerm) {
        filtered = filtered.filter(student => {
            const firstName = student.firstname ? student.firstname.toLowerCase() : "";
            const lastName = student.lastname ? student.lastname.toLowerCase() : "";
            return firstName.includes(filters.searchTerm.toLowerCase()) || 
                   lastName.includes(filters.searchTerm.toLowerCase());
        });
    }

    setFilteredStudents(filtered);
    console.log('Filtered students:', filtered);
    setCurrentPage(1); // Reset to first page when filters are applied
};

const handleApplyFilters = () => {
    console.log('Applying filters:', filters);
    applyFilters(); // Apply filters only when the button is clicked
};


 
  
   
const enrollStudent = async (studentId) => {
  try {
    // Log the attempt to enroll a student
    console.log('Attempting to enroll student with ID:', studentId);

    const getCurrentSchoolYear = () => {
      const currentYear = new Date().getFullYear();
      const nextYear = currentYear + 1;
      return `${currentYear}-${nextYear}`;
    };
    // Define the payload with status 'active'
    const payload = {
      school_year: getCurrentSchoolYear(), // Adjust this value to the current school year
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



  const formatDate = (isoString) => {
    const date = new Date(isoString);
    return date.toLocaleDateString();
  };

  const toggleStudentDetails = (studentId, editMode = false) => {
    if (editMode) {
      const student = currentStudents.find((s) => s.student_id === studentId);
      setEditStudentData(student); // Load student data into edit mode
    }
    setIsEditing(editMode);
    setSelectedStudentId(selectedStudentId === studentId ? null : studentId);
  };

  const paginate = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  const indexOfLastStudent = currentPage * studentsPerPage;
  const indexOfFirstStudent = indexOfLastStudent - studentsPerPage;
  const currentStudents = filteredStudents.slice(indexOfFirstStudent, indexOfLastStudent);

  const totalPages = Math.ceil(filteredStudents.length / studentsPerPage);
  const [roleName, setRoleName] = useState('');

  useEffect(() => {
    const userId = localStorage.getItem('userId'); // Retrieve userId from localStorage
    if (userId) {
      console.log(`Retrieved userId from localStorage: ${userId}`); // Debugging log
      fetchUserRole(userId);
    } else {
      console.error('No userId found in localStorage');
    }
  }, []);

  const fetchUserRole = async (userId) => {
    try {
      console.log(`Fetching role for user ID: ${userId}`); // Debugging log
      const response = await axios.get(`http://localhost:3001/user-role/${userId}`);
      if (response.status === 200) {
        console.log('Response received:', response.data); // Debugging log
        setRoleName(response.data.role_name);
        console.log('Role name set to:', response.data.role_name); // Debugging log
      } else {
        console.error('Failed to fetch role name. Response status:', response.status);
      }
    } catch (error) {
      if (error.response) {
        console.error('Error response from server:', error.response.data);
      } else if (error.request) {
        console.error('No response received from server. Request:', error.request);
      } else {
        console.error('Error setting up request:', error.message);
      }
    }
  };


  // Handle changes in editable fields
  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditStudentData({ ...editStudentData, [name]: value });
  };

  const handleSave = async () => {
    if (!editStudentData || !editStudentData.student_id) {
      console.error('Student ID is missing or edit data is not initialized.');
      return;
    }
  
    // Format the birthdate before sending it to the backend
    const formattedBirthdate = new Date(editStudentData.birthdate).toISOString().split('T')[0];
  
    // Update the student data with the formatted birthdate
    const updatedStudentData = { ...editStudentData, birthdate: formattedBirthdate };
  
    try {
      // Make the PUT request to the backend to update the student
      const response = await fetch(`http://localhost:3001/students/${editStudentData.student_id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedStudentData),
      });
  
      // Check if the response is OK
      if (!response.ok) {
        throw new Error('Failed to save student data');
      }
  
      // Get the updated student data from the response
      const updatedStudent = await response.json();
  
      // Update the state with the updated student data
      setStudents((prevStudents) =>
        prevStudents.map((student) =>
          student.student_id === updatedStudent.student_id ? updatedStudent : student
        )
      );
  
      // Reset the form only after saving is successful
      setEditStudentData(null);
  
      // Show success message
      alert('Edited Successfully');
      
      // Refresh the student list
      await fetchStudents();
  
      // Untoggle the student detail view to return to the list of students
      toggleStudentDetails(); // This will hide the student detail view and go back to the list
  
    } catch (error) {
      console.error('Error saving student data:', error);
    }
  };
  


  // Cancel edit with confirmation modal
  const cancelEdit = () => {
    setShowCancelModal(true);
  };

 
  

  return (
    <div className="students-container">
      <h1 className="students-title">Pending Enrollment</h1>
      <div className="students-search-filter-container">
        <SearchFilter
          handleSearch={handleSearch}
          handleFilter={handleFilterChange}
          handleApplyFilters={handleApplyFilters}
        />
      </div>
      <div className="students-button-container">
      </div>
      <div className="students-list">
      <table className="attendance-table">
        <thead>
          <tr>
            <th>#</th>
            <th>Name</th>
            <th>Grade</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {currentStudents.map((student, index) => (
            <React.Fragment key={student.student_id}>
              <tr>
                <td>{index + 1}</td>
                <td>{student.firstname} {student.middlename && `${student.middlename[0]}.`} {student.lastname}</td>
                <td>Grade {student.current_yr_lvl}</td>
                <td>{student.active_status}</td>
                <td>
                  <button 
                    className="students-view-button"
                    onClick={() => toggleStudentDetails(student.student_id)}
                  >
                    View
                  </button>
                  {(roleName === 'registrar' || roleName === 'principal') && (
                    <>
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
                  </>
                  )}
                </td>
              </tr>

              {selectedStudentId === student.student_id && (
              <tr className="student-details-row">
                <td colSpan="5">
                  <div className="student-details-container">
                    <table className="student-details-table">
                      <tbody>
                        <tr>
                          <th>Last Name:</th>
                          <td>
                            {isEditing ? (
                              <input
                                type="text"
                                name="lastname"
                                value={editStudentData ? editStudentData.lastname || "" : ""}
                                onChange={handleEditChange}
                              />
                            ) : (
                              student.lastname
                            )}
                          </td>
                        </tr>
                        <tr>
                          <th>First Name:</th>
                          <td>
                            {isEditing ? (
                              <input
                                type="text"
                                name="firstname"
                                value={editStudentData ? editStudentData.firstname || "" : ""}
                                onChange={handleEditChange}
                              />
                            ) : (
                              student.firstname
                            )}
                          </td>
                        </tr>
                        <tr>
                          <th>Middle Name:</th>
                          <td>
                            {isEditing ? (
                              <input
                                type="text"
                                name="middlename"
                                value={editStudentData ? editStudentData.middlename || "" : ""}
                                onChange={handleEditChange}
                              />
                            ) : (
                              student.middlename || "N/A"
                            )}
                          </td>
                        </tr>
                        <tr>
                          <th>Grade Level:</th>
                          <td>
                            {isEditing ? (
                              <input
                                type="text"
                                name="current_yr_lvl"
                                value={editStudentData ? editStudentData.current_yr_lvl || "" : ""}
                                onChange={handleEditChange}
                              />
                            ) : (
                              student.current_yr_lvl
                            )}
                          </td>
                        </tr>
                        <tr>
                          <th>Birthdate:</th>
                          <td>
                            {isEditing ? (
                              <input
                                type="date"
                                name="birthdate"
                                value={editStudentData ? editStudentData.birthdate || "" : ""}
                                onChange={handleEditChange}
                              />
                            ) : (
                              formatDate(student.birthdate)
                            )}
                          </td>
                        </tr>
                        <tr>
                          <th>Gender:</th>
                          <td>
                            {isEditing ? (
                              <select
                                name="gender"
                                vvalue={editStudentData ? editStudentData.gender || "" : ""}
                                onChange={handleEditChange}
                              >
                                <option value="Male">Male</option>
                                <option value="Female">Female</option>
                              </select>
                            ) : (
                              student.gender
                            )}
                          </td>
                        </tr>
                        <tr>
                          <th>Contact Number:</th>
                          <td>
                            {isEditing ? (
                              <input
                                type="text"
                                name="contact_number"
                                value={editStudentData ? editStudentData.contact_number || "" : ""}
                                onChange={handleEditChange}
                              />
                            ) : (
                              student.contact_number
                            )}
                          </td>
                        </tr>
                        <tr>
                          <th>Email:</th>
                          <td>
                            {isEditing ? (
                              <input
                                type="email"
                                name="email_address"
                                value={editStudentData ? editStudentData.email_address || "" : ""}
                                onChange={handleEditChange}
                              />
                            ) : (
                              student.email_address
                            )}
                          </td>
                        </tr>
                        <tr>
                          <th>Mother's Name:</th>
                          <td>
                            {isEditing ? (
                              <input
                                type="text"
                                name="mother_name"
                                value={editStudentData ? editStudentData.mother_name || "" : ""}
                                onChange={handleEditChange}
                              />
                            ) : (
                              student.mother_name
                            )}
                          </td>
                        </tr>
                        <tr>
                          <th>Father's Name:</th>
                          <td>
                            {isEditing ? (
                              <input
                                type="text"
                                name="father_name"
                                value={editStudentData ? editStudentData.father_name || "" : ""}
                                onChange={handleEditChange}
                              />
                            ) : (
                              student.father_name
                            )}
                          </td>
                        </tr>
                        <tr>
                          <th>Parent Address:</th>
                          <td>
                            {isEditing ? (
                              <input
                                type="text"
                                name="parent_address"
                                value={editStudentData ? editStudentData.parent_address || "" : ""}
                                onChange={handleEditChange}
                              />
                            ) : (
                              student.parent_address
                            )}
                          </td>
                        </tr>
                        <tr>
                          <th>Mother's Occupation:</th>
                          <td>
                            {isEditing ? (
                              <input
                                type="text"
                                name="mother_occupation"
                                value={editStudentData ? editStudentData.mother_occupation || "" : ""}
                                onChange={handleEditChange}
                              />
                            ) : (
                              student.mother_occupation
                            )}
                          </td>
                        </tr>
                        <tr>
                          <th>Father's Occupation:</th>
                          <td>
                            {isEditing ? (
                              <input
                                type="text"
                                name="father_occupation"
                                value={editStudentData ? editStudentData.father_occupation || "" : ""}
                                onChange={handleEditChange}
                              />
                            ) : (
                              student.father_occupation
                            )}
                          </td>
                        </tr>
                        <tr>
                          <th>Annual Household Income:</th>
                          <td>
                            {isEditing ? (
                              <input
                                type="text"
                                name="annual_hshld_income"
                                value={editStudentData ? editStudentData.annual_hshld_income || "" : ""}
                                onChange={handleEditChange}
                              />
                            ) : (
                              student.annual_hshld_income
                            )}
                          </td>
                        </tr>
                        <tr>
                          <th>Number of Siblings:</th>
                          <td>
                            {isEditing ? (
                              <input
                                type="number"
                                name="number_of_siblings"
                                value={editStudentData ? editStudentData.number_of_siblings || "" : ""}
                                onChange={handleEditChange}
                              />
                            ) : (
                              student.number_of_siblings
                            )}
                          </td>
                        </tr>
                        <tr>
                          <th>Mother's Educational Level:</th>
                          <td>
                            {isEditing ? (
                              <input
                                type="text"
                                name="mother_educ_lvl"
                                value={editStudentData ? editStudentData.mother_educ_lvl || "" : ""}
                                onChange={handleEditChange}
                              />
                            ) : (
                              student.mother_educ_lvl
                            )}
                          </td>
                        </tr>
                        <tr>
                          <th>Father's Educational Level:</th>
                          <td>
                            {isEditing ? (
                              <input
                                type="text"
                                name="father_educ_lvl"
                                value={editStudentData ? editStudentData.father_educ_lvl || "" : ""}
                                onChange={handleEditChange}
                              />
                            ) : (
                              student.father_educ_lvl
                            )}
                          </td>
                        </tr>
                        <tr>
                          <th>Mother's Contact Number:</th>
                          <td>
                            {isEditing ? (
                              <input
                                type="number"
                                name="mother_contact_number"
                                value={editStudentData ? editStudentData.mother_contact_number || "" : ""}
                                onChange={handleEditChange}
                              />
                            ) : (
                              student.mother_contact_number
                            )}
                          </td>
                        </tr>
                        <tr>
                          <th>Father's Contact Number:</th>
                          <td>
                            {isEditing ? (
                              <input
                                type="number"
                                name="father_contact_number"
                                value={editStudentData ? editStudentData.father_contact_number || "" : ""}
                                onChange={handleEditChange}
                              />
                            ) : (
                              student.father_contact_number
                            )}
                          </td>
                        </tr>
                        <tr>
                          <th>Emergency Contact Number:</th>
                          <td>
                            {isEditing ? (
                              <input
                                type="number"
                                name="emergency_contact_number"
                                value={editStudentData ? editStudentData.emergency_number || "" : ""}
                                onChange={handleEditChange}
                              />
                            ) : (
                              student.emergency_number
                            )}
                          </td>
                        </tr>
                        <tr>
                          <th>Brigada Eskwela:</th>
                          <td>
                            {isEditing ? (
                              <input
                                type="text"
                                name="brigada_eskwela"
                                value={editStudentData ? editStudentData.brigada_eskwela || "" : ""}
                                onChange={handleEditChange}
                              />
                            ) : (
                              student.brigada_eskwela
                            )}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                    <div className="action-buttons">
                      {isEditing ? (
                        <>
                          <button className="save-button" onClick={handleSave}>
                            Save
                          </button>
                          <button className="cancel-button" onClick={cancelEdit}>
                            Cancel
                          </button>
                        </>
                      ) : (
                        <>
                        </>
                      )}
                    </div>
                  </div>
                </td>
              </tr>
            )}


            </React.Fragment>
          ))}
        </tbody>
      </table>
      {/* Pagination Controls */}
      <Pagination
        totalItems={filteredStudents.length}
        itemsPerPage={studentsPerPage}
        currentPage={currentPage}
        onPageChange={paginate}
      />
    </div>
    </div>
  );
}

export default Registrar_PendingEnrollmentPage;
