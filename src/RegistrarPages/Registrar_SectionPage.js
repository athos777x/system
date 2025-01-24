import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import SectionSearchFilter from '../RoleSearchFilters/SectionSearchFilter'; 
import '../RegistrarPagesCss/Registrar_SectionPage.css';

function Registrar_SectionPage() {
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
  const [newSectionData, setNewSectionData] = useState({
    section_name: '',
    grade_level: '7',
    status: 'active',
    max_capacity: '',
    school_year_id: '',
    room_number: '',
    archive_status: 'unarchive' // Default value
  });

  const fetchActiveSchoolYear = useCallback(async () => {
    try {
      const response = await axios.get('http://localhost:3001/school-years/active');
      setActiveSchoolYear(response.data.school_year);
      return response.data;
    } catch (error) {
      console.error('There was an error fetching the active school year!', error);
      return null;
    }
  }, []);

  const fetchSections = useCallback(async (schoolYearId) => {
    try {
      const response = await axios.get('http://localhost:3001/sections', {
        params: { schoolYearId }
      });
      setSections(response.data);
      setFilteredSections(response.data.filter(section => section.archive_status === filters.showArchive));
    } catch (error) {
      console.error('There was an error fetching the sections!', error);
    }
  }, [filters.showArchive]);

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

  useEffect(() => {
    async function loadSections() {
      const activeYear = await fetchActiveSchoolYear();
      if (activeYear) {
        fetchSections(activeYear.school_year_id);
      }
    }
    loadSections();
    fetchSchoolYears();
  }, [fetchActiveSchoolYear, fetchSections, fetchSchoolYears]);

  const applyFilters = (updatedFilters) => {
    console.log('Updated filters:', updatedFilters);
    let filtered = sections;

    if (updatedFilters.searchTerm) {
      filtered = filtered.filter(section =>
        section.section_name.toLowerCase().includes(updatedFilters.searchTerm.toLowerCase())
      );
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

  const handleApplyFilters = (filters) => {
    setFilters(filters);
    applyFilters(filters);
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
    const section = sections.find(sec => sec.section_id === sectionId);
    console.log('Section to edit:', section); // Log section details to edit
    setEditFormData(section);
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
      const { school_year_id, ...updateData } = editFormData;
      console.log('Saving changes:', updateData); // Log changes to save
      await axios.put(`http://localhost:3001/sections/${selectedSectionId}`, updateData);
      fetchSections(activeSchoolYear);
      fetchSectionDetails(selectedSectionId);
      setIsEditing(false);
    } catch (error) {
      console.error('Error saving section details:', error);
    }
  };

  const toggleArchiveStatus = async (sectionId, currentStatus) => {
    try {
      const newStatus = currentStatus === 'inactive' ? 'active' : 'inactive';
      const newArchiveStatus = currentStatus === 'inactive' ? 'unarchive' : 'archive';
      await axios.put(`http://localhost:3001/sections/${sectionId}/archive`, { status: newStatus, archive_status: newArchiveStatus });
      fetchSections(activeSchoolYear);
    } catch (error) {
      console.error(`Error changing status:`, error);
    }
  };

  const cancelEditing = () => {
    setIsEditing(false);
    fetchSectionDetails(selectedSectionId);
  };

  const startAdding = () => {
    setIsAdding(true);
    setNewSectionData({
      section_name: '',
      grade_level: '7',
      status: 'active',
      max_capacity: '',
      school_year_id: schoolYears.length > 0 ? schoolYears[0].school_year_id : '',
      room_number: '',
      archive_status: 'unarchive' // Default value
    });
    setShowModal(true);
  };

  const handleAddChange = (event) => {
    const { name, value } = event.target;
    setNewSectionData(prevFormData => ({
      ...prevFormData,
      [name]: value
    }));
  };

  const saveNewSection = async () => {
    try {
      console.log('New section data:', newSectionData);
      await axios.post('http://localhost:3001/sections', newSectionData);
      fetchSections(activeSchoolYear);
      setIsAdding(false);
      setShowModal(false);
    } catch (error) {
      console.error('Error adding new section:', error);
    }
  };

  const cancelAdding = () => {
    setIsAdding(false);
    setShowModal(false);
  };

  const capitalizeStatus = (status) => {
    if (!status) return '';
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  return (
    <div className="section-container">
      <h1 className="section-title">Section Management</h1>
      <div className="section-search-filter-container">
        <SectionSearchFilter
          handleApplyFilters={handleApplyFilters}
          grades={getUniqueGrades(sections)}
          sections={sections}
        />
      </div>
      <div className="section-add-section-button-container">
        <button className="section-add-section-button" onClick={startAdding}>Add New Section</button>
      </div>
      <table className="attendance-table">
        <thead>
          <tr>
            <th>#</th>
            <th>Section Name</th>
            <th>Grade Level</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {filteredSections.map((section, index) => (
            <React.Fragment key={section.section_id}>
              <tr>
                <td>{index + 1}</td>
                <td>Section {section.section_name}</td>
                <td>Grade {section.grade_level}</td>
                <td>{capitalizeStatus(section.status)}</td>
                <td>
                  <button className="section-view-button" onClick={() => handleViewClick(section.section_id)}>View</button>
                  <button className="section-edit-button" onClick={() => startEditing(section.section_id)}>Edit</button>
                  <button
                    className="section-archive-button"
                    onClick={() => toggleArchiveStatus(section.section_id, section.status)}
                  >
                    {section.status === 'inactive' ? 'Unarchive' : 'Archive'}
                  </button>
                </td>
              </tr>
              {selectedSectionId === section.section_id && (
                <tr>
                  <td colSpan="5">
                    <div className="section-details">
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
                                <input
                                  type="text"
                                  name="section_name"
                                  value={editFormData.section_name}
                                  onChange={handleEditChange}
                                />
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
                                  value={editFormData.status}
                                  onChange={handleEditChange}
                                >
                                  <option value="active">Active</option>
                                  <option value="inactive">Inactive</option>
                                </select>
                              ) : (
                                capitalizeStatus(sectionDetails.status)
                              )}
                            </td>
                          </tr>
                          <tr>
                            <th>Max Capacity:</th>
                            <td>
                              {isEditing ? (
                                <input
                                  type="text"
                                  name="max_capacity"
                                  value={editFormData.max_capacity}
                                  onChange={handleEditChange}
                                />
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
                                <input
                                  type="text"
                                  name="room_number"
                                  value={editFormData.room_number || ''}
                                  onChange={handleEditChange}
                                />
                              ) : (
                                sectionDetails.room_number
                              )}
                            </td>
                          </tr>
                        </tbody>
                      </table>
                      {isEditing && (
                        <div className="section-edit-buttons">
                          <button className="section-save-button" onClick={saveChanges}>Save</button>
                          <button className="section-cancel-button" onClick={cancelEditing}>Cancel</button>
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

      {showModal && (
        <div className="section-modal">
          <div className="section-modal-content">
            <h2>Add New Section</h2>
            <label>
              Section Name:
              <input
                type="text"
                name="section_name"
                value={newSectionData.section_name}
                onChange={handleAddChange}
              />
            </label>
            <label>
              Grade Level:
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
            </label>
            <label>
              Status:
              <select
                name="status"
                value={newSectionData.status}
                onChange={handleAddChange}
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </label>
            <label>
              Max Capacity:
              <input
                type="text"
                name="max_capacity"
                value={newSectionData.max_capacity}
                onChange={handleAddChange}
              />
            </label>
            <label>
              School Year:
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
            </label>
            <label>
              Room Number:
              <input
                type="text"
                name="room_number"
                value={newSectionData.room_number}
                onChange={handleAddChange}
              />
            </label>
            <div className="section-button-group">
              <button className="section-save-button" onClick={saveNewSection}>Save</button>
              <button className="section-cancel-button" onClick={cancelAdding}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Registrar_SectionPage;
