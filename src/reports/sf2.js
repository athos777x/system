import React, { useState } from 'react';
import { jsPDF } from 'jspdf';
import '../CssFiles/sf2.css';

function SF2() {
  const [schoolData] = useState({
    schoolName: "Lourdes National High School",
    schoolId: "123456",
    district: "Dauis",
    division: "Bohol",
    region: "VII",
    schoolYear: "2023-2024",
    month: "June"
  });

  const [enrollmentData] = useState({
    grades: {
      "Grade 7": { male: 150, female: 160 },
      "Grade 8": { male: 145, female: 155 },
      "Grade 9": { male: 140, female: 150 },
      "Grade 10": { male: 135, female: 145 }
    },
    totalMale: 570,
    totalFemale: 610,
    grandTotal: 1180
  });

  const handleConvertToPdf = () => {
    const doc = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4"
    });

    const content = document.querySelector(".sf2-container");
    if (content) {
      doc.html(content, {
        callback: function (doc) {
          window.open(doc.output("bloburl"), "_blank");
        },
        x: 10,
        y: 10,
        width: 190,
        windowWidth: 1000
      });
    }
  };

  return (
    <div className="sf2-page">
      <div className="sf2-container">
        <div className="sf2-header">
          <div className="sf2-logos">
            <img src="/deped-logo.png" alt="DepEd Logo" className="sf2-logo" />
            <img src="/lnhs-logo.png" alt="School Logo" className="sf2-logo" />
          </div>
          <div className="sf2-title">
            <h1>Department of Education</h1>
            <h2>SCHOOL SUMMARY REPORT OF ENROLLMENT</h2>
            <h3>SF2</h3>
          </div>
        </div>

        <div className="sf2-school-info">
          <div className="sf2-info-row">
            <div className="sf2-info-item">
              <span>School Name: {schoolData.schoolName}</span>
            </div>
            <div className="sf2-info-item">
              <span>School ID: {schoolData.schoolId}</span>
            </div>
          </div>
          <div className="sf2-info-row">
            <div className="sf2-info-item">
              <span>District: {schoolData.district}</span>
            </div>
            <div className="sf2-info-item">
              <span>Division: {schoolData.division}</span>
            </div>
            <div className="sf2-info-item">
              <span>Region: {schoolData.region}</span>
            </div>
          </div>
          <div className="sf2-info-row">
            <div className="sf2-info-item">
              <span>School Year: {schoolData.schoolYear}</span>
            </div>
            <div className="sf2-info-item">
              <span>Month: {schoolData.month}</span>
            </div>
          </div>
        </div>

        <div className="sf2-table-container">
          <table className="sf2-table">
            <thead>
              <tr>
                <th rowSpan="2">GRADE LEVEL</th>
                <th colSpan="3">ENROLLMENT</th>
              </tr>
              <tr>
                <th>MALE</th>
                <th>FEMALE</th>
                <th>TOTAL</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(enrollmentData.grades).map(([grade, data]) => (
                <tr key={grade}>
                  <td>{grade}</td>
                  <td>{data.male}</td>
                  <td>{data.female}</td>
                  <td>{data.male + data.female}</td>
                </tr>
              ))}
              <tr className="sf2-total-row">
                <td>TOTAL</td>
                <td>{enrollmentData.totalMale}</td>
                <td>{enrollmentData.totalFemale}</td>
                <td>{enrollmentData.grandTotal}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="sf2-footer">
          <div className="sf2-signature-section">
            <div className="sf2-signature">
              <div className="sf2-signature-line">Prepared by:</div>
              <div className="sf2-signature-name">REGISTRAR'S NAME</div>
              <div className="sf2-signature-title">School Registrar</div>
            </div>
            <div className="sf2-signature">
              <div className="sf2-signature-line">Certified Correct:</div>
              <div className="sf2-signature-name">PRINCIPAL'S NAME</div>
              <div className="sf2-signature-title">School Principal</div>
            </div>
          </div>
          <div className="sf2-date">
            <p>Date: {new Date().toLocaleDateString()}</p>
          </div>
        </div>
      </div>
      
      <div className="sf2-buttons">
        <button onClick={handleConvertToPdf}>Convert to PDF</button>
      </div>
    </div>
  );
}

export default SF2; 