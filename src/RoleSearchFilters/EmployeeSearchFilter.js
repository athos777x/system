import React, { useState, useEffect } from 'react';
import '../CssFiles/searchfilter.css';
import axios from 'axios';

function EmployeeSearchFilter({ handleSearch, handleApplyFilters }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [selectedPosition, setSelectedPosition] = useState('');
  const [showArchive, setShowArchive] = useState('unarchive');
  const [positions, setPositions] = useState([]);

  useEffect(() => {
    axios.get('http://localhost:3001/api/positions')
      .then(response => {
        const formattedPositions = response.data.map(position => 
          position.replace(/_/g, ' ').split(' ').map(word => 
            word.charAt(0).toUpperCase() + word.slice(1)
          ).join(' ')
        );
        setPositions(formattedPositions);
      })
      .catch(error => {
        console.error('There was an error fetching the positions!', error);
      });
  }, []);

  const handleSearchChange = (event) => {
    setSearchTerm(event.target.value);
    handleSearch(event.target.value);
  };

  const handleStatusChange = (event) => {
    setSelectedStatus(event.target.value);
  };

  const handlePositionChange = (event) => {
    setSelectedPosition(event.target.value);
  };

  const handleShowArchiveChange = (event) => {
    setShowArchive(event.target.value);
  };

  const applyFilters = () => {
    const filters = {
      searchTerm,
      status: selectedStatus,
      position: selectedPosition,
      showArchive
    };
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
      <select id="status" value={selectedStatus} onChange={handleStatusChange} className="filter-select">
        <option value="">Select Status</option>
        <option value="showAll">Show All</option>
        <option value="active">Active</option>
        <option value="inactive">Inactive</option>
      </select>
      <select id="position" value={selectedPosition} onChange={handlePositionChange} className="filter-select">
        <option value="">Select Position</option>
        {positions.map((position, index) => (
          <option key={index} value={position}>{position}</option>
        ))}
      </select>
      <select id="showArchive" value={showArchive} onChange={handleShowArchiveChange} className="filter-select">
        <option value="unarchive">Show Unarchived</option>
        <option value="archive">Show Archived</option>
      </select>
      <button onClick={applyFilters} className="filter-button">Apply Filters</button>
    </div>
  );
}

export default EmployeeSearchFilter;
