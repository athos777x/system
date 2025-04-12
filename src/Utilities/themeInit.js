// Initialize theme from localStorage and apply it to the document
export const initializeTheme = () => {
  const savedTheme = localStorage.getItem('theme') || 'light';
  document.body.setAttribute('data-theme', savedTheme);
}; 