import React, { useState, useEffect } from 'react';
import axios from 'axios';
import EnrolledStudentsSearchFilter from '../RoleSearchFilters/EnrolledStudentsSearchFilter';
import Pagination from '../Utilities/pagination';
import '../CssPage/Principal_EnrolledStudentsPage.css';

function Registrar_EnrolledStudentsPage() {
  const [students, setStudents] = useState([]);
  const [filteredStudents, setFilteredStudents] = useState([]);
  const [totalEnrolledStudents, setTotalEnrolledStudents] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [studentsPerPage] = useState(5); // Adjust this number to set how many students per page
  const [filters, setFilters] = useState({
    searchTerm: '',
    grade: '',
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

  const handleSearch = (searchTerm) => {
    setFilters((prevFilters) => ({ ...prevFilters, searchTerm }));
    applyFilters({ ...filters, searchTerm });
  };

  const handleFilterChange = (type, value) => {
    setFilters((prevFilters) => ({ ...prevFilters, [type]: value }));
    applyFilters({ ...filters, [type]: value });
  };

  const applyFilters = (updatedFilters) => {
    let filtered = students;

    if (updatedFilters.grade) {
      filtered = filtered.filter((student) => student.grade_level === updatedFilters.grade);
    }
    if (updatedFilters.searchTerm) {
      filtered = filtered.filter((student) =>
        student.firstname.toLowerCase().includes(updatedFilters.searchTerm.toLowerCase()) ||
        student.lastname.toLowerCase().includes(updatedFilters.searchTerm.toLowerCase())
      );
    }

    setFilteredStudents(filtered);
    setCurrentPage(1); // Reset to the first page when filters are applied
  };

  // Pagination Logic
  const indexOfLastStudent = currentPage * studentsPerPage;
  const indexOfFirstStudent = indexOfLastStudent - studentsPerPage;
  const currentStudents = filteredStudents.slice(indexOfFirstStudent, indexOfLastStudent);

  const totalPages = Math.ceil(filteredStudents.length / studentsPerPage);

  const paginate = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  return (
    <div className="enrolled-students-container">
      <h1 className="enrolled-students-title">Enrolled Students</h1>
      <div className="enrolled-students-search-filter-container">
        <EnrolledStudentsSearchFilter
          handleSearch={handleSearch}
          handleFilter={handleFilterChange}
        />
      </div>
      <div className="enrolled-students-summary">
        <p>Total Enrolled Students: {totalEnrolledStudents}</p>
      </div>
      <table className="attendance-table">
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
                <td>{`${student.firstname} ${student.middlename} ${student.lastname}`}</td>
                <td>Grade {student.grade_level}</td>
                <td>{student.enrollment_status}</td>
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
      {/* Pagination Controls */}
      <Pagination
        totalItems={filteredStudents.length}
        itemsPerPage={studentsPerPage}
        currentPage={currentPage}
        onPageChange={paginate}
      />
    </div>
  );
}

export default Registrar_EnrolledStudentsPage;
