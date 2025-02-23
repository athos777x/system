import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Pagination from '../Utilities/pagination';
import axios from 'axios';
import '../RegistrarPagesCss/Registrar_TeacherPage.css';
import EmployeeSearchFilter from '../RoleSearchFilters/EmployeeSearchFilter';

function Registrar_TeacherPage() {
  const [teachers, setTeachers] = useState([]);
  const [filteredTeachers, setFilteredTeachers] = useState([]);
  const [selectedTeacherId, setSelectedTeacherId] = useState(null);
  const [studentsPerPage] = useState(5); // Adjust this number to set how many students per page
  const [currentPage, setCurrentPage] = useState(1);
  const [filters, setFilters] = useState({
    searchTerm: '',
    status: ''
  });
  const [isAdding, setIsAdding] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [newTeacherData, setNewTeacherData] = useState({
    firstname: '',
    lastname: '',
    middlename: '',
    status: 'active',
    contact_number: '',
    address: '',
    year_started: '',
    role_name: '',
    role_id: '',
    archive_status: 'unarchive'
  });
  const [roles, setRoles] = useState([]);
  const [isLoadingRoles, setIsLoadingRoles] = useState(true);
  const [showAssignSubjectModal, setShowAssignSubjectModal] = useState(false);
  const [selectedGradeLevel, setSelectedGradeLevel] = useState('7');
  const [subjectsByGrade, setSubjectsByGrade] = useState([]);
  const [selectedSubject, setSelectedSubject] = useState('');
  const [currentTeacherId, setCurrentTeacherId] = useState(null);
  const [sections, setSections] = useState([]);
  const [selectedSection, setSelectedSection] = useState('');
  const [showAssignSectionModal, setShowAssignSectionModal] = useState(false);
  const [teacherSubjects, setTeacherSubjects] = useState([]);
  const [selectedGradeLevelForSection, setSelectedGradeLevelForSection] = useState('7');
  const [sectionsByGrade, setSectionsByGrade] = useState([]);
  const [teacherSection, setTeacherSection] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [schoolYears, setSchoolYears] = useState([]);
  const [selectedSchoolYear, setSelectedSchoolYear] = useState('');
  const [editTeacherData, setEditTeacherData] = useState({
    firstname: '',
    lastname: '',
    middlename: '',
    contact_number: '',
    address: '',
    year_started: '',
    role_name: '',
    role_id: ''
  });

  const navigate = useNavigate();

  useEffect(() => {
    console.log('Component mounted');
    fetchRoles();
    fetchTeachers();
  }, []);

  useEffect(() => {
    console.log('Current roles state:', roles);
  }, [roles]);

  const fetchTeachers = async (appliedFilters = {}) => {
    try {
      console.log('Applied filters:', appliedFilters);
      const response = await axios.get('http://localhost:3001/employees', {
        params: appliedFilters
      });
      const sortedTeachers = response.data.sort((a, b) => a.firstname.localeCompare(b.firstname));
      setTeachers(sortedTeachers);
      setFilteredTeachers(sortedTeachers);
    } catch (error) {
      console.error('Error fetching teachers:', error);
    }
  };

  useEffect(() => {
    const fetchSchoolYears = async () => {
      try {
        const response = await axios.get('http://localhost:3001/school-years-assign');
        setSchoolYears(response.data);

        // Auto-select the active school year by default
        const activeYear = response.data.find((year) => year.status === 'active');
        if (activeYear) {
          setSelectedSchoolYear(activeYear.school_year_id);
        } else if (response.data.length) {
          // Fallback to the first year if no active year is found
          setSelectedSchoolYear(response.data[0].school_year_id);
        }
      } catch (error) {
        console.error('Error fetching school years:', error);
      }
    };

    fetchSchoolYears();
  }, []);


  const fetchRoles = async () => {
    try {
      console.log('Fetching roles...');
      setIsLoadingRoles(true);
      const response = await axios.get('http://localhost:3001/roles');
      console.log('Roles data received:', response.data);
      setRoles(response.data);
    } catch (error) {
      console.error('Error fetching roles:', error);
    } finally {
      setIsLoadingRoles(false);
    }
  };

  const handleSearch = (searchTerm) => {
    setFilters((prevFilters) => ({ ...prevFilters, searchTerm }));
    applyFilters({ ...filters, searchTerm });
  };

  const applyFilters = (appliedFilters) => {
    let filtered = teachers;
  
    if (appliedFilters.status) {
      filtered = filtered.filter(teacher => String(teacher.status) === appliedFilters.status);
    }
    if (appliedFilters.position) {
      const normalizedPosition = appliedFilters.position.toLowerCase().replace(/\s/g, '_');
      filtered = filtered.filter(teacher => String(teacher.role_name).toLowerCase() === normalizedPosition);
    }
    
    if (appliedFilters.searchTerm) {
      filtered = filtered.filter(teacher => {
        const firstName = teacher.firstname ? teacher.firstname.toLowerCase() : "";
        const lastName = teacher.lastname ? teacher.lastname.toLowerCase() : "";
        return (
          firstName.includes(appliedFilters.searchTerm.toLowerCase()) ||
          lastName.includes(appliedFilters.searchTerm.toLowerCase())
        );
      });
    }
  
    setFilteredTeachers(filtered);
    console.log('Filtered teachers:', filtered);
    setCurrentPage(1); // Reset to first page
  };
  

  const handleApplyFilters = (newFilters) => {
    setFilters(newFilters);
    applyFilters(newFilters);
  };


  const startAdding = () => {
    setIsAdding(true);
    setNewTeacherData({
      firstname: '',
      lastname: '',
      middlename: '',
      status: 'active',
      contact_number: '',
      address: '',
      year_started: '',
      role_name: '',
      role_id: '',
      archive_status: 'unarchive'
    });
    setShowModal(true);
  };

  const handleAddChange = (e) => {
    const { name, value } = e.target;
    setNewTeacherData(prevState => {
      const updates = {
        ...prevState,
        [name]: value
      };
      
      if (name === 'role_name') {
        const selectedRole = roles.find(role => role.role_name === value);
        if (selectedRole) {
          updates.role_id = selectedRole.role_id;
        }
      }
      
      return updates;
    });
  };

  const validateForm = () => {
    if (!newTeacherData.role_name) {
      alert('Please select a role');
      return false;
    }
    if (!newTeacherData.firstname.trim()) {
      alert('Please enter first name');
      return false;
    }
    if (!newTeacherData.lastname.trim()) {
      alert('Please enter last name');
      return false;
    }
    if (!newTeacherData.year_started) {
      alert('Please enter year started');
      return false;
    }
    return true;
  };

  const saveNewTeacher = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      const teacherData = {
        ...newTeacherData,
        status: 'active',
        role_id: roles.find(role => role.role_name === newTeacherData.role_name)?.role_id
      };

      console.log('Sending teacher data:', teacherData);

      const response = await axios.post('http://localhost:3001/employees', teacherData);
      if (response.status === 201) {
        alert('Teacher added successfully!');
        await fetchTeachers();
        setIsAdding(false);
        setShowModal(false);
      } else {
        alert('Failed to add teacher. Please try again.');
      }
    } catch (error) {
      console.error('Error adding teacher:', error);
      alert(`Error adding teacher: ${error.response?.data?.message || 'Please try again.'}`);
    }
  };

  const cancelAdding = () => {
    setNewTeacherData({
      firstname: '',
      lastname: '',
      middlename: '',
      status: 'active',
      contact_number: '',
      address: '',
      year_started: '',
      role_name: '',
      role_id: '',
      archive_status: 'unarchive'
    });
    setShowModal(false);
  };

  // const toggleTeacherDetails = (teacherId) => {
  //   setSelectedTeacherId(selectedTeacherId === teacherId ? null : teacherId);
  // };

  // const formatDate = (isoString) => {
  //   const date = new Date(isoString);
  //   return date.toLocaleDateString();
  // };

  const formatRoleName = (roleName) => {
    return roleName.replace(/_/g, ' ').toUpperCase();
  };

  const archiveEmployee = async (employeeId, status) => {
    console.log('Payload being sent:', { employeeId, status }); // Debug log
    try {
      const response = await axios.put(`http://localhost:3001/employees/${employeeId}/archive`, {
        status,
      });
  
      if (response.status === 200) {
        alert('Employee archived successfully');
        await fetchTeachers(); // Refresh the list
        closeArchiveModal();
      } else {
        alert('Failed to archive employee. Please try again.');
      }
    } catch (error) {
      console.error('Error archiving employee:', error.response?.data || error.message);
      alert(`Error archiving employee: ${error.response?.data?.error || 'Unknown error'}`);
    }
  };
  
  

  const [showArchiveModal, setShowArchiveModal] = useState(false);
  const [archiveEmployeeId, setArchiveEmployeeId] = useState(null);
  const [archiveStatus, setArchiveStatus] = useState('');

  const openArchiveModal = (employeeId) => {
    setArchiveEmployeeId(employeeId);
    setShowArchiveModal(true);
  };

  const closeArchiveModal = () => {
    setArchiveEmployeeId(null);
    setArchiveStatus('');
    setShowArchiveModal(false);
  };

  const handleGradeLevelChange = async (gradeLevel) => {
    console.log('Changing to grade level:', gradeLevel);
    setSelectedGradeLevel(gradeLevel);
    
    try {
      const response = await axios.get(`http://localhost:3001/subjects-for-assignment/${gradeLevel}`);
      setSubjectsByGrade(response.data);
    } catch (error) {
      console.error('Error fetching subjects:', error);
      alert('Error fetching subjects');
    }
  };

  const handleAssignSubject = (employeeId) => {
    setCurrentTeacherId(employeeId);
    setShowAssignSubjectModal(true);
    setSelectedGradeLevel('7');
    handleGradeLevelChange('7');
  };

  const handleSubjectAssignment = async () => {
    if (!selectedSubject || !selectedGradeLevelForSection || !selectedSection || !selectedSchoolYear) {
      alert('Please select a subject, grade level, section, and school year.');
      return;
    }
  
    const [type, id] = selectedSubject.split('-');
    const subjectId = parseInt(id, 10);
  
    const selectedSubjectDetails = subjectsByGrade.find((subject) => {
      return type === 'elective'
        ? subject.subject_id === subjectId && subject.type === 'elective'
        : subject.subject_id === subjectId && subject.type === 'subject';
    });
  
    if (!selectedSubjectDetails) {
      alert('Invalid subject selection.');
      return;
    }
  
    const isElective = selectedSubjectDetails.type === 'elective';
  
    try {
      console.log('Assigning subject with:', {
        teacherId: currentTeacherId,
        subjectId: subjectId,
        gradeLevel: selectedGradeLevelForSection,
        sectionId: selectedSection,
        type: isElective ? 'elective' : 'subject',
        schoolYearId: selectedSchoolYear,
      });
  
      const response = await axios.post(
        `http://localhost:3001/assign-subject/${currentTeacherId}`,
        {
          subject_id: subjectId,
          grade_level: selectedGradeLevelForSection,
          section_id: selectedSection,
          type: isElective ? 'elective' : 'subject',
          school_year_id: selectedSchoolYear,
        }
      );
  
      if (response.status === 200) {
        alert(response.data.message || 'Subject assigned successfully');
        setShowAssignSubjectModal(false);
        setSelectedSubject('');
        setSelectedGradeLevelForSection('7');
        setSectionsByGrade([]);
      }
    } catch (error) {
      console.error('Error assigning subject:', error);
      alert('Error assigning subject: ' + (error.response?.data?.error || error.message));
    }
  };
  
  
  

  const handleGradeLevelChangeForSection = async (gradeLevel) => {
    console.log('Selected grade level for section:', gradeLevel);
    setSelectedGradeLevelForSection(gradeLevel);
    
    try {
      const response = await axios.get(`http://localhost:3001/sections-for-assignment/${gradeLevel}`);
      setSectionsByGrade(response.data);
    } catch (error) {
      console.error('Error fetching sections:', error);
      alert('Error fetching sections');
    }
  };

  const handleAssignSection = (employeeId) => {
    setCurrentTeacherId(employeeId);
    setShowAssignSectionModal(true);
    handleGradeLevelChangeForSection('7');
  };

  const handleSectionAssignment = async () => {
    if (!selectedSection || !selectedGradeLevelForSection || !selectedSchoolYear) {
      alert('Please select a section, grade level, and school year');
      return;
    }
  
    try {
      console.log('Assigning section with:', {
        teacherId: currentTeacherId,
        section: selectedSection,
        gradeLevel: selectedGradeLevelForSection,
        schoolYearId: selectedSchoolYear,
      });
  
      const response = await axios.post(`http://localhost:3001/assign-section/${currentTeacherId}`, {
        section_id: selectedSection,
        grade_level: selectedGradeLevelForSection,
        school_year_id: selectedSchoolYear,
      });
  
      if (response.status === 200) {
        alert('Section assigned successfully');
        setShowAssignSectionModal(false);
        setSelectedSection('');
        setSelectedGradeLevelForSection('7');
        setSectionsByGrade([]);
      }
    } catch (error) {
      console.error('Error assigning section:', error);
      alert('Error assigning section: ' + (error.response?.data?.error || error.message));
    }
  };
  

  const fetchTeacherSubjects = async (teacherId) => {
    try {
      const response = await axios.get(`http://localhost:3001/teacher-subjects/${teacherId}`);
      console.log('Fetched subjects from backend:', response.data); // Debugging output
      setTeacherSubjects(response.data);
    } catch (error) {
      console.error('Error fetching teacher subjects:', error);
    }
  };
  

  const fetchTeacherSection = async (teacherId) => {
    try {
      const response = await axios.get(`http://localhost:3001/teacher-section/${teacherId}`);
      setTeacherSection(response.data); // This sets an array of sections
    } catch (error) {
      console.error('Error fetching teacher section:', error);
    }
  };
  

  
  const handleViewDetails = (teacherId, roleId) => {
    if (selectedTeacherId === teacherId) {
      setSelectedTeacherId(null);
      setTeacherSubjects([]);
      setTeacherSection(null);
    } else {
      setSelectedTeacherId(teacherId);
      fetchTeacherSubjects(teacherId);
      if (roleId === 4) {
        fetchTeacherSection(teacherId);
      }
    }
  };

  const paginate = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  const indexOfLastStudent = currentPage * studentsPerPage;
  const indexOfFirstStudent = indexOfLastStudent - studentsPerPage;
  const CurrentTeachers = filteredTeachers.slice(indexOfFirstStudent, indexOfLastStudent);
  const [subjects, setSubjects] = useState([]);
  const totalPages = Math.ceil(filteredTeachers.length / studentsPerPage);
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

  // Fetch subjects (including electives)
