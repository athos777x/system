import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Pagination from '../Utilities/pagination';
import '../RegistrarPagesCss/EnrolledStudentsManagement.css';

function Registrar_EnrolledStudentsPage() {
  const [students, setStudents] = useState([]);
  const [filteredStudents, setFilteredStudents] = useState([]);
  const [totalEnrolledStudents, setTotalEnrolledStudents] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [studentsPerPage] = useState(5);
  const [filters, setFilters] = useState({
    searchTerm: '',
    grade: ''
  });

  useEffect(() => {
    fetchStudents();
  }, []);

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

      <div className="enrolled-students-summary">
        <p>Total Enrolled Students: {totalEnrolledStudents}</p>
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
        </div>
        <button onClick={applyFilters}>Filter</button>
      </div>

      <div className="enrolled-students-table-container">
        <table className="enrolled-students-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Name</th>
              <th>Grade Level</th>
              <th>Enrollment Status</th>
            </tr>
          </thead>
          <tbody>
            {currentStudents.length > 0 ? (
              currentStudents.map((student, index) => (
                <tr key={student.student_id}>
                  <td>{index + 1 + (currentPage - 1) * studentsPerPage}</td>
                  <td>{`${student.firstname} ${student.middlename || ''} ${student.lastname}`}</td>
                  <td>Grade {student.grade_level}</td>
                  <td>
                    <span className="status-active">
                      {student.enrollment_status.charAt(0).toUpperCase() + student.enrollment_status.slice(1)}
                    </span>
                  </td>
                </tr>
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

export default Registrar_EnrolledStudentsPage;
