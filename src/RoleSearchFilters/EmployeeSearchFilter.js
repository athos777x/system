import React, { useState } from 'react';

function EmployeeSearchFilter({ handleApplyFilters }) {
  const [filters, setFilters] = useState({
    searchID: '',
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

  const applyFilters = () => {
    handleApplyFilters(filters); // ✅ Always allow applying filters
  };

  return (
    <div className="teacher-mgmt-search-filter-container">
      {/* Search by Employee ID */}
      <div className="teacher-mgmt-search-bar">
        <input
          type="text"
          name="searchID"
          placeholder="Search by Emp ID..."
          value={filters.searchID}
          onChange={handleFilterChange}
        />
      </div>

      {/* Search by Name */}
      <div className="teacher-mgmt-search-bar">
        <input
          type="text"
          name="searchTerm"
          placeholder="Search by name..."
          value={filters.searchTerm}
          onChange={handleFilterChange}
        />
      </div>

      {/* Filters */}
      <div className="teacher-mgmt-filter-options">
        <div className="teacher-mgmt-filter-group">
          <select name="status" value={filters.status} onChange={handleFilterChange}>
            <option value="">Select Status</option>
            <option value="active">Active</option>
            <option value="resigned">Resigned</option>
            <option value="retired">Retired</option>
          </select>
        </div>

        <div className="teacher-mgmt-filter-group">
          <select name="position" value={filters.position} onChange={handleFilterChange}>
            <option value="">Select Position</option>
            <option value="subject_teacher">Subject Teacher</option>
            <option value="registrar">Registrar</option>
            <option value="principal">Principal</option>
            <option value="academic_coordinator">Academic Coordinator</option>
            <option value="subject_coordinator">Subject Coordinator</option>
            <option value="grade_level_coordinator">Grade Level Coordinator</option>
            <option value="class_adviser">Class Adviser</option>
          </select>
        </div>
      </div>

      {/* Apply Filters Button */}
      <div className="teacher-mgmt-filter-actions">
        <button className="teacher-mgmt-filter-btn" onClick={applyFilters}>
          Filter
        </button>
      </div>
    </div>
  );
}

export default EmployeeSearchFilter;
