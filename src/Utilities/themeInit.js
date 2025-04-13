// Initialize theme from localStorage and apply it to the document
export const initializeTheme = () => {
  // Get saved theme or use system preference as fallback
  const savedTheme = localStorage.getItem('theme');
  
  // Check for system preference if no saved theme
  if (!savedTheme) {
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const initialTheme = prefersDark ? 'dark' : 'light';
    localStorage.setItem('theme', initialTheme);
    document.body.setAttribute('data-theme', initialTheme);
    return;
  }
  
  // Apply saved theme
  document.body.setAttribute('data-theme', savedTheme);
};

// Toggle theme function that can be imported and used anywhere
export const toggleTheme = () => {
  const currentTheme = document.body.getAttribute('data-theme');
  const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
  
  // Save to localStorage
  localStorage.setItem('theme', newTheme);
  
  // Apply to document
  document.body.setAttribute('data-theme', newTheme);
  
  return newTheme;
}; 