import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import '../TeacherPagesCss/PromotionReport.css';

function PromotionReport() {
  const navigate = useNavigate();
  const [modalContent, setModalContent] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [grade, setGrade] = useState("");
  const [section, setSection] = useState("");
  const [sections, setSections] = useState([]); // State to store sections
  const [studentName, setStudentName] = useState("");
  const [lrn, setLRN] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [schoolYears, setSchoolYears] = useState([]); // Store fetched school years
  const [selectedSchoolYear, setSelectedSchoolYear] = useState(""); // Selected school year
  const [roleName, setRoleName] = useState('');
  const [quarter, setQuarter] = useState("");

  useEffect(() => {
    // Fetch school years from the backend
    const fetchSchoolYears = async () => {
      try {
        const response = await fetch("http://localhost:3001/api/school_years");
        if (!response.ok) {
          throw new Error("Failed to fetch school years");
        }
        const data = await response.json();
        setSchoolYears(data.map(sy => sy.school_year)); // Store school years
      } catch (error) {
        console.error("Error fetching school years:", error);
      }
    };
    
    fetchSchoolYears();
  }, []);

  useEffect(() => {
    const userId = localStorage.getItem('userId'); // Retrieve userId from localStorage
    if (userId) {
      console.log(`Retrieved userId from localStorage: ${userId}`); // Debugging log
      fetchUserRole(userId);
    } else {
      console.error('No userId found in localStorage');
    }
  }, []);

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

  const openModal = (type) => {
    setModalContent(type);
    setShowModal(true);
    setGrade("");
    setSection("");
    setSelectedSchoolYear("");
    setStudentName("");
  };

  const closeModal = () => {
    setModalContent(null);
    setShowModal(false);
    setSuggestions([]);
    setSections([]);
    setSelectedSchoolYear(""); // Clear selected school year on close
  };

  const handleGenerateForm137 = () => {
    if (!selectedSchoolYear || !studentName) {
      alert('Please fill in all the required fields before generating.');
      return;
    }

    const studentData = { grade, section, name: studentName };
    navigate('/form-137', { state: { student: studentData } });
  };
  
  const handleGenerateForm138 = () => {
    if (!grade || !section || !studentName) {
      alert('Please fill in all the required fields before generating.');
      return;
    }

    const studentData = { grade, section, name: studentName };
    navigate('/form-138', { state: { student: studentData } });
  };

  const handleGenerateGoodMoral = () => {
    if (!selectedSchoolYear || !studentName) {
      alert('Please fill in all the required fields before generating.');
      return;
    }

    const studentData = { grade, section, name: studentName };
    navigate('/good-moral', { state: { student: studentData } });
  };

  const handleLateEnrolleesReport = () => {
    if (!grade || !section ) {
      alert('Please fill in all the required fields before generating.');
      return;
    }

    const reportData = { grade, section };
    navigate('/late-enrollee', { state: { report: reportData } });
  };

  const fetchStudentNames = async () => {
    try {
      const response = await fetch(`http://localhost:3001/students/names?searchTerm=${studentName}&lrn=${lrn}`);
      
      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }
  
      const data = await response.json();
      setSuggestions(data);
    } catch (error) {
      console.error('Error fetching student names:', error.message);
      setSuggestions([]);
    }
  };
  

  const fetchSections = async (gradeLevel) => {
    try {
      if (!gradeLevel) {
        throw new Error("Grade level is required.");
      }
  
      const response = await fetch(`http://localhost:3001/sections-report?gradeLevel=${gradeLevel}`);
      
      if (!response.ok) {
        throw new Error(`Error fetching sections: ${response.status}`);
      }
  
      const data = await response.json();
      setSections(data); // Update state with fetched sections
    } catch (error) {
      console.error('Error fetching sections:', error.message);
      setSections([]); // Clear the sections on error
    }
  };
  
  

  const handleGradeChange = (e) => {
    const selectedGrade = e.target.value; // Get the selected value from the <select>
    setGrade(selectedGrade);             // Update the state with the selected grade
    setSection("");                      // Reset the section since the grade changed
    if (selectedGrade) {
      fetchSections(selectedGrade);      // Fetch the sections for the selected grade
    } else {
      setSections([]);                   // Clear sections if no grade is selected
    }
  };
  

  const handleStudentNameChange = (e) => {
    const value = e.target.value;
    setStudentName(value);
    if (value) {
      fetchStudentNames(); // Fetch student names based on grade, section, and search term
    } else {
      setSuggestions([]);
    }
  };
  

  const handleSuggestionClick = (name) => {
    setStudentName(name);
    setSuggestions([]);
  };

  const handleGenerateSF1 = () => {
    if (!selectedSchoolYear || !grade || !section) {
      alert('Please fill in all the required fields before generating.');
      return;
    }
    navigate('/sf1', { state: { schoolYear: selectedSchoolYear, grade, section } });
  };

  const handleGenerateSF2 = () => {
    if (!selectedSchoolYear) {
      alert('Please select a school year before generating.');
      return;
    }
    navigate('/sf2', { state: { schoolYear: selectedSchoolYear } });
  };

  const handleGenerateSF4 = () => {
    if (!selectedSchoolYear || !grade || !section) {
      alert('Please fill in all the required fields before generating.');
      return;
    }
    navigate('/sf4', { state: { schoolYear: selectedSchoolYear, grade, section } });
  };

  const handleGenerateSF5 = () => {
    if (!selectedSchoolYear || !grade || !section) {
      alert('Please fill in all the required fields before generating.');
      return;
    }
    navigate('/sf5', { state: { schoolYear: selectedSchoolYear, grade, section } });
  };

  const handleGenerateSF6 = () => {
    if (!selectedSchoolYear || !grade) {
      alert('Please fill in all the required fields before generating.');
      return;
    }
    navigate('/sf6', { state: { schoolYear: selectedSchoolYear, grade } });
  };

  return (
    <div className="summary-report-container">
      <div className="summary-report-header">
        <h1 className="summary-report-title">Summary Report on Promotion</h1>
      </div>

      <div className="summary-report-grid">
        {/* Form 137 Card */}
        {(roleName !== 'principal') && (
        <div className="summary-report-card">
          <h3>Form 137</h3>
          <p className="summary-report-description">Generate Form 137 for a specific student.</p>
          <button className="summary-report-btn" onClick={() => openModal('form_137')}>
            Generate Form 137
          </button>
        </div>
        )}

        {/* Form 138 Card */}
        {(roleName !== 'principal' && roleName !== 'registrar') && (
        <div className="summary-report-card">
          <h3>Form 138</h3>
          <p className="summary-report-description">Generate Form 138 for a specific student.</p>
          <button className="summary-report-btn" onClick={() => openModal('form_138')}>
            Generate Form 138
          </button>
        </div>
        )}

        {/* Good Moral Certificate Card */}
        {(roleName !== 'principal' && roleName !=='class_adviser') && (
        <div className="summary-report-card">
          <h3>Good Moral Certificate</h3>
          <p className="summary-report-description">Generate Good Moral Certificate for a specific student.</p>
          <button className="summary-report-btn" onClick={() => openModal('good_moral')}>
            Generate Good Moral Certificate
          </button>
        </div>
        )}

        {/* Late Enrollees Card */}
        {(roleName !== 'registrar' && roleName !=='class_adviser' && roleName !=='principal') && (
        <div className="summary-report-card">
          <h3>Late Enrollees</h3>
          <p className="summary-report-description">Generate a report for late enrollees.</p>
          <button className="summary-report-btn" onClick={() => openModal('late_enrollee')}>
            Generate Late Enrollees Report
          </button>
        </div>
        )}

        {/* SF1 Card */}
        {(roleName !== 'principal' && roleName !== 'registrar' ) && (
        <div className="summary-report-card">
          <h3>SF1 - School Register</h3>
          <p className="summary-report-description">Generate School Register report with complete student information.</p>
          <button className="summary-report-btn" onClick={() => openModal('sf1')}>
            Generate SF1
          </button>
        </div>
        )}

        {/* SF2 Card */}
        {(roleName !== 'principal' && roleName !== 'registrar' ) && (
        <div className="summary-report-card">
          <h3>SF2 - School Summary Report of Enrollment</h3>
          <p className="summary-report-description">Generate enrollment summary report by grade level.</p>
          <button className="summary-report-btn" onClick={() => openModal('sf2')}>
            Generate SF2
          </button>
        </div>
        )}

        {/* SF4 Card */}
        {(roleName !== 'principal' && roleName !== 'registrar' && roleName !=='class_adviser') && (
        <div className="summary-report-card">
          <h3>SF4 - Monthly Learner's Movement and Attendance</h3>
          <p className="summary-report-description">Generate monthly attendance and movement report.</p>
          <button className="summary-report-btn" onClick={() => openModal('sf4')}>
            Generate SF4
          </button>
        </div>
        )}

        {/* SF5 Card */}
        {(roleName !== 'principal' && roleName !== 'registrar' ) && (
        <div className="summary-report-card">
          <h3>SF5 - Report on Promotion and Learning Progress</h3>
          <p className="summary-report-description">Generate detailed promotion and learning progress report.</p>
          <button className="summary-report-btn" onClick={() => openModal('sf5')}>
            Generate SF5
          </button>
        </div>
        )}

        {/* SF6 Card */}
        {(roleName !== 'registrar' && roleName !=='class_adviser') && (
        <div className="summary-report-card">
          <h3>SF6 - Summarized Report on Promotion</h3>
          <p className="summary-report-description">Generate summarized promotion and learning progress report.</p>
          <button className="summary-report-btn" onClick={() => openModal('sf6')}>
            Generate SF6
          </button>
        </div>
        )}

        {/* Early Enrollment Report Card */}
        {(roleName === 'principal') && (
        <div className="summary-report-card">
          <h3>Early Enrollment Report</h3>
          <p className="summary-report-description">Generate early enrollment report for the upcoming school year.</p>
          <button className="summary-report-btn" onClick={() => openModal('early_enrollment')}>
            Generate Early Enrollment Report
          </button>
        </div>
        )}

        {/* Quarterly Assessment Report Card */}
        {(roleName === 'class_adviser') && (
        <div className="summary-report-card">
          <h3>Quarterly Assessment Report</h3>
          <p className="summary-report-description">Generate quarterly assessment report with detailed statistics.</p>
          <button className="summary-report-btn" onClick={() => openModal('quarterly_assessment')}>
            Generate Quarterly Assessment Report
          </button>
        </div>
        )}

        {/* Class List Report Card */}
        {(roleName === 'class_adviser') && (
        <div className="summary-report-card">
          <h3>Class List Report</h3>
          <p className="summary-report-description">Generate detailed class list with student information.</p>
          <button className="summary-report-btn" onClick={() => openModal('class_list')}>
            Generate Class List Report
          </button>
        </div>
        )}

        {/* Class Honor Roll Report Card */}
        {(roleName === 'class_adviser') && (
        <div className="summary-report-card">
          <h3>Class Honor Roll Report</h3>
          <p className="summary-report-description">Generate honor roll list with student rankings and achievements.</p>
          <button className="summary-report-btn" onClick={() => openModal('class_honor_roll')}>
            Generate Class Honor Roll Report
          </button>
        </div>
        )}

        {/* Nutritional Report Card */}
        {(roleName === 'class_adviser') && (
        <div className="summary-report-card">
          <h3>Nutritional Report</h3>
          <p className="summary-report-description">Generate nutritional status report with BMI and health metrics.</p>
          <button className="summary-report-btn" onClick={() => openModal('nutritional_report')}>
            Generate Nutritional Report
          </button>
        </div>
        )}

        {/* Roster of Enrolled Students Card */}
        {(roleName === 'principal') && (
        <div className="summary-report-card">
          <h3>Roster of Enrolled Students</h3>
          <p className="summary-report-description">Generate roster of enrolled students with complete information.</p>
          <button className="summary-report-btn" onClick={() => openModal('roster')}>
            Generate Roster of Enrolled Students
          </button>
        </div>
        )}
      </div>

      {showModal && (
        <div className="modal-overlay">
          <div className="modal">
            <button className="close-modal" onClick={closeModal}>&times;</button>
            {modalContent === 'form_137' && (
              <div>
                <h3>Generate Form 137</h3>
                <form onSubmit={(e) => e.preventDefault()}> 
                  <label>School Year:</label>
                  <select value={selectedSchoolYear} onChange={(e) => setSelectedSchoolYear(e.target.value)} required>
                    <option value="">--Select One--</option>
                    {schoolYears.map((year, index) => (
                      <option key={index} value={year}>{year}</option>
                    ))}
                  </select>
                  {/* <label>Grade:</label>
                  <select value={grade} onChange={handleGradeChange} required> 
                    <option value="">--Select One--</option>
                    <option value="7">Grade 7</option>
                    <option value="8">Grade 8</option>
                    <option value="9">Grade 9</option>
                    <option value="10">Grade 10</option>
                  </select>
                  <label>Section:</label>
                  <select value={section} onChange={(e) => setSection(e.target.value)} required>
                    <option value="">--Select One--</option>
                    {sections.map((sec) => (
                      <option key={sec.section_name} value={sec.section_name}>
                        {sec.section_name}
                      </option>
                    ))}
                  </select> */}
                  <label>LRN:</label>
                  <input
                    type="text"
                    value={lrn}
                    onChange={(e) => setLRN(e.target.value)}
                    placeholder="Enter student lrn"
                    required
                  />
                  <label>Student Name:</label>
                  <input
                    type="text"
                    value={studentName}
                    onChange={handleStudentNameChange}
                    placeholder="Enter student name"
                    required
                  />
                  {suggestions.length > 0 && (
                    <ul className="suggestions-list">
                      {suggestions.map((suggestion, index) => (
                        <li key={index} onClick={() => handleSuggestionClick(suggestion.stud_name)}>
                          {suggestion.stud_name}
                        </li>
                      ))}
                    </ul>
                  )}
                  <button type="button" onClick={handleGenerateForm137}>Generate</button>
                </form>
              </div>
            )}
            {modalContent === 'form_138' && (
              <div>
                <h3>Generate Form 138</h3>
                <form onSubmit={(e) => e.preventDefault()}> 
                  <label>School Year:</label>
                  <select value={selectedSchoolYear} onChange={(e) => setSelectedSchoolYear(e.target.value)} required>
                    <option value="">--Select One--</option>
                    {schoolYears.map((year, index) => (
                      <option key={index} value={year}>{year}</option>
                    ))}
                  </select>
                  <label>Grade:</label>
                  <select value={grade} onChange={handleGradeChange} required> 
                    <option value="">--Select One--</option>
                    <option value="7">Grade 7</option>
                    <option value="8">Grade 8</option>
                    <option value="9">Grade 9</option>
                    <option value="10">Grade 10</option>
                  </select>
                  <label>Section:</label>
                  <select value={section} onChange={(e) => setSection(e.target.value)} required>
                    <option value="">--Select One--</option>
                    {sections.map((sec) => (
                      <option key={sec.section_name} value={sec.section_name}>
                        {sec.section_name}
                      </option>
                    ))}
                  </select>
                  <label>Student Name:</label>
                  <input
                    type="text"
                    value={studentName}
                    onChange={handleStudentNameChange}
                    placeholder="Enter student name"
                    required
                  />
                  {suggestions.length > 0 && (
                    <ul className="suggestions-list">
                      {suggestions.map((suggestion, index) => (
                        <li key={index} onClick={() => handleSuggestionClick(suggestion.stud_name)}>
                          {suggestion.stud_name}
                        </li>
                      ))}
                    </ul>
                  )}
                  <button type="button" onClick={handleGenerateForm138}>Generate</button>
                </form>
              </div>
            )}
            {modalContent === 'good_moral' && (
              <div>
                <h3>Generate Good Moral Certificate</h3>
                <form onSubmit={(e) => e.preventDefault()}>
                <label>School Year:</label>
                  <select value={selectedSchoolYear} onChange={(e) => setSelectedSchoolYear(e.target.value)} required>
                    <option value="">--Select One--</option>
                    {schoolYears.map((year, index) => (
                      <option key={index} value={year}>{year}</option>
                    ))}
                  </select>
                  {/* <label>Grade:</label>
                  <select value={grade} onChange={handleGradeChange} required>
                    <option value="">--Select One--</option>
                    <option value="7">Grade 7</option>
                    <option value="8">Grade 8</option>
                    <option value="9">Grade 9</option>
                    <option value="10">Grade 10</option>
                  </select>
                  <label>Section:</label>
                  <select value={section} onChange={(e) => setSection(e.target.value)} required>
                    <option value="">--Select One--</option>
                    {sections.map((sec) => (
                      <option key={sec.section_name} value={sec.section_name}>
                        {sec.section_name}
                      </option>
                    ))}
                  </select> */}
                  <label>LRN:</label>
                  <input
                    type="text"
                    value={lrn}
                    onChange={(e) => setLRN(e.target.value)}
                    placeholder="Enter student lrn"
                    required
                  />
                  <label>Student Name:</label>
                  <input
                    type="text"
                    value={studentName}
                    onChange={handleStudentNameChange}
                    placeholder="Enter student name"
                    required
                  />
                  {suggestions.length > 0 && (
                    <ul className="suggestions-list">
                      {suggestions.map((suggestion, index) => (
                        <li key={index} onClick={() => handleSuggestionClick(suggestion.stud_name)}>
                          {suggestion.stud_name}
                        </li>
                      ))}
                    </ul>
                  )}
                  <button type="button" onClick={handleGenerateGoodMoral}>Generate</button>
                </form>
              </div>
            )}
            {modalContent === 'late_enrollee' && (
              <div>
                <h3>Generate Late Enrollees Report</h3>
                <form onSubmit={(e) => e.preventDefault()}>
                  <label>School Year:</label>
                  <select value={selectedSchoolYear} onChange={(e) => setSelectedSchoolYear(e.target.value)} required>
                    <option value="">--Select One--</option>
                    {schoolYears.map((year, index) => (
                      <option key={index} value={year}>{year}</option>
                    ))}
                  </select>
                  <label>Grade:</label>
                  <select value={grade} onChange={handleGradeChange} required>
                    <option value="">--Select One--</option>
                    <option value="7">Grade 7</option>
                    <option value="8">Grade 8</option>
                    <option value="9">Grade 9</option>
                    <option value="10">Grade 10</option>
                  </select>
                  <label>Section:</label>
                  <select value={section} onChange={(e) => setSection(e.target.value)} required>
                    <option value="">--Select One--</option>
                    {sections.map((sec) => (
                      <option key={sec.section_name} value={sec.section_name}>
                        {sec.section_name}
                      </option>
                    ))}
                  </select>
                  <button type="button" onClick={handleLateEnrolleesReport}>Generate Report</button>
                </form>
              </div>
            )}
            {modalContent === 'sf1' && (
              <div>
                <h3>Generate SF1 - School Register</h3>
                <form onSubmit={(e) => e.preventDefault()}>
                  <label>School Year:</label>
                  <select value={selectedSchoolYear} onChange={(e) => setSelectedSchoolYear(e.target.value)} required>
                    <option value="">--Select One--</option>
                    {schoolYears.map((year, index) => (
                      <option key={index} value={year}>{year}</option>
                    ))}
                  </select>
                  <label>Grade:</label>
                  <select value={grade} onChange={handleGradeChange} required>
                    <option value="">--Select One--</option>
                    <option value="7">Grade 7</option>
                    <option value="8">Grade 8</option>
                    <option value="9">Grade 9</option>
                    <option value="10">Grade 10</option>
                  </select>
                  <label>Section:</label>
                  <select value={section} onChange={(e) => setSection(e.target.value)} required>
                    <option value="">--Select One--</option>
                    {sections.map((sec) => (
                      <option key={sec.section_name} value={sec.section_name}>
                        {sec.section_name}
                      </option>
                    ))}
                  </select>
                  <button type="button" onClick={handleGenerateSF1}>Generate Report</button>
                </form>
              </div>
            )}
            {modalContent === 'sf2' && (
              <div>
                <h3>Generate SF2 - School Summary Report of Enrollment</h3>
                <form onSubmit={(e) => e.preventDefault()}>
                  <label>School Year:</label>
                  <select value={selectedSchoolYear} onChange={(e) => setSelectedSchoolYear(e.target.value)} required>
                    <option value="">--Select One--</option>
                    {schoolYears.map((year, index) => (
                      <option key={index} value={year}>{year}</option>
                    ))}
                  </select>
                  <button type="button" onClick={handleGenerateSF2}>Generate Report</button>
                </form>
              </div>
            )}
            {modalContent === 'sf4' && (
              <div>
                <h3>Generate SF4 - Monthly Learner's Movement and Attendance</h3>
                <form onSubmit={(e) => e.preventDefault()}>
                  <label>School Year:</label>
                  <select value={selectedSchoolYear} onChange={(e) => setSelectedSchoolYear(e.target.value)} required>
                    <option value="">--Select One--</option>
                    {schoolYears.map((year, index) => (
                      <option key={index} value={year}>{year}</option>
                    ))}
                  </select>
                  <label>Grade:</label>
                  <select value={grade} onChange={handleGradeChange} required>
                    <option value="">--Select One--</option>
                    <option value="7">Grade 7</option>
                    <option value="8">Grade 8</option>
                    <option value="9">Grade 9</option>
                    <option value="10">Grade 10</option>
                  </select>
                  <label>Section:</label>
                  <select value={section} onChange={(e) => setSection(e.target.value)} required>
                    <option value="">--Select One--</option>
                    {sections.map((sec) => (
                      <option key={sec.section_name} value={sec.section_name}>
                        {sec.section_name}
                      </option>
                    ))}
                  </select>
                  <button type="button" onClick={handleGenerateSF4}>Generate Report</button>
                </form>
              </div>
            )}
            {modalContent === 'sf5' && (
              <div>
                <h3>Generate SF5 - Report on Promotion and Learning Progress</h3>
                <form onSubmit={(e) => e.preventDefault()}>
                  <label>School Year:</label>
                  <select value={selectedSchoolYear} onChange={(e) => setSelectedSchoolYear(e.target.value)} required>
                    <option value="">--Select One--</option>
                    {schoolYears.map((year, index) => (
                      <option key={index} value={year}>{year}</option>
                    ))}
                  </select>
                  <label>Grade:</label>
                  <select value={grade} onChange={handleGradeChange} required>
                    <option value="">--Select One--</option>
                    <option value="7">Grade 7</option>
                    <option value="8">Grade 8</option>
                    <option value="9">Grade 9</option>
                    <option value="10">Grade 10</option>
                  </select>
                  <label>Section:</label>
                  <select value={section} onChange={(e) => setSection(e.target.value)} required>
                    <option value="">--Select One--</option>
                    {sections.map((sec) => (
                      <option key={sec.section_name} value={sec.section_name}>
                        {sec.section_name}
                      </option>
                    ))}
                  </select>
                  <button type="button" onClick={handleGenerateSF5}>Generate Report</button>
                </form>
              </div>
            )}
            {modalContent === 'sf6' && (
              <div>
                <h3>Generate SF6 - Summarized Report on Promotion</h3>
                <form onSubmit={(e) => e.preventDefault()}>
                  <label>School Year:</label>
                  <select value={selectedSchoolYear} onChange={(e) => setSelectedSchoolYear(e.target.value)} required>
                    <option value="">--Select One--</option>
                    {schoolYears.map((year, index) => (
                      <option key={index} value={year}>{year}</option>
                    ))}
                  </select>
                  <label>Grade:</label>
                  <select value={grade} onChange={handleGradeChange} required>
                    <option value="">--Select One--</option>
                    <option value="7">Grade 7</option>
                    <option value="8">Grade 8</option>
                    <option value="9">Grade 9</option>
                    <option value="10">Grade 10</option>
                  </select>
                  <button type="button" onClick={handleGenerateSF6}>Generate Report</button>
                </form>
              </div>
            )}
            {modalContent === 'early_enrollment' && (
              <div>
                <h3>Generate Early Enrollment Report</h3>
                <form onSubmit={(e) => e.preventDefault()}>
                  <label>School Year:</label>
                  <select value={selectedSchoolYear} onChange={(e) => setSelectedSchoolYear(e.target.value)} required>
                    <option value="">--Select One--</option>
                    {schoolYears.map((year, index) => (
                      <option key={index} value={year}>{year}</option>
                    ))}
                  </select>
                  <label>Grade:</label>
                  <select value={grade} onChange={handleGradeChange} required>
                    <option value="">--Select One--</option>
                    <option value="7">Grade 7</option>
                    <option value="8">Grade 8</option>
                    <option value="9">Grade 9</option>
                    <option value="10">Grade 10</option>
                  </select>
                  <label>Section:</label>
                  <select value={section} onChange={(e) => setSection(e.target.value)} required>
                    <option value="">--Select One--</option>
                    {sections.map((sec) => (
                      <option key={sec.section_name} value={sec.section_name}>
                        {sec.section_name}
                      </option>
                    ))}
                  </select>
                  <button type="button" onClick={() => navigate('/early-enrollment', { state: { schoolYear: selectedSchoolYear, grade, section } })}>Generate Report</button>
                </form>
              </div>
            )}
            {modalContent === 'quarterly_assessment' && (
              <div>
                <h3>Generate Quarterly Assessment Report</h3>
                <form onSubmit={(e) => e.preventDefault()}>
                  <label>School Year:</label>
                  <select value={selectedSchoolYear} onChange={(e) => setSelectedSchoolYear(e.target.value)} required>
                    <option value="">--Select One--</option>
                    {schoolYears.map((year, index) => (
                      <option key={index} value={year}>{year}</option>
                    ))}
                  </select>
                  <label>Grade:</label>
                  <select value={grade} onChange={handleGradeChange} required>
                    <option value="">--Select One--</option>
                    <option value="7">Grade 7</option>
                    <option value="8">Grade 8</option>
                    <option value="9">Grade 9</option>
                    <option value="10">Grade 10</option>
                  </select>
                  <label>Section:</label>
                  <select value={section} onChange={(e) => setSection(e.target.value)} required>
                    <option value="">--Select One--</option>
                    {sections.map((sec) => (
                      <option key={sec.section_name} value={sec.section_name}>
                        {sec.section_name}
                      </option>
                    ))}
                  </select>
                  <label>Quarter:</label>
                  <select value={quarter} onChange={(e) => setQuarter(e.target.value)} required>
                    <option value="">--Select One--</option>
                    <option value="1">First Quarter</option>
                    <option value="2">Second Quarter</option>
                    <option value="3">Third Quarter</option>
                    <option value="4">Fourth Quarter</option>
                  </select>
                  <button type="button" onClick={() => navigate('/quarterly-assessment', { state: { schoolYear: selectedSchoolYear, grade, section, quarter } })}>Generate Report</button>
                </form>
              </div>
            )}
            {modalContent === 'class_list' && (
              <div>
                <h3>Generate Class List Report</h3>
                <form onSubmit={(e) => e.preventDefault()}>
                  <label>School Year:</label>
                  <select value={selectedSchoolYear} onChange={(e) => setSelectedSchoolYear(e.target.value)} required>
                    <option value="">--Select One--</option>
                    {schoolYears.map((year, index) => (
                      <option key={index} value={year}>{year}</option>
                    ))}
                  </select>
                  <label>Grade:</label>
                  <select value={grade} onChange={handleGradeChange} required>
                    <option value="">--Select One--</option>
                    <option value="7">Grade 7</option>
                    <option value="8">Grade 8</option>
                    <option value="9">Grade 9</option>
                    <option value="10">Grade 10</option>
                  </select>
                  <label>Section:</label>
                  <select value={section} onChange={(e) => setSection(e.target.value)} required>
                    <option value="">--Select One--</option>
                    {sections.map((sec) => (
                      <option key={sec.section_name} value={sec.section_name}>
                        {sec.section_name}
                      </option>
                    ))}
                  </select>
                  <button type="button" onClick={() => navigate('/class-list', { state: { schoolYear: selectedSchoolYear, grade, section } })}>Generate Report</button>
                </form>
              </div>
            )}
            {modalContent === 'class_honor_roll' && (
              <div>
                <h3>Generate Class Honor Roll Report</h3>
                <form onSubmit={(e) => e.preventDefault()}>
                  <label>School Year:</label>
                  <select value={selectedSchoolYear} onChange={(e) => setSelectedSchoolYear(e.target.value)} required>
                    <option value="">--Select One--</option>
                    {schoolYears.map((year, index) => (
                      <option key={index} value={year}>{year}</option>
                    ))}
                  </select>
                  <label>Grade:</label>
                  <select value={grade} onChange={handleGradeChange} required>
                    <option value="">--Select One--</option>
                    <option value="7">Grade 7</option>
                    <option value="8">Grade 8</option>
                    <option value="9">Grade 9</option>
                    <option value="10">Grade 10</option>
                  </select>
                  <label>Section:</label>
                  <select value={section} onChange={(e) => setSection(e.target.value)} required>
                    <option value="">--Select One--</option>
                    {sections.map((sec) => (
                      <option key={sec.section_name} value={sec.section_name}>
                        {sec.section_name}
                      </option>
                    ))}
                  </select>
                  <label>Quarter:</label>
                  <select value={quarter} onChange={(e) => setQuarter(e.target.value)} required>
                    <option value="">--Select One--</option>
                    <option value="1">First Quarter</option>
                    <option value="2">Second Quarter</option>
                    <option value="3">Third Quarter</option>
                    <option value="4">Fourth Quarter</option>
                  </select>
                  <button type="button" onClick={() => navigate('/class-honor-roll', { state: { schoolYear: selectedSchoolYear, grade, section, quarter } })}>Generate Report</button>
                </form>
              </div>
            )}
            {modalContent === 'nutritional_report' && (
              <div>
                <h3>Generate Nutritional Report</h3>
                <form onSubmit={(e) => e.preventDefault()}>
                  <label>School Year:</label>
                  <select value={selectedSchoolYear} onChange={(e) => setSelectedSchoolYear(e.target.value)} required>
                    <option value="">--Select One--</option>
                    {schoolYears.map((year, index) => (
                      <option key={index} value={year}>{year}</option>
                    ))}
                  </select>
                  <label>Grade:</label>
                  <select value={grade} onChange={handleGradeChange} required>
                    <option value="">--Select One--</option>
                    <option value="7">Grade 7</option>
                    <option value="8">Grade 8</option>
                    <option value="9">Grade 9</option>
                    <option value="10">Grade 10</option>
                  </select>
                  <label>Section:</label>
                  <select value={section} onChange={(e) => setSection(e.target.value)} required>
                    <option value="">--Select One--</option>
                    {sections.map((sec) => (
                      <option key={sec.section_name} value={sec.section_name}>
                        {sec.section_name}
                      </option>
                    ))}
                  </select>
                  <button type="button" onClick={() => navigate('/nutritional-report', { state: { schoolYear: selectedSchoolYear, grade, section } })}>Generate Report</button>
                </form>
              </div>
            )}
            {modalContent === 'roster' && (
              <div>
                <h3>Generate Roster of Enrolled Students</h3>
                <form onSubmit={(e) => e.preventDefault()}>
                  <label>School Year:</label>
                  <select value={selectedSchoolYear} onChange={(e) => setSelectedSchoolYear(e.target.value)} required>
                    <option value="">--Select One--</option>
                    {schoolYears.map((year, index) => (
                      <option key={index} value={year}>{year}</option>
                    ))}
                  </select>
                  <label>Grade:</label>
                  <select value={grade} onChange={handleGradeChange} required>
                    <option value="">--Select One--</option>
                    <option value="7">Grade 7</option>
                    <option value="8">Grade 8</option>
                    <option value="9">Grade 9</option>
                    <option value="10">Grade 10</option>
                  </select>
                  <label>Section:</label>
                  <select value={section} onChange={(e) => setSection(e.target.value)} required>
                    <option value="">--Select One--</option>
                    {sections.map((sec) => (
                      <option key={sec.section_name} value={sec.section_name}>
                        {sec.section_name}
                      </option>
                    ))}
                  </select>
                  <button type="button" onClick={() => navigate('/roster', { state: { schoolYear: selectedSchoolYear, grade, section } })}>Generate Report</button>
                </form>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default PromotionReport;
