import React, { useState } from 'react';

function EmployeeSearchFilter({ handleSearch, handleApplyFilters }) {
  const [filters, setFilters] = useState({
    searchTerm: '',
    status: '',
    position: ''
  });

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSearchChange = (e) => {
    const searchTerm = e.target.value;
    setFilters(prev => ({
      ...prev,
      searchTerm
    }));
    handleSearch(searchTerm);
  };

  const applyFilters = () => {
    handleApplyFilters(filters);
  };

  return (
    <div className="teacher-mgmt-search-filter-container">
      <div className="teacher-mgmt-search-bar">
        <input
          type="text"
          placeholder="Search by name..."
          value={filters.searchTerm}
          onChange={handleSearchChange}
        />
      </div>
      
      <div className="teacher-mgmt-filter-options">
        <div className="teacher-mgmt-filter-group">
          <select
            name="status"
            value={filters.status}
            onChange={handleFilterChange}
          >
            <option value="">Status: All</option>
            <option value="active">Active</option>
            <option value="resigned">Resigned</option>
            <option value="retired">Retired</option>
          </select>
        </div>

        <div className="teacher-mgmt-filter-group">
          <select
            name="position"
            value={filters.position}
            onChange={handleFilterChange}
          >
            <option value="">Position: All</option>
            <option value="subject_teacher">Teacher</option>
            <option value="registrar">Registrar</option>
            <option value="principal">Principal</option>
            <option value="academic_coordinator">Academic Coordinator</option>
            <option value="subject_coordinator">Subject Coordinator</option>
            <option value="grade_level_coordinator">Grade Level Coordinator</option>
            <option value="class_adviser">Class Adviser</option>
          </select>
        </div>
      </div>

      <div className="teacher-mgmt-filter-actions">
        <button 
          className="teacher-mgmt-filter-btn"
          onClick={applyFilters}
        >
          Filter
        </button>
      </div>
    </div>
  );
}

export default EmployeeSearchFilter;
