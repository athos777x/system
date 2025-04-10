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
  const [schoolYears, setSchoolYears] = useState([]);
  const [selectedSchoolYear, setSelectedSchoolYear] = useState(null);
  const [studentInfo, setStudentInfo] = useState({
    name: '',
    section: '',
    schoolYear: '',
    schoolYearId: null,
  });

  const userId = localStorage.getItem('userId');

  useEffect(() => {
    const fetchSchoolYears = async () => {
      try {
        const schoolYearResponse = await axios.get(
          `http://localhost:3001/student/${userId}/school-years`
        );

        if (schoolYearResponse.data.length > 0) {
          setSchoolYears(schoolYearResponse.data);
          const activeSchoolYear = schoolYearResponse.data.find(year => year.is_active) || schoolYearResponse.data[0];

          setSelectedSchoolYear(activeSchoolYear.school_year_id);
          setStudentInfo(prev => ({
            ...prev,
            schoolYear: activeSchoolYear.school_year,
            schoolYearId: activeSchoolYear.school_year_id,
          }));
        }
      } catch (error) {
        console.error('Error fetching school years:', error);
        setError('An error occurred while fetching school years.');
      }
    };

    if (userId) {
      fetchSchoolYears();
    }
  }, [userId]);

  // Fetch student info and grades
  useEffect(() => {
    if (!selectedSchoolYear) return;
  
    const fetchStudentData = async () => {
      try {
        const studentResponse = await axios.get(
          `http://localhost:3001/user-id/convert/student-id?userId=${userId}&schoolYearId=${selectedSchoolYear}`
        );
  
        if (studentResponse.data.success) {
          console.log("Fetched Student ID:", studentResponse.data.studentId);
          console.log("Fetched School Year ID:", studentResponse.data.schoolYearId);
  
          const studentId = studentResponse.data.studentId;
          setStudentId(studentId);
          setGradeLevel(studentResponse.data.gradeLevel);
  
          if (!studentId) {
            console.error("Error: studentId is undefined!");
            return;
          }
  
          const sectionResponse = await axios.get(
            `http://localhost:3001/student-section/${studentId}`,
            { params: { schoolYearId: selectedSchoolYear } } // Ensure correct schoolYearId
          );
  
          console.log("Section Response:", sectionResponse.data);
  
          setStudentInfo(prev => ({
            ...prev,
            name: studentResponse.data.name || '',
            section: sectionResponse.data.section || 'Not Assigned', // Use correct response data
          }));
        } else {
          throw new Error(studentResponse.data.message || 'Failed to fetch student data.');
        }
      } catch (error) {
        console.error('Error fetching student data:', error);
        setError('An error occurred while fetching student data.');
      }
    };
  
    fetchStudentData();
  }, [selectedSchoolYear]);
  
  
  

  // Fetch subjects and grades
  useEffect(() => {
    const fetchSubjectsAndGrades = async () => {
      try {
        if (!studentId || !gradeLevel || !studentInfo.schoolYearId) return;
  
        const schoolYearId = studentInfo.schoolYearId; // Retrieve school_year_id
  
        const [subjectsResponse, gradesResponse] = await Promise.all([
          axios.get('http://localhost:3001/api/subjects-card', {
            params: { studentId, gradeLevel, schoolYearId },
          }),
          axios.get('http://localhost:3001/api/grades', {
            params: { studentId, gradeLevel, schoolYearId },
          }),
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
  }, [studentId, gradeLevel, studentInfo.schoolYearId]); 
  
  
  const handleSchoolYearChange = (event) => {
    const newSchoolYearId = event.target.value;
    setSelectedSchoolYear(newSchoolYearId);

    const selectedYear = schoolYears.find((year) => year.school_year_id === newSchoolYearId);
    setStudentInfo((prevInfo) => ({
      ...prevInfo,
      schoolYear: selectedYear ? selectedYear.school_year : prevInfo.schoolYear,
      schoolYearId: newSchoolYearId,
    }));
  };


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

  const getGradeClass = (grade, isIncomplete = false) => {
    if (grade === '-') return '';
    if (isIncomplete) return 'grade-indicator incomplete';
    
    const numGrade = parseFloat(grade);
    if (numGrade >= 90) return 'grade-indicator high';
    if (numGrade >= 75) return 'grade-indicator medium';
    return 'grade-indicator low';
  };

  const calculateFinalGrade = (subject) => {
    const q1 = parseFloat(subject.q1) || 0;
    const q2 = parseFloat(subject.q2) || 0;
    const q3 = parseFloat(subject.q3) || 0;
    const q4 = parseFloat(subject.q4) || 0;
    
    // Count how many quarters have grades
    const gradesCount = [q1, q2, q3, q4].filter(grade => grade > 0).length;
    
    // Only calculate if at least one quarter has a grade
    if (gradesCount === 0) return '-';
    
    const finalGrade = (q1 + q2 + q3 + q4) / gradesCount;
    return finalGrade.toFixed(2);
  };

  const getRemarks = (finalGrade, subject) => {
    if (finalGrade === '-') return '-';
    
    // Check if all quarters have grades
    const hasAllQuarters = 
      subject.q1 !== '-' && 
      subject.q2 !== '-' && 
      subject.q3 !== '-' && 
      subject.q4 !== '-';
    
    // If not all quarters have grades and the current average is below passing
    if (!hasAllQuarters && parseFloat(finalGrade) < 75) {
      return 'Incomplete';
    }
    
    return parseFloat(finalGrade) >= 75 ? 'Passed' : 'Failed';
  };

  const getRemarksClass = (finalGrade, remarks) => {
    if (finalGrade === '-') return '';
    if (remarks === 'Incomplete') return 'remarks-incomplete';
    return parseFloat(finalGrade) >= 75 ? 'remarks-passed' : 'remarks-failed';
  };

  if (loading) {
    return (
      <div className="page-container">
        <div className="student-grades-loading-message">
          <div className="loading-spinner"></div>
          Loading grades...
        </div>
      </div>
    );
  }

  if (error || subjects.length === 0) {
    return (
      <div className="page-container">
        <div className="grades-card">
          <h2>Grade Report Card</h2>
          <div className="student-info-header">
            <div className="student-info-row">
              <div className="student-info-item">
                <span className="student-info-label">Grade Level</span>
                <span className="student-info-value">Grade {gradeLevel || '-'}</span>
              </div>
              <div className="student-info-divider" />
              <div className="student-info-item">
                <span className="student-info-label">Section</span>
                <span className="student-info-value">{studentInfo.section || 'Not Available'}</span>
              </div>
              <div className="student-info-divider" />
              <div className="student-info-item">
                <span className="student-info-label">School Year</span>
                <select 
                  value={selectedSchoolYear || studentInfo.schoolYearId} 
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

          <div className="grades-detailed-table">
            <table className="students-table">
              <thead>
                <tr>
                  <th>Subject</th>
                  <th>1st Quarter</th>
                  <th>2nd Quarter</th>
                  <th>3rd Quarter</th>
                  <th>4th Quarter</th>
                  <th>Final Grade</th>
                  <th>Remarks</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', padding: '2rem' }}>
                    {error ? 'Unable to fetch student data at this time.' : 'No grades available at this time.'}
                  </td>
                </tr>
                <tr>
                  <td><strong>General Average</strong></td>
                  <td><span>-</span></td>
                  <td><span>-</span></td>
                  <td><span>-</span></td>
                  <td><span>-</span></td>
                  <td colSpan="2"><span><strong>-</strong></span></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
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
              <span className="student-info-label">Grade Level</span>
              <span className="student-info-value">Grade {gradeLevel}</span>
            </div>
            <div className="student-info-divider" />
            <div className="student-info-item">
              <span className="student-info-label">Section</span>
              <span className="student-info-value">{studentInfo.section}</span>
            </div>
            <div className="student-info-divider" />
            <div className="student-info-item">
              <span className="student-info-label">School Year</span>
              <select 
                value={selectedSchoolYear || studentInfo.schoolYearId} 
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

        <div className="grades-detailed-table">
          <table className="students-table">
            <thead>
              <tr>
                <th>Subject</th>
                <th>1st Quarter</th>
                <th>2nd Quarter</th>
                <th>3rd Quarter</th>
                <th>4th Quarter</th>
                <th>Final Grade</th>
                <th>Remarks</th>
              </tr>
            </thead>
            <tbody>
              {subjects.map((subject, index) => {
                const finalGrade = calculateFinalGrade(subject);
                const remarks = getRemarks(finalGrade, subject);
                const remarksClass = getRemarksClass(finalGrade, remarks);
                
                return (
                  <tr key={index}>
                    <td>{subject.subject_name}</td>
                    <td><span className={getGradeClass(subject.q1)}>{subject.q1}</span></td>
                    <td><span className={getGradeClass(subject.q2)}>{subject.q2}</span></td>
                    <td><span className={getGradeClass(subject.q3)}>{subject.q3}</span></td>
                    <td><span className={getGradeClass(subject.q4)}>{subject.q4}</span></td>
                    <td><span className={getGradeClass(finalGrade)}>{finalGrade}</span></td>
                    <td><span className={remarksClass}>{remarks}</span></td>
                  </tr>
                );
              })}
              <tr>
                <td><strong>General Average</strong></td>
                <td><span className={getGradeClass(q1Average)}>{q1Average}</span></td>
                <td><span className={getGradeClass(q2Average)}>{q2Average}</span></td>
                <td><span className={getGradeClass(q3Average)}>{q3Average}</span></td>
                <td><span className={getGradeClass(q4Average)}>{q4Average}</span></td>
                <td colSpan="2">
                  {(() => {
                    const finalAverage = [q1Average, q2Average, q3Average, q4Average]
                      .filter(grade => grade !== '-')
                      .map(grade => parseFloat(grade));
                    
                    const avgValue = finalAverage.length > 0 
                      ? (finalAverage.reduce((sum, grade) => sum + grade, 0) / finalAverage.length).toFixed(2)
                      : '-';
                    
                    // Check if all quarters have grades for the general average
                    const hasAllQuarterAverages = 
                      q1Average !== '-' && 
                      q2Average !== '-' && 
                      q3Average !== '-' && 
                      q4Average !== '-';
                    
                    let finalStatus = '';
                    let isIncomplete = false;
                    
                    if (avgValue !== '-') {
                      if (!hasAllQuarterAverages && parseFloat(avgValue) < 75) {
                        finalStatus = ' (Incomplete)';
                        isIncomplete = true;
                      } else {
                        finalStatus = parseFloat(avgValue) >= 75 ? ' (Passed)' : ' (Failed)';
                      }
                    }
                    
                    return (
                      <span className={getGradeClass(avgValue, isIncomplete)}>
                        <strong>{avgValue}</strong>
                        {avgValue !== '-' && (
                          <span className={isIncomplete ? "final-remarks incomplete" : "final-remarks"}>
                            {finalStatus}
                          </span>
                        )}
                      </span>
                    );
                  })()}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default Student_GradesPage;
