import React, { useState } from 'react';
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

  const toggleSidebar = () => {
    setShowSidebar(!showSidebar);
  };

  const user = {
    fullName: localStorage.getItem('fullName') || 'Full Name',
    name: localStorage.getItem('username') || 'User',
    role: localStorage.getItem('role') || 'Role'
  };

  if (!localStorage.getItem('isAuthenticated')) {
    return <Navigate to="/" />;
  }

  return (
    <div>
      <HeaderBar showSidebar={showSidebar} toggleSidebar={toggleSidebar} user={user} />
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
