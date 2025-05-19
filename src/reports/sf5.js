import { useLocation, useNavigate } from 'react-router-dom';
import React, { useState, useEffect } from 'react';
import { jsPDF } from 'jspdf';
import axios from 'axios';
import '../CssFiles/sf5.css';
import "../CssFiles/report_buttons.css";

function SF5() {
  const { state } = useLocation();
  const { schoolYear, grade, section } = state;
  const [schoolData, setSchoolData] = useState({
    schoolName: "Lourdes National High School",
    schoolId: "123456",
    district: "Dauis",
    division: "Bohol",
    region: "VII",
    schoolYear: schoolYear,
    grade: grade,
    section: section,
    schoolYearName: ''
  });

  const [promotionData, setPromotionData] = useState({
    subjects: [],
    summary: {
      totalStudents: 0,
      promoted: 0,
      retained: 0,
      maleStats: { promoted: 0, retained: 0 },
      femaleStats: { promoted: 0, retained: 0 }
    }
  });

  const navigate = useNavigate();
  const [adviser, setAdviser] = useState("");
  const [principal, setPrincipal] = useState("");

  useEffect(() => {
    axios.get('http://localhost:3001/api/reports/subject-statistics', {
      params: {
        grade_level: grade,  // Example: dynamic data can replace this
        section_id: section,  // Example: dynamic data can replace this
        school_year_id: schoolYear // Example: dynamic data can replace this
      }
    })
    .then(res => {
      const apiData = res.data;
  
      if (Array.isArray(apiData.subject_statistics)) {
        const subjects = apiData.subject_statistics.map(subject => ({
          name: subject.subject_name,
          total: subject.total_students,
          passed: subject.total_passed,
          failed: subject.total_failed,
          maleStats: {
            passed: subject.male_passed,
            failed: subject.male_failed
          },
          femaleStats: {
            passed: subject.female_passed,
            failed: subject.female_failed
          }
        }));
  
        // Calculating the summary data
        let totalStudents = 0;
        let malePromoted = 0, maleRetained = 0;
        let femalePromoted = 0, femaleRetained = 0;
  
        if (apiData.subject_statistics.length > 0) {
          totalStudents = apiData.subject_statistics[0].total_students;
          malePromoted = apiData.subject_statistics[0].male_promoted;
          maleRetained = apiData.subject_statistics[0].male_retained;
          femalePromoted = apiData.subject_statistics[0].female_promoted;
          femaleRetained = apiData.subject_statistics[0].female_retained;
        }
  
        const promoted = malePromoted + femalePromoted;
        const retained = maleRetained + femaleRetained;
  
        // Set the section and school year information from API response
        setSchoolData(prev => ({
          ...prev,
          section: apiData.section_info.section_name || prev.section,
          schoolYearName: apiData.section_info.school_year_name || prev.schoolYear
        }));        
  
        // Set the promotion data
        setPromotionData({
          subjects,
          summary: {
            totalStudents,
            promoted,
            retained,
            maleStats: { promoted: malePromoted, retained: maleRetained },
            femaleStats: { promoted: femalePromoted, retained: femaleRetained }
          }
        });
      } else {
        console.error('Expected subject_statistics to be an array but received:', apiData.subject_statistics);
      }
    })
    .catch(err => {
      console.error('Failed to fetch subject statistics:', err);
    });
  }, []);
  
  useEffect(() => {
    const fetchAdviser = async () => {
      try {
        const response = await axios.get("http://localhost:3001/api/enrollment/adviser-info", {
          params: {
            grade_level: grade,
            section_id: section
          }
        });

        if (response.data && response.data.adviser) {
          setAdviser(response.data.adviser);
        }
      } catch (err) {
        console.error("Error fetching adviser:", err);
      }
    };

    const fetchPrincipal = async () => {
      try {
        const response = await axios.get("http://localhost:3001/api/enrollment/principal");

        if (response.data && response.data.principal) {
          setPrincipal(response.data.principal);
        }
      } catch (err) {
        console.error("Error fetching principal:", err);
      }
    };

    fetchAdviser();
    fetchPrincipal();
  }, [grade, section]);

  const handlePrintPDF = () => {
    const doc = new jsPDF({
      orientation: "landscape",
      unit: "mm",
      format: "a4"
    });

    doc.html(document.querySelector(".sf5-container"), {
      callback: function (doc) {
        window.open(doc.output("bloburl"), "_blank");
      },
      x: 10,
      y: 10,
      width: 277,
      windowWidth: 1000
    });
  };

  const handleBack = () => {
    navigate(-1); // Go back to previous page
  };

  return (
    <div className="report-page sf5-page">
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
            <span>{schoolData.schoolYearName}</span>
          </div>
          <div className="sf5-info-item">
            <span className="sf5-info-label">Grade & Section:</span>
            <span>{schoolData.grade} - {schoolData.section}</span>
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
              <div className="f137-name">{adviser || "[Adviser Name]"}</div>
              <div className="sf5-signature-name">TEACHER'S NAME</div>
              <div className="sf5-signature-title">Class Adviser</div>
            </div>
            <div className="sf5-signature">           
              <div className="sf5-signature-line">Certified Correct:</div>
              <div className="f137-name">{principal || "[Principal Name]"}</div>
              <div className="sf5-signature-name">PRINCIPAL'S NAME</div>
              <div className="sf5-signature-title">School Principal</div>
            </div>
          </div>
          <div className="sf5-date">
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

export default SF5;
