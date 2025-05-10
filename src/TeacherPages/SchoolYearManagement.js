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
      
      // Check if any active school years need to be marked as inactive
      let schoolYearStatusChanged = false;
      
      for (const sy of sortedSchoolYears) {
        if (new Date(sy.school_year_end) < currentDate && sy.status === 'active') {
          sy.status = 'inactive';
          await axios.put(`http://localhost:3001/school-years/${sy.school_year_id}`, { status: 'inactive' });
          schoolYearStatusChanged = true;
        }
      }
      
      // If any school year status was changed to inactive, update enrollment statuses
      if (schoolYearStatusChanged) {
        await axios.put('http://localhost:3001/update-enrollment-status');
      }
      
      const allSchoolYearsResponse = await axios.get('http://localhost:3001/school-years');
      const hasActive = allSchoolYearsResponse.data.some(sy => sy.status === 'active');
      
      let filtered = sortedSchoolYears;
      if (selectedFilter.school_year) {
        filtered = filtered.filter(sy => sy.school_year === selectedFilter.school_year);
      } else {
        filtered = filtered.filter(sy => sy.status === 'active');
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
    setEditFormData(prevFormData => {
      const updatedFormData = {
        ...prevFormData,
        [name]: value
      };

      // If changing start date, ensure end date is within 1 year and adjust enrollment dates if needed
      if (name === 'school_year_start' && value) {
        const startDate = new Date(value);
        const maxEndDate = new Date(startDate);
        maxEndDate.setFullYear(maxEndDate.getFullYear() + 1);
        
        // If current end date is more than 1 year away, reset it
        if (updatedFormData.school_year_end) {
          const endDate = new Date(updatedFormData.school_year_end);
          if (endDate > maxEndDate) {
            updatedFormData.school_year_end = formatDateForInput(maxEndDate);
          }
        }

        // Adjust enrollment dates if they're before the new start date
        if (updatedFormData.enrollment_start && new Date(updatedFormData.enrollment_start) < startDate) {
          updatedFormData.enrollment_start = value;
        }
        if (updatedFormData.enrollment_end && new Date(updatedFormData.enrollment_end) < startDate) {
          updatedFormData.enrollment_end = value;
        }
      }

      // If changing end date, adjust enrollment dates if they're after the new end date
      if (name === 'school_year_end' && value) {
        const endDate = new Date(value);
        const maxEnrollmentStart = new Date(getMaxStartDate());
        
        // If enrollment start is after the max allowed date (current year), adjust it
        if (updatedFormData.enrollment_start) {
          const enrollmentStart = new Date(updatedFormData.enrollment_start);
          if (enrollmentStart > maxEnrollmentStart) {
            updatedFormData.enrollment_start = formatDateForInput(maxEnrollmentStart);
          }
          if (enrollmentStart > endDate) {
            updatedFormData.enrollment_start = value;
          }
        }
        
        if (updatedFormData.enrollment_end && new Date(updatedFormData.enrollment_end) > endDate) {
          updatedFormData.enrollment_end = value;
        }
      }

      // If changing enrollment start, ensure it's not in future years and enrollment end is not before it
      if (name === 'enrollment_start' && value) {
        const enrollmentStart = new Date(value);
        const maxEnrollmentStart = new Date(getMaxStartDate());
        
        if (enrollmentStart > maxEnrollmentStart) {
          updatedFormData.enrollment_start = formatDateForInput(maxEnrollmentStart);
        }
        
        // If enrollment end exists and is not after the new start date, set it to the day after
        if (updatedFormData.enrollment_end) {
          const enrollmentEnd = new Date(updatedFormData.enrollment_end);
          if (enrollmentEnd <= enrollmentStart) {
            const nextDay = new Date(enrollmentStart);
            nextDay.setDate(nextDay.getDate() + 1);
            updatedFormData.enrollment_end = formatDateForInput(nextDay);
          }
        }
      }

      // If changing enrollment end, ensure it's after enrollment start
      if (name === 'enrollment_end' && value) {
        const enrollmentEnd = new Date(value);
        if (updatedFormData.enrollment_start) {
          const enrollmentStart = new Date(updatedFormData.enrollment_start);
          if (enrollmentEnd <= enrollmentStart) {
            const nextDay = new Date(enrollmentStart);
            nextDay.setDate(nextDay.getDate() + 1);
            updatedFormData.enrollment_end = formatDateForInput(nextDay);
          }
        }
      }

      // Update school year name if both dates are set
      if (name === 'school_year_start' || name === 'school_year_end') {
        if (updatedFormData.school_year_start && updatedFormData.school_year_end) {
          const startYear = new Date(updatedFormData.school_year_start).getFullYear();
          const endYear = new Date(updatedFormData.school_year_end).getFullYear();
          updatedFormData.school_year = `${startYear}-${endYear}`;
        }
      }

      return updatedFormData;
    });
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
      
      // Check if status is being changed to inactive
      const currentSchoolYear = schoolYears.find(sy => sy.school_year_id === selectedSchoolYearId);
      const isChangingToInactive = currentSchoolYear.status === 'active' && updatedData.status === 'inactive';
      
      await axios.put(`http://localhost:3001/school-years/${selectedSchoolYearId}`, updatedData);
      
      // If status was changed to inactive, update enrollment statuses
      if (isChangingToInactive) {
        await axios.put('http://localhost:3001/update-enrollment-status');
      }
      
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

  const resetNewSchoolYearForm = () => {
    setNewSchoolYear({
      school_year: '',
      school_year_start: '',
      school_year_end: '',
      enrollment_start: '',
      enrollment_end: ''
    });
    setShowModal(false);
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
      resetNewSchoolYearForm();
      fetchSchoolYears();
    } catch (error) {
      console.error('Error adding school year:', error);
    }
  };

  const handleNewSchoolYearChange = (event) => {
    const { name, value } = event.target;
    setNewSchoolYear(prevState => {
      const updatedState = {
        ...prevState,
        [name]: value
      };

      // If changing start date, ensure end date is within 1 year and adjust enrollment dates if needed
      if (name === 'school_year_start' && value) {
        const startDate = new Date(value);
        const maxEndDate = new Date(startDate);
        maxEndDate.setFullYear(maxEndDate.getFullYear() + 1);
        
        // If current end date is more than 1 year away, reset it
        if (updatedState.school_year_end) {
          const endDate = new Date(updatedState.school_year_end);
          if (endDate > maxEndDate) {
            updatedState.school_year_end = formatDateForInput(maxEndDate);
          }
        }

        // Adjust enrollment dates if they're before the new start date
        if (updatedState.enrollment_start && new Date(updatedState.enrollment_start) < startDate) {
          updatedState.enrollment_start = value;
        }
        if (updatedState.enrollment_end && new Date(updatedState.enrollment_end) < startDate) {
          updatedState.enrollment_end = value;
        }
      }

      // If changing end date, adjust enrollment dates if they're after the new end date
      if (name === 'school_year_end' && value) {
        const endDate = new Date(value);
        const maxEnrollmentStart = new Date(getMaxStartDate());
        
        // If enrollment start is after the max allowed date (current year), adjust it
        if (updatedState.enrollment_start) {
          const enrollmentStart = new Date(updatedState.enrollment_start);
          if (enrollmentStart > maxEnrollmentStart) {
            updatedState.enrollment_start = formatDateForInput(maxEnrollmentStart);
          }
          if (enrollmentStart > endDate) {
            updatedState.enrollment_start = value;
          }
        }
        
        if (updatedState.enrollment_end && new Date(updatedState.enrollment_end) > endDate) {
          updatedState.enrollment_end = value;
        }
      }

      // If changing enrollment start, ensure it's not in future years and enrollment end is not before it
      if (name === 'enrollment_start' && value) {
        const enrollmentStart = new Date(value);
        const maxEnrollmentStart = new Date(getMaxStartDate());
        
        if (enrollmentStart > maxEnrollmentStart) {
          updatedState.enrollment_start = formatDateForInput(maxEnrollmentStart);
        }
        
        // If enrollment end exists and is not after the new start date, set it to the day after
        if (updatedState.enrollment_end) {
          const enrollmentEnd = new Date(updatedState.enrollment_end);
          if (enrollmentEnd <= enrollmentStart) {
            const nextDay = new Date(enrollmentStart);
            nextDay.setDate(nextDay.getDate() + 1);
            updatedState.enrollment_end = formatDateForInput(nextDay);
          }
        }
      }

      // If changing enrollment end, ensure it's after enrollment start
      if (name === 'enrollment_end' && value) {
        const enrollmentEnd = new Date(value);
        if (updatedState.enrollment_start) {
          const enrollmentStart = new Date(updatedState.enrollment_start);
          if (enrollmentEnd <= enrollmentStart) {
            const nextDay = new Date(enrollmentStart);
            nextDay.setDate(nextDay.getDate() + 1);
            updatedState.enrollment_end = formatDateForInput(nextDay);
          }
        }
      }

      // Update school year name if both dates are set
      if (updatedState.school_year_start && updatedState.school_year_end) {
        const startYear = new Date(updatedState.school_year_start).getFullYear();
        const endYear = new Date(updatedState.school_year_end).getFullYear();
        updatedState.school_year = `${startYear}-${endYear}`;
      }

      return updatedState;
    });
  };

  const getCurrentYear = () => {
    return new Date().getFullYear();
  };

  const getMinStartDate = () => {
    const currentYear = getCurrentYear();
    return `${currentYear}-01-01`;
  };

  const getMaxStartDate = () => {
    const currentYear = getCurrentYear();
    return `${currentYear}-12-31`;
  };

  const getMaxEndDate = () => {
    const currentYear = getCurrentYear();
    return `${currentYear + 1}-12-31`;
  };

  const getMaxEnrollmentStartDate = (schoolYearEnd) => {
    const maxStartDate = new Date(getMaxStartDate());
    if (schoolYearEnd) {
      const endDate = new Date(schoolYearEnd);
      return endDate < maxStartDate ? formatDateForInput(endDate) : formatDateForInput(maxStartDate);
    }
    return formatDateForInput(maxStartDate);
  };

  const getMinEnrollmentEndDate = (enrollmentStart) => {
    if (!enrollmentStart) return '';
    const startDate = new Date(enrollmentStart);
    const nextDay = new Date(startDate);
    nextDay.setDate(nextDay.getDate() + 1);
    return formatDateForInput(nextDay);
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
                                    readOnly
                                    style={{ backgroundColor: '#f0f0f0' }}
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
                                    min={getMinStartDate()}
                                    max={getMaxStartDate()}
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
                                    min={editFormData.school_year_start || getMinStartDate()}
                                    max={getMaxEndDate()}
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
                                    min={editFormData.school_year_start}
                                    max={getMaxEnrollmentStartDate(editFormData.school_year_end)}
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
                                    min={getMinEnrollmentEndDate(editFormData.enrollment_start)}
                                    max={editFormData.school_year_end}
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
                readOnly
                style={{ backgroundColor: '#f0f0f0' }}
              />
            </label>
            <label>
              Start Date:
              <input
                type="date"
                name="school_year_start"
                value={newSchoolYear.school_year_start}
                onChange={handleNewSchoolYearChange}
                min={getMinStartDate()}
                max={getMaxStartDate()}
              />
            </label>
            <label>
              End Date:
              <input
                type="date"
                name="school_year_end"
                value={newSchoolYear.school_year_end}
                onChange={handleNewSchoolYearChange}
                min={newSchoolYear.school_year_start || getMinStartDate()}
                max={getMaxEndDate()}
              />
            </label>
            <label>
              Enrollment Start:
              <input
                type="date"
                name="enrollment_start"
                value={newSchoolYear.enrollment_start}
                onChange={handleNewSchoolYearChange}
                min={newSchoolYear.school_year_start}
                max={getMaxEnrollmentStartDate(newSchoolYear.school_year_end)}
              />
            </label>
            <label>
              Enrollment End:
              <input
                type="date"
                name="enrollment_end"
                value={newSchoolYear.enrollment_end}
                onChange={handleNewSchoolYearChange}
                min={getMinEnrollmentEndDate(newSchoolYear.enrollment_start)}
                max={newSchoolYear.school_year_end}
              />
            </label>
            <div className="school-year-button-group">
              <button className="school-year-btn school-year-btn-edit" onClick={handleAddSchoolYear}>
                Add
              </button>
              <button className="school-year-btn school-year-btn-cancel" onClick={resetNewSchoolYearForm}>
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
