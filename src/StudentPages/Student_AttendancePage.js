import React, { useState, useEffect } from 'react';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import '../StudentPagesCss/Student_AttendancePage.css';
import axios from 'axios';

function Student_AttendancePage() {
  const [attendanceData, setAttendanceData] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [studentInfo, setStudentInfo] = useState({
    grade_level: '',
    section_name: '',
    school_year: ''
  });

  const userId = localStorage.getItem('userId');

  useEffect(() => {
    const fetchStudentInfo = async () => {
      try {
        const response = await axios.get(`http://localhost:3001/user/${userId}/info`);
        setStudentInfo(response.data);
      } catch (error) {
        console.error('Error fetching student info:', error);
      }
    };

    const fetchAttendance = async () => {
      try {
        const response = await axios.get(`http://localhost:3001/user/${userId}/attendance`);
        setAttendanceData(response.data);
      } catch (error) {
        console.error('Error fetching attendance data:', error);
      }
    };

    if (userId) {
      fetchStudentInfo();
      fetchAttendance();
    }
  }, [userId]);

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
            <span className="student-info-value">{studentInfo.school_year}</span>
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
        {attendanceData
          .filter((entry) => new Date(entry.date).toDateString() === selectedDate.toDateString())
          .map((entry, index) => (
            <div key={index} className="attendance-entry">
              <p>
                <strong>{entry.subject_name}</strong>
                <span className={`status-badge ${entry.status.toLowerCase()}`}>
                  {entry.status}
                </span>
              </p>
              {entry.remarks && (
                <p className="remarks">
                  Remarks: {entry.remarks}
                </p>
              )}
            </div>
          ))}
        {attendanceData.filter((entry) => 
          new Date(entry.date).toDateString() === selectedDate.toDateString()
        ).length === 0 && (
          <div className="attendance-entry">
            <p>No attendance records for this date.</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default Student_AttendancePage;
