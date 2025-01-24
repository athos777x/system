import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import SearchFilter from '../RoleSearchFilters/SearchFilter';
import Pagination from '../Utilities/pagination';
import axios from 'axios';
import '../RegistrarPagesCss/Registrar_StudentsPage.css';

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
    setFilters(prevFilters => {
      const updatedFilters = { ...prevFilters, searchTerm };
      applyFilters(updatedFilters);
      return updatedFilters;
    });
  };

  const applyFilters = (updatedFilters) => {
    let filtered = teachers;
    if (updatedFilters.searchTerm) {
      filtered = filtered.filter(teacher =>
        teacher.firstname.toLowerCase().includes(updatedFilters.searchTerm.toLowerCase()) ||
        teacher.lastname.toLowerCase().includes(updatedFilters.searchTerm.toLowerCase())
      );
    }
    setFilteredTeachers(filtered);
    setCurrentPage(1); // Reset to the first page when filters are applied
  };

  const handleApplyFilters = () => {
    console.log('Applying filters:', filters);
    fetchTeachers(filters);
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

  const toggleTeacherDetails = (teacherId) => {
    setSelectedTeacherId(selectedTeacherId === teacherId ? null : teacherId);
  };

  const formatDate = (isoString) => {
    const date = new Date(isoString);
    return date.toLocaleDateString();
  };

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
    if (!selectedSubject || !selectedGradeLevel) {
      alert('Please select both a subject and grade level');
      return;
    }

    try {
      console.log('Assigning subject with:', {
        teacherId: currentTeacherId,
        subject: selectedSubject,
        gradeLevel: selectedGradeLevel
      });

      const response = await axios.post(`http://localhost:3001/assign-subject/${currentTeacherId}`, {
        subject_name: selectedSubject,
        grade_level: selectedGradeLevel
      });

      if (response.status === 200) {
        alert('Subject assigned successfully');
        setShowAssignSubjectModal(false);
        setSelectedSubject('');
        setSelectedGradeLevel('7');
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
    if (!selectedSection || !selectedGradeLevelForSection) {
      alert('Please select both a section and grade level');
      return;
    }

    try {
      console.log('Assigning section with:', {
        teacherId: currentTeacherId,
        section: selectedSection,
        gradeLevel: selectedGradeLevelForSection
      });

      const response = await axios.post(`http://localhost:3001/assign-section/${currentTeacherId}`, {
        section_name: selectedSection,
        grade_level: selectedGradeLevelForSection
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
      setTeacherSubjects(response.data);
    } catch (error) {
      console.error('Error fetching teacher subjects:', error);
    }
  };

  const fetchTeacherSection = async (teacherId) => {
    try {
      const response = await axios.get(`http://localhost:3001/teacher-section/${teacherId}`);
      setTeacherSection(response.data);
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
      if (roleId === 3) {
        fetchTeacherSubjects(teacherId);
      }
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

  return (
    <div className="students-container">
      <h1 className="students-title">Employees</h1>
      <div className="students-search-filter-container">
        <SearchFilter
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
                </td>
              </tr>

              {selectedTeacherId === teacher.employee_id && (
                <tr className="teacher-details-row">
                  <td colSpan="4">
                    <div className="teacher-details-container">
                      <table className="teacher-details-table">
                        <tbody>
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

                      {teacher.role_id === 3 && (
                        <div className="assigned-subjects">
                          <h3>Assigned Subjects</h3>
                          {teacherSubjects.length > 0 ? (
                            <table className="subjects-table">
                              <thead>
                                <tr>
                                  <th>Grade Level</th>
                                  <th>Subject Name</th>
                                </tr>
                              </thead>
                              <tbody>
                                {teacherSubjects.map((subject, index) => (
                                  <tr key={index}>
                                    <td>Grade {subject.grade_level}</td>
                                    <td>{subject.subject_name}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          ) : (
                            <p>No subjects assigned yet</p>
                          )}
                        </div>
                      )}

                      {teacher.role_id === 4 && (
                        <div className="assigned-section">
                          <h3>Assigned Section</h3>
                          {teacherSection ? (
                            <table className="section-table">
                              <thead>
                                <tr>
                                  <th>Grade Level</th>
                                  <th>Section Name</th>
                                </tr>
                              </thead>
                              <tbody>
                                <tr>
                                  <td>Grade {teacherSection.grade_level}</td>
                                  <td>{teacherSection.section_name}</td>
                                </tr>
                              </tbody>
                            </table>
                          ) : (
                            <p>No section assigned yet</p>
                          )}
                        </div>
                      )}

                      <div className="action-buttons">
                        {teacher.role_id === 3 && (
                          <button 
                            className="assign-button"
                            onClick={() => handleAssignSubject(teacher.employee_id)}
                          >
                            Assign Subject
                          </button>
                        )}
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
        <div className="section-modal">
          <div className="section-modal-content">
            <h2>Assign Subject</h2>
            
            <div className="grade-buttons">
              {[7, 8, 9, 10].map((grade) => (
                <button
                  key={grade}
                  className={`grade-button ${selectedGradeLevel === grade.toString() ? 'active' : ''}`}
                  onClick={() => handleGradeLevelChange(grade.toString())}
                >
                  Grade {grade}
                </button>
              ))}
            </div>

            <div className="subjects-list">
              {subjectsByGrade.map((subject, index) => (
                <div 
                  key={index}
                  className={`subject-item ${selectedSubject === subject.subject_name ? 'selected' : ''}`}
                  onClick={() => setSelectedSubject(subject.subject_name)}
                >
                  {subject.subject_name}
                </div>
              ))}
            </div>

            <div className="modal-footer">
              <button 
                className="assign-button"
                onClick={handleSubjectAssignment}
                disabled={!selectedSubject}
              >
                Assign Subject
              </button>
              <button 
                className="cancel-button"
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
        <div className="section-modal">
          <div className="section-modal-content">
            <h2>Assign Section</h2>
            
            <div className="grade-buttons">
              {[7, 8, 9, 10].map((grade) => (
                <button
                  key={grade}
                  className={`grade-button ${selectedGradeLevelForSection === grade.toString() ? 'active' : ''}`}
                  onClick={() => handleGradeLevelChangeForSection(grade.toString())}
                >
                  Grade {grade}
                </button>
              ))}
            </div>

            <div className="sections-list">
              {sectionsByGrade.map((section, index) => (
                <div 
                  key={index}
                  className={`subject-item ${selectedSection === section.section_name ? 'selected' : ''}`}
                  onClick={() => setSelectedSection(section.section_name)}
                >
                  {section.section_name}
                </div>
              ))}
            </div>

            <div className="modal-footer">
              <button 
                className="assign-button"
                onClick={handleSectionAssignment}
                disabled={!selectedSection}
              >
                Assign Section
              </button>
              <button 
                className="cancel-button"
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
    </div>
  );
}

export default Registrar_TeacherPage;
