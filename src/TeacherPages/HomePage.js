// HomePage.js
import React from 'react';
import '../TeacherPagesCss/HomePage.css';
import { 
  FaUserGraduate, 
  FaCalendarAlt, 
  FaBook, 
  FaChalkboardTeacher, 
  FaUserFriends, 
  FaClipboardList, 
  FaUserCog,
  FaClipboardCheck,
  FaFileAlt,
  FaUserPlus,
  FaUsers,
  FaChartLine,
  FaHandsHelping,
  FaIdCard,
  FaFilePdf
} from 'react-icons/fa';
import { 
  MdGrade, 
  MdSchool,
  MdAssignment,
  MdAccountCircle,
  MdDashboard,
  MdAssessment
} from 'react-icons/md';

function HomePage() {
  return (
    <div className="home-container">
      <div className="home-header">
        <h1 className="home-title">LNHS Portal</h1>
      </div>

      <div className="welcome-message">
        <h2 className="welcome-title">Welcome to LNHS Portal</h2>
        <p className="welcome-text">
          This comprehensive platform is designed to streamline educational administration processes,
          making it easier for teachers and administrators to manage students, grades, schedules, and more.
          Explore the various features below to get started.
        </p>
      </div>

      <div className="features-header">
        <h2 className="features-title">System Features</h2>
      </div>
      
      <div className="home-features">
        {/* Student Record Management */}
        <div className="feature-card">
          <div className="feature-icon"><FaUserGraduate /></div>
          <h3 className="feature-title">Student Record Management</h3>
          <p className="feature-description">
            Register new students, search records, view and edit student information, manage student status, and handle profile changes.
          </p>
        </div>

        {/* Student Academic Records */}
        <div className="feature-card">
          <div className="feature-icon"><MdGrade /></div>
          <h3 className="feature-title">Student Academic Records Management</h3>
          <p className="feature-description">
            Manage student grades, attendance records, view academic history, and generate Form 137/138.
          </p>
        </div>

        {/* Faculty/Registrar Management */}
        <div className="feature-card">
          <div className="feature-icon"><FaChalkboardTeacher /></div>
          <h3 className="feature-title">Faculty/Registrar Management</h3>
          <p className="feature-description">
            Add and manage faculty records, edit profiles, handle credentials, and maintain faculty information.
          </p>
        </div>

        {/* Enrollment Management */}
        <div className="feature-card">
          <div className="feature-icon"><FaUserPlus /></div>
          <h3 className="feature-title">Enrollment Management</h3>
          <p className="feature-description">
            Process enrollments, manage student sections, track brigade attendance, and view class lists.
          </p>
        </div>

        {/* Subject Management */}
        <div className="feature-card">
          <div className="feature-icon"><FaBook /></div>
          <h3 className="feature-title">Subject Management</h3>
          <p className="feature-description">
            Add and edit subjects, manage assigned subjects, view subject details, and archive subjects.
          </p>
        </div>

        {/* Section Management */}
        <div className="feature-card">
          <div className="feature-icon"><FaUsers /></div>
          <h3 className="feature-title">Section Management</h3>
          <p className="feature-description">
            Create sections, manage class schedules, handle advisory assignments, and view section records.
          </p>
        </div>

        {/* Report Generation */}
        <div className="feature-card">
          <div className="feature-icon"><FaFileAlt /></div>
          <h3 className="feature-title">Report Generation</h3>
          <p className="feature-description">
            Generate various reports including enrollment reports, Form 137, SF forms, class lists, and assessment reports.
          </p>
        </div>
      </div>

      <div className="optional-message">
        <p>Note: This homepage is optional and can be customized based on your specific needs. It is not included in the capstone paper documentation.</p>
      </div>
    </div>
  );
}

export default HomePage;