const fetchSubjects = async (gradeLevel) => {
  try {
    const response = await axios.get(`http://localhost:3001/subjects-for-assignment/${gradeLevel}`);
    setSubjects(response.data);
  } catch (error) {
    console.error('Error fetching subjects:', error);
  }
};

// Call this when grade level changes
useEffect(() => {
  if (selectedGradeLevel) {
    fetchSubjects(selectedGradeLevel);
  }
}, [selectedGradeLevel]);

  const handleEditClick = (teacher) => {
    setEditTeacherData({
      ...teacher,
      role_name: teacher.role_name
    });
    setShowEditModal(true);
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditTeacherData(prevState => {
      const updates = {
        ...prevState,
        [name]: value
      };
      
      if (name === 'role_name') {
        const selectedRole = roles.find(role => role.role_name === value);
        if (selectedRole) {
          updates.role_id = selectedRole.role_id;
        }
      }
      
      return updates;
    });
  };

  const saveEditedTeacher = async () => {
    try {
      const response = await axios.put(`http://localhost:3001/employees/${editTeacherData.employee_id}`, editTeacherData);
      if (response.status === 200) {
        alert('Teacher updated successfully!');
        await fetchTeachers();
        setShowEditModal(false);
      } else {
        alert('Failed to update teacher. Please try again.');
      }
    } catch (error) {
      console.error('Error updating teacher:', error);
      alert(`Error updating teacher: ${error.response?.data?.message || 'Please try again.'}`);
    }
  };

  return (
    <div className="students-container">
      <h1 className="students-title">Employees</h1>
      <div className="students-search-filter-container">
        <EmployeeSearchFilter
          handleSearch={handleSearch}
          handleApplyFilters={handleApplyFilters}
        />
      </div>
      <div className="students-button-container">
        {(roleName === 'registrar' || roleName === 'principal') && (
          <button className="students-add-button" onClick={startAdding}>
            Add New Teacher
          </button>
        )}
      </div>
      <div className="teachers-list">
      <table className="attendance-table">
        <thead>
          <tr>
            <th>#</th>
            <th>Name</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {CurrentTeachers.map((teacher, index) => (
            <React.Fragment key={teacher.employee_id}>
              <tr>
                <td>{index + 1}</td>
                <td>{teacher.firstname} {teacher.middlename && `${teacher.middlename[0]}.`} {teacher.lastname}</td>
                <td>{teacher.status}</td>
                <td>
                  <button 
                    className="students-view-button"
                    onClick={() => handleViewDetails(teacher.employee_id, teacher.role_id)}
                  >
                    View
                  </button>
                  {(roleName === 'registrar' || roleName === 'principal') && teacher.status === 'active' && (
                    <button 
                      className="students-edit-button"
                      onClick={() => handleEditClick(teacher)}
                    >
                      Edit
                    </button>
                  )}
                </td>
              </tr>

              {selectedTeacherId === teacher.employee_id && (
                <tr className="teacher-details-row">
                  <td colSpan="4">
                    <div className="teacher-details-container">
                      <table className="teacher-details-table">
                        <tbody>
                        <tr>
                            <th>Employee ID:</th>
                            <td>{teacher.employee_id}</td>
                          </tr>
                          <tr>
                            <th>Last Name:</th>
                            <td>{teacher.lastname}</td>
                          </tr>
                          <tr>
                            <th>First Name:</th>
                            <td>{teacher.firstname}</td>
                          </tr>
                          <tr>
                            <th>Middle Name:</th>
                            <td>{teacher.middlename || 'N/A'}</td>
                          </tr>
                          <tr>
                            <th>Contact Number:</th>
                            <td>{teacher.contact_number}</td>
                          </tr>
                          <tr>
                            <th>Address:</th>
                            <td>{teacher.address}</td>
                          </tr>
                          <tr>
                            <th>Year Started:</th>
                            <td>{teacher.year_started}</td>
                          </tr>
                          <tr>
                            <th>Role:</th>
                            <td>{teacher.role_name}</td>
                          </tr>
                          <tr>
                            <th>Status:</th>
                            <td>{teacher.status}</td>
                          </tr>
                        </tbody>
                      </table>

                      
                      <div className="assigned-subjects">
                        <h3>Assigned Subjects</h3>
                        {teacherSubjects.length > 0 ? (
                          <table className="subjects-table">
                            <thead>
                              <tr>
                                <th>Grade Level</th>
                                <th>Subject Name</th>
                                <th>Section</th>
                              </tr>
                            </thead>
                            <tbody>
                              {teacherSubjects.map((subject, index) => (
                                <tr key={index}>
                                  <td>{subject.grade_level}</td> {/* Already includes 'Grade X' from the backend */}
                                  <td>{subject.subject_name}</td> {/* Elective name or subject_name is already decided in the backend */}
                                  <td>{subject.section_name}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        ) : (
                          <p>No subjects assigned yet</p>
                        )}
                      </div>




                      {teacher.role_id === 4 && (
                        <div className="assigned-section">
                          <h3>Assigned Section</h3>
                          {teacherSection && teacherSection.length > 0 ? ( // Check if the array has sections
                            <table className="section-table">
                              <thead>
                                <tr>
                                  <th>Grade Level</th>
                                  <th>Section Name</th>
                                </tr>
                              </thead>
                              <tbody>
                                {teacherSection.map((section, index) => ( // Loop through each section
                                  <tr key={index}>
                                    <td>{section.grade_level}</td>
                                    <td>{section.section_name}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          ) : (
                            <p>No section assigned yet</p>
                          )}
                        </div>
                      )}


                      <div className="action-buttons">
                          <button 
                            className="assign-button"
                            onClick={() => handleAssignSubject(teacher.employee_id)}
                          >
                            Assign Subject
                          </button>
                        {teacher.role_id === 4 && (
                          <button 
                            className="assign-button"
                            onClick={() => handleAssignSection(teacher.employee_id)}
                          >
                            Assign Section
                          </button>
                        )}
                        <button 
                          className="delete-button"
                          onClick={() => openArchiveModal(teacher.employee_id)}
                          disabled={teacher.status !== 'active'}
                        >
                          Archive Employee
                        </button>
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
        totalItems={filteredTeachers.length}
        itemsPerPage={studentsPerPage}
        currentPage={currentPage}
        onPageChange={paginate}
      />
    </div>

      {showArchiveModal && (
        <div className="archive-modal">
          <div className="archive-modal-content">
            <h2>Archive Employee</h2>
            <p>Choose an archive status for the employee:</p>
            <select
              value={archiveStatus}
              onChange={(e) => {
                setArchiveStatus(e.target.value);
                console.log('Selected archive status:', e.target.value); // Debugging
              }}
              required
            >
              <option value="">Select Status</option>
              <option value="resigned">Resigned</option>
              <option value="retired">Retired</option>
            </select>
            <div className="archive-modal-buttons">
              <button
                className="confirm-button"
                onClick={() => {
                  if (!archiveStatus) {
                    alert('Please select an archive status.');
                    return;
                  }
                  archiveEmployee(archiveEmployeeId, archiveStatus);
                }}
              >
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
            <h2>Add New Teacher</h2>
            <label>
              Lastname:
              <input
                type="text"
                name="lastname"
                value={newTeacherData.lastname}
                onChange={handleAddChange}
                required
              />
            </label>
            <label>
              Firstname:
              <input
                type="text"
                name="firstname"
                value={newTeacherData.firstname}
                onChange={handleAddChange}
                required
              />
            </label>
            <label>
              Middlename:
              <input
                type="text"
                name="middlename"
                value={newTeacherData.middlename}
                onChange={handleAddChange}
              />
            </label>
            <label>
              Contact Number:
              <input
                type="text"
                name="contact_number"
                value={newTeacherData.contact_number}
                onChange={handleAddChange}
              />
            </label>
            <label>
              Address:
              <input
                type="text"
                name="address"
                value={newTeacherData.address}
                onChange={handleAddChange}
              />
            </label>
            <label>
              Year Started:
              <input
                type="text"
                name="year_started"
                value={newTeacherData.year_started}
                onChange={handleAddChange}
              />
            </label>
            <label>
              Role: <span style={{ color: 'red' }}>*</span>
              <select
                name="role_name"
                value={newTeacherData.role_name}
                onChange={handleAddChange}
                required
              >
                <option value="">Select Role</option>
                {roles.map((role) => (
                  <option 
                    key={role.role_id} 
                    value={role.role_name}
                  >
                    {formatRoleName(role.role_name)}
                  </option>
                ))}
              </select>
            </label>
            <div className="section-button-group">
              <button 
                className="section-save-button" 
                onClick={saveNewTeacher}
              >
                Save
              </button>
              <button className="section-cancel-button" onClick={cancelAdding}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
      {showAssignSubjectModal && (
        <div className="teacher-modal">
        <div className="teacher-modal-content">
          <h2>Assign Subject</h2>
      
          {/* School Year Dropdown */}
          <div className="teacher-modal-school-year">
            <label htmlFor="schoolYear">Select School Year:</label>
            <select
              id="schoolYear"
              value={selectedSchoolYear}
              onChange={(e) => setSelectedSchoolYear(e.target.value)}
            >
              {schoolYears.map((year) => (
                <option key={year.school_year_id} value={year.school_year_id}>
                  {year.school_year}
                </option>
              ))}
            </select>
          </div>
      
          {/* Grade Level Buttons */}
          <div className="teacher-modal-grade-buttons">
            {[7, 8, 9, 10].map((grade) => (
              <button
                key={grade}
                className={`teacher-modal-grade-button ${selectedGradeLevelForSection === grade.toString() ? 'active' : ''}`}
                onClick={() => handleGradeLevelChangeForSection(grade.toString())}
              >
                Grade {grade}
              </button>
            ))}
          </div>
      
          {/* Sections List */}
          <div className="teacher-modal-sections-list">
            {sectionsByGrade.map((section, index) => (
              <div
                key={index}
                className={`teacher-modal-section-item ${selectedSection === section.section_id ? 'selected' : ''}`}
                onClick={() => setSelectedSection(section.section_id)}
              >
                {section.section_name}
              </div>
            ))}
          </div>
      
          {/* Subjects List */}
          <div className="teacher-modal-subjects-list">
            {subjectsByGrade.map((subject, index) => {
              const subjectId = subject.type === 'elective' ? `elective-${subject.subject_id}` : `subject-${subject.subject_id}`;
              return (
                <div
                  key={subjectId}
                  className={`teacher-modal-subject-item ${selectedSubject === subjectId ? 'selected' : ''}`}
                  onClick={() => setSelectedSubject(subjectId)}
                >
                  {subject.subject_name}
                </div>
              );
            })}
          </div>
      
          {/* Footer Actions */}
          <div className="teacher-modal-footer">
            <button
              className="teacher-modal-action-button teacher-modal-assign-button"
              onClick={handleSubjectAssignment}
              disabled={!selectedSubject}
            >
              Assign Subject
            </button>
            <button
              className="teacher-modal-action-button teacher-modal-cancel-button"
              onClick={() => {
                setShowAssignSubjectModal(false);
                setSelectedSubject('');
                setSelectedGradeLevel('7');
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
      
      )}
      {showAssignSectionModal && (
        <div className="teacher-modal">
          <div className="teacher-modal-content">
            <h2>Assign Section</h2>
            
            <div className="teacher-modal-school-year">
            <label htmlFor="schoolYear">Select School Year:</label>
            <select
              id="schoolYear"
              value={selectedSchoolYear}
              onChange={(e) => setSelectedSchoolYear(e.target.value)}
            >
              {schoolYears.map((year) => (
                <option key={year.school_year_id} value={year.school_year_id}>
                  {year.school_year}
                </option>
              ))}
            </select>
          </div>

            <div className="teacher-modal-grade-buttons">
              {[7, 8, 9, 10].map((grade) => (
                <button
                  key={grade}
                  className={`teacher-modal-grade-button ${selectedGradeLevelForSection === grade.toString() ? 'active' : ''}`}
                  onClick={() => handleGradeLevelChangeForSection(grade.toString())}
                >
                  Grade {grade}
                </button>
              ))}
            </div>

            <div className="teacher-modal-sections-list">
              {sectionsByGrade.map((section, index) => (
                <div 
                  key={index}
                  className={`teacher-modal-section-item ${selectedSection === section.section_id ? 'selected' : ''}`}
                  onClick={() => setSelectedSection(section.section_id)}
                >
                  {section.section_name}
                </div>
              ))}
            </div>

            <div className="teacher-modal-footer">
              <button 
                className={`teacher-modal-action-button teacher-modal-assign-button`}
                onClick={handleSectionAssignment}
                disabled={!selectedSection}
              >
                Assign Section
              </button>
              <button 
                className="teacher-modal-action-button teacher-modal-cancel-button"
                onClick={() => {
                  setShowAssignSectionModal(false);
                  setSelectedSection('');
                  setSelectedGradeLevelForSection('7');
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
      {showEditModal && (
        <div className="section-modal">
          <div className="section-modal-content">
            <h2>Edit Teacher</h2>
            <label>
              Lastname:
              <input
                type="text"
                name="lastname"
                value={editTeacherData.lastname}
                onChange={handleEditChange}
                required
              />
            </label>
            <label>
              Firstname:
              <input
                type="text"
                name="firstname"
                value={editTeacherData.firstname}
                onChange={handleEditChange}
                required
              />
            </label>
            <label>
              Middlename:
              <input
                type="text"
                name="middlename"
                value={editTeacherData.middlename}
                onChange={handleEditChange}
              />
            </label>
            <label>
              Contact Number:
              <input
                type="text"
                name="contact_number"
                value={editTeacherData.contact_number}
                onChange={handleEditChange}
              />
            </label>
            <label>
              Address:
              <input
                type="text"
                name="address"
                value={editTeacherData.address}
                onChange={handleEditChange}
              />
            </label>
            <label>
              Year Started:
              <input
                type="text"
                name="year_started"
                value={editTeacherData.year_started}
                onChange={handleEditChange}
              />
            </label>
            <label>
              Role:
              <select
                name="role_name"
                value={editTeacherData.role_name}
                onChange={handleEditChange}
                required
              >
                <option value="">Select Role</option>
                {roles.map((role) => (
                  <option 
                    key={role.role_id} 
                    value={role.role_name}
                  >
                    {formatRoleName(role.role_name)}
                  </option>
                ))}
              </select>
            </label>
            <div className="section-button-group">
              <button 
                className="section-save-button" 
                onClick={saveEditedTeacher}
              >
                Save Changes
              </button>
              <button 
                className="section-cancel-button" 
                onClick={() => setShowEditModal(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Registrar_TeacherPage;
