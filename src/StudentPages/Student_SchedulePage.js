import React, { useState, useEffect } from 'react';
import axios from 'axios';
import '../StudentPagesCss/Student_SchedulePage.css';

function Student_SchedulePage() {
  const [schedule, setSchedule] = useState([]);
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
        setSchedule(response.data);
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
    return (hourInt - 7) + (minuteInt / 60);
  };

  const renderSchedule = () => {
    const renderedSchedule = Array(timeSlots.length).fill().map(() => Array(daysOfWeek.length).fill(null));

    schedule.forEach(item => {
      const startIndex = getTimeSlotIndex(item.time_start.slice(0, 5));
      const endIndex = getTimeSlotIndex(item.time_end.slice(0, 5));
      const dayIndex = daysOfWeek.indexOf(item.day);

      for (let i = startIndex; i < endIndex; i++) {
        if (i === startIndex) {
          renderedSchedule[i][dayIndex] = { subject: item.subject_name, span: endIndex - startIndex };
        } else {
          renderedSchedule[i][dayIndex] = 'span';
        }
      }
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
          {timeSlots.map((timeSlot, index) => (
            <tr key={timeSlot}>
              <td>{timeSlot}</td>
              {daysOfWeek.map((day, dayIndex) => {
                const item = renderedSchedule[index][dayIndex];
                if (item === 'span') {
                  return null;
                }
                if (item) {
                  const { subject, span } = item;
                  return (
                    <td key={day} rowSpan={span}>{subject}</td>
                  );
                }
                return <td key={day}></td>;
              })}
            </tr>
          ))}
        </tbody>
      </table>
    );
  };

  return (
    <div className="student-schedule-container">
      <h1 className="student-schedule-title">Schedule</h1>
      <div className="student-schedule-table-container">
        {renderSchedule()}
      </div>
    </div>
  );
}

export default Student_SchedulePage;
