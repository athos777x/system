import React, { useState, useEffect } from 'react';
import SearchFilter from '../RoleSearchFilters/SearchFilter';
import axios from 'axios';
import '../CssPage/Principal_GradesPage.css';

function Principal_GradesPage() {
  const [students, setStudents] = useState([]);
  const [filteredStudents, setFilteredStudents] = useState([]);
  const [selectedStudentId, setSelectedStudentId] = useState(null);
  const [grades, setGrades] = useState([]);
  const [filters, setFilters] = useState({
    searchTerm: '',
    grade: '',
    section: '',
    school_year: ''
  });

  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async (appliedFilters = {}) => {
    try {
      const response = await axios.get('http://localhost:3001/students', {
        params: appliedFilters
      });
      const sortedStudents = response.data.sort((a, b) => a.firstname.localeCompare(b.firstname));
      setStudents(sortedStudents);
      setFilteredStudents(sortedStudents);
      console.log('Fetched students:', sortedStudents);
    } catch (error) {
      console.error('There was an error fetching the students!', error);
    }
  };

  const handleSearch = (searchTerm) => {
    setFilters(prevFilters => {
      const updatedFilters = { ...prevFilters, searchTerm };
      applyFilters(updatedFilters);
      return updatedFilters;
    });
  };

  const handleFilterChange = (type, value) => {
    setFilters(prevFilters => {
      const updatedFilters = { ...prevFilters, [type]: value };
      return updatedFilters;
    });
  };

  const applyFilters = (updatedFilters) => {
    let filtered = students;

    if (updatedFilters.school_year) {
      filtered = filtered.filter(student => String(student.school_year) === updatedFilters.school_year);
    }
    if (updatedFilters.grade) {
      filtered = filtered.filter(student => student.current_yr_lvl === updatedFilters.grade);
    }
    if (updatedFilters.section) {
      filtered = filtered.filter(student => student.section_id == updatedFilters.section);
    }
    if (updatedFilters.searchTerm) {
      filtered = filtered.filter(student =>
        student.firstname.toLowerCase().includes(updatedFilters.searchTerm.toLowerCase()) ||
        student.lastname.toLowerCase().includes(updatedFilters.searchTerm.toLowerCase())
      );
    }

    setFilteredStudents(filtered);
    console.log('Filtered students:', filtered);
  };

  const handleApplyFilters = () => {
    console.log('Applying filters:', filters);
    fetchStudents(filters);
  };

  const handleStudentClick = (studentId) => {
    if (selectedStudentId === studentId) {
      setSelectedStudentId(null);
      setGrades([]);
    } else {
      setSelectedStudentId(studentId);
      fetchStudentGrades(studentId);
    }
  };

  const fetchStudentGrades = (studentId) => {
    axios.get(`http://localhost:3001/students/${studentId}/grades`)
      .then(response => {
        setGrades(response.data);
      })
      .catch(error => {
        console.error('There was an error fetching the grades!', error);
      });
  };

  const calculateFinalGrade = (grades) => {
    const total = grades.reduce((sum, grade) => sum + grade, 0);
    return (total / grades.length).toFixed(2);
  };

  // Group grades by grade level
  const groupedGrades = grades.reduce((acc, grade) => {
    if (!acc[grade.grade_level]) {
      acc[grade.grade_level] = [];
    }
    acc[grade.grade_level].push(grade);
    return acc;
  }, {});

  // Sort grade levels in descending order
  const sortedGradeLevels = Object.keys(groupedGrades).sort((a, b) => b - a);

  return (
    <div className="grades-container">
      <h1 className="grades-title">Grades</h1>
      <div className="grades-search-filter-container">
        <SearchFilter
          handleSearch={handleSearch}
          handleFilter={handleFilterChange}
          handleApplyFilters={handleApplyFilters}
        />
      </div>
      <ul className="grades-list">
        {filteredStudents.map((student, index) => (
          <li key={student.student_id} className="grades-student-item-container" onClick={() => handleStudentClick(student.student_id)}>
            <div className="grades-student-item">
              <p className="grades-student-name">{index + 1}. {student.firstname} {student.middlename} {student.lastname}</p>
              <p className="grades-student-info">Grade {student.current_yr_lvl} - {student.active_status}</p>
              <button className="grades-view-button">View</button>
            </div>
            {selectedStudentId === student.student_id && (
              <div className="grades-student-details">
                {sortedGradeLevels.map((gradeLevel) => (
                  <div key={gradeLevel}>
                    <h2 className="grades-subtitle">Grade Level: {gradeLevel}</h2>
                    <table>
                      <thead>
                        <tr>
                          <th>Subject</th>
                          <th>Q1</th>
                          <th>Q2</th>
                          <th>Q3</th>
                          <th>Q4</th>
                          <th>Final Grade</th>
                        </tr>
                      </thead>
                      <tbody>
                        {groupedGrades[gradeLevel].map((grade, index) => (
                          <tr key={index}>
                            <td>{grade.subject_name}</td>
                            <td>{grade.q1_grade}</td>
                            <td>{grade.q2_grade}</td>
                            <td>{grade.q3_grade}</td>
                            <td>{grade.q4_grade}</td>
                            <td>{calculateFinalGrade([grade.q1_grade, grade.q2_grade, grade.q3_grade, grade.q4_grade])}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ))}
              </div>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default Principal_GradesPage;
