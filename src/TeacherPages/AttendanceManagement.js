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
  const [coordinatorGradeLevel, setCoordinatorGradeLevel] = useState(null);
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
    if (coordinatorGradeLevel) {
      // When coordinator's grade level is set, fetch students with the grade level filter applied
      fetchStudents({ grade: coordinatorGradeLevel.toString() });
    }
  }, [coordinatorGradeLevel]);

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
        
        // If user is a grade level coordinator, fetch their assigned grade level
        if (response.data.role_name === 'grade_level_coordinator') {
          fetchCoordinatorGradeLevel(userId);
        }
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
  
  const fetchCoordinatorGradeLevel = async (userId) => {
    try {
      const response = await axios.get(`http://localhost:3001/coordinator-grade-level/${userId}`);
      if (response.status === 200 && response.data.gradeLevel) {
        console.log('Coordinator grade level:', response.data.gradeLevel);
        setCoordinatorGradeLevel(response.data.gradeLevel);
        // Auto-set the grade filter to the coordinator's assigned grade level
        setFilters(prev => ({ ...prev, grade: response.data.gradeLevel.toString() }));
      }
    } catch (error) {
      console.error('Error fetching coordinator grade level:', error);
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
        : 'http://localhost:3001/students/active';
  
      const response = await axios.get(endpoint, {
        params: filteredParams,
      });
  
      const sortedStudents = response.data.sort((a, b) => b.lastName);
  
      let updatedStudents = sortedStudents.map(student => ({
        ...student,
        grade_level: student.current_yr_lvl || '-',
        brigada_attendance: student.brigada_eskwela === 'Attended' ? 'Yes' : 'No'
      }));
      
      // For grade level coordinators, filter the students by their assigned grade level
      if (roleName === 'grade_level_coordinator' && coordinatorGradeLevel) {
        updatedStudents = updatedStudents.filter(student => 
          student.current_yr_lvl.toString() === coordinatorGradeLevel.toString()
        );
      }
  
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
        
        // Get current school year ID if it's set in filters
        const schoolYearId = filters.school_year || null;
        
        // Fetch real attendance data from the database
        const attendanceResponse = await axios.get(
          `http://localhost:3001/student-attendance-summary/${studentId}${schoolYearId ? `?schoolYearId=${schoolYearId}` : ''}`
        );
        
        console.log('Attendance data received:', attendanceResponse.data);
        
        if (attendanceResponse.data && attendanceResponse.data.length > 0) {
          setAttendanceData(attendanceResponse.data);
        } else {
          console.log('No attendance data found, fetching subjects for section');
          
          // If no attendance data, still get the subjects list from schedules
          const schedulesResponse = await axios.get(`http://localhost:3001/sections/${sectionId}/schedules`);
          const subjects = [...new Set(schedulesResponse.data.map(schedule => schedule.subject_name))];
          
          // Create empty records for each subject
          const emptyAttendanceData = subjects.map(subject => ({
            subject: subject,
            totalDaysPresent: 0,
            totalDaysAbsent: 0,
            totalDaysOfClasses: 0
          }));
          
          setAttendanceData(emptyAttendanceData);
        }
      }
    } catch (error) {
      console.error('Error fetching attendance data:', error);
      setAttendanceData([]);
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
    if (coordinatorGradeLevel && sections.length > 0) {
      // When coordinator's grade level is set, filter sections by that grade level
      const sectionsForGrade = sections.filter(section => 
        String(section.grade_level) === String(coordinatorGradeLevel)
      );
      setFilteredSections(sectionsForGrade);
    }
  }, [coordinatorGradeLevel, sections]);

  useEffect(() => {
    if (filters.searchTerm !== '') {
      applyFilters({ ...filters, searchTerm: filters.searchTerm });
    } else {
      applyFilters(filters);
    }
  }, [filters.searchTerm]);

  const applyFilters = (updatedFilters) => {
    let filtered = students;

    // For grade level coordinators, enforce their assigned grade level filter regardless of other filters
    if (roleName === 'grade_level_coordinator' && coordinatorGradeLevel) {
      filtered = filtered.filter((student) => student.current_yr_lvl.toString() === coordinatorGradeLevel.toString());
    }

    if (updatedFilters.searchTerm) {
      filtered = filtered.filter((student) =>
        `${student.firstname} ${student.middlename} ${student.lastname}`
          .toLowerCase()
          .includes(updatedFilters.searchTerm.toLowerCase())
      );
    }

    // Only apply grade filter if not a coordinator (coordinators already filtered by their grade level)
    if (updatedFilters.grade && !(roleName === 'grade_level_coordinator' && coordinatorGradeLevel)) {
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
        coordinatorGradeLevel={coordinatorGradeLevel}
        roleName={roleName}
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
                            
                            {attendanceData.length === 0 && (
                              <tr>
                                <td colSpan="4" style={{ textAlign: 'center', padding: '20px' }}>
                                  No attendance records found
                                </td>
                              </tr>
                            )}
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
