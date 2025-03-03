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
import { useNavigate, useLocation } from 'react-router-dom';
import LogoutButton from '../Buttons/LogoutButton';

function ClassAdviserSideBar({ showSidebar, toggleSidebar, handleLogout }) {
  const [showEnrollmentSubMenu, setShowEnrollmentSubMenu] = useState(false);
  const [showReportsSubMenu, setShowReportsSubMenu] = useState(false);
  const [showClassesSubMenu, setShowClassesSubMenu] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  // Check if current path is under a specific submenu
  const isEnrollmentPath = ['/school-year', '/section-list', '/enrolled-students'].includes(location.pathname);
  const isClassesPath = ['/section'].includes(location.pathname);
  const isReportsPath = ['/summary-report-promotion'].includes(location.pathname);

  // Update useEffect to handle initial submenu state based on path
  React.useEffect(() => {
    setShowEnrollmentSubMenu(isEnrollmentPath);
    setShowClassesSubMenu(isClassesPath);
    setShowReportsSubMenu(isReportsPath);
  }, [location.pathname]);

  const toggleEnrollmentSubMenu = () => {
    setShowEnrollmentSubMenu(!showEnrollmentSubMenu);
    setShowReportsSubMenu(false);
    setShowClassesSubMenu(false);
    if (!showEnrollmentSubMenu) {
      navigate('/school-year');
    }
  };

  const toggleReportsSubMenu = () => {
    setShowReportsSubMenu(!showReportsSubMenu);
    setShowEnrollmentSubMenu(false);
    setShowClassesSubMenu(false);
    if (!showReportsSubMenu) {
      navigate('/summary-report-promotion');
    }
  };

  const toggleClassesSubMenu = () => {
    setShowClassesSubMenu(!showClassesSubMenu);
    setShowEnrollmentSubMenu(false);
    setShowReportsSubMenu(false);
    if (!showClassesSubMenu) {
      navigate('/section');
    }
  };

  const handleNavigate = (path) => {
    // Close all submenus when navigating
    setShowEnrollmentSubMenu(false);
    setShowReportsSubMenu(false);
    setShowClassesSubMenu(false);
    navigate(path);
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
          onClick={() => handleNavigate('/profile')}
          className={location.pathname === '/profile' ? 'active' : ''}
        >
          <FiUser className="icon" /> Profile
        </button>
        <button 
          onClick={() => handleNavigate('/student')}
          className={location.pathname === '/student' ? 'active' : ''}
        >
          <FiUsers className="icon" /> Students
        </button>
        <button 
          onClick={() => handleNavigate('/section')}
          className={location.pathname === '/section' ? 'active' : ''}
        >
          <FiBook className="icon" /> Section
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
            </div>
          )}
        </div>
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
        <LogoutButton onClick={handleLogout}>
          <FiLogOut className="icon" /> Logout
        </LogoutButton>
      </div>
    </div>
  );
}

export default ClassAdviserSideBar;
