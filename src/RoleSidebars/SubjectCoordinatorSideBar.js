// PrincipalSideBar.js
import React, { useState } from 'react';
import '../CssFiles/sidebar.css';
import {
  FiHome,
  FiUsers,
  FiBook,
  FiLogOut,
  FiChevronLeft,
  FiMenu,
  FiUser,
  FiSettings
} from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import LogoutButton from '../Buttons/LogoutButton';

function SubjectCoordinatorSideBar({ showSidebar, toggleSidebar, handleLogout }) {
  const navigate = useNavigate();

  

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
        <button onClick={() => handleNavigate('/profile')}>
          <FiUser className="icon" /> Profile
        </button>
        <button onClick={() => handleNavigate('/student')}>
          <FiUsers className="icon" /> Students
        </button>
        <button onClick={() => handleNavigate('/subjects')}>
          <FiBook className="icon" /> Subjects
        </button>
        {/* <button onClick={() => handleNavigate('/account')}>
          <FiSettings className="icon" /> Account
        </button> */}
        <LogoutButton onClick={handleLogout}>
          <FiLogOut className="icon" /> Logout
        </LogoutButton>
      </div>
    </div>
  );
}

export default SubjectCoordinatorSideBar;
