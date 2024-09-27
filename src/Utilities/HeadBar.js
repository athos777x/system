// HeadBar.js
import React, { useState } from 'react';
import '../CssFiles/headbar.css';
import { FaBars, FaTimes } from 'react-icons/fa';
import profilePic from '../png/user_pp.jpg'; // Import the profile picture

function HeaderBar({ showSidebar, toggleSidebar, user }) {
  const [dropdownVisible, setDropdownVisible] = useState(false);

  const toggleDropdown = () => {
    setDropdownVisible(!dropdownVisible);
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
            <p className="dropdown-item">{user.fullName}</p>
            <p className="dropdown-item">{user.name}</p>
            <p className="dropdown-item">{user.role}</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default HeaderBar;
