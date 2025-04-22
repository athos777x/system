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
  const [debugInfo, setDebugInfo] = useState('');
  
  const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
  
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
        setDebugInfo(`Fetched ${processedSchedule.length} schedule items`);
      } catch (error) {
        console.error('Error fetching schedule:', error);
        setDebugInfo(`Error fetching schedule: ${error.message}`);
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
        console.log('Schedule response:', scheduleResponse.data);
        
        // Process the schedule data
        const processedSchedule = scheduleResponse.data.map(item => {
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

  const renderSchedule = () => {
    console.log("Rendering schedule with data:", schedule);
    
    if (!schedule || schedule.length === 0) {
      return (
        <div className="empty-schedule-notice">
          <p>No classes have been assigned yet. {debugInfo}</p>
        </div>
      );
    }

    // Create a map for each day's schedule, including empty slots
    const daySchedules = {};
    daysOfWeek.forEach(day => {
      daySchedules[day] = [];
    });

    // First, add all scheduled items
    schedule.forEach(item => {
      console.log("Processing schedule item:", item);
      
      // Make sure we use a consistent property for days
      const itemDays = item.days || [];
      
      console.log("Item days:", itemDays);
      
      itemDays.forEach(day => {
        // Make sure day is a string and properly capitalized
        const formattedDay = typeof day === 'string' ? 
                            day.charAt(0).toUpperCase() + day.slice(1).toLowerCase() : 
                            String(day);
                            
        console.log(`Checking day: "${formattedDay}" against days of week:`, daysOfWeek);
        
        if (daysOfWeek.includes(formattedDay)) {
          console.log(`Adding schedule for day: ${formattedDay}`);
          daySchedules[formattedDay].push({
            startTime: item.time_start,
            endTime: item.time_end,
            subject: item.subject_name,
            teacher: item.teacher_name,
            isEmpty: false
          });
        } else {
          console.log(`Day not recognized: "${formattedDay}"`);
        }
      });
    });

    // For debugging - check what was added to each day's schedule
    daysOfWeek.forEach(day => {
      console.log(`${day} schedule:`, daySchedules[day]);
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
    
    console.log("Final time ranges:", timeRanges);

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
                    {matchingSlot.teacher && (
                      <div className="teacher-name">{matchingSlot.teacher}</div>
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
