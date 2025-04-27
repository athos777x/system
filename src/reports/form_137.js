import React, { useEffect, useState } from "react";
import axios from "axios";
import "../CssFiles/form_137.css";
import "../CssFiles/report_buttons.css";
import { jsPDF } from "jspdf";
import { useLocation, useNavigate } from "react-router-dom";

function Form137() {
  const { state } = useLocation();
  const navigate = useNavigate();
  const student = state?.student;
  const [studentDetails, setStudentDetails] = useState(null);
  const [academicRecords, setAcademicRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (student) {
      if (!studentDetails) { // Ensure student details aren't already fetched
        fetchStudentDetails();
      } else if (studentDetails && academicRecords.length === 0) {
        fetchAcademicRecords(studentDetails.student_id);
      }
    } else {
      setError("No student data provided");
      setLoading(false);
    }
  }, [student, studentDetails, academicRecords.length]);
  
  const fetchStudentDetails = async () => {
    try {
      // Extract student name components
      const [lastName, firstName] = student.name.replace(",", "").trim().split(/\s+/);
  
      const response = await axios.get(`http://localhost:3001/api/student/details`, {
        params: { lastName, firstName },
      });
  
      if (response.data.length > 0) {
        setStudentDetails(response.data[0]);
        // After fetching student details, fetch the academic records if they are not already loaded
        if (academicRecords.length === 0) {
          fetchAcademicRecords(response.data[0].student_id);
        }
      } else {
        setError("Student details not found");
      }
    } catch (error) {
      console.error("Error fetching student details:", error);
      setError("Failed to fetch student details");
    }
  };
  
  const fetchAcademicRecords = async (studentId) => {
    try {
      const response = await axios.get("http://localhost:3001/api/form137-data", {
        params: { studentId },
      });
  
      if (response.data && Array.isArray(response.data.schoolYears) && response.data.schoolYears.length > 0) {
        setAcademicRecords(response.data.schoolYears);
      } else {
        setError("No academic records found");
      }
    } catch (error) {
      console.error("Error fetching academic records:", error);
      setError("Failed to fetch academic records");
    } finally {
      setLoading(false);
    }
  };
  
  const handlePrintPDF = () => {
    const doc = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
    });

    doc.html(document.querySelector(".f137-container"), {
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

  if (loading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  return (
    <div className="report-page f137-page">
      <div className="f137-container">
        <div className="f137-header">
          <div className="f137-header-logos">
            <img src="/deped-logo.png" alt="DepEd Logo" className="f137-logo" />
          </div>
          <div className="f137-header-text">
            <h1>Republic of the Philippines • Department of Education</h1>
            <h2>Region VII Central Visayas • Division of Bohol • District of Dauis</h2>
            <h2>LOURDES NATIONAL HIGH SCHOOL</h2>
            <h3>Dauis - Panglao Rd, Dauis, Bohol</h3>
            <h3>PERMANENT RECORD (Form 137)</h3>
          </div>
          <div className="f137-header-logos">
            <img src="/lnhs-logo.png" alt="School Logo" className="f137-logo" />
          </div>
        </div>

        <div className="f137-student-info">
          <div className="f137-info-item">
            <span className="f137-info-label">Name:</span>
            <span>{studentDetails?.stud_name || "N/A"}</span>
          </div>
          <div className="f137-info-item">
            <span className="f137-info-label">LRN:</span>
            <span>{studentDetails?.lrn || "N/A"}</span>
          </div>
          <div className="f137-info-item">
            <span className="f137-info-label">Gender:</span>
            <span>{studentDetails?.gender || "N/A"}</span>
          </div>
          <div className="f137-info-item">
            <span className="f137-info-label">Date of Birth:</span>
            <span>{studentDetails?.birthdate}</span>
          </div>
          <div className="f137-info-item">
            <span className="f137-info-label">Address:</span>
            <span>
              {studentDetails
                ? [studentDetails.home_address, studentDetails.barangay, studentDetails.city_municipality, studentDetails.province]
                    .filter(Boolean) // removes falsy values like undefined, null, ""
                    .join(", ")
                : ""}
            </span>
          </div>

          <div className="f137-info-item">
            <span className="f137-info-label">Parent/Guardian:</span>
            <span>
              {studentDetails
                ? [studentDetails.father_name, studentDetails.mother_name].filter(Boolean).join(" / ")
                : ""}
            </span>
          </div>

        </div>

        <div className="f137-academic-records">
          {academicRecords.map((record, index) => (
            <div key={index} className="f137-school-year-section">
              <div className="f137-school-year-header">
                <div>
                  <span className="f137-info-label">SY:</span>
                  <span>{record.schoolYear}</span>
                </div>
                <div>
                  <span className="f137-info-label">Grade:</span>
                  <span>{record.gradeLevel}</span>
                </div>
              </div>

              <table className="f137-academic-grades-table">
                <thead>
                  <tr>
                    <th style={{width: "30%"}}>Subject</th>
                    <th style={{width: "14%"}}>Q1</th>
                    <th style={{width: "14%"}}>Q2</th>
                    <th style={{width: "14%"}}>Q3</th>
                    <th style={{width: "14%"}}>Q4</th>
                    <th style={{width: "14%"}}>Final</th>
                  </tr>
                </thead>
                <tbody>
                  {record.grades.map((subject, subIndex) => (
                    <tr key={subIndex}>
                      <td className="f137-subject-name">{subject.subject_name}</td>
                      <td>{subject.q1}</td>
                      <td>{subject.q2}</td>
                      <td>{subject.q3}</td>
                      <td>{subject.q4}</td>
                      <td className="f137-final-grade">{subject.final}</td>
                    </tr>
                  ))}
                  <tr>
                    <td colSpan="5"><strong>General Average</strong></td>
                    <td><strong>{record.grades.reduce((acc, subject) => acc + subject.final, 0) / record.grades.length || 0.00}</strong></td>
                  </tr>
                </tbody>
              </table>

              <div style={{display: "flex", justifyContent: "space-between", alignItems: "center"}}>
                <div className="f137-attendance-section" style={{width: "70%"}}>
                  <table className="f137-student-attendance-table">
                    <thead>
                      <tr>
                        <th>Days Present</th>
                        <th>Days Absent</th>
                        <th>Total Days</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td>{record.attendance.present}</td>
                        <td>{record.attendance.absent}</td>
                        <td>{record.attendance.days}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="f137-certification-section">
          <p>
            I hereby certify that this is a true record of {studentDetails?.stud_name || "[Student Name]"}.
            This certification is issued for whatever legal purpose it may serve.
          </p>
        </div>

        <div className="f137-signature-section">
          <div className="f137-signature-box">
            <div className="f137-signature-line"></div>
            <p>Class Adviser</p>
          </div>
          <div className="f137-signature-box">
            <div className="f137-signature-line"></div>
            <p>Principal</p>
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

export default Form137;
