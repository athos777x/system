import React, { useState, useEffect } from 'react';
import SearchFilter from '../RoleSearchFilters/SearchFilter';
import axios from 'axios';
import Pagination from '../Utilities/pagination';
import '../CssPage/Principal_AttendancePage.css';

function Registrar_AttendancePage() {
  const [students, setStudents] = useState([]);
  const [filteredStudents, setFilteredStudents] = useState([]);
  const [selectedStudentId, setSelectedStudentId] = useState(null);
  const [attendanceData, setAttendanceData] = useState({});
  const [filters, setFilters] = useState({
    searchTerm: '',
    grade: '',
    section: '',
    school_year: '',
  });
  const [currentPage, setCurrentPage] = useState(1);
  const studentsPerPage = 5; // Number of rows per page

  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async (appliedFilters = {}) => {
    try {
      const response = await axios.get('http://localhost:3001/students', {
        params: appliedFilters,
      });
      const sortedStudents = response.data.sort((a, b) =>
        a.firstname.localeCompare(b.firstname)
      );
      setStudents(sortedStudents);
      setFilteredStudents(sortedStudents);
    } catch (error) {
      console.error('There was an error fetching the students!', error);
    }
  };

  const fetchAttendanceData = async (studentId) => {
    try {
      const response = await axios.get(`http://localhost:3001/attendance/${studentId}`);
      setAttendanceData((prevData) => ({
        ...prevData,
        [studentId]: response.data,
      }));
    } catch (error) {
      console.error('There was an error fetching the attendance data!', error);
    }
  };

  const handleStudentClick = async (studentId) => {
    if (!attendanceData[studentId]) {
      await fetchAttendanceData(studentId);
    }
    setSelectedStudentId(selectedStudentId === studentId ? null : studentId);
  };

  // Auto-apply search filter
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
    setCurrentPage(1); // Reset to the first page when filters are applied
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

  // Pagination logic
  const indexOfLastStudent = currentPage * studentsPerPage;
  const indexOfFirstStudent = indexOfLastStudent - studentsPerPage;
  const currentStudents = filteredStudents.slice(indexOfFirstStudent, indexOfLastStudent);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  return (
    <div className="attendance-container">
      <h1 className="attendance-title">Attendance</h1>
      <div className="attendance-search-filter-container">
        <SearchFilter
          handleSearch={handleSearch}
          handleFilter={(type, value) =>
            setFilters((prevFilters) => ({
              ...prevFilters,
              [type]: value,
            }))
          }
          handleApplyFilters={handleApplyFilters}
        />
      </div>

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
                <td>{indexOfFirstStudent + index + 1}</td>
                <td>
                  {student.firstname} {student.middlename} {student.lastname}
                </td>
                <td>Grade {student.current_yr_lvl}</td>
                <td>{student.active_status}</td>
                <td>
                  <button
                    className="attendance-view-button"
                    onClick={() => handleStudentClick(student.student_id)}
                  >
                    View
                  </button>
                </td>
              </tr>
              {selectedStudentId === student.student_id &&
                attendanceData[student.student_id] && (
                  <tr>
                    <td colSpan="5">
                      <table className="attendance-details-table">
                        <thead>
                          <tr>
                            <th colSpan="2">
                              <div className="attendance-details-header">
                                <span>
                                  Grade Level:{' '}
                                  {attendanceData[student.student_id].grade_level}
                                </span>
                                <span>
                                  School Year:{' '}
                                  {attendanceData[student.student_id].school_year}
                                </span>
                              </div>
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr>
                            <th>Total School Days</th>
                            <td>{attendanceData[student.student_id].total_school_days}</td>
                          </tr>
                          <tr>
                            <th>Total Days Present</th>
                            <td>{attendanceData[student.student_id].days_present}</td>
                          </tr>
                          <tr>
                            <th>Total Days Absent</th>
                            <td>{attendanceData[student.student_id].days_absent}</td>
                          </tr>
                          <tr>
                            <th>Total Days Late</th>
                            <td>{attendanceData[student.student_id].days_late}</td>
                          </tr>
                          <tr>
                            <th>Brigada Attendance</th>
                            <td>{attendanceData[student.student_id].brigada_attendance}</td>
                          </tr>
                        </tbody>
                      </table>
                    </td>
                  </tr>
                )}
            </React.Fragment>
          ))}
          {currentStudents.length === 0 && (
            <tr>
              <td colSpan="5" style={{ textAlign: 'center' }}>
                No students found.
              </td>
            </tr>
          )}
        </tbody>
      </table>

      <Pagination
        totalItems={filteredStudents.length}
        itemsPerPage={studentsPerPage}
        currentPage={currentPage}
        onPageChange={paginate}
      />
    </div>
  );
}

export default Registrar_AttendancePage;
