import React, { useState, useEffect } from 'react';
import SearchFilter from '../RoleSearchFilters/SearchFilter';
import axios from 'axios';
import Pagination from '../Utilities/pagination';
import '../TeacherPagesCss/AttendanceManagement.css';

function AttendanceManagement() {
  const [students, setStudents] = useState([]);
  const [filteredStudents, setFilteredStudents] = useState([]);
  const [selectedStudentId, setSelectedStudentId] = useState(null);
  const [attendanceData, setAttendanceData] = useState({});
  const [schoolYears, setSchoolYears] = useState([]);
  const [sections, setSections] = useState([]);
  const [filteredSections, setFilteredSections] = useState([]);
  const [filters, setFilters] = useState({
    searchTerm: '',
    grade: '',
    section: '',
    school_year: '',
  });
  const [currentPage, setCurrentPage] = useState(1);
  const studentsPerPage = 5;

  useEffect(() => {
    fetchStudents();
    fetchSchoolYears();
    fetchSections();
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
      setAttendanceData((prevData) => ({
        ...prevData,
        [studentId]: response.data,
      }));
    } catch (error) {
      console.error('There was an error fetching the attendance data!', error);
      setAttendanceData((prevData) => ({
        ...prevData,
        [studentId]: {
          grade_level: '-',
          school_year: '-',
          total_school_days: 0,
          days_present: 0,
          days_absent: 0,
          days_late: 0,
          brigada_attendance: 0
        },
      }));
    }
  };

  const handleStudentClick = async (studentId) => {
    if (!attendanceData[studentId]) {
      await fetchAttendanceData(studentId);
    }
    setSelectedStudentId(selectedStudentId === studentId ? null : studentId);
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

      <div className="attendance-mgmt-filters">
        <div className="attendance-mgmt-search">
          <input
            type="text"
            placeholder="Search by student name..."
            onChange={(e) => handleSearch(e.target.value)}
          />
        </div>
        <div className="attendance-mgmt-filters-group">
          <select
            value={filters.school_year}
            onChange={(e) => setFilters(prev => ({ ...prev, school_year: e.target.value }))}
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
            onChange={(e) => setFilters(prev => ({ ...prev, grade: e.target.value }))}
          >
            <option value="">Select Grade Level</option>
            {[7, 8, 9, 10].map((grade) => (
              <option key={grade} value={grade}>Grade {grade}</option>
            ))}
          </select>
          <select
            value={filters.section}
            onChange={(e) => setFilters(prev => ({ ...prev, section: e.target.value }))}
          >
            <option value="">Select Section</option>
            {filteredSections.map((section) => (
              <option key={section.section_id} value={section.section_name}>
                {section.section_name}
              </option>
            ))}
          </select>
        </div>
        <button onClick={handleApplyFilters}>Filter</button>
      </div>

      <div className="attendance-mgmt-table-container">
        <table className="attendance-mgmt-table">
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
                  <td>
                    <span className={`status-${student.active_status.toLowerCase()}`}>
                      {student.active_status.charAt(0).toUpperCase() + student.active_status.slice(1)}
                    </span>
                  </td>
                  <td>
                    <button
                      className="attendance-mgmt-btn attendance-mgmt-btn-view"
                      onClick={() => handleStudentClick(student.student_id)}
                    >
                      View
                    </button>
                  </td>
                </tr>
                {selectedStudentId === student.student_id && (
                  <tr>
                    <td colSpan="5">
                      <div className="attendance-details-container">
                        <div className="attendance-details-header">
                          <span>
                            Grade Level: {attendanceData[student.student_id]?.grade_level || '-'}
                          </span>
                          <span>
                            School Year: {attendanceData[student.student_id]?.school_year || '-'}
                          </span>
                        </div>
                        <table className="attendance-details-table">
                          <tbody>
                            <tr>
                              <th>Total School Days</th>
                              <td>{attendanceData[student.student_id]?.total_school_days || 0}</td>
                            </tr>
                            <tr>
                              <th>Total Days Present</th>
                              <td>{attendanceData[student.student_id]?.days_present || 0}</td>
                            </tr>
                            <tr>
                              <th>Total Days Absent</th>
                              <td>{attendanceData[student.student_id]?.days_absent || 0}</td>
                            </tr>
                            <tr>
                              <th>Total Days Late</th>
                              <td>{attendanceData[student.student_id]?.days_late || 0}</td>
                            </tr>
                            <tr>
                              <th>Brigada Attendance</th>
                              <td>{attendanceData[student.student_id]?.brigada_attendance || 0}</td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
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
