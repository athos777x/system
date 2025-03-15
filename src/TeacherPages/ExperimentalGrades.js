import React, { useState, useEffect } from 'react';
import axios from 'axios';
import '../TeacherPagesCss/ExperimentalGrades.css';
import GradeDetail from '../Utilities/grades-detail'
import { useNavigate } from "react-router-dom";

function ExperimentalGrades() {
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
  const [selectedGradingPeriod, setSelectedGradingPeriod] = useState(null);
  const [selectedItem, setSelectedItem] = useState(null);  // Store selected item for editing
  const [studentGrades, setStudentGrades] = useState({});
  const [existingGrades, setExistingGrades] = useState({});
  const [isEditing, setIsEditing] = useState(false);
  const navigate = useNavigate();
  const [roleName, setRoleName] = useState('');
  const [showDetailedView, setShowDetailedView] = useState(false); // New state to show the detailed view
  const [percentages, setPercentages] = useState({
    WW: 30,
    PT: 50,
    QA: 20,
  });

  // State to store grades detail
  const [gradesDetailData, setGradesDetailData] = useState({});

   // Handle opening the modal with data from the clicked item
  const handleEditActivity = (item, index, type) => {
    console.log('Editing item:', item); // Log the original item

    // Normalize type to the abbreviation (if it's the full name)
    const normalizedType = type === 'Written Works' ? 'WW' :
                           type === 'Performance Task' ? 'PT' :
                           type === 'Quarterly Assessment' ? 'QA' : type;

    // Dynamically set the component_id based on the type, fallback to item.component_id if present
    const componentId = normalizedType === 'WW' ? 1 :
                        normalizedType === 'PT' ? 2 :
                        normalizedType === 'QA' ? 3 : item.component_id;

    // Create updated item by ensuring the id and component_id are included
    const updatedItem = {
      ...item,
      component_id: componentId,  // Use the correct component_id based on type or item
      id: item.id, // Ensure the id is included
    };

    console.log('Updated item:', updatedItem); // Log the updated item with the correct component_id and id

    // Store the updated item in state
    setSelectedItem({ ...updatedItem, index, type });

    // Set the activity type based on the current type ('WW', 'PT', or 'QA')
    setActivityType(normalizedType);  // Store the normalized type

    // Open the modal to edit the activity
    setShowAddActivityModal(true); // Open the modal
};

  
  // Function to handle deleting the activity
  const handleDeleteActivity = (item, index, type) => {
    // Show confirmation dialog
    const isConfirmed = window.confirm('Are you sure you want to delete this activity?');
  
    if (!isConfirmed) {
      console.log('Deletion canceled');
      return; // Exit if the user cancels the deletion
    }
  
    console.log('Deleting item:', item); // Log the original item
  
    // Normalize type to the abbreviation (if it's the full name)
    const normalizedType = type === 'Written Works' ? 'WW' :
                           type === 'Performance Task' ? 'PT' :
                           type === 'Quarterly Assessment' ? 'QA' : type;
  
    // Dynamically set the component_id based on the type, fallback to item.component_id if present
    const componentId = normalizedType === 'WW' ? 1 :
                        normalizedType === 'PT' ? 2 :
                        normalizedType === 'QA' ? 3 : item.component_id;
  
    // Create the payload for deletion
    const itemToDelete = {
      id: item.id,                // Ensure the id is included
      component_id: componentId,  // Use the correct component_id based on type or item
    };
  
    console.log('Item to delete:', itemToDelete); // Log the item for deletion
  
    // Call the delete endpoint using axios
    axios.delete('http://localhost:3001/delete-component', {
      headers: {
        'Content-Type': 'application/json',
      },
      data: itemToDelete, // Send id and component_id in the request body
    })
      .then(response => {
        if (response.data.success) {
          console.log(`Activity deleted successfully:`, itemToDelete);
  
          // Optional: Update state/UI after successful deletion
          setSelectedItem(null); // Clear selected item
  
          // Fetch the updated components list after deletion
          fetchComponentData(type); // Call the function that fetches components (pass the current type)
        } else {
          console.error('Failed to delete activity:', response.data.message);
        }
      })
      .catch(error => {
        console.error('Error deleting activity:', error);
      });
  };
  
  const fetchUserRole = async (userId) => {
    try {
      console.log(`Fetching role for user ID: ${userId}`); // Debugging log
      const response = await axios.get(`http://localhost:3001/user-role/${userId}`);
      if (response.status === 200) {
        console.log('Response received:', response.data); // Debugging log
        setRoleName(response.data.role_name);
        console.log('Role name set to:', response.data.role_name); // Debugging log
      } else {
        console.error('Failed to fetch role name. Response status:', response.status);
      }
    } catch (error) {
      if (error.response) {
        console.error('Error response from server:', error.response.data);
      } else if (error.request) {
        console.error('No response received from server. Request:', error.request);
      } else {
        console.error('Error setting up request:', error.message);
      }
    }
  };

  useEffect(() => {
    const userId = localStorage.getItem('userId'); // Retrieve userId from localStorage
    if (userId) {
      console.log(`Retrieved userId from localStorage: ${userId}`); // Debugging log
      fetchUserRole(userId);
    } else {
      console.error('No userId found in localStorage');
    }
  }, []);
  
  
  // Handle updating the item in the data state
  const handleUpdateActivity = async (e) => {
    e.preventDefault();
  
    console.log('Selected Grading Period:', selectedGradingPeriod); // Log the value before using it
  
    const newActivity = {
      id: selectedItem?.id || selectedItem?.item_id,
      component_id: selectedItem?.component_id || (activityType === 'WW' ? 1 : activityType === 'PT' ? 2 : 3),
      scores: parseFloat(e.target.scores.value),
      total_items: parseInt(e.target.total_items.value, 10),
      remarks: e.target.remarks.value,
      student_id: selectedStudent?.student_id,
      subject_name: selectedSubject?.subject_name,
      period: selectedGradingPeriod,
    };
  
    console.log('Saving new activity:', newActivity);
  
    try {
      const response = await axios.post('http://localhost:3001/insert-component', newActivity, {
        headers: { 'Content-Type': 'application/json' },
      });
  
      if (response.data.success) {
        const updatedActivity = response.data.updatedComponent || newActivity;
  
        // Update the relevant state based on the activity type
        if (activityType === 'WW') {
          setWrittenWorks((prev) =>
            prev.map((item) => (item.id === updatedActivity.id ? updatedActivity : item))
          );
        } else if (activityType === 'PT') {
          setPerformanceTasks((prev) =>
            prev.map((item) => (item.id === updatedActivity.id ? updatedActivity : item))
          );
        } else if (activityType === 'QA') {
          setQuarterlyAssessments((prev) =>
            prev.map((item) => (item.id === updatedActivity.id ? updatedActivity : item))
          );
        }
  
        // Re-fetch the updated data from the server to ensure sync with backend
        fetchComponentData(activityType);
  
        alert('Component updated successfully!');
      } else {
        alert(`Error: ${response.data.message}`);
      }
    } catch (error) {
      console.error('Error saving activity:', error);
      alert('Failed to save activity. Please try again.');
    }
  
    setShowAddActivityModal(false); // Close the modal
  };
  
  
  
  
  

  const calculateWeightedScore = (data, weight) => {
    if (!data.length) {
      console.log('No data found for this component');
      return 0;
    }

    console.log('Raw data:', data);
    
    const totalPS = data.reduce((sum, item) => {
      // Calculate percentage score (PS) for each item
      const ps = Math.min(((item.scores / item.total_items) * 100), 100);
      console.log(`Item scores: ${item.scores}, total_items: ${item.total_items}, PS: ${ps}`);
      return sum + ps;
    }, 0);

    console.log('Total PS:', totalPS);
    
    // Calculate average PS
    const averagePS = totalPS / data.length;
    console.log('Average PS:', averagePS);
    
    // Calculate weighted score
    const weightedScore = (averagePS * (weight / 100));
    console.log(`Weight: ${weight}, Weighted Score: ${weightedScore}`);
    
    // Ensure weighted score doesn't exceed the component's weight
    const finalScore = Math.min(weightedScore, weight);
    console.log('Final Score:', finalScore);
    
    return finalScore;
  };
  
  const calculateFinalGrade = () => {
    // Calculate individual component scores
    const wwScore = calculateWeightedScore(writtenWorks, percentages.WW);
    const ptScore = calculateWeightedScore(performanceTasks, percentages.PT);
    const qaScore = calculateWeightedScore(quarterlyAssessments, percentages.QA);

    // Sum up all components
    const finalGrade = wwScore + ptScore + qaScore;

    // Ensure final grade doesn't exceed 100
    const cappedFinalGrade = Math.min(finalGrade, 100);

    // Return final grade formatted to 2 decimal places
    return isNaN(cappedFinalGrade) ? 0 : cappedFinalGrade.toFixed(2);
  };
  
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
      let url;
  
      if (selectedSubject?.id) {
        url = `http://localhost:3001/section-students/${selectedSection?.section_id || 0}/${selectedGrade}/${selectedSubject.id}/${selectedSubject.type === 'elective' ? 'elective' : 'subject'}`;
      } else if (selectedSection?.section_id) {
        url = `http://localhost:3001/section-students/${selectedSection.section_id}/${selectedGrade}`;
      } else {
        console.error("No section or student specified for fetching students.");
        return;
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
  fetchGradesDetail(student.student_id);
  setShowStudentDetails(true);
};


  // Add handler to go back to subject grades table
  const handleBackToSubjectGrades = () => {
    setShowStudentDetails(false);
    setSelectedStudent(null);
  };

  // Add handler for add button click
  const handleAddActivity = (type) => {
    if (selectedGradingPeriod === null) {
        alert('Please select a grading period before adding an activity.');
        return;
    }
    setActivityType(type); // 'WW', 'PT', or 'QA'
    setSelectedItem(null); // Clear the selected item for adding new data
    setShowAddActivityModal(true); // Open the modal
};


  // Add handler for modal close
  const handleCloseModal = () => {
    setShowAddActivityModal(false);
    setActivityType('');
  };

  const handleSubmitGrades = async () => {
    if (!selectedStudent || !selectedSubject || !selectedGradingPeriod) {
      alert('Incomplete data. Please ensure all fields are selected.');
      return;
    }
  
    const periodValue = selectedGradingPeriod;
  
    if (![1, 2, 3, 4].includes(periodValue)) {
      alert('Invalid grading period selected');
      return;
    }
  
    const finalGrade = calculateFinalGrade();
    const wwScore = calculateWeightedScore(writtenWorks, percentages.WW);
    const ptScore = calculateWeightedScore(performanceTasks, percentages.PT);
    const qaScore = calculateWeightedScore(quarterlyAssessments, percentages.QA);
  
    const gradeData = {
      grade_level: selectedGrade,
      subject_name: selectedSubject.subject_name,
      grade: finalGrade,
      period: periodValue,
      student_id: selectedStudent.student_id,
      student_name: selectedStudent.name,
      school_year_id: 1,
      written_works: wwScore,
      performance_task: ptScore,
      quarterly_assessment: qaScore,
    };
  
    console.log('Submitting grade data:', gradeData);
  
    try {
      const response = await axios.post('http://localhost:3001/submit-grade', gradeData, {
        headers: { 'Content-Type': 'application/json' },
      });
  
      if (response.data.success) {
        alert(isEditing ? 'Grades updated successfully!' : 'Grades submitted successfully!');
        setIsEditing(false);
        checkExistingGrade(
          selectedStudent.student_id,
          selectedSubject.subject_name,
          periodValue
        );
      } else {
        alert(`Error: ${response.data.message}`);
      }
    } catch (error) {
      console.error('Error submitting grades:', error);
      alert('Failed to submit grades. Please try again.');
    }
  };
  

  
  const handleEditMode = () => {
    setIsEditing(true);
  };
  
  const handleCancelEdit = () => {
    setIsEditing(false);
  };

  const fetchComponentData = async (componentType) => {
    const componentId = componentType === 'WW' ? 1 : componentType === 'PT' ? 2 : 3;
  
    try {
      const response = await axios.get('http://localhost:3001/get-components', {
        params: {
          student_id: selectedStudent?.student_id,
          subject_name: selectedSubject?.subject_name,
          component_id: componentId,
          period: selectedGradingPeriod, 
        },
      });

      console.log(`Fetched ${componentType} data for ${selectedGradingPeriod}:`, response.data);

      // Update the state based on the component type
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
  }, [selectedStudent, selectedSubject, selectedGradingPeriod]);
  
  

  // Update useEffect to fetch students when subject is selected
  useEffect(() => {
    if (selectedSubject && selectedSection) {
      fetchSectionStudents();
    }
  }, [selectedSubject, selectedSection]);

  // Add this new function to fetch grades detail
  const fetchGradesDetail = async (studentId) => {
    try {
      const response = await axios.get('http://localhost:3001/grades-detail', {
        params: { student_id: studentId },
      });
  
      console.log('Fetched grades detail:', response.data);
  
      if (Array.isArray(response.data)) {
        setGradesDetailData((prev) => ({
          ...prev,
          [studentId]: response.data,
        }));
      } else {
        console.warn('Grades detail response is not an array.');
        setGradesDetailData((prev) => ({
          ...prev,
          [studentId]: [],
        }));
      }
    } catch (error) {
      console.error('Error fetching grades detail:', error);
      setGradesDetailData((prev) => ({
        ...prev,
        [studentId]: [],
      }));
    }
  };
  

  // Fetch grades detail when the component mounts
  useEffect(() => {
    fetchGradesDetail();
  }, []); // Empty dependency array ensures it runs only once

  // Update useEffect to fetch grades detail when students are fetched
  useEffect(() => {
    const fetchGrades = async () => {
      if (!subjects.length || !students.length) return;

      const grades = {};
      
      // Fetch grades for each student and each subject
      for (const student of students) {
        for (const subject of subjects) {
          try {
            const response = await axios.get('http://localhost:3001/student-grades', {
              params: {
                grade_level: selectedGrade,
                subject_name: subject.subject_name,
                student_id: student.student_id
              }
            });
            
            const key = `${student.student_id}-${subject.subject_name}`;
            grades[key] = response.data;
          } catch (error) {
            console.error('Error fetching grades:', error);
            const key = `${student.student_id}-${subject.subject_name}`;
            grades[key] = [];
          }
        }
      }
      


      setStudentGrades(grades);
    };

    fetchGrades();
  }, [subjects, students, selectedGrade, gradesDetailData]); // Add gradesDetailData to dependencies

  // Add validation when changing percentages
  const handlePercentageChange = (component, newValue) => {
    const updatedPercentages = {
      ...percentages,
      [component]: newValue
    };
    
    // Calculate total of all percentages
    const total = Object.values(updatedPercentages).reduce((sum, value) => sum + value, 0);
    
    if (total <= 100) {
      setPercentages(updatedPercentages);
    } else {
      alert('Total percentage cannot exceed 100%');
    }
  };

  const transmutedGrade = (initialGrade) => {
    const transmutationTable = {
      100: 100,
      98.40: 99,
      96.80: 98,
      95.20: 97,
      93.60: 96,
      92.00: 95,
      90.40: 94,
      88.80: 93,
      87.20: 92,
      85.60: 91,
      84.00: 90,
      82.40: 89,
      80.80: 88,
      79.20: 87,
      77.60: 86,
      76.00: 85,
      74.40: 84,
      72.80: 83,
      71.20: 82,
      69.60: 81,
      68.00: 80,
      66.40: 79,
      64.80: 78,
      63.20: 77,
      61.60: 76,
      60.00: 75,  // Passing grade
      0: 74       // Failed
    };

    // Find the appropriate transmuted grade
    const score = parseFloat(initialGrade);
    let transmuted = 74; // Default to failing grade

    for (const [key, value] of Object.entries(transmutationTable)) {
      if (score >= parseFloat(key)) {
        transmuted = value;
        break;
      }
    }

    return transmuted;
  };

  // Add this new function to check existing grades
  const checkExistingGrade = async (studentId, subjectName, period) => {
    try {
      const response = await axios.get('http://localhost:3001/check-grade', {
        params: {
          student_id: studentId,
          subject_name: subjectName,
          period: period
        }
      });
      
      // Update the existingGrades state with the result
      setExistingGrades(prev => ({
        ...prev,
        [`${studentId}-${subjectName}-${period}`]: response.data.exists
      }));
    } catch (error) {
      console.error('Error checking existing grade:', error);
    }
  };

  // Add useEffect to check existing grade when student details are shown
  useEffect(() => {
    if (selectedStudent && selectedSubject && selectedGradingPeriod) {
      const periodValue = {
        '1st Grading': 1,
        '2nd Grading': 2,
        '3rd Grading': 3,
        '4th Grading': 4,
      }[selectedGradingPeriod];
      
      checkExistingGrade(
        selectedStudent.student_id,
        selectedSubject.subject_name,
        periodValue
      );
    }
  }, [selectedStudent, selectedSubject, selectedGradingPeriod]);

  // Fetch all grades details for students
  const fetchAllGradesDetails = async () => {
    try {
      const details = await Promise.all(
        students.map(student => 
          axios.get('http://localhost:3001/grades-detail', {
            params: { student_id: student.student_id }
          }).then(response => ({
            studentId: student.student_id,
            grades: response.data
          }))
        )
      );

      // Map the results to a more usable format
      const gradesMap = {};
      details.forEach(detail => {
        gradesMap[detail.studentId] = detail.grades; // Store grades detail by student ID
      });
      setGradesDetailData(gradesMap); // Store the grades detail in state
    } catch (error) {
      console.error('Error fetching grades details:', error);
      setGradesDetailData({}); // Reset to empty object on error
    }
  };

  useEffect(() => {
    fetchAllGradesDetails(); // Fetch grades details when students change
  }, [students]);

  return (
    <div className="experimental-grades-container">
      <h2 className='experimental-grades-title'>Grades</h2>
      
      {!showSubjectGrades && !showGradesTable && (
        <div className="experimental-grades-detailed-view">
          <button onClick={handleBackClick} className="experimental-grades-back-btn">
            Back
          </button>
          <div className="experimental-grades-section-header">
            <h3>{selectedSection.section_name}</h3>
            <p>
              Class Advisor: {selectedSection.adviser_name ? 
                selectedSection.adviser_name.toUpperCase() : 
                <span className="not-assigned">NOT ASSIGNED</span>
              }
            </p>
          </div>
          <div className="experimental-grades-period-selector">
            <label htmlFor="grading-period">Grading Period:</label>
            <select
              id="grading-period"
              value={selectedGradingPeriod}
              onChange={(e) => setSelectedGradingPeriod(parseInt(e.target.value, 10))}
            >
              <option value="">Select Grading Period</option>
              <option value="1">1st Grading</option>
              <option value="2">2nd Grading</option>
              <option value="3">3rd Grading</option>
              <option value="4">4th Grading</option>
            </select>
          </div>
          <div className="experimental-grades-table-container">
            {students.length > 0 ? (
              <table className="experimental-grades-data-table">
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
                    <tr key={index} className="clickable" onClick={() => handleStudentNameClick(student)}>
                      <td>{student.student_id}</td>
                      <td 
                        className="experimental-grades-student-name"
                      >
                        {student.name}
                      </td>
                      {subjects.map((subject, subIndex) => {
                        const key = `${student.student_id}-${subject.subject_name}`;
                        const gradeData = studentGrades[key] || [];
                        const periodGrade = gradeData.find(g => 
                          g.period === parseInt(selectedGradingPeriod)
                        )?.grade || '-';
                        return (
                          <td key={subIndex}>
                            {periodGrade}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="experimental-grades-empty-state">
                <p>No students found in this section.</p>
                <p>Students will appear here once they are enrolled in this section.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {!showSubjectGrades && showGradesTable && (
        <div className="experimental-grades-table">
          <div className="experimental-grades-column">
            <h3>Grade Levels</h3>
            <div className="experimental-grades-buttons">
              {gradeLevels.map((grade) => (
                <button
                  key={grade}
                  onClick={() => handleGradeClick(grade)}
                  className={`experimental-grades-btn ${selectedGrade === grade ? 'active' : ''}`}
                  data-tooltip="Click to select grade level"
                >
                  Grade {grade}
                </button>
              ))}
            </div>
          </div>

          <div className="experimental-grades-column">
            <h3>Sections</h3>
            {selectedGrade ? (
              <div className="experimental-grades-section-list">
                {sections.length > 0 ? (
                  sections.map((section, index) => (
                    <button
                      key={index}
                      onClick={() => handleSectionClick(section)}
                      className={`experimental-grades-btn ${selectedSection?.section_name === section.section_name ? 'active' : ''}`}
                      data-tooltip="Click to view section"
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

          <div className="experimental-grades-column">
            <h3>Subjects</h3>
            {selectedSection && (
              <div 
                className="experimental-grades-section-info"
                onClick={handleSectionInfoClick}
                data-tooltip="Click to view section details"
              >
                <span><strong>{selectedSection.section_name}</strong></span>
                <span>{selectedSection.adviser_name?.toUpperCase() || 'NOT ASSIGNED'}</span>
              </div>
            )}
            <div className="experimental-grades-subject-list">
              {selectedSection ? (
                subjects.length > 0 ? (
                  subjects.map((subject, index) => (
                    <button
                      key={index}
                      className={`experimental-grades-btn ${subject.type === 'elective' ? 'elective' : ''}`}
                      onClick={() => handleSubjectClick({
                        subject_name: subject.subject_name,
                        type: subject.type,
                        id: subject.id
                      })}
                      data-tooltip="Click to view subject grades"
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
        <div className="experimental-grades-subject-view">
          <button onClick={handleBackToGrades} className="experimental-grades-back-btn">
            Back
          </button>
          
          <div className="experimental-grades-breadcrumb">
            <span className="breadcrumb-item">Grade {selectedGrade}</span>
            <span className="breadcrumb-separator">›</span>
            <span className="breadcrumb-item">{selectedSection.section_name}</span>
            <span className="breadcrumb-separator">›</span>
            <span className="breadcrumb-item active">{selectedSubject.subject_name}</span>
          </div>
          
          <div className="experimental-grades-subject-header">
            <h3>
              {selectedSubject.subject_name}
              {selectedSubject.type === 'elective' ? ' (Elective)' : ''} - 
              Grade {selectedGrade} - 
              {selectedSection.section_name}
            </h3>
            
            <div className="experimental-grades-period-selector">
              <label htmlFor="grading-period">Grading Period:</label>
              <select
                id="grading-period"
                value={selectedGradingPeriod}
                onChange={(e) => setSelectedGradingPeriod(parseInt(e.target.value, 10))}
              >
                <option value="">Select Grading Period</option>
                <option value="1">1st Grading</option>
                <option value="2">2nd Grading</option>
                <option value="3">3rd Grading</option>
                <option value="4">4th Grading</option>
              </select>
            </div>
          </div>

          <div className="experimental-grades-table-container">
            <table className="experimental-grades-data-table">
              <thead>
                <tr>
                  <th>Student ID</th>
                  <th>Name</th>
                  <th>Written Works ({percentages.WW}%)</th>
                  <th>Performance Task ({percentages.PT}%)</th>
                  <th>Quarterly Assessment ({percentages.QA}%)</th>
                  <th>Grade</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {students.map((student, index) => {
                  const gradesDetail = gradesDetailData[student.student_id] || [];
                  const gradesDetailForPeriod = gradesDetail.filter(
                    (detail) => detail.period === selectedGradingPeriod
                  );

                  return (
                    <tr key={index} className="clickable" onClick={() => handleStudentNameClick(student)}>
                      <td>{student.student_id}</td>
                      <td 
                        className="experimental-grades-student-name"
                        data-tooltip="Click to view student details"
                      >
                        {student.name}
                      </td>
                      {gradesDetailForPeriod.length > 0 ? (
                        <>
                          <td>{gradesDetailForPeriod[0].written_works || 0}</td>
                          <td>{gradesDetailForPeriod[0].performance_task || 0}</td>
                          <td>{gradesDetailForPeriod[0].quarterly_assessment || 0}</td>
                          <td>
                            {
                              Math.round(
                                (gradesDetailForPeriod[0].written_works || 0) +
                                (gradesDetailForPeriod[0].performance_task || 0) +
                                (gradesDetailForPeriod[0].quarterly_assessment || 0)
                              )
                            }
                          </td>
                          <td
                            className={
                              Math.round(
                                (gradesDetailForPeriod[0].written_works || 0) +
                                (gradesDetailForPeriod[0].performance_task || 0) +
                                (gradesDetailForPeriod[0].quarterly_assessment || 0)
                              ) >= 75
                                ? 'experimental-grades-status-passed'
                                : 'experimental-grades-status-failed'
                            }
                          >
                            {
                              Math.round(
                                (gradesDetailForPeriod[0].written_works || 0) +
                                (gradesDetailForPeriod[0].performance_task || 0) +
                                (gradesDetailForPeriod[0].quarterly_assessment || 0)
                              ) >= 75
                                ? 'Passed'
                                : 'Failed'
                            }
                          </td>
                        </>
                      ) : (
                        <>
                          <td>0</td>
                          <td>0</td>
                          <td>0</td>
                          <td>0</td>
                          <td></td>
                        </>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {showStudentDetails && (
        <div className="experimental-grades-details-view">
          <button onClick={handleBackToSubjectGrades} className="experimental-grades-back-btn">
            Back
          </button>
          <div className="experimental-grades-student-header">
            <div className="experimental-grades-student-name-card">
              <h4>{selectedStudent.name}</h4>
            </div>
            <h3>
              {selectedSubject.subject_name} 
              {selectedSubject.type === 'elective' ? ' (Elective)' : ''} - 
              Grade {selectedGrade} - 
              {selectedSection.section_name}
            </h3>
            <div className="experimental-grades-student-info">
              <div className="experimental-grades-student-info-card">
                <div className="info-label">ID</div>
                <div className="info-value">{selectedStudent.student_id}</div>
              </div>
              
              <div className="experimental-grades-student-info-card">
                <div className="info-label">Period</div>
                <div className="info-value">{selectedStudent.gradingPeriod}</div>
              </div>
              
              <div className="experimental-grades-student-info-card">
                <div className="info-label">Section</div>
                <div className="info-value">{selectedSection.section_name}</div>
              </div>
              
              <div className="experimental-grades-student-info-card">
                <div className="info-label">Grade</div>
                <div className="info-value">{selectedGrade}</div>
              </div>
            </div>
          </div>

          <div className="experimental-grades-details">
            {/* Grade components will be rendered here */}
          </div>

          <div className="experimental-grades-summary">
          <div className="grade-columns">
              {/* Written Works */}
              <GradeDetail
                title="Written Works"
                percentage={percentages.WW}
                data={writtenWorks}
                onAddActivity={() => handleAddActivity('WW')}
                onEditActivity={handleEditActivity}
                onDeleteActivity={handleDeleteActivity}
                onPercentageChange={(newPercentage) => handlePercentageChange('WW', newPercentage)}
                otherPercentages={percentages}
                isLocked={!isEditing && existingGrades[`${selectedStudent?.student_id}-${selectedSubject?.subject_name}-${
                  {
                    '1st Grading': 1,
                    '2nd Grading': 2,
                    '3rd Grading': 3,
                    '4th Grading': 4
                  }[selectedGradingPeriod]
                }`]}
              />

              {/* Performance Task */}
              <GradeDetail
                title="Performance Task"
                percentage={percentages.PT}
                data={performanceTasks}
                onAddActivity={() => handleAddActivity('PT')}
                onEditActivity={handleEditActivity}
                onDeleteActivity={handleDeleteActivity}
                onPercentageChange={(newPercentage) => handlePercentageChange('PT', newPercentage)}
                otherPercentages={percentages}
                isLocked={!isEditing && existingGrades[`${selectedStudent?.student_id}-${selectedSubject?.subject_name}-${
                  {
                    '1st Grading': 1,
                    '2nd Grading': 2,
                    '3rd Grading': 3,
                    '4th Grading': 4
                  }[selectedGradingPeriod]
                }`]}
              />

              {/* Quarterly Assessment */}
              <GradeDetail
                title="Quarterly Assessment"
                percentage={percentages.QA}
                data={quarterlyAssessments}
                onAddActivity={() => handleAddActivity('QA')}
                onEditActivity={handleEditActivity}
                onDeleteActivity={handleDeleteActivity}
                onPercentageChange={(newPercentage) => handlePercentageChange('QA', newPercentage)}
                otherPercentages={percentages}
                isLocked={!isEditing && existingGrades[`${selectedStudent?.student_id}-${selectedSubject?.subject_name}-${
                  {
                    '1st Grading': 1,
                    '2nd Grading': 2,
                    '3rd Grading': 3,
                    '4th Grading': 4
                  }[selectedGradingPeriod]
                }`]}
              />
            </div>
            <div className="experimental-grades-detail-card">
              <h4>Grade Summary</h4>
              <table className="experimental-grades-data-table">
                <thead>
                  <tr>
                    <th>Component</th>
                    <th>Score</th>
                    <th>Weight</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>Written Works</td>
                    <td>{calculateWeightedScore(writtenWorks, percentages.WW)}</td>
                    <td>{percentages.WW}%</td>
                  </tr>
                  <tr>
                    <td>Performance Task</td>
                    <td>{calculateWeightedScore(performanceTasks, percentages.PT)}</td>
                    <td>{percentages.PT}%</td>
                  </tr>
                  <tr>
                    <td>Quarterly Assessment</td>
                    <td>{calculateWeightedScore(quarterlyAssessments, percentages.QA)}</td>
                    <td>{percentages.QA}%</td>
                  </tr>
                  <tr>
                    <td colSpan="2">Final Grade</td>
                    <td>{calculateFinalGrade()}</td>
                  </tr>
                </tbody>
              </table>

              {existingGrades[`${selectedStudent?.student_id}-${selectedSubject?.subject_name}-${
                {
                  '1st Grading': 1,
                  '2nd Grading': 2,
                  '3rd Grading': 3,
                  '4th Grading': 4
                }[selectedGradingPeriod]
              }`] ? (
                isEditing ? (
                  <div className="experimental-grades-button-group">
                    <button className="experimental-grades-submit-btn" onClick={handleSubmitGrades}>
                      Update Grades
                    </button>
                    <button className="experimental-grades-edit-btn" onClick={handleCancelEdit}>
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button className="experimental-grades-edit-btn" onClick={handleEditMode}>
                    Edit Grades
                  </button>
                )
              ) : (
                roleName !== 'principal' && roleName !== 'grade_level_coordinator' && (
                  <button className="experimental-grades-submit-btn" onClick={handleSubmitGrades}>
                    Submit Grades
                  </button>
                )
              )}
            </div>
          </div>
        </div>
      )}

      {showAddActivityModal && (
        <div className="experimental-grades-modal-overlay" onClick={handleCloseModal}>
          <div className="experimental-grades-modal" onClick={(e) => e.stopPropagation()}>
            <div className="experimental-grades-modal-header">
              <h3>
                {selectedItem
                  ? `Edit ${selectedItem.type === 'WW' ? 'Written Work' : selectedItem.type === 'PT' ? 'Performance Task' : 'Quarterly Assessment'}`
                  : `Add ${activityType === 'WW' ? 'Written Work' : activityType === 'PT' ? 'Performance Task' : 'Quarterly Assessment'}`}
              </h3>
              <button className="experimental-grades-modal-close" onClick={handleCloseModal}>
                &times;
              </button>
            </div>
            <form onSubmit={handleUpdateActivity}>
              <div className="experimental-grades-form-group">
                <label>Activity Name</label>
                <input
                  type="text"
                  name="remarks"
                  defaultValue={selectedItem?.remarks || ''}
                  placeholder="Enter activity name"
                  required
                />
              </div>
              <div className="experimental-grades-form-group">
                <label>Score</label>
                <input
                  type="number"
                  name="scores"
                  defaultValue={selectedItem?.scores || ''}
                  placeholder="Enter score"
                  min="0"
                  required
                />
              </div>
              <div className="experimental-grades-form-group">
                <label>Total Items</label>
                <input
                  type="number"
                  name="total_items"
                  defaultValue={selectedItem?.total_items || ''}
                  placeholder="Enter total items"
                  min="1"
                  required
                />
              </div>
              <div className="experimental-grades-button-group">
                <button type="button" className="experimental-grades-btn" onClick={handleCloseModal}>
                  Cancel
                </button>
                <button type="submit" className="experimental-grades-submit-btn">
                  {selectedItem ? 'Update' : 'Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default ExperimentalGrades;
