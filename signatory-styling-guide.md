# Signatory Styling Guide for Reports

## Implementation Overview

This guide provides a standardized approach for styling signature sections across all report components. Following this guide ensures consistent appearance of signatories throughout the application.

## HTML Structure

The signatory section follows a consistent structure:

```jsx
<div className="signature-section">
  <div className="signature">
    <div className="signatory-name">{registrar || "[Registrar Name]"}</div>
    <div className="signatory-title">REGISTRAR'S NAME</div>
    <div className="signatory-position">School Registrar</div>
  </div>
  <div className="signature">
    <div className="signatory-name">{principal || "[Principal Name]"}</div>
    <div className="signatory-title">PRINCIPAL'S NAME</div>
    <div className="signatory-position">School Principal</div>
  </div>
</div>
```

### Optional Date Section

If your report requires a date section, you can add it below the signatures:

```jsx
<div className="report-date">
  <p>Date: {new Date().toLocaleDateString()}</p>
</div>
```

## CSS Styling

Copy and paste this styling into each report's CSS file:

```css
/* Signature section container */
.signature-section {
  display: flex;
  justify-content: space-between;
  margin-top: 2rem;
  width: 100%;
  padding: 0 2rem;
}

/* Individual signature block */
.signature {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 250px;
  text-align: center;
}

/* Signatory name (the actual name) */
.signatory-name {
  font-weight: bold;
  border-bottom: 1px solid #000;
  padding-bottom: 5px;
  width: 100%;
  text-align: center;
  margin-bottom: 5px;
}

/* Signatory title (REGISTRAR'S NAME, PRINCIPAL'S NAME, etc.) */
.signatory-title {
  font-weight: bold;
  text-transform: uppercase;
  font-size: 0.9rem;
  margin-bottom: 3px;
}

/* Signatory position (School Registrar, School Principal, etc.) */
.signatory-position {
  font-style: italic;
  font-size: 0.85rem;
}
```

### Optional Date Section Styling

Only include this CSS if you're using the date section:

```css
/* Date section (optional) */
.report-date {
  text-align: right;
  margin-top: 1.5rem;
  padding-right: 2rem;
  font-style: italic;
}
```

## Implementation Steps

1. **Data Fetching**: First, implement the data fetching functions to retrieve signatory information:

   ```jsx
   const [registrar, setRegistrar] = useState("");
   const [principal, setPrincipal] = useState("");

   useEffect(() => {
     fetchRegistrar();
     fetchPrincipal();
   }, []);

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

   const fetchRegistrar = async () => {
     try {
       const response = await axios.get("http://localhost:3001/api/enrollment/registrar");
       if (response.data && response.data.registrar) {
         setRegistrar(response.data.registrar);
       }
     } catch (err) {
       console.error("Error fetching registrar:", err);
     }
   };
   ```

2. **Add HTML Structure**: Place the signature section HTML in the report's footer area.

3. **Add CSS Styling**: Ensure the CSS classes are added to your report's CSS file.

4. **Test Styling**: Verify that both the name and title display correctly with the appropriate styling.

## Common Issues and Solutions

1. **Names not appearing bold**: Make sure you're using the class `signatory-name` with the proper styling.

2. **Uneven spacing**: Check that you're using `justify-content: space-between` in the `signature-section` class.

3. **Missing data**: Always include fallback values for when API data isn't available:
   ```jsx
   <div className="signatory-name">{registrar || "[Registrar Name]"}</div>
   ```

## Additional Variations

For reports requiring three or more signatories:

```jsx
<div className="signature-section">
  <div className="signature">
    <div className="signatory-name">{teacherName || "[Teacher Name]"}</div>
    <div className="signatory-title">TEACHER'S NAME</div>
    <div className="signatory-position">Classroom Adviser</div>
  </div>
  <div className="signature">
    <div className="signatory-name">{registrar || "[Registrar Name]"}</div>
    <div className="signatory-title">REGISTRAR'S NAME</div>
    <div className="signatory-position">School Registrar</div>
  </div>
  <div className="signature">
    <div className="signatory-name">{principal || "[Principal Name]"}</div>
    <div className="signatory-title">PRINCIPAL'S NAME</div>
    <div className="signatory-position">School Principal</div>
  </div>
</div>
```

With additional CSS:

```css
/* For 3+ signatories */
.signature-section {
  justify-content: space-around;
}
``` 