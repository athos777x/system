import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import '../TeacherPagesCss/ScheduleManagement.css';

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
    time_start: '07:00',
    time_end: '12:00',
    day: [],
    teacher_id: '',
    section_id: ''
  });
  const [subjects, setSubjects] = useState([]);
  const [filteredSubjects, setFilteredSubjects] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [subjectteachers, setSubjectTeachers] = useState([]);
  const [roleName, setRoleName] = useState('');
  const [coordinatorGradeLevel, setCoordinatorGradeLevel] = useState(null);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [selectedGradeLevel, setSelectedGradeLevel] = useState(null);

  // Helper function to sort days in chronological order
  const sortDays = (days) => {
    const dayOrder = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
    return days.sort((a, b) => dayOrder.indexOf(a) - dayOrder.indexOf(b));
  };

  const fetchSections = useCallback(async () => {
    try {
      // Retrieve roleName and user_id from localStorage
        const userId = localStorage.getItem('userId');  // Get the user ID from localStorage
        console.log('userId:', userId);  // Check if userId is available in the console
  
      if (!userId) {
        console.error('User ID is missing');
        return;  // Exit if no userId is available
      }
  
      // Determine the endpoint based on roleName
      let endpoint = roleName === 'class_adviser' 
        ? `http://localhost:3001/sections/by-adviser/${userId}`  // Use the 'by-adviser' endpoint for class advisers
        : 'http://localhost:3001/sections';  // Default endpoint for other roles
  
      console.log("Fetching sections from:", endpoint); // Debugging log
  
      // Fetch the data from the determined endpoint
      const response = await axios.get(endpoint);
      let sectionsData = response.data;
      
      // For grade level coordinators, filter the sections by their assigned grade level
      if (roleName === 'grade_level_coordinator' && coordinatorGradeLevel) {
        console.log('Filtering sections for grade level coordinator. Grade level:', coordinatorGradeLevel);
        sectionsData = sectionsData.filter(section => 
          section.grade_level.toString() === coordinatorGradeLevel.toString()
        );
      }
      
      setSections(sectionsData);
      setFilteredSections(sectionsData);
    } catch (error) {
      console.error('There was an error fetching the sections!', error);
    }
  }, [roleName, coordinatorGradeLevel]);
  

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
    getSubjectTeachers();
  }, [roleName, fetchSections, fetchSchoolYears]);

  useEffect(() => {
    if (coordinatorGradeLevel) {
      fetchSections();
    }
  }, [coordinatorGradeLevel, fetchSections]);

  const applyFilters = () => {
    let filtered = sections;

    if (filters.searchTerm) {
      filtered = filtered.filter(section =>
        section.section_name.toLowerCase().includes(filters.searchTerm.toLowerCase())
      );
    }

    if (filters.grade) {
      filtered = filtered.filter(section => section.grade_level === filters.grade);
    }

    if (filters.section) {
      filtered = filtered.filter(section => section.section_id === parseInt(filters.section));
    }

    if (filters.schoolYear) {
      filtered = filtered.filter(section => section.school_year === filters.schoolYear);
    }

    setFilteredSections(filtered);
  };

  const handleGradeChange = (event) => {
    const grade = event.target.value;
    setFilters(prev => ({ ...prev, grade }));
    // Remove auto-filtering
  };

  const handleSectionChange = (event) => {
    const section = event.target.value;
    setFilters(prev => ({ ...prev, section }));
    // Remove auto-filtering
  };

  const handleSchoolYearChange = (event) => {
    const schoolYear = event.target.value;
    setFilters(prev => ({ ...prev, schoolYear }));
    // Remove auto-filtering
  };

  const handleApplyFilters = () => {
    applyFilters();
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
  
      const userId = localStorage.getItem('userId');
  
      if (!userId) {
        console.error('userId not found in localStorage');
        return;
      }
  
      // Select endpoint based on role
      const endpoint = roleName === 'class_adviser'
        ? `http://localhost:3001/sections/${sectionId}/schedules/by-adviser`
        : `http://localhost:3001/sections/${sectionId}/schedules`;
  
      // Attach user_id only if needed
      const response = await axios.get(endpoint, {
        params: roleName === 'class_adviser' ? { user_id: userId } : {},
      });
  
      console.log('Raw response data:', response.data);
  
      // Handle both single day and array formats
      const schedulesWithParsedDays = response.data.map(schedule => {
        let parsedDay = [];
  
        try {
          if (schedule.day === undefined || schedule.day === null) {
            // If day is undefined or null, initialize as empty array
            console.warn('Day is undefined or null, initializing as empty array for schedule:', schedule);
          } else if (typeof schedule.day === 'string' && !schedule.day.startsWith('[')) {
            // If it's a single day string, convert it to an array
            parsedDay = [schedule.day];
          } else {
            // Handle both array and stringified array cases
            parsedDay = typeof schedule.day === 'string'
              ? JSON.parse(schedule.day)
              : Array.isArray(schedule.day) ? schedule.day : [schedule.day];
          }
  
          // Sort days only if parsedDay is an array and not empty
          if (Array.isArray(parsedDay) && parsedDay.length > 0) {
            parsedDay = sortDays([...parsedDay]);
          }
  
        } catch (error) {
          console.error('Error parsing day for schedule:', schedule);
          console.error('Parse error:', error);
          parsedDay = []; // Fallback to empty array if parsing fails
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
        time_start: '07:00',
        time_end: '12:00',
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

  const getSubjectTeachers = async () => {
    try {
      const response = await axios.get('http://localhost:3001/list-subject-teacher');
      setSubjectTeachers(response.data); 
    } catch (error) {
      console.error('Error fetching subject teachers:', error);
    }
  };
  
  

  const startEditing = async (schedule) => {
    try {
      // Get all teachers for reference
      const teachersResponse = await axios.get('http://localhost:3001/employees', {
        params: { status: 'active', archive_status: 'unarchive' }
      });
      setTeachers(teachersResponse.data);
      
      // Get subject-specific teachers
      const subjectTeachers = subjectteachers.filter(teacher => 
        // Match by subject ID or by subject name if IDs don't match
        teacher.subject_id === schedule.subject_id || 
        teacher.subject_name === schedule.subject_name
      );
      
      // Process teachers for consistent format (both subjectTeachers and regular teachers)
      const processTeachers = (teachers) => {
        return teachers.map(teacher => {
          // For teachers with firstname/lastname properties
          if (teacher.firstname) {
            return {
              ...teacher,
              displayName: `${teacher.lastname}, ${teacher.firstname} ${teacher.middlename || ''}`
            };
          }
          // For teachers with just a 'teacher' property (likely already formatted)
          else if (teacher.teacher) {
            const nameParts = teacher.teacher.split(' ');
            if (nameParts.length >= 2) {
              const lastName = nameParts[nameParts.length - 1];
              const firstName = nameParts[0];
              const middleName = nameParts.slice(1, -1).join(' ');
              return {
                ...teacher,
                displayName: `${lastName}, ${firstName} ${middleName}`
              };
            }
            return {
              ...teacher,
              displayName: teacher.teacher
            };
          }
          return teacher;
        });
      };
      
      // Format time values to HH:MM format for input type="time"
      let formattedTimeStart = schedule.time_start;
      let formattedTimeEnd = schedule.time_end;
      
      // If times are in format like "07:00:00" or "07:00 AM", convert to "07:00" for the time input
      if (formattedTimeStart) {
        // Remove seconds if present
        if (formattedTimeStart.includes(':')) {
          const timeParts = formattedTimeStart.split(':');
          if (timeParts.length > 2) {
            formattedTimeStart = `${timeParts[0]}:${timeParts[1]}`;
          }
        }
        
        // Convert from AM/PM format if needed
        if (formattedTimeStart.includes('AM') || formattedTimeStart.includes('PM')) {
          const timeMatch = formattedTimeStart.match(/(\d+):(\d+)\s*(AM|PM)/i);
          if (timeMatch) {
            let hours = parseInt(timeMatch[1], 10);
            const minutes = timeMatch[2];
            const period = timeMatch[3].toUpperCase();
            
            if (period === 'PM' && hours < 12) hours += 12;
            if (period === 'AM' && hours === 12) hours = 0;
            
            formattedTimeStart = `${hours.toString().padStart(2, '0')}:${minutes}`;
          }
        }
      }
      
      // Do the same for end time
      if (formattedTimeEnd) {
        // Remove seconds if present
        if (formattedTimeEnd.includes(':')) {
          const timeParts = formattedTimeEnd.split(':');
          if (timeParts.length > 2) {
            formattedTimeEnd = `${timeParts[0]}:${timeParts[1]}`;
          }
        }
        
        // Convert from AM/PM format if needed
        if (formattedTimeEnd.includes('AM') || formattedTimeEnd.includes('PM')) {
          const timeMatch = formattedTimeEnd.match(/(\d+):(\d+)\s*(AM|PM)/i);
          if (timeMatch) {
            let hours = parseInt(timeMatch[1], 10);
            const minutes = timeMatch[2];
            const period = timeMatch[3].toUpperCase();
            
            if (period === 'PM' && hours < 12) hours += 12;
            if (period === 'AM' && hours === 12) hours = 0;
            
            formattedTimeEnd = `${hours.toString().padStart(2, '0')}:${minutes}`;
          }
        }
      }
      
      // Set default times based on grade level if times are missing
      const grade_level = schedule.grade_level ? Number(schedule.grade_level) : null;
      
      // Default start time based on grade level
      if (!formattedTimeStart) {
        formattedTimeStart = grade_level === 10 ? '12:00' : '06:00';
      }
      
      // Default end time based on grade level
      if (!formattedTimeEnd) {
        formattedTimeEnd = grade_level === 10 ? '18:00' : '12:00';
      }
      
      // Process and format the teachers
      let formattedTeachers = subjectTeachers.length > 0 
        ? processTeachers(subjectTeachers) 
        : processTeachers(teachersResponse.data);
      
      // Set the editing state
      setIsEditing(true);
      
      // Make sure day is an array when starting to edit and set default time if not provided
      setEditFormData({
        ...schedule,
        time_start: formattedTimeStart,
        time_end: formattedTimeEnd,
        day: Array.isArray(schedule.day) ? schedule.day : JSON.parse(schedule.day),
        filteredTeachers: formattedTeachers, // Now properly formatted teachers
        grade_level: grade_level // Store grade level for time validation
      });
      
      console.log('Edit form data:', {
        ...schedule,
        time_start: formattedTimeStart,
        time_end: formattedTimeEnd,
        filteredTeachers: formattedTeachers,
        grade_level: grade_level
      });
    } catch (error) {
      console.error('Error fetching teachers:', error);
    }
  };

  const validateTime = (timeValue, gradeLevel) => {
    // Convert time to 24-hour format for comparison
    const [hours, minutes] = timeValue.split(':');
    const time24 = `${hours.padStart(2, '0')}:${minutes}`;
    
    // Different time range validation based on grade level
    if (gradeLevel === 10) {
      // Grade 10: 12PM to 6PM (12:00 to 18:00)
      return time24 >= '12:00' && time24 <= '18:00';
    } else {
      // Grades 7, 8, 9: 6AM to 12PM (06:00 to 12:00)
      return time24 >= '06:00' && time24 <= '12:00';
    }
  };

  const handleTimeBlur = (e, isNewSchedule = true) => {
    const { name, value } = e.target;
    
    // Get the correct grade level and values based on whether we're editing or adding
    const gradeLevel = isNewSchedule 
      ? selectedGradeLevel 
      : (editFormData.grade_level || null);
    
    const startTime = isNewSchedule ? newSchedule.time_start : editFormData.time_start;
    const endTime = isNewSchedule ? newSchedule.time_end : editFormData.time_end;

    if (!validateTime(value, gradeLevel)) {
      const gradeSpecificMessage = gradeLevel === 10 
        ? 'Please select a time between 12:00 PM and 6:00 PM for Grade 10'
        : 'Please select a time between 6:00 AM and 12:00 PM for Grades 7-9';
      
      alert(gradeSpecificMessage);
      
      // Reset to appropriate default value based on grade
      let defaultValue;
      if (name === 'time_start') {
        defaultValue = gradeLevel === 10 ? '12:00' : '06:00';
      } else { // time_end
        defaultValue = gradeLevel === 10 ? '18:00' : '12:00';
      }
      
      if (isNewSchedule) {
        setNewSchedule(prev => ({ ...prev, [name]: defaultValue }));
      } else {
        setEditFormData(prev => ({ ...prev, [name]: defaultValue }));
      }
    } else if (name === 'time_end' && endTime < startTime) {
      alert('End time cannot be earlier than start time');
      // Reset end time to default based on grade
      const defaultValue = gradeLevel === 10 ? '18:00' : '12:00';
      if (isNewSchedule) {
        setNewSchedule(prev => ({ ...prev, time_end: defaultValue }));
      } else {
        setEditFormData(prev => ({ ...prev, time_end: defaultValue }));
      }
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    if (name === 'day') {
      // Handle checkbox selection
      const day = e.target.value;
      const isChecked = e.target.checked;
  
      // Ensure day array is initialized
      setNewSchedule(prev => ({
        ...prev,
        day: prev.day ? (isChecked ? [...prev.day, day] : prev.day.filter(d => d !== day)) : [day]
      }));
    } else if (name === 'time_start' || name === 'time_end') {
      // Update time without immediate validation
      setNewSchedule(prev => ({ ...prev, [name]: value }));
    } else {
      setNewSchedule({ ...newSchedule, [name]: value });
    }
  
    // When section is selected, filter subjects by grade level and update time defaults
    if (name === 'section_id' && value) {
      const selectedSection = sections.find(section => section.section_id === Number(value));
      if (selectedSection) {
        const sectionGrade = selectedSection.grade_level;
        setSelectedGradeLevel(Number(sectionGrade));
        
        // Set default times based on grade level
        const defaultStartTime = Number(sectionGrade) === 10 ? '12:00' : '06:00';
        const defaultEndTime = Number(sectionGrade) === 10 ? '18:00' : '12:00';
        
        setNewSchedule(prev => ({
          ...prev,
          time_start: defaultStartTime,
          time_end: defaultEndTime
        }));
        
        const filteredSubjects = subjects.filter(subject => 
          String(subject.grade_level) === String(sectionGrade)
        );
        setFilteredSubjects(filteredSubjects);
      } else {
        setFilteredSubjects([]);
        setSelectedGradeLevel(null);
      }
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
    } else if (name === 'time_start' || name === 'time_end') {
      // Update time without immediate validation
      setEditFormData(prev => ({ ...prev, [name]: value }));
    } else {
      setEditFormData(prevFormData => ({
        ...prevFormData,
        [name]: value
      }));
    }
  };

  const displaySuccessMessage = (message) => {
    setSuccessMessage(message);
    setShowSuccessMessage(true);
    
    // Auto-hide the message after 3 seconds
    setTimeout(() => {
      setShowSuccessMessage(false);
    }, 3000);
  };

  const saveChanges = async () => {
    try {
      const { schedule_id, teacher_id, time_start, time_end, day, schedule_status, grade_level } = editFormData;
      
      // Validate required fields
      if (!teacher_id || !time_start || !time_end || !day || day.length === 0) {
        alert('Please fill in all required fields');
        return;
      }
      
      // Validate time range based on grade level
      if (!validateTime(time_start, grade_level) || !validateTime(time_end, grade_level)) {
        const gradeSpecificMessage = grade_level === 10 
          ? 'Please select a time between 12:00 PM and 6:00 PM for Grade 10'
          : 'Please select a time between 6:00 AM and 12:00 PM for Grades 7-9';
        alert(gradeSpecificMessage);
        return;
      }
      
      // Validate end time is after start time
      if (time_end <= time_start) {
        alert('End time must be after start time');
        return;
      }
      
      // Sort days before storing
      const sortedDays = sortDays([...day]);

      await axios.put(`http://localhost:3001/schedules/${schedule_id}`, {
        teacher_id,
        time_start,
        time_end,
        day: sortedDays.length === 1 ? sortedDays[0] : JSON.stringify(sortedDays),
        schedule_status
      });
      fetchSectionSchedules(selectedSectionId);
      setIsEditing(false);
      displaySuccessMessage('Schedule updated successfully!');
    } catch (error) {
      console.error('Error saving schedule details:', error);
      alert('Error saving schedule. Please try again.');
    }
  };

  const cancelEditing = () => {
    setIsEditing(false);
  };

  const handleApproveClick = async (scheduleId) => {
    try {
      await axios.put(`http://localhost:3001/schedules/${scheduleId}/approve`, { schedule_status: 'Approved' });
      fetchSectionSchedules(selectedSectionId);
      displaySuccessMessage('Schedule approved successfully!');
    } catch (error) {
      console.error('There was an error approving the schedule!', error);
    }
  };

  const handleDeleteClick = async (scheduleId) => {
    try {
      if (window.confirm('Are you sure you want to delete this schedule?')) {
        // Update the endpoint to match the format used in other schedule API calls
        await axios.delete(`http://localhost:3001/schedules/${scheduleId}`);
        
        // Immediately update the UI by removing the deleted schedule from state
        setSectionSchedules(prevSchedules => 
          prevSchedules.filter(schedule => schedule.schedule_id !== scheduleId)
        );
        
        displaySuccessMessage('Schedule deleted successfully!');
      }
    } catch (error) {
      console.error('There was an error deleting the schedule!', error);
      // Show an error message to the user
      alert(`Failed to delete schedule: ${error.response?.data?.message || error.message}`);
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
      
      // Validate time range based on grade level
      if (!validateTime(newSchedule.time_start, grade_level) || !validateTime(newSchedule.time_end, grade_level)) {
        const gradeSpecificMessage = grade_level === 10 
          ? 'Please select a time between 12:00 PM and 6:00 PM for Grade 10'
          : 'Please select a time between 6:00 AM and 12:00 PM for Grades 7-9';
        alert(gradeSpecificMessage);
        return;
      }
      
      // Validate end time is after start time
      if (newSchedule.time_end <= newSchedule.time_start) {
        alert('End time must be after start time');
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
      displaySuccessMessage('New schedule added successfully!');
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
        
        // If user is a grade level coordinator, fetch their assigned grade level
        if (response.data.role_name === 'grade_level_coordinator') {
          fetchCoordinatorGradeLevel(userId);
        }
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
  
  const fetchCoordinatorGradeLevel = async (userId) => {
    try {
      const response = await axios.get(`http://localhost:3001/coordinator-grade-level/${userId}`);
      if (response.status === 200 && response.data.gradeLevel) {
        console.log('Coordinator grade level:', response.data.gradeLevel);
        setCoordinatorGradeLevel(response.data.gradeLevel);
        // Auto-set the grade filter to the coordinator's assigned grade level
        setFilters(prev => ({ ...prev, grade: response.data.gradeLevel.toString() }));
      }
    } catch (error) {
      console.error('Error fetching coordinator grade level:', error);
    }
  };

  const handleApproveAllClick = async (sectionId) => {
    try {
      // Get all pending schedules for this section
      const pendingSchedules = sectionSchedules.filter(
        schedule => schedule.schedule_status === 'Pending Approval'
      );
      
      // Update all pending schedules to approved status
      await Promise.all(
        pendingSchedules.map(schedule =>
          axios.put(`http://localhost:3001/schedules/${schedule.schedule_id}/approve`, 
            { schedule_status: 'Approved' }
          )
        )
      );
      
      // Refresh the schedules
      await fetchSectionSchedules(sectionId);
      displaySuccessMessage('All schedules approved successfully!');
    } catch (error) {
      console.error('Error approving schedules:', error);
      alert('Failed to approve all schedules. Please try again.');
    }
  };

  return (
    <div className="schedule-mgmt-container">
      {/* Success Message Popup */}
      {showSuccessMessage && (
        <div className="success-message-popup">
          <div className="success-message-content">
            <span className="success-icon">✓</span>
            <span>{successMessage}</span>
          </div>
        </div>
      )}

      <div className="schedule-mgmt-header">
        <h1 className="schedule-mgmt-title">Schedule Management</h1>
        {(roleName === 'academic_coordinator') && (
          <button className="schedule-mgmt-btn-add" onClick={startAdding}>
            Add New Schedule
          </button>
        )}
      </div>

      <div className="schedule-mgmt-filters">
        <div className="schedule-mgmt-search">
          <input
            type="text"
            placeholder="Search sections..."
            value={filters.searchTerm}
            onChange={(e) => setFilters({ ...filters, searchTerm: e.target.value })}
          />
        </div>
        <div className="schedule-mgmt-filters-group">
          <select
            value={filters.schoolYear}
            onChange={handleSchoolYearChange}
          >
            <option value="">All School Years</option>
            {schoolYears.map(year => (
              <option key={year} value={year}>{year}</option>
            ))}
          </select>
          <select
            value={filters.grade}
            onChange={handleGradeChange}
            disabled={roleName === 'grade_level_coordinator'}
          >
            <option value="">Select Grade Level</option>
            {roleName === 'grade_level_coordinator' && coordinatorGradeLevel ? (
              <option value={coordinatorGradeLevel}>Grade {coordinatorGradeLevel}</option>
            ) : (
              [7, 8, 9, 10].map(grade => (
              <option key={grade} value={grade}>Grade {grade}</option>
              ))
            )}
          </select>
          <button onClick={handleApplyFilters}>Filter</button>
        </div>
      </div>

      <div className="schedule-mgmt-table-container">
        <table className="schedule-mgmt-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Section Name</th>
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
                    <td>{section.section_name}</td>
                    <td>
                      <span className={`status-${section.status.toLowerCase()}`}>
                        {section.status.charAt(0).toUpperCase() + section.status.slice(1)}
                      </span>
                    </td>
                    <td>
                      <button 
                        className="schedule-mgmt-btn schedule-mgmt-btn-view" 
                        onClick={() => handleViewClick(section.section_id)}
                      >
                        View
                      </button>
                    </td>
                  </tr>
                  {selectedSectionId === section.section_id && (
                    <tr>
                      <td colSpan="4">
                        <div className="schedule-mgmt-details">
                          <div className="schedule-mgmt-details-header">
                            <h2 className="schedule-mgmt-details-title">Section {section.section_name} - Class Schedule</h2>
                            {(roleName !== 'academic_coordinator' && roleName !== 'grade_level_coordinator' && roleName !== 'registrar' && 
                              sectionSchedules.some(schedule => schedule.schedule_status === 'Pending Approval')) && (
                              <button 
                                className="schedule-mgmt-btn schedule-mgmt-btn-approve"
                                onClick={() => handleApproveAllClick(selectedSectionId)}
                              >
                                Approve
                              </button>
                            )}
                          </div>
                          <table className="schedule-mgmt-details-table">
                            <thead>
                              <tr>
                                <th>Subject</th>
                                <th>Time Start</th>
                                <th>Time End</th>
                                <th>Day</th>
                                <th>Teacher</th>
                                <th>Status</th>
                                {(roleName !== 'registrar' && roleName !== 'grade_level_coordinator' && roleName !== 'class_adviser') && (
                                  <th>Actions</th>
                                )}
                              </tr>
                            </thead>
                            <tbody>
                              {sectionSchedules && sectionSchedules.length > 0 ? (
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
                                            onBlur={(e) => handleTimeBlur(e, false)}
                                            min={editFormData.grade_level === 10 ? "12:00" : "06:00"}
                                            max={editFormData.grade_level === 10 ? "18:00" : "12:00"}
                                            required
                                            className="required-field"
                                            style={{ color: '#1e293b' }}
                                          />
                                        </td>
                                        <td>
                                          <input
                                            type="time"
                                            name="time_end"
                                            value={editFormData.time_end}
                                            onChange={handleEditChange}
                                            onBlur={(e) => handleTimeBlur(e, false)}
                                            min={editFormData.grade_level === 10 ? "12:00" : "06:00"}
                                            max={editFormData.grade_level === 10 ? "18:00" : "12:00"}
                                            required
                                            className="required-field"
                                            style={{ color: '#1e293b' }}
                                          />
                                        </td>
                                        <td>
                                          <div className="day-checkboxes required-field-container">
                                            {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'].map(day => (
                                              <label key={day} className="day-checkbox-label" style={{ color: '#1e293b' }}>
                                                <input
                                                  type="checkbox"
                                                  name="day"
                                                  value={day}
                                                  checked={(editFormData.day || []).includes(day)}
                                                  onChange={handleEditChange}
                                                  required
                                                  style={{ accentColor: '#4CAF50' }}
                                                />
                                                {day}
                                              </label>
                                            ))}
                                          </div>
                                        </td>
                                        <td>
                                          <select
                                            name="teacher_id"
                                            value={editFormData.teacher_id || ""}
                                            onChange={handleEditChange}
                                            required
                                            className={editFormData.teacher_id ? "required-field valid-selection" : "required-field"}
                                          >
                                            <option value="">Select Teacher *</option>
                                            {editFormData.filteredTeachers ? (
                                              [...editFormData.filteredTeachers].sort((a, b) => {
                                                const lastNameA = a.lastname || (a.teacher ? a.teacher.split(' ').pop() : '');
                                                const lastNameB = b.lastname || (b.teacher ? b.teacher.split(' ').pop() : '');
                                                return lastNameA.localeCompare(lastNameB);
                                              }).map((teacher) => (
                                                <option key={teacher.employee_id} value={teacher.employee_id}>
                                                  {teacher.displayName || (teacher.firstname ? 
                                                    `${teacher.lastname}, ${teacher.firstname} ${teacher.middlename || ''}` : 
                                                    teacher.teacher)}
                                                </option>
                                              ))
                                            ) : (
                                              [...teachers].sort((a, b) => {
                                                const lastNameA = a.lastname;
                                                const lastNameB = b.lastname;
                                                return lastNameA.localeCompare(lastNameB);
                                              }).map((teacher) => (
                                                <option key={teacher.employee_id} value={teacher.employee_id}>
                                                  {`${teacher.lastname}, ${teacher.firstname} ${teacher.middlename || ''}`}
                                                </option>
                                              ))
                                            )}
                                          </select>
                                        </td>
                                        <td>
                                          <span className={`status-${editFormData.schedule_status.toLowerCase().replace(' ', '-')}`}>
                                            {editFormData.schedule_status}
                                          </span>
                                        </td>
                                        {(roleName !== 'registrar' && roleName !== 'grade_level_coordinator' && roleName !== 'class_adviser') && (
                                          <td>
                                            <div className="schedule-mgmt-actions">
                                              <button className="schedule-mgmt-btn schedule-mgmt-btn-edit" onClick={saveChanges}>Save</button>
                                              <button className="schedule-mgmt-btn schedule-mgmt-btn-cancel" onClick={cancelEditing}>Cancel</button>
                                            </div>
                                          </td>
                                        )}
                                      </>
                                    ) : (
                                      <>
                                        <td>{schedule.subject_name}</td>
                                        <td>{schedule.time_start}</td>
                                        <td>{schedule.time_end}</td>
                                        <td>{Array.isArray(schedule.day) ? schedule.day.join(', ') : schedule.day}</td>
                                        <td>
                                          {(() => {
                                            // Try to reformat the teacher name if it's in "Firstname Lastname" format
                                            if (schedule.teacher_name) {
                                              const nameParts = schedule.teacher_name.split(' ');
                                              if (nameParts.length >= 2) {
                                                const lastName = nameParts[nameParts.length - 1];
                                                const firstName = nameParts[0];
                                                const middleParts = nameParts.slice(1, -1);
                                                const middleName = middleParts.length > 0 ? middleParts.join(' ') : '';
                                                return `${lastName}, ${firstName} ${middleName}`;
                                              }
                                            }
                                            return schedule.teacher_name;
                                          })()}
                                        </td>
                                        <td>
                                          <span className={`status-${schedule.schedule_status.toLowerCase().replace(' ', '-')}`}>
                                            {schedule.schedule_status}
                                          </span>
                                        </td>
                                        {(roleName !== 'registrar' && roleName !== 'grade_level_coordinator' && roleName !== 'class_adviser') && (
                                          <td>
                                            {schedule.schedule_status === 'Pending Approval' && (
                                              <div className="schedule-mgmt-actions">
                                                <button 
                                                  className="schedule-mgmt-btn schedule-mgmt-btn-edit" 
                                                  onClick={() => startEditing(schedule)}
                                                >
                                                  Edit
                                                </button>
                                                <button 
                                                  className="schedule-mgmt-btn schedule-mgmt-btn-delete" 
                                                  onClick={() => handleDeleteClick(schedule.schedule_id)}
                                                >
                                                  Delete
                                                </button>
                                              </div>
                                            )}
                                          </td>
                                        )}
                                      </>
                                    )}
                                  </tr>
                                ))
                              ) : (
                                <tr>
                                  <td colSpan={roleName === 'registrar' || roleName === 'grade_level_coordinator' || roleName === 'class_adviser' ? "6" : "7"} style={{ textAlign: 'center' }}>
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
                <td colSpan="4" style={{ textAlign: 'center' }}>No sections available.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="schedule-mgmt-modal">
          <div className="schedule-mgmt-modal-content">
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
                    setFilteredSubjects(response.data);
                  } catch (error) {
                    console.error('Error fetching subjects by grade level:', error);
                  }
                } else {
                  setFilteredSubjects([]);
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
              onBlur={(e) => handleTimeBlur(e, true)}
              min={selectedGradeLevel === 10 ? "12:00" : "06:00"}
              max={selectedGradeLevel === 10 ? "18:00" : "12:00"}
            />
            <input
              type="time"
              name="time_end"
              placeholder="End Time"
              value={newSchedule.time_end}
              onChange={handleInputChange}
              onBlur={(e) => handleTimeBlur(e, true)}
              min={selectedGradeLevel === 10 ? "12:00" : "06:00"}
              max={selectedGradeLevel === 10 ? "18:00" : "12:00"}
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
              {[...subjectteachers].sort((a, b) => {
                // Extract last names from teacher string (assuming format might not be consistent)
                const getLastName = (teacherName) => {
                  const parts = teacherName.split(' ');
                  return parts[parts.length - 1]; // Last part is likely the last name
                };
                
                const lastNameA = getLastName(a.teacher);
                const lastNameB = getLastName(b.teacher);
                return lastNameA.localeCompare(lastNameB);
              }).map((teacherObj) => {
                // Attempt to reformat the name if possible
                let formattedName = teacherObj.teacher;
                const nameParts = teacherObj.teacher.split(' ');
                
                if (nameParts.length >= 2) {
                  // Assume last element is lastname, first element is firstname
                  const lastName = nameParts[nameParts.length - 1];
                  const firstName = nameParts[0];
                  const middleName = nameParts.slice(1, -1).join(' ');
                  formattedName = `${lastName}, ${firstName} ${middleName}`;
                }
                
                return (
                  <option key={teacherObj.employee_id} value={teacherObj.employee_id}>
                    {formattedName}
                  </option>
                );
              })}
            </select>

            <div className="schedule-mgmt-modal-actions">
              <button className="schedule-mgmt-btn schedule-mgmt-btn-edit" onClick={handleAddSchedule}>Add Schedule</button>
              <button className="schedule-mgmt-btn schedule-mgmt-btn-cancel" onClick={() => setIsModalOpen(false)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Principal_SchedulePage;
