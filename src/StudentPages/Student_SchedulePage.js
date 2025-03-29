import React, { useState, useEffect } from 'react';
import axios from 'axios';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import '../StudentPagesCss/Student_SchedulePage.css';

function Student_SchedulePage() {
  const [schedule, setSchedule] = useState([]);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [studentId, setStudentId] = useState(null);
  const [studentInfo, setStudentInfo] = useState({
    grade_level: '',
    section_name: '',
    school_year: ''
  });  
  const [selectedSchoolYear, setSelectedSchoolYear] = useState('');
  const [schoolYears, setSchoolYears] = useState([]);
  
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
        if (!userId || !selectedSchoolYear) return; // Ensure both values exist
  
        const response = await axios.get(`http://localhost:3001/user/${userId}/schedule?schoolYearId=${selectedSchoolYear}`);
        console.log('Fetched schedule:', response.data);
  
        // Process the schedule data
        const processedSchedule = response.data.map(item => {
          let days = [];
          try {
            if (typeof item.day === 'string') {
              days = item.day.startsWith('[') ? JSON.parse(item.day) : [item.day];
            } else if (Array.isArray(item.day)) {
              days = item.day;
            } else {
              days = [item.day];
            }
          } catch (error) {
            console.error('Error parsing days:', error);
            days = [item.day];
          }
  
          return { ...item, days };
        });
  
        setSchedule(processedSchedule);
      } catch (error) {
        console.error('Error fetching schedule:', error);
      }
    };
  
    fetchSchedule();
  }, [selectedSchoolYear]); // Fetch whenever school year changes
  
  useEffect(() => {
    const fetchSchoolYears = async () => {
      try {
        const userId = localStorage.getItem('userId');
        if (!userId) return;
  
        const response = await axios.get(`http://localhost:3001/student/${userId}/school-years`);
        console.log('Filtered school years:', response.data);
  
        if (response.data.length > 0) {
          // Set the default to the most recent school year
          setSelectedSchoolYear(response.data[0].school_year_id);
        }
  
        setSchoolYears(response.data);
      } catch (error) {
        console.error('Error fetching school years:', error);
      }
    };
  
    fetchSchoolYears();
  }, []);
  
  
  
  useEffect(() => {
    const fetchStudentInfoForYear = async () => {
      try {
        const userId = localStorage.getItem('userId');
        if (!userId || !selectedSchoolYear) return;
  
        const studentResponse = await axios.get(
          `http://localhost:3001/user-id/convert/student-id?userId=${userId}&schoolYearId=${selectedSchoolYear}`
        );
  
        if (studentResponse.data.success) {
          setStudentId(studentResponse.data.studentId); // Store studentId globally
          setStudentInfo(prev => ({
            ...prev,
            grade_level: `Grade ${studentResponse.data.gradeLevel || 'N/A'}`
          }));
        }
      } catch (error) {
        console.error('Error fetching student info:', error);
      }
    };
  
    fetchStudentInfoForYear();
  }, [selectedSchoolYear]);
  
  useEffect(() => {
    const fetchSectionAndSchedule = async () => {
      try {
        const userId = localStorage.getItem('userId');
        if (!userId || !selectedSchoolYear) return;
  
        // Fetch schedule using userId
        const scheduleResponse = await axios.get(
          `http://localhost:3001/user/${userId}/schedule?schoolYearId=${selectedSchoolYear}`
        );
        setSchedule(scheduleResponse.data);
  
        // Fetch section using studentId if available
        if (!studentId) return;
        const sectionResponse = await axios.get(
          `http://localhost:3001/student-section/${studentId}?schoolYearId=${selectedSchoolYear}`
        );
  
        setStudentInfo(prev => ({
          ...prev,
          section_name: sectionResponse.data.section || 'Not Assigned'
        }));
      } catch (error) {
        console.error('Error fetching section or schedule:', error);
      }
    };
  
    fetchSectionAndSchedule();
  }, [selectedSchoolYear, studentId]); // Re-fetch when studentId updates

  const handleSchoolYearChange = (event) => {
    setSelectedSchoolYear(event.target.value);
  };
  
  const getTimeSlotIndex = (time) => {
    const [hours, minutes] = time.split(':');
    const hourInt = parseInt(hours, 10);
    const minuteInt = parseInt(minutes, 10);
    return Math.floor((hourInt - 7) + (minuteInt / 60));
  };

  const renderSchedule = () => {
    // Initialize schedule grid properly
    const scheduleGrid = Array.from({ length: timeSlots.length }, () => 
      Array.from({ length: daysOfWeek.length }, () => ({ content: null, isOccupied: false }))
    );
  
    // Fill in the schedule grid
    schedule.forEach((item, index) => {
      // Convert single 'day' property to 'days' array
      if (!item.days && item.day) {
        item.days = [item.day]; // Wrap single day in an array
      }
    
      if (!item || !item.days || !Array.isArray(item.days)) {
        console.warn(`Skipping entry at index ${index}: Invalid days format`, item);
        return;
      }
    
      item.days.forEach(day => {
        const dayIndex = daysOfWeek.indexOf(day);
        if (dayIndex === -1) {
          console.warn(`Skipping invalid day "${day}" at index ${index}.`);
          return;
        }
    
        const startIndex = getTimeSlotIndex(item.time_start);
        const endIndex = getTimeSlotIndex(item.time_end);
    
        if (startIndex < 0 || endIndex < 0 || startIndex >= timeSlots.length || endIndex > timeSlots.length) {
          console.error(`Invalid time slot range at index ${index}: start ${startIndex}, end ${endIndex}`);
          return;
        }
    
        if (!scheduleGrid[startIndex]) {
          console.error(`Invalid time slot index: ${startIndex} at index ${index}`);
          return;
        }
    
        const duration = endIndex - startIndex;
    
        scheduleGrid[startIndex][dayIndex] = {
          content: {
            subject: item.subject_name,
            teacher: item.teacher_name,
            span: duration
          },
          isOccupied: true
        };
    
        for (let i = startIndex + 1; i < endIndex && i < timeSlots.length; i++) {
          scheduleGrid[i][dayIndex] = { content: null, isOccupied: true };
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
  
                if (cell.isOccupied && !cell.content) {
                  return null;
                }
  
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
      <div className="grades-card">
      <h2>Schedule</h2>
      <div className="student-info-header">
      <div className="student-info-row">
          <div className="student-info-item">
            <span className="student-info-label">Grade Level:</span>
            <span className="student-info-value">{studentInfo.grade_level}</span>
          </div>
          <div className="student-info-divider" />
          <div className="student-info-item">
            <span className="student-info-label">Section:</span>
            <span className="student-info-value">{studentInfo.section_name}</span>
          </div>
          <div className="student-info-divider" />
          <div className="student-info-item">
            <span className="student-info-label">School Year:</span>
            <select 
              value={selectedSchoolYear} 
              onChange={handleSchoolYearChange}
              style={{ padding: '0.5rem', borderRadius: '4px' }}
            >
              {schoolYears.length > 0 ? (
                schoolYears.map((year) => (
                  <option key={year.school_year_id} value={year.school_year_id}>
                    {year.school_year}
                  </option>
                ))
              ) : (
                <option value="">No school years available</option>
              )}
            </select>
          </div>
        </div>
        </div>
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
    </div>
  );
}

export default Student_SchedulePage;
