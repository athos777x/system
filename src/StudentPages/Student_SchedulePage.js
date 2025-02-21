import React, { useState, useEffect } from 'react';
import axios from 'axios';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import '../StudentPagesCss/Student_SchedulePage.css';

function Student_SchedulePage() {
  const [schedule, setSchedule] = useState([]);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
  const timeSlots = [
    '07:00 AM - 08:00 AM', '08:00 AM - 09:00 AM', '09:00 AM - 10:00 AM',
    '10:00 AM - 11:00 AM', '11:00 AM - 12:00 PM', '12:00 PM - 01:00 PM',
    '01:00 PM - 02:00 PM', '02:00 PM - 03:00 PM', '03:00 PM - 04:00 PM',
    '04:00 PM - 05:00 PM'
  ];

  useEffect(() => {
    const fetchSchedule = async () => {
      try {
        const userId = localStorage.getItem('userId');
        const response = await axios.get(`http://localhost:3001/user/${userId}/schedule`);
        console.log('Fetched schedule:', response.data);
        
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
        console.error('Error fetching schedule:', error);
      }
    };

    fetchSchedule();
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

    // Fill in the schedule grid
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
              teacher: item.teacher_name,
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
                      {cell.content.teacher && (
                        <div className="teacher-name">{cell.content.teacher}</div>
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
      const scheduleElement = document.querySelector('.student-schedule-table-container');
      
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
      pdf.save('schedule.pdf');
    } catch (error) {
      console.error('Error generating PDF:', error);
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  return (
    <div className="student-schedule-container">
      <h1 className="student-schedule-title">Schedule</h1>
      <div className="student-schedule-table-container">
        {renderSchedule()}
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

export default Student_SchedulePage;
