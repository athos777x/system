import { useLocation, useNavigate } from 'react-router-dom';
import React, { useState, useEffect } from 'react';
import { jsPDF } from 'jspdf';
import axios from 'axios';
import '../CssFiles/class_honor_roll.css';
import "../CssFiles/report_buttons.css";

function ClassHonorRoll() {
  const location = useLocation();
  const navigate = useNavigate();
  const { schoolYear, grade, section, quarter} = location.state || {};

  const [schoolData, setSchoolData] = useState({
    schoolName: "Lourdes National High School",
    schoolId: "123456",
    district: "Dauis",
    division: "Bohol",
    region: "VII",
    schoolYear: "",
    quarter: "",
    grade: "",
    section: "",
  });

  const [honorRoll, setHonorRoll] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [adviser, setAdviser] = useState("");
  const [principal, setPrincipal] = useState("");

  useEffect(() => {
    if (schoolYear && grade && section && quarter) {
      fetchHonorRollData(schoolYear, grade, section, quarter);
      fetchPrincipal();
  
      // Optional fallback if header doesn't provide adviser
      fetchAdviser({ grade_level: grade, section_id: section });
    }
  }, [schoolYear, grade, section, quarter]);
  

  const fetchHonorRollData = async (schoolYearId, gradeLevel, sectionId, quarter) => {
    setLoading(true);
    try {
      const response = await axios.get('http://localhost:3001/api/reports/class-honor-roll', {
        params: {
          school_year_id: schoolYearId,
          grade_level: gradeLevel,
          section_id: sectionId,
          quarter,
        }
      });
  
      const { header, honorRoll } = response.data;
  
      const transformedData = honorRoll.map((student, index) => ({
        rank: index + 1,
        lrn: student.lrn,
        name: student.stud_name,
        sex: student.sex,
        generalAverage: parseFloat(student.general_average).toFixed(2),
        conduct: "Outstanding",
        attendance: "Perfect",
        remarks: student.remarks
      }));
  
      setHonorRoll(transformedData);
  
      if (header) {
        setSchoolData(prev => ({
          ...prev,
          schoolYear: header.school_year,
          grade: header.grade_section.split(" - ")[0].replace("Grade ", ""),
          section: header.grade_section.split(" - ")[1],
          adviser: header.class_adviser,
          dateGenerated: header.date_generated,
          quarter: quarter 
        }));
      }

      
    } catch (error) {
      console.error("Error fetching honor roll data:", error);
      setError("Failed to fetch honor roll data");
    } finally {
      setLoading(false);
    }
  };
  
  const getQuarterLabel = (quarter) => {
    switch (parseInt(quarter)) {
      case 1: return '1st Quarter';
      case 2: return '2nd Quarter';
      case 3: return '3rd Quarter';
      case 4: return '4th Quarter';
      default: return 'N/A';
    }
  };

  

  const fetchAdviser = async ({ grade_level, section_id }) => {
    try {
      const response = await axios.get("http://localhost:3001/api/enrollment/adviser-info", {
        params: { grade_level, section_id },
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


  const handlePrintPDF = () => {
    const doc = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4"
    });

    const content = document.querySelector(".class-honor-roll-container");
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

  const handleBack = () => {
    navigate(-1); // Go back to previous page
  };

  return (
    <div className="report-page honor-roll-page">
      <div className="class-honor-roll-container">
        <div className="class-honor-roll-header">
          <div className="class-honor-roll-header-logos">
            <img src="/deped-logo.png" alt="DepEd Logo" className="class-honor-roll-logo" />
          </div>
          <div className="class-honor-roll-header-text">
            <h1>Republic of the Philippines • Department of Education</h1>
            <h2>Region {schoolData.region} • Division of {schoolData.division} • District of {schoolData.district}</h2>
            <h2>{schoolData.schoolName.toUpperCase()}</h2>
            <h3>Dauis - Panglao Rd, Dauis, Bohol</h3>
            <h3>CLASS HONOR ROLL</h3>
          </div>
          <div className="class-honor-roll-header-logos">
            <img src="/lnhs-logo.png" alt="School Logo" className="class-honor-roll-logo" />
          </div>
        </div>

        <div className="class-honor-roll-school-info">
          <div className="class-honor-roll-info-item">
            <span className="class-honor-roll-info-label">School Year:</span>
            <span>{schoolData.schoolYear}</span>
          </div>
          <div className="class-honor-roll-info-item">
            <span className="class-honor-roll-info-label">Quarter:</span>
            <span>{getQuarterLabel(schoolData.quarter)}</span>
          </div>
          <div className="class-honor-roll-info-item">
            <span className="class-honor-roll-info-label">Grade & Section:</span>
            <span>Grade {schoolData.grade} - {schoolData.section}</span>
          </div>
          <div className="class-honor-roll-info-item">
            <span className="class-honor-roll-info-label">Class Adviser:</span>
            <span>{schoolData.adviser}</span>
          </div>
          <div className="class-honor-roll-info-item">
            <span className="class-honor-roll-info-label">Date Generated:</span>
            <span>{new Date().toLocaleDateString()}</span>
          </div>
        </div>

        <div className="class-honor-roll-table-container">
          {loading ? (
            <p>Loading...</p>
          ) : error ? (
            <p style={{ color: 'red' }}>{error}</p>
          ) : (
            <table className="class-honor-roll-table">
              <thead>
                <tr>
                  <th>Rank</th>
                  <th>LRN</th>
                  <th>Name</th>
                  <th>Sex</th>
                  <th>General Average</th>
                  <th>Conduct</th>
                  <th>Attendance</th>
                  <th>Remarks</th>
                </tr>
              </thead>
              <tbody>
                {honorRoll.map((student) => (
                  <tr key={student.lrn}>
                    <td>{student.rank}</td>
                    <td>{student.lrn}</td>
                    <td>{student.name}</td>
                    <td>{student.sex}</td>
                    <td>{student.generalAverage}</td>
                    <td>{student.conduct}</td>
                    <td>{student.attendance}</td>
                    <td>{student.remarks}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div className="class-honor-roll-summary">
          <div className="class-honor-roll-summary-item">
            <span className="class-honor-roll-summary-label">Total Students:</span>
            <span>{honorRoll.length}</span>
          </div>
          <div className="class-honor-roll-summary-item">
            <span className="class-honor-roll-summary-label">Male:</span>
            <span>{honorRoll.filter(student => student.sex === 'M').length}</span>
          </div>
          <div className="class-honor-roll-summary-item">
            <span className="class-honor-roll-summary-label">Female:</span>
            <span>{honorRoll.filter(student => student.sex === 'F').length}</span>
          </div>
        </div>

        <div className="class-honor-roll-footer">
          <div className="signature-section">
            <div className="signature">
              <div className="signatory-name">{adviser || "[Adviser Name]"}</div>
              <div className="signatory-title">TEACHER'S NAME</div>
              <div className="signatory-position">Class Adviser</div>
            </div>
            <div className="signature">
              <div className="signatory-name">{principal || "[Principal Name]"}</div>
              <div className="signatory-title">PRINCIPAL'S NAME</div>
              <div className="signatory-position">School Principal</div>
            </div>
          </div>
          <div className="report-date">
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

export default ClassHonorRoll;
