// LogoutButton.js
import React from 'react';
import { FiLogOut } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';

function LogoutButton({ onClick }) {
  const navigate = useNavigate();

  const handleLogout = () => {
    onClick();
    navigate('/login');
  };

  return (
    <button onClick={handleLogout} className="logout-btn">
      <FiLogOut className="icon" /> Logout
    </button>
  );
}

export default LogoutButton;
