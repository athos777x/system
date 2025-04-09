import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Pagination from '../Utilities/pagination';
import '../TeacherPagesCss/AttendanceManagement.css';
import StudentSearchFilter from '../RoleSearchFilters/StudentSearchFilter';

function AttendanceManagement() {
  const [students, setStudents] = useState([]);
  const [filteredStudents, setFilteredStudents] = useState([]);
  const [selectedStudentId, setSelectedStudentId] = useState(null);
  const [attendanceData, setAttendanceData] = useState([]);
  const [schoolYears, setSchoolYears] = useState([]);
  const [sections, setSections] = useState([]);
  const [filteredSections, setFilteredSections] = useState([]);
  const [sectionSubjects, setSectionSubjects] = useState([]);
  const [roleName, setRoleName] = useState('');
  const [filters, setFilters] = useState({
    searchTerm: '',
    grade: '',
    section: '',
    school_year: '',
  });
  const [currentPage, setCurrentPage] = useState(1);
  const studentsPerPage = 20;

  useEffect(() => {
    fetchSchoolYears();
    fetchSections();
  // Ensure roleName is available before calling fetchStudents
  if (roleName) {
    fetchStudents(roleName); // Pass roleName to fetchStudents
  }
}, [roleName]); // Depend on roleName to trigger re-fetching when roleName changes

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

  const fetchStudents = async (appliedFilters = {}) => {
    try {
      const userId = localStorage.getItem('userId'); // Retrieve userId from localStorage
      const filteredParams = { ...appliedFilters };
  
      if (userId) {
        filteredParams.user_id = userId; // Add user_id to the request parameters
      }
  
  
      const endpoint = roleName === 'subject_teacher'
        ? 'http://localhost:3001/students/by-teacher'
        : 'http://localhost:3001/students';
  
      const response = await axios.get(endpoint, {
        params: filteredParams,
      });
  
      const sortedStudents = response.data.sort((a, b) => b.lastName);
  
      const updatedStudents = sortedStudents.map(student => ({
        ...student,
        grade_level: student.current_yr_lvl || '-',
        brigada_attendance: student.brigada_eskwela === 'Attended' ? 'Yes' : 'No'
      }));
  
      setStudents(updatedStudents);
      setFilteredStudents(updatedStudents);
    } catch (error) {
      console.error('There was an error fetching the students!', error);
    }
  };
  



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

  const fetchAttendanceData = async (studentId) => {
    try {
      const response = await axios.get(`http://localhost:3001/attendance/${studentId}`);
      setAttendanceData(response.data);
    } catch (error) {
      console.error('There was an error fetching the attendance data!', error);
      setAttendanceData([]);
    }
  };

  const handleStudentClick = async (studentId, sectionId) => {
    try {
      if (selectedStudentId === studentId) {
        setSelectedStudentId(null);
        setAttendanceData([]);
      } else {
        setSelectedStudentId(studentId);
        
        // Fetch section schedules to get subjects
        const schedulesResponse = await axios.get(`http://localhost:3001/sections/${sectionId}/schedules`);
        const subjects = [...new Set(schedulesResponse.data.map(schedule => schedule.subject_name))];
        
        // Create mock attendance data for each subject
        const mockAttendanceData = subjects.map(subject => ({
          subject: subject,
          totalDaysPresent: Math.floor(Math.random() * 50) + 30, // Random number between 30-80
          totalDaysAbsent: Math.floor(Math.random() * 20), // Random number between 0-20
          totalDaysOfClasses: 80, // Fixed total days
        }));
        
        setAttendanceData(mockAttendanceData);
      }
    } catch (error) {
      console.error('Error fetching attendance data:', error);
    }
  };

  useEffect(() => {
    if (filters.grade) {
      // Filter sections based on the selected grade level
      const sectionsForGrade = sections.filter(section => String(section.grade_level) === String(filters.grade));
      setFilteredSections(sectionsForGrade);
    } else {
      setFilteredSections(sections);
    }
  }, [filters.grade, sections]);

  useEffect(() => {
    if (filters.searchTerm !== '') {
      applyFilters({ ...filters, searchTerm: filters.searchTerm });
    } else {
      applyFilters(filters);
    }
  }, [filters.searchTerm]);

  const applyFilters = (updatedFilters) => {
    let filtered = students;

    if (updatedFilters.searchTerm) {
      filtered = filtered.filter((student) =>
        `${student.firstname} ${student.middlename} ${student.lastname}`
          .toLowerCase()
          .includes(updatedFilters.searchTerm.toLowerCase())
      );
    }

    if (updatedFilters.grade) {
      filtered = filtered.filter((student) => student.current_yr_lvl === updatedFilters.grade);
    }

    if (updatedFilters.section) {
      filtered = filtered.filter((student) => student.section_name === updatedFilters.section);
    }

    if (filters.school_year) {
      filtered = filtered.filter(student => String(student.school_year) === filters.school_year);
    }

    setFilteredStudents(filtered);
    setCurrentPage(1);
  };

  const handleApplyFilters = () => {
    applyFilters(filters);
  };

  const handleSearch = (searchTerm) => {
    setFilters((prevFilters) => ({
      ...prevFilters,
      searchTerm,
    }));
  };

  const indexOfLastStudent = currentPage * studentsPerPage;
  const indexOfFirstStudent = indexOfLastStudent - studentsPerPage;
  const currentStudents = filteredStudents.slice(indexOfFirstStudent, indexOfLastStudent);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  return (
    <div className="attendance-mgmt-container">
      <div className="attendance-mgmt-header">
        <h1 className="attendance-mgmt-title">Attendance</h1>
      </div>

      <StudentSearchFilter
        students={students}
        fetchStudents={fetchStudents}
        setFilteredStudents={setFilteredStudents}
        setCurrentPage={setCurrentPage}
        schoolYears={schoolYears}
        filteredSections={filteredSections} 
        filters={filters}
        setFilters={setFilters}
      />

      <div className="attendance-mgmt-table-container">
        <table className="attendance-mgmt-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Name</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {currentStudents.map((student, index) => (
              <React.Fragment key={student.student_id}>
                <tr>
                  <td>{student.student_id}</td>
                  <td>
                    {student.stud_name}
                  </td>
                  <td>
                    <span className={`status-${student.active_status ? student.active_status.toLowerCase() : 'unknown'}`}>
                      {student.active_status ? (student.active_status.charAt(0).toUpperCase() + student.active_status.slice(1)) : 'Unknown'}
                    </span>
                  </td>
                  <td>
                    <button
                      className="attendance-mgmt-btn attendance-mgmt-btn-view"
                      onClick={() => handleStudentClick(student.student_id, student.section_id)}
                    >
                      View
                    </button>
                  </td>
                </tr>
                {selectedStudentId === student.student_id && (
                  <tr>
                    <td colSpan="4">
                      <div className="attendance-details-container">
                        <div className="attendance-details-header">
                          <span>
                            Grade Level: {student.grade_level}
                          </span>
                          <span>
                            Section: {student.section_name}
                          </span>
                          <span>
                            School Year: {student.school_year || '-'}
                          </span>
                          <span>
                            Brigada Attendance: {student.brigada_eskwela || 'Not Available'}
                          </span>
                        </div>
                        <table className="attendance-details-table">
                          <thead>
                            <tr>
                              <th>Subject</th>
                              <th>Total Days Present</th>
                              <th>Total Days Absent</th>
                              <th>Total Days of Classes</th>
                            </tr>
                          </thead>
                          <tbody>
                            {attendanceData.map((record, index) => (
                              <tr key={index}>
                                <td>{record.subject}</td>
                                <td>{record.totalDaysPresent}</td>
                                <td>{record.totalDaysAbsent}</td>
                                <td>{record.totalDaysOfClasses}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>

      <div className="attendance-mgmt-pagination">
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

export default AttendanceManagement;
