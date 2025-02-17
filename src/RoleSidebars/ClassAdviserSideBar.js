// PrincipalSideBar.js
import React, { useState } from 'react';
import '../CssFiles/sidebar.css';
import {
  FiHome,
  FiUsers,
  FiLogOut,
  FiChevronLeft,
  FiMenu,
  FiUser,
  FiCalendar,
  FiBarChart2,
  FiFileText,
  FiBook,
  FiClipboard
} from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import LogoutButton from '../Buttons/LogoutButton';

function ClassAdviserSideBar({ showSidebar, toggleSidebar, handleLogout }) {
  const [showEnrollmentSubMenu, setShowEnrollmentSubMenu] = useState(false);
  const [showReportsSubMenu, setShowReportsSubMenu] = useState(false);
  const [showClassesSubMenu, setShowClassesSubMenu] = useState(false);
  const navigate = useNavigate();

  const toggleEnrollmentSubMenu = () => {
    setShowEnrollmentSubMenu(!showEnrollmentSubMenu);
    setShowReportsSubMenu(false);
    setShowClassesSubMenu(false);
  };

  const toggleReportsSubMenu = () => {
    setShowReportsSubMenu(!showReportsSubMenu);
    setShowEnrollmentSubMenu(false);
    setShowClassesSubMenu(false);
  };

  const toggleClassesSubMenu = () => {
    setShowClassesSubMenu(!showClassesSubMenu);
    setShowEnrollmentSubMenu(false);
    setShowReportsSubMenu(false);
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
        <button onClick={() => handleNavigate('/student')}>
          <FiUsers className="icon" /> Students
        </button>
        <div className={`menu-with-submenu ${showEnrollmentSubMenu ? 'active' : ''}`}>
          <button onClick={toggleEnrollmentSubMenu}>
            <FiCalendar className="icon" /> Enrollment
          </button>
          {showEnrollmentSubMenu && (
            <div className="submenu">
              <button onClick={() => handleNavigate('/school-year')}>
                <FiCalendar className="icon" /> School Year
              </button>
              <button onClick={() => handleNavigate('/section-list')}>
                <FiBook className="icon" /> Section List
              </button>
              <button onClick={() => handleNavigate('/enrolled-students')}>
                <FiUsers className="icon" /> Enrolled Students
              </button>
            </div>
          )}
        </div>
        <div className={`menu-with-submenu ${showClassesSubMenu ? 'active' : ''}`}>
          <button onClick={toggleClassesSubMenu}>
            <FiClipboard className="icon" /> Classes
          </button>
          {showClassesSubMenu && (
            <div className="submenu">
              <button onClick={() => handleNavigate('/section')}>
                <FiBook className="icon" /> Section
              </button>
            </div>
          )}
        </div>
        <div className={`menu-with-submenu ${showReportsSubMenu ? 'active' : ''}`}>
          <button onClick={toggleReportsSubMenu}>
            <FiBarChart2 className="icon" /> Generate Reports
          </button>
          {showReportsSubMenu && (
            <div className="submenu">
              <button onClick={() => handleNavigate('/summary-report-promotion')}>
                <FiFileText className="icon" /> Report
              </button>
            </div>
          )}
        </div>
        <LogoutButton onClick={handleLogout}>
          <FiLogOut className="icon" /> Logout
        </LogoutButton>
      </div>
    </div>
  );
}

export default ClassAdviserSideBar;
