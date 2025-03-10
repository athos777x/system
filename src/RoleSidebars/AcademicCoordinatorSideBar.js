// PrincipalSideBar.js
import React, { useState } from 'react';
import '../CssFiles/sidebar.css';
import {
  FiHome,
  FiClipboard,
  FiBook,
  FiChevronLeft,
  FiMenu,
  FiCalendar,
  FiSettings,
  FiUser,
  FiLogOut,
} from 'react-icons/fi';
import { useNavigate, useLocation } from 'react-router-dom';

function AcademicCoordinatorSideBar({ showSidebar, toggleSidebar, handleLogout }) {
  const [showClassesSubMenu, setShowClassesSubMenu] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  // Check if current path is under a specific submenu
  const isClassesPath = ['/section', '/schedule'].includes(location.pathname);

  // Update useEffect to handle initial submenu state based on path
  React.useEffect(() => {
    setShowClassesSubMenu(isClassesPath);
  }, [location.pathname]);

  const toggleClassesSubMenu = () => {
    setShowClassesSubMenu(!showClassesSubMenu);
    if (!showClassesSubMenu) {
      navigate('/section');
    }
  };

  const handleNavigate = (path) => {
    // Close all submenus when navigating
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
        {/* <button 
          onClick={() => handleNavigate('/profile')}
          className={location.pathname === '/profile' ? 'active' : ''}
        >
          <FiUser className="icon" /> Profile
        </button> */}
        {/* <button onClick={() => handleNavigate('/account')}>
        <FiSettings className="icon" /> Account
        </button> */}
        <button onClick={handleLogoutClick} className="logout-btn">
          <FiLogOut className="icon" /> Logout
        </button>
      </div>
    </div>
  );
}

export default AcademicCoordinatorSideBar;
