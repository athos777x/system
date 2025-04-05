import React, { useState, useEffect } from 'react';
import { jsPDF } from 'jspdf';
import axios from 'axios';
import '../CssFiles/class_list.css';

function ClassList() {
  const [schoolData, setSchoolData] = useState({
    schoolName: "Lourdes National High School",
    schoolId: "123456",
    district: "Dauis",
    division: "Bohol",
    region: "VII",
    schoolYear: "2023-2024",
    grade: "9",
    section: "Rizal",
    adviser: "Maria Santos"
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
      parentName: "Dela Cruz, Pedro",
      parentContact: "09123456788"
    },
    {
      lrn: "123456789013",
      name: "Santos, Maria B.",
      sex: "F",
      birthDate: "2008-07-22",
      age: "15",
      address: "Panglao, Bohol",
      contact: "09123456790",
      parentName: "Santos, Jose",
      parentContact: "09123456791"
    },
    {
      lrn: "123456789014",
      name: "Reyes, Pedro C.",
      sex: "M",
      birthDate: "2008-03-10",
      age: "15",
      address: "Tagbilaran City, Bohol",
      contact: "09123456792",
      parentName: "Reyes, Juan",
      parentContact: "09123456793"
    },
    {
      lrn: "123456789015",
      name: "Garcia, Ana D.",
      sex: "F",
      birthDate: "2008-11-30",
      age: "15",
      address: "Dauis, Bohol",
      contact: "09123456794",
      parentName: "Garcia, Jose",
      parentContact: "09123456795"
    },
    {
      lrn: "123456789016",
      name: "Torres, Jose E.",
      sex: "M",
      birthDate: "2008-09-18",
      age: "15",
      address: "Panglao, Bohol",
      contact: "09123456796",
      parentName: "Torres, Pedro",
      parentContact: "09123456797"
    }
  ]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    // In a real application, you would fetch the data from your API
    // fetchClassListData();
  }, []);

  const fetchClassListData = async () => {
    setLoading(true);
    try {
      // This would be replaced with your actual API endpoint
      // const response = await axios.get(`http://localhost:3001/api/class-list`, {
      //   params: {
      //     schoolYear: schoolData.schoolYear,
      //     grade: schoolData.grade,
      //     section: schoolData.section
      //   }
      // });
      // setStudents(response.data);
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
            <h2>LOURDES NATIONAL HIGH SCHOOL</h2>
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
                <tr key={student.lrn}>
                  <td>{index + 1}</td>
                  <td>{student.lrn}</td>
                  <td>{student.name}</td>
                  <td>{student.sex}</td>
                  <td>{student.birthDate}</td>
                  <td>{student.age}</td>
                  <td>{student.address}</td>
                  <td>{student.contact}</td>
                  <td>{student.parentName}</td>
                  <td>{student.parentContact}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="class-list-summary">
          <div className="class-list-summary-item">
            <span className="class-list-summary-label">Total Students:</span>
            <span>{students.length}</span>
          </div>
          <div className="class-list-summary-item">
            <span className="class-list-summary-label">Male:</span>
            <span>{students.filter(student => student.sex === 'M').length}</span>
          </div>
          <div className="class-list-summary-item">
            <span className="class-list-summary-label">Female:</span>
            <span>{students.filter(student => student.sex === 'F').length}</span>
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