import { useLocation, useNavigate } from 'react-router-dom';
import React, { useState, useEffect } from 'react';
import { jsPDF } from 'jspdf';
import axios from 'axios';
import '../CssFiles/quarterly_assessment.css';
import "../CssFiles/report_buttons.css";

function QuarterlyAssessment() {
  const location = useLocation();
  const navigate = useNavigate();
  const { schoolYear, grade, section, quarter } = location.state || {};
  const [adviser, setAdviser] = useState("");
  const [principal, setPrincipal] = useState("");

  const [schoolData, setSchoolData] = useState({
    schoolName: "Lourdes National High School",
    schoolId: "123456",
    district: "Dauis",
    division: "Bohol",
    region: "VII",
    schoolYear: schoolYear,
    quarter: quarter,
    grade: grade,
    section: section
  });

  const [assessmentData, setAssessmentData] = useState({
    subjects: [],
    classAverage: 0,
    passingRate: 0,
    failingRate: 0
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (schoolYear && grade && section && quarter) {
      fetchAssessmentData();
      fetchPrincipal();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchAssessmentData = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await axios.get('http://localhost:3001/api/subject-statistics', {
        params: {
          grade_level: grade,
          section_id: section,
          school_year_id: schoolYear,
          period: quarter
        }
      });

      const { subjects, meta } = response.data;

      const formattedSubjects = subjects.map(subject => ({
        name: subject.subject_name,
        totalStudents: subject.total_students,
        highest: subject.highest_grade,
        lowest: subject.lowest_grade,
        mean: subject.mean_grade,
        standardDeviation: subject.standard_deviation,
        distribution: {
          "90-100": subject.grade_90_100,
          "85-89": subject.grade_85_89,
          "80-84": subject.grade_80_84 || 0,
          "75-79": subject.grade_75_79,
          "Below 75": subject.grade_below_75
        }
      }));

      const totalStudents = formattedSubjects.length > 0 ? formattedSubjects[0].totalStudents : 0;
      const totalGrades = formattedSubjects.reduce((sum, sub) => sum + sub.mean * totalStudents, 0);
      const classAverage = formattedSubjects.length > 0 ? totalGrades / (totalStudents * formattedSubjects.length) : 0;

      const totalFailing = formattedSubjects.reduce((sum, sub) => sum + sub.distribution["Below 75"], 0);
      const totalPassing = totalStudents * formattedSubjects.length - totalFailing;
      const totalAll = totalPassing + totalFailing;

      const passingRate = totalAll ? (totalPassing / totalAll) * 100 : 0;
      const failingRate = totalAll ? (totalFailing / totalAll) * 100 : 0;

      setSchoolData(prev => ({
        ...prev,
        section: meta.section_name || prev.section,
        schoolYearName: meta.school_year || prev.schoolYear
      }));

      setAssessmentData({
        subjects: formattedSubjects,
        classAverage,
        passingRate,
        failingRate
      });

    } catch (error) {
      console.error("Error fetching quarterly assessment data:", error);
      setError("Failed to fetch quarterly assessment data");
    } finally {
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
      orientation: "landscape",
      unit: "mm",
      format: "a4"
    });

    const content = document.querySelector(".quarterly-assessment-container");
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

  const getQuarterLabel = (quarter) => {
    switch (parseInt(quarter)) {
      case 1: return '1st Quarter';
      case 2: return '2nd Quarter';
      case 3: return '3rd Quarter';
      case 4: return '4th Quarter';
      default: return 'N/A';
    }
  };

  

  return (
    <div className="report-page quarterly-assessment-page">
      <div className="quarterly-assessment-container">
        <div className="quarterly-assessment-header">
          <div className="quarterly-assessment-header-logos">
            <img src="/deped-logo.png" alt="DepEd Logo" className="quarterly-assessment-logo" />
          </div>
          <div className="quarterly-assessment-header-text">
            <h1>Republic of the Philippines • Department of Education</h1>
            <h2>Region VII Central Visayas • Division of Bohol • District of Dauis</h2>
            <h2>LOURDES NATIONAL HIGH SCHOOL</h2>
            <h3>Dauis - Panglao Rd, Dauis, Bohol</h3>
            <h3>QUARTERLY ASSESSMENT REPORT</h3>
          </div>
          <div className="quarterly-assessment-header-logos">
            <img src="/lnhs-logo.png" alt="School Logo" className="quarterly-assessment-logo" />
          </div>
        </div>

        <div className="quarterly-assessment-school-info">
          <div className="quarterly-assessment-info-item">
            <span className="quarterly-assessment-info-label">School Year:</span>
            <span>{schoolData.schoolYearName || schoolData.schoolYear}</span>
          </div>
          <div className="quarterly-assessment-info-item">
            <span className="quarterly-assessment-info-label">Quarter:</span>
            <span>{getQuarterLabel(schoolData.quarter)}</span>
          </div>
          <div className="quarterly-assessment-info-item">
            <span className="quarterly-assessment-info-label">Grade & Section:</span>
            <span>Grade {schoolData.grade} - {schoolData.section}</span>
          </div>
          <div className="quarterly-assessment-info-item">
            <span className="quarterly-assessment-info-label">Date Generated:</span>
            <span>{new Date().toLocaleDateString()}</span>
          </div>
        </div>

        <div className="quarterly-assessment-table-container">
          <table className="quarterly-assessment-table">
            <thead>
              <tr>
                <th>Subject</th>
                <th>Total Students</th>
                <th>Highest</th>
                <th>Lowest</th>
                <th>Mean</th>
                <th>SD</th>
                <th>90-100</th>
                <th>85-89</th>
                <th>80-84</th>
                <th>75-79</th>
                <th>Below 75</th>
              </tr>
            </thead>
            <tbody>
              {assessmentData.subjects.map((subject, index) => (
                <tr key={index}>
                  <td>{subject.name}</td>
                  <td>{subject.totalStudents}</td>
                  <td>{subject.highest}</td>
                  <td>{subject.lowest}</td>
                  <td>{subject.mean.toFixed(1)}</td>
                  <td>{subject.standardDeviation.toFixed(1)}</td>
                  <td>{subject.distribution["90-100"]}</td>
                  <td>{subject.distribution["85-89"]}</td>
                  <td>{subject.distribution["80-84"]}</td>
                  <td>{subject.distribution["75-79"]}</td>
                  <td>{subject.distribution["Below 75"]}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="quarterly-assessment-summary">
          <div className="quarterly-assessment-summary-item">
            <span className="quarterly-assessment-summary-label">Class Average:</span>
            <span>{assessmentData.classAverage.toFixed(1)}</span>
          </div>
          <div className="quarterly-assessment-summary-item">
            <span className="quarterly-assessment-summary-label">Passing Rate:</span>
            <span>{assessmentData.passingRate.toFixed(1)}%</span>
          </div>
          <div className="quarterly-assessment-summary-item">
            <span className="quarterly-assessment-summary-label">Failing Rate:</span>
            <span>{assessmentData.failingRate.toFixed(1)}%</span>
          </div>
        </div>

        <div className="quarterly-assessment-footer">
          <div className="quarterly-assessment-signature-section">
            <div className="quarterly-assessment-signature">
              <div className="f137-name">{principal || "[Principal Name]"}</div>
              <div className="quarterly-assessment-signature-line"></div>
              <span>Signature</span>
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

export default QuarterlyAssessment;
