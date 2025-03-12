import React, { useEffect, useState } from 'react';
import axios from 'axios';
import SearchFilter from '../RoleSearchFilters/SearchFilter';
import Pagination from '../Utilities/pagination';
import '../TeacherPagesCss/BrigadaEskwela.css';

function BrigadaEskwela() {
  const [students, setStudents] = useState([]);
  const [filteredStudents, setFilteredStudents] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [studentsPerPage] = useState(20);
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

    if (updatedFilters.grade) {
      filtered = filtered.filter(
        (student) => student.grade_lvl === updatedFilters.grade
      );
    }

    if (updatedFilters.section) {
      filtered = filtered.filter(
        (student) => String(student.section_id) === updatedFilters.section
      );
    }

    if (updatedFilters.searchTerm) {
      filtered = filtered.filter((student) =>
        student.stud_name.toLowerCase().includes(updatedFilters.searchTerm.toLowerCase())
      );
    }

    setFilteredStudents(filtered);
    setCurrentPage(1);
  };

  const handleApplyFilters = () => {
    fetchStudents(filters);
  };

  const paginate = (pageNumber) => setCurrentPage(pageNumber);
  const indexOfLastStudent = currentPage * studentsPerPage;
  const indexOfFirstStudent = indexOfLastStudent - studentsPerPage;
  const currentStudents = filteredStudents.slice(indexOfFirstStudent, indexOfLastStudent);

  return (
    <div className="brigada-container">
      <div className="brigada-header">
        <h1 className="brigada-title">Brigada Eskwela</h1>
      </div>

      <div className="brigada-filters">
        <div className="brigada-search">
          <input
            type="text"
            placeholder="Search by student name..."
            onChange={(e) => handleSearch(e.target.value)}
          />
        </div>
        <div className="brigada-filters-group">
          <select
            value={filters.grade}
            onChange={(e) => handleFilterChange('grade', e.target.value)}
          >
            <option value="">Select Grade Level</option>
            {[7, 8, 9, 10].map((grade) => (
              <option key={grade} value={grade}>Grade {grade}</option>
            ))}
          </select>
          <select
            value={filters.section}
            onChange={(e) => handleFilterChange('section', e.target.value)}
          >
            <option value="">Select Section</option>
            {/* Section options will be populated from your data */}
          </select>
        </div>
        <button onClick={handleApplyFilters}>Filter</button>
      </div>

      <div className="brigada-table-container">
        <table className="brigada-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Name</th>
              <th>Grade Level</th>
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
                  <td>
                    <span className={student.brigada_attendance ? 'status-yes' : 'status-no'}>
                      {student.brigada_attendance ? 'Yes' : 'No'}
                    </span>
                  </td>
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
      </div>

      <div className="brigada-pagination">
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

export default BrigadaEskwela;
