import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import ScheduleSearchFilter from '../RoleSearchFilters/ScheduleSearchFilter';
import '../CssPage/Principal_SchedulePage.css';

function Principal_SchedulePage() {
  const [sections, setSections] = useState([]);
  const [filteredSections, setFilteredSections] = useState([]);
  const [selectedSectionId, setSelectedSectionId] = useState(null);
  const [sectionSchedules, setSectionSchedules] = useState([]);
  const [schoolYears, setSchoolYears] = useState([]);
  const [filters, setFilters] = useState({
    searchTerm: '',
    grade: '',
    section: '',
    schoolYear: ''
  });
  const [isEditing, setIsEditing] = useState(false);
  const [editFormData, setEditFormData] = useState({});
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newSchedule, setNewSchedule] = useState({
    subject_id: '',
    time_start: '',
    time_end: '',
    day: '',
    teacher_id: '',
    section_id: ''
  });
  const [subjects, setSubjects] = useState([]);
  const [filteredSubjects, setFilteredSubjects] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [roleName, setRoleName] = useState('');

  const fetchSections = useCallback(async () => {
    try {
      const response = await axios.get('http://localhost:3001/sections');
      setSections(response.data);
      setFilteredSections(response.data);
    } catch (error) {
      console.error('There was an error fetching the sections!', error);
    }
  }, []);

  const fetchSchoolYears = useCallback(async () => {
    try {
      const response = await axios.get('http://localhost:3001/api/school_years');
      setSchoolYears(response.data.map(sy => sy.school_year));
    } catch (error) {
      console.error('There was an error fetching the school years!', error);
    }
  }, []);

  useEffect(() => {
    fetchSections();
    fetchSchoolYears();
  }, [fetchSections, fetchSchoolYears]);

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

    if (updatedFilters.schoolYear) {
      filtered = filtered.filter(section => section.school_year === updatedFilters.schoolYear);
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

  const startAdding = async () => {
    try {
      const [subjectsResponse, sectionsResponse, teachersResponse] = await Promise.all([
        axios.get('http://localhost:3001/subjects', {
          params: { archive_status: 'unarchive' }
        }),
        axios.get('http://localhost:3001/sections'),
        axios.get('http://localhost:3001/employees', {
          params: { status: 'active', archive_status: 'unarchive' }
        })
      ]);
      console.log('Fetched subjects:', subjectsResponse.data);
      setSubjects(subjectsResponse.data);
      setFilteredSubjects([]); // Reset filtered subjects
      setSections(sectionsResponse.data);
      setTeachers(teachersResponse.data);
      setNewSchedule({
        subject_id: '',
        time_start: '',
        time_end: '',
        day: '',
        teacher_id: '',
        section_id: ''
      });
      setIsModalOpen(true);
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  const startEditing = async (schedule) => {
    try {
      const teachersResponse = await axios.get('http://localhost:3001/employees', {
        params: { status: 'active', archive_status: 'unarchive' }
      });
      setTeachers(teachersResponse.data);
      setIsEditing(true);
      setEditFormData(schedule);
    } catch (error) {
      console.error('Error fetching teachers:', error);
    }
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

    // When section is selected, filter subjects by grade level
    if (name === 'section_id' && value) {
      const selectedSection = sections.find(section => section.section_id === Number(value));
      console.log('Selected section:', selectedSection);
      if (selectedSection) {
        const sectionGrade = selectedSection.grade_level;
        console.log('Section grade:', sectionGrade);
        console.log('All subjects:', subjects);
        const filteredSubjects = subjects.filter(subject => 
          String(subject.grade_level) === String(sectionGrade)
        );
        console.log('Filtered subjects:', filteredSubjects);
        setFilteredSubjects(filteredSubjects);
      } else {
        setFilteredSubjects([]);
      }
    }
  };

  const handleAddSchedule = async () => {
    try {
      // Validate all required fields
      if (!newSchedule.section_id || !newSchedule.subject_id || !newSchedule.time_start || 
          !newSchedule.time_end || !newSchedule.day || !newSchedule.teacher_id) {
        alert('Please fill in all required fields');
        return;
      }

      // Add schedule_status as Pending Approval
      const scheduleData = {
        ...newSchedule,
        schedule_status: 'Pending Approval'
      };
      
      // Convert IDs to numbers
      scheduleData.subject_id = Number(scheduleData.subject_id);
      scheduleData.section_id = Number(scheduleData.section_id);
      scheduleData.teacher_id = Number(scheduleData.teacher_id);
      
      await axios.post('http://localhost:3001/api/schedules', scheduleData);
      if (selectedSectionId) {
        fetchSectionSchedules(selectedSectionId);
      }
      setIsModalOpen(false);
    } catch (error) {
      console.error('Error adding schedule:', error);
      alert('Error adding schedule. Please check all fields are filled correctly.');
    }
  };

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
    <div className="schedule-container">
      <h1 className="schedule-title">Schedule</h1>
      <div className="schedule-search-filter-container">
        <ScheduleSearchFilter
          handleApplyFilters={handleApplyFilters}
          grades={['7', '8', '9', '10']}
          sections={sections}
          schoolYears={schoolYears}
        />
      </div>
      <div className="section-add-section-button-container">
        {(roleName !== 'principal') &&(
        <button className="section-add-section-button" onClick={startAdding}>Add New Schedule</button>
        )}
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
                              <th>Teacher</th>
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
                                        <select
                                          name="day"
                                          value={editFormData.day}
                                          onChange={handleEditChange}
                                        >
                                          <option value="Monday">Monday</option>
                                          <option value="Tuesday">Tuesday</option>
                                          <option value="Wednesday">Wednesday</option>
                                          <option value="Thursday">Thursday</option>
                                          <option value="Friday">Friday</option>
                                        </select>
                                      </td>
                                      <td>
                                        <select
                                          name="teacher_id"
                                          value={editFormData.teacher_id}
                                          onChange={handleEditChange}
                                          required
                                        >
                                          <option value="">Select Teacher</option>
                                          {teachers.map((teacher) => (
                                            <option key={teacher.employee_id} value={teacher.employee_id}>
                                              {teacher.firstname} {teacher.middlename ? `${teacher.middlename[0]}.` : ''} {teacher.lastname}
                                            </option>
                                          ))}
                                        </select>
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
                                        <button className="schedule-save-button" onClick={saveChanges}>Save</button>
                                        <button className="schedule-cancel-button" onClick={cancelEditing}>Cancel</button>
                                      </td>
                                    </>
                                  ) : (
                                    <>
                                      <td>{schedule.subject_name}</td>
                                      <td>{schedule.time_start}</td>
                                      <td>{schedule.time_end}</td>
                                      <td>{schedule.day}</td>
                                      <td>{schedule.teacher_name}</td>
                                      <td>{schedule.schedule_status}</td>
                                      <td className="actions-column">
                                        {schedule.schedule_status === 'Pending Approval' && (
                                          <>
                                            <button className="schedule-edit-button" onClick={() => startEditing(schedule)}>Edit</button>
                                            <button className="schedule-edit-button" onClick={() => handleApproveClick(schedule.schedule_id)}>Approve</button>
                                          </>
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
            <select
              name="section_id"
              value={newSchedule.section_id}
              onChange={handleInputChange}
              required
            >
              <option value="">Select Section</option>
              {sections.map((section) => (
                <option key={section.section_id} value={section.section_id}>
                  Section {section.section_name} (Grade {section.grade_level})
                </option>
              ))}
            </select>
            <select
              name="subject_id"
              value={newSchedule.subject_id}
              onChange={handleInputChange}
              required
              disabled={!newSchedule.section_id}
            >
              <option value="">Select Subject</option>
              {filteredSubjects.map((subject) => (
                <option key={subject.subject_id} value={subject.subject_id}>
                  {subject.subject_name} (Grade {subject.grade_level})
                </option>
              ))}
            </select>
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
            <select
              name="day"
              value={newSchedule.day}
              onChange={handleInputChange}
            >
              <option value="">Select Day</option>
              <option value="Monday">Monday</option>
              <option value="Tuesday">Tuesday</option>
              <option value="Wednesday">Wednesday</option>
              <option value="Thursday">Thursday</option>
              <option value="Friday">Friday</option>
            </select>
            <select
              name="teacher_id"
              value={newSchedule.teacher_id}
              onChange={handleInputChange}
              required
            >
              <option value="">Select Teacher</option>
              {teachers.map((teacher) => (
                <option key={teacher.employee_id} value={teacher.employee_id}>
                  {teacher.firstname} {teacher.middlename ? `${teacher.middlename[0]}.` : ''} {teacher.lastname}
                </option>
              ))}
            </select>
            <div className="button-container">
              <button onClick={handleAddSchedule}>Add Schedule</button>
              <button onClick={() => setIsModalOpen(false)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Principal_SchedulePage;
