import React, { useState, useEffect } from 'react';
import { jsPDF } from 'jspdf';
import axios from 'axios';
import { useLocation, useNavigate } from 'react-router-dom';
import '../CssFiles/class_list.css';
import "../CssFiles/report_buttons.css";

function ClassList() {
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
    adviser: ""
  });

  const [students, setStudents] = useState([]);
  const [maleCount, setMaleCount] = useState(0);
  const [femaleCount, setFemaleCount] = useState(0);
  const [totalStudents, setTotalStudents] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [adviser, setAdviser] = useState("");
  const [principal, setPrincipal] = useState("");

  useEffect(() => {
    if (schoolYear && grade && section) {
      fetchClassListData(schoolYear, grade, section);
      fetchPrincipal();
    }
  }, [schoolYear, grade, section]);

  const fetchClassListData = async (schoolYearId, gradeLevel, sectionId) => {
    setLoading(true);
    try {
      const response = await axios.get('http://localhost:3001/api/class_list', {
        params: {
          school_year_id: schoolYearId,
          grade_level: gradeLevel,
          section_id: sectionId
        }
      });
  
      const { students, classInfo } = response.data;
  
      const formattedStudents = students.map((student) => ({
        ...student,
        birthdate: student.birthdate ? new Date(student.birthdate).toLocaleDateString() : "—"
      }));
  
      setStudents(formattedStudents);
  
      const male = formattedStudents.filter(s => s.gender === 'Male').length;
      const female = formattedStudents.filter(s => s.gender === 'Female').length;
  
      setMaleCount(male);
      setFemaleCount(female);
      setTotalStudents(formattedStudents.length);
  
      setSchoolData((prevData) => ({
        ...prevData,
        schoolYear: classInfo?.school_year || "",
        adviser: classInfo?.class_adviser || "",
        grade: gradeLevel,
        section: classInfo?.grade_section?.split(' - ')[1] || prevData.section
      }));

      if (classInfo?.grade_level && classInfo?.section_id) {
        fetchAdviser({ grade_level: classInfo.grade_level, section_id: classInfo.section_id });
      } else {
        fetchAdviser({ grade_level: gradeLevel, section_id: sectionId });
      }
      
  
      setLoading(false);
    } catch (error) {
      console.error("Error fetching class list data:", error);
      setError("Failed to fetch class list data");
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
      format: "a4"
    });

    const content = document.querySelector(".class-list-container");
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

  if (loading) {
    return <div>Loading class list...</div>;
  }

  if (error) {
    return <div>{error}</div>;
  }

  return (
    <div className="report-page class-list-page">
      <div className="class-list-container">
        <div className="class-list-header">
          <div className="class-list-header-logos">
            <img src="/deped-logo.png" alt="DepEd Logo" className="class-list-logo" />
          </div>
          <div className="class-list-header-text">
            <h1>Republic of the Philippines • Department of Education</h1>
            <h2>Region VII Central Visayas • Division of Bohol • District of Dauis</h2>
            <h2>{schoolData.schoolName}</h2>
            <h3>Dauis - Panglao Rd, Dauis, Bohol</h3>
            <h3>CLASS LIST</h3>
          </div>
          <div className="class-list-header-logos">
            <img src="/lnhs-logo.png" alt="School Logo" className="class-list-logo" />
          </div>
        </div>

        <div className="class-list-school-info">
          <div className="class-list-info-item">
            <span className="class-list-info-label">School Year:</span>
            <span>{schoolData.schoolYear}</span>
          </div>
          <div className="class-list-info-item">
            <span className="class-list-info-label">Grade & Section:</span>
            <span>Grade {schoolData.grade} - {schoolData.section}</span>
          </div>
          <div className="class-list-info-item">
            <span className="class-list-info-label">Class Adviser:</span>
            <span>{schoolData.adviser}</span>
          </div>
          <div className="class-list-info-item">
            <span className="class-list-info-label">Date Generated:</span>
            <span>{new Date().toLocaleDateString()}</span>
          </div>
        </div>

        <div className="class-list-table-container">
          <table className="class-list-table">
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
                <th>Parent/Guardian</th>
                <th>Parent Contact</th>
              </tr>
            </thead>
            <tbody>
              {students.map((student, index) => (
                <tr key={student.lrn || index}>
                  <td>{index + 1}</td>
                  <td>{student.lrn}</td>
                  <td>{student.student_name}</td>
                  <td>{student.gender}</td>
                  <td>{student.birthdate}</td>
                  <td>{student.age}</td>
                  <td>{student.home_address}</td>
                  <td>{student.contact_number}</td>
                  <td>{student.parent_name}</td>
                  <td>{student.parent_contact_no}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="class-list-summary">
          <div className="class-list-summary-item">
            <span className="class-list-summary-label">Total Students:</span>
            <span>{totalStudents}</span>
          </div>
          <div className="class-list-summary-item">
            <span className="class-list-summary-label">Male:</span>
            <span>{maleCount}</span>
          </div>
          <div className="class-list-summary-item">
            <span className="class-list-summary-label">Female:</span>
            <span>{femaleCount}</span>
          </div>
        </div>

        <div className="class-list-footer">
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

export default ClassList;
