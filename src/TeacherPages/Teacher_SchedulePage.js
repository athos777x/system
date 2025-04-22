import React, { useState, useEffect } from 'react';
import axios from 'axios';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import '../TeacherPagesCss/Teacher_SchedulePage.css';

function Teacher_SchedulePage() {
  const [schedule, setSchedule] = useState([]);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [teacherName, setTeacherName] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [userRole, setUserRole] = useState('');
  const [sectionSchedule, setSectionSchedule] = useState([]);
  const [assignedSection, setAssignedSection] = useState(null);
  const [scheduleTab, setScheduleTab] = useState('my_schedule');
  
  const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
  
  useEffect(() => {
    const fetchUserRole = async () => {
      try {
        const userId = localStorage.getItem('userId');
        if (userId) {
          const roleResponse = await axios.get(`http://localhost:3001/user-role/${userId}`);
          setUserRole(roleResponse.data.role_name);
          
          // If user is a class adviser, fetch their assigned section
          if (roleResponse.data.role_name === 'class_adviser') {
            fetchAssignedSection(userId);
          }
        }
      } catch (error) {
        console.error('Error fetching user role:', error);
      }
    };

    fetchUserRole();
    fetchTeacherSchedule();
  }, []);

  const fetchAssignedSection = async (userId) => {
    try {
      const response = await axios.get(`http://localhost:3001/sections/by-adviser/${userId}`);
      if (response.data && response.data.length > 0) {
        setAssignedSection(response.data[0]);
        fetchSectionSchedule(response.data[0].section_id);
      }
    } catch (error) {
      console.error('Error fetching assigned section:', error);
    }
  };

  const fetchSectionSchedule = async (sectionId) => {
    try {
      const response = await axios.get(`http://localhost:3001/sections/${sectionId}/schedules`);
      console.log('Fetched section schedule:', response.data);
      
      // Process the section schedule data to handle multiple days
      const processedSchedule = response.data.map(item => {
        // Parse the day field if it's a JSON string
        let days = [];
        try {
          if (typeof item.day === 'string') {
            if (item.day.startsWith('[')) {
              days = JSON.parse(item.day);
            } else {
              days = [item.day];
            }
          } else if (Array.isArray(item.day)) {
            days = item.day;
          } else {
            days = [item.day];
          }
        } catch (error) {
          console.error('Error parsing days:', error);
          days = [item.day];
        }
        
        return {
          ...item,
          days: days
        };
      });
      
      setSectionSchedule(processedSchedule);
    } catch (error) {
      console.error('Error fetching section schedule:', error);
      // Just set an empty array instead of showing an error
      setSectionSchedule([]);
    }
  };

  const fetchTeacherSchedule = async () => {
    try {
      setIsLoading(true);
      
      const userId = localStorage.getItem('userId');
      // First, get the teacher's information
      // const teacherResponse = await axios.get(`http://localhost:3001/user/${userId}`);
      // setTeacherName(`${teacherResponse.data.first_name} ${teacherResponse.data.last_name}`);
      
      // Then, get the teacher's schedule
      const response = await axios.get(`http://localhost:3001/teacher/${userId}/schedule`);
      console.log('Fetched teacher schedule:', response.data);
      
      // Process the schedule data to handle multiple days
      const processedSchedule = response.data.map(item => {
        // Parse the day field if it's a JSON string
        let days = [];
        try {
          if (typeof item.day === 'string') {
            if (item.day.startsWith('[')) {
              days = JSON.parse(item.day);
            } else {
              days = [item.day];
            }
          } else if (Array.isArray(item.day)) {
            days = item.day;
          } else {
            days = [item.day];
          }
        } catch (error) {
          console.error('Error parsing days:', error);
          days = [item.day];
        }
        
        return {
          ...item,
          days: days
        };
      });
      
      setSchedule(processedSchedule);
    } catch (error) {
      console.error('Error fetching teacher schedule:', error);
      // Just set an empty array instead of showing an error
      setSchedule([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Format time for display (e.g., "08:30" to "8:30 AM")
  const formatTimeDisplay = (timeStr) => {
    // Make sure we only have the time portion (in case AM/PM was already included)
    let cleanTimeStr = timeStr;
    if (timeStr.includes('AM') || timeStr.includes('PM')) {
      // Extract just the time portion if AM/PM is already in the string
      cleanTimeStr = timeStr.split(' ')[0];
    }
    
    const [hours, minutes] = cleanTimeStr.split(':');
    const hour = parseInt(hours, 10);
    const period = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour > 12 ? hour - 12 : (hour === 0 ? 12 : hour);
    return `${displayHour}:${minutes} ${period}`;
  };

  // Compare two time strings
  const compareTimeStrings = (time1, time2) => {
    const [h1, m1] = time1.split(':').map(Number);
    const [h2, m2] = time2.split(':').map(Number);
    
    if (h1 !== h2) return h1 - h2;
    return m1 - m2;
  };

  const renderSchedule = (scheduleData = schedule) => {
    if (!scheduleData || scheduleData.length === 0) {
      return (
        <div className="empty-schedule-notice">
          <p>No classes have been assigned yet.</p>
        </div>
      );
    }

    // Create a map for each day's schedule, including empty slots
    const daySchedules = {};
    daysOfWeek.forEach(day => {
      daySchedules[day] = [];
    });

    // First, add all scheduled items
    scheduleData.forEach(item => {
      (item.days || []).forEach(day => {
        if (daysOfWeek.includes(day)) {
          daySchedules[day].push({
            startTime: item.time_start,
            endTime: item.time_end,
            subject: item.subject_name,
            section: item.section_name,
            grade: item.grade_level,
            teacher: item.teacher_name,
            isEmpty: false
          });
        }
      });
    });

    // Sort each day's schedule by start time
    daysOfWeek.forEach(day => {
      daySchedules[day].sort((a, b) => compareTimeStrings(a.startTime, b.startTime));
    });

    // Add empty slots between schedule items and at the beginning/end
    daysOfWeek.forEach(day => {
      const slots = daySchedules[day];
      const newSlots = [];
      
      // Start of day to first class
      if (slots.length === 0) {
        // If no classes at all, add one big empty slot for the whole day
        newSlots.push({
          startTime: '07:00',
          endTime: '18:00',
          isEmpty: true
        });
      } else {
        // Add empty slot from start of day to first class if needed
        if (compareTimeStrings(slots[0].startTime, '07:00') > 0) {
          newSlots.push({
            startTime: '07:00',
            endTime: slots[0].startTime,
            isEmpty: true
          });
        }
        
        // Add the first class
        newSlots.push(slots[0]);
        
        // Fill gaps between classes
        for (let i = 1; i < slots.length; i++) {
          const prevEndTime = slots[i-1].endTime;
          const currStartTime = slots[i].startTime;
          
          if (compareTimeStrings(currStartTime, prevEndTime) > 0) {
            // There's a gap, add an empty slot
            newSlots.push({
              startTime: prevEndTime,
              endTime: currStartTime,
              isEmpty: true
            });
          }
          
          // Add the current class
          newSlots.push(slots[i]);
        }
        
        // Add empty slot from last class to end of day if needed
        const lastSlot = slots[slots.length - 1];
        if (compareTimeStrings(lastSlot.endTime, '18:00') < 0) {
          newSlots.push({
            startTime: lastSlot.endTime,
            endTime: '18:00',
            isEmpty: true
          });
        }
      }
      
      daySchedules[day] = newSlots;
    });

    // Find the maximum number of slots across all days
    const maxSlots = Math.max(...daysOfWeek.map(day => daySchedules[day].length));

    // Create a combined time range array for the time column
    const timeRanges = [];
    for (const day of daysOfWeek) {
      daySchedules[day].forEach(slot => {
        const timeRange = {
          startTime: slot.startTime,
          endTime: slot.endTime
        };
        // Check if this exact time range already exists
        if (!timeRanges.some(tr => 
          tr.startTime === timeRange.startTime && tr.endTime === timeRange.endTime)) {
          timeRanges.push(timeRange);
        }
      });
    }
    
    // Sort the time ranges
    timeRanges.sort((a, b) => compareTimeStrings(a.startTime, b.startTime));

    return (
      <table className="schedule-table">
        <thead>
          <tr>
            <th>Time</th>
            {daysOfWeek.map(day => (
              <th key={day}>{day}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {timeRanges.map((timeRange, rowIndex) => (
            <tr key={rowIndex}>
              <td className="time-cell">
                {formatTimeDisplay(timeRange.startTime)} - {formatTimeDisplay(timeRange.endTime)}
              </td>
              {daysOfWeek.map(day => {
                // Find a slot that matches this time range
                const matchingSlot = daySchedules[day].find(slot => 
                  slot.startTime === timeRange.startTime && slot.endTime === timeRange.endTime);
                
                if (!matchingSlot) {
                  return <td key={`${day}-empty-${rowIndex}`}></td>;
                }
                
                if (matchingSlot.isEmpty) {
                  return (
                    <td key={`${day}-empty-${rowIndex}`} className="empty-schedule-cell">
                      &nbsp;
                    </td>
                  );
                }
                
                return (
                  <td key={`${day}-${rowIndex}`} className="schedule-subject-cell">
                    <div className="subject-name">{matchingSlot.subject}</div>
                    <div className="section-info">{matchingSlot.section}</div>
                    {scheduleTab === 'section_schedule' && matchingSlot.teacher && (
                      <div className="teacher-info">{matchingSlot.teacher}</div>
                    )}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    );
  };

  const generatePDF = async () => {
    try {
      setIsGeneratingPDF(true);
      const scheduleElement = document.querySelector('.teacher-schedule-table-container');
      
      const canvas = await html2canvas(scheduleElement, {
        scale: 2, // Higher quality
        backgroundColor: '#ffffff',
      });
      
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'px',
        format: [canvas.width, canvas.height]
      });
      
      pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height);
      
      // Set the name of the PDF based on the active tab
      const pdfName = scheduleTab === 'my_schedule' 
        ? `${teacherName || 'Teacher'}_schedule.pdf` 
        : `${assignedSection?.section_name || 'Section'}_schedule.pdf`;
      
      pdf.save(pdfName);
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Failed to generate PDF. Please try again.');
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  if (isLoading) {
    return (
      <div className="teacher-schedule-container">
        <h1 className="teacher-schedule-title">My Schedule</h1>
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading schedule...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="teacher-schedule-container">
      <h1 className="teacher-schedule-title">My Schedule</h1>
      {teacherName && <h2 className="teacher-name-header">{teacherName}</h2>}
      
      {userRole === 'class_adviser' && assignedSection && (
        <div className="schedule-tabs">
          {/* <button 
            className={`tab-button ${scheduleTab === 'my_schedule' ? 'active' : ''}`}
            onClick={() => setScheduleTab('my_schedule')}
          >
            My Schedule
          </button> */}
          <button 
            className={`tab-button ${scheduleTab === 'section_schedule' ? 'active' : ''}`}
            onClick={() => setScheduleTab('section_schedule')}
          >
            {assignedSection.section_name} Schedule
          </button>
        </div>
      )}
      
      <div className="teacher-schedule-table-container">
        {scheduleTab === 'my_schedule' && renderSchedule(schedule)}
        {scheduleTab === 'section_schedule' && renderSchedule(sectionSchedule)}
      </div>
      
      <div className="print-button-container">
        <button 
          onClick={generatePDF} 
          className="print-button"
          disabled={isGeneratingPDF || 
            (scheduleTab === 'my_schedule' && schedule.length === 0) ||
            (scheduleTab === 'section_schedule' && sectionSchedule.length === 0)}
        >
          {isGeneratingPDF ? 'Generating PDF...' : 'Download PDF'}
        </button>
      </div>
    </div>
  );
}

export default Teacher_SchedulePage; 