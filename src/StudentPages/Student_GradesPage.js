import React, { useEffect, useState } from 'react';
import axios from 'axios';
import '../StudentPagesCss/Student_GradesPage.css';

function Student_GradesPage() {
  const [studentId, setStudentId] = useState(null);
  const [gradeLevel, setGradeLevel] = useState(null);
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [gradesFetched, setGradesFetched] = useState(false);
  const [studentInfo, setStudentInfo] = useState({
    name: '',
    section: '',
    schoolYear: ''
  });

  const userId = localStorage.getItem('userId');

  // Fetch student info and grades
  useEffect(() => {
    const fetchStudentData = async () => {
      try {
        // Get student ID and grade level
        const studentResponse = await axios.get('http://localhost:3001/user-id/convert/student-id', {
          params: { userId },
        });

        if (studentResponse.data.success) {
          setStudentId(studentResponse.data.studentId);
          setGradeLevel(studentResponse.data.gradeLevel);

          // Get section info
          const sectionResponse = await axios.get(`http://localhost:3001/student-section/${userId}`);
          
          // Get school year
          const schoolYearResponse = await axios.get('http://localhost:3001/school-years');
          
          setStudentInfo({
            name: studentResponse.data.name || '',
            section: sectionResponse.data.section || 'Not Assigned',
            schoolYear: schoolYearResponse.data[0]?.school_year || 'Current School Year'
          });
        } else {
          throw new Error(studentResponse.data.message || 'Failed to fetch student data.');
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

  // Fetch subjects and grades
  useEffect(() => {
    const fetchSubjectsAndGrades = async () => {
      try {
        if (!studentId || !gradeLevel) return;

        const [subjectsResponse, gradesResponse] = await Promise.all([
          axios.get('http://localhost:3001/api/subjects-card', {
            params: { studentId },
          }),
          axios.get('http://localhost:3001/api/grades', {
            params: {
              studentId,
              gradeLevel,
            },
          })
        ]);

        if (gradesResponse.data.success) {
          const grades = gradesResponse.data.grades;
          const updatedSubjects = (subjectsResponse.data || []).map((subject) => {
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
        }
      } catch (error) {
        console.error('Error fetching subjects and grades:', error);
        setError('An error occurred while fetching grades.');
      } finally {
        setLoading(false);
      }
    };

    fetchSubjectsAndGrades();
  }, [studentId, gradeLevel]);

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

  const getGradeClass = (grade) => {
    if (grade === '-') return '';
    const numGrade = parseFloat(grade);
    if (numGrade >= 90) return 'grade-indicator high';
    if (numGrade >= 75) return 'grade-indicator medium';
    return 'grade-indicator low';
  };

  if (loading) {
    return (
      <div className="student-grades-loading-message">
        Loading grades...
      </div>
    );
  }

  if (error) {
    return (
      <div className="student-grades-error-message">
        {error}
      </div>
    );
  }

  if (subjects.length === 0) {
    return (
      <div className="student-grades-no-grades-message">
        No grades available at this time.
      </div>
    );
  }

  const q1Average = calculateGeneralAverage('q1');
  const q2Average = calculateGeneralAverage('q2');
  const q3Average = calculateGeneralAverage('q3');
  const q4Average = calculateGeneralAverage('q4');

  return (
    <div className="page-container">
      <div className="grades-card">
        <h2>Grade Report Card</h2>
        <div className="student-info-header">
          <div className="student-info-row">
            <div className="student-info-item">
              <span className="student-info-label">Grade Level:</span>
              <span className="student-info-value">Grade {gradeLevel}</span>
            </div>
            <div className="student-info-divider" />
            <div className="student-info-item">
              <span className="student-info-label">Section:</span>
              <span className="student-info-value">{studentInfo.section}</span>
            </div>
            <div className="student-info-divider" />
            <div className="student-info-item">
              <span className="student-info-label">School Year:</span>
              <span className="student-info-value">{studentInfo.schoolYear}</span>
            </div>
          </div>
        </div>

        <div className="grades-detailed-table">
          <table className="students-table">
            <thead>
              <tr>
                <th>Subject</th>
                <th>1st</th>
                <th>2nd</th>
                <th>3rd</th>
                <th>4th</th>
              </tr>
            </thead>
            <tbody>
              {subjects.map((subject, index) => (
                <tr key={index}>
                  <td>{subject.subject_name}</td>
                  <td><span className={getGradeClass(subject.q1)}>{subject.q1}</span></td>
                  <td><span className={getGradeClass(subject.q2)}>{subject.q2}</span></td>
                  <td><span className={getGradeClass(subject.q3)}>{subject.q3}</span></td>
                  <td><span className={getGradeClass(subject.q4)}>{subject.q4}</span></td>
                </tr>
              ))}
              <tr>
                <td><strong>General Average</strong></td>
                <td><span className={getGradeClass(q1Average)}>{q1Average}</span></td>
                <td><span className={getGradeClass(q2Average)}>{q2Average}</span></td>
                <td><span className={getGradeClass(q3Average)}>{q3Average}</span></td>
                <td><span className={getGradeClass(q4Average)}>{q4Average}</span></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default Student_GradesPage;
