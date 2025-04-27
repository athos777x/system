# Update All Reports Instructions

This document provides instructions for standardizing all report files with consistent buttons.

## Changes needed for each report file:

1. Import the report_buttons.css file:
```js
import "../CssFiles/report_buttons.css";
```

2. Import useNavigate from react-router-dom:
```js
import { useLocation, useNavigate } from "react-router-dom";
```

3. Add navigate hook:
```js
const navigate = useNavigate();
```

4. Add handleBack function:
```js
const handleBack = () => {
  navigate(-1); // Go back to previous page
};
```

5. Rename PDF functions to handlePrintPDF:
   - Change any handleConvertToPdf to handlePrintPDF for consistency

6. Remove any button display hiding code from the PDF generation function

7. Update the component structure:
```jsx
<div className="report-page [report-name]-page">
  <div className="[report-name]-container">
    {/* Report content */}
  </div>
  <div className="report-buttons">
    <button onClick={handleBack} className="report-back-btn">Back</button>
    <button onClick={handlePrintPDF} className="report-print-btn">Print PDF</button>
  </div>
</div>
```

## Files to update:
- sf4.js
- form_138.js
- sf5.js
- roster.js
- class_honor_roll.js
- early_enrollment.js
- quarterly_assessment.js
- nutritional_report.js
- class_list.js
- good_moral.js
- sf6.js

All reports should now have a consistent UI with two buttons (Print PDF and Back) positioned outside the printable report area.

## Example Implementation

```jsx
import React, { useState, useEffect } from "react";
import axios from "axios";
import "../CssFiles/[report-name].css";
import "../CssFiles/report_buttons.css";
import { jsPDF } from "jspdf";
import { useLocation, useNavigate } from "react-router-dom";

function ReportName() {
  const navigate = useNavigate();
  const { state } = useLocation();
  
  // ... existing state and data loading code ...

  const handlePrintPDF = () => {
    const doc = new jsPDF({
      orientation: "portrait", // or "landscape" based on report needs
      unit: "mm",
      format: "a4" // or other format based on report needs
    });

    doc.html(document.querySelector(".[report-name]-container"), {
      callback: function (doc) {
        window.open(doc.output("bloburl"), "_blank");
      },
      x: 10,
      y: 10,
      width: 190, // or appropriate width for the format
      windowWidth: 1000
    });
  };

  const handleBack = () => {
    navigate(-1); // Go back to previous page
  };

  return (
    <div className="report-page [report-name]-page">
      <div className="[report-name]-container">
        {/* Report content here */}
      </div>
      
      <div className="report-buttons">
        <button onClick={handleBack} className="report-back-btn">Back</button>
        <button onClick={handlePrintPDF} className="report-print-btn">Print PDF</button>
      </div>
    </div>
  );
}

export default ReportName;
``` 