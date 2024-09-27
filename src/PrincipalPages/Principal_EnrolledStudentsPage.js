import React, { useState, useEffect } from 'react';
import axios from 'axios';
import EnrolledStudentsSearchFilter from '../RoleSearchFilters/EnrolledStudentsSearchFilter';
import '../CssPage/Principal_EnrolledStudentsPage.css';

function Principal_EnrolledStudentsPage() {
  const [students, setStudents] = useState([]);
  const [filteredStudents, setFilteredStudents] = useState([]);
  const [totalEnrolledStudents, setTotalEnrolledStudents] = useState(0);
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
        params: appliedFilters
      });
      console.log('API Response:', response.data); // Log the API response
      const activeStudents = response.data.filter(student => student.enrollment_status === 'active');
      setStudents(activeStudents);
      setFilteredStudents(activeStudents);
      setTotalEnrolledStudents(activeStudents.length);
      console.log('Active students:', activeStudents);
    } catch (error) {
      console.error('There was an error fetching the students!', error);
    }
  };

  const handleSearch = (searchTerm) => {
    setFilters(prevFilters => ({ ...prevFilters, searchTerm }));
  };

  const handleFilterChange = (type, value) => {
    setFilters(prevFilters => ({ ...prevFilters, [type]: value }));
  };

  const applyFilters = () => {
    let filtered = students;

    if (filters.grade) {
      filtered = filtered.filter(student => student.grade_level === filters.grade);
    }
    if (filters.searchTerm) {
      filtered = filtered.filter(student =>
        student.firstname.toLowerCase().includes(filters.searchTerm.toLowerCase()) ||
        student.lastname.toLowerCase().includes(filters.searchTerm.toLowerCase())
      );
    }

    setFilteredStudents(filtered);
    console.log('Filtered students:', filtered);
  };

  const handleApplyFilters = () => {
    console.log('Applying filters:', filters);
    applyFilters();
  };

  return (
    <div className="enrolled-students-container">
      <h1 className="enrolled-students-title">Enrolled Students</h1>
      <div className="enrolled-students-search-filter-container">
        <EnrolledStudentsSearchFilter
          handleSearch={handleSearch}
          handleFilter={handleFilterChange}
          handleApplyFilters={handleApplyFilters}
        />
      </div>
      <div className="enrolled-students-summary">
        <p>Total Enrolled Students: {totalEnrolledStudents}</p>
      </div>
      <ul className="enrolled-students-list">
        {filteredStudents.map((student, index) => (
          <li key={student.student_id} className="enrolled-student-item-container">
            <div className="enrolled-student-item">
              <p className="enrolled-student-name">{index + 1}. {student.firstname} {student.middlename} {student.lastname}</p>
              <p className="enrolled-student-info">Grade {student.grade_level} - {student.enrollment_status}</p>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default Principal_EnrolledStudentsPage;
