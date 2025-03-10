// PrincipalSideBar.js
import React, { useState } from 'react';
import '../CssFiles/sidebar.css';
import {
  FiHome,
  FiUsers,
  FiClipboard,
  FiBook,
  FiChevronLeft,
  FiMenu,
  FiUser,
  FiCalendar,
  FiBarChart2,
  FiFileText,
  FiCheckSquare,
  FiLogOut,
  FiClock
} from 'react-icons/fi';
import { useNavigate, useLocation } from 'react-router-dom';

function PrincipalSideBar({ showSidebar, toggleSidebar, handleLogout }) {
  const [showRecordsSubMenu, setShowRecordsSubMenu] = useState(false);
  const [showEnrollmentSubMenu, setShowEnrollmentSubMenu] = useState(false);
  const [showReportsSubMenu, setShowReportsSubMenu] = useState(false);
  const [showClassesSubMenu, setShowClassesSubMenu] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  // Check if current path is under a specific submenu
  const isRecordsPath = ['/grades', '/attendance'].includes(location.pathname);
  const isEnrollmentPath = ['/school-year', '/section-list', '/enrolled-students'].includes(location.pathname);
  const isClassesPath = ['/section', '/schedule'].includes(location.pathname);
  const isReportsPath = ['/summary-report-promotion'].includes(location.pathname);

  // Update useEffect to handle initial submenu state based on path
  React.useEffect(() => {
    setShowRecordsSubMenu(isRecordsPath);
    setShowEnrollmentSubMenu(isEnrollmentPath);
    setShowClassesSubMenu(isClassesPath);
    setShowReportsSubMenu(isReportsPath);
  }, [location.pathname]);

  const toggleRecordsSubMenu = () => {
    setShowRecordsSubMenu(!showRecordsSubMenu);
    setShowEnrollmentSubMenu(false);
    setShowReportsSubMenu(false);
    setShowClassesSubMenu(false);
    if (!showRecordsSubMenu) {
      navigate('/grades');
    }
  };

  const toggleEnrollmentSubMenu = () => {
    setShowEnrollmentSubMenu(!showEnrollmentSubMenu);
    setShowRecordsSubMenu(false);
    setShowReportsSubMenu(false);
    setShowClassesSubMenu(false);
    if (!showEnrollmentSubMenu) {
      navigate('/school-year');
    }
  };

  const toggleReportsSubMenu = () => {
    setShowReportsSubMenu(!showReportsSubMenu);
    setShowRecordsSubMenu(false);
    setShowEnrollmentSubMenu(false);
    setShowClassesSubMenu(false);
    if (!showReportsSubMenu) {
      navigate('/summary-report-promotion');
    }
  };

  const toggleClassesSubMenu = () => {
    setShowClassesSubMenu(!showClassesSubMenu);
    setShowRecordsSubMenu(false);
    setShowEnrollmentSubMenu(false);
    setShowReportsSubMenu(false);
    if (!showClassesSubMenu) {
      navigate('/section');
    }
  };

  const handleNavigate = (path) => {
    // Close all submenus when navigating
    setShowRecordsSubMenu(false);
    setShowEnrollmentSubMenu(false);
    setShowReportsSubMenu(false);
    setShowClassesSubMenu(false);
    navigate(path);
  };

  const handleLogoutClick = () => {
    handleLogout();
    navigate('/');
  };

  return (
    <div className={`sidebar ${showSidebar ? 'show' : 'hide'}`} style={{ zIndex: 1100 }}>
      <button className="toggle-btn" onClick={toggleSidebar}>
        {showSidebar ? <FiChevronLeft /> : <FiMenu />}
      </button>
      <div className="buttons">
        <button 
          onClick={() => handleNavigate('/home')}
          className={location.pathname === '/home' ? 'active' : ''}
        >
          <FiHome className="icon" /> Home
        </button>
        
        <button 
          onClick={() => handleNavigate('/student')}
          className={location.pathname === '/student' ? 'active' : ''}
        >
          <FiUsers className="icon" /> Students
        </button>
        <div className={`menu-with-submenu ${showRecordsSubMenu || isRecordsPath ? 'active' : ''}`}>
          <button onClick={toggleRecordsSubMenu}>
            <FiClipboard className="icon" /> Student Academic Records
          </button>
          {showRecordsSubMenu && (
            <div className="submenu">
              <button 
                onClick={() => handleNavigate('/grades')}
                className={location.pathname === '/grades' ? 'active' : ''}
              >
                <FiFileText className="icon" /> Grades
              </button>
              <button 
                onClick={() => handleNavigate('/attendance')}
                className={location.pathname === '/attendance' ? 'active' : ''}
              >
                <FiCheckSquare className="icon" /> Attendance
              </button>
            </div>
          )}
        </div>
        <button 
          onClick={() => handleNavigate('/employees')}
          className={location.pathname === '/employees' ? 'active' : ''}
        >
          <FiUsers className="icon" /> Employees
        </button>
        <button 
          onClick={() => handleNavigate('/teacher-schedule')}
          className={location.pathname === '/teacher-schedule' ? 'active' : ''}
        >
          <FiClock className="icon" /> My Schedule
        </button>
        <div className={`menu-with-submenu ${showEnrollmentSubMenu || isEnrollmentPath ? 'active' : ''}`}>
          <button onClick={toggleEnrollmentSubMenu}>
            <FiCalendar className="icon" /> Enrollment
          </button>
          {showEnrollmentSubMenu && (
            <div className="submenu">
              <button 
                onClick={() => handleNavigate('/school-year')}
                className={location.pathname === '/school-year' ? 'active' : ''}
              >
                <FiCalendar className="icon" /> School Year
              </button>
              <button 
                onClick={() => handleNavigate('/section-list')}
                className={location.pathname === '/section-list' ? 'active' : ''}
              >
                <FiBook className="icon" /> Section List
              </button>
              <button 
                onClick={() => handleNavigate('/enrolled-students')}
                className={location.pathname === '/enrolled-students' ? 'active' : ''}
              >
                <FiUsers className="icon" /> Enrolled Students
              </button>
            </div>
          )}
        </div>
        <div className={`menu-with-submenu ${showClassesSubMenu || isClassesPath ? 'active' : ''}`}>
          <button onClick={toggleClassesSubMenu}>
            <FiClipboard className="icon" /> Classes
          </button>
          {showClassesSubMenu && (
            <div className="submenu">
              <button 
                onClick={() => handleNavigate('/section')}
                className={location.pathname === '/section' ? 'active' : ''}
              >
                <FiBook className="icon" /> Section
              </button>
              <button 
                onClick={() => handleNavigate('/schedule')}
                className={location.pathname === '/schedule' ? 'active' : ''}
              >
                <FiCalendar className="icon" /> Schedule
              </button>
            </div>
          )}
        </div>
        <button 
          onClick={() => handleNavigate('/subjects')}
          className={location.pathname === '/subjects' ? 'active' : ''}
        >
          <FiBook className="icon" /> Subjects
        </button>
        <button 
          onClick={() => handleNavigate('/test-subjects')}
          className={location.pathname === '/test-subjects' ? 'active' : ''}
        >
          <FiBook className="icon" /> Test Subjects
        </button>
        <div className={`menu-with-submenu ${showReportsSubMenu || isReportsPath ? 'active' : ''}`}>
          <button onClick={toggleReportsSubMenu}>
            <FiBarChart2 className="icon" /> Generate Reports
          </button>
          {showReportsSubMenu && (
            <div className="submenu">
              <button 
                onClick={() => handleNavigate('/summary-report-promotion')}
                className={location.pathname === '/summary-report-promotion' ? 'active' : ''}
              >
                <FiFileText className="icon" /> Report
              </button>
            </div>
          )}
        </div>
        {/* <button 
          onClick={() => handleNavigate('/profile')}
          className={location.pathname === '/profile' ? 'active' : ''}
        >
          <FiUser className="icon" /> Profile
        </button> */}
        <button onClick={handleLogoutClick} className="logout-btn">
          <FiLogOut className="icon" /> Logout
        </button>
      </div>
    </div>
  );
}

export default PrincipalSideBar;
