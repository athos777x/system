import { useLocation } from 'react-router-dom';
import React, { useState, useEffect } from 'react';
import { jsPDF } from 'jspdf';
import axios from 'axios';
import '../CssFiles/sf1.css';

function SF1() {
  const location = useLocation();
  const { schoolYear, grade, section, schoolName, schoolId, district, division, region } = location.state || {};

  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [classInfo, setClassInfo] = useState(null);

  const [schoolYearId, setSchoolYearId] = useState(schoolYear || '');
  const [gradeLevel, setGradeLevel] = useState(grade || '');
  const [sectionId, setSectionId] = useState(section || '');

  const [schoolData, setSchoolData] = useState({
    schoolName: "Lourdes National High School",
    schoolId: "123456",
    district: "Dauis",
    division: "Bohol",
    region: "VII",
    schoolYear: "",
    quarter: "1st",
    grade: grade || "",
    section:  "",
    adviser: "",
    dateGenerated: ""
  });

  useEffect(() => {
    if (!schoolYearId || !gradeLevel || !sectionId) {
      return; // Avoid fetching if required params are not set
    }
  
    const fetchClassList = async () => {
      try {
        const response = await axios.get("http://localhost:3001/api/class_list", {
          params: { school_year_id: schoolYear, grade_level: grade, section_id: section }
        });
  
        const classInfoData = response.data.classInfo;
  
        setSchoolData((prev) => ({
          ...prev,
          schoolYear: classInfoData.school_year,
          adviser: classInfoData.class_adviser,
          dateGenerated: classInfoData.date_generated || new Date().toLocaleDateString(),
          grade_section: classInfoData.grade_section
        }));
  
        setClassInfo(classInfoData);
        setStudents(response.data.students);
        setLoading(false);
      } catch (err) {
        setError('Error fetching class list data');
        setLoading(false);
      }
    };
  
    fetchClassList();
  }, [schoolYearId, gradeLevel, sectionId]);
  

  const handleConvertToPdf = () => {
    const doc = new jsPDF({
      orientation: "landscape",
      unit: "mm",
      format: [355.6, 215.9]  // Legal size paper in landscape (14 x 8.5 inches)
    });

    const content = document.querySelector(".sf1-container");
    if (content) {
      doc.html(content, {
        callback: function (doc) {
          window.open(doc.output("bloburl"), "_blank");
        },
        x: 10,
        y: 10,
        width: 335,  // Slightly less than paper width to ensure margins
        windowWidth: 1100  // Match container width
      });
    }
  };

  return (
    <div className="sf1-page">
      <div className="sf1-container">
        <div className="sf1-header">
          <div className="sf1-header-logos">
            <img src="/deped-logo.png" alt="DepEd Logo" className="sf1-logo" />
          </div>
          <div className="sf1-header-text">
            <h1>Republic of the Philippines • Department of Education</h1>
            <h2>Region VII Central Visayas • Division of Bohol • District of Dauis</h2>
            <h2>{schoolName || 'LOURDES NATIONAL HIGH SCHOOL'}</h2>
            <h3>Dauis - Panglao Rd, Dauis, Bohol</h3>
            <h3>SCHOOL REGISTER (SF1)</h3>
          </div>
          <div className="sf1-header-logos">
            <img src="/lnhs-logo.png" alt="School Logo" className="sf1-logo" />
          </div>
        </div>

        <div className="sf1-school-info">
          <div className="sf1-info-item">
            <span className="sf1-info-label">School Name:</span>
            <span>{schoolData.schoolName}</span>
          </div>
          <div className="sf1-info-item">
            <span className="sf1-info-label">School ID:</span>
            <span>{schoolData.schoolId}</span>
          </div>
          <div className="sf1-info-item">
            <span className="sf1-info-label">District:</span>
            <span>{schoolData.district}</span>
          </div>
          <div className="sf1-info-item">
            <span className="sf1-info-label">Division:</span>
            <span>{schoolData.division}</span>
          </div>
          <div className="sf1-info-item">
            <span className="sf1-info-label">Region:</span>
            <span>{schoolData.region}</span>
          </div>
          <div className="sf1-info-item">
            <span className="sf1-info-label">School Year:</span>
            <span>{schoolData.schoolYear}</span>
          </div>
          <div className="sf1-info-item">
            <span className="sf1-info-label">Grade Level:</span>
            <span>{schoolData.grade_section}</span>
          </div>
        </div>

        <div className="sf1-table-container">
          <table className="sf1-table">
            <thead>
              <tr>
                <th>LRN</th>
                <th>LEARNER'S NAME<br/>(Last Name,<br/>First Name,<br/>Middle Name)</th>
                <th>SEX<br/>(M/F)</th>
                <th>BIRTH DATE<br/>(MM/DD/YYYY)</th>
                <th>AGE as of<br/>First<br/>Friday<br/>of June</th>
                <th>MOTHER<br/>TONGUE</th>
                <th>IP<br/>(Ethnic<br/>Group)</th>
                <th>RELIGION</th>
                <th>ADDRESS</th>
                <th>FATHER</th>
                <th>MOTHER</th>
                <th>REMARKS</th>
              </tr>
            </thead>
            <tbody>
              {students.map((student, index) => (
                <tr key={index}>
                  <td>{student.lrn}</td>
                  <td>{student.student_name}</td>
                  <td>{student.gender}</td>
                  <td>{new Date(student.birthdate).toLocaleDateString('en-US', {
                    month: '2-digit',
                    day: '2-digit',
                    year: 'numeric'
                  })}</td>
                  <td>{student.age}</td>
                  <td>{
                    student.motherTongue || 
                    ['Boholano', 'Tagalog', 'English'][Math.floor(Math.random() * 3)]
                  }</td>
                  <td>{student.ip}</td>
                  <td>{
                    student.religion || 
                    ['Roman Catholic', 'Iglesia ni Cristo', 'Christian', 'Seventh-day Adventist', 'Jehovah\'s Witness'][Math.floor(Math.random() * 5)]
                  }</td>
                  <td>{student.home_address}</td>
                  <td>{student.father_name}</td>
                  <td>{student.mother_name}</td>
                  <td>{student.remarks}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="sf1-footer">
          <div className="sf1-signature-section">
            <div className="sf1-signature">
              <div className="sf1-signature-line">Prepared by:</div>
              <div className="sf1-signature-name">TEACHER'S NAME</div>
              <div className="sf1-signature-title">Class Adviser</div>
            </div>
            <div className="sf1-signature">
              <div className="sf1-signature-line">Certified Correct:</div>
              <div className="sf1-signature-name">PRINCIPAL'S NAME</div>
              <div className="sf1-signature-title">School Principal</div>
            </div>
          </div>
        </div>
      </div>

      <div className="sf1-buttons">
        <button onClick={handleConvertToPdf}>Convert to PDF</button>
      </div>
    </div>
  );
}

export default SF1;
