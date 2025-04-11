import React, { useState, useEffect } from 'react';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import '../StudentPagesCss/Student_AttendancePage.css';
import axios from 'axios';

function Student_AttendancePage() {
  const [attendanceData, setAttendanceData] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [schoolYears, setSchoolYears] = useState([]);
  const [selectedSchoolYear, setSelectedSchoolYear] = useState('');
  const [studentInfo, setStudentInfo] = useState({
    grade_level: '',
    section_name: '',
    school_year: ''
  });

  const userId = localStorage.getItem('userId');

  useEffect(() => {
    const fetchSchoolYears = async () => {
      try {
        const response = await axios.get(`http://localhost:3001/student/${userId}/school-years`);
        setSchoolYears(response.data || []);
        if (response.data.length > 0) {
          setSelectedSchoolYear(response.data[0].school_year_id);
        }
      } catch (error) {
        console.error('Error fetching school years:', error);
      }
    };

    if (userId) {
      fetchSchoolYears();
    }
  }, [userId]);

  useEffect(() => {
    const fetchStudentInfo = async () => {
      try {
        if (!userId || !selectedSchoolYear) return;
  
        // Fetch studentId using userId
        const studentResponse = await axios.get(
          `http://localhost:3001/user-id/convert/student-id?userId=${userId}&schoolYearId=${selectedSchoolYear}`
        );
  
        if (studentResponse.data.success) {
          const studentId = studentResponse.data.studentId; // Extract student_id
  
          // Fetch section using studentId
          const sectionResponse = await axios.get(
            `http://localhost:3001/student-section/${studentId}?schoolYearId=${selectedSchoolYear}`
          );
  
          // Update state with student info
          setStudentInfo({
            grade_level: `Grade ${studentResponse.data.gradeLevel || 'N/A'}`,
            section_name: sectionResponse.data.section || 'Not Assigned',
            school_year: schoolYears.find(year => year.school_year_id === selectedSchoolYear)?.school_year || 'Not Set'
          });
        }
      } catch (error) {
        console.error('Error fetching student info:', error);
      }
    };
  
    if (userId && selectedSchoolYear) {
      fetchStudentInfo();
    }
  }, [userId, selectedSchoolYear, schoolYears]);
  

  useEffect(() => {
    const fetchAttendance = async () => {
      try {
        if (!userId || !selectedSchoolYear) return;
        const response = await axios.get(`http://localhost:3001/attendance/${userId}?schoolYearId=${selectedSchoolYear}`);
        setAttendanceData(response.data);
      } catch (error) {
        console.error('Error fetching attendance data:', error);
      }
    };

    fetchAttendance();
  }, [userId, selectedSchoolYear]);
  
  const handleDateChange = (date) => {
    setSelectedDate(date);
  };

  const getStatusClass = (status) => {
    switch (status.toLowerCase()) {
      case 'present':
        return 'status-present';
      case 'absent':
        return 'status-absent';
      case 'late':
        return 'status-late';
      default:
        return '';
    }
  };

  const renderTileContent = ({ date, view }) => {
    if (view === 'month') {
      const attendance = attendanceData.filter(
        (entry) => new Date(entry.date).toDateString() === date.toDateString()
      );
      if (attendance.length > 0) {
        return (
          <div className="tile-content">
            {attendance.map((entry, index) => (
              <div 
                key={index} 
                className={getStatusClass(entry.status)}
                title={`${entry.subject_name}: ${entry.status}`}
              >
                •
              </div>
            ))}
          </div>
        );
      }
    }
  };

  const handleSchoolYearChange = (event) => {
    setSelectedSchoolYear(event.target.value);
  };  

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="student-attendance-container">
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

      <h1 className="student-attendance-title">Attendance Record</h1>
      <Calendar
        onChange={handleDateChange}
        value={selectedDate}
        tileContent={renderTileContent}
        className="attendance-calendar"
        maxDetail="month"
        minDetail="decade"
      />
      <div className="attendance-details">
        <h2>Attendance for {formatDate(selectedDate)}</h2>
        <table className="attendance-table">
          <thead>
            <tr>
              <th>Subject</th>
              <th>Day</th>
              <th>Time Start</th>
              <th>Time End</th>
              <th>Teacher</th>
              <th>Attendance</th>
            </tr>
          </thead>
          <tbody>
            {attendanceData
              .filter((entry) => new Date(entry.date).toDateString() === selectedDate.toDateString())
              .map((entry, index) => (
                <tr key={index}>
                  <td>{entry.subject_name}</td>
                  <td>{new Date(entry.date).toLocaleDateString('en-US', { weekday: 'long' })}</td>
                  <td>{entry.time_start || 'N/A'}</td>
                  <td>{entry.time_end || 'N/A'}</td>
                  <td>{entry.teacher_name || 'N/A'}</td>
                  <td>
                    <span className={`status-badge ${entry.status.toLowerCase()}`}>
                      {entry.status}
                    </span>
                    {entry.remarks && (
                      <div className="remarks-text">
                        Remarks: {entry.remarks}
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            {attendanceData.filter((entry) => 
              new Date(entry.date).toDateString() === selectedDate.toDateString()
            ).length === 0 && (
              <tr>
                <td colSpan="6" className="no-records">No attendance records for this date.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default Student_AttendancePage;
