import { useLocation, useNavigate } from 'react-router-dom';
import React, { useState, useEffect } from 'react';
import { jsPDF } from 'jspdf';
import axios from 'axios';
import '../CssFiles/early_enrollment.css';
import "../CssFiles/report_buttons.css";

function EarlyEnrollment() {
  const location = useLocation();
  const navigate = useNavigate();
  const { schoolYear, grade, section } = location.state || {};

  const [schoolData, setSchoolData] = useState({
    schoolName: "Lourdes National High School",
    schoolId: "123456",
    district: "Dauis",
    division: "Bohol",
    region: "VII",
    schoolYear: "2023-2024"
  });

  const [enrollmentData, setEnrollmentData] = useState({
    grades: {},
    totalMale: 0,
    totalFemale: 0,
    grandTotal: 0,
    enrollmentPeriod: "Early Enrollment",
    enrollmentDates: ""
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [registrar, setRegistrar] = useState("");
  const [principal, setPrincipal] = useState("");


  useEffect(() => {
    if (schoolYear && grade && section) {
      fetchEnrollmentData(schoolYear, grade, section);
    }
    fetchRegistrar();
    fetchPrincipal();
  }, [schoolYear, grade, section]);

  const fetchEnrollmentData = async (schoolYear, grade, section) => {
    setLoading(true);
    try {
      const response = await axios.get('http://localhost:3001/api/student-stats', {
        params: {
          school_year_id: schoolYear, // Use dynamic school year ID
          section_id: section,        // Use dynamic section ID
          grade_level: grade          // Use dynamic grade level
        }
      });
  
      const data = response.data;
      
      let totalMale = 0;
      let totalFemale = 0;
      let grandTotal = 0;
  
      const grades = data.student_statistics.reduce((acc, gradeData) => {
        const gradeLevel = gradeData.LEVEL;
        const maleCount = gradeData.male_count;
        const femaleCount = gradeData.female_count;
        const totalStudents = gradeData.total_students;
  
        // Update totals
        totalMale += maleCount;
        totalFemale += femaleCount;
        grandTotal += totalStudents;
  
        acc[gradeLevel] = {
          male: maleCount,
          female: femaleCount,
          total: totalStudents
        };
        return acc;
      }, {});
  
      setEnrollmentData({
        grades: grades,
        totalMale: totalMale,
        totalFemale: totalFemale,
        grandTotal: grandTotal,
        enrollmentPeriod: "Early Enrollment",
        enrollmentDates: data.school_year_info.enrollment_dates || "",
        schoolYearName: data.school_year_info.school_year_name
      });
  
      setLoading(false);
    } catch (error) {
      console.error("Error fetching early enrollment data:", error);
      setError("Failed to fetch early enrollment data");
      setLoading(false);
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

  const fetchRegistrar = async () => {
    try {
      const response = await axios.get("http://localhost:3001/api/enrollment/registrar");
  
      if (response.data && response.data.registrar) {
        setRegistrar(response.data.registrar);
      }
    } catch (err) {
      console.error("Error fetching registrar:", err);
    }
  };

  const handlePrintPDF = () => {
    const doc = new jsPDF({
      orientation: "landscape",
      unit: "mm",
      format: "a4"
    });

    const content = document.querySelector(".early-enrollment-container");
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
    <div className="report-page early-enrollment-page">
      <div className="early-enrollment-container">
        <div className="early-enrollment-header">
          <div className="early-enrollment-header-logos">
            <img src="/deped-logo.png" alt="DepEd Logo" className="early-enrollment-logo" />
          </div>
          <div className="early-enrollment-header-text">
            <h1>Republic of the Philippines • Department of Education</h1>
            <h2>Region VII Central Visayas • Division of Bohol • District of Dauis</h2>
            <h2>LOURDES NATIONAL HIGH SCHOOL</h2>
            <h3>Dauis - Panglao Rd, Dauis, Bohol</h3>
            <h3>EARLY ENROLLMENT REPORT</h3>
          </div>
          <div className="early-enrollment-header-logos">
            <img src="/lnhs-logo.png" alt="School Logo" className="early-enrollment-logo" />
          </div>
        </div>

        <div className="early-enrollment-school-info">
          <div className="early-enrollment-info-item">
            <span className="early-enrollment-info-label">School Year:</span>
            <span>{enrollmentData.schoolYearName}</span>
          </div>
          <div className="early-enrollment-info-item">
            <span className="early-enrollment-info-label">Enrollment Period:</span>
            <span>{enrollmentData.enrollmentPeriod}</span>
          </div>
          <div className="early-enrollment-info-item">
            <span className="early-enrollment-info-label">Enrollment Dates:</span>
            <span>{enrollmentData.enrollmentDates}</span>
          </div>
          <div className="early-enrollment-info-item">
            <span className="early-enrollment-info-label">Date Generated:</span>
            <span>{new Date().toLocaleDateString()}</span>
          </div>
        </div>

        <div className="early-enrollment-table-container">
          <table className="early-enrollment-table">
            <thead>
              <tr>
                <th>Grade Level</th>
                <th>Male</th>
                <th>Female</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(enrollmentData.grades).map(([grade, data]) => (
                <tr key={grade}>
                  <td>{grade}</td>
                  <td>{data.male}</td>
                  <td>{data.female}</td>
                  <td>{data.total}</td>
                </tr>
              ))}
              <tr className="early-enrollment-total-row">
                <td><strong>TOTAL</strong></td>
                <td><strong>{enrollmentData.totalMale}</strong></td>
                <td><strong>{enrollmentData.totalFemale}</strong></td>
                <td><strong>{enrollmentData.grandTotal}</strong></td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="early-enrollment-summary">
          <div className="early-enrollment-summary-item">
            <span className="early-enrollment-summary-label">Total Male Enrollees:</span>
            <span>{enrollmentData.totalMale}</span>
          </div>
          <div className="early-enrollment-summary-item">
            <span className="early-enrollment-summary-label">Total Female Enrollees:</span>
            <span>{enrollmentData.totalFemale}</span>
          </div>
          <div className="early-enrollment-summary-item">
            <span className="early-enrollment-summary-label">Grand Total:</span>
            <span>{enrollmentData.grandTotal}</span>
          </div>
        </div>

        <div className="early-enrollment-footer">
          <div className="signature-section">
            <div className="signature">
              <div className="signatory-name">{registrar || "[Registrar Name]"}</div>
              <div className="signatory-title">REGISTRAR'S NAME</div>
              <div className="signatory-position">School Registrar</div>
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

export default EarlyEnrollment;
