import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../CssFiles/searchfilter.css';

function Student_Grades_Search({ handleSearch }) {
  const [studentName, setStudentName] = useState('');
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [suggestions, setSuggestions] = useState([]);
  const navigate = useNavigate(); // Initialize navigation

  useEffect(() => {
    if (studentName.trim() === '') {
      setSuggestions([]);
      return;
    }

    const fetchStudentNames = async () => {
      try {
        const response = await fetch(`http://localhost:3001/students?searchTerm=${studentName}`);
        if (!response.ok) throw new Error(`Error: ${response.status}`);
        const data = await response.json();
        setSuggestions(data);
      } catch (error) {
        console.error('Error fetching student names:', error.message);
        setSuggestions([]);
      }
    };

    fetchStudentNames();
  }, [studentName]);

  const handleStudentNameChange = (e) => {
    setStudentName(e.target.value);
  };

  const handleSuggestionClick = (student) => {
    setStudentName(`${student.firstname} ${student.lastname}`);
    setSelectedStudent(student); // Store the selected student object
    setSuggestions([]);
  };

  const applyFilters = () => {
    if (!selectedStudent) {
      alert('Please select a student before applying the filter.');
      return;
    }
  
    handleSearch({ studentId: selectedStudent.student_id, searchTerm: selectedStudent.name });
  };
  

  return (
    <div className="search-filter">
      <input
        type="text"
        value={studentName}
        onChange={handleStudentNameChange}
        placeholder="Enter student name"
        required
        className="filter-input"
      />
      {suggestions.length > 0 && (
        <ul className="suggestions-list">
          {suggestions.map((student, index) => (
            <li key={index} onClick={() => handleSuggestionClick(student)}>
              {student.firstname} {student.lastname}
            </li>
          ))}
        </ul>
      )}
      <button onClick={applyFilters} className="filter-button">
        Apply Filters
      </button>
    </div>
  );
}

export default Student_Grades_Search;
