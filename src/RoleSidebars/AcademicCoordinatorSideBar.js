// PrincipalSideBar.js
import React, { useState } from 'react';
import '../CssFiles/sidebar.css';
import {
  FiHome,
  FiClipboard,
  FiBook,
  FiLogOut,
  FiChevronLeft,
  FiMenu,
  FiCalendar,
  FiSettings,
  FiUser,
} from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import LogoutButton from '../Buttons/LogoutButton';

function AcademicCoordinatorSideBar({ showSidebar, toggleSidebar, handleLogout }) {
  const [showClassesSubMenu, setShowClassesSubMenu] = useState(false);
  const navigate = useNavigate();

  const toggleClassesSubMenu = () => {
    setShowClassesSubMenu(!showClassesSubMenu);
  };

  const handleNavigate = (path) => {
    navigate(path);
  };

  return (
    <div className={`sidebar ${showSidebar ? 'show' : 'hide'}`} style={{ zIndex: 1100 }}>
      <button className="toggle-btn" onClick={toggleSidebar}>
        {showSidebar ? <FiChevronLeft /> : <FiMenu />}
      </button>
      <div className="buttons">
        <button onClick={() => handleNavigate('/home')}>
          <FiHome className="icon" /> Home
        </button>
        <button onClick={() => handleNavigate('/profile')}>
          <FiUser className="icon" /> Profile
        </button>
        <div className={`menu-with-submenu ${showClassesSubMenu ? 'active' : ''}`}>
          <button onClick={toggleClassesSubMenu}>
            <FiClipboard className="icon" /> Classes
          </button>
          {showClassesSubMenu && (
            <div className="submenu">
              <button onClick={() => handleNavigate('/section')}>
                <FiBook className="icon" /> Section
              </button>
              <button onClick={() => handleNavigate('/schedule')}>
                <FiCalendar className="icon" /> Schedule
              </button>
            </div>
          )}
        {/* <button onClick={() => handleNavigate('/account')}>
        <FiSettings className="icon" /> Account
        </button> */}
        </div>
        <LogoutButton onClick={handleLogout}>
          <FiLogOut className="icon" /> Logout
        </LogoutButton>
      </div>
    </div>
  );
}

export default AcademicCoordinatorSideBar;
