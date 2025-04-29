import { useLocation, useNavigate } from 'react-router-dom';
import React, { useEffect, useState } from 'react';
import { jsPDF } from 'jspdf';
import axios from 'axios';
import '../CssFiles/sf6.css';
import "../CssFiles/report_buttons.css";

function SF6() {
  const { state } = useLocation();
  const { schoolYear, grade } = state;
  const navigate = useNavigate();
  const [schoolData] = useState({
    schoolName: "Lourdes National High School",
    schoolId: "123456",
    district: "Dauis",
    division: "Bohol",
    region: "VII",
    schoolYear: schoolYear // dynamic school year from state
  });

  const [schoolYearName, setSchoolYearName] = useState(schoolYear);
  const [summaryData, setSummaryData] = useState(null);

  useEffect(() => {
    const fetchSummaryData = async () => {
      try {
        const response = await axios.get('http://localhost:3001/api/sf6-summary', {
          params: {
            grade_level: grade,
            school_year_id: schoolYear
          }
        });

        // Check if the response data is valid before setting it
        if (response.data && response.data.summary) {
          setSummaryData(response.data.summary);
        } else {
          console.error("Invalid response data:", response.data);
        }

        // Set the school year name based on the backend response
        if (response.data && response.data.school_year) {
          setSchoolYearName(response.data.school_year);
        }

      } catch (error) {
        console.error("Error fetching summary data:", error);
      }
    };

    fetchSummaryData();
  }, [grade, schoolYear]);

  const handlePrintPDF = () => {
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

  const handleBack = () => {
    navigate(-1); // Go back to previous page
  };

  return (
    <div className="report-page sf6-page">
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
            <span>{schoolYearName}</span>
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
              {summaryData ? (
                <>
                  {summaryData.map((data, index) => (
                    <tr key={index}>
                      <td>{data.level}</td>
                      <td>{data.male_promoted}</td>
                      <td>{data.female_promoted}</td>
                      <td>{data.male_retained}</td>
                      <td>{data.female_retained}</td>
                      <td>{data.male_promoted + data.male_retained}</td>
                      <td>{data.female_promoted + data.female_retained}</td>
                      <td>{data.male_promoted + data.male_retained}</td>
                      <td>{data.female_promoted + data.female_retained}</td>
                      <td>{data.male_promoted + data.female_promoted + data.male_retained + data.female_retained}</td>
                    </tr>
                  ))}
                  <tr className="sf6-total-row">
                    <td>TOTAL</td>
                    <td>{summaryData.reduce((sum, data) => sum + data.male_promoted, 0)}</td>
                    <td>{summaryData.reduce((sum, data) => sum + data.female_promoted, 0)}</td>
                    <td>{summaryData.reduce((sum, data) => sum + data.male_retained, 0)}</td>
                    <td>{summaryData.reduce((sum, data) => sum + data.female_retained, 0)}</td>
                    <td>{summaryData.reduce((sum, data) => sum + (data.male_promoted + data.male_retained), 0)}</td>
                    <td>{summaryData.reduce((sum, data) => sum + (data.female_promoted + data.female_retained), 0)}</td>
                    <td>{summaryData.reduce((sum, data) => sum + (data.male_promoted + data.male_retained), 0)}</td>
                    <td>{summaryData.reduce((sum, data) => sum + (data.female_promoted + data.female_retained), 0)}</td>
                    <td>{summaryData.reduce((sum, data) => sum + (data.male_promoted + data.female_promoted + data.male_retained + data.female_retained), 0)}</td>
                  </tr>
                </>
              ) : (
                <tr>
                  <td colSpan="10" style={{ textAlign: "center" }}>Loading data...</td>
                </tr>
              )}
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

      <div className="report-buttons">
        <button onClick={handleBack} className="report-back-btn">Back</button>
        <button onClick={handlePrintPDF} className="report-print-btn">Print PDF</button>
      </div>
    </div>
  );
}

export default SF6;
