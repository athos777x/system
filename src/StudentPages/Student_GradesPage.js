import React, { useEffect, useState } from 'react';
import axios from 'axios';
import '../StudentPagesCss/Student_GradesPage.css'; // Import the CSS file

function Student_GradesPage() {
  const [grades, setGrades] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const userId = localStorage.getItem('userId'); // Get the userId from localStorage

  useEffect(() => {
    const fetchGrades = async () => {
      try {
        console.log(`Fetching grades for userId: ${userId}`);
        const response = await axios.get(`http://localhost:3001/user/${userId}/grades`);
        console.log('Grades fetched:', response.data);
        setGrades(response.data);
      } catch (error) {
        setError('There was an error fetching the grades!');
        console.error('Error fetching grades:', error);
      } finally {
        setLoading(false);
      }
    };

    if (userId) {
      fetchGrades();
    } else {
      setError('User ID not found. Please log in again.');
      setLoading(false);
    }
  }, [userId]);

  if (loading) {
    return <div className="student-grades-loading-message">Loading...</div>;
  }

  if (error) {
    return <div className="student-grades-error-message">{error}</div>;
  }

  if (grades.length === 0) {
    return <div className="student-grades-no-grades-message">No grades available.</div>;
  }

  // Group grades by grade level
  const groupedGrades = grades.reduce((acc, grade) => {
    if (!acc[grade.grade_level]) {
      acc[grade.grade_level] = [];
    }
    acc[grade.grade_level].push(grade);
    return acc;
  }, {});

  // Sort grade levels in descending order
  const sortedGradeLevels = Object.keys(groupedGrades).sort((a, b) => b - a);

  return (
    <div className="student-grades-container">
      <h1 className="student-grades-title">Student Grades</h1>
      {sortedGradeLevels.map((gradeLevel) => (
        <div key={gradeLevel}>
          <h2 className="student-grades-subtitle">Grade Level: {gradeLevel}</h2>
          <table className="student-grades-table">
            <thead>
              <tr>
                <th>Subject</th>
                <th>Q1</th>
                <th>Q2</th>
                <th>Q3</th>
                <th>Q4</th>
                <th>Final Grade</th>
                <th>Remarks</th>
              </tr>
            </thead>
            <tbody>
              {groupedGrades[gradeLevel].map((grade, index) => (
                <tr key={index}>
                  <td>{grade.subject_name}</td>
                  <td>{grade.first_quarter}</td>
                  <td>{grade.second_quarter}</td>
                  <td>{grade.third_quarter}</td>
                  <td>{grade.fourth_quarter}</td>
                  <td>{grade.final_grade}</td>
                  <td>{grade.remarks}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ))}
    </div>
  );
}

export default Student_GradesPage;
