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
    day: [],
    teacher_id: '',
    section_id: ''
  });
  const [subjects, setSubjects] = useState([]);
  const [filteredSubjects, setFilteredSubjects] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [roleName, setRoleName] = useState('');

  // Helper function to sort days in chronological order
  const sortDays = (days) => {
    const dayOrder = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
    return days.sort((a, b) => dayOrder.indexOf(a) - dayOrder.indexOf(b));
  };

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
    console.log('View clicked for section:', sectionId);
    if (selectedSectionId === sectionId) {
      setSelectedSectionId(null);
      setSectionSchedules([]);
      setIsEditing(false);
    } else {
      setSelectedSectionId(sectionId);
      setIsEditing(false);
      await fetchSectionSchedules(sectionId);
    }
  };

  const fetchSectionSchedules = async (sectionId) => {
    try {
      console.log('Fetching schedules for section:', sectionId);
      const response = await axios.get(`http://localhost:3001/sections/${sectionId}/schedules`);
      console.log('Raw response data:', response.data);
      
      // Handle both single day and array formats
      const schedulesWithParsedDays = response.data.map(schedule => {
        let parsedDay;
        try {
          // If the day is already a string and doesn't start with [, treat it as a single day
          if (typeof schedule.day === 'string' && !schedule.day.startsWith('[')) {
            parsedDay = [schedule.day];
          } else {
            // Try to parse as JSON array
            parsedDay = typeof schedule.day === 'string' ? 
              JSON.parse(schedule.day) : 
              Array.isArray(schedule.day) ? schedule.day : [schedule.day];
          }
          // Sort days after parsing
          parsedDay = sortDays([...parsedDay]);
        } catch (error) {
          console.error('Error parsing day for schedule:', schedule);
          console.error('Parse error:', error);
          // Fallback to single day if parsing fails
          parsedDay = [schedule.day];
        }

        return {
          ...schedule,
          day: parsedDay
        };
      });
      
      console.log('Processed schedules:', schedulesWithParsedDays);
      setSectionSchedules(schedulesWithParsedDays);
    } catch (error) {
      console.error('Error fetching section schedules:', error);
      console.error('Error details:', error.response?.data);
    }
  };

  const startAdding = async () => {
    try {
      // Find the selected section to get its grade level
      const selectedSection = sections.find(
        (section) => section.section_id === Number(newSchedule.section_id)
      );
      const gradeLevel = selectedSection ? selectedSection.grade_level : null;
  
      // if (!gradeLevel) {
      //   alert('Please select a section first to determine the grade level.');
      //   return;
      // }
  
      // Fetch subjects based on grade level
      const [subjectsResponse, sectionsResponse, teachersResponse] = await Promise.all([
        axios.get(`http://localhost:3001/subjects-for-assignment/${gradeLevel}`),
        axios.get('http://localhost:3001/sections'),
        axios.get('http://localhost:3001/employees', {
          params: { status: 'active', archive_status: 'unarchive' }
        }),
      ]);
  
      console.log('Fetched subjects:', subjectsResponse.data);
      setSubjects(subjectsResponse.data);
      setFilteredSubjects([]); // Reset filtered subjects
      setSections(sectionsResponse.data);
      setTeachers(teachersResponse.data);
  
      // Reset the schedule form
      setNewSchedule({
        subject_id: '',
        time_start: '',
        time_end: '',
        day: [],
        teacher_id: '',
        section_id: ''
      });
  
      // Open the modal for adding a new schedule
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
      // Make sure day is an array when starting to edit
      setEditFormData({
        ...schedule,
        day: Array.isArray(schedule.day) ? schedule.day : JSON.parse(schedule.day)
      });
    } catch (error) {
      console.error('Error fetching teachers:', error);
    }
  };

  const handleEditChange = (event) => {
    const { name, value } = event.target;
    
    if (name === 'day') {
      // Handle checkbox selection for edit mode
      const day = event.target.value;
      const isChecked = event.target.checked;
      const currentDays = editFormData.day || [];
      
      setEditFormData(prev => ({
        ...prev,
        day: isChecked 
          ? [...currentDays, day]
          : currentDays.filter(d => d !== day)
      }));
    } else {
      setEditFormData(prevFormData => ({
        ...prevFormData,
        [name]: value
      }));
    }
  };

  const saveChanges = async () => {
    try {
      const { schedule_id, teacher_id, time_start, time_end, day, schedule_status } = editFormData;
      
      // Sort days before storing
      const sortedDays = sortDays([...day]);

      await axios.put(`http://localhost:3001/schedules/${schedule_id}`, {
        teacher_id,
        time_start,
        time_end,
        // If only one day is selected, send as string, otherwise as JSON array
        day: sortedDays.length === 1 ? sortedDays[0] : JSON.stringify(sortedDays),
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
    
    if (name === 'day') {
      // Handle checkbox selection
      const day = e.target.value;
      const isChecked = e.target.checked;
      
      setNewSchedule(prev => ({
        ...prev,
        day: isChecked 
          ? [...prev.day, day]  // Add day if checked
          : prev.day.filter(d => d !== day)  // Remove day if unchecked
      }));
    } else {
      setNewSchedule({ ...newSchedule, [name]: value });
    }

    // When section is selected, filter subjects by grade level
    if (name === 'section_id' && value) {
      const selectedSection = sections.find(section => section.section_id === Number(value));
      if (selectedSection) {
        const sectionGrade = selectedSection.grade_level;
        const filteredSubjects = subjects.filter(subject => 
          String(subject.grade_level) === String(sectionGrade)
        );
        setFilteredSubjects(filteredSubjects);
      } else {
        setFilteredSubjects([]);
      }
    }
  };

  const handleAddSchedule = async () => {
    try {
      // Validate all required fields
      if (
        !newSchedule.section_id ||
        !newSchedule.subject_id ||
        !newSchedule.time_start ||
        !newSchedule.time_end ||
        newSchedule.day.length === 0 ||
        !newSchedule.teacher_id
      ) {
        alert('Please fill in all required fields');
        return;
      }
  
      // Find the grade level based on the selected section
      const selectedSection = sections.find(
        (section) => section.section_id === Number(newSchedule.section_id)
      );
      const grade_level = selectedSection ? selectedSection.grade_level : null;
  
      if (!grade_level) {
        alert('Grade level information is missing for the selected section.');
        return;
      }
  
      // Find the subject type (subject or elective)
      const selectedSubject = filteredSubjects.find(
        (subject) => subject.subject_id === Number(newSchedule.subject_id)
      );
      const isElective = selectedSubject?.type === 'elective' ? 1 : 0;
  
      // Sort days before storing
      const sortedDays = sortDays([...newSchedule.day]);
  
      // Prepare schedule data
      const scheduleData = {
        ...newSchedule,
        schedule_status: 'Pending Approval',
        grade_level,
        elective: isElective, // Add elective field
        day: sortedDays.length === 1 ? sortedDays[0] : JSON.stringify(sortedDays),
      };
  
      // Convert IDs to numbers
      scheduleData.subject_id = Number(scheduleData.subject_id);
      scheduleData.section_id = Number(scheduleData.section_id);
      scheduleData.teacher_id = Number(scheduleData.teacher_id);
  
      // Send data to the backend
      await axios.post('http://localhost:3001/api/schedules', scheduleData);
  
      // Refresh the schedule list if a section is selected
      if (selectedSectionId) {
        fetchSectionSchedules(selectedSectionId);
      }
  
      // Close the modal after successful submission
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
                            {sectionSchedules && sectionSchedules.length > 0 ? (
                              sectionSchedules.map(schedule => {
                                console.log('Rendering schedule:', schedule);
                                return (
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
                                          <div className="day-checkboxes">
                                            {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'].map(day => (
                                              <label key={day} className="day-checkbox-label">
                                                <input
                                                  type="checkbox"
                                                  name="day"
                                                  value={day}
                                                  checked={(editFormData.day || []).includes(day)}
                                                  onChange={handleEditChange}
                                                />
                                                {day}
                                              </label>
                                            ))}
                                          </div>
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
                                        <td>{Array.isArray(schedule.day) ? schedule.day.join(', ') : schedule.day}</td>
                                        <td>{schedule.teacher_name}</td>
                                        <td>{schedule.schedule_status}</td>
                                        <td className="actions-column">
                                          {schedule.schedule_status === 'Pending Approval' && (
                                            <>
                                              <button className="schedule-edit-button" onClick={() => startEditing(schedule)}>Edit</button>
                                              {(roleName !== 'academic_coordinator') && (
                                                <button className="schedule-edit-button" onClick={() => handleApproveClick(schedule.schedule_id)}>Approve</button>
                                              )}
                                            </>
                                          )}
                                        </td>
                                      </>
                                    )}
                                  </tr>
                                );
                              })
                            ) : (
                              <tr>
                                <td colSpan="7" style={{ textAlign: 'center' }}>
                                  {sectionSchedules === null ? 'Loading schedules...' : 'No schedules available'}
                                </td>
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
              onChange={async (e) => {
                handleInputChange(e);
                const selectedSection = sections.find(
                  (section) => section.section_id === Number(e.target.value)
                );

                if (selectedSection) {
                  try {
                    const response = await axios.get(
                      `http://localhost:3001/subjects-for-assignment/${selectedSection.grade_level}`
                    );
                    setFilteredSubjects(response.data); // Dynamically update subjects
                  } catch (error) {
                    console.error('Error fetching subjects by grade level:', error);
                  }
                } else {
                  setFilteredSubjects([]); // Reset if no section selected
                }
              }}
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
                <option key={subject.subject_id || subject.id} value={subject.subject_id || subject.id}>
                  {subject.subject_name}
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
            <div className="day-checkboxes">
              {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'].map(day => (
                <label key={day} className="day-checkbox-label">
                  <input
                    type="checkbox"
                    name="day"
                    value={day}
                    checked={newSchedule.day.includes(day)}
                    onChange={handleInputChange}
                  />
                  {day}
                </label>
              ))}
            </div>

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
