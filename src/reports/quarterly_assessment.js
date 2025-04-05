import React, { useState, useEffect } from 'react';
import { jsPDF } from 'jspdf';
import axios from 'axios';
import '../CssFiles/quarterly_assessment.css';

function QuarterlyAssessment() {
  const [schoolData, setSchoolData] = useState({
    schoolName: "Lourdes National High School",
    schoolId: "123456",
    district: "Dauis",
    division: "Bohol",
    region: "VII",
    schoolYear: "2023-2024",
    quarter: "1st Quarter",
    grade: "9",
    section: "Rizal"
  });

  const [assessmentData, setAssessmentData] = useState({
    subjects: [
      {
        name: "Filipino",
        totalStudents: 52,
        highest: 98,
        lowest: 75,
        mean: 85.5,
        standardDeviation: 5.2,
        distribution: {
          "90-100": 15,
          "85-89": 20,
          "80-84": 10,
          "75-79": 5,
          "Below 75": 2
        }
      },
      {
        name: "English",
        totalStudents: 52,
        highest: 100,
        lowest: 78,
        mean: 88.3,
        standardDeviation: 4.8,
        distribution: {
          "90-100": 18,
          "85-89": 22,
          "80-84": 8,
          "75-79": 3,
          "Below 75": 1
        }
      },
      {
        name: "Mathematics",
        totalStudents: 52,
        highest: 95,
        lowest: 70,
        mean: 82.7,
        standardDeviation: 6.1,
        distribution: {
          "90-100": 12,
          "85-89": 18,
          "80-84": 12,
          "75-79": 7,
          "Below 75": 3
        }
      },
      {
        name: "Science",
        totalStudents: 52,
        highest: 97,
        lowest: 76,
        mean: 86.2,
        standardDeviation: 5.5,
        distribution: {
          "90-100": 14,
          "85-89": 21,
          "80-84": 10,
          "75-79": 5,
          "Below 75": 2
        }
      },
      {
        name: "Araling Panlipunan",
        totalStudents: 52,
        highest: 99,
        lowest: 77,
        mean: 87.8,
        standardDeviation: 5.0,
        distribution: {
          "90-100": 16,
          "85-89": 20,
          "80-84": 9,
          "75-79": 5,
          "Below 75": 2
        }
      }
    ],
    classAverage: 86.1,
    passingRate: 94.2,
    failingRate: 5.8
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    // In a real application, you would fetch the data from your API
    // fetchAssessmentData();
  }, []);

  const fetchAssessmentData = async () => {
    setLoading(true);
    try {
      // This would be replaced with your actual API endpoint
      // const response = await axios.get(`http://localhost:3001/api/quarterly-assessment`, {
      //   params: {
      //     schoolYear: schoolData.schoolYear,
      //     quarter: schoolData.quarter,
      //     grade: schoolData.grade,
      //     section: schoolData.section
      //   }
      // });
      // setAssessmentData(response.data);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching quarterly assessment data:", error);
      setError("Failed to fetch quarterly assessment data");
      setLoading(false);
    }
  };

  const handleConvertToPdf = () => {
    const doc = new jsPDF({
      orientation: "portrait",
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
        width: 190,
        windowWidth: 1000
      });
    }
  };

  return (
    <div className="quarterly-assessment-page">
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
            <span>{schoolData.schoolYear}</span>
          </div>
          <div className="quarterly-assessment-info-item">
            <span className="quarterly-assessment-info-label">Quarter:</span>
            <span>{schoolData.quarter}</span>
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
              <div className="quarterly-assessment-signature-line"></div>
              <div className="quarterly-assessment-signature-name">Class Adviser</div>
              <div className="quarterly-assessment-signature-title">Teacher III</div>
            </div>
            <div className="quarterly-assessment-signature">
              <div className="quarterly-assessment-signature-line"></div>
              <div className="quarterly-assessment-signature-name">School Principal</div>
              <div className="quarterly-assessment-signature-title">Principal III</div>
            </div>
          </div>
        </div>
      </div>

      <div className="quarterly-assessment-buttons">
        <button onClick={handleConvertToPdf}>Print</button>
      </div>
    </div>
  );
}

export default QuarterlyAssessment; 