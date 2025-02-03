import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../RegistrarPagesCss/Registrar_SummaryReportonPromotionPage.css';

function Registrar_SummaryReportonPromotionPage() {
  const [modalContent, setModalContent] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [grade, setGrade] = useState("");
  const [section, setSection] = useState("");
  const [sections, setSections] = useState([]); // State to store sections
  const [studentName, setStudentName] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const navigate = useNavigate();

  const openModal = (type) => {
    setModalContent(type);
    setShowModal(true);
    setGrade(""); // Reset grade to default "--Select One--"
    setSection(""); // Reset section to default "--Select One--"
  };
  

  const closeModal = () => {
    setModalContent(null);
    setShowModal(false);
    setSuggestions([]);
    setSections([]); // Clear sections when modal is closed
  };

  const handleGenerateForm137 = () => {

    if (!grade || !section || !studentName) {
      alert('Please fill in all the required fields before generating.');
      return;
    }

    const studentData = { grade, section, name: studentName };
    navigate('/form-137', { state: { student: studentData } });
  };
  

  const handleGenerateGoodMoral = () => {

    if (!grade || !section || !studentName) {
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
      if (!grade || !section) {
        console.error("Both grade and section must be selected.");
        return;
      }
      const response = await fetch(`http://localhost:3001/students/names?gradeLevel=${grade}&sectionName=${section}&searchTerm=${studentName}`);
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

  return (
    <div className="report-container">
      <h1 className="report-title">Summary Report on Promotion</h1>
      
      {/* Form 137 Section */}
      <div className="form137-section">
        <div>
          <h2 className="form137-title">Form 138</h2>
          <p className="report-description">Generate Form 138 for a specific student.</p>
        </div>
        <button className="report-button" onClick={() => openModal('form_137')}>
          Generate Form 138
        </button>
      </div>

      {/* Good Moral Section */}
      <div className="good-moral-section">
        <div>
          <h2 className="good-moral-title">Good Moral Certificate</h2>
          <p className="report-description">Generate Good Moral Certificate for a specific student.</p>
        </div>
        <button className="report-button" onClick={() => openModal('good_moral')}>
          Generate Good Moral Certificate
        </button>
      </div>

      {/* Late Enrollees Section */}
      <div className="late-enrollees-section">
        <div>
          <h2 className="late-enrollees-title">Late Enrollees</h2>
          <p className="report-description">Generate a report for late enrollees.</p>
        </div>
        <button className="report-button" onClick={() => openModal('late_enrollee')}>
          Generate Late Enrollees Report
        </button>
      </div>

      {showModal && (
        <div className="modal-overlay">
          <div className="modal">
            <button className="close-modal" onClick={closeModal}>&times;</button>
            {modalContent === 'form_137' && (
              <div>
                <h3>Generate Form 138</h3>
                <form onSubmit={(e) => e.preventDefault()}>
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
                  <button type="button" onClick={handleGenerateForm137}>Generate</button>
                </form>
              </div>
            )}
            {modalContent === 'good_moral' && (
              <div>
                <h3>Generate Good Moral Certificate</h3>
                <form onSubmit={(e) => e.preventDefault()}>
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
                  <button type="button" onClick={handleGenerateGoodMoral}>Generate</button>
                </form>
              </div>
            )}
            {modalContent === 'late_enrollee' && (
              <div>
                <h3>Generate Late Enrollees Report</h3>
                <form onSubmit={(e) => e.preventDefault()}>
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
          </div>
        </div>
      )}
    </div>
  );
}

export default Registrar_SummaryReportonPromotionPage;
