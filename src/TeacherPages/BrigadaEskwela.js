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
  const [schoolYears, setSchoolYears] = useState([]);
  const [sections, setSections] = useState([]);
  const [filteredSections, setFilteredSections] = useState([]);
  const [filters, setFilters] = useState({
    searchTerm: '',
    grade: '',
    section: '',
  });

  useEffect(() => {
    fetchStudents();
    fetchSchoolYears();
    fetchSections();
  }, []);

  useEffect(() => {
    if (filters.grade) {
      // Filter sections based on the selected grade level
      const sectionsForGrade = sections.filter(section => String(section.grade_level) === String(filters.grade));
      setFilteredSections(sectionsForGrade);
    } else {
      setFilteredSections(sections);
    }
  }, [filters.grade, sections]);

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

  const handleSearch = (searchTerm) => {
    setFilters((prevFilters) => ({ ...prevFilters, searchTerm }));
    applyFilters({ ...filters, searchTerm });
  };
  
  const handleFilterChange = (type, value) => {
    setFilters(prevFilters => ({
      ...prevFilters,
      [type]: value
    }));
  };
  
  const applyFilters = () => {
    let filtered = students;
  
    if (filters.school_year) {
      filtered = filtered.filter(student => String(student.school_year) === filters.school_year);
    }
    if (filters.grade) {
      filtered = filtered.filter(student => String(student.grade_lvl) === String(filters.grade));
    }
    if (filters.section) {
      filtered = filtered.filter(student => String(student.section_name) === String(filters.section));
    }
    if (filters.searchTerm) {
      filtered = filtered.filter(student =>
        student.stud_name.toLowerCase().includes(filters.searchTerm.toLowerCase())
      );
    }
  
    setFilteredStudents(filtered);
    setCurrentPage(1);
  };
  
  const handleApplyFilters = () => {
    console.log('Applying filters:', filters);
    applyFilters();
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
            value={filters.school_year}
            onChange={(e) => handleFilterChange('school_year', e.target.value)}
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
            {filteredSections.map((section) => (
              <option key={section.section_id} value={section.section_name}>
                {section.section_name}
              </option>
            ))}
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
