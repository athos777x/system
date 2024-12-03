import React, { useState, useEffect } from 'react';
import axios from 'axios';
import '../RegistrarPagesCss/Registrar_GradesPage.css';

const Registrar_GradesPage = () => {
  // State variables
  const [selectedGrade, setSelectedGrade] = useState(null);
  const [selectedSection, setSelectedSection] = useState(null);
  const [sections, setSections] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [showGradesTable, setShowGradesTable] = useState(true);
  const [students, setStudents] = useState([]);
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [showSubjectGrades, setShowSubjectGrades] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [showStudentDetails, setShowStudentDetails] = useState(false);
  const [showAddActivityModal, setShowAddActivityModal] = useState(false);
  const [activityType, setActivityType] = useState(''); // 'WW', 'PT', or 'QA'
  const [writtenWorks, setWrittenWorks] = useState([]);
  const [performanceTasks, setPerformanceTasks] = useState([]);
  const [quarterlyAssessments, setQuarterlyAssessments] = useState([]);
  const [selectedGradingPeriod, setSelectedGradingPeriod] = useState('1st Grading');
  

  // Grade levels array
  const gradeLevels = [7, 8, 9, 10];

  // Handle grade level selection
  const handleGradeClick = async (grade) => {
    setSelectedGrade(grade);
    setSelectedSection(null); // Reset section selection
    setSubjects([]); // Reset subjects

    try {
      // Updated endpoint for fetching sections
      const response = await axios.get(`http://localhost:3001/sections-for-assignment/${grade}`);
      console.log('Fetched sections:', response.data); // Debug log
      setSections(response.data);
    } catch (error) {
      console.error('Error fetching sections:', error);
      setSections([]);
    }
  };

  // Handle section selection
  const handleSectionClick = async (section) => {
    setSelectedSection(section);

    try {
      const response = await axios.get(`http://localhost:3001/subjects-for-assignment/${selectedGrade}`);
      console.log('Fetched subjects:', response.data);
      setSubjects(response.data);
    } catch (error) {
      console.error('Error fetching subjects:', error);
      setSubjects([]);
    }
  };

  // Add this new handler
  const handleSectionInfoClick = () => {
    setShowGradesTable(false);
    fetchSectionStudents();
  };

  // Add this handler to go back
  const handleBackClick = () => {
    setShowGradesTable(true);
  };

  // Add this function to fetch students
  const fetchSectionStudents = async () => {
    try {
      if (!selectedSection?.section_id) {
        console.error('No section ID available');
        return;
      }

      let url;
      // If we have a selected subject, use the subject-specific endpoint
      if (selectedSubject?.id) {
        url = `http://localhost:3001/section-students/${
          selectedSection.section_id
        }/${
          selectedGrade
        }/${
          selectedSubject.id
        }/${
          selectedSubject.type === 'elective' ? 'elective' : 'subject'
        }`;
      } else {
        // Otherwise, use the basic endpoint for all students in section
        url = `http://localhost:3001/section-students/${selectedSection.section_id}/${selectedGrade}`;
      }
      
      console.log('Fetching students with URL:', url);
      const response = await axios.get(url);
      console.log('Fetched students:', response.data);
      setStudents(response.data);
    } catch (error) {
      console.error('Error fetching students:', error);
      setStudents([]);
    }
  };

  // Add handler for subject click
  const handleSubjectClick = (subject) => {
    console.log('Selected subject:', subject); // Debug log
    setSelectedSubject({
      subject_name: subject.subject_name,
      type: subject.type,
      id: subject.id
    });
    setShowSubjectGrades(true);
  };

  // Add handler to go back to grades table
  const handleBackToGrades = () => {
    setShowSubjectGrades(false);
    setSelectedSubject(null);
  };

 // Add handler for student name click
const handleStudentNameClick = (student) => {
  setSelectedStudent({
    ...student,
    gradingPeriod: selectedGradingPeriod, // Include the selected grading period
  });
  setShowStudentDetails(true);
};


  // Add handler to go back to subject grades table
  const handleBackToSubjectGrades = () => {
    setShowStudentDetails(false);
    setSelectedStudent(null);
  };

  // Add handler for add button click
  const handleAddActivity = (type) => {
    setActivityType(type);
    setShowAddActivityModal(true);
  };

  // Add handler for modal close
  const handleCloseModal = () => {
    setShowAddActivityModal(false);
    setActivityType('');
  };

  const fetchComponentData = async (componentType) => {
    const componentId =
      componentType === 'WW' ? 1 : componentType === 'PT' ? 2 : 3;
  
    try {
      const response = await axios.get('http://localhost:3001/get-components', {
        params: {
          student_id: selectedStudent?.student_id,
          subject_name: selectedSubject?.subject_name,
          component_id: componentId,
          grading: selectedGradingPeriod,
        },
      });
  
      if (componentType === 'WW') {
        setWrittenWorks(response.data);
      } else if (componentType === 'PT') {
        setPerformanceTasks(response.data);
      } else if (componentType === 'QA') {
        setQuarterlyAssessments(response.data);
      }
    } catch (error) {
      console.error(`Error fetching ${componentType} data:`, error);
    }
  };

  useEffect(() => {
    if (selectedStudent && selectedSubject) {
      fetchComponentData('WW');
      fetchComponentData('PT');
      fetchComponentData('QA');
    }
  }, [selectedStudent, selectedSubject]);
  
  

  // Update useEffect to fetch students when subject is selected
  useEffect(() => {
    if (selectedSubject && selectedSection) {
      fetchSectionStudents();
    }
  }, [selectedSubject, selectedSection]);

  return (
    <div className="grades-container">
      <h2>Grades</h2>
      
      {!showSubjectGrades && !showGradesTable && (
        <div className="detailed-grades-view">
          <button onClick={handleBackClick} className="back-button">
            ← Back
          </button>
          <div className="section-header">
            <h3>{selectedSection.section_name}</h3>
            <p>Class Advisor: {selectedSection.adviser_name?.toUpperCase() || 'NOT ASSIGNED'}</p>
          </div>
          <div className="grades-detailed-table">
            <table className="students-table">
              <thead>
                <tr>
                  <th>Student ID</th>
                  <th>Name</th>
                  {subjects.map((subject, index) => (
                    <th key={index}>{subject.subject_name}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {students.map((student, index) => (
                  <tr key={index}>
                    <td>{student.student_id}</td>
                    <td>{student.NAME}</td>
                    {subjects.map((subject, subIndex) => (
                      <td key={subIndex}>
                        {/* Grade cell - you can add input or display field here */}
                        -
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {!showSubjectGrades && showGradesTable && (
        // Original grades table
        <div className="grades-table">
          <div className="table-column">
            <h3>Grade Levels</h3>
            <div className="grade-buttons">
              {gradeLevels.map((grade) => (
                <button
                  key={grade}
                  onClick={() => handleGradeClick(grade)}
                  className={selectedGrade === grade ? 'active' : ''}
                >
                  Grade {grade}
                </button>
              ))}
            </div>
          </div>

          <div className="table-column">
            <h3>Sections</h3>
            {selectedGrade ? (
              <div className="section-list">
                {sections.length > 0 ? (
                  sections.map((section, index) => (
                    <button
                      key={index}
                      onClick={() => handleSectionClick(section)}
                      className={selectedSection?.section_name === section.section_name ? 'active' : ''}
                    >
                      {section.section_name}
                    </button>
                  ))
                ) : (
                  <p>No sections found for Grade {selectedGrade}</p>
                )}
              </div>
            ) : (
              <p>Please select a grade level</p>
            )}
          </div>

          <div className="table-column">
            <h3>Subjects</h3>
            {selectedSection && (
              <div 
                className="section-info"
                onClick={handleSectionInfoClick}
                style={{ cursor: 'pointer' }}
              >
                <span><strong>{selectedSection.section_name}</strong> {selectedSection.adviser_name?.toUpperCase() || 'NOT ASSIGNED'}</span>
              </div>
            )}
            <div className="subject-list">
              {selectedSection ? (
                subjects.length > 0 ? (
                  subjects.map((subject, index) => (
                    <button
                      key={index}
                      className={`subject-button ${subject.type === 'elective' ? 'elective' : ''}`}
                      onClick={() => handleSubjectClick({
                        subject_name: subject.subject_name,
                        type: subject.type,
                        id: subject.id
                      })}
                    >
                      {subject.subject_name}
                      {subject.type === 'elective' ? ' (Elective)' : ''}
                    </button>
                  ))
                ) : (
                  <p>No subjects found for Grade {selectedGrade}</p>
                )
              ) : (
                <p>Please select a section</p>
              )}
            </div>
          </div>
        </div>
      )}

      {showSubjectGrades && !showStudentDetails && (
        <div className="subject-grades-view">
          <button onClick={handleBackToGrades} className="back-button">
            ← Back to Grades
          </button>
          <div className="subject-header">
            <h3>
              {selectedSubject.subject_name}
              {selectedSubject.type === 'elective' ? ' (Elective)' : ''} - 
              Grade {selectedGrade} - 
              {selectedSection.section_name}
            </h3>
            
            {/* Grading Period Selector */}
            <div className="grading-period-selector">
              <label htmlFor="grading-period">Grading Period:</label>
              <select
                id="grading-period"
                value={selectedGradingPeriod}
                onChange={(e) => setSelectedGradingPeriod(e.target.value)}
              >
                <option value="1st Grading">1st Grading</option>
                <option value="2nd Grading">2nd Grading</option>
                <option value="3rd Grading">3rd Grading</option>
                <option value="4th Grading">4th Grading</option>
              </select>
            </div>
          </div>

          <div className="subject-grades-table">
            <table>
              <thead>
                <tr>
                  <th>Student ID</th>
                  <th>Name</th>
                  <th>Written Works</th>
                  <th>Performance Task</th>
                  <th>Quarterly Assessment</th>
                  <th>Total</th>
                </tr>
              </thead>
              <tbody>
                {students.map((student, index) => (
                  <tr key={index}>
                    <td>{student.student_id}</td>
                    <td 
                      onClick={() => handleStudentNameClick(student)}
                      className="student-name-cell"
                    >
                      {student.name}
                    </td>
                    <td><input type="text" /></td>
                    <td><input type="text" /></td>
                    <td><input type="text" /></td>
                    <td>-</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {showStudentDetails && (
        <div className="student-details-view">
          <button onClick={handleBackToSubjectGrades} className="back-button">
            ← Back to Subject Grades
          </button>
          <div className="student-header">
            <h3>
              {selectedSubject.subject_name} 
              {selectedSubject.type === 'elective' ? ' (Elective)' : ''} - 
              Grade {selectedGrade} - 
              {selectedSection.section_name}
            </h3>
            <div className="student-name">
              <h4>{selectedStudent.name}</h4>
              <p>Student ID: {selectedStudent.student_id}</p>
              <p>Grading Period: {selectedStudent.gradingPeriod}</p>
            </div>
          </div>
          <div className="student-grades-details">
            <div className="grade-columns">
            <div className="grade-column">
            <h4>Written Works (30%)</h4>
            <table>
              <thead>
                <tr>
                  <th>WW</th>
                  <th>Score</th>
                  <th>Total</th>
                  <th>PS</th>
                  <th>WS</th>
                </tr>
              </thead>
              <tbody>
                {writtenWorks.map((work, index) => {
                  const ps = ((work.scores / work.total_items) * 100).toFixed(2); // Calculate Percentage Score
                  const ws = (ps * 0.30).toFixed(2); // Calculate Weighted Score (30%)
                  return (
                    <tr key={index}>
                      <td>{work.remarks}</td>
                      <td>{work.scores}</td>
                      <td>{work.total_items}</td>
                      <td>{ps}</td> {/* PS column */}
                      <td>{ws}</td> {/* WS column */}
                    </tr>
                  );
                })}
              </tbody>
            </table>
            <button
              className="add-activity-btn"
              onClick={() => handleAddActivity('WW')}
            >
              + Add Written Work
            </button>
          </div>

          <div className="grade-column">
            <h4>Performance Task (50%)</h4>
            <table>
              <thead>
                <tr>
                  <th>PT</th>
                  <th>Score</th>
                  <th>Total</th>
                  <th>PS</th>
                  <th>WS</th>
                </tr>
              </thead>
              <tbody>
                {performanceTasks.map((task, index) => {
                  const ps = ((task.scores / task.total_items) * 100).toFixed(2); // Calculate Percentage Score
                  const ws = (ps * 0.50).toFixed(2); // Calculate Weighted Score (50%)
                  return (
                    <tr key={index}>
                      <td>{task.remarks}</td>
                      <td>{task.scores}</td>
                      <td>{task.total_items}</td>
                      <td>{ps}</td> {/* PS column */}
                      <td>{ws}</td> {/* WS column */}
                    </tr>
                  );
                })}
              </tbody>
            </table>
            <button
              className="add-activity-btn"
              onClick={() => handleAddActivity('PT')}
            >
              + Add Performance Task
            </button>
          </div>

          <div className="grade-column">
            <h4>Quarterly Assessment (20%)</h4>
            <table>
              <thead>
                <tr>
                  <th>QA</th>
                  <th>Score</th>
                  <th>Total</th>
                  <th>PS</th>
                  <th>WS</th>
                </tr>
              </thead>
              <tbody>
                {quarterlyAssessments.map((assessment, index) => {
                  const ps = ((assessment.scores / assessment.total_items) * 100).toFixed(2); // Calculate Percentage Score
                  const ws = (ps * 0.20).toFixed(2); // Calculate Weighted Score (20%)
                  return (
                    <tr key={index}>
                      <td>{assessment.remarks}</td>
                      <td>{assessment.scores}</td>
                      <td>{assessment.total_items}</td>
                      <td>{ps}</td> {/* PS column */}
                      <td>{ws}</td> {/* WS column */}
                    </tr>
                  );
                })}
              </tbody>
            </table>
            <button
              className="add-activity-btn"
              onClick={() => handleAddActivity('QA')}
            >
              + Add Quarterly Assessment
            </button>
          </div>
          <div className="grade-column">
          <h4>Grades</h4>
          <table>
            <thead>
              <tr>
                <th>Component</th>
                <th>WS</th>
                <th>Weight</th>
              </tr>
            </thead>
            <tbody>
              {/* Written Works */}
              <tr>
                <td>Written Works</td>
                <td>
                  {writtenWorks.length > 0
                    ? writtenWorks
                        .map(
                          (work) =>
                            ((work.scores / work.total_items) * 100 * 0.30).toFixed(2) // Weighted Score for WW
                        )
                        .reduce((sum, ws) => sum + parseFloat(ws), 0)
                        .toFixed(2)
                    : '-'}
                </td>
                <td>30%</td>
              </tr>

              {/* Performance Task */}
              <tr>
                <td>Performance Task</td>
                <td>
                  {performanceTasks.length > 0
                    ? performanceTasks
                        .map(
                          (task) =>
                            ((task.scores / task.total_items) * 100 * 0.50).toFixed(2) // Weighted Score for PT
                        )
                        .reduce((sum, ws) => sum + parseFloat(ws), 0)
                        .toFixed(2)
                    : '-'}
                </td>
                <td>50%</td>
              </tr>

              {/* Quarterly Assessment */}
              <tr>
                <td>Quarterly Assessment</td>
                <td>
                  {quarterlyAssessments.length > 0
                    ? quarterlyAssessments
                        .map(
                          (assessment) =>
                            ((assessment.scores / assessment.total_items) *
                              100 *
                              0.20).toFixed(2) // Weighted Score for QA
                        )
                        .reduce((sum, ws) => sum + parseFloat(ws), 0)
                        .toFixed(2)
                    : '-'}
                </td>
                <td>20%</td>
              </tr>

              {/* Final Weighted Grade */}
              <tr>
                <td>Grade</td>
                <td>
                  {[
                    writtenWorks
                      .map(
                        (work) =>
                          ((work.scores / work.total_items) * 100 * 0.30).toFixed(2)
                      )
                      .reduce((sum, ws) => sum + parseFloat(ws), 0) || 0,
                    performanceTasks
                      .map(
                        (task) =>
                          ((task.scores / task.total_items) * 100 * 0.50).toFixed(2)
                      )
                      .reduce((sum, ws) => sum + parseFloat(ws), 0) || 0,
                    quarterlyAssessments
                      .map(
                        (assessment) =>
                          ((assessment.scores / assessment.total_items) *
                            100 *
                            0.20).toFixed(2)
                      )
                      .reduce((sum, ws) => sum + parseFloat(ws), 0) || 0,
                  ]
                    .reduce((total, value) => total + value, 0)
                    .toFixed(2)}
                </td>
              </tr>
            </tbody>
          </table>
          
        </div>
        
                  
            </div>
          </div>

          {/* Add Activity Modal */}
          {showAddActivityModal && (
          <div className="modal-overlay" onClick={handleCloseModal}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h3>
                  Add{' '}
                  {activityType === 'WW'
                    ? 'Written Work'
                    : activityType === 'PT'
                    ? 'Performance Task'
                    : 'Quarterly Assessment'}
                </h3>
                <button className="close-btn" onClick={handleCloseModal}>
                  &times;
                </button>
              </div>
              <form
                onSubmit={async (e) => {
                  e.preventDefault();

                  // Determine component_id based on activityType
                  const componentId =
                    activityType === 'WW' ? 1 : activityType === 'PT' ? 2 : 3;

                  const formData = {
                    component_id: componentId, // Dynamic component ID
                    scores: e.target.scores.value, // Access the "Score" input value
                    total_items: e.target.total_items.value, // Access the "Total Items" input value
                    remarks: e.target.remarks.value, // Access the "Name" input value as remarks
                    student_id: selectedStudent?.student_id, // Dynamic student ID
                    subject_name: selectedSubject?.subject_name, // Dynamic subject name
                    grading: selectedGradingPeriod, // Access the selected grading period
                  };

                  try {
                    const response = await axios.post(
                      'http://localhost:3001/insert-component',
                      formData,
                      {
                        headers: { 'Content-Type': 'application/json' },
                      }
                    );

                    if (response.data.success) {
                      alert('Activity added successfully!');
                      handleCloseModal(); // Close modal after success
                    } else {
                      alert(`Error: ${response.data.message}`);
                    }
                  } catch (error) {
                    console.error('Error during submission:', error);
                    alert('Failed to add activity. Please try again.');
                  }
                }}
              >
                <div className="form-group">
                  <label>Name:</label>
                  <input type="text" name="remarks" required />
                </div>
                <div className="form-group">
                  <label>Score:</label>
                  <input type="number" name="scores" min="0" required />
                </div>
                <div className="form-group">
                  <label>Total Items:</label>
                  <input type="number" name="total_items" min="1" required />
                </div>
                <div className="modal-buttons">
                  <button type="button" onClick={handleCloseModal}>
                    Cancel
                  </button>
                  <button type="submit">Save</button>
                </div>
              </form>
            </div>
          </div>
        )}

        </div>
      )}
    </div>
  );
};

export default Registrar_GradesPage;
