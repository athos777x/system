import React, { useState, useEffect } from 'react';
import '../CssFiles/searchfilter.css';
import axios from 'axios';

function SearchFilter({ handleSearch, handleFilter, handleApplyFilters }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSchoolYear, setSelectedSchoolYear] = useState('');
  const [selectedGrade, setSelectedGrade] = useState('');
  const [selectedSection, setSelectedSection] = useState('');

  const [schoolYears, setSchoolYears] = useState([]);
  const [grades, setGrades] = useState(['7', '8', '9', '10']); // Example grades
  const [sections, setSections] = useState([]);

  useEffect(() => {
    axios.get('http://localhost:3001/api/school_years')
      .then(response => {
        setSchoolYears(response.data);
      })
      .catch(error => {
        console.error('There was an error fetching the school years!', error);
      });

    axios.get('http://localhost:3001/api/sections')
      .then(response => {
        setSections(response.data);
      })
      .catch(error => {
        console.error('There was an error fetching the sections!', error);
      });
  }, []);

  const handleSearchChange = (event) => {
    const value = event.target.value;
    setSearchTerm(value);
    handleSearch(value);
  };

  const handleSchoolYearChange = (event) => {
    const value = event.target.value;
    setSelectedSchoolYear(value);
    handleFilter('school_year', value);
  };

  const handleGradeChange = (event) => {
    const value = event.target.value;
    setSelectedGrade(value);
    handleFilter('grade', value);
  };

  const handleSectionChange = (event) => {
    const value = event.target.value;
    setSelectedSection(value);
    handleFilter('section', value);
  };

  const applyFilters = () => {
    const filters = {
      searchTerm,
      school_year: selectedSchoolYear,
      grade: selectedGrade,
      section: selectedSection
    };
    console.log('Applying filters:', filters);
    handleApplyFilters(filters);
  };

  return (
    <div className="search-filter">
      <input
        type="text"
        placeholder="Search by name..."
        value={searchTerm}
        onChange={handleSearchChange}
        className="filter-input"
      />
      <select id="schoolYear" value={selectedSchoolYear} onChange={handleSchoolYearChange} className="filter-select">
        <option value="">Select School Year</option>
        {schoolYears.map((schoolYear, index) => (
          <option key={index} value={schoolYear.school_year}>{schoolYear.school_year}</option>
        ))}
      </select>
      <select id="grade" value={selectedGrade} onChange={handleGradeChange} className="filter-select">
        <option value="">Select Grade</option>
        {grades.map((grade, index) => (
          <option key={index} value={grade}>{grade}</option>
        ))}
      </select>
      <select id="section" value={selectedSection} onChange={handleSectionChange} className="filter-select">
        <option value="">Select Section</option>
        {sections.map(section => (
          <option key={section.section_id} value={section.section_id}>{section.section_name}</option>
        ))}
      </select>
      <button onClick={applyFilters} className="filter-button">Apply Filters</button>
    </div>
  );
}

export default SearchFilter;
