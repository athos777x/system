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
  const [error, setError] = useState(null);
  
  const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
  const timeSlots = [
    '07:00 AM - 08:00 AM', '08:00 AM - 09:00 AM', '09:00 AM - 10:00 AM',
    '10:00 AM - 11:00 AM', '11:00 AM - 12:00 PM', '12:00 PM - 01:00 PM',
    '01:00 PM - 02:00 PM', '02:00 PM - 03:00 PM', '03:00 PM - 04:00 PM',
    '04:00 PM - 05:00 PM'
  ];

  useEffect(() => {
    const fetchTeacherSchedule = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        const userId = localStorage.getItem('userId');
        // First, get the teacher's information
        const teacherResponse = await axios.get(`http://localhost:3001/user/${userId}`);
        setTeacherName(`${teacherResponse.data.first_name} ${teacherResponse.data.last_name}`);
        
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
        setError('Failed to load schedule. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchTeacherSchedule();
  }, []);

  const getTimeSlotIndex = (time) => {
    const [hours, minutes] = time.split(':');
    const hourInt = parseInt(hours, 10);
    const minuteInt = parseInt(minutes, 10);
    return Math.floor((hourInt - 7) + (minuteInt / 60));
  };

  const renderSchedule = () => {
    // Initialize schedule grid
    const scheduleGrid = timeSlots.map(() => 
      daysOfWeek.map(() => ({ content: null, isOccupied: false }))
    );

    // Fill in the schedule grid if there's data
    if (schedule && schedule.length > 0) {
      schedule.forEach(item => {
        const startIndex = getTimeSlotIndex(item.time_start);
        const endIndex = getTimeSlotIndex(item.time_end);
        const duration = endIndex - startIndex;

        item.days.forEach(day => {
          const dayIndex = daysOfWeek.indexOf(day);
          if (dayIndex !== -1) {
            // Mark the starting cell with the subject info
            scheduleGrid[startIndex][dayIndex] = {
              content: {
                subject: item.subject_name,
                section: item.section_name,
                grade: item.grade_level,
                span: duration
              },
              isOccupied: true
            };

            // Mark subsequent cells as occupied
            for (let i = startIndex + 1; i < endIndex; i++) {
              scheduleGrid[i][dayIndex] = {
                content: null,
                isOccupied: true
              };
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
                        Grade {cell.content.grade} - {cell.content.section}
                      </div>
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
      pdf.save(`${teacherName}_schedule.pdf`);
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
      
      <div className="teacher-schedule-table-container">
        {error && (
          <div className="error-overlay">
            <p className="error-message">Failed to load schedule.</p>
            <button 
              onClick={() => window.location.reload()} 
              className="retry-button"
            >
              Retry
            </button>
          </div>
        )}
        
        {renderSchedule()}
        
        {!error && schedule.length === 0 && (
          <div className="empty-schedule-notice">
            <p>No classes have been assigned yet.</p>
          </div>
        )}
      </div>
      
      <div className="print-button-container">
        <button 
          onClick={generatePDF} 
          className="print-button"
          disabled={isGeneratingPDF}
        >
          {isGeneratingPDF ? 'Generating PDF...' : 'Download PDF'}
        </button>
      </div>
    </div>
  );
}

export default Teacher_SchedulePage; 