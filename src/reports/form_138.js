import React, { useEffect, useState } from "react";
import axios from "axios";
import "../CssFiles/form_138.css"; // Make sure the CSS path is correct
import "../CssFiles/report_buttons.css";
import { jsPDF } from "jspdf";
import { useLocation, useNavigate } from "react-router-dom";

function Form138() {
  const { state } = useLocation();
  const navigate = useNavigate();
  const student = state?.student; // Student data passed from the previous page
  const [studentData, setStudentData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [adviser, setAdviser] = useState("");
  const [principal, setPrincipal] = useState("");

  // Fetch data when the component mounts
  useEffect(() => {
    if (student) {
      fetchStudentData();
      fetchAdviser({
        student_id: student.student_id,
        grade_level: student.grade_level,
        section_id: student.section,
      });
      fetchPrincipal();
    } else {
      setError("No student data provided");
      setLoading(false);
    }
  }, [student]);
  

  const fetchStudentData = async () => {
    try {
      const { school_year_id, grade_level, section, student_last_name, studentId } = student;

      const response = await axios.get("http://localhost:3001/api/student-grades", {
        params: {
          school_year_id,
          grade: grade_level,
          section,
          studentName: student_last_name,
          student_id: studentId
        },
      });

      setStudentData(response.data); // Set the response data to state
      setLoading(false);
    } catch (err) {
      console.error("Error fetching student data:", err);
      setError("Failed to fetch student report data");
      setLoading(false);
    }
  };

  const fetchAdviser = async ({ student_id, grade_level, section_id }) => {
    try {
      const response = await axios.get("http://localhost:3001/api/enrollment/adviser-info", {
        params: { student_id, grade_level, section_id },
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
      format: "a4",
    });

    doc.html(document.querySelector(".f138-container"), {
      callback: function (doc) {
        window.open(doc.output("bloburl"), "_blank");
      },
      x: 10,
      y: 10,
      width: 180,
      windowWidth: 1000,
    });
  };

  const handleBack = () => {
    navigate(-1); // Go back to previous page
  };

  // Loading, Error, or No Data states
  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;
  if (!studentData) return <div>No data available.</div>;

  const { studentInfo, grades, attendance } = studentData;
  const {
    stud_name,
    gender,
    age,
    lrn,
    school_year_name,
    student_id,
    section_name
  } = studentInfo;

  // Calculate the general average
  const getGeneralAverage = () => {
    const totalFinalGrades = grades.reduce((sum, subject) => sum + subject.final, 0);
    return totalFinalGrades / grades.length;
  };

  const generalAverage = getGeneralAverage();

  return (
    <div className="report-page f138-page">
      <div className="f138-container">
        <div className="f138-header">
          <div className="f138-header-logos">
            <img src="/deped-logo.png" alt="DepEd Logo" className="f138-logo" />
          </div>
          <div className="f138-header-text">
            <h1>Republic of the Philippines • Department of Education</h1>
            <h2>Region VII Central Visayas • Division of Bohol • District of Dauis</h2>
            <h2>LOURDES NATIONAL HIGH SCHOOL</h2>
            <h3>Dauis - Panglao Rd, Dauis, Bohol</h3>
            <h3>REPORT CARD (Form 138)</h3>
          </div>
          <div className="f138-header-logos">
            <img src="/lnhs-logo.png" alt="School Logo" className="f138-logo" />
          </div>
        </div>

        <div className="f138-student-info">
          <div className="f138-info-item">
            <span className="f138-info-label">Name:</span>
            <span>{stud_name}</span>
          </div>
          <div className="f138-info-item">
            <span className="f138-info-label">LRN:</span>
            <span>{lrn}</span>
          </div>
          <div className="f138-info-item">
            <span className="f138-info-label">Grade & Section:</span>
            <span>{student.grade_level} - {section_name}</span>
          </div>
          <div className="f138-info-item">
            <span className="f138-info-label">School Year:</span>
            <span>{school_year_name}</span>
          </div>
          <div className="f138-info-item">
            <span className="f138-info-label">Age:</span>
            <span>{age}</span>
          </div>
          <div className="f138-info-item">
            <span className="f138-info-label">Gender:</span>
            <span>{gender}</span>
          </div>
        </div>

        {/* Grades Table */}
        <div className="f138-grades-section">
          <h3>Academic Performance</h3>
          <table className="f138-academic-grades-table">
            <thead>
              <tr>
                <th style={{ width: "30%" }}>Subject</th>
                <th style={{ width: "12%" }}>Q1</th>
                <th style={{ width: "12%" }}>Q2</th>
                <th style={{ width: "12%" }}>Q3</th>
                <th style={{ width: "12%" }}>Q4</th>
                <th style={{ width: "12%" }}>Final</th>
              </tr>
            </thead>
            <tbody>
              {grades.length === 0 ? (
                <tr>
                  <td colSpan="7" className="no-data">No subjects available.</td>
                </tr>
              ) : (
                grades.map((subject, index) => (
                  <tr key={index}>
                    <td>{subject.subject_name}</td>
                    <td>{subject.q1}</td>
                    <td>{subject.q2}</td>
                    <td>{subject.q3}</td>
                    <td>{subject.q4}</td>
                    <td>{subject.final}</td>
                  </tr>
                ))
              )}
              {/* General Average row */}
              <tr>
                <td colSpan="5" style={{ textAlign: "right", fontWeight: "bold" }}>General Average:</td>
                <td colSpan="2" style={{ fontWeight: "bold" }}>{generalAverage.toFixed(2)}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Attendance Table */}
        <div className="f138-attendance-section">
          <h3>Attendance Record</h3>
          <table className="f138-student-attendance-table">
            <thead>
              <tr>
                <th>Month</th>
                {attendance.map((month) => (
                  <th key={month.month}>{month.month}</th> // Dynamically generate column headers
                ))}
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              {attendance.length === 0 ? (
                <tr>
                  <td colSpan={attendance.length + 1} className="no-data">
                    No attendance data available.
                  </td>
                </tr>
              ) : (
                <>
                  {/* Present Row */}
                  <tr>
                    <td>Present</td>
                    {attendance.map((month) => (
                      <td key={month.month}>{month.present_count}</td> // Dynamically generate the attendance data
                    ))}
                    <td>
                      {attendance.reduce((sum, month) => sum + month.present_count, 0)}
                    </td> {/* Total present count */}
                  </tr>

                  {/* Absent Row */}
                  <tr>
                    <td>Absent</td>
                    {attendance.map((month) => (
                      <td key={month.month}>{month.absent_count}</td> // Dynamically generate the attendance data
                    ))}
                    <td>
                      {attendance.reduce((sum, month) => sum + month.absent_count, 0)}
                    </td> {/* Total absent count */}
                  </tr>
                </>
              )}
            </tbody>
          </table>
        </div>

        <div className="f138-promotion-section">
          <h3>Promotion Status</h3>
          <p>
            <strong>Remarks:</strong>
            {generalAverage > 75 ? "Promoted" : "Retained"}
          </p>
        </div>

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
      </div>
      
      <div className="report-buttons">
        <button onClick={handleBack} className="report-back-btn">Back</button>
        <button onClick={handlePrintPDF} className="report-print-btn">Print PDF</button>
      </div>
    </div>
  );
}

export default Form138;
