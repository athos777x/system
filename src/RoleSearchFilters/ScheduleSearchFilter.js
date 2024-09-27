import React, { useState, useEffect } from 'react';
import '../CssFiles/searchfilter.css';

function ScheduleSearchFilter({ handleApplyFilters, grades, sections }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGrade, setSelectedGrade] = useState('');
  const [filteredSections, setFilteredSections] = useState([]);
  const [selectedSection, setSelectedSection] = useState('');

  useEffect(() => {
    if (selectedGrade) {
      setFilteredSections(sections.filter(section => section.grade_level === selectedGrade));
    } else {
      setFilteredSections(sections);
    }
  }, [selectedGrade, sections]);

  const handleSearchChange = (event) => {
    const value = event.target.value;
    setSearchTerm(value);
    handleApplyFilters({ searchTerm: value, grade: selectedGrade, section: selectedSection });
  };

  const handleGradeChange = (event) => {
    setSelectedGrade(event.target.value);
  };

  const handleSectionChange = (event) => {
    setSelectedSection(event.target.value);
  };

  const applyFilters = () => {
    handleApplyFilters({ searchTerm, grade: selectedGrade, section: selectedSection });
  };

  return (
    <div className="search-filter">
      <input
        type="text"
        placeholder="Search by section name..."
        value={searchTerm}
        onChange={handleSearchChange}
        className="filter-input"
      />
      <select id="grade" value={selectedGrade} onChange={handleGradeChange} className="filter-select">
        <option value="">Select Grade</option>
        {grades.map((grade, index) => (
          <option key={index} value={grade}>{grade}</option>
        ))}
      </select>
      <select id="section" value={selectedSection} onChange={handleSectionChange} className="filter-select">
        <option value="">Select Section</option>
        {filteredSections.map((section, index) => (
          <option key={index} value={section.section_id}>{section.section_name}</option>
        ))}
      </select>
      <button onClick={applyFilters} className="filter-button">Apply Filters</button>
    </div>
  );
}

export default ScheduleSearchFilter;
