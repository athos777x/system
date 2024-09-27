// PrincipalSideBar.js
import React, { useState } from 'react';
import '../CssFiles/sidebar.css';
import {
  FiHome,
  FiUsers,
  FiClipboard,
  FiBook,
  FiLogOut,
  FiChevronLeft,
  FiMenu,
  FiUser,
  FiCalendar,
  FiBarChart2,
  FiFileText,
  FiCheckSquare
} from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import LogoutButton from '../Buttons/LogoutButton';

function PrincipalSideBar({ showSidebar, toggleSidebar, handleLogout }) {
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

  const toggleClassesSubMenu = () => {
    setShowClassesSubMenu(!showClassesSubMenu);
    setShowRecordsSubMenu(false);
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
        <button onClick={() => handleNavigate('/students')}>
          <FiUsers className="icon" /> Students
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
              <button onClick={() => handleNavigate('/attendance')}>
                <FiCheckSquare className="icon" /> Attendance
              </button>
            </div>
          )}
        </div>
        <button onClick={() => handleNavigate('/employees')}>
          <FiUser className="icon" /> Employee
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
              <button onClick={() => handleNavigate('/schedule')}>
                <FiCalendar className="icon" /> Schedule
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
              <button onClick={() => handleNavigate('/list-of-student-enrollees')}>
                <FiUsers className="icon" /> List of Student Enrollees
              </button>
              <button onClick={() => handleNavigate('/summary-report-promotion')}>
                <FiFileText className="icon" /> Summary Report
              </button>
              <button onClick={() => handleNavigate('/early-enrollment-report')}>
                <FiFileText className="icon" /> Early Enrollment Report
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

export default PrincipalSideBar;
