import React, { useState, useEffect } from 'react';
import { jsPDF } from 'jspdf';
import axios from 'axios';
import '../CssFiles/early_enrollment.css';

function EarlyEnrollment() {
  const [schoolData, setSchoolData] = useState({
    schoolName: "Lourdes National High School",
    schoolId: "123456",
    district: "Dauis",
    division: "Bohol",
    region: "VII",
    schoolYear: "2023-2024"
  });

  const [enrollmentData, setEnrollmentData] = useState({
    grades: {
      "Grade 7": { male: 120, female: 130, total: 250 },
      "Grade 8": { male: 115, female: 125, total: 240 },
      "Grade 9": { male: 110, female: 120, total: 230 },
      "Grade 10": { male: 105, female: 115, total: 220 }
    },
    totalMale: 450,
    totalFemale: 490,
    grandTotal: 940,
    enrollmentPeriod: "Early Enrollment",
    enrollmentDates: "May 15-30, 2023"
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    // In a real application, you would fetch the data from your API
    // fetchEnrollmentData();
  }, []);

  const fetchEnrollmentData = async () => {
    setLoading(true);
    try {
      // This would be replaced with your actual API endpoint
      // const response = await axios.get(`http://localhost:3001/api/early-enrollment`, {
      //   params: {
      //     schoolYear: schoolData.schoolYear
      //   }
      // });
      // setEnrollmentData(response.data);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching early enrollment data:", error);
      setError("Failed to fetch early enrollment data");
      setLoading(false);
    }
  };

  const handleConvertToPdf = () => {
    const doc = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4"
    });

    const content = document.querySelector(".early-enrollment-container");
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
    <div className="early-enrollment-page">
      <div className="early-enrollment-container">
        <div className="early-enrollment-header">
          <div className="early-enrollment-header-logos">
            <img src="/deped-logo.png" alt="DepEd Logo" className="early-enrollment-logo" />
          </div>
          <div className="early-enrollment-header-text">
            <h1>Republic of the Philippines • Department of Education</h1>
            <h2>Region VII Central Visayas • Division of Bohol • District of Dauis</h2>
            <h2>LOURDES NATIONAL HIGH SCHOOL</h2>
            <h3>Dauis - Panglao Rd, Dauis, Bohol</h3>
            <h3>EARLY ENROLLMENT REPORT</h3>
          </div>
          <div className="early-enrollment-header-logos">
            <img src="/lnhs-logo.png" alt="School Logo" className="early-enrollment-logo" />
          </div>
        </div>

        <div className="early-enrollment-school-info">
          <div className="early-enrollment-info-item">
            <span className="early-enrollment-info-label">School Year:</span>
            <span>{schoolData.schoolYear}</span>
          </div>
          <div className="early-enrollment-info-item">
            <span className="early-enrollment-info-label">Enrollment Period:</span>
            <span>{enrollmentData.enrollmentPeriod}</span>
          </div>
          <div className="early-enrollment-info-item">
            <span className="early-enrollment-info-label">Enrollment Dates:</span>
            <span>{enrollmentData.enrollmentDates}</span>
          </div>
          <div className="early-enrollment-info-item">
            <span className="early-enrollment-info-label">Date Generated:</span>
            <span>{new Date().toLocaleDateString()}</span>
          </div>
        </div>

        <div className="early-enrollment-table-container">
          <table className="early-enrollment-table">
            <thead>
              <tr>
                <th>Grade Level</th>
                <th>Male</th>
                <th>Female</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(enrollmentData.grades).map(([grade, data]) => (
                <tr key={grade}>
                  <td>{grade}</td>
                  <td>{data.male}</td>
                  <td>{data.female}</td>
                  <td>{data.total}</td>
                </tr>
              ))}
              <tr className="early-enrollment-total-row">
                <td><strong>TOTAL</strong></td>
                <td><strong>{enrollmentData.totalMale}</strong></td>
                <td><strong>{enrollmentData.totalFemale}</strong></td>
                <td><strong>{enrollmentData.grandTotal}</strong></td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="early-enrollment-summary">
          <div className="early-enrollment-summary-item">
            <span className="early-enrollment-summary-label">Total Male Enrollees:</span>
            <span>{enrollmentData.totalMale}</span>
          </div>
          <div className="early-enrollment-summary-item">
            <span className="early-enrollment-summary-label">Total Female Enrollees:</span>
            <span>{enrollmentData.totalFemale}</span>
          </div>
          <div className="early-enrollment-summary-item">
            <span className="early-enrollment-summary-label">Grand Total:</span>
            <span>{enrollmentData.grandTotal}</span>
          </div>
        </div>

        <div className="early-enrollment-footer">
          <div className="early-enrollment-signature-section">
            <div className="early-enrollment-signature">
              <div className="early-enrollment-signature-line"></div>
              <div className="early-enrollment-signature-name">School Registrar</div>
              <div className="early-enrollment-signature-title">Teacher III</div>
            </div>
            <div className="early-enrollment-signature">
              <div className="early-enrollment-signature-line"></div>
              <div className="early-enrollment-signature-name">School Principal</div>
              <div className="early-enrollment-signature-title">Principal III</div>
            </div>
          </div>
        </div>
      </div>

      <div className="early-enrollment-buttons">
        <button onClick={handleConvertToPdf}>Print</button>
      </div>
    </div>
  );
}

export default EarlyEnrollment; 