import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../RegistrarPagesCss/Registrar_SummaryReportonPromotionPage.css';

function Registrar_SummaryReportonPromotionPage() {
  const [modalContent, setModalContent] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [grade, setGrade] = useState("");
  const [section, setSection] = useState("");
  const [studentName, setStudentName] = useState("");
  const navigate = useNavigate();

  const openModal = (type) => {
    setModalContent(type);
    setShowModal(true);
  };

  const closeModal = () => {
    setModalContent(null);
    setShowModal(false);
  };

  const handleGenerateForm137 = () => {
    const studentData = { grade, section, name: studentName };
    navigate('/form-137', { state: { student: studentData } });
  };

  const handleGenerateGoodMoral = () => {
    const studentData = { grade, section, name: studentName };
    navigate('/good-moral', { state: { student: studentData } });
  };

  const handleLateEnrolleesReport = () => {
    const reportData = { grade, section };
    navigate('/late-enrollee', { state: { report: reportData } });
  };

  return (
    <div className="summary-report-page">
      <h1>Summary Report on Promotion</h1>

      {/* Form 137 Section */}
      <div className="report-container form-137-container">
        <h2>Form 137</h2>
        <p>Generate Form 137 for a specific student.</p>
        <button className="generate-button" onClick={() => openModal('form_137')}>Generate Form 137</button>
      </div>

      {/* Good Moral Section */}
      <div className="report-container good-moral-container">
        <h2>Good Moral Certificate</h2>
        <p>Generate Good Moral Certificate for a specific student.</p>
        <button className="generate-button" onClick={() => openModal('good_moral')}>Generate Good Moral Certificate</button>
      </div>

      {/* Late Enrollees Section */}
      <div className="report-container late-enrollees-container">
        <h2>Late Enrollees</h2>
        <p>Generate a report for late enrollees.</p>
        <button className="generate-button" onClick={() => openModal('late_enrollee')}>Generate Late Enrollees Report</button>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal">
            <button className="close-modal" onClick={closeModal}>&times;</button>
            {modalContent === 'form_137' && (
              <div>
                <h3>Generate Form 137</h3>
                <form onSubmit={(e) => e.preventDefault()}>
                  <label>Grade:</label>
                  <select value={grade} onChange={(e) => setGrade(e.target.value)}>
                    <option value="">--Select One--</option>
                    <option value="7">Grade 7</option>
                    <option value="8">Grade 8</option>
                    <option value="9">Grade 9</option>
                    <option value="10">Grade 10</option>
                  </select>
                  <label>Section:</label>
                  <select value={section} onChange={(e) => setSection(e.target.value)}>
                    <option value="">--Select One--</option>
                    <option value="Aquila">Aquila</option>
                    <option value="Orion">Orion</option>
                    <option value="Phoenix">Phoenix</option>
                    <option value="Vega">Vega</option>
                    <option value="Siera">Siera</option>
                    <option value="Zephyr">Zephyr</option>
                    <option value="Libra">Libra</option>
                    <option value="Nova">Nova</option>
                  </select>
                  <label>Student Name:</label>
                  <input 
                    type="text" 
                    value={studentName} 
                    onChange={(e) => setStudentName(e.target.value)} 
                    placeholder="Enter student name" 
                  />
                  <button type="button" onClick={handleGenerateForm137}>Generate</button>
                </form>
              </div>
            )}

            {modalContent === 'good_moral' && (
              <div>
                <h3>Generate Good Moral Certificate</h3>
                <form onSubmit={(e) => e.preventDefault()}>
                  <label>Grade:</label>
                  <select value={grade} onChange={(e) => setGrade(e.target.value)}>
                    <option value="">--Select One--</option>
                    <option value="7">Grade 7</option>
                    <option value="8">Grade 8</option>
                    <option value="9">Grade 9</option>
                    <option value="10">Grade 10</option>
                  </select>
                  <label>Section:</label>
                  <select value={section} onChange={(e) => setSection(e.target.value)}>
                    <option value="">--Select One--</option>
                    <option value="Aquila">Aquila</option>
                    <option value="Orion">Orion</option>
                    <option value="Phoenix">Phoenix</option>
                    <option value="Vega">Vega</option>
                    <option value="Siera">Siera</option>
                    <option value="Zephyr">Zephyr</option>
                    <option value="Libra">Libra</option>
                    <option value="Nova">Nova</option>
                  </select>
                  <label>Student Name:</label>
                  <input 
                    type="text" 
                    value={studentName} 
                    onChange={(e) => setStudentName(e.target.value)} 
                    placeholder="Enter student name" 
                  />
                  <button type="button" onClick={handleGenerateGoodMoral}>Generate</button>
                </form>
              </div>
            )}

            {modalContent === 'late_enrollee' && (
              <div>
                <h3>Generate Late Enrollees Report</h3>
                <form onSubmit={(e) => e.preventDefault()}>
                  <label>Grade:</label>
                  <select value={grade} onChange={(e) => setGrade(e.target.value)}>
                    <option value="">--Select One--</option>
                    <option value="7">Grade 7</option>
                    <option value="8">Grade 8</option>
                    <option value="9">Grade 9</option>
                    <option value="10">Grade 10</option>
                  </select>
                  <label>Section:</label>
                  <select value={section} onChange={(e) => setSection(e.target.value)}>
                    <option value="">--Select One--</option>
                    <option value="Aquila">Aquila</option>
                    <option value="Orion">Orion</option>
                    <option value="Phoenix">Phoenix</option>
                    <option value="Vega">Vega</option>
                    <option value="Siera">Siera</option>
                    <option value="Zephyr">Zephyr</option>
                    <option value="Libra">Libra</option>
                    <option value="Nova">Nova</option>
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
