import React, { useState, useEffect } from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import HeaderBar from './HeadBar';
import StudentSideBar from '../RoleSidebars/StudentSideBar';
import PrincipalSideBar from '../RoleSidebars/PrincipalSideBar';
import RegistrarSideBar from '../RoleSidebars/RegistrarSideBar';
import SubjectTeacherSideBar from '../RoleSidebars/SubjectTeacherSideBar';
import ClassAdviserSideBar from '../RoleSidebars/ClassAdviserSideBar';
import AcademicCoordinatorSideBar from '../RoleSidebars/AcademicCoordinatorSideBar';
import GradeLevelCoordinatorSideBar from '../RoleSidebars/GradeLevelCoordinatorSideBar';
import SubjectCoordinatorSideBar from '../RoleSidebars/SubjectCoordinatorSideBar';

function Layout({ role, handleLogout }) {
  const [showSidebar, setShowSidebar] = useState(true);
  const [profileUpdated, setProfileUpdated] = useState(false);
  const [currentUserId, setCurrentUserId] = useState(localStorage.getItem('userId'));

  const toggleSidebar = () => {
    setShowSidebar(!showSidebar);
  };

  // Listen for changes to localStorage to detect profile picture updates and user changes
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === 'profilePictureUrl') {
        // Force a re-render when the profile picture is updated
        setProfileUpdated(prev => !prev);
      }
      
      if (e.key === 'userId') {
        // Update the current user ID when it changes
        setCurrentUserId(localStorage.getItem('userId'));
        // Also force a re-render for the profile picture
        setProfileUpdated(prev => !prev);
      }
    };

    // Add event listener for storage changes
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('storage-local', handleStorageChange);

    // Clean up the event listener when the component unmounts
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('storage-local', handleStorageChange);
    };
  }, []);

  const user = {
    fullName: localStorage.getItem('fullName') || 'Full Name',
    name: localStorage.getItem('username') || 'User',
    role: localStorage.getItem('role') || 'Role',
    userId: localStorage.getItem('userId')
  };

  if (!localStorage.getItem('isAuthenticated')) {
    return <Navigate to="/" />;
  }

  return (
    <div>
      <HeaderBar
        showSidebar={showSidebar}
        toggleSidebar={toggleSidebar}
        user={user}
        onLogout={handleLogout}
        key={`${profileUpdated}-${currentUserId}`} // Force re-render when profile is updated or user changes
      />
      {role === 'student' && (
        <StudentSideBar showSidebar={showSidebar} toggleSidebar={toggleSidebar} handleLogout={handleLogout} />
      )}
      {role === 'principal' && (
        <PrincipalSideBar showSidebar={showSidebar} toggleSidebar={toggleSidebar} handleLogout={handleLogout} />
      )}
      {role === 'registrar' && (
        <RegistrarSideBar showSidebar={showSidebar} toggleSidebar={toggleSidebar} handleLogout={handleLogout} />
      )}
      {role === 'subject_teacher' && (
        <SubjectTeacherSideBar showSidebar={showSidebar} toggleSidebar={toggleSidebar} handleLogout={handleLogout} />
      )}
      {role === 'class_adviser' && (
        <ClassAdviserSideBar showSidebar={showSidebar} toggleSidebar={toggleSidebar} handleLogout={handleLogout} />
      )}
      {role === 'academic_coordinator' && (
        <AcademicCoordinatorSideBar showSidebar={showSidebar} toggleSidebar={toggleSidebar} handleLogout={handleLogout} />
      )}
      {role === 'grade_level_coordinator' && (
        <GradeLevelCoordinatorSideBar showSidebar={showSidebar} toggleSidebar={toggleSidebar} handleLogout={handleLogout} />
      )}
      {role === 'subject_coordinator' && (
        <SubjectCoordinatorSideBar showSidebar={showSidebar} toggleSidebar={toggleSidebar} handleLogout={handleLogout} />
      )}
      <div className={`content ${showSidebar ? 'content-shift' : ''}`}>
        <Outlet />
      </div>
    </div>
  );
}

export default Layout;
