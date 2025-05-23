import React, { useState } from 'react';
import { jsPDF } from 'jspdf';
import '../CssFiles/sf4.css';
import '../CssFiles/report_buttons.css';
import { useNavigate } from 'react-router-dom';

function SF4() {
  const navigate = useNavigate();
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

  const handlePrintPDF = () => {
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

  const handleBack = () => {
    navigate(-1); // Go back to previous page
  };

  return (
    <div className="report-page sf4-page">
      <div className="sf4-container">
        <div className="sf4-header">
          <div className="sf4-header-logos">
            <img src="/deped-logo.png" alt="DepEd Logo" className="sf4-logo" />
          </div>
          <div className="sf4-header-text">
            <h1>Republic of the Philippines • Department of Education</h1>
            <h2>Region VII Central Visayas • Division of Bohol • District of Dauis</h2>
            <h2>LOURDES NATIONAL HIGH SCHOOL</h2>
            <h3>Dauis - Panglao Rd, Dauis, Bohol</h3>
            <h3>SF2 SIMPLE</h3>
          </div>
          <div className="sf4-header-logos">
            <img src="/lnhs-logo.png" alt="School Logo" className="sf4-logo" />
          </div>
        </div>

        <div className="sf4-school-info">
          <div className="sf4-info-item">
            <span className="sf4-info-label">School Name:</span>
            <span>{schoolData.schoolName}</span>
          </div>
          <div className="sf4-info-item">
            <span className="sf4-info-label">School ID:</span>
            <span>{schoolData.schoolId}</span>
          </div>
          <div className="sf4-info-item">
            <span className="sf4-info-label">District:</span>
            <span>{schoolData.district}</span>
          </div>
          <div className="sf4-info-item">
            <span className="sf4-info-label">Division:</span>
            <span>{schoolData.division}</span>
          </div>
          <div className="sf4-info-item">
            <span className="sf4-info-label">Region:</span>
            <span>{schoolData.region}</span>
          </div>
          <div className="sf4-info-item">
            <span className="sf4-info-label">School Year:</span>
            <span>{schoolData.schoolYear}</span>
          </div>
          <div className="sf4-info-item">
            <span className="sf4-info-label">Month:</span>
            <span>{schoolData.month}</span>
          </div>
          <div className="sf4-info-item">
            <span className="sf4-info-label">Grade & Section:</span>
            <span>{schoolData.grade}-{schoolData.section}</span>
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
      
      <div className="report-buttons">
        <button onClick={handleBack} className="report-back-btn">Back</button>
        <button onClick={handlePrintPDF} className="report-print-btn">Print PDF</button>
      </div>
    </div>
  );
}

export default SF4; 