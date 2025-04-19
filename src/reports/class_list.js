import React, { useState, useEffect } from 'react';
import { jsPDF } from 'jspdf';
import axios from 'axios';
import { useLocation, useNavigate } from 'react-router-dom';
import '../CssFiles/class_list.css';

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

  useEffect(() => {
    if (schoolYear && grade && section) {
      fetchClassListData(schoolYear, grade, section);
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
  
      setLoading(false);
    } catch (error) {
      console.error("Error fetching class list data:", error);
      setError("Failed to fetch class list data");
      setLoading(false);
    }
  };
  

  const handleConvertToPdf = () => {
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

  if (loading) {
    return <div>Loading class list...</div>;
  }

  if (error) {
    return <div>{error}</div>;
  }

  return (
    <div className="class-list-page">
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
          <div className="class-list-signature-section">
            <div className="class-list-signature">
              <div className="class-list-signature-line"></div>
              <div className="class-list-signature-name">Class Adviser</div>
              <div className="class-list-signature-title">Teacher III</div>
            </div>
            <div className="class-list-signature">
              <div className="class-list-signature-line"></div>
              <div className="class-list-signature-name">School Principal</div>
              <div className="class-list-signature-title">Principal III</div>
            </div>
          </div>
        </div>
      </div>

      <div className="class-list-buttons">
        <button onClick={handleConvertToPdf}>Print</button>
      </div>
    </div>
  );
}

export default ClassList;
