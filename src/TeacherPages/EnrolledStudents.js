import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import Pagination from '../Utilities/pagination';
import '../TeacherPagesCss/EnrolledStudents.css';

function EnrolledStudents() {
  const [students, setStudents] = useState([]);
  const [filteredStudents, setFilteredStudents] = useState([]);
  const [totalEnrolledStudents, setTotalEnrolledStudents] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [studentsPerPage] = useState(20);
  const [selectedStudentId, setSelectedStudentId] = useState(null);
  const [studentSchedules, setStudentSchedules] = useState([]);
  const [currentSchoolYear, setCurrentSchoolYear] = useState('');
  const [currentSchoolYearId, setCurrentSchoolYearId] = useState(null);
  const [roleName, setRoleName] = useState('');
  const [coordinatorGradeLevel, setCoordinatorGradeLevel] = useState(null);
  const [filters, setFilters] = useState({
    searchTerm: '',
    grade: ''
  });
  const [sections, setSections] = useState([]);
  const [showSectionModal, setShowSectionModal] = useState(false);
  const [selectedSection, setSelectedSection] = useState('');
  const [studentToEdit, setStudentToEdit] = useState(null);

  useEffect(() => {
    const userId = localStorage.getItem('userId'); // Retrieve userId from localStorage
    if (userId) {
      console.log(`Retrieved userId from localStorage: ${userId}`); // Debugging log
      fetchUserRole(userId);
    } else {
      console.error('No userId found in localStorage');
    }
    fetchCurrentSchoolYear();
    fetchSections(); // Fetch sections on component mount
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

  const fetchSections = async () => {
    try {
      console.log("Fetching sections for school year ID:", currentSchoolYearId);
      const response = await axios.get('http://localhost:3001/sections', {
        params: { school_year_id: currentSchoolYearId }
      });
      console.log("Sections data received:", response.data);
      setSections(response.data);
    } catch (error) {
      console.error('Error fetching sections:', error);
    }
  };

  useEffect(() => {
    if (currentSchoolYearId) {
      fetchSections();
    }
  }, [currentSchoolYearId]);

  useEffect(() => {
    if (currentSchoolYearId) {
        fetchStudents();
    }
  }, [currentSchoolYearId]); 

  // Refetch students when coordinator's grade level changes
  useEffect(() => {
    if (coordinatorGradeLevel && currentSchoolYearId) {
      fetchStudents();
    }
  }, [coordinatorGradeLevel, currentSchoolYearId]);

  const fetchCurrentSchoolYear = async () => {
    try {
        const response = await axios.get('http://localhost:3001/current-school-year');
        setCurrentSchoolYear(response.data.school_year);
        setCurrentSchoolYearId(response.data.school_year_id); // Store school_year_id
    } catch (error) {
        console.error('Error fetching current school year:', error);
    }
  };

  const fetchStudents = useCallback(async (appliedFilters = {}) => {
    if (!currentSchoolYearId) {
        console.warn("No school_year_id available yet. Fetching students skipped.");
        return;
    }

    try {
        // Add include_section=true to ensure we get section info
        const queryParams = { 
          ...appliedFilters, 
          school_year_id: currentSchoolYearId,
          include_section: true,
          preserve_data: true // Add flag to indicate we want to preserve all fields 
        }; 
        console.log("Fetching students with params:", queryParams); // Debugging

        const response = await axios.get('http://localhost:3001/enrolled-students', {
            params: queryParams,
        });

        let studentsData = response.data.filter(
            (student) => student.enrollment_status === 'active'
        );
        
        // Log detailed data about sections
        console.log("Students data received:", studentsData.map(student => ({
          id: student.student_id,
          name: student.stud_name,
          section_id: student.section_id,
          section_name: student.section_name,
          enrollment_id: student.enrollment_id
        })));
        
        // For grade level coordinators, filter the students by their assigned grade level
        if (roleName === 'grade_level_coordinator' && coordinatorGradeLevel) {
          console.log('Filtering students for grade level coordinator. Grade level:', coordinatorGradeLevel);
          studentsData = studentsData.filter(student => 
            student.grade_level.toString() === coordinatorGradeLevel.toString()
          );
        }
        
        setStudents(studentsData);
        setFilteredStudents(studentsData);
        setTotalEnrolledStudents(studentsData.length);
    } catch (error) {
        console.error('There was an error fetching the students!', error);
    }
  }, [currentSchoolYearId, roleName, coordinatorGradeLevel]);

  const handleSearch = (event) => {
    const searchTerm = event.target.value;
    setFilters(prev => ({ ...prev, searchTerm }));
    applyFilters({ ...filters, searchTerm });
  };

  const handleGradeChange = (event) => {
    const grade = event.target.value;
    setFilters(prev => ({ ...prev, grade }));
  };

  const applyFilters = () => {
    let filtered = students;

    if (filters.grade) {
      filtered = filtered.filter(student => String(student.grade_level) === String(filters.grade));
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
    setCurrentPage(1);
  };

  const handleChangeSectionClick = (student) => {
    console.log("Student data:", student);
    console.log("All sections:", sections);
    console.log("Student grade level:", student.grade_level, "type:", typeof student.grade_level);
    console.log("Filtered sections:", sections.filter(section => 
      String(section.grade_level) === String(student.grade_level)
    ));
    
    setStudentToEdit(student);
    setSelectedSection(student.section_id || '');
    setShowSectionModal(true);
  };

  const handleSectionChange = (e) => {
    setSelectedSection(e.target.value);
  };

  const updateStudentSection = async () => {
    if (!studentToEdit || !selectedSection) {
      alert('Please select a section');
      return;
    }

    try {
      const response = await axios.put(`http://localhost:3001/students/${studentToEdit.student_id}`, {
        section_id: selectedSection
      });

      if (response.status === 200) {
        console.log('Update response:', response.data);
        
        // Update the student in the local state with the updated data
        if (response.data.student_data) {
          setStudents(prevStudents => 
            prevStudents.map(student => 
              student.student_id === studentToEdit.student_id 
                ? { ...student, 
                    section_id: selectedSection,
                    section_name: sections.find(s => s.section_id === parseInt(selectedSection))?.section_name || 'Unknown'
                  }
                : student
            )
          );
          
          // Also update filtered students
          setFilteredStudents(prevStudents => 
            prevStudents.map(student => 
              student.student_id === studentToEdit.student_id 
                ? { ...student, 
                    section_id: selectedSection,
                    section_name: sections.find(s => s.section_id === parseInt(selectedSection))?.section_name || 'Unknown'
                  }
                : student
            )
          );
        } else {
          // If no student data in response, do a full refresh
          await fetchStudents();
        }
        
        setShowSectionModal(false);
        alert('Student section updated successfully');
      } else {
        alert('Failed to update student section');
      }
    } catch (error) {
      console.error('Error updating student section:', error);
      alert('Error updating student section');
    }
  };

  const handleViewClick = async (studentId) => {
    if (selectedStudentId === studentId) {
      setSelectedStudentId(null);
      setStudentSchedules([]);
    } else {
      // Find the student in our currentStudents array
      const studentDetails = currentStudents.find(s => s.student_id === studentId);
      console.log("Selected student details:", studentDetails);
      
      setSelectedStudentId(studentId);
      await fetchStudentSchedules(studentId);
    }
  };

  const fetchStudentSchedules = async (studentId) => {
    try {
      // Find the full student data from our collection
      const studentData = students.find(s => s.student_id === studentId);
      console.log("Full student data for schedules:", studentData);
      
      const response = await axios.get(`http://localhost:3001/students/${studentId}/schedules`);
      
      // Process the schedule data to handle multiple days
      const processedSchedules = response.data.map(schedule => {
        let days;
        try {
          days = typeof schedule.day === 'string' ? 
            (schedule.day.startsWith('[') ? JSON.parse(schedule.day) : [schedule.day]) : 
            Array.isArray(schedule.day) ? schedule.day : [schedule.day];
        } catch (error) {
          console.error('Error parsing days:', error);
          days = [schedule.day];
        }
        return {
          ...schedule,
          day: days
        };
      });
      
      setStudentSchedules(processedSchedules);
    } catch (error) {
      console.error('Error fetching student schedules:', error);
    }
  };

  const indexOfLastStudent = currentPage * studentsPerPage;
  const indexOfFirstStudent = indexOfLastStudent - studentsPerPage;
  const currentStudents = filteredStudents.slice(indexOfFirstStudent, indexOfLastStudent);

  const paginate = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  return (
    <div className="enrolled-students-container">
      <div className="enrolled-students-header">
        <h1 className="enrolled-students-title">Enrolled Students</h1>
      </div>

      <div className="enrolled-students-filters">
        <div className="enrolled-students-search">
          <input
            type="text"
            placeholder="Search by student name..."
            value={filters.searchTerm}
            onChange={handleSearch}
          />
        </div>
        <div className="enrolled-students-filters-group">
          <select
            className="enrolled-students-select"
            value={filters.grade}
            onChange={handleGradeChange}
            disabled={roleName === 'grade_level_coordinator'}
          >
            <option value="">Select Grade Level</option>
            {roleName === 'grade_level_coordinator' && coordinatorGradeLevel ? (
              <option value={coordinatorGradeLevel}>Grade {coordinatorGradeLevel}</option>
            ) : (
              [7, 8, 9, 10].map((grade) => (
                <option key={grade} value={grade}>Grade {grade}</option>
              ))
            )}
          </select>
          <button onClick={applyFilters}>Filter</button>
        </div>
      </div>

      <div className="enrolled-students-info">
        <div className="enrolled-students-school-year">
          <span className="school-year-label">School Year:</span>
          <span className="school-year-value">{currentSchoolYear}</span>
        </div>
        <div className="enrolled-students-count">
          <span>Total Enrolled Students: {totalEnrolledStudents}</span>
        </div>
      </div>

      <div className="enrolled-students-table-container">
        <table className="enrolled-students-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Name</th>
              <th>Enrollment Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {currentStudents.length > 0 ? (
              currentStudents.map((student, index) => (
                <React.Fragment key={student.student_id}>
                  <tr>
                    <td>{index + 1 + (currentPage - 1) * studentsPerPage}</td>
                    <td>{student.stud_name}</td>
                    <td>
                      <span className="status-active">
                        {student.enrollment_status.charAt(0).toUpperCase() + student.enrollment_status.slice(1)}
                      </span>
                    </td>
                    <td>
                      <button 
                        className="enrolled-students-btn enrolled-students-btn-view"
                        onClick={() => handleViewClick(student.student_id)}
                      >
                        View
                      </button>
                      {(roleName === 'class_adviser' || roleName === 'registrar' || roleName === 'grade_level_coordinator') && (
                        <button
                          className="enrolled-students-btn enrolled-students-btn-view"
                          onClick={() => handleChangeSectionClick(student)}
                        >
                          Change Section
                        </button>
                      )}
                    </td>
                  </tr>
                  {selectedStudentId === student.student_id && (
                    <tr>
                      <td colSpan="4">
                        <div className="enrolled-students-schedule">
                          <h3>Class Schedule</h3>
                          <div className="enrolled-students-student-info">
                            <p><strong>Grade Level:</strong> {student.grade_level}</p>
                            <p>
                              <strong>Section:</strong> {student.section_name || 'Not Assigned'}
                            </p>
                          </div>
                          <table className="enrolled-students-schedule-table">
                            <thead>
                              <tr>
                                <th>Subject</th>
                                <th>Time Start</th>
                                <th>Time End</th>
                                <th>Day</th>
                                <th>Teacher</th>
                                <th>Status</th>
                              </tr>
                            </thead>
                            <tbody>
                              {studentSchedules.length > 0 ? (
                                studentSchedules.map((schedule, idx) => (
                                  <tr key={idx}>
                                    <td>{schedule.subject_name}</td>
                                    <td>{schedule.time_start}</td>
                                    <td>{schedule.time_end}</td>
                                    <td>{Array.isArray(schedule.day) ? schedule.day.join(', ') : schedule.day}</td>
                                    <td>{schedule.teacher_name}</td>
                                    <td>
                                      <span className={`status-${schedule.schedule_status?.toLowerCase().replace(' ', '-')}`}>
                                        {schedule.schedule_status}
                                      </span>
                                    </td>
                                  </tr>
                                ))
                              ) : (
                                <tr>
                                  <td colSpan="6" style={{ textAlign: 'center' }}>
                                    No schedule available
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
              ))
            ) : (
              <tr>
                <td colSpan="4" style={{ textAlign: 'center' }}>
                  No students found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="enrolled-students-pagination">
        <Pagination
          totalItems={filteredStudents.length}
          itemsPerPage={studentsPerPage}
          currentPage={currentPage}
          onPageChange={paginate}
        />
      </div>

      {showSectionModal && (
        <div className="enrolled-students-modal">
          <div className="enrolled-students-modal-content">
            <h2>Change Section</h2>
            <p>Select a new section for {studentToEdit?.stud_name}:</p>
            
            <select
              className="enrolled-students-select"
              value={selectedSection}
              onChange={handleSectionChange}
            >
              <option value="">Select Section</option>
              {sections
                .filter((section) => String(section.grade_level) === String(studentToEdit?.grade_level))
                .map((section) => (
                  <option key={section.section_id} value={section.section_id}>
                    {section.section_name}
                  </option>
                ))}
            </select>
            
            <div className="enrolled-students-modal-actions">
              <button 
                className="enrolled-students-btn enrolled-students-btn-save"
                onClick={updateStudentSection}
              >
                Save
              </button>
              <button 
                className="enrolled-students-btn enrolled-students-btn-cancel"
                onClick={() => setShowSectionModal(false)}
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

export default EnrolledStudents;
