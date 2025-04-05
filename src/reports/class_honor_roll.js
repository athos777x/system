import React, { useState, useEffect } from 'react';
import { jsPDF } from 'jspdf';
import axios from 'axios';
import '../CssFiles/class_honor_roll.css';

function ClassHonorRoll() {
  const [schoolData, setSchoolData] = useState({
    schoolName: "Lourdes National High School",
    schoolId: "123456",
    district: "Dauis",
    division: "Bohol",
    region: "VII",
    schoolYear: "2023-2024",
    quarter: "1st",
    grade: "9",
    section: "Rizal",
    adviser: "Maria Santos"
  });

  const [honorRoll, setHonorRoll] = useState([
    {
      rank: 1,
      lrn: "123456789012",
      name: "Dela Cruz, Juan A.",
      sex: "M",
      generalAverage: 98.5,
      conduct: "Outstanding",
      attendance: "Perfect",
      remarks: "With Highest Honors"
    },
    {
      rank: 2,
      lrn: "123456789013",
      name: "Santos, Maria B.",
      sex: "F",
      generalAverage: 97.8,
      conduct: "Outstanding",
      attendance: "Perfect",
      remarks: "With High Honors"
    },
    {
      rank: 3,
      lrn: "123456789014",
      name: "Reyes, Pedro C.",
      sex: "M",
      generalAverage: 96.5,
      conduct: "Very Satisfactory",
      attendance: "Perfect",
      remarks: "With Honors"
    },
    {
      rank: 4,
      lrn: "123456789015",
      name: "Garcia, Ana D.",
      sex: "F",
      generalAverage: 95.8,
      conduct: "Very Satisfactory",
      attendance: "Perfect",
      remarks: "With Honors"
    },
    {
      rank: 5,
      lrn: "123456789016",
      name: "Torres, Jose E.",
      sex: "M",
      generalAverage: 95.2,
      conduct: "Very Satisfactory",
      attendance: "Perfect",
      remarks: "With Honors"
    }
  ]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    // In a real application, you would fetch the data from your API
    // fetchHonorRollData();
  }, []);

  const fetchHonorRollData = async () => {
    setLoading(true);
    try {
      // This would be replaced with your actual API endpoint
      // const response = await axios.get(`http://localhost:3001/api/class-honor-roll`, {
      //   params: {
      //     schoolYear: schoolData.schoolYear,
      //     quarter: schoolData.quarter,
      //     grade: schoolData.grade,
      //     section: schoolData.section
      //   }
      // });
      // setHonorRoll(response.data);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching honor roll data:", error);
      setError("Failed to fetch honor roll data");
      setLoading(false);
    }
  };

  const handleConvertToPdf = () => {
    const doc = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4"
    });

    const content = document.querySelector(".class-honor-roll-container");
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
    <div className="class-honor-roll-page">
      <div className="class-honor-roll-container">
        <div className="class-honor-roll-header">
          <div className="class-honor-roll-header-logos">
            <img src="/deped-logo.png" alt="DepEd Logo" className="class-honor-roll-logo" />
          </div>
          <div className="class-honor-roll-header-text">
            <h1>Republic of the Philippines • Department of Education</h1>
            <h2>Region VII Central Visayas • Division of Bohol • District of Dauis</h2>
            <h2>LOURDES NATIONAL HIGH SCHOOL</h2>
            <h3>Dauis - Panglao Rd, Dauis, Bohol</h3>
            <h3>CLASS HONOR ROLL</h3>
          </div>
          <div className="class-honor-roll-header-logos">
            <img src="/lnhs-logo.png" alt="School Logo" className="class-honor-roll-logo" />
          </div>
        </div>

        <div className="class-honor-roll-school-info">
          <div className="class-honor-roll-info-item">
            <span className="class-honor-roll-info-label">School Year:</span>
            <span>{schoolData.schoolYear}</span>
          </div>
          <div className="class-honor-roll-info-item">
            <span className="class-honor-roll-info-label">Quarter:</span>
            <span>{schoolData.quarter}</span>
          </div>
          <div className="class-honor-roll-info-item">
            <span className="class-honor-roll-info-label">Grade & Section:</span>
            <span>Grade {schoolData.grade} - {schoolData.section}</span>
          </div>
          <div className="class-honor-roll-info-item">
            <span className="class-honor-roll-info-label">Class Adviser:</span>
            <span>{schoolData.adviser}</span>
          </div>
          <div className="class-honor-roll-info-item">
            <span className="class-honor-roll-info-label">Date Generated:</span>
            <span>{new Date().toLocaleDateString()}</span>
          </div>
        </div>

        <div className="class-honor-roll-table-container">
          <table className="class-honor-roll-table">
            <thead>
              <tr>
                <th>Rank</th>
                <th>LRN</th>
                <th>Name</th>
                <th>Sex</th>
                <th>General Average</th>
                <th>Conduct</th>
                <th>Attendance</th>
                <th>Remarks</th>
              </tr>
            </thead>
            <tbody>
              {honorRoll.map((student) => (
                <tr key={student.lrn}>
                  <td>{student.rank}</td>
                  <td>{student.lrn}</td>
                  <td>{student.name}</td>
                  <td>{student.sex}</td>
                  <td>{student.generalAverage}</td>
                  <td>{student.conduct}</td>
                  <td>{student.attendance}</td>
                  <td>{student.remarks}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="class-honor-roll-summary">
          <div className="class-honor-roll-summary-item">
            <span className="class-honor-roll-summary-label">Total Students:</span>
            <span>{honorRoll.length}</span>
          </div>
          <div className="class-honor-roll-summary-item">
            <span className="class-honor-roll-summary-label">Male:</span>
            <span>{honorRoll.filter(student => student.sex === 'M').length}</span>
          </div>
          <div className="class-honor-roll-summary-item">
            <span className="class-honor-roll-summary-label">Female:</span>
            <span>{honorRoll.filter(student => student.sex === 'F').length}</span>
          </div>
        </div>

        <div className="class-honor-roll-footer">
          <div className="class-honor-roll-signature-section">
            <div className="class-honor-roll-signature">
              <div className="class-honor-roll-signature-line"></div>
              <div className="class-honor-roll-signature-name">Class Adviser</div>
              <div className="class-honor-roll-signature-title">Teacher III</div>
            </div>
            <div className="class-honor-roll-signature">
              <div className="class-honor-roll-signature-line"></div>
              <div className="class-honor-roll-signature-name">School Principal</div>
              <div className="class-honor-roll-signature-title">Principal III</div>
            </div>
          </div>
        </div>
      </div>

      <div className="class-honor-roll-buttons">
        <button onClick={handleConvertToPdf}>Print</button>
      </div>
    </div>
  );
}

export default ClassHonorRoll; 