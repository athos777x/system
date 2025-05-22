import { useLocation, useNavigate } from 'react-router-dom';
import React, { useState, useEffect } from 'react';
import { jsPDF } from 'jspdf';
import axios from 'axios';
import '../CssFiles/sf2.css';
import "../CssFiles/report_buttons.css";

function SF2() {
  const [schoolData, setSchoolData] = useState({
    schoolName: "LOURDES NATIONAL HIGH SCHOOL",
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
  const { schoolYearId, year, grade, section, month, date } = location.state;
  const initialDate = location.state?.date ? new Date(location.state.date) : new Date();
  const [attendanceData, setAttendanceData] = useState(null);
  const [selectedDate, setSelectedDate] = useState(initialDate);
  const [selectedMonth, setSelectedMonth] = useState(location.state?.month || initialDate.toLocaleString('default', { month: 'long' }));
  const [selectedYear, setSelectedYear] = useState(initialDate.getFullYear());
  const [gradeLevel, setGradeLevel] = useState(location.state?.grade || "7");
  const [sectionInfo, setSectionInfo] = useState({
    sectionName: '',
    schoolYearName: ''
  });
  const [adviser, setAdviser] = useState("");
  const [principal, setPrincipal] = useState("");

  const navigate = useNavigate();

  const fetchSectionInfo = async () => {
    try {
      const response = await axios.get('http://localhost:3001/api/school_year/section_name', {
        params: {
          school_year_id: 1, // Example: school year ID (you can dynamically pass this)
          section: 1 // Example: section ID (you can dynamically pass this)
        }
      });
      // Update section info
      setSectionInfo({
        sectionName: response.data.section_name,
        schoolYearName: response.data.school_year_name
      });
    } catch (error) {
      console.error('Error fetching section data:', error);
    }
  };

  useEffect(() => {
    if (!gradeLevel || !section) return;

    fetchSectionInfo();
    fetchAdviser({ grade_level: gradeLevel, section_id: section });
    fetchPrincipal();
  }, [gradeLevel, section]);


  useEffect(() => {
    const fetchAttendanceData = async () => {
      try {
        const response = await axios.get('http://localhost:3001/api/sf2-combined', {
          params: {
            month: selectedMonth,
            gradeLevel: grade,
            section: section,
            year: selectedYear
          }
        });
        
        // Process the data to group by student
        const processedData = response.data.reduce((acc, record) => {
          if (!record.student_id) return acc;
          
          if (!acc[record.student_id]) {
            acc[record.student_id] = {
              studentId: record.student_id,
              stud_name: record.stud_name,
              gender: record.gender,
              attendance: {}
            };
          }
          
          // Store attendance status for each day
          if (record.date) {
            const day = record.day_of_month;
            if (record.status) {
              acc[record.student_id].attendance[day] = record.status;
            }
          }
          
          return acc;
        }, {});
        
        // Convert to array format
        const students = Object.values(processedData);
        setAttendanceData(students);
        
      } catch (error) {
        console.error('Error fetching attendance data:', error);
      }
    };

    fetchAttendanceData();
  }, [selectedMonth, grade, section, selectedYear]);

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
      format: [355.6, 215.9]
    });

    // Hide the buttons before generating PDF
    doc.html(document.querySelector(".sf2-container"), {
      callback: function (doc) {
        window.open(doc.output("bloburl"), "_blank");
      },
      x: 10,
      y: 10,
      width: 335,
      windowWidth: 1100
    });
  };

  const handleBack = () => {
    navigate(-1); // Go back to previous page
  };

// Helper function to convert month name to month index
const monthNameToIndex = (monthName) => {
  const months = [
    "January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"
  ];
  return months.indexOf(monthName);
};

// Helper: get all weekdays (Mon-Fri) for selected month
const getWeekdaysInMonth = (month, year) => {
  const weekdays = [];
  const monthIndex = monthNameToIndex(month); // Convert month name to index
  const date = new Date(year, monthIndex, 1); // Start at first day of the month

  // Loop through the days of the month
  while (date.getMonth() === monthIndex) {
    const day = date.getDay(); // 0=Sunday, 1=Monday, ..., 6=Saturday

    if (day >= 1 && day <= 5) { // Only Monday to Friday
      weekdays.push(new Date(date)); // Clone the date
    }

    date.setDate(date.getDate() + 1); // Move to next day
  }

  return weekdays;
};

// Helper: map numeric day to abbreviation
const getDayAbbreviation = (dayNumber) => {
  switch (dayNumber) {
    case 1: return "M";
    case 2: return "T";
    case 3: return "W";
    case 4: return "Th";
    case 5: return "F";
    default: return "";
  }
};

