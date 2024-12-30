import React from "react";
import "../CssFiles/good_moral.css"; // Add your custom styles here
import { jsPDF } from "jspdf"; // Import jsPDF

function GoodMoral({ student }) {
  const date = new Date().toLocaleDateString();

  // Function to handle PDF conversion
  const handleConvertToPdf = () => {
    const doc = new jsPDF();

    // Hide the "Convert to PDF" button during PDF generation
    const button = document.querySelector(".convert-to-pdf");
    if (button) {
      button.style.display = "none"; // Hide the button
    }

    // Generate the PDF from the content
    doc.html(document.querySelector(".good-moral-container"), {
      callback: function (doc) {
        // Open the generated PDF in a new tab (not printing)
        window.open(doc.output("bloburl"), "_blank");

        // Show the button again after PDF is generated
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
    <div className="good-moral-container">
      <div className="certificate">
        <h1 className="certificate-title">Certificate of Good Moral</h1>
        <div className="certificate-body">
          <p>
            <strong>{`This is to certify that ${student?.name || "_____________"},`}</strong>
            {` a student of `}
            <strong>{`Grade ${student?.grade || "____"}`}</strong>
            {` at ${student?.schoolName || "____________________________"},`}
          </p>
          <p>
            has exhibited exemplary conduct, proper decorum, and good moral
            character during the school year {student?.schoolYear || "__________"}.
          </p>
          <p>
            This certificate is issued upon the request of the student for
            official purposes.
          </p>
        </div>
        <div className="certificate-footer">
          <p>{`Given this ${date} at ${student?.schoolAddress || "______________________"}`}</p>
          <p>
            <strong>_______________________</strong>
            <br />
            {student?.principalName || "Principal Name"}
            <br />
            Principal
          </p>
        </div>
      </div>

      {/* Convert to PDF Button */}
      <div className="convert-to-pdf">
        <button onClick={handleConvertToPdf}>Print</button>
      </div>
    </div>
  );
}

export default GoodMoral;
