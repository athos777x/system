// PrincipalSideBar.js
import React, { useState } from 'react';
import '../CssFiles/sidebar.css';
import {
  FiHome,
  FiUsers,
  FiBook,
  FiChevronLeft,
  FiMenu,
  FiUser,
  FiSettings,
  FiLogOut,
  FiLayers
} from 'react-icons/fi';
import { useNavigate, useLocation } from 'react-router-dom';

function SubjectCoordinatorSideBar({ showSidebar, toggleSidebar, handleLogout }) {
  const [showExperimentalsSubMenu, setShowExperimentalsSubMenu] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  // Check if current path is under a specific submenu
  const isExperimentalsPath = ['/subjects'].includes(location.pathname);

  // Update useEffect to handle initial submenu state based on path
  React.useEffect(() => {
    setShowExperimentalsSubMenu(isExperimentalsPath);
  }, [location.pathname]);

  const toggleExperimentalsSubMenu = () => {
    setShowExperimentalsSubMenu(!showExperimentalsSubMenu);
    if (!showExperimentalsSubMenu) {
      navigate('/subjects');
    }
  };

  const handleNavigate = (path) => {
    // Close all submenus when navigating
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
        <button 
          onClick={() => handleNavigate('/test-subjects')}
          className={location.pathname === '/test-subjects' ? 'active' : ''}
        >
          <FiBook className="icon" /> Subjects
        </button>

        {/* <div className={`menu-with-submenu ${showExperimentalsSubMenu || isExperimentalsPath ? 'active' : ''}`}>
          <button onClick={toggleExperimentalsSubMenu}>
            <FiLayers className="icon" /> Experimentals
          </button>
          {showExperimentalsSubMenu && (
            <div className="submenu">
              <button 
                onClick={() => handleNavigate('/subjects')}
                className={location.pathname === '/subjects' ? 'active' : ''}
              >
                <FiBook className="icon" /> Test Subjects
              </button>
            </div>
          )}
        </div> */}
        
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

export default SubjectCoordinatorSideBar;
