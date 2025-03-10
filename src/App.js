import React, { useState, useEffect } from 'react';
import { Navigate, Route, BrowserRouter as Router, Routes} from 'react-router-dom';
import './App.css';
import './CssFiles/LoginForm.css'; 
import LoginForm from './Utilities/LoginForm';
import Layout from './Utilities/Layout';
import HomePage from './TeacherPages/HomePage';
import Student_ProfilePage from './StudentPages/Student_ProfilePage';
import Student_GradesPage from './StudentPages/Student_GradesPage';
import Student_AttendancePage from './StudentPages/Student_AttendancePage';
import Student_SchedulePage from './StudentPages/Student_SchedulePage';
import Student_AccountPage from './StudentPages/Student_AccountPage';
import SubjectsManagement from './TeacherPages/SubjectsManagement';
import ScheduleManagement from './TeacherPages/ScheduleManagement';
import TestSubjectsManagement from './TeacherPages/TestSubjectsManagement';
import Student_EnrollmentPage from './StudentPages/Student_EnrollmentPage';
import AccountManagement from './TeacherPages/AccountManagement';
import StudentManagement from './TeacherPages/StudentManagement';
import TeacherManagement from './TeacherPages/TeacherManagement';
import AttendanceManagement from './TeacherPages/AttendanceManagement';
import EarlyEnrollmentReport from './TeacherPages/EarlyEnrollmentReport';
import EnrolledStudents from './TeacherPages/EnrolledStudents';
import GradesManagement from './TeacherPages/GradesManagement';
import StudentEnrollees from './TeacherPages/StudentEnrollees';
import SchoolYearManagement from './TeacherPages/SchoolYearManagement';
import SectionList from './TeacherPages/SectionList';
import SectionManagement from './TeacherPages/SectionManagement';
import PromotionReport from './TeacherPages/PromotionReport';
import BrigadaEskwela from './TeacherPages/BrigadaEskwela';
import ProfilePage from './Utilities/ProfilePage';
import Form137 from './reports/form_137';
import GoodMoral from './reports/good_moral';
import LateEnrollees from './Utilities/late_enrollee';
import StudentGrades from './TeacherPages/selected_grade';
import EnrollmentRequests from './TeacherPages/EnrollmentRequests';
import Form138 from './reports/form_138';
import TestGradesManagement from './TeacherPages/TestGradesManagement';
import SF1 from './reports/sf1';
import SF2 from './reports/sf2';
import SF4 from './reports/sf4';
import SF5 from './reports/sf5';
import SF6 from './reports/sf6';
import Teacher_SchedulePage from './TeacherPages/Teacher_SchedulePage';




function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(
    localStorage.getItem('isAuthenticated') === 'true'
  );
  const [role, setRole] = useState(localStorage.getItem('role') || '');

  useEffect(() => {
    setIsAuthenticated(localStorage.getItem('isAuthenticated') === 'true');
    setRole(localStorage.getItem('role') || '');
  }, []);

  const handleLogin = (username, password, navigate, userRole) => {
    setIsAuthenticated(true);
    setRole(userRole);
    localStorage.setItem('isAuthenticated', 'true');
    localStorage.setItem('role', userRole);
    navigate('/home');
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setRole('');
    localStorage.removeItem('isAuthenticated');
    localStorage.removeItem('role');
  };

  return (
    <Router>
      <Routes>
        <Route path="/" element={<LoginForm onLogin={handleLogin} />} />
        {isAuthenticated && (
          <Route element={<Layout role={role} handleLogout={handleLogout} />}>
            <Route path="/home" element={<HomePage />} />
            <Route path="/profile" element={<ProfilePage />} />
            
            <Route path="/stud-profile" element={<Student_ProfilePage />} />
            <Route path="/student-schedule" element={<Student_SchedulePage />} />
            <Route path="/student-grades" element={<Student_GradesPage />} />
            <Route path="/student-attendance" element={<Student_AttendancePage />} />
            <Route path="/enrollment" element={<Student_EnrollmentPage />} />
            <Route path="/enrollment/:studentId" element={<Student_EnrollmentPage />} />
            <Route path="/account" element={<Student_AccountPage />} />

            <Route path="/subjects" element={<SubjectsManagement />} />
            <Route path="/test-subjects" element={<TestSubjectsManagement />} />
            <Route path="/schedule" element={<ScheduleManagement />} />
            <Route path="/teacher-schedule" element={<Teacher_SchedulePage />} />

            <Route path="/student" element={<StudentManagement />} />
            <Route path="/employees" element={<TeacherManagement />} />
            <Route path="/attendance" element={<AttendanceManagement />} />
            <Route path="/early-enrollment-report" element={<EarlyEnrollmentReport />} />
            <Route path="/enrolled-students" element={<EnrolledStudents />} />
            <Route path="/account" element={<AccountManagement />} />
            <Route path="/grades" element={<GradesManagement />} />
            <Route path="/list-of-student-enrollees" element={<StudentEnrollees />} />
            <Route path="/school-year" element={<SchoolYearManagement />} />
            <Route path="/section-list" element={<SectionList />} />
            <Route path="/section" element={<SectionManagement />} />
            <Route path="/summary-report-promotion" element={<PromotionReport />} />
            <Route path="/brigada-eskwela" element={<BrigadaEskwela />} />
            <Route path="/pending-enrollment" element={<EnrollmentRequests />} />
            <Route path="/new-grades" element={<TestGradesManagement />} />

            <Route path="/form-137" element={<Form137 />} />
            <Route path="/form-138" element={<Form138 />} />
            <Route path="/good-moral" element={<GoodMoral />} />
            <Route path="/late-enrollee" element={<LateEnrollees/>} />
            <Route path="/sf1" element={<SF1 />} />
            <Route path="/sf2" element={<SF2 />} />
            <Route path="/sf4" element={<SF4 />} />
            <Route path="/sf5" element={<SF5 />} />
            <Route path="/sf6" element={<SF6 />} />

            <Route path="/student-grades" element={<StudentGrades />} />
            
          </Route>
          
        )}
        <Route path="*" element={<Navigate to={isAuthenticated ? '/home' : '/'} />} />
      </Routes>
    </Router>
  );
}

export default App;
