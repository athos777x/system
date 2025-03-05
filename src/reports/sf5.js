import React, { useState } from 'react';
import { jsPDF } from 'jspdf';
import '../CssFiles/sf5.css';

function SF5() {
  const [schoolData] = useState({
    schoolName: "Lourdes National High School",
    schoolId: "123456",
    district: "Dauis",
    division: "Bohol",
    region: "VII",
    schoolYear: "2023-2024",
    grade: "9",
    section: "Rizal"
  });

  const [promotionData] = useState({
    subjects: [
      {
        name: "Filipino",
        total: 52,
        passed: 50,
        failed: 2,
        maleStats: { passed: 24, failed: 1 },
        femaleStats: { passed: 26, failed: 1 }
      },
      {
        name: "English",
        total: 52,
        passed: 51,
        failed: 1,
        maleStats: { passed: 25, failed: 0 },
        femaleStats: { passed: 26, failed: 1 }
      },
      {
        name: "Mathematics",
        total: 52,
        passed: 49,
        failed: 3,
        maleStats: { passed: 23, failed: 2 },
        femaleStats: { passed: 26, failed: 1 }
      },
      {
        name: "Science",
        total: 52,
        passed: 50,
        failed: 2,
        maleStats: { passed: 24, failed: 1 },
        femaleStats: { passed: 26, failed: 1 }
      },
      // Add more subjects as needed
    ],
    summary: {
      totalStudents: 52,
      promoted: 48,
      retained: 4,
      maleStats: { promoted: 23, retained: 2 },
      femaleStats: { promoted: 25, retained: 2 }
    }
  });

  const handleConvertToPdf = () => {
    const doc = new jsPDF({
      orientation: "landscape",
      unit: "mm",
      format: "a4"
    });

    const content = document.querySelector(".sf5-container");
    if (content) {
      doc.html(content, {
        callback: function (doc) {
          window.open(doc.output("bloburl"), "_blank");
        },
        x: 10,
        y: 10,
        width: 277,
        windowWidth: 1000
      });
    }
  };

  return (
    <div className="sf5-page">
      <div className="sf5-container">
        <div className="sf5-header">
          <div className="sf5-header-logos">
            <img src="/deped-logo.png" alt="DepEd Logo" className="sf5-logo" />
          </div>
          <div className="sf5-header-text">
            <h1>Republic of the Philippines • Department of Education</h1>
            <h2>Region VII Central Visayas • Division of Bohol • District of Dauis</h2>
            <h2>LOURDES NATIONAL HIGH SCHOOL</h2>
            <h3>Dauis - Panglao Rd, Dauis, Bohol</h3>
            <h3>REPORT ON PROMOTION AND LEARNING PROGRESS & ACHIEVEMENT (SF5)</h3>
          </div>
          <div className="sf5-header-logos">
            <img src="/lnhs-logo.png" alt="School Logo" className="sf5-logo" />
          </div>
        </div>

        <div className="sf5-school-info">
          <div className="sf5-info-item">
            <span className="sf5-info-label">School Name:</span>
            <span>{schoolData.schoolName}</span>
          </div>
          <div className="sf5-info-item">
            <span className="sf5-info-label">School ID:</span>
            <span>{schoolData.schoolId}</span>
          </div>
          <div className="sf5-info-item">
            <span className="sf5-info-label">District:</span>
            <span>{schoolData.district}</span>
          </div>
          <div className="sf5-info-item">
            <span className="sf5-info-label">Division:</span>
            <span>{schoolData.division}</span>
          </div>
          <div className="sf5-info-item">
            <span className="sf5-info-label">Region:</span>
            <span>{schoolData.region}</span>
          </div>
          <div className="sf5-info-item">
            <span className="sf5-info-label">School Year:</span>
            <span>{schoolData.schoolYear}</span>
          </div>
          <div className="sf5-info-item">
            <span className="sf5-info-label">Grade & Section:</span>
            <span>{schoolData.grade}-{schoolData.section}</span>
          </div>
        </div>

        <div className="sf5-content">
          <div className="sf5-subjects-section">
            <h3>LEARNING AREAS PERFORMANCE</h3>
            <table className="sf5-subjects-table">
              <thead>
                <tr>
                  <th rowSpan="2">LEARNING AREAS</th>
                  <th rowSpan="2">TOTAL<br/>STUDENTS</th>
                  <th colSpan="2">MALE</th>
                  <th colSpan="2">FEMALE</th>
                  <th colSpan="2">TOTAL</th>
                </tr>
                <tr>
                  <th>PASSED</th>
                  <th>FAILED</th>
                  <th>PASSED</th>
                  <th>FAILED</th>
                  <th>PASSED</th>
                  <th>FAILED</th>
                </tr>
              </thead>
              <tbody>
                {promotionData.subjects.map((subject, index) => (
                  <tr key={index}>
                    <td>{subject.name}</td>
                    <td>{subject.total}</td>
                    <td>{subject.maleStats.passed}</td>
                    <td>{subject.maleStats.failed}</td>
                    <td>{subject.femaleStats.passed}</td>
                    <td>{subject.femaleStats.failed}</td>
                    <td>{subject.passed}</td>
                    <td>{subject.failed}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="sf5-summary-section">
            <h3>PROMOTION STATUS</h3>
            <table className="sf5-summary-table">
              <thead>
                <tr>
                  <th>STATUS</th>
                  <th>MALE</th>
                  <th>FEMALE</th>
                  <th>TOTAL</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>PROMOTED</td>
                  <td>{promotionData.summary.maleStats.promoted}</td>
                  <td>{promotionData.summary.femaleStats.promoted}</td>
                  <td>{promotionData.summary.promoted}</td>
                </tr>
                <tr>
                  <td>RETAINED</td>
                  <td>{promotionData.summary.maleStats.retained}</td>
                  <td>{promotionData.summary.femaleStats.retained}</td>
                  <td>{promotionData.summary.retained}</td>
                </tr>
                <tr className="sf5-total-row">
                  <td>TOTAL</td>
                  <td>{promotionData.summary.maleStats.promoted + promotionData.summary.maleStats.retained}</td>
                  <td>{promotionData.summary.femaleStats.promoted + promotionData.summary.femaleStats.retained}</td>
                  <td>{promotionData.summary.totalStudents}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div className="sf5-footer">
          <div className="sf5-signature-section">
            <div className="sf5-signature">
              <div className="sf5-signature-line">Prepared by:</div>
              <div className="sf5-signature-name">TEACHER'S NAME</div>
              <div className="sf5-signature-title">Class Adviser</div>
            </div>
            <div className="sf5-signature">
              <div className="sf5-signature-line">Certified Correct:</div>
              <div className="sf5-signature-name">PRINCIPAL'S NAME</div>
              <div className="sf5-signature-title">School Principal</div>
            </div>
          </div>
          <div className="sf5-date">
            <p>Date: {new Date().toLocaleDateString()}</p>
          </div>
        </div>
      </div>
      
      <div className="sf5-buttons">
        <button onClick={handleConvertToPdf}>Convert to PDF</button>
      </div>
    </div>
  );
}

export default SF5; 