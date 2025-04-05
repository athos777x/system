import React, { useState, useEffect } from 'react';
import { jsPDF } from 'jspdf';
import axios from 'axios';
import '../CssFiles/roster.css';

function Roster() {
  const [schoolData, setSchoolData] = useState({
    schoolName: "Lourdes National High School",
    schoolId: "123456",
    district: "Dauis",
    division: "Bohol",
    region: "VII",
    schoolYear: "2023-2024",
    grade: "9",
    section: "Rizal"
  });

  const [students, setStudents] = useState([
    {
      lrn: "123456789012",
      name: "Dela Cruz, Juan A.",
      sex: "M",
      birthDate: "2008-05-15",
      age: "15",
      address: "Dauis, Bohol",
      contact: "09123456789",
      enrollmentDate: "2023-06-05",
      status: "Enrolled"
    },
    {
      lrn: "123456789013",
      name: "Santos, Maria B.",
      sex: "F",
      birthDate: "2008-07-22",
      age: "15",
      address: "Panglao, Bohol",
      contact: "09123456790",
      enrollmentDate: "2023-06-05",
      status: "Enrolled"
    },
    {
      lrn: "123456789014",
      name: "Reyes, Pedro C.",
      sex: "M",
      birthDate: "2008-03-10",
      age: "15",
      address: "Tagbilaran City, Bohol",
      contact: "09123456791",
      enrollmentDate: "2023-06-06",
      status: "Enrolled"
    },
    {
      lrn: "123456789015",
      name: "Garcia, Ana D.",
      sex: "F",
      birthDate: "2008-11-30",
      age: "15",
      address: "Dauis, Bohol",
      contact: "09123456792",
      enrollmentDate: "2023-06-07",
      status: "Enrolled"
    },
    {
      lrn: "123456789016",
      name: "Torres, Jose E.",
      sex: "M",
      birthDate: "2008-09-18",
      age: "15",
      address: "Panglao, Bohol",
      contact: "09123456793",
      enrollmentDate: "2023-06-08",
      status: "Enrolled"
    }
  ]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    // In a real application, you would fetch the data from your API
    // fetchRosterData();
  }, []);

  const fetchRosterData = async () => {
    setLoading(true);
    try {
      // This would be replaced with your actual API endpoint
      // const response = await axios.get(`http://localhost:3001/api/roster`, {
      //   params: {
      //     schoolYear: schoolData.schoolYear,
      //     grade: schoolData.grade,
      //     section: schoolData.section
      //   }
      // });
      // setStudents(response.data);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching roster data:", error);
      setError("Failed to fetch roster data");
      setLoading(false);
    }
  };

  const handleConvertToPdf = () => {
    const doc = new jsPDF({
      orientation: "portrait",
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
        width: 190,
        windowWidth: 1000
      });
    }
  };

  return (
    <div className="roster-page">
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
              {students.map((student, index) => (
                <tr key={student.lrn}>
                  <td>{index + 1}</td>
                  <td>{student.lrn}</td>
                  <td>{student.name}</td>
                  <td>{student.sex}</td>
                  <td>{student.birthDate}</td>
                  <td>{student.age}</td>
                  <td>{student.address}</td>
                  <td>{student.contact}</td>
                  <td>{student.enrollmentDate}</td>
                  <td>{student.status}</td>
                </tr>
              ))}
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
            <span>{students.filter(student => student.sex === 'M').length}</span>
          </div>
          <div className="roster-summary-item">
            <span className="roster-summary-label">Female:</span>
            <span>{students.filter(student => student.sex === 'F').length}</span>
          </div>
        </div>

        <div className="roster-footer">
          <div className="roster-signature-section">
            <div className="roster-signature">
              <div className="roster-signature-line"></div>
              <div className="roster-signature-name">Class Adviser</div>
              <div className="roster-signature-title">Teacher III</div>
            </div>
            <div className="roster-signature">
              <div className="roster-signature-line"></div>
              <div className="roster-signature-name">School Principal</div>
              <div className="roster-signature-title">Principal III</div>
            </div>
          </div>
        </div>
      </div>

      <div className="roster-buttons">
        <button onClick={handleConvertToPdf}>Print</button>
      </div>
    </div>
  );
}

export default Roster; 