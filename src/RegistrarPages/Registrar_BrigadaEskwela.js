import React, { useEffect, useState } from 'react';
import axios from 'axios';
import SearchFilter from '../RoleSearchFilters/SearchFilter';
import Pagination from '../Utilities/pagination';
import '../RegistrarPagesCss/Registrar_BrigadaEskwela.css';

const BrigadaEskwela = () => {
  const [students, setStudents] = useState([]);
  const [filteredStudents, setFilteredStudents] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [studentsPerPage] = useState(5); // Adjust this number to set how many students per page
  const [filters, setFilters] = useState({
    searchTerm: '',
    grade: '',
    section: '',
  });

  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async (appliedFilters = {}) => {
    try {
      const response = await axios.get('http://localhost:3001/brigada-eskwela', {
        params: appliedFilters,
      });
      const sortedStudents = response.data.sort((a, b) =>
        a.stud_name.localeCompare(b.stud_name)
      );
      setStudents(sortedStudents);
      setFilteredStudents(sortedStudents);
    } catch (err) {
      console.error('Error fetching data:', err);
    }
  };

  const handleSearch = (searchTerm) => {
    setFilters((prev) => {
      const updatedFilters = { ...prev, searchTerm };
      applyFilters(updatedFilters);
      return updatedFilters;
    });
  };

  const handleFilterChange = (type, value) => {
    setFilters((prev) => {
      const updatedFilters = { ...prev, [type]: value };
      applyFilters(updatedFilters);
      return updatedFilters;
    });
  };

  const applyFilters = (updatedFilters) => {
    let filtered = students;

    // Filter by Grade Level
    if (updatedFilters.grade) {
      filtered = filtered.filter(
        (student) => student.grade_lvl === updatedFilters.grade
      );
    }

    // Filter by Section ID
    if (updatedFilters.section) {
      filtered = filtered.filter(
        (student) => String(student.section_id) === updatedFilters.section
      );
    }

    // Filter by Search Term
    if (updatedFilters.searchTerm) {
      filtered = filtered.filter((student) =>
        student.stud_name.toLowerCase().includes(updatedFilters.searchTerm.toLowerCase())
      );
    }

    setFilteredStudents(filtered);
    setCurrentPage(1); // Reset to the first page when filters are applied
  };

  const handleApplyFilters = () => {
    fetchStudents(filters);
  };

  const paginate = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  // Pagination Logic
  const indexOfLastStudent = currentPage * studentsPerPage;
  const indexOfFirstStudent = indexOfLastStudent - studentsPerPage;
  const currentStudents = filteredStudents.slice(indexOfFirstStudent, indexOfLastStudent);

  const totalPages = Math.ceil(filteredStudents.length / studentsPerPage);

  const goToNextPage = () => {
    if (currentPage < totalPages) setCurrentPage(currentPage + 1);
  };

  const goToPreviousPage = () => {
    if (currentPage > 1) setCurrentPage(currentPage - 1);
  };

  const goToPage = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  return (
    <div className="attendance-container">
      <h1 className="attendance-title">Brigada Eskwela</h1>
      <div className="attendance-search-filter-container">
        <SearchFilter
          handleSearch={handleSearch}
          handleFilter={handleFilterChange}
          handleApplyFilters={handleApplyFilters}
        />
      </div>
      <table className="attendance-table">
        <thead>
          <tr>
            <th>#</th>
            <th>Name</th>
            <th>Grade and Level</th>
            <th>Section</th>
            <th>Brigada Attendance</th>
          </tr>
        </thead>
        <tbody>
          {currentStudents.length > 0 ? (
            currentStudents.map((student, index) => (
              <tr key={index}>
                <td>{indexOfFirstStudent + index + 1}</td>
                <td>{student.stud_name}</td>
                <td>Grade {student.grade_lvl}</td>
                <td>{student.section_name}</td>
                <td>{student.brigada_attendance ? 'Yes' : 'No'}</td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="5" style={{ textAlign: 'center' }}>
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
};

export default BrigadaEskwela;
