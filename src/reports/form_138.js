import React, { useEffect, useState } from "react";
import axios from "axios";
import "../CssFiles/form_138.css";
import { jsPDF } from "jspdf";
import { useLocation, useNavigate } from "react-router-dom";

function Form138() {
  const { state } = useLocation();
  const navigate = useNavigate();
  const student = state?.student;
  const [studentDetails, setStudentDetails] = useState(null);
  const [currentGrades, setCurrentGrades] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentSchoolYear, setCurrentSchoolYear] = useState("");

  useEffect(() => {
    if (student) {
      fetchStudentDetails();
      fetchCurrentGrades();
      fetchCurrentSchoolYear();
    } else {
      setError("No student data provided");
      setLoading(false);
    }
  }, [student]);

  const fetchStudentDetails = async () => {
    try {
      // Extract student name components
      const [lastName, firstName] = student.name.replace(",", "").trim().split(/\s+/);

      const response = await axios.get(`http://localhost:3001/api/student/details`, {
        params: { lastName, firstName },
      });

      if (response.data.length > 0) {
        setStudentDetails(response.data[0]);
      } else {
        setError("Student details not found");
      }
    } catch (error) {
      console.error("Error fetching student details:", error);
      setError("Failed to fetch student details");
    }
  };

  const fetchCurrentSchoolYear = async () => {
    try {
      // In a real implementation, you would fetch the current school year from your API
      // const response = await axios.get('http://localhost:3001/school-years');
      // setCurrentSchoolYear(response.data[0]?.school_year || "");
      
      // For now, we'll use a mock value
      setCurrentSchoolYear("2023-2024");
    } catch (error) {
      console.error("Error fetching current school year:", error);
    }
  };

  const fetchCurrentGrades = async () => {
    try {
      // This would be replaced with your actual API endpoint for fetching current grades
      // For now, we'll create mock data
      const mockCurrentGrades = {
        schoolYear: "2023-2024",
        gradeLevel: "9",
        section: "Rizal",
        schoolName: "Lourdes National High School",
        schoolAddress: "Dauis - Panglao Rd, Dauis, Bohol",
        subjects: [
          { name: "Filipino", q1: "87", q2: "89", q3: "91", q4: "93", final: "90" },
          { name: "English", q1: "92", q2: "94", q3: "96", q4: "98", final: "95" },
          { name: "Mathematics", q1: "86", q2: "88", q3: "90", q4: "92", final: "89" },
          { name: "Science", q1: "88", q2: "90", q3: "92", q4: "94", final: "91" },
          { name: "Araling Panlipunan", q1: "90", q2: "92", q3: "94", q4: "96", final: "93" },
          { name: "MAPEH", q1: "94", q2: "96", q3: "98", q4: "100", final: "97" },
          { name: "TLE", q1: "92", q2: "94", q3: "96", q4: "98", final: "95" },
          { name: "Values Education", q1: "96", q2: "98", q3: "100", q4: "100", final: "99" }
        ],
        attendance: {
          daysPresent: 190,
          daysAbsent: 0,
          totalDays: 190
        },
        generalAverage: "94",
        remarks: "Promoted"
      };

      // In a real implementation, you would fetch this data from your API
      // const response = await axios.get(`http://localhost:3001/api/current-grades/${student.student_id}`);
      // setCurrentGrades(response.data);

      setCurrentGrades(mockCurrentGrades);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching current grades:", error);
      setError("Failed to fetch current grades");
      setLoading(false);
    }
  };

  const handleConvertToPdf = () => {
    const doc = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
    });

    const button = document.querySelector(".f138-button-container");
    if (button) button.style.display = "none";

    doc.html(document.querySelector(".f138-container"), {
      callback: function (doc) {
        window.open(doc.output("bloburl"), "_blank");
        if (button) button.style.display = "flex";
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
    <div>
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
            <span>{studentDetails?.stud_name || "N/A"}</span>
          </div>
          <div className="f138-info-item">
            <span className="f138-info-label">LRN:</span>
            <span>{studentDetails?.student_id || "N/A"}</span>
          </div>
          <div className="f138-info-item">
            <span className="f138-info-label">Grade & Section:</span>
            <span>{currentGrades?.gradeLevel || "N/A"} - {currentGrades?.section || "N/A"}</span>
          </div>
          <div className="f138-info-item">
            <span className="f138-info-label">School Year:</span>
            <span>{currentGrades?.schoolYear || currentSchoolYear || "N/A"}</span>
          </div>
          <div className="f138-info-item">
            <span className="f138-info-label">Age:</span>
            <span>{studentDetails?.age || "N/A"}</span>
          </div>
          <div className="f138-info-item">
            <span className="f138-info-label">Gender:</span>
            <span>{studentDetails?.gender || "N/A"}</span>
          </div>
        </div>

        <div className="f138-grades-section">
          <h3>Academic Performance</h3>
          <table className="f138-academic-grades-table">
            <thead>
              <tr>
                <th style={{width: "30%"}}>Subject</th>
                <th style={{width: "12%"}}>Q1</th>
                <th style={{width: "12%"}}>Q2</th>
                <th style={{width: "12%"}}>Q3</th>
                <th style={{width: "12%"}}>Q4</th>
                <th style={{width: "12%"}}>Final</th>
                <th style={{width: "10%"}}>Remarks</th>
              </tr>
            </thead>
            <tbody>
              {currentGrades?.subjects.map((subject, index) => (
                <tr key={index}>
                  <td className="f138-subject-name">{subject.name}</td>
                  <td>{subject.q1}</td>
                  <td>{subject.q2}</td>
                  <td>{subject.q3}</td>
                  <td>{subject.q4}</td>
                  <td className="f138-final-grade">{subject.final}</td>
                  <td>{parseInt(subject.final) >= 75 ? "Passed" : "Failed"}</td>
                </tr>
              ))}
              <tr>
                <td colSpan="5" className="f138-subject-name">General Average</td>
                <td className="f138-final-grade">{currentGrades?.generalAverage || "N/A"}</td>
                <td>{parseInt(currentGrades?.generalAverage || 0) >= 75 ? "Passed" : "Failed"}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="f138-attendance-section">
          <table className="f138-student-attendance-table">
            <thead>
              <tr>
                <th colSpan="13">Attendance Record</th>
              </tr>
              <tr>
                <th>Month</th>
                <th>Jun</th>
                <th>Jul</th>
                <th>Aug</th>
                <th>Sep</th>
                <th>Oct</th>
                <th>Nov</th>
                <th>Dec</th>
                <th>Jan</th>
                <th>Feb</th>
                <th>Mar</th>
                <th>Apr</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Present</td>
                <td>20</td>
                <td>20</td>
                <td>18</td>
                <td>20</td>
                <td>18</td>
                <td>19</td>
                <td>15</td>
                <td>18</td>
                <td>18</td>
                <td>20</td>
                <td>4</td>
                <td>{currentGrades?.attendance.daysPresent || "N/A"}</td>
              </tr>
              <tr>
                <td>Absent</td>
                <td>0</td>
                <td>0</td>
                <td>0</td>
                <td>0</td>
                <td>0</td>
                <td>0</td>
                <td>0</td>
                <td>0</td>
                <td>0</td>
                <td>0</td>
                <td>0</td>
                <td>{currentGrades?.attendance.daysAbsent || "N/A"}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="f138-promotion-section">
          <h3>Promotion Status</h3>
          <p>
            <strong>Remarks:</strong> {currentGrades?.remarks || "N/A"}
          </p>
        </div>

        <div className="f138-signature-section">
          <div className="f138-signature-box">
            <div className="f138-signature-line"></div>
            <p>Class Adviser</p>
          </div>
          <div className="f138-signature-box">
            <div className="f138-signature-line"></div>
            <p>School Principal</p>
          </div>
        </div>
      </div>

      <div className="f138-button-container">
        <button onClick={handleBack}>Back</button>
        <button onClick={handleConvertToPdf}>Print</button>
      </div>
    </div>
  );
}

export default Form138;
