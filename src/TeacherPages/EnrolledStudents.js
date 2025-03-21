import React, { useState, useEffect } from 'react';
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
  const [filters, setFilters] = useState({
    searchTerm: '',
    grade: ''
  });

  useEffect(() => {
    fetchCurrentSchoolYear();
    fetchStudents();
  }, []);

  const fetchCurrentSchoolYear = async () => {
    try {
      const response = await axios.get('http://localhost:3001/current-school-year');
      setCurrentSchoolYear(response.data.school_year);
    } catch (error) {
      console.error('Error fetching current school year:', error);
    }
  };

  const fetchStudents = async (appliedFilters = {}) => {
    try {
      const response = await axios.get('http://localhost:3001/enrolled-students', {
        params: appliedFilters,
      });
      const activeStudents = response.data.filter(
        (student) => student.enrollment_status === 'active'
      );
      setStudents(activeStudents);
      setFilteredStudents(activeStudents);
      setTotalEnrolledStudents(activeStudents.length);
    } catch (error) {
      console.error('There was an error fetching the students!', error);
    }
  };

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

  const handleViewClick = async (studentId) => {
    if (selectedStudentId === studentId) {
      setSelectedStudentId(null);
      setStudentSchedules([]);
    } else {
      setSelectedStudentId(studentId);
      await fetchStudentSchedules(studentId);
    }
  };

  const fetchStudentSchedules = async (studentId) => {
    try {
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
          >
            <option value="">Select Grade Level</option>
            {[7, 8, 9, 10].map((grade) => (
              <option key={grade} value={grade}>Grade {grade}</option>
            ))}
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
                    </td>
                  </tr>
                  {selectedStudentId === student.student_id && (
                    <tr>
                      <td colSpan="4">
                        <div className="enrolled-students-schedule">
                          <h3>Class Schedule</h3>
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
    </div>
  );
}

export default EnrolledStudents;
