import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import '../TeacherPagesCss/SectionManagement.css';

function SectionManagement() {
  const [roleName, setRoleName] = useState('');
  const [sections, setSections] = useState([]);
  const [filteredSections, setFilteredSections] = useState([]);
  const [selectedSectionId, setSelectedSectionId] = useState(null);
  const [sectionDetails, setSectionDetails] = useState({});
  const [activeSchoolYear, setActiveSchoolYear] = useState(null);
  const [schoolYears, setSchoolYears] = useState([]);
  const [filters, setFilters] = useState({
    searchTerm: '',
    grade: '',
    section: '',
    showArchive: 'unarchive'
  });
  const [isEditing, setIsEditing] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [editFormData, setEditFormData] = useState({});
  const [showModal, setShowModal] = useState(false);
  const [showArchiveModal, setShowArchiveModal] = useState(false);
  const [archiveAction, setArchiveAction] = useState({
    sectionId: null,
    currentStatus: '',
    sectionName: ''
  });
  const [newSectionData, setNewSectionData] = useState({
    section_name: '',
    grade_level: '7',
    status: 'active',
    max_capacity: '',
    school_year_id: '',
    room_number: '',
    archive_status: 'unarchive' // Default value
  });
  const [errors, setErrors] = useState({});
  const [isInitialized, setIsInitialized] = useState(false);
  const [validations, setValidations] = useState({
    section_name: true,
    max_capacity: true,
    room_number: true
  });
  const [editValidations, setEditValidations] = useState({
    section_name: true,
    max_capacity: true,
    room_number: true
  });

  const fetchActiveSchoolYear = useCallback(async () => {
    try {
      const response = await axios.get('http://localhost:3001/school-years/active');
      console.log('Active school year response:', response.data); // Log the response
      setActiveSchoolYear(response.data.school_year);
      return response.data;
    } catch (error) {
      console.error('There was an error fetching the active school year!', error);
      return null;
    }
  }, []);

  const fetchSections = useCallback(async (schoolYearId, applyFilters = false) => {
    try {
        const params = { schoolYearId };

        // Retrieve roleName and user_id from localStorage
        const userId = localStorage.getItem('userId');  // Get the user ID from localStorage
        console.log('userId:', userId);  // Check if userId is available in the console
  
      if (!userId) {
        console.error('User ID is missing');
        return;  // Exit if no userId is available
      }

        // Only include filters if explicitly requested
        if (applyFilters) {
            params.searchTerm = filters.searchTerm || "";
            params.grade = filters.grade || "";
            params.showArchive = filters.showArchive || "";
        }

        // Use a different endpoint based on roleName
        const endpoint = roleName === 'class_adviser'
            ? `http://localhost:3001/sections/by-adviser/${userId}` // Use the 'by-adviser' endpoint
            : 'http://localhost:3001/sections'; // Default endpoint

        console.log("Fetching sections from:", endpoint); // Debugging log

        const response = await axios.get(endpoint, { params });
        setSections(response.data);
        const unarchivedSections = response.data.filter(section => section.archive_status === 'unarchive');
        setFilteredSections(unarchivedSections);
    } catch (error) {
        console.error("Error fetching sections:", error);
    }
}, [filters, roleName]);








  const fetchSchoolYears = useCallback(async () => {
    try {
      const response = await axios.get('http://localhost:3001/school-years');
      setSchoolYears(response.data);
    } catch (error) {
      console.error('There was an error fetching the school years!', error);
    }
  }, []);

  const getUniqueGrades = (sections) => {
    const grades = sections.map(section => section.grade_level);
    return [...new Set(grades)];
  };

  const applyFilters = (updatedFilters) => {
    console.log('Updated filters:', updatedFilters);
    let filtered = sections;

    if (updatedFilters.searchTerm) {
      filtered = filtered.filter(section =>
        section.section_name.toLowerCase().includes(updatedFilters.searchTerm.toLowerCase())
      );
    }

    if (updatedFilters.school_year) {
      filtered = filtered.filter(section => section.school_year === updatedFilters.school_year);
    }

    if (updatedFilters.grade) {
      filtered = filtered.filter(section => section.grade_level === updatedFilters.grade);
    }

    if (updatedFilters.section) {
      filtered = filtered.filter(section => section.section_id === parseInt(updatedFilters.section));
    }

    if (updatedFilters.showArchive) {
      filtered = filtered.filter(section => section.archive_status === updatedFilters.showArchive);
    }

    console.log('Filtered sections:', filtered);
    setFilteredSections(filtered);
  };


  const handleFilterChange = (type, value) => {
    setFilters(prevFilters => ({
      ...prevFilters,
      [type]: value
    }));
  };

  const handleSearch = (searchTerm) => {
    setFilters(prevFilters => ({ ...prevFilters, searchTerm }));
    applyFilters({ ...filters, searchTerm });
  };

  const handleViewClick = async (sectionId) => {
    if (selectedSectionId === sectionId) {
      setSelectedSectionId(null);
      setSectionDetails({});
      setIsEditing(false);
    } else {
      setSelectedSectionId(sectionId);
      setIsEditing(false);
      fetchSectionDetails(sectionId);
    }
  };

  const fetchSectionDetails = async (sectionId) => {
    try {
      const response = await axios.get(`http://localhost:3001/sections/${sectionId}`);
      console.log('Fetched section details:', response.data); // Log fetched details
      setSectionDetails(response.data);
      setEditFormData(response.data);
    } catch (error) {
      console.error('There was an error fetching the section details!', error);
    }
  };

  const startEditing = (sectionId) => {
    setSelectedSectionId(sectionId);
    setIsEditing(true);
    setErrors({});
    setEditValidations({
      section_name: true,
      max_capacity: true,
      room_number: true
    });
    const section = sections.find(sec => sec.section_id === sectionId);
    setEditFormData(section);
  };

  const handleEditChange = (event) => {
    const { name, value } = event.target;
    setEditFormData(prevFormData => ({
      ...prevFormData,
      [name]: value
    }));
    
    // Validate the field as it changes
    validateEditField(name, value);
  };
  
  const validateEditField = (name, value) => {
    let isValid = true;
    
    switch(name) {
      case 'section_name':
        isValid = value && value.trim && value.trim() !== '';
        break;
      case 'max_capacity':
        isValid = value && value.toString().trim() !== '' && (/^\d+$/.test(value.toString()) && parseInt(value) > 0);
        break;
      case 'room_number':
        isValid = value && value.trim && value.trim() !== '' && /^[a-zA-Z0-9\s-]{1,10}$/.test(value);
        break;
      default:
        break;
    }
    
    setEditValidations(prev => ({
      ...prev,
      [name]: isValid
    }));
    
    return isValid;
  };
  
  const validateEditForm = () => {
    let formIsValid = true;
    let newValidations = { ...editValidations };
    let newErrors = {};
    
    // Validate section_name (required)
    if (!editFormData.section_name || (editFormData.section_name.trim && !editFormData.section_name.trim())) {
      newValidations.section_name = false;
      newErrors.section_name = 'Section name is required';
      formIsValid = false;
    } else {
      newValidations.section_name = true;
    }
    
    // Validate max_capacity (required and must be a positive number)
    if (!editFormData.max_capacity) {
      newValidations.max_capacity = false;
      newErrors.max_capacity = 'Max capacity is required';
      formIsValid = false;
    } else if (!(/^\d+$/.test(editFormData.max_capacity.toString()) && parseInt(editFormData.max_capacity) > 0)) {
      newValidations.max_capacity = false;
      newErrors.max_capacity = 'Max capacity must be a positive number';
      formIsValid = false;
    } else {
      newValidations.max_capacity = true;
    }
    
    // Validate room_number (required and must follow format)
    if (!editFormData.room_number || (editFormData.room_number.trim && !editFormData.room_number.trim())) {
      newValidations.room_number = false;
      newErrors.room_number = 'Room number is required';
      formIsValid = false;
    } else if (!/^[a-zA-Z0-9\s-]{1,10}$/.test(editFormData.room_number)) {
      newValidations.room_number = false;
      newErrors.room_number = 'Room number must be alphanumeric, max 10 characters';
      formIsValid = false;
    } else {
      newValidations.room_number = true;
    }
    
    setEditValidations(newValidations);
    setErrors(newErrors);
    
    return formIsValid;
  };

  const saveChanges = async () => {
    if (!validateEditForm()) {
      return; // Stop if validation fails
    }
    
    try {
      // Create a copy of the edit form data without school_year field
      const { school_year, ...updateData } = editFormData;
      
      // Make sure we're sending the correct fields to match the database columns
      const dataToUpdate = {
        section_name: updateData.section_name,
        grade_level: updateData.grade_level,
        status: updateData.status,
        max_capacity: updateData.max_capacity,
        room_number: updateData.room_number,
        archive_status: updateData.archive_status || 'unarchive'
      };

      await axios.put(`http://localhost:3001/sections/${selectedSectionId}`, dataToUpdate);
      fetchSections(activeSchoolYear);
      fetchSectionDetails(selectedSectionId);
      setIsEditing(false);
      setErrors({});
      setEditValidations({
        section_name: true,
        max_capacity: true,
        room_number: true
      });
    } catch (error) {
      console.error('Error saving section details:', error);
      if (error.response?.data?.error === 'Section name already exists') {
        setErrors({ section_name: 'Section name already exists in another record' });
      } else {
        setErrors({ section_name: 'Error updating section' });
      }
    }
  };

  const toggleArchiveStatus = async (sectionId, currentStatus) => {
    try {
      const newStatus = currentStatus === 'inactive' ? 'active' : 'inactive';
      const newArchiveStatus = currentStatus === 'inactive' ? 'unarchive' : 'archive';
      await axios.put(`http://localhost:3001/sections/${sectionId}/archive`, { status: newStatus, archive_status: newArchiveStatus });
      fetchSections(activeSchoolYear);
      // If the section being archived is currently selected, close the details view
      if (selectedSectionId === sectionId) {
        setSelectedSectionId(null);
        setSectionDetails({});
      }
      setShowArchiveModal(false);
    } catch (error) {
      console.error(`Error changing status:`, error);
    }
  };

  const openArchiveConfirmation = (sectionId, currentStatus, sectionName) => {
    setArchiveAction({
      sectionId,
      currentStatus,
      sectionName
    });
    setShowArchiveModal(true);
  };

  const cancelArchiveAction = () => {
    setShowArchiveModal(false);
    setArchiveAction({
      sectionId: null,
      currentStatus: '',
      sectionName: ''
    });
  };

  const cancelEditing = () => {
    setIsEditing(false);
    setErrors({});
    setEditValidations({
      section_name: true,
      max_capacity: true,
      room_number: true
    });
    fetchSectionDetails(selectedSectionId);
  };

  const startAdding = () => {
    setIsAdding(true);
    setErrors({});
    setNewSectionData({
      section_name: '',
      grade_level: '7',
      status: 'active',
      max_capacity: '',
      school_year_id: schoolYears.length > 0 ? schoolYears[0].school_year_id : '',
      room_number: '',
      archive_status: 'unarchive'
    });
    setShowModal(true);
  };

  const handleAddChange = (event) => {
    const { name, value } = event.target;
    setNewSectionData(prevFormData => ({
      ...prevFormData,
      [name]: value
    }));
    
    // Validate the field as it changes
    validateField(name, value);
  };

  const validateField = (name, value) => {
    let isValid = true;
    
    switch(name) {
      case 'section_name':
        isValid = value.trim() !== '';
        break;
      case 'max_capacity':
        isValid = value.trim() !== '' && (/^\d+$/.test(value) && parseInt(value) > 0);
        break;
      case 'room_number':
        isValid = value.trim() !== '' && /^[a-zA-Z0-9\s-]{1,10}$/.test(value);
        break;
      default:
        break;
    }
    
    setValidations(prev => ({
      ...prev,
      [name]: isValid
    }));
    
    return isValid;
  };

  const validateForm = () => {
    let formIsValid = true;
    let newValidations = { ...validations };
    let newErrors = {};
    
    // Validate section_name (required)
    if (!newSectionData.section_name.trim()) {
      newValidations.section_name = false;
      newErrors.section_name = 'Section name is required';
      formIsValid = false;
    } else {
      newValidations.section_name = true;
    }
    
    // Validate max_capacity (required and must be a positive number)
    if (!newSectionData.max_capacity.trim()) {
      newValidations.max_capacity = false;
      newErrors.max_capacity = 'Max capacity is required';
      formIsValid = false;
    } else if (!(/^\d+$/.test(newSectionData.max_capacity) && parseInt(newSectionData.max_capacity) > 0)) {
      newValidations.max_capacity = false;
      newErrors.max_capacity = 'Max capacity must be a positive number';
      formIsValid = false;
    } else {
      newValidations.max_capacity = true;
    }
    
    // Validate room_number (required and must follow format)
    if (!newSectionData.room_number.trim()) {
      newValidations.room_number = false;
      newErrors.room_number = 'Room number is required';
      formIsValid = false;
    } else if (!/^[a-zA-Z0-9\s-]{1,10}$/.test(newSectionData.room_number)) {
      newValidations.room_number = false;
      newErrors.room_number = 'Room number must be alphanumeric, max 10 characters';
      formIsValid = false;
    } else {
      newValidations.room_number = true;
    }
    
    setValidations(newValidations);
    setErrors(newErrors);
    
    return formIsValid;
  };

  const saveNewSection = async () => {
    if (!validateForm()) {
      return; // Stop if validation fails
    }
    
    try {
      await axios.post('http://localhost:3001/sections', newSectionData);
      fetchSections(activeSchoolYear);
      setIsAdding(false);
      setShowModal(false);
      setErrors({});
      setValidations({
        section_name: true,
        max_capacity: true,
        room_number: true
      });
    } catch (error) {
      console.error('Error adding new section:', error);
      if (error.response?.data?.error === 'Section name already exists') {
        setErrors({ section_name: 'Section name already exists' });
      } else {
        setErrors({ section_name: 'Error adding section' });
      }
    }
  };

  const cancelAdding = () => {
    setIsAdding(false);
    setShowModal(false);
    setErrors({});
    setValidations({
      section_name: true,
      max_capacity: true,
      room_number: true
    });
  };

  const capitalizeStatus = (status) => {
    if (!status) return 'Active';
    return status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();
  };

  useEffect(() => {
    if (!isInitialized) {
      const initializeData = async () => {
        await fetchSchoolYears(); // Fetch school years first
        const activeYear = await fetchActiveSchoolYear();
        if (activeYear && roleName) {
          console.log('Active school year:', activeYear.school_year); // Log active school year
          setFilters(prevFilters => ({ ...prevFilters, school_year: activeYear.school_year })); // Set default school year
          await fetchSections(activeYear.school_year_id, false);  // Fetch sections without filters initially
          console.log('Applying filters with:', { ...filters, school_year: activeYear.school_year }); // Log filters being applied
          
        }
        setIsInitialized(true); // Mark as initialized
      };

      initializeData();
    }
  }, [fetchActiveSchoolYear, fetchSchoolYears, roleName, fetchSections, isInitialized]);

  useEffect(() => {
    const userId = localStorage.getItem('userId'); // Retrieve userId from localStorage
    if (userId) {
      console.log(`Retrieved userId from localStorage: ${userId}`); // Debugging log
      fetchUserRole(userId);
    } else {
      console.error('No userId found in localStorage');
    }
  }, []);

  const fetchUserRole = async (userId) => {
    try {
      console.log(`Fetching role for user ID: ${userId}`); // Debugging log
      const response = await axios.get(`http://localhost:3001/user-role/${userId}`);
      if (response.status === 200) {
        console.log('Response received:', response.data); // Debugging log
        setRoleName(response.data.role_name);
        console.log('Role name set to:', response.data.role_name); // Debugging log
      } else {
        console.error('Failed to fetch role name. Response status:', response.status);
      }
    } catch (error) {
      if (error.response) {
        console.error('Error response from server:', error.response.data);
      } else if (error.request) {
        console.error('No response received from server. Request:', error.request);
      } else {
        console.error('Error setting up request:', error.message);
      }
    }
  };


  return (
    <div className="section-mgmt-container">
      <div className="section-mgmt-header">
        <h1 className="section-mgmt-title">Section Management</h1>
        {(roleName !== 'academic_coordinator') && (
          <button className="section-mgmt-add-btn" onClick={startAdding}>
            Add New Section
          </button>
        )}
      </div>

      <div className="section-mgmt-filters">
        <div className="section-mgmt-search">
          <input
            type="text"
            placeholder="Search by section name..."
            onChange={(e) => handleSearch(e.target.value)}
          />
        </div>
        <div className="section-mgmt-filters-group">
          <select 
            className="section-mgmt-select"
            value={filters.school_year} 
            onChange={(e) => handleFilterChange('school_year', e.target.value)}>
            <option value="">Select School Year</option>
            {schoolYears.map((year) => (
              <option key={year.school_year_id} value={year.school_year}>
                {year.school_year}
              </option>
            ))}
          </select>
          <select
            className="section-mgmt-select"
            value={filters.grade}
            onChange={(e) => handleFilterChange('grade', e.target.value)}
          >
            <option value="">Select Grade Level</option>
            {[7, 8, 9, 10].map((grade) => (
              <option key={grade} value={grade}>Grade {grade}</option>
            ))}
          </select>
          <select
            className="section-mgmt-select"
            value={filters.showArchive}
            onChange={(e) => handleFilterChange('showArchive', e.target.value)}
          >
            <option value="unarchive">Unarchived</option>
            <option value="archive">Archived</option>
          </select>
        </div>
        <button onClick={() => applyFilters(filters)}>
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon>
          </svg>
          Filter
        </button>
      </div>

      <div className="section-mgmt-table-container">
        <table className="section-mgmt-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Section Name</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredSections.map((section, index) => (
              <React.Fragment key={section.section_id}>
                <tr>
                  <td>{index + 1}</td>
                  <td>{section.section_name}</td>
                  <td>
                    <span className={`status-${section.status ? section.status.toLowerCase() : 'active'}`}>
                      {capitalizeStatus(section.status || 'active')}
                    </span>
                  </td>
                  <td>
                    <button 
                      className="section-mgmt-btn section-mgmt-btn-view"
                      onClick={() => handleViewClick(section.section_id)}
                    >
                      View
                    </button>
                    {(roleName !== 'academic_coordinator') && (
                      <button 
                        className="section-mgmt-btn section-mgmt-btn-edit"
                        onClick={() => startEditing(section.section_id)}
                      >
                        Edit
                      </button>
                    )}
                    {(roleName !== 'academic_coordinator') && (
                      <button
                        className="section-mgmt-btn section-mgmt-btn-archive"
                        onClick={() => openArchiveConfirmation(section.section_id, section.status, section.section_name)}
                        disabled={section.hasSched === '1'}
                        style={{
                          opacity: section.hasSched === '1' ? 0.5 : 1,
                          cursor: section.hasSched === '1' ? 'not-allowed' : 'pointer'
                        }}
                      >
                        {section.status === 'inactive' ? 'Unarchive' : 'Archive'}
                      </button>
                    )}
                  </td>
                </tr>
                {selectedSectionId === section.section_id && (
                  <tr>
                    <td colSpan="4">
                      <div className="section-mgmt-details">
                        <table>
                          <tbody>
                            <tr>
                              <th>Section ID:</th>
                              <td>
                                {isEditing ? (
                                  <input
                                    type="text"
                                    name="section_id"
                                    value={editFormData.section_id}
                                    onChange={handleEditChange}
                                    readOnly
                                  />
                                ) : (
                                  sectionDetails.section_id
                                )}
                              </td>
                            </tr>
                            <tr>
                              <th>Section Name:</th>
                              <td>
                                {isEditing ? (
                                  <>
                                    <input
                                      type="text"
                                      name="section_name"
                                      value={editFormData.section_name}
                                      onChange={handleEditChange}
                                      className={!editValidations.section_name ? "input-error" : ""}
                                      required
                                    />
                                    {!editValidations.section_name && errors.section_name && (
                                      <div className="error-message">
                                        {errors.section_name}
                                      </div>
                                    )}
                                    {!editValidations.section_name && !errors.section_name && (
                                      <div className="error-message">
                                        Section name is required
                                      </div>
                                    )}
                                  </>
                                ) : (
                                  sectionDetails.section_name
                                )}
                              </td>
                            </tr>
                            <tr>
                              <th>Grade Level:</th>
                              <td>
                                {isEditing ? (
                                  <select
                                    name="grade_level"
                                    value={editFormData.grade_level}
                                    onChange={handleEditChange}
                                  >
                                    <option value="7">7</option>
                                    <option value="8">8</option>
                                    <option value="9">9</option>
                                    <option value="10">10</option>
                                  </select>
                                ) : (
                                  sectionDetails.grade_level
                                )}
                              </td>
                            </tr>
                            <tr>
                              <th>Status:</th>
                              <td>
                                {isEditing ? (
                                  <select
                                    name="status"
                                    value={editFormData.status || 'active'}
                                    onChange={handleEditChange}
                                  >
                                    <option value="active">Active</option>
                                    <option value="inactive">Inactive</option>
                                  </select>
                                ) : (
                                  <span className={`status-${sectionDetails.status ? sectionDetails.status.toLowerCase() : 'active'}`}>
                                    {capitalizeStatus(sectionDetails.status || 'active')}
                                  </span>
                                )}
                              </td>
                            </tr>
                            <tr>
                              <th>Max Capacity:</th>
                              <td>
                                {isEditing ? (
                                  <>
                                    <input
                                      type="text"
                                      name="max_capacity"
                                      value={editFormData.max_capacity}
                                      onChange={handleEditChange}
                                      className={!editValidations.max_capacity ? "input-error" : ""}
                                      placeholder="Enter a positive number"
                                      required
                                    />
                                    {!editValidations.max_capacity && errors.max_capacity && (
                                      <div className="error-message">
                                        {errors.max_capacity}
                                      </div>
                                    )}
                                    {!editValidations.max_capacity && !errors.max_capacity && (
                                      <div className="error-message">
                                        Max capacity must be a positive number
                                      </div>
                                    )}
                                  </>
                                ) : (
                                  sectionDetails.max_capacity
                                )}
                              </td>
                            </tr>
                            <tr>
                              <th>School Year:</th>
                              <td>
                                {isEditing ? (
                                  <select
                                    name="school_year_id"
                                    value={editFormData.school_year_id}
                                    onChange={handleEditChange}
                                  >
                                    {schoolYears.map((year) => (
                                      <option key={year.school_year_id} value={year.school_year_id}>
                                        {year.school_year}
                                      </option>
                                    ))}
                                  </select>
                                ) : (
                                  sectionDetails.school_year
                                )}
                              </td>
                            </tr>
                            <tr>
                              <th>Room Number:</th>
                              <td>
                                {isEditing ? (
                                  <>
                                    <input
                                      type="text"
                                      name="room_number"
                                      value={editFormData.room_number || ''}
                                      onChange={handleEditChange}
                                      className={!editValidations.room_number ? "input-error" : ""}
                                      placeholder="Alphanumeric, max 10 chars"
                                      required
                                    />
                                    {!editValidations.room_number && errors.room_number && (
                                      <div className="error-message">
                                        {errors.room_number}
                                      </div>
                                    )}
                                    {!editValidations.room_number && !errors.room_number && (
                                      <div className="error-message">
                                        Room number must be alphanumeric, max 10 characters
                                      </div>
                                    )}
                                  </>
                                ) : (
                                  sectionDetails.room_number
                                )}
                              </td>
                            </tr>
                          </tbody>
                        </table>
                        {isEditing && (
                          <div className="section-mgmt-modal-actions">
                            <button className="section-mgmt-btn section-mgmt-btn-edit" onClick={saveChanges}>
                              Save
                            </button>
                            <button className="section-mgmt-btn section-mgmt-btn-archive" onClick={cancelEditing}>
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
        <div className="section-mgmt-modal">
          <div className="section-mgmt-modal-content">
            <h2>Add New Section</h2>
            <div className="section-mgmt-form-group">
              <label>Section Name: <span className="required-asterisk">*</span></label>
              <input
                type="text"
                name="section_name"
                value={newSectionData.section_name}
                onChange={handleAddChange}
                className={!validations.section_name ? "input-error" : ""}
                required
              />
              {!validations.section_name && (
                <div className="error-message">
                  Section name is required
                </div>
              )}
              {errors.section_name && (
                <div className="error-message">
                  {errors.section_name}
                </div>
              )}
            </div>
            <div className="section-mgmt-form-group">
              <label>Grade Level: <span className="required-asterisk">*</span></label>
              <select
                name="grade_level"
                value={newSectionData.grade_level}
                onChange={handleAddChange}
              >
                <option value="7">7</option>
                <option value="8">8</option>
                <option value="9">9</option>
                <option value="10">10</option>
              </select>
            </div>
            <div className="section-mgmt-form-group">
              <label>Status: <span className="required-asterisk">*</span></label>
              <select
                name="status"
                value={newSectionData.status}
                onChange={handleAddChange}
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
            <div className="section-mgmt-form-group">
              <label>Max Capacity: <span className="required-asterisk">*</span></label>
              <input
                type="text"
                name="max_capacity"
                value={newSectionData.max_capacity}
                onChange={handleAddChange}
                className={!validations.max_capacity ? "input-error" : ""}
                placeholder="Enter a positive number"
                required
              />
              {!validations.max_capacity && errors.max_capacity && (
                <div className="error-message">
                  {errors.max_capacity}
                </div>
              )}
              {!validations.max_capacity && !errors.max_capacity && (
                <div className="error-message">
                  Max capacity must be a positive number
                </div>
              )}
            </div>
            <div className="section-mgmt-form-group">
              <label>School Year: <span className="required-asterisk">*</span></label>
              <select
                name="school_year_id"
                value={newSectionData.school_year_id}
                onChange={handleAddChange}
              >
                {schoolYears.map((year) => (
                  <option key={year.school_year_id} value={year.school_year_id}>
                    {year.school_year}
                  </option>
                ))}
              </select>
            </div>
            <div className="section-mgmt-form-group">
              <label>Room Number: <span className="required-asterisk">*</span></label>
              <input
                type="text"
                name="room_number"
                value={newSectionData.room_number}
                onChange={handleAddChange}
                className={!validations.room_number ? "input-error" : ""}
                placeholder="Alphanumeric, max 10 chars"
                required
              />
              {!validations.room_number && errors.room_number && (
                <div className="error-message">
                  {errors.room_number}
                </div>
              )}
              {!validations.room_number && !errors.room_number && (
                <div className="error-message">
                  Room number must be alphanumeric, max 10 characters
                </div>
              )}
            </div>
            <div className="section-mgmt-modal-actions">
              <button className="section-mgmt-btn section-mgmt-btn-edit" onClick={saveNewSection}>
                Save
              </button>
              <button className="section-mgmt-btn section-mgmt-btn-archive" onClick={cancelAdding}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {showArchiveModal && (
        <div className="section-mgmt-modal">
          <div className="section-mgmt-modal-content">
            <h2>{archiveAction.currentStatus === 'inactive' ? 'Unarchive' : 'Archive'} Section</h2>
            <p className="section-mgmt-confirmation-message">
              Are you sure you want to {archiveAction.currentStatus === 'inactive' ? 'unarchive' : 'archive'} the section <strong>{archiveAction.sectionName}</strong>?
              {archiveAction.currentStatus !== 'inactive' && (
                <span className="section-mgmt-archive-warning">
                  Archived sections won't be available for scheduling and other operations.
                </span>
              )}
            </p>
            <div className="section-mgmt-modal-actions">
              <button 
                className="section-mgmt-btn section-mgmt-btn-edit" 
                onClick={() => toggleArchiveStatus(archiveAction.sectionId, archiveAction.currentStatus)}
              >
                Confirm
              </button>
              <button 
                className="section-mgmt-btn section-mgmt-btn-archive" 
                onClick={cancelArchiveAction}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default SectionManagement;
