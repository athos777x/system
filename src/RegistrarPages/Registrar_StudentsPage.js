import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import SearchFilter from '../RoleSearchFilters/SearchFilter';
import Pagination from '../Utilities/pagination';
import axios from 'axios';
import '../RegistrarPagesCss/StudentManagement.css';

function Registrar_StudentsPage() {
  const [students, setStudents] = useState([]);
  const [filteredStudents, setFilteredStudents] = useState([]);
  const [selectedStudentId, setSelectedStudentId] = useState(null);
  const [studentsPerPage] = useState(5); // Adjust this number to set how many students per page
  const [currentPage, setCurrentPage] = useState(1);
  const [isEditing, setIsEditing] = useState(false); // Tracks edit mode
  const [editStudentData, setEditStudentData] = useState(null); // Stores the editable student data
  const [showCancelModal, setShowCancelModal] = useState(false); // Tracks cancel confirmation modal
  const [errors, setErrors] = useState({});

  const [schoolYears, setSchoolYears] = useState([]);
  const [sections, setSections] = useState([]);
  const [filteredSections, setFilteredSections] = useState([]);
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
    section_id: '',
    brigada_eskwela: ''
  });


  const navigate = useNavigate();

  useEffect(() => {
    fetchStudents();
    fetchSchoolYears();
    fetchSections();
  }, []);

  useEffect(() => {
    if (filters.grade) {
      // Filter sections based on the selected grade level
      const sectionsForGrade = sections.filter(section => String(section.grade_level) === String(filters.grade));
      setFilteredSections(sectionsForGrade);
    } else {
      setFilteredSections(sections);
    }
  }, [filters.grade, sections]);

  const fetchSchoolYears = async () => {
    try {
      const response = await axios.get('http://localhost:3001/api/school_years');
      setSchoolYears(response.data);
    } catch (error) {
      console.error('Error fetching school years:', error);
    }
  };

  const fetchSections = async () => {
    try {
      const response = await axios.get('http://localhost:3001/sections');
      setSections(response.data);
      setFilteredSections(response.data);
    } catch (error) {
      console.error('Error fetching sections:', error);
    }
  };

  const fetchStudents = async (appliedFilters = {}) => {
    try {
      console.log('Applied filters:', appliedFilters);
      const response = await axios.get('http://localhost:3001/students', {
        params: appliedFilters
      });
      console.log('Full response from server:', response);
      const sortedStudents = response.data.sort((a, b) => b.current_yr_lvl - a.current_yr_lvl);
      setStudents(sortedStudents);
      setFilteredStudents(sortedStudents);
    } catch (error) {
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
    setFilters((prevFilters) => ({ ...prevFilters, searchTerm }));
    applyFilters({ ...filters, searchTerm });
  };

const handleFilterChange = (type, value) => {
    if (type === 'grade') {
      setFilters(prevFilters => ({
        ...prevFilters,
        [type]: value,
        section: '' // Reset section when grade changes
      }));
    } else {
    setFilters(prevFilters => ({
        ...prevFilters,
        [type]: value
    }));
    }
};

const applyFilters = () => {
    let filtered = students;

    if (filters.school_year) {
        filtered = filtered.filter(student => String(student.school_year) === filters.school_year);
    }
    if (filters.grade) {
      filtered = filtered.filter(student => String(student.current_yr_lvl) === String(filters.grade));
    }
    if (filters.section) {
      filtered = filtered.filter(student => String(student.section_id) === String(filters.section));
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
    setCurrentPage(1); // Reset to first page when filters are applied
};

const handleApplyFilters = () => {
    console.log('Applying filters:', filters);
    fetchStudents(filters); // Fetch students with the current filters
};

  const startAdding = () => {
    setIsAdding(true);
    setNewStudentData({
      lrn: '',
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
      user_id: '',
      brigada_eskwela:'',
    });
    setShowModal(true);
  };

  const handleAddChange = (e) => {
    const { name, value } = e.target;
    setNewStudentData(prevData => ({ ...prevData, [name]: value }));

    // Remove error message once the user starts typing
    setErrors(prevErrors => ({ ...prevErrors, [name]: value ? "" : "This field is required" }));
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
    user_id: '',
    brigada_eskwela:'',
  });
  setShowModal(false);  // Close the modal
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
    if (selectedStudentId === studentId) {
      // If we're closing the details, also exit edit mode
      setIsEditing(false);
      setEditStudentData(null);
    }
  };

  const handleEditClick = (studentId) => {
    const student = currentStudents.find((s) => s.student_id === studentId);
    setEditStudentData(student);
    setIsEditing(true);
    setSelectedStudentId(studentId); // Ensure details are expanded
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

    // Required fields
    const requiredFields = [
        "lastname", "firstname", "current_yr_lvl", "birthdate", "gender",
        "age", "home_address", "barangay", "city_municipality", "province",
        "contact_number", "email_address", "father_contact_number", 
        "mother_contact_number", "emergency_number", "brigada_eskwela"
    ];

    // Check for missing fields
    let newErrors = {};
    requiredFields.forEach(field => {
        if (!editStudentData[field]) {
            newErrors[field] = "This field is required";
        }
    });

    // If errors exist, show them and prevent submission
    if (Object.keys(newErrors).length > 0) {
        setErrors(newErrors);
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


        // Refresh the student list
        await fetchStudents();

        // Untoggle the student detail view to return to the list of students
        toggleStudentDetails(); // Hide student detail view

    } catch (error) {
        console.error('Error saving student data:', error);
    }
};

  
  
  
  
  
  
  
  

  // Cancel edit with confirmation modal
  const cancelEdit = () => {
    setShowCancelModal(true);
  };

  // Confirm cancel
  const confirmCancel = (confirm) => {
    if (confirm) {
      setIsEditing(false);
      setSelectedStudentId(null);
    }
    setShowCancelModal(false);
  };

  const handlePrint = (studentId) => {
    // Locate the specific student-details-table
    const table = document.querySelector(".student-details-table");
  
    if (!table) {
      console.error("Student details table not found");
      return;
    }
  
    // Create a new window for displaying the content
    const printWindow = window.open("", "");
  
    // Generate printable content
    printWindow.document.write(`
      <html>
        <head>
          <title>Student Details</title>
          <style>
            table {
              border-collapse: collapse;
              width: 100%;
            }
            th, td {
              border: 1px solid #ddd;
              padding: 8px;
            }
            th {
              background-color: #f2f2f2;
              text-align: left;
            }
          </style>
        </head>
        <body>
          <h2>Student Details</h2>
          ${table.outerHTML}
        </body>
      </html>
    `);
  
    // Close the document and focus on the new window
    printWindow.document.close();
    printWindow.focus();
  };
  
  
  

  return (
    <div className="student-mgmt-container">
      <div className="student-mgmt-header">
        <h1 className="student-mgmt-title">Students</h1>
        {(roleName === 'registrar' || roleName === 'subject_teacher' || roleName === 'class_adviser' || roleName === 'grade_level_coordinator') && (
          <button className="student-mgmt-add-btn" onClick={startAdding}>
            Add New Student
          </button>
        )}
      </div>

      <div className="student-mgmt-filters">
        <div className="student-mgmt-search">
          <input
            type="text"
            placeholder="Search by student name..."
            onChange={(e) => handleSearch(e.target.value)}
          />
        </div>
        <div className="student-mgmt-filters-group">
          <select
            value={filters.school_year}
            onChange={(e) => handleFilterChange('school_year', e.target.value)}
          >
            <option value="">Select School Year</option>
            {schoolYears.map((year) => (
              <option key={year.school_year_id} value={year.school_year}>
                {year.school_year}
              </option>
            ))}
          </select>
          <select
            value={filters.grade}
            onChange={(e) => handleFilterChange('grade', e.target.value)}
          >
            <option value="">Select Grade Level</option>
            {[7, 8, 9, 10].map((grade) => (
              <option key={grade} value={grade}>Grade {grade}</option>
            ))}
          </select>
          <select
            value={filters.section}
            onChange={(e) => handleFilterChange('section', e.target.value)}
          >
            <option value="">Select Section</option>
            {filteredSections.map((section) => (
              <option key={section.section_id} value={section.section_id}>
                {section.section_name}
              </option>
            ))}
          </select>
        </div>
        <button onClick={handleApplyFilters}>Filter</button>
      </div>

      <div className="student-mgmt-table-container">
        <table className="student-mgmt-table">
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
                <td>
                    <span className={`status-${student.active_status ? student.active_status.toLowerCase() : 'pending'}`}>
                      {student.active_status ? student.active_status.toLowerCase() : 'pending'}
                    </span>
                  </td>
                  <td className="student-mgmt-actions">
                  <button 
                      className="student-mgmt-btn student-mgmt-btn-view"
                    onClick={() => toggleStudentDetails(student.student_id)}
                  >
                    View
                  </button>
                    {(roleName !== 'principal') && (
                  <button
                        className="student-mgmt-btn student-mgmt-btn-edit"
                    onClick={() => handleEditClick(student.student_id)}
                  >
                    Edit
                  </button>
                  )}
                    {(roleName === 'registrar' && student.active_status === null) && (
                    <button 
                        className="student-mgmt-btn student-mgmt-btn-register"
                      onClick={(e) => {
                        e.stopPropagation();
                        enrollStudent(student.student_id);
                      }}
                    >
                      Register
                    </button> 
                  )}
                </td>
              </tr>

              {selectedStudentId === student.student_id && (
                  <tr>
                <td colSpan="5">
                      <div className="student-mgmt-details">
                        <div className="student-mgmt-details-content">
                          {/* Left Column */}
                          <div className="student-mgmt-details-section">
                            <table className="student-details-view-table">
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
                                      student.middlename
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
                                      student.birthdate
                            )}
                          </td>
                        </tr>
                        <tr>
                          <th>Gender:</th>
                          <td>
                            {isEditing ? (
                                      <input
                                        type="text"
                                name="gender"
                                        value={editStudentData ? editStudentData.gender || "" : ""}
                                onChange={handleEditChange}
                                      />
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
                              </tbody>
                            </table>
                          </div>

                          {/* Right Column */}
                          <div className="student-mgmt-details-section">
                            <table className="student-details-view-table">
                              <tbody>
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
                                  <th>Annual Income:</th>
                          <td>
                            {isEditing ? (
                              <input
                                type="text"
                                        name="annual_income"
                                        value={editStudentData ? editStudentData.annual_income || "" : ""}
                                onChange={handleEditChange}
                              />
                            ) : (
                                      student.annual_income
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
                                  <th>Emergency Contact:</th>
                          <td>
                            {isEditing ? (
                              <input
                                type="text"
                                        name="emergency_contact"
                                        value={editStudentData ? editStudentData.emergency_contact || "" : ""}
                                onChange={handleEditChange}
                              />
                            ) : (
                                      student.emergency_contact
                            )}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                          </div>
                          
                          {/* Action Buttons */}
                          <div className="student-details-actions">
                            <div className="student-details-actions-right">
                      {isEditing ? (
                        <>
                                  <button
                                    className="student-mgmt-btn student-mgmt-btn-edit"
                                    onClick={handleSave}
                                  >
                            Save
                          </button>
                                  <button
                                    className="student-mgmt-btn student-mgmt-btn-archive"
                                    onClick={() => toggleStudentDetails(student.student_id)}
                                  >
                            Cancel
                          </button>
                        </>
                      ) : (
                            <>
                              <button
                                    className="student-mgmt-btn student-mgmt-btn-print"
                                    onClick={() => handlePrint(student.student_id)}
                              >
                                    Print
                              </button>
                                  {roleName === 'registrar' && (
                              <button
                                      className="student-mgmt-btn student-mgmt-btn-archive"
                                      onClick={() => openArchiveModal(student.student_id)}
                              >
                                      Archive
                              </button>
                          )}
                        </>
                      )}
                            </div>
                          </div>
                    </div>
                  </div>
                </td>
              </tr>
            )}
            </React.Fragment>
          ))}
        </tbody>
      </table>
      </div>

      <div className="student-mgmt-pagination">
      <Pagination
        totalItems={filteredStudents.length}
        itemsPerPage={studentsPerPage}
        currentPage={currentPage}
        onPageChange={paginate}
      />
    </div>

      {/* Modals */}
    {showCancelModal && (
        <div className="student-mgmt-modal">
          <div className="student-mgmt-modal-content">
          <h2>Cancel Editing?</h2>
          <p>Are you sure you want to cancel? Unsaved changes will be lost.</p>
            <div className="student-mgmt-modal-actions">
              <button className="student-mgmt-btn" onClick={() => confirmCancel(true)}>
              Yes
            </button>
              <button className="student-mgmt-btn" onClick={() => confirmCancel(false)}>
              No
            </button>
          </div>
        </div>
      </div>
    )}

      {showArchiveModal && (
        <div className="student-mgmt-modal">
          <div className="student-mgmt-modal-content">
            <div className="student-mgmt-modal-header">
            <h2>Archive Student</h2>
              <p>Please select a status to archive this student. This action cannot be undone.</p>
            </div>
            
            <select
              className="student-mgmt-modal-select"
              value={archiveStatus}
              onChange={(e) => setArchiveStatus(e.target.value)}
              required
            >
              <option value="">Select archive status</option>
              <option value="inactive">Inactive</option>
              <option value="withdrawn">Withdrawn</option>
              <option value="transferred">Transferred</option>
            </select>

            <div className="student-mgmt-modal-actions">
              <button 
                className="student-mgmt-modal-btn student-mgmt-modal-btn-cancel"
                onClick={closeArchiveModal}
              >
                Cancel
              </button>
              <button 
                className="student-mgmt-modal-btn student-mgmt-modal-btn-confirm"
                onClick={handleArchive}
                disabled={!archiveStatus}
              >
                Archive
              </button>
            </div>
          </div>
        </div>
      )}

      {showModal && (
        <div className="student-mgmt-modal">
          <div className="student-mgmt-modal-content">
            <h2>Add New Student</h2>
            <div className="student-mgmt-form-grid">
              {/* Form groups for student information */}
              <div className="student-mgmt-form-group">
                <label>LRN:</label>
                <input
                  type="text"
                  name="lrn"
                  value={newStudentData.lrn}
                  onChange={handleAddChange}
                  className={errors.lrn ? "error" : ""}
                />
                {errors.lrn && <span className="student-mgmt-error">{errors.lrn}</span>}
              </div>
              <div className="student-mgmt-form-group">
                <label>Lastname:</label>
                <input
                  type="text"
                  name="lastname"
                  value={newStudentData.lastname}
                  onChange={handleAddChange}
                  className={errors.lastname ? "error" : ""}
                />
                {errors.lastname && <span className="student-mgmt-error">{errors.lastname}</span>}
              </div>
              <div className="student-mgmt-form-group">
                <label>Middlename:</label>
                <input
                  type="text"
                  name="middlename"
                  value={newStudentData.middlename}
                  onChange={handleAddChange}
                  className={errors.middlename ? "error" : ""}
                />
                {errors.middlename && <span className="student-mgmt-error">{errors.middlename}</span>}
              </div>
              <div className="student-mgmt-form-group">
                <label>Firstname:</label>
                <input
                  type="text"
                  name="firstname"
                  value={newStudentData.firstname}
                  onChange={handleAddChange}
                  className={errors.firstname ? "error" : ""}
                />
                {errors.firstname && <span className="student-mgmt-error">{errors.firstname}</span>}
              </div>
              <div className="student-mgmt-form-group">
                <label>Year Level:</label>
                <select
                  name="current_yr_lvl"
                  value={newStudentData.current_yr_lvl}
                  onChange={handleAddChange}
                  className={errors.current_yr_lvl ? "error" : ""}
                >
                  <option value="">Select Year Level</option>
                  <option value="7">7</option>
                  <option value="8">8</option>
                  <option value="9">9</option>
                  <option value="10">10</option>
                </select>
                {errors.current_yr_lvl && <span className="student-mgmt-error">{errors.current_yr_lvl}</span>}
              </div>
              <div className="student-mgmt-form-group">
                <label>Birthdate:</label>
                <input
                  type="date"
                  name="birthdate"
                  value={newStudentData.birthdate}
                  onChange={handleAddChange}
                  className={errors.birthdate ? "error" : ""}
                />
                {errors.birthdate && <span className="student-mgmt-error">{errors.birthdate}</span>}
              </div>
              <div className="student-mgmt-form-group">
                <label>Gender:</label>
                <select
                  name="gender"
                  value={newStudentData.gender}
                  onChange={handleAddChange}
                  className={errors.gender ? "error" : ""}
                >
                  <option value="">Select Gender</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                </select>
                {errors.gender && <span className="student-mgmt-error">{errors.gender}</span>}
              </div>
              <div className="student-mgmt-form-group">
                <label>Age:</label>
                <input
                  type="number"
                  name="age"
                  value={newStudentData.age}
                  onChange={handleAddChange}
                  className={errors.age ? "error" : ""}
                />
                {errors.age && <span className="student-mgmt-error">{errors.age}</span>}
              </div>
              <div className="student-mgmt-form-group">
                <label>Home Address:</label>
                <input
                  type="text"
                  name="home_address"
                  value={newStudentData.home_address}
                  onChange={handleAddChange}
                  className={errors.home_address ? "error" : ""}
                />
                {errors.home_address && <span className="student-mgmt-error">{errors.home_address}</span>}
              </div>
              <div className="student-mgmt-form-group">
                <label>Barangay:</label>
                <input
                  type="text"
                  name="barangay"
                  value={newStudentData.barangay}
                  onChange={handleAddChange}
                  className={errors.barangay ? "error" : ""}
                />
                {errors.barangay && <span className="student-mgmt-error">{errors.barangay}</span>}
              </div>
              <div className="student-mgmt-form-group">
                <label>City Municipality:</label>
                <input
                  type="text"
                  name="city_municipality"
                  value={newStudentData.city_municipality}
                  onChange={handleAddChange}
                  className={errors.city_municipality ? "error" : ""}
                />
                {errors.city_municipality && <span className="student-mgmt-error">{errors.city_municipality}</span>}
              </div>
              <div className="student-mgmt-form-group">
                <label>Province:</label>
                <input
                  type="text"
                  name="province"
                  value={newStudentData.province}
                  onChange={handleAddChange}
                  className={errors.province ? "error" : ""}
                />
                {errors.province && <span className="student-mgmt-error">{errors.province}</span>}
              </div>
              <div className="student-mgmt-form-group">
                <label>Contact Number:</label>
                <input
                  type="number"
                  name="contact_number"
                  value={newStudentData.contact_number}
                  onChange={handleAddChange}
                  className={errors.contact_number ? "error" : ""}
                />
                {errors.contact_number && <span className="student-mgmt-error">{errors.contact_number}</span>}
              </div>
              <div className="student-mgmt-form-group">
                <label>Email Address:</label>
                <input
                  type="email"
                  name="email_address"
                  value={newStudentData.email_address}
                  onChange={handleAddChange}
                  className={errors.email_address ? "error" : ""}
                />
                {errors.email_address && <span className="student-mgmt-error">{errors.email_address}</span>}
            </div>
            </div>
            <div className="student-mgmt-modal-actions">
              <button className="student-mgmt-btn student-mgmt-btn-edit" onClick={saveNewSection}>
                Save
              </button>
              <button className="student-mgmt-btn" onClick={cancelAdding}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Registrar_StudentsPage;
