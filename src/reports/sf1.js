import React, { useState, useEffect } from 'react';
import { jsPDF } from 'jspdf';
import axios from 'axios';
import '../CssFiles/sf1.css';

function SF1() {
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
      motherTongue: "Cebuano",
      ip: "N/A",
      religion: "Catholic",
      address: "Dauis, Bohol",
      fatherName: "Dela Cruz, Pedro",
      motherName: "Dela Cruz, Maria",
      guardianName: "Dela Cruz, Pedro",
      contact: "09123456789",
      remarks: ""
    },
    // Add more mock student data here
  ]);

  const handleConvertToPdf = () => {
    const doc = new jsPDF({
      orientation: "landscape",
      unit: "mm",
      format: "a4"
    });

    const content = document.querySelector(".sf1-container");
    if (content) {
      doc.html(content, {
        callback: function (doc) {
          window.open(doc.output("bloburl"), "_blank");
        },
        x: 10,
        y: 10,
        width: 277, // A4 landscape width
        windowWidth: 1000
      });
    }
  };

  return (
    <div className="sf1-page">
      <div className="sf1-container">
        <div className="sf1-header">
          <div className="sf1-logos">
            <img src="/deped-logo.png" alt="DepEd Logo" className="sf1-logo" />
            <img src="/lnhs-logo.png" alt="School Logo" className="sf1-logo" />
          </div>
          <div className="sf1-title">
            <h1>Department of Education</h1>
            <h2>SCHOOL REGISTER</h2>
            <h3>SF1</h3>
          </div>
        </div>

        <div className="sf1-school-info">
          <div className="sf1-info-row">
            <div className="sf1-info-item">
              <span>School Name: {schoolData.schoolName}</span>
            </div>
            <div className="sf1-info-item">
              <span>School ID: {schoolData.schoolId}</span>
            </div>
            <div className="sf1-info-item">
              <span>District: {schoolData.district}</span>
            </div>
          </div>
          <div className="sf1-info-row">
            <div className="sf1-info-item">
              <span>Division: {schoolData.division}</span>
            </div>
            <div className="sf1-info-item">
              <span>Region: {schoolData.region}</span>
            </div>
            <div className="sf1-info-item">
              <span>School Year: {schoolData.schoolYear}</span>
            </div>
          </div>
          <div className="sf1-info-row">
            <div className="sf1-info-item">
              <span>Grade Level: {schoolData.grade}</span>
            </div>
            <div className="sf1-info-item">
              <span>Section: {schoolData.section}</span>
            </div>
          </div>
        </div>

        <div className="sf1-table-container">
          <table className="sf1-table">
            <thead>
              <tr>
                <th rowSpan="2">LRN</th>
                <th rowSpan="2">LEARNER'S NAME<br/>(Last Name, First Name, Middle Name)</th>
                <th rowSpan="2">SEX<br/>(M/F)</th>
                <th rowSpan="2">BIRTH DATE<br/>(MM/DD/YYYY)</th>
                <th rowSpan="2">AGE as of<br/>First Friday<br/>of June</th>
                <th rowSpan="2">MOTHER TONGUE</th>
                <th rowSpan="2">IP<br/>(Ethnic Group)</th>
                <th rowSpan="2">RELIGION</th>
                <th rowSpan="2">ADDRESS</th>
                <th colSpan="3">PARENT'S/GUARDIAN'S NAME</th>
                <th rowSpan="2">CONTACT<br/>NUMBER</th>
                <th rowSpan="2">REMARKS</th>
              </tr>
              <tr>
                <th>FATHER</th>
                <th>MOTHER</th>
                <th>GUARDIAN</th>
              </tr>
            </thead>
            <tbody>
              {students.map((student, index) => (
                <tr key={index}>
                  <td>{student.lrn}</td>
                  <td>{student.name}</td>
                  <td>{student.sex}</td>
                  <td>{student.birthDate}</td>
                  <td>{student.age}</td>
                  <td>{student.motherTongue}</td>
                  <td>{student.ip}</td>
                  <td>{student.religion}</td>
                  <td>{student.address}</td>
                  <td>{student.fatherName}</td>
                  <td>{student.motherName}</td>
                  <td>{student.guardianName}</td>
                  <td>{student.contact}</td>
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