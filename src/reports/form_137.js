import React from "react";
import "../CssFiles/form_137.css";
import { jsPDF } from "jspdf"; // Import jsPDF

function Form137({ student, academicRecords, attendance, values }) {
  const date = new Date().toLocaleDateString();

  // Function to generate PDF without printing
  const handleConvertToPdf = () => {
    const doc = new jsPDF();

    // Hide the "Convert to PDF" button during PDF generation
    const button = document.querySelector(".convert-to-pdf");
    if (button) {
      button.style.display = "none"; // Hide the button
    }

    // Make sure the content is properly converted and added to the PDF
    doc.html(document.querySelector(".form-137-container"), {
      callback: function (doc) {
        // Open the PDF in a new tab (not printing)
        window.open(doc.output("bloburl"), "_blank");

        // After PDF is generated, show the button again
        if (button) {
          button.style.display = "block"; // Show the button again
        }
      },
      margin: [10, 10, 10, 10],
      x: 10,
      y: 10,
      width: 180, // Ensure the content fits properly
      windowWidth: 800, // Adjust the window width for rendering
    });
  };

  return (
    <div className="form-137-container">
      <div className="form-137">
        <header className="form-header">
          <div className="school-logo">
            <img
              src={student?.schoolLogo || "placeholder-logo.png"}
              alt="School Logo"
            />
          </div>
          <div className="school-details">
            <h2>{student?.schoolName || "School Name"}</h2>
            <p>{student?.schoolAddress || "School Address"}</p>
            <h3>PROGRESS REPORT CARD</h3>
            <p>{student?.level || "Elementary"}</p>
          </div>
        </header>

        <div className="student-info">
          <table className="info-table">
            <tbody>
              <tr>
                <td><strong>Name:</strong> {student?.name || "__________"}</td>
                <td><strong>Grade & Section:</strong> {student?.gradeSection || "________"}</td>
              </tr>
              <tr>
                <td><strong>Age:</strong> {student?.age || "___"}</td>
                <td><strong>School Year:</strong> {student?.schoolYear || "____"}</td>
              </tr>
              <tr>
                <td><strong>Gender:</strong> {student?.gender || "_____"}</td>
                <td><strong>LRN:</strong> {student?.lrn || "_____"}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <section className="academic-records">
          <h4>Learning Progress and Achievement</h4>
          <table className="records-table">
            <thead>
              <tr>
                <th>Subjects</th>
                <th>1</th>
                <th>2</th>
                <th>3</th>
                <th>4</th>
                <th>Final Grade</th>
                <th>Remarks</th>
              </tr>
            </thead>
            <tbody>
              {academicRecords?.length > 0 ? (
                academicRecords.map((record, index) => (
                  <tr key={index}>
                    <td>{record.subject}</td>
                    <td>{record.q1 || "___"}</td>
                    <td>{record.q2 || "___"}</td>
                    <td>{record.q3 || "___"}</td>
                    <td>{record.q4 || "___"}</td>
                    <td>{record.final || "___"}</td>
                    <td>{record.remarks || "___"}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7" style={{ textAlign: "center" }}>
                    No academic records available.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </section>

        <section className="observed-values">
          <h4>Learner's Observed Values</h4>
          <table className="values-table">
            <thead>
              <tr>
                <th>The Student:</th>
                <th>1</th>
                <th>2</th>
                <th>3</th>
                <th>4</th>
              </tr>
            </thead>
            <tbody>
              {values?.length > 0 ? (
                values.map((value, index) => (
                  <tr key={index}>
                    <td>{value.description}</td>
                    <td>{value.q1 || "___"}</td>
                    <td>{value.q2 || "___"}</td>
                    <td>{value.q3 || "___"}</td>
                    <td>{value.q4 || "___"}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" style={{ textAlign: "center" }}>
                    No observed values available.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </section>

        <section className="attendance">
          <h4>Attendance Report</h4>
          <table className="attendance-table">
            <thead>
              <tr>
                <th>Month</th>
                {attendance?.months?.map((month, index) => (
                  <th key={index}>{month}</th>
                ))}
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>No. of School Days</td>
                {attendance?.schoolDays?.map((days, index) => (
                  <td key={index}>{days}</td>
                ))}
                <td>{attendance?.totalSchoolDays || "___"}</td>
              </tr>
              <tr>
                <td>No. of Days Present</td>
                {attendance?.presentDays?.map((days, index) => (
                  <td key={index}>{days}</td>
                ))}
                <td>{attendance?.totalPresentDays || "___"}</td>
              </tr>
              <tr>
                <td>No. of Days Absent</td>
                {attendance?.absentDays?.map((days, index) => (
                  <td key={index}>{days}</td>
                ))}
                <td>{attendance?.totalAbsentDays || "___"}</td>
              </tr>
              <tr>
                <td>No. of Times Tardy</td>
                {attendance?.tardy?.map((times, index) => (
                  <td key={index}>{times}</td>
                ))}
                <td>{attendance?.totalTardy || "___"}</td>
              </tr>
            </tbody>
          </table>
        </section>

        <footer className="form-footer">
          <p>
            <strong>{student?.adviser || "Class Adviser"}</strong>: _________________
          </p>
        </footer>

        {/* Convert to PDF Button */}
        <div className="convert-to-pdf">
          <button onClick={handleConvertToPdf}>Print</button>
        </div>
      </div>
    </div>
  );
}

export default Form137;
