import React, { useEffect, useState } from "react";
import axios from "axios";
import { useLocation } from "react-router-dom";
import "../CssFiles/good_moral.css";
import { jsPDF } from "jspdf";

function LateEnrollees() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const location = useLocation();
  const { report } = location.state || {}; // Access the state passed from the SummaryReport component
  const { grade, section } = report || {}; // Destructure grade and section

  // Fetch late enrollees when the component mounts or when grade/section changes
  useEffect(() => {
    if (grade && section) {
      fetchLateEnrollees();
    } else {
      setError("Grade and Section are required to fetch late enrollees.");
      setLoading(false);
    }
  }, [grade, section]);

  // Fetch the late enrollees based on grade and section
  const fetchLateEnrollees = async () => {
    try {
      const response = await axios.get("http://localhost:3001/late-enrollees", {
        params: {
          section,
          grade_lvl: grade
        },
      });
      setData(response.data);
    } catch (error) {
      setError("Failed to fetch late enrollees. Please try again later.");
      console.error("Error fetching late enrollees:", error);
    } finally {
      setLoading(false);
    }
  };

  // Handle converting the table to PDF
  const handleConvertToPdf = () => {
    const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
    const container = document.querySelector(".late-enrollees");
    const buttonContainer = document.querySelector(".button-container");

    // Hide buttons during PDF generation
    if (buttonContainer) buttonContainer.style.display = "none";

    doc.html(container, {
      callback: (doc) => {
        window.open(doc.output("bloburl"), "_blank");
        if (buttonContainer) buttonContainer.style.display = "block"; // Restore buttons
      },
      x: 10,
      y: 10,
      width: 190,
      windowWidth: 900,
    });
  };

  // Handle going back to the summary report
  const handleBack = () => {
    window.location.href = "http://localhost:3000/summary-report-promotion";
  };

  return (
    <div className="late-enrollees">
      <h1 className="students-title">Late Enrollees</h1>
      {loading ? (
        <p>Loading late enrollees...</p>
      ) : error ? (
        <p style={{ color: "red" }}>{error}</p>
      ) : (
        <>
          <table className="attendance-table">
            <thead>
              <tr>
                <th>Row</th>
                <th>Name</th>
                <th>Grade Level</th>
                <th>Section</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {data.length > 0 ? (
                data.map((item, index) => (
                  <tr key={index}>
                    <td>{index + 1}</td>
                    <td>{item.full_name}</td>
                    <td>{item.grade_lvl || "N/A"}</td>
                    <td>{item.section || "N/A"}</td>
                    <td>{item.enrollment_status}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" style={{ textAlign: "center" }}>
                    No late enrollees found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </>
      )}

      <div className="button-container">
        <button onClick={handleBack}>Back</button>
        <button onClick={handleConvertToPdf}>Print</button>
      </div>
    </div>
  );
}

export default LateEnrollees;
