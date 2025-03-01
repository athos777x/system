import React, { useState } from 'react';
import '../CssFiles/sidebar.css';
import '../CssFiles/sidebar.css';
import {
  FiHome,
  FiUsers,
  FiClipboard,
  FiBook,
  FiLogOut,
  FiChevronLeft,
  FiMenu,
  FiCalendar,
  FiBarChart2,
  FiFileText,
  FiCheckSquare
} from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import LogoutButton from '../Buttons/LogoutButton';

function RegistrarSideBar({ showSidebar, toggleSidebar, handleLogout }) {
  const [showRecordsSubMenu, setShowRecordsSubMenu] = useState(false);
  const [showEnrollmentSubMenu, setShowEnrollmentSubMenu] = useState(false);
  const [showReportsSubMenu, setShowReportsSubMenu] = useState(false);
  const [showClassesSubMenu, setShowClassesSubMenu] = useState(false);
  const navigate = useNavigate();

  const toggleRecordsSubMenu = () => {
    setShowRecordsSubMenu(!showRecordsSubMenu);
    setShowEnrollmentSubMenu(false);
    setShowReportsSubMenu(false);
    setShowClassesSubMenu(false);
  };

  const toggleEnrollmentSubMenu = () => {
    setShowEnrollmentSubMenu(!showEnrollmentSubMenu);
    setShowRecordsSubMenu(false);
    setShowReportsSubMenu(false);
    setShowClassesSubMenu(false);
  };

  const toggleReportsSubMenu = () => {
    setShowReportsSubMenu(!showReportsSubMenu);
    setShowRecordsSubMenu(false);
    setShowEnrollmentSubMenu(false);
    setShowClassesSubMenu(false);
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
      <button onClick={() => handleNavigate('/student')}>
        <FiUsers className="icon" /> Students
      </button>
      <button onClick={() => handleNavigate('/employees')}>
        <FiUsers className="icon" /> Teacher
      </button>
      <div className={`menu-with-submenu ${showRecordsSubMenu ? 'active' : ''}`}>
        <button onClick={toggleRecordsSubMenu}>
          <FiClipboard className="icon" /> Student Academic Records
        </button>
        {showRecordsSubMenu && (
          <div className="submenu">
            <button onClick={() => handleNavigate('/grades')}>
              <FiFileText className="icon" /> Grades
            </button>
            <button onClick={() => handleNavigate('/new-grades')}>
              <FiFileText className="icon" /> New Grades
            </button>
            <button onClick={() => handleNavigate('/attendance')}>
              <FiCheckSquare className="icon" /> Attendance
            </button>
            <button onClick={() => handleNavigate('/brigada-eskwela')}>
              <FiCheckSquare className="icon" /> Brigada Eskwela
            </button>
          </div>
        )}
      </div>
      <div className={`menu-with-submenu ${showEnrollmentSubMenu ? 'active' : ''}`}>
        <button onClick={toggleEnrollmentSubMenu}>
          <FiCalendar className="icon" /> Enrollment
        </button>
        {showEnrollmentSubMenu && (
          <div className="submenu">
            <button onClick={() => handleNavigate('/pending-enrollment')}>
              <FiUsers className="icon" /> Pending Enrollment
            </button>
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
      <button onClick={() => handleNavigate('/subjects')}>
        <FiBook className="icon" /> Subjects
      </button>
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


export default RegistrarSideBar;
