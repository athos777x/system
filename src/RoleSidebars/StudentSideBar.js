import React, { useState } from 'react';
import '../CssFiles/sidebar.css';
import {
  FiHome,
  FiUser,
  FiBook,
  FiCalendar,
  FiClipboard,
  FiLogOut,
  FiMenu,
  FiChevronLeft,
  FiFileText,
  FiCheckSquare,
  FiSettings
} from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';

function StudentSideBar({ showSidebar, toggleSidebar, handleLogout }) {
  const navigate = useNavigate();
  const [showAcademicsSubMenu, setShowAcademicsSubMenu] = useState(false);

  const toggleAcademicsSubMenu = () => {
    setShowAcademicsSubMenu(!showAcademicsSubMenu);
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
        <div className={`menu-with-submenu ${showAcademicsSubMenu ? 'active' : ''}`}>
          <button onClick={toggleAcademicsSubMenu}>
            <FiBook className="icon" /> Academics
          </button>
          {showAcademicsSubMenu && (
            <div className="submenu">
              <button onClick={() => handleNavigate('/student-grades')}>
                <FiFileText className="icon" /> Grades
              </button>
              <button onClick={() => handleNavigate('/student-attendance')}>
                <FiCheckSquare className="icon" /> Attendance
              </button>
            </div>
          )}
        </div>
        <button onClick={() => handleNavigate('/enrollment')}>
          <FiClipboard className="icon" /> Enrollment
        </button>
        <button onClick={() => handleNavigate('/student-schedule')}>
          <FiCalendar className="icon" /> Schedule
        </button>
        <button onClick={() => handleNavigate('/account')}>
          <FiSettings className="icon" /> Account
        </button>
        <button onClick={() => handleLogout()}>
          <FiLogOut className="icon" /> Logout
        </button>
      </div>
    </div>
  );
}

export default StudentSideBar;
