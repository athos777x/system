// PrincipalSideBar.js
import React, { useState, useEffect } from 'react';
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
  FiSettings,
  FiLogOut
} from 'react-icons/fi';
import { useNavigate, useLocation } from 'react-router-dom';

function GradeLevelCoordinatorSideBar({ showSidebar, toggleSidebar, handleLogout }) {
  const [showRecordsSubMenu, setShowRecordsSubMenu] = useState(false);
  const [showEnrollmentSubMenu, setShowEnrollmentSubMenu] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  // Check if current path is under a specific submenu
  const isRecordsPath = ['/grades', '/new-grades', '/attendance'].includes(location.pathname);
  const isEnrollmentPath = ['/pending-enrollment', '/school-year', '/section-list', '/enrolled-students'].includes(location.pathname);

  // Update useEffect to handle initial submenu state based on path
  useEffect(() => {
    setShowRecordsSubMenu(isRecordsPath);
    setShowEnrollmentSubMenu(isEnrollmentPath);
  }, [location.pathname]);

  const toggleRecordsSubMenu = () => {
    setShowRecordsSubMenu(!showRecordsSubMenu);
    setShowEnrollmentSubMenu(false);
    if (!showRecordsSubMenu) {
      navigate('/grades');
    }
  };

  const toggleEnrollmentSubMenu = () => {
    setShowEnrollmentSubMenu(!showEnrollmentSubMenu);
    setShowRecordsSubMenu(false);
    if (!showEnrollmentSubMenu) {
      navigate('/school-year');
    }
  };

  const handleNavigate = (path) => {
    // Close all submenus when navigating
    setShowRecordsSubMenu(false);
    setShowEnrollmentSubMenu(false);
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
        <button 
          onClick={() => handleNavigate('/section')}
          className={location.pathname === '/section' ? 'active' : ''}
        >
          <FiBook className="icon" /> Section
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
                onClick={() => handleNavigate('/new-grades')}
                className={location.pathname === '/new-grades' ? 'active' : ''}
              >
                <FiFileText className="icon" /> New Grades
              </button>
              <button 
                onClick={() => handleNavigate('/attendance')}
                className={location.pathname === '/attendance' ? 'active' : ''}
              >
                <FiCheckSquare className="icon" /> Attendance
              </button>
            </div>
          )}
          {/* <button onClick={() => handleNavigate('/account')}>
          <FiSettings className="icon" /> Account
          </button> */}
        </div>
        <div className={`menu-with-submenu ${showEnrollmentSubMenu || isEnrollmentPath ? 'active' : ''}`}>
          <button onClick={toggleEnrollmentSubMenu}>
            <FiCalendar className="icon" /> Enrollment
          </button>
          {showEnrollmentSubMenu && (
            <div className="submenu">
              <button 
                onClick={() => handleNavigate('/pending-enrollment')}
                className={location.pathname === '/pending-enrollment' ? 'active' : ''}
              >
                <FiUsers className="icon" /> Pending Enrollment
              </button>
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

export default GradeLevelCoordinatorSideBar;
