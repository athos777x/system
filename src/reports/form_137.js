import React, { useState, useEffect } from "react";
import axios from "axios"; // Import axios
import "../CssFiles/form_137.css";
import { jsPDF } from "jspdf"; // Import jsPDF
import { useLocation } from "react-router-dom"; // Import useLocation to access passed data

function Form137() {
  const { state } = useLocation(); // Access passed data
  const { student } = state || {}; // Destructure student data
  const [studentDetails, setStudentDetails] = useState([]); // State for student details
  const [academicRecords, setAcademicRecords] = useState([]);
  const [attendance, setAttendance] = useState({});
  const [values, setValues] = useState([]);
  const [subjects, setSubjects] = useState([]); // State for subjects
  const [loading, setLoading] = useState(true);

  const date = new Date().toLocaleDateString();

  // Fetch student details using the student's name or other unique identifiers
  const fetchStudentDetails = async () => {
    if (student) {
      // Remove commas and extra spaces, then split the name
      const [lastName, firstName] = student.name.replace(',', '').trim().split(/\s+/); 
      
      try {
        const response = await axios.get(`http://localhost:3001/api/student/details`, {
          params: { lastName, firstName },
        });
  
        if (response.data.length > 0) {
          setStudentDetails(response.data[0]);
        } else {
          setStudentDetails(null);
        }
      } catch (error) {
        console.error("Error fetching student details:", error);
      } finally {
        setLoading(false);
      }
    }
  };
  
  // Fetch subjects based on the student ID
  const fetchSubjects = async () => {
    if (studentDetails?.student_id) {
      try {
        const response = await axios.get(`http://localhost:3001/api/subjects-card`, {
          params: { studentId: studentDetails.student_id },
        });
  
        if (response.data) {
          setSubjects(response.data);
        } else {
          setSubjects([]);
        }
      } catch (error) {
        console.error("Error fetching subjects:", error);
      }
    }
  };
  
  

  // Fetch academic records
  const fetchAcademicRecords = async () => {
    if (student) {
      try {
        const response = await axios.get(`/api/academic-records`, {
          params: { studentId: student.id },
        });
        setAcademicRecords(response.data);
      } catch (error) {
        console.error("Error fetching academic records:", error);
      }
    }
  };

  // Fetch attendance data
  const fetchAttendance = async () => {
    if (student) {
      try {
        const response = await axios.get(`/api/attendance`, {
          params: { studentId: student.id },
        });
        setAttendance(response.data);
      } catch (error) {
        console.error("Error fetching attendance:", error);
      }
    }
  };

  // Fetch values data
  const fetchValues = async () => {
    if (student) {
      try {
        const response = await axios.get(`/api/values`, {
          params: { studentId: student.id },
        });
        setValues(response.data);
      } catch (error) {
        console.error("Error fetching values:", error);
      }
    }
  };

  useEffect(() => {
    if (student) {
      fetchStudentDetails();
    }
  }, [student]);
  
  useEffect(() => {
    if (studentDetails?.student_id) {
      fetchSubjects();
      fetchAcademicRecords();
      fetchAttendance();
      fetchValues();
    }
  }, [studentDetails]);
  

  
  // Function to generate and open PDF in a new tab
  const handleConvertToPdf = () => {
    const doc = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4", // Set A4 format
    });

    // Ensure proper scaling and margins for A4
    const pdfOptions = {
      callback: function (doc) {
        window.open(doc.output("bloburl"), "_blank"); // Open PDF in a new tab
      },
      x: 10,
      y: 10,
      width: 190, // Content width for A4 (210mm - margins)
      windowWidth: 800, // Ensure proper rendering width
      scale: 0.9, // Adjust scale to fit the page
    };

    // Hide the "Convert to PDF" button during PDF generation
    const button = document.querySelector(".convert-to-pdf");
    if (button) button.style.display = "none";

    // Generate PDF from the HTML container
    doc.html(document.querySelector(".form-137-container"), pdfOptions);

    // Restore the button visibility after generation
    if (button) button.style.display = "block";
  };

  // Function to handle back navigation
  const handleBack = () => {
    window.location.href = 'http://localhost:3000/summary-report-promotion'; // Navigate to the specified URL
  };

  return (
    <div>
      <div className="form-137-container">
        <div className="form-137">
          <header className="form-header">
            <div className="school-logo">
              <img src="/lnhs-logo.png" alt="School Logo" className="login-logo" />
            </div>
            <div className="school-details">
              <h2>{student?.schoolName || "Lourdes National High School"}</h2>
              <p>{student?.schoolAddress || "Dauis - Panglao Rd, Dauis, 6340 Bohol"}</p>
              <h3>PROGRESS REPORT CARD</h3>
              <p>{student?.level || "High School"}</p>
            </div>
          </header>

          <div className="student-info">
            <table className="info-table">
              <tbody>
                <tr>
                  <td><strong>Name:</strong> {studentDetails?.stud_name || "__________"}</td>
                  <td><strong>Grade & Section:</strong> {studentDetails?.grade_section || "________"}</td>
                </tr>
                <tr>
                  <td><strong>Age:</strong> {studentDetails?.age || "___"}</td>
                  <td><strong>School Year:</strong> {studentDetails?.school_year || "____"}</td>
                </tr>
                <tr>
                  <td><strong>Gender:</strong> {studentDetails?.gender || "_____"}</td>
                  <td><strong>LRN:</strong> {studentDetails?.lrn || "_____"}</td>
                </tr>
              </tbody>
            </table>
          </div>


          {/* Render Academic Records */}
          <section className="subjects">
            <h4>Learning Progress and Achievement</h4>
            <table className="subjects-table">
              <thead>
                <tr>
                  <th>Subjects</th>
                  <th>1</th>
                  <th>2</th>
                  <th>3</th>
                  <th>4</th>
                  <th>Final Grade</th>
                  <th>Remarks</th>
                </tr>
              </thead>
              <tbody>
                {subjects?.length > 0 ? (
                  subjects.map((subject, index) => (
                    <tr key={index}>
                      <td>{subject.subject_name}</td>
                      <td>{subject.q1 || "___"}</td>
                      <td>{subject.q2 || "___"}</td>
                      <td>{subject.q3 || "___"}</td>
                      <td>{subject.q4 || "___"}</td>
                      <td>{subject.final || "___"}</td>
                      <td>{subject.remarks || "___"}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="7" style={{ textAlign: "center" }}>
                      No academic records available.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </section>

          {/* Render Attendance */}
          <section className="attendance">
            <h4>Attendance Report</h4>
            <table className="attendance-table">
              <thead>
                <tr>
                  <th>Month</th>
                  {attendance?.months?.map((month, index) => (
                    <th key={index}>{month}</th>
                  ))}
                  <th>Total</th>
                </tr>
              </thead>
              <tbody>
                {/* Render attendance data here */}
              </tbody>
            </table>
          </section>

          {/* Render Learner's Values */}
          <section className="observed-values">
            <h4>Learner's Observed Values</h4>
            <table className="values-table">
              <thead>
                <tr>
                  <th>The Student:</th>
                  <th>1</th>
                  <th>2</th>
                  <th>3</th>
                  <th>4</th>
                </tr>
              </thead>
              <tbody>
                {/* Render learner values here */}
              </tbody>
            </table>
          </section>

          <footer className="form-footer">
            <p>
              <strong>{student?.adviser || "Class Adviser"}</strong>: _________________
            </p>
          </footer>
        </div>
      </div>

      {/* Button Container for Print and Back, positioned outside the form */}
      <div className="button-container">
        <button onClick={handleBack}>Back</button>
        <button onClick={handleConvertToPdf}>Print</button>
      </div>
    </div>
  );
}

export default Form137;
