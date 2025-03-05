import React, { useState } from 'react';
import { jsPDF } from 'jspdf';
import '../CssFiles/sf6.css';

function SF6() {
  const [schoolData] = useState({
    schoolName: "Lourdes National High School",
    schoolId: "123456",
    district: "Dauis",
    division: "Bohol",
    region: "VII",
    schoolYear: "2023-2024"
  });

  const [summaryData] = useState({
    grades: {
      "Grade 7": {
        total: 200,
        promoted: { male: 95, female: 98 },
        retained: { male: 4, female: 3 },
        totalMale: 99,
        totalFemale: 101
      },
      "Grade 8": {
        total: 195,
        promoted: { male: 93, female: 96 },
        retained: { male: 3, female: 3 },
        totalMale: 96,
        totalFemale: 99
      },
      "Grade 9": {
        total: 190,
        promoted: { male: 90, female: 94 },
        retained: { male: 3, female: 3 },
        totalMale: 93,
        totalFemale: 97
      },
      "Grade 10": {
        total: 185,
        promoted: { male: 88, female: 92 },
        retained: { male: 2, female: 3 },
        totalMale: 90,
        totalFemale: 95
      }
    },
    total: {
      promoted: { male: 366, female: 380 },
      retained: { male: 12, female: 12 },
      totalMale: 378,
      totalFemale: 392,
      grandTotal: 770
    }
  });

  const handleConvertToPdf = () => {
    const doc = new jsPDF({
      orientation: "landscape",
      unit: "mm",
      format: "a4"
    });

    const content = document.querySelector(".sf6-container");
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
    <div className="sf6-page">
      <div className="sf6-container">
        <div className="sf6-header">
          <div className="sf6-header-logos">
            <img src="/deped-logo.png" alt="DepEd Logo" className="sf6-logo" />
          </div>
          <div className="sf6-header-text">
            <h1>Republic of the Philippines • Department of Education</h1>
            <h2>Region VII Central Visayas • Division of Bohol • District of Dauis</h2>
            <h2>LOURDES NATIONAL HIGH SCHOOL</h2>
            <h3>Dauis - Panglao Rd, Dauis, Bohol</h3>
            <h3>SUMMARIZED REPORT ON PROMOTION AND LEARNING PROGRESS & ACHIEVEMENT (SF6)</h3>
          </div>
          <div className="sf6-header-logos">
            <img src="/lnhs-logo.png" alt="School Logo" className="sf6-logo" />
          </div>
        </div>

        <div className="sf6-school-info">
          <div className="sf6-info-item">
            <span className="sf6-info-label">School Name:</span>
            <span>{schoolData.schoolName}</span>
          </div>
          <div className="sf6-info-item">
            <span className="sf6-info-label">School ID:</span>
            <span>{schoolData.schoolId}</span>
          </div>
          <div className="sf6-info-item">
            <span className="sf6-info-label">District:</span>
            <span>{schoolData.district}</span>
          </div>
          <div className="sf6-info-item">
            <span className="sf6-info-label">Division:</span>
            <span>{schoolData.division}</span>
          </div>
          <div className="sf6-info-item">
            <span className="sf6-info-label">Region:</span>
            <span>{schoolData.region}</span>
          </div>
          <div className="sf6-info-item">
            <span className="sf6-info-label">School Year:</span>
            <span>{schoolData.schoolYear}</span>
          </div>
        </div>

        <div className="sf6-content">
          <table className="sf6-table">
            <thead>
              <tr>
                <th rowSpan="3">GRADE LEVEL</th>
                <th colSpan="6">PROMOTION STATUS</th>
                <th colSpan="3" rowSpan="2">TOTAL</th>
              </tr>
              <tr>
                <th colSpan="2">PROMOTED</th>
                <th colSpan="2">RETAINED</th>
                <th colSpan="2">TOTAL</th>
              </tr>
              <tr>
                <th>M</th>
                <th>F</th>
                <th>M</th>
                <th>F</th>
                <th>M</th>
                <th>F</th>
                <th>M</th>
                <th>F</th>
                <th>TOTAL</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(summaryData.grades).map(([grade, data]) => (
                <tr key={grade}>
                  <td>{grade}</td>
                  <td>{data.promoted.male}</td>
                  <td>{data.promoted.female}</td>
                  <td>{data.retained.male}</td>
                  <td>{data.retained.female}</td>
                  <td>{data.totalMale}</td>
                  <td>{data.totalFemale}</td>
                  <td>{data.totalMale}</td>
                  <td>{data.totalFemale}</td>
                  <td>{data.total}</td>
                </tr>
              ))}
              <tr className="sf6-total-row">
                <td>TOTAL</td>
                <td>{summaryData.total.promoted.male}</td>
                <td>{summaryData.total.promoted.female}</td>
                <td>{summaryData.total.retained.male}</td>
                <td>{summaryData.total.retained.female}</td>
                <td>{summaryData.total.totalMale}</td>
                <td>{summaryData.total.totalFemale}</td>
                <td>{summaryData.total.totalMale}</td>
                <td>{summaryData.total.totalFemale}</td>
                <td>{summaryData.total.grandTotal}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="sf6-footer">
          <div className="sf6-signature-section">
            <div className="sf6-signature">
              <div className="sf6-signature-line">Prepared by:</div>
              <div className="sf6-signature-name">REGISTRAR'S NAME</div>
              <div className="sf6-signature-title">School Registrar</div>
            </div>
            <div className="sf6-signature">
              <div className="sf6-signature-line">Certified Correct:</div>
              <div className="sf6-signature-name">PRINCIPAL'S NAME</div>
              <div className="sf6-signature-title">School Principal</div>
            </div>
          </div>
          <div className="sf6-date">
            <p>Date: {new Date().toLocaleDateString()}</p>
          </div>
        </div>
      </div>
      
      <div className="sf6-buttons">
        <button onClick={handleConvertToPdf}>Convert to PDF</button>
      </div>
    </div>
  );
}

export default SF6; 