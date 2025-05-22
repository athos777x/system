import React, { useState, useEffect } from 'react';
import { jsPDF } from 'jspdf';
import axios from 'axios';
import { useLocation, useNavigate } from 'react-router-dom';
import '../CssFiles/nutritional_report.css';
import '../CssFiles/report_buttons.css';

// Calculate age from birthdate
function calculateAge(birthdate) {
  const today = new Date();
  const birthDate = new Date(birthdate);
  let age = today.getFullYear() - birthDate.getFullYear();
  const m = today.getMonth() - birthDate.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
}

function NutritionalReport() {
  const navigate = useNavigate();
  const { state } = useLocation();
  const { schoolYear, grade, section } = state || {};

  const [schoolData, setSchoolData] = useState({
    schoolName: "Lourdes National High School",
    schoolId: "123456",
    district: "Dauis",
    division: "Bohol",
    region: "VII",
    schoolYear: "",
    quarter: "1st Quarter",
    adviser: "",
    dateGenerated: new Date().toLocaleDateString()
  });

  const [nutritionalData, setNutritionalData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [principal, setPrincipal] = useState("");

  useEffect(() => {
    fetchPrincipal();
    if (!schoolYear || !grade || !section) {
      setError("Missing required parameters for the report.");
      setLoading(false);
      return;
    }



    const fetchData = async () => {
      try {
        const response = await axios.get("http://localhost:3001/api/class_list", {
          params: { school_year_id: schoolYear, grade_level: grade, section_id: section }
        });

        const { classInfo, students } = response.data;

        if (!Array.isArray(students) || !classInfo) {
          throw new Error("Invalid data format from server.");
        }

        const transformedData = students.map((student) => {
          const height = Math.floor(Math.random() * 41) + 140;
          const weight = Math.floor(Math.random() * 41) + 40;
          const heightInMeters = height / 100;
          const bmi = (weight / (heightInMeters ** 2)).toFixed(1);
          const age = calculateAge(student.birthdate);

          let category = "";
          let remarks = "";

          const bmiVal = parseFloat(bmi);
          if (bmiVal < 18.5) {
            category = "Underweight";
            remarks = "Increase food intake";
          } else if (bmiVal < 24.9) {
            category = "Normal";
            remarks = "Maintain healthy diet";
          } else if (bmiVal < 29.9) {
            category = "Overweight";
            remarks = "Reduce calorie intake";
          } else {
            category = "Obese";
            remarks = "Consult a health professional";
          }

          return {
            lrn: student.lrn,
            name: student.student_name,
            sex: student.gender,
            age,
            height,
            weight,
            bmi,
            bmiCategory: category,
            nutritionalStatus: category,
            remarks
          };
        });

        setNutritionalData(transformedData);
        setSchoolData((prev) => ({
          ...prev,
          schoolYear: classInfo.school_year,
          adviser: classInfo.class_adviser,
          dateGenerated: classInfo.date_generated || new Date().toLocaleDateString(),
          grade_section: classInfo.grade_section
        }));
        setError(null);
      } catch (err) {
        console.error(err);
        setError("Failed to fetch nutritional data.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [schoolYear, grade, section]);

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
    const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
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

  const handleBack = () => {
    navigate(-1); // Go back to previous page
  };

  const calculateSummary = () => {
    const total = nutritionalData.length;
    const underweight = nutritionalData.filter(s => s.nutritionalStatus === "Underweight").length;
    const normal = nutritionalData.filter(s => s.nutritionalStatus === "Normal").length;
    const overweight = nutritionalData.filter(s => s.nutritionalStatus === "Overweight").length;
    const obese = nutritionalData.filter(s => s.nutritionalStatus === "Obese").length;

    return { total, underweight, normal, overweight, obese };
  };

  const summary = calculateSummary();

  return (
    <div className="report-page nutritional-report-page">
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
          <div><span>School Year:</span><span> {schoolData.schoolYear}</span></div>
          <div><span>Quarter:</span><span> {schoolData.quarter}</span></div>
          <div><span>Grade & Section:</span><span> {schoolData.grade_section}</span></div>
          <div><span>Class Adviser:</span><span> {schoolData.adviser}</span></div>
          <div><span>Date Generated:</span><span> {schoolData.dateGenerated}</span></div>
        </div>

        <div className="nutritional-report-table-container">
          {loading ? (
            <p>Loading data...</p>
          ) : error ? (
            <p>{error}</p>
          ) : (
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
                {nutritionalData.map((student, i) => (
                  <tr key={i}>
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
          )}
        </div>

        <div className="nutritional-report-summary">
          <div><span>Total Students:</span><span>{summary.total}</span></div>
          <div><span>Underweight:</span><span>{summary.underweight}</span></div>
          <div><span>Normal:</span><span>{summary.normal}</span></div>
          <div><span>Overweight:</span><span>{summary.overweight}</span></div>
          <div><span>Obese:</span><span>{summary.obese}</span></div>
        </div>

        <div className="nutritional-report-footer">
          <div className="signature-section single-signature">
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

export default NutritionalReport;
