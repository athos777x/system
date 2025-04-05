import React, { useState, useEffect } from 'react';
import { jsPDF } from 'jspdf';
import axios from 'axios';
import '../CssFiles/nutritional_report.css';

function NutritionalReport() {
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

  const [nutritionalData, setNutritionalData] = useState([
    {
      lrn: "123456789012",
      name: "Dela Cruz, Juan A.",
      sex: "M",
      age: "15",
      height: "170",
      weight: "55",
      bmi: "19.0",
      bmiCategory: "Normal",
      nutritionalStatus: "Normal",
      remarks: "Maintain healthy diet"
    },
    {
      lrn: "123456789013",
      name: "Santos, Maria B.",
      sex: "F",
      age: "15",
      height: "165",
      weight: "45",
      bmi: "16.5",
      bmiCategory: "Underweight",
      nutritionalStatus: "Underweight",
      remarks: "Increase food intake"
    },
    {
      lrn: "123456789014",
      name: "Reyes, Pedro C.",
      sex: "M",
      age: "15",
      height: "175",
      weight: "70",
      bmi: "22.9",
      bmiCategory: "Normal",
      nutritionalStatus: "Normal",
      remarks: "Maintain healthy diet"
    },
    {
      lrn: "123456789015",
      name: "Garcia, Ana D.",
      sex: "F",
      age: "15",
      height: "160",
      weight: "65",
      bmi: "25.4",
      bmiCategory: "Overweight",
      nutritionalStatus: "Overweight",
      remarks: "Reduce calorie intake"
    },
    {
      lrn: "123456789016",
      name: "Torres, Jose E.",
      sex: "M",
      age: "15",
      height: "172",
      weight: "58",
      bmi: "19.6",
      bmiCategory: "Normal",
      nutritionalStatus: "Normal",
      remarks: "Maintain healthy diet"
    }
  ]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    // In a real application, you would fetch the data from your API
    // fetchNutritionalData();
  }, []);

  const fetchNutritionalData = async () => {
    setLoading(true);
    try {
      // This would be replaced with your actual API endpoint
      // const response = await axios.get(`http://localhost:3001/api/nutritional-report`, {
      //   params: {
      //     schoolYear: schoolData.schoolYear,
      //     quarter: schoolData.quarter,
      //     grade: schoolData.grade,
      //     section: schoolData.section
      //   }
      // });
      // setNutritionalData(response.data);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching nutritional data:", error);
      setError("Failed to fetch nutritional data");
      setLoading(false);
    }
  };

  const handleConvertToPdf = () => {
    const doc = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4"
    });

    const content = document.querySelector(".nutritional-report-container");
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

  const calculateSummary = () => {
    const total = nutritionalData.length;
    const underweight = nutritionalData.filter(student => student.nutritionalStatus === "Underweight").length;
    const normal = nutritionalData.filter(student => student.nutritionalStatus === "Normal").length;
    const overweight = nutritionalData.filter(student => student.nutritionalStatus === "Overweight").length;
    const obese = nutritionalData.filter(student => student.nutritionalStatus === "Obese").length;

    return {
      total,
      underweight,
      normal,
      overweight,
      obese
    };
  };

  const summary = calculateSummary();

  return (
    <div className="nutritional-report-page">
      <div className="nutritional-report-container">
        <div className="nutritional-report-header">
          <div className="nutritional-report-header-logos">
            <img src="/deped-logo.png" alt="DepEd Logo" className="nutritional-report-logo" />
          </div>
          <div className="nutritional-report-header-text">
            <h1>Republic of the Philippines • Department of Education</h1>
            <h2>Region VII Central Visayas • Division of Bohol • District of Dauis</h2>
            <h2>LOURDES NATIONAL HIGH SCHOOL</h2>
            <h3>Dauis - Panglao Rd, Dauis, Bohol</h3>
            <h3>NUTRITIONAL STATUS REPORT</h3>
          </div>
          <div className="nutritional-report-header-logos">
            <img src="/lnhs-logo.png" alt="School Logo" className="nutritional-report-logo" />
          </div>
        </div>

        <div className="nutritional-report-school-info">
          <div className="nutritional-report-info-item">
            <span className="nutritional-report-info-label">School Year:</span>
            <span>{schoolData.schoolYear}</span>
          </div>
          <div className="nutritional-report-info-item">
            <span className="nutritional-report-info-label">Quarter:</span>
            <span>{schoolData.quarter}</span>
          </div>
          <div className="nutritional-report-info-item">
            <span className="nutritional-report-info-label">Grade & Section:</span>
            <span>Grade {schoolData.grade} - {schoolData.section}</span>
          </div>
          <div className="nutritional-report-info-item">
            <span className="nutritional-report-info-label">Class Adviser:</span>
            <span>{schoolData.adviser}</span>
          </div>
          <div className="nutritional-report-info-item">
            <span className="nutritional-report-info-label">Date Generated:</span>
            <span>{new Date().toLocaleDateString()}</span>
          </div>
        </div>

        <div className="nutritional-report-table-container">
          <table className="nutritional-report-table">
            <thead>
              <tr>
                <th>LRN</th>
                <th>Name</th>
                <th>Sex</th>
                <th>Age</th>
                <th>Height (cm)</th>
                <th>Weight (kg)</th>
                <th>BMI</th>
                <th>BMI Category</th>
                <th>Nutritional Status</th>
                <th>Remarks</th>
              </tr>
            </thead>
            <tbody>
              {nutritionalData.map((student) => (
                <tr key={student.lrn}>
                  <td>{student.lrn}</td>
                  <td>{student.name}</td>
                  <td>{student.sex}</td>
                  <td>{student.age}</td>
                  <td>{student.height}</td>
                  <td>{student.weight}</td>
                  <td>{student.bmi}</td>
                  <td>{student.bmiCategory}</td>
                  <td>{student.nutritionalStatus}</td>
                  <td>{student.remarks}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="nutritional-report-summary">
          <div className="nutritional-report-summary-item">
            <span className="nutritional-report-summary-label">Total Students:</span>
            <span>{summary.total}</span>
          </div>
          <div className="nutritional-report-summary-item">
            <span className="nutritional-report-summary-label">Underweight:</span>
            <span>{summary.underweight}</span>
          </div>
          <div className="nutritional-report-summary-item">
            <span className="nutritional-report-summary-label">Normal:</span>
            <span>{summary.normal}</span>
          </div>
          <div className="nutritional-report-summary-item">
            <span className="nutritional-report-summary-label">Overweight:</span>
            <span>{summary.overweight}</span>
          </div>
          <div className="nutritional-report-summary-item">
            <span className="nutritional-report-summary-label">Obese:</span>
            <span>{summary.obese}</span>
          </div>
        </div>

        <div className="nutritional-report-footer">
          <div className="nutritional-report-signature-section">
            <div className="nutritional-report-signature">
              <div className="nutritional-report-signature-line"></div>
              <div className="nutritional-report-signature-name">School Nurse</div>
              <div className="nutritional-report-signature-title">RN</div>
            </div>
            <div className="nutritional-report-signature">
              <div className="nutritional-report-signature-line"></div>
              <div className="nutritional-report-signature-name">School Principal</div>
              <div className="nutritional-report-signature-title">Principal III</div>
            </div>
          </div>
        </div>
      </div>

      <div className="nutritional-report-buttons">
        <button onClick={handleConvertToPdf}>Print</button>
      </div>
    </div>
  );
}

export default NutritionalReport; 