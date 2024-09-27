import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import ScheduleSearchFilter from '../RoleSearchFilters/ScheduleSearchFilter';
import '../CssPage/Principal_SchedulePage.css';

function Principal_SchedulePage() {
  const [sections, setSections] = useState([]);
  const [filteredSections, setFilteredSections] = useState([]);
  const [selectedSectionId, setSelectedSectionId] = useState(null);
  const [sectionSchedules, setSectionSchedules] = useState([]);
  const [filters, setFilters] = useState({
    searchTerm: '',
    grade: '',
    section: ''
  });
  const [isEditing, setIsEditing] = useState(false);
  const [editFormData, setEditFormData] = useState({});

  const fetchSections = useCallback(async () => {
    try {
      const response = await axios.get('http://localhost:3001/sections');
      setSections(response.data);
      setFilteredSections(response.data);
    } catch (error) {
      console.error('There was an error fetching the sections!', error);
    }
  }, []);

  useEffect(() => {
    fetchSections();
  }, [fetchSections]);

  const applyFilters = (updatedFilters) => {
    setFilters(updatedFilters);
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

    setFilteredSections(filtered);
  };

  const handleApplyFilters = (filters) => {
    applyFilters(filters);
  };

  const handleViewClick = async (sectionId) => {
    if (selectedSectionId === sectionId) {
      setSelectedSectionId(null);
      setSectionSchedules([]);
      setIsEditing(false);
    } else {
      setSelectedSectionId(sectionId);
      setIsEditing(false);
      fetchSectionSchedules(sectionId);
    }
  };

  const fetchSectionSchedules = async (sectionId) => {
    try {
      const response = await axios.get(`http://localhost:3001/sections/${sectionId}/schedules`);
      setSectionSchedules(response.data);
    } catch (error) {
      console.error('There was an error fetching the section schedules!', error);
    }
  };

  const startEditing = (schedule) => {
    setIsEditing(true);
    setEditFormData(schedule);
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
      const { schedule_id, teacher_id, time_start, time_end, day, schedule_status } = editFormData;
      await axios.put(`http://localhost:3001/schedules/${schedule_id}`, {
        teacher_id,
        time_start,
        time_end,
        day,
        schedule_status
      });
      fetchSectionSchedules(selectedSectionId); // Refresh the schedules list
      setIsEditing(false);
    } catch (error) {
      console.error('Error saving schedule details:', error);
    }
  };

  const cancelEditing = () => {
    setIsEditing(false);
  };

  const handleApproveClick = async (scheduleId) => {
    try {
      await axios.put(`http://localhost:3001/schedules/${scheduleId}/approve`, { schedule_status: 'Approved' });
      fetchSectionSchedules(selectedSectionId); // Refresh the schedules list
    } catch (error) {
      console.error('There was an error approving the schedule!', error);
    }
  };

  return (
    <div className="schedule-container">
      <h1 className="schedule-title">Schedule</h1>
      <div className="schedule-search-filter-container">
        <ScheduleSearchFilter
          handleApplyFilters={handleApplyFilters}
          grades={['7', '8', '9', '10']}
          sections={sections}
        />
      </div>
      <div className="schedule-sectionlist-list">
        {filteredSections.length > 0 ? (
          filteredSections.map((section, index) => (
            <div key={section.section_id} className="schedule-sectionlist-item-container">
              <div className="schedule-sectionlist-item">
                <p className="schedule-sectionlist-name">
                  {index + 1}. Section {section.section_name}
                </p>
                <span className="schedule-sectionlist-info">Grade: {section.grade_level} - {section.status.charAt(0).toUpperCase() + section.status.slice(1)}</span>
                <div className="schedule-sectionlist-actions">
                  <button className="schedule-sectionlist-view-button" onClick={() => handleViewClick(section.section_id)}>View</button>
                </div>
              </div>
              {selectedSectionId === section.section_id && (
                <div className="schedule-sectionlist-details">
                  <h2 className="schedule-subtitle">Schedules</h2>
                  <table className="schedule-table">
                    <thead>
                      <tr>
                        <th>Subject</th>
                        <th>Time Start</th>
                        <th>Time End</th>
                        <th>Day</th>
                        <th>Teacher ID</th>
                        <th>Status</th>
                        <th className="actions-column">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sectionSchedules.length > 0 ? (
                        sectionSchedules.map(schedule => (
                          <tr key={schedule.schedule_id}>
                            {isEditing && editFormData.schedule_id === schedule.schedule_id ? (
                              <>
                                <td>{schedule.subject_name}</td>
                                <td>
                                  <input
                                    type="time"
                                    name="time_start"
                                    value={editFormData.time_start}
                                    onChange={handleEditChange}
                                  />
                                </td>
                                <td>
                                  <input
                                    type="time"
                                    name="time_end"
                                    value={editFormData.time_end}
                                    onChange={handleEditChange}
                                  />
                                </td>
                                <td>
                                  <input
                                    type="text"
                                    name="day"
                                    value={editFormData.day}
                                    onChange={handleEditChange}
                                  />
                                </td>
                                <td>
                                  <input
                                    type="number"
                                    name="teacher_id"
                                    value={editFormData.teacher_id}
                                    onChange={handleEditChange}
                                  />
                                </td>
                                <td>
                                  <select
                                    name="schedule_status"
                                    value={editFormData.schedule_status}
                                    onChange={handleEditChange}
                                  >
                                    <option value="Approved">Approved</option>
                                    <option value="Pending Approval">Pending Approval</option>
                                  </select>
                                </td>
                                <td className="actions-column">
                                  <button className="save-button" onClick={saveChanges}>Save</button>
                                  <button className="cancel-button" onClick={cancelEditing}>Cancel</button>
                                </td>
                              </>
                            ) : (
                              <>
                                <td>{schedule.subject_name}</td>
                                <td>{schedule.time_start}</td>
                                <td>{schedule.time_end}</td>
                                <td>{schedule.day}</td>
                                <td>{schedule.teacher_id}</td>
                                <td>{schedule.schedule_status}</td>
                                <td className="actions-column">
                                  <button className="edit-button" onClick={() => startEditing(schedule)}>Edit</button>
                                  {schedule.schedule_status === 'Pending Approval' && (
                                    <button className="approve-button" onClick={() => handleApproveClick(schedule.schedule_id)}>Approve</button>
                                  )}
                                </td>
                              </>
                            )}
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="7" style={{ textAlign: 'center' }}>No schedules available</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          ))
        ) : (
          <p>No sections available.</p>
        )}
      </div>
    </div>
  );
}

export default Principal_SchedulePage;