// Generate the Day Abbreviations (M, T, W, Th, F)
const generateDateColumns = (month, year) => {
  const weekdays = getWeekdaysInMonth(month, year);

  return weekdays.map((date, index) => (
    <td key={`day-${index}`} className="sf2-date-cell">
      <div className="sf2-day">{getDayAbbreviation(date.getDay())}</div>
    </td>
  ));
};

// Generate the actual Date Numbers (1, 2, 3, etc.)
const generateDateBlankCells = (month, year) => {
  const weekdays = getWeekdaysInMonth(month, year);

  return weekdays.map((date, index) => (
    <td key={`date-blank-${index}`} className="sf2-date-blank-cell">
      {date.getDate()}
    </td>
  ));
};

// Helper function to calculate the number of weekdays (M-F) in the selected month
const calculateWeekdaysCount = (month, year) => {
  const weekdays = getWeekdaysInMonth(month, year);
  return weekdays.length;
};

// Generate the date header with month name
const generateDateHeader = (month, year) => {
  const weekdaysCount = calculateWeekdaysCount(month, year);
  return (
    <th colSpan={weekdaysCount} className="sf2-date-header">
      {month} {year}
    </th>
  );
};

// Helper function to generate attendance cells for a student
const generateAttendanceCells = (student) => {
  const cells = [];
  const weekdays = getWeekdaysInMonth(selectedMonth, selectedYear);
  
  // Generate cells for each weekday in the month
  weekdays.forEach((date, index) => {
    const dayOfMonth = date.getDate();
    
    // Check if there's data for this day
    const hasData = dayOfMonth in student.attendance;
    
    // Get the status from the attendance object using the day as key
    const status = student.attendance[dayOfMonth];
    
    // Cell classes based on status
    let cellClass = 'sf2-attendance-cell';
    let statusText = '';
    
    // Only process status if data exists
    if (hasData) {
      switch (status) {
        case 'P':
          // Present - leave blank
          break;
        case 'A':
          cellClass += ' absent-lower-left';
          statusText = '';
          break;
        case 'L':
          cellClass += ' late-upper-right';
          statusText = '';
          break;
        case 'T':
          cellClass += ' truant';
          statusText = 'T';
          break;
        case 'C':
          cellClass += ' tardy-cutting';
          statusText = 'C';
          break;
        default:
          // Default case - leave blank
          break;
      }
    }
    
    cells.push(
      <td key={`attendance-${student.studentId}-${index}`} className={cellClass}>
        <div className="sf2-attendance-status">
          {statusText}
        </div>
      </td>
    );
  });
  
  return cells;
};

// Helper function to calculate monthly totals for a student
const calculateMonthlyTotals = (student) => {
  let absentCount = 0;
  let tardyLateCount = 0;
  let truantCount = 0;
  let tardyCuttingCount = 0;
  
  // Count attendance records from the attendance object
  Object.values(student.attendance).forEach(status => {
    if (status) { // Only count if status exists
      switch (status) {
        case 'A':
          absentCount += 1;
          break;
        case 'L':
          tardyLateCount += 1;
          break;
        case 'T':
          truantCount += 1;
          break;
        case 'C':
          tardyCuttingCount += 1;
          break;
      }
    }
  });
  
  return { 
    absent: absentCount,
    tardyLate: tardyLateCount,
    truant: truantCount,
    tardyCutting: tardyCuttingCount
  };
};

