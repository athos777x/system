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
        {/* Core Management Features */}
        <div className="feature-card">
          <div className="feature-icon"><FaUserGraduate /></div>
          <h3 className="feature-title">Student Management</h3>
          <p className="feature-description">
            Manage student profiles, track enrollment status, and maintain comprehensive student records.
          </p>
        </div>

        <div className="feature-card">
          <div className="feature-icon"><FaChalkboardTeacher /></div>
          <h3 className="feature-title">Teacher Management</h3>
          <p className="feature-description">
            Organize teacher information, assignments, and qualifications in one centralized location.
          </p>
        </div>

        <div className="feature-card">
          <div className="feature-icon"><MdGrade /></div>
          <h3 className="feature-title">Academic Assessment</h3>
          <p className="feature-description">
            Record, calculate, and analyze student grades and test scores with an intuitive assessment system.
          </p>
        </div>

        <div className="feature-card">
          <div className="feature-icon"><FaCalendarAlt /></div>
          <h3 className="feature-title">Schedule Management</h3>
          <p className="feature-description">
            Create and manage class schedules, ensuring optimal resource allocation.
          </p>
        </div>

        {/* Additional Management Features */}
        <div className="feature-card">
          <div className="feature-icon"><FaBook /></div>
          <h3 className="feature-title">Subject Management</h3>
          <p className="feature-description">
            Organize academic subjects, assign teachers, and manage curriculum and assessment details.
          </p>
        </div>

        <div className="feature-card">
          <div className="feature-icon"><FaUserFriends /></div>
          <h3 className="feature-title">Section Management</h3>
          <p className="feature-description">
            Create and organize class sections, assign students, and manage section details.
          </p>
        </div>

        <div className="feature-card">
          <div className="feature-icon"><MdSchool /></div>
          <h3 className="feature-title">School Year Management</h3>
          <p className="feature-description">
            Define academic years, set important dates, and manage enrollment periods.
          </p>
        </div>

        <div className="feature-card">
          <div className="feature-icon"><FaClipboardList /></div>
          <h3 className="feature-title">Attendance Tracking</h3>
          <p className="feature-description">
            Record and monitor student attendance with detailed reporting capabilities.
          </p>
        </div>

        {/* Enrollment and Registration Features */}
        <div className="feature-card">
          <div className="feature-icon"><FaUserPlus /></div>
          <h3 className="feature-title">Enrollment Management</h3>
          <p className="feature-description">
            Process enrollment requests and manage lists of currently enrolled students across all sections.
          </p>
        </div>

        {/* Reporting Features */}
        <div className="feature-card">
          <div className="feature-icon"><MdAssessment /></div>
          <h3 className="feature-title">Reports & Analytics</h3>
          <p className="feature-description">
            Generate comprehensive reports and visualize data to track trends and make informed decisions.
          </p>
        </div>

        {/* Student Portal Features */}
        <div className="feature-card">
          <div className="feature-icon"><MdDashboard /></div>
          <h3 className="feature-title">Student Portal</h3>
          <p className="feature-description">
            Personalized dashboard for students to access their profiles, grades, schedules, and attendance.
          </p>
        </div>

        {/* Additional Features */}
        <div className="feature-card">
          <div className="feature-icon"><MdAccountCircle /></div>
          <h3 className="feature-title">Account Management</h3>
          <p className="feature-description">
            Manage user accounts, permissions, and system access for all stakeholders.
          </p>
        </div>

        <div className="feature-card">
          <div className="feature-icon"><FaHandsHelping /></div>
          <h3 className="feature-title">Brigada Eskwela</h3>
          <p className="feature-description">
            Coordinate and manage volunteer activities and community involvement programs.
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
