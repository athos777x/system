import React, { useEffect, useState } from "react";
import axios from "axios";
import "../CssFiles/good_moral.css";
import { jsPDF } from "jspdf";
import { useLocation, useNavigate } from "react-router-dom";
import "../CssFiles/report_buttons.css";

function GoodMoral() {
  const { state } = useLocation();
  const student = state?.student;
  const date = new Date().toLocaleDateString();
  const [studentDetails, setStudentDetails] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const [principal, setPrincipal] = useState("");

  const fetchStudentDetails = async () => {
    if (student) {
      const [lastName, firstName] = student.name.replace(",", "").trim().split(/\s+/);

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

    const content = document.querySelector(".good-moral-container");
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

  useEffect(() => {
    if (student) {
      fetchStudentDetails();
      fetchPrincipal();
    }
  }, [student]);

  const handleBack = () => {
    navigate(-1); // Go back to previous page
  };

  return (
    <div className="report-page good-moral-page">
      <div className="good-moral-container">
        <div className="certificate">
          <div className="certificate-header">
            <div className="logo-left">
              <img src="/deped-logo.png" alt="DepEd Logo" className="login-logo" />
            </div>
            <div className="certificate-title">
              <h1>Republic of the Philippines</h1>
              <h1>DEPARTMENT OF EDUCATION</h1>
              <h1>Region VII Central Visayas</h1>
              <h1>DIVISION OF BOHOL</h1>
              <h1>District of Dauis</h1>
              <h1>LOURDES NATIONAL HIGH SCHOOL</h1>
              <h1>Dauis - Panglao Rd, Dauis, Bohol</h1>
              <h1>C E R T I F I C A T I O N</h1>
            </div>
            <div className="logo-right">
              <img src="/lnhs-logo.png" alt="School Logo" className="login-logo" />
            </div>
          </div>

          <div className="certificate-body">
            <p>TO WHOM IT MAY CONCERN:</p>
            <p>
              This is to certify that <strong>{studentDetails?.stud_name || "_____________"}</strong>, a student of
              <strong> {studentDetails?.grade_section || "__________"}</strong> at
              <strong> {student?.schoolName || "Lourdes National High School"}</strong>, has exhibited exemplary
              conduct, proper decorum, and good moral character during the school year
              <strong> {studentDetails?.school_year || "__________"}.</strong>
            </p>
            <p>
              The student has consistently demonstrated behavior aligned with the values and principles upheld by this
              institution, both inside and outside the school premises. Such qualities exemplify the moral character that
              is highly valued by the school and the community.
            </p>
            <p>
              This certificate is issued upon the request of the student for whatever legal or official purposes it may serve.
            </p>
          </div>

          <div className="certificate-footer">
            <p>Given this {date} at {student?.schoolAddress || "______________________"}.</p>
            <br />
            <p>
              <strong>__________________________</strong>
              <br />
              {principal || "[Principal Name]"}
              <br />
              Principal
            </p>
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

export default GoodMoral;
