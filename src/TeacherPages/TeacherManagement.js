import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Pagination from '../Utilities/pagination';
import axios from 'axios';
import '../TeacherPagesCss/TeacherManagement.css';
import EmployeeSearchFilter from '../RoleSearchFilters/EmployeeSearchFilter';

function TeacherManagement() {
  const [teachers, setTeachers] = useState([]);
  const [filteredTeachers, setFilteredTeachers] = useState([]);
  const [selectedTeacherId, setSelectedTeacherId] = useState(null);
  const [studentsPerPage] = useState(20); // Adjust this number to set how many students per page
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
    role_id: '',
    status: 'active'
  });
  const [selectedSubjectsSchoolYear, setSelectedSubjectsSchoolYear] = useState('');

  const navigate = useNavigate();

  useEffect(() => {
    console.log('Component mounted');
    fetchRoles();
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
    applyFilters(filters);
  };

  const applyFilters = (appliedFilters) => {
    let filtered = teachers;
  
    if (appliedFilters.searchID) {
      filtered = filtered.filter(teacher => (teacher.employee_id) === appliedFilters.employee_id);
    }

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
  

  const handleApplyFilters = (filters) => {
    console.log('Applying filters:', filters);
  
    // ✅ Check if all filters are empty
    const hasFilters = Object.values(filters).some(value => value !== '');
  
    if (hasFilters) {
      fetchTeachers(filters); // ✅ Fetch teachers if filters are applied
    } else {
      setFilteredTeachers([]); // ✅ Clear the list if no filters are applied
    }
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

      if (name === 'contact_number') {
        // Only allow digits and limit to 11 characters
        const digitsOnly = value.replace(/\D/g, '').slice(0, 11);
        updates[name] = digitsOnly;
      }

      if (name === 'year_started') {
        // Only allow digits and limit to 4 characters
        const digitsOnly = value.replace(/\D/g, '').slice(0, 4);
        updates[name] = digitsOnly;
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
    if (!/^\d{4}$/.test(newTeacherData.year_started)) {
      alert('Year started must be exactly 4 digits');
      return false;
    }

    // Add validation for year range
    const currentYear = new Date().getFullYear();
    const yearStarted = parseInt(newTeacherData.year_started);
    if (yearStarted < 1962 || yearStarted > currentYear) {
      alert(`Year started must be between 1962 and ${currentYear}`);
      return false;
    }

    if (!newTeacherData.birthday) {
      alert('Please enter birthday');
      return false;
    }
    if (!newTeacherData.gender) {
      alert('Please select gender');
      return false;
    }
    if (!newTeacherData.contact_number.trim()) {
      alert('Please enter contact number');
      return false;
    }
    if (!/^\d{11}$/.test(newTeacherData.contact_number.trim())) {
      alert('Contact number must be exactly 11 digits');
      return false;
    }
    if (!newTeacherData.address.trim()) {
      alert('Please enter address');
      return false;
    }

    // Calculate age
    const today = new Date();
    const birthDate = new Date(newTeacherData.birthday);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }

    if (age < 25) {
      alert('Employee must be at least 25 years old');
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
  

  const fetchTeacherSubjects = async (teacherId, schoolYearId) => {
    try {
      const response = await axios.get(`http://localhost:3001/teacher-subjects/${teacherId}`, {
        params: { school_year_id: schoolYearId }
      });
      setTeacherSubjects(response.data);
    } catch (error) {
      console.error('Error fetching teacher subjects:', error);
    }
  };
  
  const fetchTeacherSection = async (teacherId, schoolYearId) => {
    try {
      const response = await axios.get(`http://localhost:3001/teacher-section/${teacherId}`, {
        params: { school_year_id: schoolYearId }
      });
      setTeacherSection(response.data);
    } catch (error) {
      console.error('Error fetching teacher sections:', error);
    }
  };
  
  

  
  const handleViewDetails = (teacherId, roleId) => {
    if (selectedTeacherId === teacherId) {
      setSelectedTeacherId(null);
      setTeacherSubjects([]);
      setTeacherSection(null);
    } else {
      setSelectedTeacherId(teacherId);
      // Find active school year and set it as default
      const activeYear = schoolYears.find(year => year.status === 'active');
      if (activeYear) {
        setSelectedSubjectsSchoolYear(activeYear.school_year_id);
        fetchTeacherSubjects(teacherId, activeYear.school_year_id);
      } else {
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

      if (name === 'contact_number') {
        // Only allow digits and limit to 11 characters
        const digitsOnly = value.replace(/\D/g, '').slice(0, 11);
        updates[name] = digitsOnly;
      }

      if (name === 'year_started') {
        // Only allow digits and limit to 4 characters
        const digitsOnly = value.replace(/\D/g, '').slice(0, 4);
        updates[name] = digitsOnly;
      }
      
      return updates;
    });
  };

  const saveEditedTeacher = async () => {
    try {
      // Add validation for required fields
      if (!editTeacherData.address.trim()) {
        alert('Please enter address');
        return;
      }

      // Add validation for year started
      const currentYear = new Date().getFullYear();
      const yearStarted = parseInt(editTeacherData.year_started);
      if (yearStarted < 1962 || yearStarted > currentYear) {
        alert(`Year started must be between 1962 and ${currentYear}`);
        return;
      }

      // Create a copy of editTeacherData without emp_name
      const { emp_name, ...updateData } = editTeacherData;
      
      const response = await axios.put(`http://localhost:3001/employees/${editTeacherData.employee_id}`, updateData);
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

  const handleSubjectsSchoolYearChange = (schoolYearId) => {
    setSelectedSubjectsSchoolYear(schoolYearId);
    fetchTeacherSubjects(selectedTeacherId, schoolYearId);
  };

  return (
    <div className="teacher-mgmt-container">
      <div className="teacher-mgmt-header">
        <h1 className="teacher-mgmt-title">Employee Management</h1>
        {(roleName === 'registrar' || roleName === 'principal') && (
          <button className="teacher-mgmt-btn teacher-mgmt-btn-view" onClick={startAdding}>
            Add New Employee
          </button>
        )}
      </div>

      <EmployeeSearchFilter handleApplyFilters={handleApplyFilters} />

      <div className="teacher-mgmt-table-container">
        <table className="teacher-mgmt-table">
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
                  <td>{teacher.employee_id}</td>
                  <td>{teacher.emp_name}</td>
                  <td>
                    <span className={`status-${teacher.status.toLowerCase()}`}>
                      {teacher.status.charAt(0).toUpperCase() + teacher.status.slice(1)}
                    </span>
                  </td>
                  <td>
                    <div className="teacher-mgmt-actions">
                      <button 
                        className="teacher-mgmt-btn teacher-mgmt-btn-view"
                        onClick={() => handleViewDetails(teacher.employee_id, teacher.role_id)}
                      >
                        View
                      </button>
                      {(roleName === 'registrar' || roleName === 'principal') && teacher.status === 'active' && (
                        <button 
                          className="teacher-mgmt-btn teacher-mgmt-btn-edit"
                          onClick={() => handleEditClick(teacher)}
                        >
                          Edit
                        </button>
                      )}
                    </div>
                  </td>
                </tr>

                {selectedTeacherId === teacher.employee_id && (
                  <tr className="teacher-mgmt-details">
                    <td colSpan="4">
                      <div className="teacher-mgmt-details-content">
                        <div className="teacher-mgmt-details-section">
                          <h3 style={{ margin: '0 0 1rem 0', textAlign: 'left' }}>Personal Information</h3>
                          <table className="teacher-mgmt-details-table">
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
                                <th>Role:</th>
                                <td>{formatRoleName(teacher.role_name)}</td>
                              </tr>
                              <tr>
                                <th>Status:</th>
                                <td>
                                  <span className={`status-${teacher.status.toLowerCase()}`}>
                                    {teacher.status.charAt(0).toUpperCase() + teacher.status.slice(1)}
                                  </span>
                                </td>
                              </tr>
                            </tbody>
                          </table>
                        </div>

                        <div className="teacher-mgmt-details-section">
                          <div style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            marginBottom: '1rem'
                          }}>
                            <h3 style={{ margin: 0 }}>Assigned Subjects</h3>
                            <select
                              value={selectedSubjectsSchoolYear}
                              onChange={(e) => handleSubjectsSchoolYearChange(e.target.value)}
                              style={{
                                padding: '5px',
                                width: '150px'
                              }}
                            >
                              {schoolYears.map((year) => (
                                <option key={year.school_year_id} value={year.school_year_id}>
                                  {year.school_year}
                                </option>
                              ))}
                            </select>
                          </div>
                          {teacherSubjects.length > 0 ? (
                            <table className="teacher-mgmt-details-table">
                              <thead>
                                <tr>
                                  <th>Grade Level</th>
                                  <th>Subject Name</th>
                                  <th>Section</th>
                                  <th>Day</th>
                                  <th>Time</th>
                                </tr>
                              </thead>
                              <tbody>
                                {teacherSubjects.map((subject, index) => (
                                  <tr key={index}>
                                    <td>{subject.grade_level}</td>
                                    <td>{subject.subject_name}</td>
                                    <td>{subject.section_name}</td>
                                    <td>{subject.day || 'Not set'}</td>
                                    <td>{subject.time || 'Not set'}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          ) : (
                            <p>No subjects assigned yet</p>
                          )}

                          {teacher.role_id === 4 && (
                            <>
                              <h3>Assigned Section</h3>
                              {teacherSection && teacherSection.length > 0 ? (
                                <table className="teacher-mgmt-details-table">
                                  <thead>
                                    <tr>
                                      <th>Grade Level</th>
                                      <th>Section Name</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {teacherSection.map((section, index) => (
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
                            </>
                          )}
                        </div>

                        <div className="teacher-mgmt-details-actions">
                          {teacher.role_id === 4 && (
                            <button 
                              className="teacher-mgmt-btn teacher-mgmt-btn-view"
                              onClick={() => handleAssignSection(teacher.employee_id)}
                            >
                              Assign Section
                            </button>
                          )}
                          {/* <button 
                              className="teacher-mgmt-btn teacher-mgmt-btn-view"
                              onClick={() => handleAssignSubject(teacher.employee_id)}
                            >
                              Assign Subject
                          </button> */}
                          <button 
                            className="teacher-mgmt-btn teacher-mgmt-btn-archive"
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
      </div>

      <Pagination
        totalItems={filteredTeachers.length}
        itemsPerPage={studentsPerPage}
        currentPage={currentPage}
        onPageChange={paginate}
      />

      {showArchiveModal && (
        <div className="teacher-mgmt-modal">
          <div className="teacher-mgmt-modal-content">
            <h2>Archive Employee</h2>
            <div className="teacher-mgmt-form-group">
              <label>Archive Status:</label>
              <select
                value={archiveStatus}
                onChange={(e) => setArchiveStatus(e.target.value)}
                required
              >
                <option value="">Select Status</option>
                <option value="resigned">Resigned</option>
                <option value="retired">Retired</option>
              </select>
            </div>
            <div className="teacher-mgmt-details-actions">
              <button
                className="teacher-mgmt-btn teacher-mgmt-btn-archive"
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
              <button 
                className="teacher-mgmt-btn teacher-mgmt-btn-view"
                onClick={closeArchiveModal}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {showModal && (
        <div className="teacher-mgmt-modal">
          <div className="teacher-mgmt-modal-content">
            <h2>Add New Employee</h2>
            <div className="teacher-mgmt-form-grid">
              <div className="teacher-mgmt-form-group">
                <label>Last Name: <span style={{ color: 'red' }}>*</span></label>
                <input
                  type="text"
                  name="lastname"
                  value={newTeacherData.lastname}
                  onChange={handleAddChange}
                  required
                />
              </div>
              <div className="teacher-mgmt-form-group">
                <label>First Name: <span style={{ color: 'red' }}>*</span></label>
                <input
                  type="text"
                  name="firstname"
                  value={newTeacherData.firstname}
                  onChange={handleAddChange}
                  required
                />
              </div>
              <div className="teacher-mgmt-form-group">
                <label>Middle Name:</label>
                <input
                  type="text"
                  name="middlename"
                  value={newTeacherData.middlename}
                  onChange={handleAddChange}
                />
              </div>
              <div className="teacher-mgmt-form-group">
                <label>Birthday: <span style={{ color: 'red' }}>*</span></label>
                <input
                  type="date"
                  name="birthday"
                  value={newTeacherData.birthday}
                  onChange={handleAddChange}
                  max={(() => {
                    const today = new Date();
                    const maxDate = new Date();
                    maxDate.setFullYear(today.getFullYear() - 25);
                    return maxDate.toISOString().split('T')[0];
                  })()}
                  required
                />
              </div>
              <div className="teacher-mgmt-form-group">
                <label>Gender: <span style={{ color: 'red' }}>*</span></label>
                <select
                  name="gender"
                  value={newTeacherData.gender}
                  onChange={handleAddChange}
                  required
                >
                  <option value="">Select Gender</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                </select>
              </div>
              <div className="teacher-mgmt-form-group">
                <label>Contact Number: <span style={{ color: 'red' }}>*</span></label>
                <input
                  type="text"
                  name="contact_number"
                  value={newTeacherData.contact_number}
                  onChange={handleAddChange}
                  pattern="[0-9]{11}"
                  title="Please enter exactly 11 digits"
                  maxLength="11"
                  required
                />
              </div>
              <div className="teacher-mgmt-form-group">
                <label>Address: <span style={{ color: 'red' }}>*</span></label>
                <input
                  type="text"
                  name="address"
                  value={newTeacherData.address}
                  onChange={handleAddChange}
                  required
                />
              </div>
              <div className="teacher-mgmt-form-group">
                <label>Year Started: <span style={{ color: 'red' }}>*</span></label>
                <input
                  type="text"
                  name="year_started"
                  value={newTeacherData.year_started}
                  onChange={handleAddChange}
                  pattern="[0-9]{4}"
                  title={`Please enter a year between 1962 and ${new Date().getFullYear()}`}
                  maxLength="4"
                  required
                />
              </div>
              <div className="teacher-mgmt-form-group">
                <label>Role: <span style={{ color: 'red' }}>*</span></label>
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
              </div>
            </div>
            <div className="teacher-mgmt-details-actions">
              <button 
                className="teacher-mgmt-btn teacher-mgmt-btn-view"
                onClick={saveNewTeacher}
              >
                Save
              </button>
              <button 
                className="teacher-mgmt-btn teacher-mgmt-btn-archive"
                onClick={cancelAdding}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {showAssignSectionModal && (
        <div className="teacher-mgmt-modal">
          <div className="teacher-mgmt-modal-content" style={{ maxWidth: '600px' }}>
            <div style={{ marginBottom: '20px' }}>
              <h2 style={{ margin: 0, color: '#2e7d32' }}>Assign Section</h2>
            </div>

            <div className="teacher-mgmt-form-group" style={{ marginBottom: '20px' }}>
              <label style={{ 
                fontWeight: 'bold', 
                marginBottom: '8px', 
                display: 'block',
                color: '#2e7d32'
              }}>School Year:</label>
              <select
                value={selectedSchoolYear}
                onChange={(e) => setSelectedSchoolYear(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px',
                  borderRadius: '4px',
                  border: '1px solid #ddd',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  color: '#1e293b',
                  backgroundColor: '#fff'
                }}
                onMouseOver={(e) => e.target.style.borderColor = '#81c784'}
                onMouseOut={(e) => e.target.style.borderColor = '#ddd'}
                onFocus={(e) => {
                  e.target.style.outline = 'none';
                  e.target.style.borderColor = '#4CAF50';
                  e.target.style.boxShadow = '0 0 0 3px rgba(76, 175, 80, 0.1)';
                }}
                onBlur={(e) => {
                  e.target.style.boxShadow = 'none';
                  e.target.style.borderColor = '#ddd';
                }}
              >
                {schoolYears.map((year) => (
                  <option key={year.school_year_id} value={year.school_year_id}>
                    {year.school_year}
                  </option>
                ))}
              </select>
            </div>

            <div className="teacher-mgmt-form-group" style={{ marginBottom: '20px' }}>
              <label style={{ 
                fontWeight: 'bold', 
                marginBottom: '8px', 
                display: 'block',
                color: '#2e7d32'
              }}>Grade Level:</label>
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(4, 1fr)', 
                gap: '10px',
                marginBottom: '20px'
              }}>
                {[7, 8, 9, 10].map((grade) => (
                  <button
                    key={grade}
                    className={`teacher-mgmt-btn ${selectedGradeLevelForSection === grade.toString() ? 'teacher-mgmt-btn-view' : ''}`}
                    onClick={() => handleGradeLevelChangeForSection(grade.toString())}
                    style={{
                      padding: '10px',
                      borderRadius: '4px',
                      border: '1px solid #ddd',
                      background: selectedGradeLevelForSection === grade.toString() ? '#4CAF50' : '#fff',
                      color: selectedGradeLevelForSection === grade.toString() ? '#fff' : '#1e293b',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      fontWeight: '500'
                    }}
                    onMouseOver={(e) => {
                      if (selectedGradeLevelForSection !== grade.toString()) {
                        e.target.style.borderColor = '#81c784';
                        e.target.style.backgroundColor = '#f1f8e9';
                      }
                    }}
                    onMouseOut={(e) => {
                      if (selectedGradeLevelForSection !== grade.toString()) {
                        e.target.style.borderColor = '#ddd';
                        e.target.style.backgroundColor = '#fff';
                      }
                    }}
                  >
                    Grade {grade}
                  </button>
                ))}
              </div>
            </div>

            <div className="teacher-mgmt-form-group" style={{ marginBottom: '20px' }}>
              <label style={{ 
                fontWeight: 'bold', 
                marginBottom: '8px', 
                display: 'block',
                color: '#2e7d32'
              }}>Available Sections:</label>
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', 
                gap: '10px',
                maxHeight: '200px',
                overflowY: 'auto',
                padding: '10px',
                border: '1px solid #ddd',
                borderRadius: '4px',
                backgroundColor: '#fff'
              }}>
                {sectionsByGrade.length > 0 ? (
                  sectionsByGrade.map((section) => (
                    <button 
                      key={section.section_id}
                      className={`teacher-mgmt-btn ${selectedSection === section.section_id ? 'teacher-mgmt-btn-view' : ''}`}
                      onClick={() => setSelectedSection(section.section_id)}
                      style={{
                        padding: '10px',
                        borderRadius: '4px',
                        border: '1px solid #ddd',
                        background: selectedSection === section.section_id ? '#4CAF50' : '#fff',
                        color: selectedSection === section.section_id ? '#fff' : '#1e293b',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        fontWeight: '500'
                      }}
                      onMouseOver={(e) => {
                        if (selectedSection !== section.section_id) {
                          e.target.style.borderColor = '#81c784';
                          e.target.style.backgroundColor = '#f1f8e9';
                        }
                      }}
                      onMouseOut={(e) => {
                        if (selectedSection !== section.section_id) {
                          e.target.style.borderColor = '#ddd';
                          e.target.style.backgroundColor = '#fff';
                        }
                      }}
                    >
                      {section.section_name}
                    </button>
                  ))
                ) : (
                  <div style={{ 
                    gridColumn: '1/-1', 
                    textAlign: 'center', 
                    padding: '20px',
                    color: '#666'
                  }}>
                    No sections available for this grade level
                  </div>
                )}
              </div>
            </div>

            <div style={{ 
              display: 'flex', 
              justifyContent: 'flex-end', 
              gap: '10px',
              marginTop: '20px',
              borderTop: '1px solid #ddd',
              paddingTop: '20px'
            }}>
              <button 
                className="teacher-mgmt-btn teacher-mgmt-btn-view"
                onClick={handleSectionAssignment}
                disabled={!selectedSection}
                style={{
                  padding: '10px 20px',
                  minWidth: '100px',
                  opacity: !selectedSection ? '0.6' : '1',
                  cursor: !selectedSection ? 'not-allowed' : 'pointer',
                  transition: 'all 0.2s ease'
                }}
              >
                Assign Section
              </button>
              <button 
                className="teacher-mgmt-btn teacher-mgmt-btn-archive"
                onClick={() => {
                  setShowAssignSectionModal(false);
                  setSelectedSection('');
                  setSelectedGradeLevelForSection('7');
                }}
                style={{
                  padding: '10px 20px',
                  minWidth: '100px',
                  transition: 'all 0.2s ease'
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* {showAssignSubjectModal && (
        <div className="teacher-mgmt-modal">
          <div className="teacher-mgmt-modal-content">
            <h2>Assign Subject</h2>

            <div className="teacher-mgmt-form-group">
              <label>Grade Level:</label>
              <div className="teacher-mgmt-grade-buttons">
                {[7, 8, 9, 10].map((grade) => (
                  <button
                    key={grade}
                    className={`teacher-mgmt-btn ${selectedGradeLevelForSection === grade.toString() ? 'teacher-mgmt-btn-view' : ''}`}
                    onClick={() => handleGradeLevelChangeForSection(grade.toString())}
                  >
                    Grade {grade}
                  </button>
                ))}
              </div>
            </div>

            <div className="teacher-mgmt-form-group">
              <label>Available Sections:</label>
              <div className="teacher-mgmt-sections-grid">
                {sectionsByGrade.map((section) => (
                  <button
                    key={section.section_id}
                    className={`teacher-mgmt-btn ${selectedSection === section.section_id ? 'teacher-mgmt-btn-view' : ''}`}
                    onClick={() => setSelectedSection(section.section_id)}
                  >
                    {section.section_name}
                  </button>
                ))}
              </div>
            </div>

            <div className="teacher-mgmt-form-group">
              <label>Available Subjects:</label>
              <div className="teacher-mgmt-sections-grid">
                {subjectsByGrade.map((subject) => {
                  const subjectId = `${subject.type}-${subject.subject_id}`;
                  return (
                    <button
                      key={subjectId} // Ensure unique keys
                      className={`teacher-mgmt-btn ${selectedSubject === subjectId ? 'teacher-mgmt-btn-view' : ''}`}
                      onClick={() => setSelectedSubject(subjectId)}
                    >
                      {subject.subject_name}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="teacher-mgmt-details-actions">
              <button 
                className="teacher-mgmt-btn teacher-mgmt-btn-view"
                onClick={handleSubjectAssignment}
                disabled={!selectedSection || !selectedSubject}
              >
                Assign Subject
              </button>
              <button 
                className="teacher-mgmt-btn teacher-mgmt-btn-archive"
                onClick={() => setShowAssignSubjectModal(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )} */}

      {showEditModal && (
        <div className="teacher-mgmt-modal">
          <div className="teacher-mgmt-modal-content">
            <h2>Edit Teacher</h2>
            <div className="teacher-mgmt-form-grid">
              <div className="teacher-mgmt-form-group">
                <label>Last Name: <span style={{ color: 'red' }}>*</span></label>
                <input
                  type="text"
                  name="lastname"
                  value={editTeacherData.lastname}
                  onChange={handleEditChange}
                  required
                />
              </div>
              <div className="teacher-mgmt-form-group">
                <label>First Name: <span style={{ color: 'red' }}>*</span></label>
                <input
                  type="text"
                  name="firstname"
                  value={editTeacherData.firstname}
                  onChange={handleEditChange}
                  required
                />
              </div>
              <div className="teacher-mgmt-form-group">
                <label>Middle Name:</label>
                <input
                  type="text"
                  name="middlename"
                  value={editTeacherData.middlename}
                  onChange={handleEditChange}
                />
              </div>
              <div className="teacher-mgmt-form-group">
                <label>Contact Number: <span style={{ color: 'red' }}>*</span></label>
                <input
                  type="text"
                  name="contact_number"
                  value={editTeacherData.contact_number}
                  onChange={handleEditChange}
                  pattern="[0-9]{11}"
                  title="Please enter exactly 11 digits"
                  maxLength="11"
                  required
                />
              </div>
              <div className="teacher-mgmt-form-group">
                <label>Address: <span style={{ color: 'red' }}>*</span></label>
                <input
                  type="text"
                  name="address"
                  value={editTeacherData.address}
                  onChange={handleEditChange}
                  required
                />
              </div>
              <div className="teacher-mgmt-form-group">
                <label>Year Started: <span style={{ color: 'red' }}>*</span></label>
                <input
                  type="text"
                  name="year_started"
                  value={editTeacherData.year_started}
                  onChange={handleEditChange}
                  pattern="[0-9]{4}"
                  title={`Please enter a year between 1962 and ${new Date().getFullYear()}`}
                  maxLength="4"
                  required
                />
              </div>
              <div className="teacher-mgmt-form-group">
                <label>Role: <span style={{ color: 'red' }}>*</span></label>
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
              </div>
              <div className="teacher-mgmt-form-group">
                <label>Status: <span style={{ color: 'red' }}>*</span></label>
                <select
                  name="status"
                  value={editTeacherData.status}
                  onChange={handleEditChange}
                  required
                >
                  <option value="active">Active</option>
                  <option value="resigned">Resigned</option>
                  <option value="retired">Retired</option>
                </select>
              </div>
            </div>
            <div className="teacher-mgmt-details-actions">
              <button 
                className="teacher-mgmt-btn teacher-mgmt-btn-view"
                onClick={saveEditedTeacher}
              >
                Save Changes
              </button>
              <button 
                className="teacher-mgmt-btn teacher-mgmt-btn-archive"
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

export default TeacherManagement;
