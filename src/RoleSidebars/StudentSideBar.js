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
import { useNavigate, useLocation } from 'react-router-dom';

function StudentSideBar({ showSidebar, toggleSidebar, handleLogout }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [showAcademicsSubMenu, setShowAcademicsSubMenu] = useState(false);
  
  // Check if current path is under a specific submenu
  const isAcademicsPath = ['/student-grades', '/student-attendance'].includes(location.pathname);

  // Update useEffect to handle initial submenu state based on path
  React.useEffect(() => {
    setShowAcademicsSubMenu(isAcademicsPath);
  }, [location.pathname]);

  const toggleAcademicsSubMenu = () => {
    setShowAcademicsSubMenu(!showAcademicsSubMenu);
    if (!showAcademicsSubMenu) {
      navigate('/student-grades');
    }
  };

  const handleNavigate = (path) => {
    // Close all submenus when navigating
    setShowAcademicsSubMenu(false);
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
          onClick={() => handleNavigate('/stud-profile')}
          className={location.pathname === '/stud-profile' ? 'active' : ''}
        >
          <FiUser className="icon" /> Profile
        </button>
        <div className={`menu-with-submenu ${showAcademicsSubMenu || isAcademicsPath ? 'active' : ''}`}>
          <button onClick={toggleAcademicsSubMenu}>
            <FiBook className="icon" /> Academics
          </button>
          {showAcademicsSubMenu && (
            <div className="submenu">
              <button 
                onClick={() => handleNavigate('/student-grades')}
                className={location.pathname === '/student-grades' ? 'active' : ''}
              >
                <FiFileText className="icon" /> Grades
              </button>
              <button 
                onClick={() => handleNavigate('/student-attendance')}
                className={location.pathname === '/student-attendance' ? 'active' : ''}
              >
                <FiCheckSquare className="icon" /> Attendance
              </button>
            </div>
          )}
        </div>
        <button 
          onClick={() => handleNavigate('/enrollment')}
          className={location.pathname === '/enrollment' ? 'active' : ''}
        >
          <FiClipboard className="icon" /> Enrollment
        </button>
        <button 
          onClick={() => handleNavigate('/student-schedule')}
          className={location.pathname === '/student-schedule' ? 'active' : ''}
        >
          <FiCalendar className="icon" /> Schedule
        </button>
        <button onClick={() => handleLogout()}>
          <FiLogOut className="icon" /> Logout
        </button>
      </div>
    </div>
  );
}

export default StudentSideBar;
