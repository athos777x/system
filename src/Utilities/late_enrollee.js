import React, { useEffect, useState } from 'react';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import axios from 'axios';

function LateEnrollees() {
  const [data, setData] = useState([]);

  // Fetch data from the backend
  useEffect(() => {
    const fetchLateEnrollees = async () => {
      try {
        const response = await axios.get('http://localhost:3001/late-enrollees'); // Replace with your API endpoint
        setData(response.data);
      } catch (error) {
        console.error('Error fetching late enrollees:', error);
      }
    };

    fetchLateEnrollees();
  }, []);

  // Handle print to PDF
  const handlePrint = () => {
    const doc = new jsPDF();

    // Add a title to the PDF
    doc.text('Late Enrollees Report', 14, 10);

    // Generate the table content
    const tableColumnHeaders = ['Row', 'Name', 'Grade Level', 'Section', 'Status'];
    const tableRows = data.map((item, index) => [
      index + 1,
      item.full_name,
      item.grade_lvl || 'N/A', // Adjust field name if needed
      item.section || 'N/A', // Adjust field name if needed
      item.enrollment_status,
    ]);

    // Use jsPDF-AutoTable to create the table
    doc.autoTable({
      head: [tableColumnHeaders],
      body: tableRows,
      startY: 20, // Position the table below the title
    });

    // Save the PDF
    doc.save('Late_Enrollees_Report.pdf');
  };

  return (
    <div className="late-enrollees">
      <h1 className="students-title">Late Enrollees</h1>
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
                <td>{item.grade_lvl || 'N/A'}</td>
                <td>{item.section || 'N/A'}</td>
                <td>{item.enrollment_status}</td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="5" style={{ textAlign: 'center' }}>
                No late enrollees found
              </td>
            </tr>
          )}
        </tbody>
      </table>
      <button className="print-button" onClick={handlePrint}>
        Print as PDF
      </button>
    </div>
  );
}

export default LateEnrollees;
