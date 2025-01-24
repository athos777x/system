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
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newSchedule, setNewSchedule] = useState({
    subject_name: '',
    time_start: '',
    time_end: '',
    day: '',
    teacher_id: ''
  });

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

  const startAdding = () => {
    setIsModalOpen(true);
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
      fetchSectionSchedules(selectedSectionId);
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
      fetchSectionSchedules(selectedSectionId);
    } catch (error) {
      console.error('There was an error approving the schedule!', error);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewSchedule({ ...newSchedule, [name]: value });
  };

  const handleAddSchedule = async () => {
    try {
      await axios.post('http://localhost:3001/schedules', newSchedule);
      fetchSectionSchedules(selectedSectionId);
      setIsModalOpen(false);
    } catch (error) {
      console.error('Error adding schedule:', error);
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
      <div className="section-add-section-button-container">
        <button className="section-add-section-button" onClick={startAdding}>Add New Schedule</button>
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
          {filteredSections.length > 0 ? (
            filteredSections.map((section, index) => (
              <React.Fragment key={section.section_id}>
                <tr>
                  <td>{index + 1}</td>
                  <td>Section {section.section_name}</td>
                  <td>Grade {section.grade_level}</td>
                  <td>{section.status.charAt(0).toUpperCase() + section.status.slice(1)}</td>
                  <td>
                    <button className="schedule-view-button" onClick={() => handleViewClick(section.section_id)}>View</button>
                  </td>
                </tr>
                {selectedSectionId === section.section_id && (
                  <tr>
                    <td colSpan="5">
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
                                        <button className="schedule-edit-button" onClick={() => startEditing(schedule)}>Edit</button>
                                        {schedule.schedule_status === 'Pending Approval' && (
                                          <button className="schedule-approve-button" onClick={() => handleApproveClick(schedule.schedule_id)}>Approve</button>
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
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))
          ) : (
            <tr>
              <td colSpan="5" style={{ textAlign: 'center' }}>No sections available.</td>
            </tr>
          )}
        </tbody>
      </table>
      {isModalOpen && (
        <div className="section-modal">
          <div className="section-modal-content">
            <h2>Add New Schedule</h2>
            <input
              type="text"
              name="subject_name"
              placeholder="Subject Name"
              value={newSchedule.subject_name}
              onChange={handleInputChange}
            />
            <input
              type="time"
              name="time_start"
              placeholder="Start Time"
              value={newSchedule.time_start}
              onChange={handleInputChange}
            />
            <input
              type="time"
              name="time_end"
              placeholder="End Time"
              value={newSchedule.time_end}
              onChange={handleInputChange}
            />
            <input
              type="text"
              name="day"
              placeholder="Day"
              value={newSchedule.day}
              onChange={handleInputChange}
            />
            <input
              type="number"
              name="teacher_id"
              placeholder="Teacher ID"
              value={newSchedule.teacher_id}
              onChange={handleInputChange}
            />
            <button onClick={handleAddSchedule}>Add Schedule</button>
            <button onClick={() => setIsModalOpen(false)}>Close</button>
          </div>
        </div>
      )}
    </div>
  );
}

export default Principal_SchedulePage;
