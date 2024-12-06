import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../CssFiles/headbar.css';
import { FaBars, FaTimes } from 'react-icons/fa';
import profilePic from '../png/user_pp.jpg'; // Import the profile picture

function HeaderBar({ showSidebar, toggleSidebar, onLogout }) {
  const [dropdownVisible, setDropdownVisible] = useState(false);
  const navigate = useNavigate();

  const toggleDropdown = () => {
    setDropdownVisible(!dropdownVisible);
  };

  const handleViewProfile = () => {
    navigate('/profile');
  };

  return (
    <div className="header">
      <button className="toggle-btn" onClick={toggleSidebar}>
        {showSidebar ? <FaTimes /> : <FaBars />}
      </button>
      <h1>LNHS - MIS</h1>
      <div className="profile-container" onClick={toggleDropdown}>
        <img src={profilePic} alt="Profile" className="profile-pic" />
        {dropdownVisible && (
          <div className="dropdown-menu">
            <button className="dropdown-item" onClick={handleViewProfile}>
              My Profile
            </button>
            <button className="dropdown-item" onClick={onLogout}>
              Logout
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default HeaderBar;
