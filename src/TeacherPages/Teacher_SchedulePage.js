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
  const timeSlots = [
    '07:00 AM - 08:00 AM', '08:00 AM - 09:00 AM', '09:00 AM - 10:00 AM',
    '10:00 AM - 11:00 AM', '11:00 AM - 12:00 PM', '12:00 PM - 01:00 PM',
    '01:00 PM - 02:00 PM', '02:00 PM - 03:00 PM', '03:00 PM - 04:00 PM',
    '04:00 PM - 05:00 PM'
  ];

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

  const getTimeSlotIndex = (time) => {
    const [hours, minutes] = time.split(':');
    const hourInt = parseInt(hours, 10);
    const minuteInt = parseInt(minutes, 10);
    return Math.floor((hourInt - 7) + (minuteInt / 60));
  };

  const renderSchedule = (scheduleData = schedule) => {
    // Initialize schedule grid
    const scheduleGrid = timeSlots.map(() =>
      daysOfWeek.map(() => ({ content: null, isOccupied: false }))
    );
  
    // Fill in the schedule grid if there's data
    if (scheduleData && scheduleData.length > 0) {
      scheduleData.forEach(item => {
        const startIndex = getTimeSlotIndex(item.time_start);
        const endIndex = getTimeSlotIndex(item.time_end);
        const duration = endIndex - startIndex;
  
        (item.days || []).forEach(day => {
          const dayIndex = daysOfWeek.indexOf(day);
  
          if (dayIndex !== -1) {
            // Ensure row and column are defined before assigning
            for (let i = startIndex; i < endIndex; i++) {
              if (!scheduleGrid[i]) {
                scheduleGrid[i] = [];
              }
              if (!scheduleGrid[i][dayIndex]) {
                scheduleGrid[i][dayIndex] = { content: null, isOccupied: false };
              }
            }
  
            // Mark the starting cell with the subject info
            if (scheduleGrid[startIndex] && scheduleGrid[startIndex][dayIndex]) {
              scheduleGrid[startIndex][dayIndex] = {
                content: {
                  subject: item.subject_name,
                  section: item.section_name,
                  grade: item.grade_level,
                  teacher: item.teacher_name,
                  span: duration
                },
                isOccupied: true
              };
            }
  
            // Mark subsequent cells as occupied
            for (let i = startIndex + 1; i < endIndex; i++) {
              if (scheduleGrid[i] && scheduleGrid[i][dayIndex]) {
                scheduleGrid[i][dayIndex] = {
                  content: null,
                  isOccupied: true
                };
              }
            }
          }
        });
      });
    }
  
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
          {timeSlots.map((timeSlot, rowIndex) => (
            <tr key={timeSlot}>
              <td>{timeSlot}</td>
              {daysOfWeek.map((day, colIndex) => {
                const cell = scheduleGrid[rowIndex][colIndex];
  
                // Skip rendering if cell is occupied but not the start of a subject
                if (cell.isOccupied && !cell.content) {
                  return null;
                }
  
                // Render subject cell
                if (cell.content) {
                  return (
                    <td 
                      key={`${day}-${rowIndex}`}
                      rowSpan={cell.content.span}
                      className="schedule-subject-cell"
                    >
                      <div className="subject-name">{cell.content.subject}</div>
                      <div className="section-info">
                        {cell.content.section}
                      </div>
                      {scheduleTab === 'section_schedule' && cell.content.teacher && (
                        <div className="teacher-info">
                          {cell.content.teacher}
                        </div>
                      )}
                    </td>
                  );
                }
  
                // Render empty cell
                return <td key={`${day}-${rowIndex}`}></td>;
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
          <button 
            className={`tab-button ${scheduleTab === 'my_schedule' ? 'active' : ''}`}
            onClick={() => setScheduleTab('my_schedule')}
          >
            My Schedule
          </button>
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
        
        {(scheduleTab === 'my_schedule' && schedule.length === 0) || 
         (scheduleTab === 'section_schedule' && sectionSchedule.length === 0) ? (
          <div className="empty-schedule-notice">
            <p>No classes have been assigned yet.</p>
          </div>
        ) : null}
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