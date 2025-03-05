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
    {
      lrn: "123456789013",
      name: "Santos, Maria B.",
      sex: "F",
      birthDate: "2008-07-22",
      age: "15",
      motherTongue: "Cebuano",
      ip: "N/A",
      religion: "Catholic",
      address: "Panglao, Bohol",
      fatherName: "Santos, Jose",
      motherName: "Santos, Ana",
      guardianName: "Santos, Ana",
      contact: "09123456790",
      remarks: ""
    },
    {
      lrn: "123456789014",
      name: "Garcia, Michael C.",
      sex: "M",
      birthDate: "2008-03-10",
      age: "15",
      motherTongue: "Cebuano",
      ip: "N/A",
      religion: "Catholic",
      address: "Dauis, Bohol",
      fatherName: "Garcia, Roberto",
      motherName: "Garcia, Elena",
      guardianName: "Garcia, Roberto",
      contact: "09123456791",
      remarks: ""
    },
    {
      lrn: "123456789015",
      name: "Reyes, Angela D.",
      sex: "F",
      birthDate: "2008-09-05",
      age: "15",
      motherTongue: "Cebuano",
      ip: "N/A",
      religion: "Catholic",
      address: "Tagbilaran, Bohol",
      fatherName: "Reyes, Antonio",
      motherName: "Reyes, Carmen",
      guardianName: "Reyes, Carmen",
      contact: "09123456792",
      remarks: ""
    },
    {
      lrn: "123456789016",
      name: "Fernandez, John E.",
      sex: "M",
      birthDate: "2008-11-30",
      age: "15",
      motherTongue: "Cebuano",
      ip: "N/A",
      religion: "Protestant",
      address: "Dauis, Bohol",
      fatherName: "Fernandez, Manuel",
      motherName: "Fernandez, Sofia",
      guardianName: "Fernandez, Manuel",
      contact: "09123456793",
      remarks: ""
    },
    {
      lrn: "123456789017",
      name: "Lopez, Patricia F.",
      sex: "F",
      birthDate: "2008-02-14",
      age: "15",
      motherTongue: "Cebuano",
      ip: "N/A",
      religion: "Catholic",
      address: "Panglao, Bohol",
      fatherName: "Lopez, Ricardo",
      motherName: "Lopez, Isabel",
      guardianName: "Lopez, Isabel",
      contact: "09123456794",
      remarks: ""
    },
    {
      lrn: "123456789018",
      name: "Torres, David G.",
      sex: "M",
      birthDate: "2008-06-20",
      age: "15",
      motherTongue: "Cebuano",
      ip: "N/A",
      religion: "Catholic",
      address: "Dauis, Bohol",
      fatherName: "Torres, Fernando",
      motherName: "Torres, Victoria",
      guardianName: "Torres, Fernando",
      contact: "09123456795",
      remarks: ""
    },
    {
      lrn: "123456789019",
      name: "Ramos, Sofia H.",
      sex: "F",
      birthDate: "2008-04-25",
      age: "15",
      motherTongue: "Cebuano",
      ip: "N/A",
      religion: "INC",
      address: "Tagbilaran, Bohol",
      fatherName: "Ramos, Eduardo",
      motherName: "Ramos, Beatriz",
      guardianName: "Ramos, Beatriz",
      contact: "09123456796",
      remarks: ""
    },
    {
      lrn: "123456789020",
      name: "Gonzales, Marco I.",
      sex: "M",
      birthDate: "2008-08-12",
      age: "15",
      motherTongue: "Cebuano",
      ip: "N/A",
      religion: "Catholic",
      address: "Dauis, Bohol",
      fatherName: "Gonzales, Carlos",
      motherName: "Gonzales, Diana",
      guardianName: "Gonzales, Carlos",
      contact: "09123456797",
      remarks: ""
    },
    {
      lrn: "123456789021",
      name: "Diaz, Andrea J.",
      sex: "F",
      birthDate: "2008-10-08",
      age: "15",
      motherTongue: "Cebuano",
      ip: "N/A",
      religion: "Catholic",
      address: "Panglao, Bohol",
      fatherName: "Diaz, Miguel",
      motherName: "Diaz, Laura",
      guardianName: "Diaz, Laura",
      contact: "09123456798",
      remarks: ""
    },
    {
      lrn: "123456789022",
      name: "Mendoza, Christian K.",
      sex: "M",
      birthDate: "2008-01-15",
      age: "15",
      motherTongue: "Cebuano",
      ip: "Ati",
      religion: "Catholic",
      address: "Bilar, Bohol",
      fatherName: "Mendoza, Felipe",
      motherName: "Mendoza, Rosa",
      guardianName: "Mendoza, Felipe",
      contact: "09123456799",
      remarks: "IP Student"
    },
    {
      lrn: "123456789023",
      name: "Cruz, Isabella L.",
      sex: "F",
      birthDate: "2008-12-03",
      age: "15",
      motherTongue: "Tagalog",
      ip: "N/A",
      religion: "Born Again",
      address: "Dauis, Bohol",
      fatherName: "Cruz, Benjamin",
      motherName: "Cruz, Martha",
      guardianName: "Cruz, Martha",
      contact: "09123456800",
      remarks: "Transferred from Manila"
    },
    {
      lrn: "123456789024",
      name: "Bautista, Rafael M.",
      sex: "M",
      birthDate: "2008-05-28",
      age: "15",
      motherTongue: "Cebuano",
      ip: "N/A",
      religion: "Muslim",
      address: "Tagbilaran, Bohol",
      fatherName: "Bautista, Omar",
      motherName: "Bautista, Fatima",
      guardianName: "Bautista, Omar",
      contact: "09123456801",
      remarks: ""
    },
    {
      lrn: "123456789025",
      name: "Villanueva, Emma N.",
      sex: "F",
      birthDate: "2007-09-18",
      age: "16",
      motherTongue: "Cebuano",
      ip: "N/A",
      religion: "Seventh Day Adventist",
      address: "Panglao, Bohol",
      fatherName: "N/A",
      motherName: "Villanueva, Teresa",
      guardianName: "Villanueva, Teresa",
      contact: "09123456802",
      remarks: "Repeater"
    },
    {
      lrn: "123456789026",
      name: "Pascual, Gabriel O.",
      sex: "M",
      birthDate: "2008-07-07",
      age: "15",
      motherTongue: "Waray",
      ip: "N/A",
      religion: "Catholic",
      address: "Dauis, Bohol",
      fatherName: "Pascual, Ramon",
      motherName: "Pascual, Clara",
      guardianName: "Pascual, Ramon",
      contact: "09123456803",
      remarks: "Transferred from Samar"
    },
    {
      lrn: "123456789027",
      name: "Samonte, Hannah P.",
      sex: "F",
      birthDate: "2008-03-30",
      age: "15",
      motherTongue: "Cebuano",
      ip: "Badjao",
      religion: "Islam",
      address: "Tagbilaran, Bohol",
      fatherName: "Samonte, Ibrahim",
      motherName: "Samonte, Amina",
      guardianName: "Samonte, Amina",
      contact: "09123456804",
      remarks: "IP Student"
    },
    {
      lrn: "123456789028",
      name: "Lim, Matthew Q.",
      sex: "M",
      birthDate: "2008-08-21",
      age: "15",
      motherTongue: "Cebuano",
      ip: "N/A",
      religion: "Buddhist",
      address: "Dauis, Bohol",
      fatherName: "Lim, Robert",
      motherName: "Lim, Grace",
      guardianName: "Lim, Grace",
      contact: "09123456805",
      remarks: ""
    },
    {
      lrn: "123456789029",
      name: "Santos, Sophia R.",
      sex: "F",
      birthDate: "2009-01-05",
      age: "14",
      motherTongue: "Cebuano",
      ip: "N/A",
      religion: "Catholic",
      address: "Panglao, Bohol",
      fatherName: "Santos, David",
      motherName: "Deceased",
      guardianName: "Santos, David",
      contact: "09123456806",
      remarks: "Accelerated"
    },
    {
      lrn: "123456789030",
      name: "Aguilar, Lucas S.",
      sex: "M",
      birthDate: "2008-04-12",
      age: "15",
      motherTongue: "Cebuano",
      ip: "N/A",
      religion: "Methodist",
      address: "Dauis, Bohol",
      fatherName: "Unknown",
      motherName: "Aguilar, Patricia",
      guardianName: "Aguilar, Patricia",
      contact: "09123456807",
      remarks: ""
    },
    {
      lrn: "123456789031",
      name: "Reyes, Julia T.",
      sex: "F",
      birthDate: "2008-06-25",
      age: "15",
      motherTongue: "Cebuano",
      ip: "N/A",
      religion: "Catholic",
      address: "Tagbilaran, Bohol",
      fatherName: "Reyes, Mario",
      motherName: "Reyes, Linda",
      guardianName: "Reyes, Linda",
      contact: "09123456808",
      remarks: "PWD - Hearing Impaired"
    }
  ]);

  const handleConvertToPdf = () => {
    const doc = new jsPDF({
      orientation: "landscape",
      unit: "mm",
      format: [355.6, 215.9]  // Legal size paper in landscape (14 x 8.5 inches)
    });

    const content = document.querySelector(".sf1-container");
    if (content) {
      doc.html(content, {
        callback: function (doc) {
          window.open(doc.output("bloburl"), "_blank");
        },
        x: 10,
        y: 10,
        width: 335,  // Slightly less than paper width to ensure margins
        windowWidth: 1100  // Match container width
      });
    }
  };

  return (
    <div className="sf1-page">
      <div className="sf1-container">
        <div className="sf1-header">
          <div className="sf1-header-logos">
            <img src="/deped-logo.png" alt="DepEd Logo" className="sf1-logo" />
          </div>
          <div className="sf1-header-text">
            <h1>Republic of the Philippines • Department of Education</h1>
            <h2>Region VII Central Visayas • Division of Bohol • District of Dauis</h2>
            <h2>LOURDES NATIONAL HIGH SCHOOL</h2>
            <h3>Dauis - Panglao Rd, Dauis, Bohol</h3>
            <h3>SCHOOL REGISTER (SF1)</h3>
          </div>
          <div className="sf1-header-logos">
            <img src="/lnhs-logo.png" alt="School Logo" className="sf1-logo" />
          </div>
        </div>

        <div className="sf1-school-info">
          <div className="sf1-info-item">
            <span className="sf1-info-label">School Name:</span>
            <span>{schoolData.schoolName}</span>
          </div>
          <div className="sf1-info-item">
            <span className="sf1-info-label">School ID:</span>
            <span>{schoolData.schoolId}</span>
          </div>
          <div className="sf1-info-item">
            <span className="sf1-info-label">District:</span>
            <span>{schoolData.district}</span>
          </div>
          <div className="sf1-info-item">
            <span className="sf1-info-label">Division:</span>
            <span>{schoolData.division}</span>
          </div>
          <div className="sf1-info-item">
            <span className="sf1-info-label">Region:</span>
            <span>{schoolData.region}</span>
          </div>
          <div className="sf1-info-item">
            <span className="sf1-info-label">School Year:</span>
            <span>{schoolData.schoolYear}</span>
          </div>
          <div className="sf1-info-item">
            <span className="sf1-info-label">Grade Level:</span>
            <span>{schoolData.grade}</span>
          </div>
          <div className="sf1-info-item">
            <span className="sf1-info-label">Section:</span>
            <span>{schoolData.section}</span>
          </div>
        </div>

        <div className="sf1-table-container">
          <table className="sf1-table">
            <thead>
              <tr>
                <th>LRN</th>
                <th>LEARNER'S NAME<br/>(Last Name,<br/>First Name,<br/>Middle Name)</th>
                <th>SEX<br/>(M/F)</th>
                <th>BIRTH DATE<br/>(MM/DD/YYYY)</th>
                <th>AGE as of<br/>First<br/>Friday<br/>of June</th>
                <th>MOTHER<br/>TONGUE</th>
                <th>IP<br/>(Ethnic<br/>Group)</th>
                <th>RELIGION</th>
                <th>ADDRESS</th>
                <th>FATHER</th>
                <th>MOTHER</th>
                <th>GUARDIAN</th>
                <th>REMARKS</th>
              </tr>
            </thead>
            <tbody>
              {students.map((student, index) => (
                <tr key={index}>
                  <td>{student.lrn}</td>
                  <td>{student.name}</td>
                  <td>{student.sex}</td>
                  <td>{new Date(student.birthDate).toLocaleDateString('en-US', {
                    month: '2-digit',
                    day: '2-digit',
                    year: 'numeric'
                  })}</td>
                  <td>{student.age}</td>
                  <td>{student.motherTongue}</td>
                  <td>{student.ip}</td>
                  <td>{student.religion}</td>
                  <td>{student.address}</td>
                  <td>{student.fatherName}</td>
                  <td>{student.motherName}</td>
                  <td>{student.guardianName}</td>
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