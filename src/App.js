import React, { useState, useEffect } from 'react';
import { Navigate, Route, BrowserRouter as Router, Routes} from 'react-router-dom';
import './App.css';
import './CssFiles/LoginForm.css'; 
import LoginForm from './Utilities/LoginForm';
import Layout from './Utilities/Layout';
import HomePage from './Pages/HomePage';
import Principal_SubjectsPage from './PrincipalPages/Principal_SubjectsPage';
import Principal_SchedulePage from './PrincipalPages/Principal_SchedulePage'; 
import Student_ProfilePage from './StudentPages/Student_ProfilePage';
import Student_EnrollmentPage from './StudentPages/Student_EnrollmentPage';
import Student_SchedulePage from './StudentPages/Student_SchedulePage'; 
import Student_GradesPage from './StudentPages/Student_GradesPage';
import Student_AttendancePage from './StudentPages/Student_AttendancePage';
import Student_AccountPage from './StudentPages/Student_AccountPage';
import Registrar_AccountPage from './RegistrarPages/Registrar_AccountPage';
import Registrar_StudentsPage from './RegistrarPages/Registrar_StudentsPage';
import Registrar_TeacherPage from './RegistrarPages/Registrar_TeacherPage';
import Registrar_AttendancePage from './RegistrarPages/Registrar_AttendancePage';
import Registrar_EarlyEnrollmentReportPage from './RegistrarPages/Registrar_EarlyEnrollmentReportPage';
import Registrar_EnrolledStudentsPage from './RegistrarPages/Registrar_EnrolledStudentsPage';
import Registrar_GradesPage from './RegistrarPages/Registrar_GradesPage';
import Registrar_ListofStudentEnrolleesPage from './RegistrarPages/Registrar_ListofStudentEnrolleesPage';
import Registrar_SchoolYearPage from './RegistrarPages/Registrar_SchoolYearPage';
import Registrar_SectionListPage from './RegistrarPages/Registrar_SectionListPage';
import Registrar_SectionPage from './RegistrarPages/Registrar_SectionPage';
import Registrar_SummaryReportonPromotionPage from './RegistrarPages/Registrar_SummaryReportonPromotionPage';
import Registrar_BrigadaEskwela from './RegistrarPages/Registrar_BrigadaEskwela';
import ProfilePage from './Utilities/ProfilePage';
import Form137 from './reports/form_137';
import GoodMoral from './reports/good_moral';
import LateEnrollees from './Utilities/late_enrollee';
import StudentGrades from './Pages/selected_grade';





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

            <Route path="/subjects" element={<Principal_SubjectsPage />} />
            <Route path="/schedule" element={<Principal_SchedulePage />} />

            <Route path="/student" element={<Registrar_StudentsPage />} />
            <Route path="/employees" element={<Registrar_TeacherPage />} />
            <Route path="/attendance" element={<Registrar_AttendancePage />} />
            <Route path="/early-enrollment-report" element={<Registrar_EarlyEnrollmentReportPage />} />
            <Route path="/enrolled-students" element={<Registrar_EnrolledStudentsPage />} />
            <Route path="/account" element={<Registrar_AccountPage />} />
            <Route path="/grades" element={<Registrar_GradesPage />} />
            <Route path="/list-of-student-enrollees" element={<Registrar_ListofStudentEnrolleesPage />} />
            <Route path="/school-year" element={<Registrar_SchoolYearPage />} />
            <Route path="/section-list" element={<Registrar_SectionListPage />} />
            <Route path="/section" element={<Registrar_SectionPage />} />
            <Route path="/summary-report-promotion" element={<Registrar_SummaryReportonPromotionPage />} />
            <Route path="/brigada-eskwela" element={<Registrar_BrigadaEskwela />} />

            <Route path="/form-137" element={<Form137 />} />
            <Route path="/good-moral" element={<GoodMoral />} />
            <Route path="/late-enrollee" element={<LateEnrollees/>} />

            <Route path="/student-grades" element={<StudentGrades />} />
            
          </Route>
          
        )}
        <Route path="*" element={<Navigate to={isAuthenticated ? '/home' : '/'} />} />
      </Routes>
    </Router>
  );
}

export default App;
