import React, { useEffect, useState } from "react";
import axios from "axios";
import "../CssFiles/form_137.css";
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
      fetchStudentDetails();
      fetchAcademicRecords();
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

  const fetchAcademicRecords = async () => {
    try {
      // This would be replaced with your actual API endpoint for fetching academic records
      // For now, we'll create mock data
      const mockAcademicRecords = [
        {
          schoolYear: "2020-2021",
          gradeLevel: "7",
          schoolName: "Lourdes National High School",
          schoolAddress: "Dauis - Panglao Rd, Dauis, Bohol",
          subjects: [
            { name: "Filipino", q1: "85", q2: "87", q3: "88", q4: "90", final: "88" },
            { name: "English", q1: "88", q2: "90", q3: "92", q4: "94", final: "91" },
            { name: "Mathematics", q1: "82", q2: "84", q3: "86", q4: "88", final: "85" },
            { name: "Science", q1: "84", q2: "86", q3: "88", q4: "90", final: "87" },
            { name: "Araling Panlipunan", q1: "86", q2: "88", q3: "90", q4: "92", final: "89" },
            { name: "MAPEH", q1: "90", q2: "92", q3: "94", q4: "96", final: "93" },
            { name: "TLE", q1: "88", q2: "90", q3: "92", q4: "94", final: "91" },
            { name: "Values Education", q1: "92", q2: "94", q3: "96", q4: "98", final: "95" }
          ],
          attendance: {
            daysPresent: 180,
            daysAbsent: 10,
            totalDays: 190
          },
          generalAverage: "90",
          remarks: "Promoted"
        },
        {
          schoolYear: "2021-2022",
          gradeLevel: "8",
          schoolName: "Lourdes National High School",
          schoolAddress: "Dauis - Panglao Rd, Dauis, Bohol",
          subjects: [
            { name: "Filipino", q1: "86", q2: "88", q3: "90", q4: "92", final: "89" },
            { name: "English", q1: "90", q2: "92", q3: "94", q4: "96", final: "93" },
            { name: "Mathematics", q1: "84", q2: "86", q3: "88", q4: "90", final: "87" },
            { name: "Science", q1: "86", q2: "88", q3: "90", q4: "92", final: "89" },
            { name: "Araling Panlipunan", q1: "88", q2: "90", q3: "92", q4: "94", final: "91" },
            { name: "MAPEH", q1: "92", q2: "94", q3: "96", q4: "98", final: "95" },
            { name: "TLE", q1: "90", q2: "92", q3: "94", q4: "96", final: "93" },
            { name: "Values Education", q1: "94", q2: "96", q3: "98", q4: "100", final: "97" }
          ],
          attendance: {
            daysPresent: 185,
            daysAbsent: 5,
            totalDays: 190
          },
          generalAverage: "92",
          remarks: "Promoted"
        },
        {
          schoolYear: "2022-2023",
          gradeLevel: "9",
          schoolName: "Lourdes National High School",
          schoolAddress: "Dauis - Panglao Rd, Dauis, Bohol",
          subjects: [
            { name: "Filipino", q1: "87", q2: "89", q3: "91", q4: "93", final: "90" },
            { name: "English", q1: "91", q2: "93", q3: "95", q4: "97", final: "94" },
            { name: "Mathematics", q1: "85", q2: "87", q3: "89", q4: "91", final: "88" },
            { name: "Science", q1: "87", q2: "89", q3: "91", q4: "93", final: "90" },
            { name: "Araling Panlipunan", q1: "89", q2: "91", q3: "93", q4: "95", final: "92" },
            { name: "MAPEH", q1: "93", q2: "95", q3: "97", q4: "99", final: "96" },
            { name: "TLE", q1: "91", q2: "93", q3: "95", q4: "97", final: "94" },
            { name: "Values Education", q1: "95", q2: "97", q3: "99", q4: "100", final: "98" }
          ],
          attendance: {
            daysPresent: 182,
            daysAbsent: 8,
            totalDays: 190
          },
          generalAverage: "93",
          remarks: "Promoted"
        },
        {
          schoolYear: "2023-2024",
          gradeLevel: "10",
          schoolName: "Lourdes National High School",
          schoolAddress: "Dauis - Panglao Rd, Dauis, Bohol",
          subjects: [
            { name: "Filipino", q1: "88", q2: "90", q3: "92", q4: "94", final: "91" },
            { name: "English", q1: "92", q2: "94", q3: "96", q4: "98", final: "95" },
            { name: "Mathematics", q1: "86", q2: "88", q3: "90", q4: "92", final: "89" },
            { name: "Science", q1: "88", q2: "90", q3: "92", q4: "94", final: "91" },
            { name: "Araling Panlipunan", q1: "90", q2: "92", q3: "94", q4: "96", final: "93" },
            { name: "MAPEH", q1: "94", q2: "96", q3: "98", q4: "100", final: "97" },
            { name: "TLE", q1: "92", q2: "94", q3: "96", q4: "98", final: "95" },
            { name: "Values Education", q1: "96", q2: "98", q3: "100", q4: "100", final: "99" }
          ],
          attendance: {
            daysPresent: 186,
            daysAbsent: 4,
            totalDays: 190
          },
          generalAverage: "94",
          remarks: "Graduated"
        }
      ];

      // In a real implementation, you would fetch this data from your API
      // const response = await axios.get(`http://localhost:3001/api/academic-records/${student.student_id}`);
      // setAcademicRecords(response.data);

      setAcademicRecords(mockAcademicRecords);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching academic records:", error);
      setError("Failed to fetch academic records");
      setLoading(false);
    }
  };

  const handleConvertToPdf = () => {
    const doc = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
    });

    const button = document.querySelector(".button-container");
    if (button) button.style.display = "none";

    doc.html(document.querySelector(".form-137-container"), {
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
      <div className="form-137-container">
        <div className="form-header">
          <div className="form-header-logos">
            <img src="/deped-logo.png" alt="DepEd Logo" className="logo" />
          </div>
          <div className="form-header-text">
            <h1>Republic of the Philippines • Department of Education</h1>
            <h2>Region VII Central Visayas • Division of Bohol • District of Dauis</h2>
            <h2>LOURDES NATIONAL HIGH SCHOOL</h2>
            <h3>Dauis - Panglao Rd, Dauis, Bohol</h3>
            <h3>PERMANENT RECORD (Form 137)</h3>
          </div>
          <div className="form-header-logos">
            <img src="/lnhs-logo.png" alt="School Logo" className="logo" />
          </div>
        </div>

        <div className="student-info">
          <div className="info-item">
            <span className="info-label">Name:</span>
            <span>{studentDetails?.stud_name || "N/A"}</span>
          </div>
          <div className="info-item">
            <span className="info-label">LRN:</span>
            <span>{studentDetails?.student_id || "N/A"}</span>
          </div>
          <div className="info-item">
            <span className="info-label">Gender:</span>
            <span>{studentDetails?.gender || "N/A"}</span>
          </div>
          <div className="info-item">
            <span className="info-label">Date of Birth:</span>
            <span>{studentDetails?.birthdate ? new Date(studentDetails.birthdate).toLocaleDateString() : "N/A"}</span>
          </div>
          <div className="info-item">
            <span className="info-label">Address:</span>
            <span>
              {studentDetails ? 
                `${studentDetails.home_address || ""}, ${studentDetails.barangay || ""}, ${studentDetails.city_municipality || ""}` 
                : "N/A"}
            </span>
          </div>
          <div className="info-item">
            <span className="info-label">Parent/Guardian:</span>
            <span>
              {studentDetails ? 
                `${studentDetails.father_name || "N/A"} / ${studentDetails.mother_name || "N/A"}` 
                : "N/A"}
            </span>
          </div>
        </div>

        <div className="academic-records">
          {academicRecords.map((record, index) => (
            <div key={index} className="school-year-section">
              <div className="school-year-header">
                <div>
                  <span className="info-label">SY:</span>
                  <span>{record.schoolYear}</span>
                </div>
                <div>
                  <span className="info-label">Grade:</span>
                  <span>{record.gradeLevel}</span>
                </div>
                <div>
                  <span className="info-label">School:</span>
                  <span>{record.schoolName}</span>
                </div>
              </div>

              <table className="academic-grades-table">
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
                  {record.subjects.map((subject, subIndex) => (
                    <tr key={subIndex}>
                      <td className="subject-name">{subject.name}</td>
                      <td>{subject.q1}</td>
                      <td>{subject.q2}</td>
                      <td>{subject.q3}</td>
                      <td>{subject.q4}</td>
                      <td className="final-grade">{subject.final}</td>
                    </tr>
                  ))}
                  <tr>
                    <td colSpan="5"><strong>General Average</strong></td>
                    <td><strong>{record.generalAverage}</strong></td>
                  </tr>
                </tbody>
              </table>

              <div className="attendance-section">
                <table className="student-attendance-table">
                  <thead>
                    <tr>
                      <th colSpan="3">Attendance Record</th>
                    </tr>
                    <tr>
                      <th>Days Present</th>
                      <th>Days Absent</th>
                      <th>Total School Days</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>{record.attendance.daysPresent}</td>
                      <td>{record.attendance.daysAbsent}</td>
                      <td>{record.attendance.totalDays}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div className="summary-section">
                <div className="info-item">
                  <span className="info-label">Remarks:</span>
                  <span>{record.remarks}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="certification-section">
          <p>
            I hereby certify that this is a true record of {studentDetails?.stud_name || "[Student Name]"}.
            This certification is issued for whatever legal purpose it may serve.
          </p>
        </div>

        <div className="signature-section">
          <div className="signature-box">
            <div className="signature-line"></div>
            <p>Class Adviser</p>
          </div>
          <div className="signature-box">
            <div className="signature-line"></div>
            <p>School Principal</p>
          </div>
        </div>
      </div>

      <div className="button-container">
        <button onClick={handleBack}>Back</button>
        <button onClick={handleConvertToPdf}>Print</button>
      </div>
    </div>
  );
}

export default Form137;
