import React, { useState, useEffect } from 'react';
import '../CssFiles/searchfilter.css';
import axios from 'axios';

function SchoolYearSearchFilter({ handleSearch, handleApplyFilters }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSchoolYear, setSelectedSchoolYear] = useState('');
  const [schoolYears, setSchoolYears] = useState([]);

  useEffect(() => {
    axios.get('http://localhost:3001/api/school_years')
      .then(response => {
        setSchoolYears(response.data.map(sy => sy.school_year));
      })
      .catch(error => {
        console.error('There was an error fetching the school years!', error);
      });
  }, []);

  const handleSearchChange = (event) => {
    setSearchTerm(event.target.value);
  };

  const handleSchoolYearChange = (event) => {
    setSelectedSchoolYear(event.target.value);
  };

  const applyFilters = () => {
    const filters = {
      searchTerm,
      school_year: selectedSchoolYear,
    };
    handleApplyFilters(filters);
  };

  return (
    <div className="search-filter">
      <input
        type="text"
        placeholder="Search by year..."
        value={searchTerm}
        onChange={handleSearchChange}
        className="filter-input"
      />
      <select id="school_year" value={selectedSchoolYear} onChange={handleSchoolYearChange} className="filter-select">
        <option value="">Select School Year</option>
        {schoolYears.map((schoolYear, index) => (
          <option key={index} value={schoolYear}>{schoolYear}</option>
        ))}
      </select>
      <button onClick={applyFilters} className="filter-button">Apply Filters</button>
    </div>
  );
}

export default SchoolYearSearchFilter;
