// PrincipalSideBar.js
import React, { useState } from 'react';
import '../CssFiles/sidebar.css';
import {
  FiHome,
  FiUsers,
  FiChevronLeft,
  FiMenu,
  FiUser,
  FiCalendar,
  FiBarChart2,
  FiFileText,
  FiBook,
  FiClipboard,
  FiLogOut,
  FiClock,
  FiCheckSquare,
  FiLayers,
  FiEye
} from 'react-icons/fi';
import { useNavigate, useLocation } from 'react-router-dom';

function ClassAdviserSideBar({ showSidebar, toggleSidebar, handleLogout }) {
  const [showRecordsSubMenu, setShowRecordsSubMenu] = useState(false);
  const [showEnrollmentSubMenu, setShowEnrollmentSubMenu] = useState(false);
  const [showClassesSubMenu, setShowClassesSubMenu] = useState(false);
  const [showExperimentalsSubMenu, setShowExperimentalsSubMenu] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  // Check if current path is under a specific submenu
  const isRecordsPath = ['/new-grades', '/attendance'].includes(location.pathname);
  const isEnrollmentPath = ['/enroll-student', '/pending-enrollment', '/school-year', '/section-list', '/enrolled-students', '/brigada-eskwela', '/brigada-eskwela-view'].includes(location.pathname);
  const isClassesPath = ['/section', '/schedule'].includes(location.pathname);
  const isExperimentalsPath = ['/grades'].includes(location.pathname);

  // Update useEffect to handle initial submenu state based on path
  React.useEffect(() => {
    setShowRecordsSubMenu(isRecordsPath);
    setShowEnrollmentSubMenu(isEnrollmentPath);
    setShowClassesSubMenu(isClassesPath);
    setShowExperimentalsSubMenu(isExperimentalsPath);
  }, [location.pathname]);

  const toggleRecordsSubMenu = () => {
    setShowRecordsSubMenu(!showRecordsSubMenu);
    setShowEnrollmentSubMenu(false);
    setShowClassesSubMenu(false);
    setShowExperimentalsSubMenu(false);
    if (!showRecordsSubMenu) {
      navigate('/new-grades');
    }
  };

  const toggleEnrollmentSubMenu = () => {
    setShowEnrollmentSubMenu(!showEnrollmentSubMenu);
    setShowClassesSubMenu(false);
    setShowRecordsSubMenu(false);
    setShowExperimentalsSubMenu(false);
    if (!showEnrollmentSubMenu) {
      navigate('/enroll-student');
    }
  };

  const toggleClassesSubMenu = () => {
    setShowClassesSubMenu(!showClassesSubMenu);
    setShowEnrollmentSubMenu(false);
    setShowRecordsSubMenu(false);
    setShowExperimentalsSubMenu(false);
    if (!showClassesSubMenu) {
      navigate('/schedule');
    }
  };

  const toggleExperimentalsSubMenu = () => {
    setShowExperimentalsSubMenu(!showExperimentalsSubMenu);
    setShowRecordsSubMenu(false);
    setShowEnrollmentSubMenu(false);
    setShowClassesSubMenu(false);
    if (!showExperimentalsSubMenu) {
      navigate('/grades');
    }
  };

  const handleNavigate = (path) => {
    // Close all submenus when navigating
    setShowRecordsSubMenu(false);
    setShowEnrollmentSubMenu(false);
    setShowClassesSubMenu(false);
    setShowExperimentalsSubMenu(false);
    navigate(path);
  };

  const handleLogoutClick = () => {
    handleLogout();
    navigate('/');
  };

  return (
    <div className={`sidebar ${showSidebar ? 'show' : 'hide'}`}>
      
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
                onClick={() => handleNavigate('/new-grades')}
                className={location.pathname === '/new-grades' ? 'active' : ''}
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
                onClick={() => handleNavigate('/enroll-student')}
                className={location.pathname === '/enroll-student' ? 'active' : ''}
              >
                <FiUsers className="icon" /> Enroll Student
              </button>
              <button 
                onClick={() => handleNavigate('/pending-enrollment')}
                className={location.pathname === '/pending-enrollment' ? 'active' : ''}
              >
                <FiUsers className="icon" /> Pending Enrollment
              </button>
              {/* <button 
                onClick={() => handleNavigate('/school-year')}
                className={location.pathname === '/school-year' ? 'active' : ''}
              >
                <FiCalendar className="icon" /> School Year
              </button> */}
              <button 
                onClick={() => handleNavigate('/section-list')}
                className={location.pathname === '/section-list' ? 'active' : ''}
              >
                <FiBook className="icon" /> Class List
              </button>
              <button 
                onClick={() => handleNavigate('/enrolled-students')}
                className={location.pathname === '/enrolled-students' ? 'active' : ''}
              >
                <FiUsers className="icon" /> Enrolled Students
              </button>
              <button 
                onClick={() => handleNavigate('/brigada-eskwela')}
                className={location.pathname === '/brigada-eskwela' ? 'active' : ''}
              >
                <FiCheckSquare className="icon" /> Check Brigada Eskwela
              </button>
              <button 
                onClick={() => handleNavigate('/brigada-eskwela-view')}
                className={location.pathname === '/brigada-eskwela-view' ? 'active' : ''}
              >
                <FiEye className="icon" /> View Brigada Eskwela
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
              {/* <button 
                onClick={() => handleNavigate('/section')}
                className={location.pathname === '/section' ? 'active' : ''}
              >
                <FiBook className="icon" /> Section
              </button> */}
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
          onClick={() => handleNavigate('/summary-report-promotion')}
          className={location.pathname === '/summary-report-promotion' ? 'active' : ''}
        >
          <FiFileText className="icon" /> Generate Report
        </button>
        {/* <button 
          onClick={() => handleNavigate('/profile')}
          className={location.pathname === '/profile' ? 'active' : ''}
        >
          <FiUser className="icon" /> Profile
        </button> */}
        {/* <div className={`menu-with-submenu ${showExperimentalsSubMenu || isExperimentalsPath ? 'active' : ''}`}>
          <button onClick={toggleExperimentalsSubMenu}>
            <FiLayers className="icon" /> Experimentals
          </button>
          {showExperimentalsSubMenu && (
            <div className="submenu">
              <button 
                onClick={() => handleNavigate('/grades')}
                className={location.pathname === '/grades' ? 'active' : ''}
              >
                <FiFileText className="icon" /> Test Grades
              </button>
            </div>
          )}
        </div> */}
        <button onClick={handleLogoutClick} className="logout-btn">
          <FiLogOut className="icon" /> Logout
        </button>
      </div>
    </div>
  );
}

export default ClassAdviserSideBar;
