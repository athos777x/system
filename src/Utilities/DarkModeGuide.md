# Dark Mode Implementation Guide

This guide explains how to implement dark mode for all components in the LNHS-MIS system.

## Basic Steps for Each CSS File

1. **Replace Hardcoded Colors with Variables**:
   - Replace all hardcoded color values with CSS variables
   - Use the variables from `src/CssFiles/theme.css`
   - Common replacements:
     - Background colors: `var(--bg-primary)`, `var(--bg-secondary)`, `var(--bg-content)`
     - Text colors: `var(--text-primary)`, `var(--text-secondary)`
     - Border colors: `var(--border-color)`, `var(--border-light)`
     - Shadow: `var(--shadow-color)`

2. **Adapt Component-Specific Colors**:
   - For components with specific themes:
     - Success/green colors: `var(--success-color)`, `var(--bg-success-light)`, `var(--text-success)`
     - Danger/red colors: `var(--danger-color)`, `var(--bg-danger-light)`, `var(--text-danger)`
     - Warning/yellow colors: `var(--warning-color)`, `var(--bg-warning-light)`, `var(--text-warning)`
     - Info/blue colors: `var(--info-color)`, `var(--bg-info-light)`, `var(--text-info)`

3. **Handle Images and Icons**:
   - For SVG icons included as background images, you may need to create dark-themed versions
   - Consider using CSS filters for simple icon color adjustments
   - Example: 
     ```css
     [data-theme='dark'] .icon-class {
       filter: invert(1);
     }
     ```

## CSS Variables Overview

See `src/CssFiles/theme.css` for all available variables. Key categories:

- **Colors**: Primary, secondary, accent colors
- **Backgrounds**: Primary, secondary, tertiary backgrounds
- **Text**: Primary, secondary, tertiary text colors
- **Borders**: Border colors for different purposes
- **Status Colors**: Success, warning, error, info colors
- **Shadows**: Different levels of shadows

## Implementation Examples

### Background & Text Colors

```css
.my-component {
  background-color: var(--bg-primary);
  color: var(--text-primary);
}

.my-component-header {
  background-color: var(--bg-secondary);
  color: var(--text-secondary);
}
```

### Form Elements

```css
input, select, textarea {
  background-color: var(--bg-secondary);
  color: var(--text-primary);
  border: 1px solid var(--border-light);
}

input:focus {
  border-color: var(--primary-color);
  box-shadow: 0 0 0 3px var(--input-focus-shadow);
}
```

### Tables

```css
/* Table header */
thead {
  background-color: var(--primary-light);
  color: var(--primary-text);
}

/* Table cells */
td {
  color: var(--text-primary);
  border-bottom: 1px solid var(--border-light);
}

/* Table row hover */
tr:hover {
  background-color: var(--bg-hover);
}
```

### Cards/Containers

```css
.card {
  background-color: var(--bg-primary);
  border-radius: 8px;
  box-shadow: 0 2px 8px var(--shadow-color);
}

.card-header {
  border-bottom: 1px solid var(--border-light);
}
```

### Buttons

```css
.button-primary {
  background-color: var(--primary-color);
  color: var(--bg-primary);
}

.button-primary:hover {
  background-color: var(--primary-hover);
}

.button-danger {
  background-color: var(--danger-color);
  color: var(--bg-primary);
}

.button-danger:hover {
  background-color: var(--danger-hover);
}
```

## Autofill Handling

For input fields that use browser autofill:

```css
input:-webkit-autofill,
input:-webkit-autofill:hover,
input:-webkit-autofill:focus {
  -webkit-text-fill-color: var(--text-primary);
  -webkit-box-shadow: 0 0 0px 1000px var(--input-bg) inset;
  transition: background-color 5000s ease-in-out 0s;
}
```

## Testing

After implementing dark mode for a component:

1. Test in light mode first
2. Toggle to dark mode and verify all elements adapt correctly
3. Check for any contrast issues or hard-to-read text
4. Verify interactive elements (hover, focus, active states) work in both modes

## Troubleshooting

- **Shadow colors showing up wrong**: Make sure to use `var(--shadow-color)` instead of rgba values
- **Text not changing color**: Ensure text elements use `var(--text-primary)` or similar
- **Background color issues**: Check that all background colors are using variables
- **Form inputs not adapting**: Add specific autofill handling for inputs