// PrincipalSideBar.js
import React from 'react';
import '../CssFiles/sidebar.css';
import {
  FiHome,
  FiUsers,
  FiBook,
  FiChevronLeft,
  FiMenu,
  FiUser,
  FiSettings,
  FiLogOut
} from 'react-icons/fi';
import { useNavigate, useLocation } from 'react-router-dom';

function SubjectCoordinatorSideBar({ showSidebar, toggleSidebar, handleLogout }) {
  const navigate = useNavigate();
  const location = useLocation();

  const handleNavigate = (path) => {
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

export default SubjectCoordinatorSideBar;
