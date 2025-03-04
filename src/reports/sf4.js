import React, { useState } from 'react';
import { jsPDF } from 'jspdf';
import '../CssFiles/sf4.css';

function SF4() {
  const [schoolData] = useState({
    schoolName: "Lourdes National High School",
    schoolId: "123456",
    district: "Dauis",
    division: "Bohol",
    region: "VII",
    schoolYear: "2023-2024",
    month: "June",
    grade: "9",
    section: "Rizal"
  });

  const [attendanceData] = useState({
    registered: { male: 25, female: 27 },
    dropped: { male: 0, female: 1 },
    transferred_in: { male: 1, female: 0 },
    transferred_out: { male: 0, female: 1 },
    dailyAttendance: [
      { day: 1, present: 50, absent: 2 },
      { day: 2, present: 51, absent: 1 },
      { day: 3, present: 49, absent: 3 },
      // Add more days as needed
    ]
  });

  const handleConvertToPdf = () => {
    const doc = new jsPDF({
      orientation: "landscape",
      unit: "mm",
      format: "a4"
    });

    const content = document.querySelector(".sf4-container");
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
    <div className="sf4-page">
      <div className="sf4-container">
        <div className="sf4-header">
          <div className="sf4-logos">
            <img src="/deped-logo.png" alt="DepEd Logo" className="sf4-logo" />
            <img src="/lnhs-logo.png" alt="School Logo" className="sf4-logo" />
          </div>
          <div className="sf4-title">
            <h1>Department of Education</h1>
            <h2>MONTHLY LEARNER'S MOVEMENT AND ATTENDANCE REPORT</h2>
            <h3>SF4</h3>
          </div>
        </div>

        <div className="sf4-school-info">
          <div className="sf4-info-row">
            <div className="sf4-info-item">
              <span>School Name: {schoolData.schoolName}</span>
            </div>
            <div className="sf4-info-item">
              <span>School ID: {schoolData.schoolId}</span>
            </div>
          </div>
          <div className="sf4-info-row">
            <div className="sf4-info-item">
              <span>District: {schoolData.district}</span>
            </div>
            <div className="sf4-info-item">
              <span>Division: {schoolData.division}</span>
            </div>
            <div className="sf4-info-item">
              <span>Region: {schoolData.region}</span>
            </div>
          </div>
          <div className="sf4-info-row">
            <div className="sf4-info-item">
              <span>School Year: {schoolData.schoolYear}</span>
            </div>
            <div className="sf4-info-item">
              <span>Month: {schoolData.month}</span>
            </div>
            <div className="sf4-info-item">
              <span>Grade & Section: {schoolData.grade}-{schoolData.section}</span>
            </div>
          </div>
        </div>

        <div className="sf4-content">
          <div className="sf4-summary-section">
            <h3>LEARNER'S MOVEMENT</h3>
            <table className="sf4-summary-table">
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
                  <td>Registered</td>
                  <td>{attendanceData.registered.male}</td>
                  <td>{attendanceData.registered.female}</td>
                  <td>{attendanceData.registered.male + attendanceData.registered.female}</td>
                </tr>
                <tr>
                  <td>Dropped</td>
                  <td>{attendanceData.dropped.male}</td>
                  <td>{attendanceData.dropped.female}</td>
                  <td>{attendanceData.dropped.male + attendanceData.dropped.female}</td>
                </tr>
                <tr>
                  <td>Transferred In</td>
                  <td>{attendanceData.transferred_in.male}</td>
                  <td>{attendanceData.transferred_in.female}</td>
                  <td>{attendanceData.transferred_in.male + attendanceData.transferred_in.female}</td>
                </tr>
                <tr>
                  <td>Transferred Out</td>
                  <td>{attendanceData.transferred_out.male}</td>
                  <td>{attendanceData.transferred_out.female}</td>
                  <td>{attendanceData.transferred_out.male + attendanceData.transferred_out.female}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="sf4-attendance-section">
            <h3>DAILY ATTENDANCE RECORD</h3>
            <table className="sf4-attendance-table">
              <thead>
                <tr>
                  <th>Day</th>
                  <th>Present</th>
                  <th>Absent</th>
                  <th>Total</th>
                </tr>
              </thead>
              <tbody>
                {attendanceData.dailyAttendance.map((day, index) => (
                  <tr key={index}>
                    <td>{day.day}</td>
                    <td>{day.present}</td>
                    <td>{day.absent}</td>
                    <td>{day.present + day.absent}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="sf4-footer">
          <div className="sf4-signature-section">
            <div className="sf4-signature">
              <div className="sf4-signature-line">Prepared by:</div>
              <div className="sf4-signature-name">TEACHER'S NAME</div>
              <div className="sf4-signature-title">Class Adviser</div>
            </div>
            <div className="sf4-signature">
              <div className="sf4-signature-line">Certified Correct:</div>
              <div className="sf4-signature-name">PRINCIPAL'S NAME</div>
              <div className="sf4-signature-title">School Principal</div>
            </div>
          </div>
          <div className="sf4-date">
            <p>Date: {new Date().toLocaleDateString()}</p>
          </div>
        </div>
      </div>
      
      <div className="sf4-buttons">
        <button onClick={handleConvertToPdf}>Convert to PDF</button>
      </div>
    </div>
  );
}

export default SF4; 