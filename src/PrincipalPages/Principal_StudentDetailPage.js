import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { FiX } from 'react-icons/fi';
import '../CssPage/Principal_StudentDetailPage.css';

const Principal_StudentDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [studentDetails, setStudentDetails] = useState(null);
  const [grades, setGrades] = useState([]);
  const [attendanceData, setAttendanceData] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchStudentDetails = async () => {
      try {
        const response = await axios.get(`http://localhost:3001/students/${id}/details`);
        const details = response.data[0];
        if (details.birthdate) {
          const birthdate = new Date(details.birthdate);
          details.birthdate = birthdate.toLocaleDateString('en-US', { year: 'numeric', month: '2-digit', day: '2-digit' });
        }
        setStudentDetails(details);
      } catch (error) {
        setError('There was an error fetching the student details!');
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    const fetchStudentGrades = async () => {
      try {
        const response = await axios.get(`http://localhost:3001/students/${id}/grades`);
        setGrades(response.data);
      } catch (error) {
        console.error('There was an error fetching the student grades!', error);
      }
    };

    const fetchStudentAttendance = async () => {
      try {
        const response = await axios.get(`http://localhost:3001/attendance/${id}`);
        setAttendanceData(response.data);
      } catch (error) {
        console.error('There was an error fetching the student attendance!', error);
      }
    };

    fetchStudentDetails();
    fetchStudentGrades();
    fetchStudentAttendance();
  }, [id]);

  const handleDownload = async () => {
    const doc = new jsPDF('p', 'pt', 'letter');
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 72; // 1 inch margin

    const addSectionToPDF = async (elementId, sectionTitle) => {
      const canvas = await html2canvas(document.getElementById(elementId), { scale: 2 });
      const imgData = canvas.toDataURL('image/png');
      const imgProps = doc.getImageProperties(imgData);
      const imgHeight = (imgProps.height * (pageWidth - margin * 2)) / imgProps.width;

      doc.addPage();
      doc.setFontSize(18);
      doc.text(`${studentDetails.firstname} ${studentDetails.lastname}`, margin, margin);
      doc.text(sectionTitle, margin, margin + 20);
      doc.addImage(imgData, 'PNG', margin, margin + 40, pageWidth - margin * 2, imgHeight);
    };

    const detailsCanvas = await html2canvas(document.getElementById('student-detail-details'), { scale: 2 });
    const detailsImgData = detailsCanvas.toDataURL('image/png');
    const detailsImgProps = doc.getImageProperties(detailsImgData);
    const detailsImgHeight = (detailsImgProps.height * (pageWidth - margin * 2)) / detailsImgProps.width;

    doc.setFontSize(18);
    doc.text(`${studentDetails.firstname} ${studentDetails.lastname}`, margin, margin);
    doc.addImage(detailsImgData, 'PNG', margin, margin + 20, pageWidth - margin * 2, detailsImgHeight);

    await addSectionToPDF('student-detail-grades', '');
    await addSectionToPDF('student-detail-attendance', '');

    doc.save(`${studentDetails.firstname}_${studentDetails.lastname}_Details.pdf`);
  };

  const handleClose = () => {
    navigate(-1);
  };

  const headerMapping = {
    studentId: "Student ID",
    lastname: "Last Name",
    firstname: "First Name",
    middlename: "Middle Name",
    currentYearLevel: "Current Year Level",
    birthdate: "Birthdate",
    gender: "Gender",
    age: "Age",
    homeAddress: "Home Address",
    barangay: "Barangay",
    cityMunicipality: "City/Municipality",
    province: "Province",
    contactNumber: "Contact Number",
    emailAddress: "Email Address",
    motherName: "Mother's Name",
    fatherName: "Father's Name",
    parentAddress: "Parent Address",
    fatherOccupation: "Father's Occupation",
    motherOccupation: "Mother's Occupation",
    annualHouseholdIncome: "Annual Household Income",
    numberOfSiblings: "Number of Siblings",
    fatherEducationLevel: "Father's Education Level",
    motherEducationLevel: "Mother's Education Level",
    fatherContactNumber: "Father's Contact Number",
    motherContactNumber: "Mother's Contact Number",
    status: "Status",
    schoolYear: "School Year"
  };

  const transformKey = (key) => {
    return headerMapping[key] || key;
  };

  const calculateFinalGrade = (grades) => {
    const total = grades.reduce((sum, grade) => sum + grade, 0);
    return (total / grades.length).toFixed(2);
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>{error}</div>;
  }

  if (!studentDetails) {
    return <div>No details available for this student.</div>;
  }

  return (
    <div className="studentdetail-container">
      <h1 className="studentdetail-title">Student Details</h1>
      <p className="studentdetail-name-header">{`${studentDetails.firstname} ${studentDetails.lastname}`}</p>
      <div id="student-detail-details">
        <table className="studentdetail-table">
          <tbody>
            {Object.entries(studentDetails).map(([key, value]) => (
              <tr key={key}>
                <th>{transformKey(key)}</th>
                <td>{value}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div id="student-detail-grades" className="studentdetail-grades-section">
        <h2>Grades</h2>
        {grades.length > 0 ? (
          <table className="studentdetail-grades-table">
            <thead>
              <tr>
                <th colSpan="6" style={{ textAlign: 'left' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', paddingRight: '40px' }}>
                    <span>Grade Level: {grades[0].grade_level}</span>
                    <span>School Year: {grades[0].school_year}</span>
                  </div>
                </th>
              </tr>
              <tr>
                <th>Subject</th>
                <th>Q1</th>
                <th>Q2</th>
                <th>Q3</th>
                <th>Q4</th>
                <th>Final Grade</th>
              </tr>
            </thead>
            <tbody>
              {grades.map((grade, index) => (
                <tr key={index}>
                  <td>{grade.subject_name}</td>
                  <td>{grade.q1_grade}</td>
                  <td>{grade.q2_grade}</td>
                  <td>{grade.q3_grade}</td>
                  <td>{grade.q4_grade}</td>
                  <td>{calculateFinalGrade([grade.q1_grade, grade.q2_grade, grade.q3_grade, grade.q4_grade])}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p>No grades available.</p>
        )}
      </div>
      <div id="student-detail-attendance" className="studentdetail-attendance-section">
        <h2>Attendance</h2>
        {attendanceData && Object.keys(attendanceData).length > 0 ? (
          <table className="studentdetail-attendance-table">
            <thead>
              <tr>
                <th colSpan="2" style={{ textAlign: 'left' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', paddingRight: '40px' }}>
                    <span>Grade Level: {grades.length > 0 ? grades[0].grade_level : ''}</span>
                    <span>School Year: {grades.length > 0 ? grades[0].school_year : ''}</span>
                  </div>
                </th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <th>Total School Days</th>
                <td>{attendanceData.total_school_days}</td>
              </tr>
              <tr>
                <th>Total Days Present</th>
                <td>{attendanceData.days_present}</td>
              </tr>
              <tr>
                <th>Total Days Absent</th>
                <td>{attendanceData.days_absent}</td>
              </tr>
              <tr>
                <th>Total Days Late</th>
                <td>{attendanceData.days_late}</td>
              </tr>
              <tr>
                <th>Brigada Attendance</th>
                <td>{attendanceData.brigada_attendance}</td>
              </tr>
            </tbody>
          </table>
        ) : (
          <p>No attendance records available.</p>
        )}
      </div>
      <button className="studentdetail-download-button" onClick={handleDownload}>Download PDF</button>
      <button className="studentdetail-close-button" onClick={handleClose}><FiX /></button>
    </div>
  );
};

export default Principal_StudentDetailPage;
