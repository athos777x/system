import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import '../TeacherPagesCss/SchoolYearManagement.css';

function SchoolYearManagement() {
  const [schoolYears, setSchoolYears] = useState([]);
  const [filteredSchoolYears, setFilteredSchoolYears] = useState([]);
  const [selectedSchoolYearId, setSelectedSchoolYearId] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editFormData, setEditFormData] = useState({});
  const [filters, setFilters] = useState({
    school_year: ''
  });
  const [selectedFilter, setSelectedFilter] = useState({
    school_year: ''
  });
  const [hasActiveSchoolYear, setHasActiveSchoolYear] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [newSchoolYear, setNewSchoolYear] = useState({
    school_year: '',
    school_year_start: '',
    school_year_end: '',
    enrollment_start: '',
    enrollment_end: ''
  });
  const [availableSchoolYears, setAvailableSchoolYears] = useState([]);

  useEffect(() => {
    fetchAvailableSchoolYears();
  }, []);

  const fetchAvailableSchoolYears = async () => {
    try {
      const response = await axios.get('http://localhost:3001/api/school_years');
      setAvailableSchoolYears(response.data);
    } catch (error) {
      console.error('Error fetching available school years:', error);
    }
  };

  const fetchSchoolYears = useCallback(async () => {
    try {
      const response = await axios.get('http://localhost:3001/school-years', {
        params: selectedFilter
      });
      const sortedSchoolYears = response.data.sort((a, b) => a.school_year.localeCompare(b.school_year));
      const currentDate = new Date();
      sortedSchoolYears.forEach(async (sy) => {
        if (new Date(sy.school_year_end) < currentDate && sy.status === 'active') {
          sy.status = 'inactive';
          await axios.put(`http://localhost:3001/school-years/${sy.school_year_id}`, { status: 'inactive' });
        }
      });
      
      const allSchoolYearsResponse = await axios.get('http://localhost:3001/school-years');
      const hasActive = allSchoolYearsResponse.data.some(sy => sy.status === 'active');
      
      let filtered = sortedSchoolYears;
      if (selectedFilter.school_year) {
        filtered = filtered.filter(sy => sy.school_year === selectedFilter.school_year);
      }
      
      setSchoolYears(sortedSchoolYears);
      setFilteredSchoolYears(filtered);
      setHasActiveSchoolYear(hasActive);
    } catch (error) {
      console.error('Error fetching school years:', error);
    }
  }, [selectedFilter]);

  useEffect(() => {
    fetchSchoolYears();
  }, [fetchSchoolYears]);

  const handleFilterChange = (type, value) => {
    setFilters(prev => ({
      ...prev,
      [type]: value
    }));
  };

  const applyFilters = () => {
    setSelectedFilter(filters);
  };

  const toggleSchoolYearDetails = (schoolYearId) => {
    if (selectedSchoolYearId === schoolYearId) {
      setSelectedSchoolYearId(null);
      setIsEditing(false);
    } else {
      setSelectedSchoolYearId(schoolYearId);
      setIsEditing(false);
      const schoolYear = schoolYears.find(sy => sy.school_year_id === schoolYearId);
      setEditFormData({
        ...schoolYear,
        school_year_start: formatDateForInput(schoolYear.school_year_start),
        school_year_end: formatDateForInput(schoolYear.school_year_end),
        enrollment_start: formatDateForInput(schoolYear.enrollment_start),
        enrollment_end: formatDateForInput(schoolYear.enrollment_end),
      });
    }
  };

  const startEditing = (schoolYearId) => {
    setSelectedSchoolYearId(schoolYearId);
    setIsEditing(true);
    const schoolYear = schoolYears.find(sy => sy.school_year_id === schoolYearId);
    setEditFormData({
      ...schoolYear,
      school_year_start: formatDateForInput(schoolYear.school_year_start),
      school_year_end: formatDateForInput(schoolYear.school_year_end),
      enrollment_start: formatDateForInput(schoolYear.enrollment_start),
      enrollment_end: formatDateForInput(schoolYear.enrollment_end),
    });
  };

  const handleEditChange = (event) => {
    const { name, value } = event.target;
    setEditFormData(prevFormData => ({
      ...prevFormData,
      [name]: value
    }));
  };

  const saveChanges = async () => {
    try {
      const updatedData = {
        ...editFormData,
        school_year_start: formatDateForBackend(editFormData.school_year_start),
        school_year_end: formatDateForBackend(editFormData.school_year_end),
        enrollment_start: formatDateForBackend(editFormData.enrollment_start),
        enrollment_end: formatDateForBackend(editFormData.enrollment_end)
      };
      await axios.put(`http://localhost:3001/school-years/${selectedSchoolYearId}`, updatedData);
      fetchSchoolYears();
      setIsEditing(false);
      setSelectedSchoolYearId(selectedSchoolYearId);
    } catch (error) {
      console.error('Error saving school year details:', error);
    }
  };

  const cancelEditing = () => {
    setIsEditing(false);
    const schoolYear = schoolYears.find(sy => sy.school_year_id === selectedSchoolYearId);
    setEditFormData({
      ...schoolYear,
      school_year_start: formatDateForInput(schoolYear.school_year_start),
      school_year_end: formatDateForInput(schoolYear.school_year_end),
      enrollment_start: formatDateForInput(schoolYear.enrollment_start),
      enrollment_end: formatDateForInput(schoolYear.enrollment_end),
    });
  };

  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  const formatDateForInput = (dateString) => {
    const date = new Date(dateString);
    const offset = date.getTimezoneOffset();
    const localDate = new Date(date.getTime() - (offset * 60 * 1000));
    return localDate.toISOString().split('T')[0];
  };

  const formatDateForBackend = (dateString) => {
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const handleAddSchoolYear = async () => {
    try {
      const newSchoolYearData = {
        ...newSchoolYear,
        school_year_start: formatDateForBackend(newSchoolYear.school_year_start),
        school_year_end: formatDateForBackend(newSchoolYear.school_year_end),
        enrollment_start: formatDateForBackend(newSchoolYear.enrollment_start),
        enrollment_end: formatDateForBackend(newSchoolYear.enrollment_end),
        status: 'active'
      };
      await axios.post('http://localhost:3001/school-years', newSchoolYearData);
      setShowModal(false);
      setNewSchoolYear({
        school_year: '',
        school_year_start: '',
        school_year_end: '',
        enrollment_start: '',
        enrollment_end: ''
      });
      fetchSchoolYears();
    } catch (error) {
      console.error('Error adding school year:', error);
    }
  };

  const handleNewSchoolYearChange = (event) => {
    const { name, value } = event.target;
    setNewSchoolYear(prevState => ({
      ...prevState,
      [name]: value
    }));
  };

  return (
    <div className="school-year-container">
      <div className="school-year-header">
        <h1 className="school-year-title">School Year Management</h1>
        <button
          className={`school-year-add-btn ${hasActiveSchoolYear ? 'disabled' : ''}`}
          onClick={() => setShowModal(true)}
          disabled={hasActiveSchoolYear}
        >
          Add School Year
        </button>
      </div>

      <div className="school-year-filters">
        <select
          value={filters.school_year}
          onChange={(e) => handleFilterChange('school_year', e.target.value)}
          className="school-year-select"
        >
          <option value="">Select School Year</option>
          {availableSchoolYears.map((year) => (
            <option key={year.school_year_id} value={year.school_year}>
              {year.school_year}
            </option>
          ))}
        </select>
        <button onClick={applyFilters}>Filter</button>
      </div>

      <div className="school-year-table-container">
        <table className="school-year-table">
          <thead>
            <tr>
              <th>#</th>
              <th>School Year</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredSchoolYears.map((schoolYear, index) => (
              <React.Fragment key={schoolYear.school_year_id}>
                <tr>
                  <td>{index + 1}</td>
                  <td>{schoolYear.school_year}</td>
                  <td>
                    <span className={`status-${schoolYear.status.toLowerCase()}`}>
                      {schoolYear.status}
                    </span>
                  </td>
                  <td>
                    <div className="school-year-actions">
                      <button 
                        className="school-year-btn school-year-btn-view"
                        onClick={() => toggleSchoolYearDetails(schoolYear.school_year_id)}
                      >
                        View
                      </button>
                      <button 
                        className="school-year-btn school-year-btn-edit"
                        onClick={() => startEditing(schoolYear.school_year_id)}
                      >
                        Edit
                      </button>
                    </div>
                  </td>
                </tr>
                {selectedSchoolYearId === schoolYear.school_year_id && (
                  <tr>
                    <td colSpan="4">
                      <div className="school-year-details">
                        <table>
                          <tbody>
                            <tr>
                              <th>Year:</th>
                              <td>
                                {isEditing ? (
                                  <input
                                    type="text"
                                    name="school_year"
                                    value={editFormData.school_year}
                                    onChange={handleEditChange}
                                  />
                                ) : (
                                  schoolYear.school_year
                                )}
                              </td>
                            </tr>
                            <tr>
                              <th>Status:</th>
                              <td>
                                {isEditing ? (
                                  <select
                                    name="status"
                                    value={editFormData.status}
                                    onChange={handleEditChange}
                                  >
                                    <option value="active">Active</option>
                                    <option value="inactive">Inactive</option>
                                  </select>
                                ) : (
                                  <span className={`status-${schoolYear.status.toLowerCase()}`}>
                                    {schoolYear.status}
                                  </span>
                                )}
                              </td>
                            </tr>
                            <tr>
                              <th>Start Date:</th>
                              <td>
                                {isEditing ? (
                                  <input
                                    type="date"
                                    name="school_year_start"
                                    value={editFormData.school_year_start}
                                    onChange={handleEditChange}
                                  />
                                ) : (
                                  formatDate(schoolYear.school_year_start)
                                )}
                              </td>
                            </tr>
                            <tr>
                              <th>End Date:</th>
                              <td>
                                {isEditing ? (
                                  <input
                                    type="date"
                                    name="school_year_end"
                                    value={editFormData.school_year_end}
                                    onChange={handleEditChange}
                                  />
                                ) : (
                                  formatDate(schoolYear.school_year_end)
                                )}
                              </td>
                            </tr>
                            <tr>
                              <th>Enrollment Start:</th>
                              <td>
                                {isEditing ? (
                                  <input
                                    type="date"
                                    name="enrollment_start"
                                    value={editFormData.enrollment_start}
                                    onChange={handleEditChange}
                                  />
                                ) : (
                                  formatDate(schoolYear.enrollment_start)
                                )}
                              </td>
                            </tr>
                            <tr>
                              <th>Enrollment End:</th>
                              <td>
                                {isEditing ? (
                                  <input
                                    type="date"
                                    name="enrollment_end"
                                    value={editFormData.enrollment_end}
                                    onChange={handleEditChange}
                                  />
                                ) : (
                                  formatDate(schoolYear.enrollment_end)
                                )}
                              </td>
                            </tr>
                          </tbody>
                        </table>
                        {isEditing && (
                          <div className="school-year-edit-buttons">
                            <button className="school-year-btn school-year-btn-edit" onClick={saveChanges}>
                              Save
                            </button>
                            <button className="school-year-btn school-year-btn-cancel" onClick={cancelEditing}>
                              Cancel
                            </button>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="school-year-modal">
          <div className="school-year-modal-content">
            <h2>Add New School Year</h2>
            <label>
              School Year:
              <input
                type="text"
                name="school_year"
                value={newSchoolYear.school_year}
                onChange={handleNewSchoolYearChange}
              />
            </label>
            <label>
              Start Date:
              <input
                type="date"
                name="school_year_start"
                value={newSchoolYear.school_year_start}
                onChange={handleNewSchoolYearChange}
              />
            </label>
            <label>
              End Date:
              <input
                type="date"
                name="school_year_end"
                value={newSchoolYear.school_year_end}
                onChange={handleNewSchoolYearChange}
              />
            </label>
            <label>
              Enrollment Start:
              <input
                type="date"
                name="enrollment_start"
                value={newSchoolYear.enrollment_start}
                onChange={handleNewSchoolYearChange}
              />
            </label>
            <label>
              Enrollment End:
              <input
                type="date"
                name="enrollment_end"
                value={newSchoolYear.enrollment_end}
                onChange={handleNewSchoolYearChange}
              />
            </label>
            <div className="school-year-button-group">
              <button className="school-year-btn school-year-btn-edit" onClick={handleAddSchoolYear}>
                Save
              </button>
              <button className="school-year-btn school-year-btn-cancel" onClick={() => setShowModal(false)}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default SchoolYearManagement;
