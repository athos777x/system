import { useLocation } from 'react-router-dom';
import React, { useState, useEffect } from 'react';
import { jsPDF } from 'jspdf';
import axios from 'axios';
import '../CssFiles/sf2.css';

function SF2() {
  const [schoolData, setSchoolData] = useState({
    schoolName: "SAMPLE ELEMENTARY SCHOOL",
    schoolId: "123456",
    district: "SAMPLE DISTRICT",
    division: "SAMPLE DIVISION",
    region: "REGION IV",
    schoolYear: "2023-2024",
    month: "SEPTEMBER",
    grade: "GRADE 2",
    section: "LOVE"
  });

  const location = useLocation();
  const schoolYearId = location.state?.schoolYearId;
  const initialDate = location.state?.date ? new Date(location.state.date) : new Date();
  const [attendanceData, setAttendanceData] = useState(null);
  const [selectedDate, setSelectedDate] = useState(initialDate);
  const [selectedMonth, setSelectedMonth] = useState(location.state?.month || initialDate.toLocaleString('default', { month: 'long' }));
  const [selectedYear, setSelectedYear] = useState(initialDate.getFullYear());
  const [gradeLevel, setGradeLevel] = useState(location.state?.grade || "7");
  const [section, setSection] = useState(location.state?.section || "A");

  // Mock data for testing
  const mockData = {
    schoolYear: "2023-2024",
    students: [
      { studentId: "1001", studentName: "AGUILAR, Juan Miguel C.", gender: "M" },
      { studentId: "1002", studentName: "BUENAVENTURA, Carlos P.", gender: "M" },
      { studentId: "1003", studentName: "CRUZ, Roberto D.", gender: "M" },
      { studentId: "1004", studentName: "DELA CRUZ, Miguel Antonio S.", gender: "M" },
      { studentId: "1005", studentName: "ENRIQUEZ, Jose Mari B.", gender: "M" },
      { studentId: "1006", studentName: "FERNANDO, Paul Vincent L.", gender: "M" },
      { studentId: "1007", studentName: "GARCIA, Rafael T.", gender: "M" },
      { studentId: "1008", studentName: "HERNANDEZ, Christian D.", gender: "M" },
      { studentId: "1009", studentName: "IGNACIO, Martin A.", gender: "M" },
      { studentId: "1010", studentName: "JIMENEZ, Angel David P.", gender: "M" },
      { studentId: "1011", studentName: "AQUINO, Maria Luisa B.", gender: "F" },
      { studentId: "1012", studentName: "BAUTISTA, Angela Rose C.", gender: "F" },
      { studentId: "1013", studentName: "CASTILLO, Sofia Grace T.", gender: "F" },
      { studentId: "1014", studentName: "DIZON, Jessica Mae P.", gender: "F" },
      { studentId: "1015", studentName: "ESPERANZA, Gabriela C.", gender: "F" },
      { studentId: "1016", studentName: "FLORES, Maria Theresa L.", gender: "F" },
      { studentId: "1017", studentName: "GONZALES, Jillian Claire K.", gender: "F" },
      { studentId: "1018", studentName: "HERNANDEZ, Isabel Joy O.", gender: "F" },
      { studentId: "1019", studentName: "IGLESIAS, Patricia Anne S.", gender: "F" },
      { studentId: "1020", studentName: "JIMENEZ, Samantha Nicole D.", gender: "F" }
    ]
  };

  useEffect(() => {
    // Use the mock data instead of fetching from the API
    setAttendanceData(mockData);
    
    // Keep the original fetch code commented for when you're ready to connect to the backend
    /*
    if (!schoolYearId) return;
  
    const fetchAttendance = async () => {
      try {
        const formattedDate = selectedDate.toISOString().split('T')[0];
        const url = `http://localhost:3001/api/sf2-attendance?school_year_id=${schoolYearId}&date=${formattedDate}&grade=${gradeLevel}&section=${section}`;
        const res = await fetch(url);
        const data = await res.json();
        setAttendanceData(data);
      } catch (err) {
        console.error("Error fetching SF2 attendance data:", err);
      }
    };
  
    fetchAttendance();
    */
  }, [schoolYearId, selectedDate, gradeLevel, section]);

  const handleConvertToPdf = () => {
    const doc = new jsPDF({
      orientation: "landscape",
      unit: "mm",
      format: "a4"
    });

    const content = document.querySelector(".sf2-container");
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

  // Helper function to generate the date columns for the month
  const generateDateColumns = () => {
    // Always create 4 sets of weekdays (M T W Th F) for a month
    const columns = [];
    
    // Create 4 weeks (M-F) = 20 columns
    for (let week = 0; week < 4; week++) {
      // For each day of the week (Monday to Friday)
      for (let day = 1; day <= 5; day++) {
        let dayAbbr;
        switch (day) {
          case 1: dayAbbr = "M"; break;
          case 2: dayAbbr = "T"; break;
          case 3: dayAbbr = "W"; break;
          case 4: dayAbbr = "Th"; break;
          case 5: dayAbbr = "F"; break;
          default: dayAbbr = "";
        }
        
        columns.push(
          <td key={`day-${week}-${day}`} className="sf2-date-cell">
            <div className="sf2-day">{dayAbbr}</div>
          </td>
        );
      }
    }
    
    return columns;
  };

  // Helper function to generate blank cells for dates
  const generateDateBlankCells = () => {
    const cells = [];
    
    // Create 4 weeks (M-F) = 20 columns
    for (let week = 0; week < 4; week++) {
      // For each day of the week (Monday to Friday)
      for (let day = 1; day <= 5; day++) {
        // Calculate the date number (1-20)
        const dateNum = week * 5 + day;
        
        cells.push(
          <td key={`date-blank-${week}-${day}`} className="sf2-date-blank-cell">
            {dateNum}
          </td>
        );
      }
    }
    
    return cells;
  };

  // Helper function to calculate monthly totals for a student
  const calculateMonthlyTotals = (student) => {
    let absentCount = 0;
    let tardyCount = 0;
    
    // Create 4 weeks (M-F) = 20 days
    for (let week = 0; week < 4; week++) {
      // For each day of the week (Monday to Friday)
      for (let day = 1; day <= 5; day++) {
        // Calculate a unique day index
        const dayIndex = week * 5 + day;
        
        // Using student ID and day index as seed for pseudorandom
        const seed = ((student.studentId || 0) + dayIndex) % 100;
        
        // AM status
        if (seed % 10 === 1) absentCount += 0.5;
        else if (seed % 10 === 2) tardyCount += 0.5;
        
        // PM status
        if ((seed + 3) % 10 === 1) absentCount += 0.5;
        else if ((seed + 3) % 10 === 2) tardyCount += 0.5;
      }
    }
    
    return { absent: absentCount, tardy: tardyCount };
  };

  // Helper function to generate attendance cells for a student
  const generateAttendanceCells = (student) => {
    const cells = [];
    
    // Create 4 weeks (M-F) = 20 columns
    for (let week = 0; week < 4; week++) {
      // For each day of the week (Monday to Friday)
      for (let day = 1; day <= 5; day++) {
        // Calculate a unique day index to maintain consistent random data
        const dayIndex = week * 5 + day;
        
        // Using student ID and day index as seed for pseudorandom (for consistent rendering)
        const seed = ((student.studentId || 0) + dayIndex) % 100;
        
        // AM status
        const amStatus = (seed % 10 === 1 ? 'absent' : (seed % 10 === 2 ? 'tardy' : ''));
        
        // PM status
        const pmStatus = ((seed + 3) % 10 === 1 ? 'absent' : ((seed + 3) % 10 === 2 ? 'tardy' : ''));
        
        cells.push(
          <td key={`attendance-${student.studentId}-${week}-${day}`} className="sf2-attendance-cell">
            <div className="sf2-attendance-diagonal">
              <div className={`sf2-attendance-am ${amStatus}`}></div>
              <div className={`sf2-attendance-pm ${pmStatus}`}></div>
            </div>
          </td>
        );
      }
    }
    
    return cells;
  };

  // Calculate daily totals for all students
  const calculateDailyTotals = () => {
    if (!attendanceData) return [];
    
    const dailyTotals = [];
    
    // Create 4 weeks (M-F) = 20 columns
    for (let week = 0; week < 4; week++) {
      // For each day of the week (Monday to Friday)
      for (let day = 1; day <= 5; day++) {
        // Calculate a unique day index
        const dayIndex = week * 5 + day;
        
        let presentCount = 0;
        let absentCount = 0;
        let tardyCount = 0;
        
        // Count attendance for all students on this day
        attendanceData.students.forEach(student => {
          const seed = ((student.studentId || 0) + dayIndex) % 100;
          
          // AM status
          if (seed % 10 === 1) absentCount += 0.5;
          else if (seed % 10 === 2) tardyCount += 0.5;
          else presentCount += 0.5;
          
          // PM status
          if ((seed + 3) % 10 === 1) absentCount += 0.5;
          else if ((seed + 3) % 10 === 2) tardyCount += 0.5;
          else presentCount += 0.5;
        });
        
        dailyTotals.push({ 
          present: presentCount.toFixed(1), 
          absent: absentCount.toFixed(1), 
          tardy: tardyCount.toFixed(1) 
        });
      }
    }
    
    return dailyTotals;
  };

  // Calculate summary statistics for the report
  const calculateSummary = () => {
    if (!attendanceData) return {
      daysOfClasses: 0,
      enrollment: { male: 0, female: 0, total: 0 },
      lateEnrollment: { male: 0, female: 0, total: 0 },
      registeredLearners: { male: 0, female: 0, total: 0 },
      percentageEnrollment: { male: 0, female: 0, total: 0 },
      avgDailyAttendance: { male: 0, female: 0, total: 0 },
      percentageAttendance: { male: 0, female: 0, total: 0 },
      absentFiveDays: { male: 0, female: 0, total: 0 },
      dropout: { male: 0, female: 0, total: 0 },
      transferredOut: { male: 0, female: 0, total: 0 },
      transferredIn: { male: 0, female: 0, total: 0 }
    };
    
    // Always 20 school days (4 weeks of weekdays)
    const schoolDays = 20;
    
    // Count students by gender
    const maleStudents = attendanceData.students.filter(student => student.gender === 'M');
    const femaleStudents = attendanceData.students.filter(student => student.gender === 'F');
    
    // Calculate average attendance
    let malePresentTotal = 0;
    let femalePresentTotal = 0;
    
    maleStudents.forEach(student => {
      // 4 weeks of 5 days each = 20 days
      for (let week = 0; week < 4; week++) {
        for (let day = 1; day <= 5; day++) {
          const dayIndex = week * 5 + day;
          const seed = ((student.studentId || 0) + dayIndex) % 100;
          
          // AM status
          if (seed % 10 !== 1 && seed % 10 !== 2) malePresentTotal += 0.5;
          
          // PM status
          if ((seed + 3) % 10 !== 1 && (seed + 3) % 10 !== 2) malePresentTotal += 0.5;
        }
      }
    });
    
    femaleStudents.forEach(student => {
      // 4 weeks of 5 days each = 20 days
      for (let week = 0; week < 4; week++) {
        for (let day = 1; day <= 5; day++) {
          const dayIndex = week * 5 + day;
          const seed = ((student.studentId || 0) + dayIndex) % 100;
          
          // AM status
          if (seed % 10 !== 1 && seed % 10 !== 2) femalePresentTotal += 0.5;
          
          // PM status
          if ((seed + 3) % 10 !== 1 && (seed + 3) % 10 !== 2) femalePresentTotal += 0.5;
        }
      }
    });
    
    const maleAvgDailyAttendance = maleStudents.length > 0 ? 
      (malePresentTotal / (maleStudents.length * schoolDays)) * 100 : 0;
    
    const femaleAvgDailyAttendance = femaleStudents.length > 0 ? 
      (femalePresentTotal / (femaleStudents.length * schoolDays)) * 100 : 0;
    
    const totalAvgDailyAttendance = attendanceData.students.length > 0 ? 
      ((malePresentTotal + femalePresentTotal) / (attendanceData.students.length * schoolDays)) * 100 : 0;
    
    // For demonstration purposes, we'll set some sample values for the other statistics
    return {
      daysOfClasses: schoolDays,
      enrollment: { 
        male: maleStudents.length, 
        female: femaleStudents.length, 
        total: attendanceData.students.length 
      },
      lateEnrollment: { male: 0, female: 0, total: 0 },
      registeredLearners: { 
        male: maleStudents.length, 
        female: femaleStudents.length, 
        total: attendanceData.students.length 
      },
      percentageEnrollment: { male: 100, female: 100, total: 100 },
      avgDailyAttendance: { 
        male: maleAvgDailyAttendance.toFixed(1), 
        female: femaleAvgDailyAttendance.toFixed(1), 
        total: totalAvgDailyAttendance.toFixed(1) 
      },
      percentageAttendance: { 
        male: maleAvgDailyAttendance.toFixed(1), 
        female: femaleAvgDailyAttendance.toFixed(1), 
        total: totalAvgDailyAttendance.toFixed(1) 
      },
      absentFiveDays: { male: 0, female: 0, total: 0 },
      dropout: { male: 0, female: 0, total: 0 },
      transferredOut: { male: 0, female: 0, total: 0 },
      transferredIn: { male: 0, female: 0, total: 0 }
    };
  };

  return (
    <div className="sf2-page">
      <div className="sf2-container">
        <div className="sf2-header">
          <div className="sf2-header-logos">
            <img src="/deped-logo.png" alt="DepEd Logo" className="sf2-logo" />
          </div>
          <div className="sf2-header-text">
            <h1>Republic of the Philippines • Department of Education</h1>
            <h2>Region VII Central Visayas • Division of Bohol • District of Dauis</h2>
            <h2>LOURDES NATIONAL HIGH SCHOOL</h2>
            <h3>Dauis - Panglao Rd, Dauis, Bohol</h3>
          </div>
          <div className="sf2-header-logos">
            <img src="/lnhs-logo.png" alt="School Logo" className="sf2-logo" />
          </div>
        </div>

        <div className="sf2-title">
          <h2>School Form 2 (SF2) Daily Attendance Report of Learners</h2>
          <p>(This replaces Form 1, Form 2 & STS Form 4 - Absenteeism and Dropout Profile)</p>
        </div>

        <div className="sf2-form-info">
          <div className="sf2-form-row">
            <div className="sf2-form-group">
              <label>School ID:</label>
              <input type="text" value={schoolData.schoolId} readOnly />
            </div>
            <div className="sf2-form-group">
              <label>School Year:</label>
              <input type="text" value={attendanceData ? attendanceData.schoolYear : ""} readOnly />
            </div>
            <div className="sf2-form-group">
              <label>Report for the Month of:</label>
              <input type="text" value={selectedMonth} readOnly />
            </div>
          </div>
          <div className="sf2-form-row">
            <div className="sf2-form-group sf2-school-name">
              <label>Name of School:</label>
              <input type="text" value={schoolData.schoolName} readOnly />
            </div>
            <div className="sf2-form-group">
              <label>Grade Level:</label>
              <input type="text" value={gradeLevel} readOnly />
            </div>
            <div className="sf2-form-group">
              <label>Section:</label>
              <input type="text" value={section} readOnly />
            </div>
          </div>
        </div>

        <div className="sf2-table-container">
          <table className="sf2-table">
            <thead>
              <tr>
                <th rowSpan="3" className="sf2-learner-name-header">LEARNER'S NAME<br />(Last Name, First Name, Middle Name)</th>
                <th colSpan="20" className="sf2-date-header">(1st row for date)</th>
                <th colSpan="2" rowSpan="2" className="sf2-total-header">Total for the Month</th>
                <th rowSpan="3" className="sf2-remarks-header">REMARKS (if DROPPED OUT, state reason, please refer to legend number 2.<br />if TRANSFERRED IN/OUT, write the name of School.)</th>
              </tr>
              <tr>
                <th colSpan="5" className="sf2-week-header">Week 1</th>
                <th colSpan="5" className="sf2-week-header">Week 2</th>
                <th colSpan="5" className="sf2-week-header">Week 3</th>
                <th colSpan="5" className="sf2-week-header">Week 4</th>
              </tr>
              <tr>
                {generateDateBlankCells()}
                <th className="sf2-total-column">ABSENT</th>
                <th className="sf2-total-column">TARDY</th>
              </tr>
              <tr>
                <th className="sf2-days-header"></th>
                {generateDateColumns()}
                <th className="sf2-total-column"></th>
                <th className="sf2-total-column"></th>
                <th className="sf2-remarks-header"></th>
              </tr>
            </thead>
            <tbody>
              {attendanceData ? (
                <>
                  {/* Male Students Section */}
                  {attendanceData.students.filter(student => student.gender === 'M').map((student) => (
                    <tr key={student.studentId}>
                      <td className="sf2-student-name">{student.studentName}</td>
                      {generateAttendanceCells(student)}
                      <td className="sf2-total-cell">{calculateMonthlyTotals(student).absent}</td>
                      <td className="sf2-total-cell">{calculateMonthlyTotals(student).tardy}</td>
                      <td className="sf2-remarks-cell">{/* Remarks */}</td>
                    </tr>
                  ))}
                  <tr className="sf2-total-row">
                    <td colSpan="24" className="sf2-male-total">
                      ⟸ MALE | TOTAL Per Day ⟹
                    </td>
                  </tr>
                  
                  {/* Female Students Section */}
                  {attendanceData.students.filter(student => student.gender === 'F').map((student) => (
                    <tr key={student.studentId}>
                      <td className="sf2-student-name">{student.studentName}</td>
                      {generateAttendanceCells(student)}
                      <td className="sf2-total-cell">{calculateMonthlyTotals(student).absent}</td>
                      <td className="sf2-total-cell">{calculateMonthlyTotals(student).tardy}</td>
                      <td className="sf2-remarks-cell">{/* Remarks */}</td>
                    </tr>
                  ))}
                  <tr className="sf2-total-row">
                    <td colSpan="24" className="sf2-female-total">
                      ⟸ FEMALE | TOTAL Per Day ⟹
                    </td>
                  </tr>
                  
                  {/* Combined Total */}
                  <tr className="sf2-combined-total-row">
                    <td className="sf2-combined-total">Combined TOTAL PER DAY</td>
                    {/* Generate cells for each day of the month for combined total */}
                    {calculateDailyTotals().map((total, index) => (
                      <td key={`combined-total-${index+1}`} className="sf2-combined-total-cell">
                        <span className="sf2-daily-total-values">
                          P:{total.present}<br/>
                          A:{total.absent}<br/>
                          T:{total.tardy}
                        </span>
                      </td>
                    ))}
                    <td className="sf2-combined-total-cell">
                      <span className="sf2-daily-total-values">
                        {attendanceData.students.reduce((sum, student) => sum + calculateMonthlyTotals(student).absent, 0).toFixed(1)}
                      </span>
                    </td>
                    <td className="sf2-combined-total-cell">
                      <span className="sf2-daily-total-values">
                        {attendanceData.students.reduce((sum, student) => sum + calculateMonthlyTotals(student).tardy, 0).toFixed(1)}
                      </span>
                    </td>
                    <td className="sf2-combined-total-cell"></td>
                  </tr>
                </>
              ) : (
                <tr><td colSpan="24">Loading attendance data...</td></tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="sf2-guidelines-container">
          <div className="sf2-guidelines">
            <h3>GUIDELINES:</h3>
            <ol>
              <li>The attendance shall be accomplished daily. Refer to the codes for checking learner's attendance.</li>
              <li>Dates shall be written in the columns after Learner's Name.</li>
              <li>To compute the following:</li>
              <ul>
                <li>Percentage of Enrollment = (Registered Learners as of end of the month ÷ Enrollment as of 1st Friday of the school year) × 100</li>
                <li>Average Daily Attendance = (Total Attendance ÷ Number of School Days in reporting month) × 100</li>
                <li>Percentage of Attendance = (Average daily attendance ÷ Registered Learners as of end of the month) × 100</li>
              </ul>
              <li>Every end of the month, the class adviser will submit this form to the office of the principal for recording of summary table into School Form 4. Once signed by the principal, this form should be returned to the adviser.</li>
              <li>The adviser will provide necessary interventions including but not limited to home visitation to learners who were absent for 5 consecutive days and/or those at risk of dropping out.</li>
              <li>Attendance performance of learners will be reflected in Form 137 and Form 138 every grading period.</li>
              <li>Beginning of School Year cut-off report is every 1st Friday of the School Year.</li>
            </ol>
          </div>

          <div className="sf2-codes">
            <h3>1. CODES FOR CHECKING ATTENDANCE</h3>
            <p>(blank) - Present | (A) Absent - Tardy (half shade); Upper for Late</p>
            <p>T - Truant (Absent without valid reason); L - Lower for Cutting Classes)</p>
            
            <h3>2. REASONS/CAUSES FOR DROPPING OUT</h3>
            <h4>a. Student-Related Factors</h4>
            <ol>
              <li>Had to take care of siblings</li>
              <li>Early marriage/pregnancy</li>
              <li>Parents' attitude toward schooling</li>
              <li>Illness</li>
              <li>Overage</li>
              <li>Death</li>
              <li>Drug Abuse</li>
              <li>Poor academic performance</li>
              <li>Lack of interest/Distractions</li>
              <li>Too far from home</li>
            </ol>
            
            <h4>b. School-Related Factors</h4>
            <ol>
              <li>Teacher Factor</li>
              <li>Physical condition of classroom</li>
              <li>Peer influence</li>
            </ol>
            
            <h4>c. Economic-Related Factors</h4>
            <ol>
              <li>Distance between home and school</li>
              <li>Armed conflict (incl. Tribal wars & political conflicts)</li>
              <li>Calamities/Disasters</li>
              <li>Financial difficulties</li>
              <li>Child labor, work</li>
            </ol>
            <p>d. Others (Specify)</p>
          </div>

          <div className="sf2-summary">
            <h3>Month: {selectedMonth}</h3>
            <table className="sf2-summary-table">
              <thead>
                <tr>
                  <th>No. of Days of Classes: {calculateSummary().daysOfClasses}</th>
                  <th colSpan="3">Summary</th>
                </tr>
                <tr>
                  <th>"Enrollment" as of (1st Friday of June)</th>
                  <th>M</th>
                  <th>F</th>
                  <th>TOTAL</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Late Enrollment during the month (beyond cut-off)</td>
                  <td>{calculateSummary().lateEnrollment.male}</td>
                  <td>{calculateSummary().lateEnrollment.female}</td>
                  <td>{calculateSummary().lateEnrollment.total}</td>
                </tr>
                <tr>
                  <td>Registered Learners as of end of the month</td>
                  <td>{calculateSummary().registeredLearners.male}</td>
                  <td>{calculateSummary().registeredLearners.female}</td>
                  <td>{calculateSummary().registeredLearners.total}</td>
                </tr>
                <tr>
                  <td>Percentage of Enrollment as of end of the month</td>
                  <td>{calculateSummary().percentageEnrollment.male}%</td>
                  <td>{calculateSummary().percentageEnrollment.female}%</td>
                  <td>{calculateSummary().percentageEnrollment.total}%</td>
                </tr>
                <tr>
                  <td>Average Daily Attendance</td>
                  <td>{calculateSummary().avgDailyAttendance.male}%</td>
                  <td>{calculateSummary().avgDailyAttendance.female}%</td>
                  <td>{calculateSummary().avgDailyAttendance.total}%</td>
                </tr>
                <tr>
                  <td>Percentage of Attendance for the month</td>
                  <td>{calculateSummary().percentageAttendance.male}%</td>
                  <td>{calculateSummary().percentageAttendance.female}%</td>
                  <td>{calculateSummary().percentageAttendance.total}%</td>
                </tr>
                <tr>
                  <td>Number of students absent for 5 consecutive days:</td>
                  <td>{calculateSummary().absentFiveDays.male}</td>
                  <td>{calculateSummary().absentFiveDays.female}</td>
                  <td>{calculateSummary().absentFiveDays.total}</td>
                </tr>
                <tr>
                  <td>Drop out</td>
                  <td>{calculateSummary().dropout.male}</td>
                  <td>{calculateSummary().dropout.female}</td>
                  <td>{calculateSummary().dropout.total}</td>
                </tr>
                <tr>
                  <td>Transferred out</td>
                  <td>{calculateSummary().transferredOut.male}</td>
                  <td>{calculateSummary().transferredOut.female}</td>
                  <td>{calculateSummary().transferredOut.total}</td>
                </tr>
                <tr>
                  <td>Transferred in</td>
                  <td>{calculateSummary().transferredIn.male}</td>
                  <td>{calculateSummary().transferredIn.female}</td>
                  <td>{calculateSummary().transferredIn.total}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div className="sf2-certification">
          <p>I certify that this is a true and correct report.</p>
          <div className="sf2-signatures">
            <div className="sf2-signature">
              <div className="sf2-signature-line"></div>
              <p>(Signature of Teacher over Printed Name)</p>
              <p>Attested by:</p>
            </div>
            <div className="sf2-signature">
              <div className="sf2-signature-line"></div>
              <p>(Signature of School Head over Printed Name)</p>
            </div>
          </div>
        </div>

        <div className="sf2-page-number">
          <p>School Form 2 : Page ____ of ____</p>
        </div>

        <div className="sf2-buttons">
          <button onClick={handleConvertToPdf}>Convert to PDF</button>
        </div>
      </div>
    </div>
  );
}

export default SF2;