// Calculate daily totals for all students
const calculateDailyTotals = () => {
  if (!attendanceData) return [];
  
  const dailyTotals = [];
  const weekdays = getWeekdaysInMonth(selectedMonth, selectedYear);
  
  // For each weekday in the month
  weekdays.forEach(date => {
    const dayOfMonth = date.getDate();
    let presentCount = 0;
    let absentCount = 0;
    let tardyLateCount = 0;
    let truantCount = 0;
    let tardyCuttingCount = 0;
    
    // Count attendance for all students on this day
    attendanceData.forEach(student => {
      const status = student.attendance[dayOfMonth];
      
      if (status) { // Only count if status exists
        switch (status) {
          case 'P':
            presentCount += 1;
            break;
          case 'A':
            absentCount += 1;
            break;
          case 'L':
            tardyLateCount += 1;
            break;
          case 'T':
            truantCount += 1;
            break;
          case 'C':
            tardyCuttingCount += 1;
            break;
        }
      }
    });
    
    dailyTotals.push({ 
      present: presentCount,
      absent: absentCount,
      tardyLate: tardyLateCount,
      truant: truantCount,
      tardyCutting: tardyCuttingCount
    });
  });
  
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
  const maleStudents = attendanceData.filter(student => student.gender === 'Male');
  const femaleStudents = attendanceData.filter(student => student.gender === 'Female');
  const totalStudents = maleStudents.length + femaleStudents.length;
  
  // Calculate total attendance for each gender
  let malePresentTotal = 0;
  let femalePresentTotal = 0;
  
  maleStudents.forEach(student => {
    for (let week = 0; week < 4; week++) {
      for (let day = 1; day <= 5; day++) {
        const dayIndex = week * 5 + day;
        const status = student.attendance[dayIndex] || 'P';
        
        // Count present (P) as 1, others as 0
        if (status === 'P') {
          malePresentTotal += 1;
        }
      }
    }
  });
  
  femaleStudents.forEach(student => {
    for (let week = 0; week < 4; week++) {
      for (let day = 1; day <= 5; day++) {
        const dayIndex = week * 5 + day;
        const status = student.attendance[dayIndex] || 'P';
        
        // Count present (P) as 1, others as 0
        if (status === 'P') {
          femalePresentTotal += 1;
        }
      }
    }
  });

  // Calculate metrics
  const malePercentageEnrollment = maleStudents.length > 0 ? (maleStudents.length / totalStudents) * 100 : 0;
  const femalePercentageEnrollment = femaleStudents.length > 0 ? (femaleStudents.length / totalStudents) * 100 : 0;
  
  const maleAvgDailyAttendance = maleStudents.length > 0 ? (malePresentTotal / schoolDays) : 0;
  const femaleAvgDailyAttendance = femaleStudents.length > 0 ? (femalePresentTotal / schoolDays) : 0;
  const totalAvgDailyAttendance = totalStudents > 0 ? ((malePresentTotal + femalePresentTotal) / schoolDays) : 0;
  
  const malePercentageAttendance = maleStudents.length > 0 ? (malePresentTotal / (maleStudents.length * schoolDays)) * 100 : 0;
  const femalePercentageAttendance = femaleStudents.length > 0 ? (femalePresentTotal / (femaleStudents.length * schoolDays)) * 100 : 0;
  const totalPercentageAttendance = totalStudents > 0 ? ((malePresentTotal + femalePresentTotal) / (totalStudents * schoolDays)) * 100 : 0;

  return {
    daysOfClasses: schoolDays,
    enrollment: { male: maleStudents.length, female: femaleStudents.length, total: totalStudents },
    lateEnrollment: { male: 0, female: 0, total: 0 },
    registeredLearners: { male: maleStudents.length, female: femaleStudents.length, total: totalStudents },
    percentageEnrollment: { 
      male: malePercentageEnrollment.toFixed(1), 
      female: femalePercentageEnrollment.toFixed(1), 
      total: 100 
    },
    avgDailyAttendance: { 
      male: maleAvgDailyAttendance.toFixed(1), 
      female: femaleAvgDailyAttendance.toFixed(1), 
      total: totalAvgDailyAttendance.toFixed(1) 
    },
    percentageAttendance: { 
      male: malePercentageAttendance.toFixed(1), 
      female: femalePercentageAttendance.toFixed(1), 
      total: totalPercentageAttendance.toFixed(1) 
    },
    absentFiveDays: { male: 0, female: 0, total: 0 },
    dropout: { male: 0, female: 0, total: 0 },
    transferredOut: { male: 0, female: 0, total: 0 },
    transferredIn: { male: 0, female: 0, total: 0 }
  };
};

  return (
    <div className="report-page sf2-page">
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
              <span className="sf2-info-label">School ID:</span>
              <span>{schoolData.schoolId}</span>
            </div>
            <div className="sf2-form-group">
              <span className="sf2-info-label">School Year:</span>
              <span>{sectionInfo.schoolYearName}</span>
            </div>
            <div className="sf2-form-group">
              <span className="sf2-info-label">Report for the Month of:</span>
              <span>{selectedMonth}</span>
            </div>
          </div>
          <div className="sf2-form-row">
            <div className="sf2-form-group sf2-school-name">
              <span className="sf2-info-label">Name of School:</span>
              <span>{schoolData.schoolName}</span>
            </div>
            <div className="sf2-form-group">
              <span className="sf2-info-label">Grade Level:</span>
              <span>{gradeLevel}</span>
            </div>
            <div className="sf2-form-group">
              <span className="sf2-info-label">Section:</span>
              <span>{sectionInfo.sectionName}</span>
            </div>
          </div>
        </div>

        <div className="sf2-table-container">
          <table className="sf2-table">
            <thead>
              <tr>
                <th rowSpan="2" className="sf2-learner-name-header">
                  LEARNER'S NAME<br />(Last Name, First Name, Middle Name)
                </th>
                {generateDateHeader(selectedMonth, selectedYear)}
                <th colSpan="2" className="sf2-total-header">Total for the Month</th>
                <th rowSpan="2" className="sf2-remarks-header">
                  REMARKS
                </th>
              </tr>
              <tr>
                {generateDateBlankCells(selectedMonth, selectedYear)}
                <th className="sf2-total-column">ABSENT</th>
                <th className="sf2-total-column">TARDY</th>
              </tr>
              <tr>
                <th className="sf2-days-header"></th>
                {generateDateColumns(selectedMonth, selectedYear)}
                <th className="sf2-total-column"></th>
                <th className="sf2-total-column"></th>
                <th className="sf2-remarks-header"></th>
              </tr>
            </thead>
            <tbody>
              {attendanceData ? (
                <>
                  {/* Male Students Section */}
                  {attendanceData.filter(student => student.gender === 'Male').map((student) => (
                    <tr key={student.student_id}>
                      <td className="sf2-student-name">{student.stud_name}</td>
                      {/* Dynamically generate attendance cells for each day of the month */}
                      {generateAttendanceCells(student)}
                      <td className="sf2-total-cell">{calculateMonthlyTotals(student).absent}</td>
                      <td className="sf2-total-cell">{calculateMonthlyTotals(student).tardyLate}</td>
                      <td className="sf2-remarks-cell"></td>
                    </tr>
                  ))}
                  <tr className="sf2-total-row">
                    <td colSpan={calculateWeekdaysCount(selectedMonth, selectedYear) + 4} className="sf2-male-total">
                      ⟸ MALE | TOTAL Per Day ⟹
                    </td>
                  </tr>

                  {/* Female Students Section */}
                  {attendanceData.filter(student => student.gender === 'Female').map((student) => (
                    <tr key={student.student_id}>
                      <td className="sf2-student-name">{student.stud_name}</td>
                      {/* Dynamically generate attendance cells for each day of the month */}
                      {generateAttendanceCells(student)}
                      <td className="sf2-total-cell">{calculateMonthlyTotals(student).absent}</td>
                      <td className="sf2-total-cell">{calculateMonthlyTotals(student).tardyLate}</td>
                      <td className="sf2-remarks-cell"></td>
                    </tr>
                  ))}
                  <tr className="sf2-total-row">
                    <td colSpan={calculateWeekdaysCount(selectedMonth, selectedYear) + 4} className="sf2-female-total">
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
                          T:{total.tardyLate}
                        </span>
                      </td>
                    ))}
                    <td className="sf2-combined-total-cell">
                      <span className="sf2-daily-total-values">
                        {attendanceData.reduce((sum, student) => sum + calculateMonthlyTotals(student).absent, 0).toFixed(1)}
                      </span>
                    </td>
                    <td className="sf2-combined-total-cell">
                      <span className="sf2-daily-total-values">
                        {attendanceData.reduce((sum, student) => sum + calculateMonthlyTotals(student).tardyLate, 0).toFixed(1)}
                      </span>
                    </td>
                    <td className="sf2-combined-total-cell"></td>
                  </tr>
                </>
              ) : (
                <tr><td colSpan={calculateWeekdaysCount(selectedMonth, selectedYear) + 4}>Loading attendance data...</td></tr>
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
            <p>(blank) - Present | Upper right triangle shade - Late | Lower left triangle shade - Absent</p>
            {/* <p>T - Truant (Absent without valid reason) | C - Cutting Classes</p> */}
            
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
          <div className="signature-section">
            <div className="signature">
              <div className="signatory-name">{adviser || "[Adviser Name]"}</div>
              <div className="signatory-title">TEACHER'S NAME</div>
              <div className="signatory-position">Class Adviser</div>
            </div>
            <div className="signature">
              <div className="signatory-name">{principal || "[Principal Name]"}</div>
              <div className="signatory-title">PRINCIPAL'S NAME</div>
              <div className="signatory-position">School Principal</div>
            </div>
          </div>
        </div>

        <div className="sf2-page-number">
          <p>School Form 2 : Page ____ of ____</p>
        </div>
      </div>
      <div className="report-buttons">
        <button onClick={handleBack} className="report-back-btn">Back</button>
        <button onClick={handlePrintPDF} className="report-print-btn">Print PDF</button>
      </div>
    </div>
  );
}

export default SF2;
