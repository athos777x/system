import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { jsPDF } from 'jspdf';
import axios from 'axios';
import '../CssFiles/roster.css';
import "../CssFiles/report_buttons.css";

function Roster() {
  const location = useLocation();
  const navigate = useNavigate();
  const { schoolYear, grade, section } = location.state || {};

  const [schoolData, setSchoolData] = useState({
    schoolName: "Lourdes National High School",
    schoolId: "123456",
    district: "Dauis",
    division: "Bohol",
    region: "VII",
    schoolYear: "",
    grade: "",
    section: "",
    adviser: "",
  });

  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [adviser, setAdviser] = useState("");
  const [principal, setPrincipal] = useState("");

  useEffect(() => {
    fetchPrincipal();
  
    if (!schoolYear || !grade || !section) {
      console.warn("Missing required parameters. Redirecting...");
      navigate('/select-roster-filters');
      return;
    }
  
    fetchRosterData(schoolYear, grade, section);
    setSchoolData(prev => ({
      ...prev,
      schoolYear,
      grade,
      section,
    }));
    fetchAdviser({
      grade_level: grade,
      section_id: section,
    });
  }, [schoolYear, grade, section]);
  

  const fetchRosterData = async (schoolYearId, gradeLevel, sectionId) => {
    setLoading(true);
    setError(null);

    try {
      const response = await axios.get('http://localhost:3001/api/class_list', {
        params: {
          school_year_id: schoolYearId,
          grade_level: gradeLevel,
          section_id: sectionId
        }
      });

      console.log("API response:", response.data);

      // If API includes classInfo metadata
      if (response.data.classInfo) {
        const { classInfo, students: studentList } = response.data;

        setSchoolData(prev => ({
          ...prev,
          adviser: classInfo.class_adviser || prev.adviser,
          section: classInfo.grade_section?.split(' - ')[1] || prev.section,
          grade: classInfo.grade_section?.match(/Grade (\d+)/)?.[1] || prev.grade,
          schoolYear: classInfo.school_year || prev.schoolYear
          
        }));

        setStudents(studentList || []);
      } else if (Array.isArray(response.data)) {
        // Fallback for just array response
        setStudents(response.data);
      } else {
        setError("Received data is not in the expected format.");
        console.error("Unexpected data format:", response.data);
      }
    } catch (err) {
      console.error("Error fetching roster data:", err);
      setError("Failed to fetch roster data.");
    } finally {
      setLoading(false);
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
      orientation: "landscape",
      unit: "mm",
      format: "a4"
    });

    const content = document.querySelector(".roster-container");
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
    <div className="report-page roster-page">
      <div className="roster-container">
        <div className="roster-header">
          <div className="roster-header-logos">
            <img src="/deped-logo.png" alt="DepEd Logo" className="roster-logo" />
          </div>
          <div className="roster-header-text">
            <h1>Republic of the Philippines • Department of Education</h1>
            <h2>Region VII Central Visayas • Division of Bohol • District of Dauis</h2>
            <h2>LOURDES NATIONAL HIGH SCHOOL</h2>
            <h3>Dauis - Panglao Rd, Dauis, Bohol</h3>
            <h3>ROSTER OF ENROLLED STUDENTS</h3>
          </div>
          <div className="roster-header-logos">
            <img src="/lnhs-logo.png" alt="School Logo" className="roster-logo" />
          </div>
        </div>

        <div className="roster-school-info">
          <div className="roster-info-item">
            <span className="roster-info-label">School Year:</span>
            <span>{schoolData.schoolYear}</span>
          </div>
          <div className="roster-info-item">
            <span className="roster-info-label">Grade & Section:</span>
            <span>Grade {schoolData.grade} - {schoolData.section}</span>
          </div>
          <div className="roster-info-item">
            <span className="roster-info-label">Date Generated:</span>
            <span>{new Date().toLocaleDateString()}</span>
          </div>
        </div>

        {loading && <p>Loading student data...</p>}
        {error && <p style={{ color: 'red' }}>{error}</p>}

        <div className="roster-table-container">
          <table className="roster-table">
            <thead>
              <tr>
                <th>No.</th>
                <th>LRN</th>
                <th>Name</th>
                <th>Sex</th>
                <th>Birth Date</th>
                <th>Age</th>
                <th>Address</th>
                <th>Contact</th>
                <th>Enrollment Date</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {students.length > 0 ? (
                students.map((student, index) => (
                  <tr key={student.lrn || index}>
                    <td>{index + 1}</td>
                    <td>{student.lrn}</td>
                    <td>{student.student_name}</td>
                    <td>{student.gender}</td>
                    <td>{student.birthdate}</td>
                    <td>{student.age}</td>
                    <td>{student.home_address}</td>
                    <td>{student.contact_number}</td>
                    <td>{student.enrollment_date}</td>
                    <td>{student.enrollment_status}</td>
                  </tr>
                ))
              ) : (
                !loading && !error && (
                  <tr>
                    <td colSpan="10">No students found.</td>
                  </tr>
                )
              )}
            </tbody>
          </table>
        </div>

        <div className="roster-summary">
          <div className="roster-summary-item">
            <span className="roster-summary-label">Total Enrolled:</span>
            <span>{students.length}</span>
          </div>
          <div className="roster-summary-item">
            <span className="roster-summary-label">Male:</span>
            <span>{students.filter(s => s.gender === 'Male').length}</span>
          </div>
          <div className="roster-summary-item">
            <span className="roster-summary-label">Female:</span>
            <span>{students.filter(s => s.gender === 'Female').length}</span>
          </div>
        </div>

        <div className="roster-footer">
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
      </div>
      
      <div className="report-buttons">
        <button onClick={handleBack} className="report-back-btn">Back</button>
        <button onClick={handlePrintPDF} className="report-print-btn">Print PDF</button>
      </div>
    </div>
  );
}

export default Roster;
