import React, { useEffect, useState } from 'react';
import axios from 'axios';
import '../StudentPagesCss/Student_GradesPage.css'; // Import the CSS file

function Student_GradesPage() {
  const [studentId, setStudentId] = useState(null);
  const [gradeLevel, setGradeLevel] = useState(null);
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [gradesFetched, setGradesFetched] = useState(false);

  const userId = localStorage.getItem('userId');

  // Fetch student ID and gradeLevel
  useEffect(() => {
    const fetchStudentData = async () => {
      try {
        const response = await axios.get('http://localhost:3001/user-id/convert/student-id', {
          params: { userId },
        });

        if (response.data.success) {
          setStudentId(response.data.studentId);
          setGradeLevel(response.data.gradeLevel); 
        } else {
          throw new Error(response.data.message || 'Failed to fetch student data.');
        }
      } catch (error) {
        console.error('Error fetching student data:', error);
        setError('An error occurred while fetching student data.');
      }
    };

    if (userId) {
      fetchStudentData();
    }
  }, [userId]);

  // Fetch subjects
  useEffect(() => {
    const fetchSubjects = async () => {
      try {
        const response = await axios.get('http://localhost:3001/api/subjects-card', {
          params: { studentId },
        });
        setSubjects(response.data || []);
      } catch (error) {
        console.error('Error fetching subjects:', error);
        setError('An error occurred while fetching subjects.');
      }
    };

    if (studentId) {
      fetchSubjects();
    }
  }, [studentId]);

  // Fetch grades once subjects are loaded
  useEffect(() => {
    const fetchGrades = async () => {
      try {
        const response = await axios.get('http://localhost:3001/api/grades', {
          params: {
            studentId,
            gradeLevel, 
          },
        });

        if (response.data.success) {
          const grades = response.data.grades;
          const updatedSubjects = subjects.map((subject) => {
            const subjectGrades = grades.find(
              (grade) => grade.subject_name === subject.subject_name
            ) || {};

            return {
              ...subject,
              q1: subjectGrades.q1 || '-',
              q2: subjectGrades.q2 || '-',
              q3: subjectGrades.q3 || '-',
              q4: subjectGrades.q4 || '-',
            };
          });

          setSubjects(updatedSubjects);
          setGradesFetched(true);
        } else {
          throw new Error('Failed to fetch grades.');
        }
      } catch (error) {
        console.error('Error fetching grades:', error);
        setError('An error occurred while fetching grades.');
      } finally {
        setLoading(false);
      }
    };

    if (subjects.length > 0 && studentId && gradeLevel && !gradesFetched) {
      fetchGrades();
    }
  }, [subjects, studentId, gradeLevel, gradesFetched]);

  // Calculate the general average for each quarter
  const calculateGeneralAverage = (quarter) => {
    let total = 0;
    let count = 0;

    subjects.forEach((subject) => {
      const grade = subject[quarter];
      if (grade !== '-') {
        total += parseFloat(grade);
        count += 1;
      }
    });

    return count > 0 ? Math.round(total / count) : '-';
  };

  // Determine the style based on the average
  const getAverageColor = (average) => {
    if (average === '-') return '';
    return average <= 74 ? 'average-red-text' : 'average-green-text';
  };

  if (loading) {
    return <div className="student-grades-loading-message">Loading...</div>;
  }

  if (error) {
    return <div className="student-grades-error-message">{error}</div>;
  }

  if (subjects.length === 0) {
    return <div className="student-grades-no-grades-message">No subjects available.</div>;
  }

  const q1Average = calculateGeneralAverage('q1');
  const q2Average = calculateGeneralAverage('q2');
  const q3Average = calculateGeneralAverage('q3');
  const q4Average = calculateGeneralAverage('q4');

  return (
    <div className="grades-container">
      <h2>Grades</h2>
      <div className="grades-detailed-table">
        <table className="students-table">
          <thead>
            <tr>
              <th>Subject</th>
              <th>1</th>
              <th>2</th>
              <th>3</th>
              <th>4</th>
            </tr>
          </thead>
          <tbody>
            {subjects.map((subject, index) => (
              <tr key={index}>
                <td>{subject.subject_name}</td>
                <td>{subject.q1}</td>
                <td>{subject.q2}</td>
                <td>{subject.q3}</td>
                <td>{subject.q4}</td>
              </tr>
            ))}
            <tr>
              <td><strong>General Average</strong></td>
              <td><strong className={getAverageColor(q1Average)}>{q1Average}</strong></td>
              <td><strong className={getAverageColor(q2Average)}>{q2Average}</strong></td>
              <td><strong className={getAverageColor(q3Average)}>{q3Average}</strong></td>
              <td><strong className={getAverageColor(q4Average)}>{q4Average}</strong></td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default Student_GradesPage;
