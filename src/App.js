import React, { useState, useEffect } from 'react';
import { Navigate, Route, BrowserRouter as Router, Routes} from 'react-router-dom';
import './App.css';
import './CssFiles/LoginForm.css'; 
import LoginForm from './Utilities/LoginForm';
import Layout from './Utilities/Layout';
import HomePage from './Pages/HomePage';
import Principal_StudentsPage from './PrincipalPages/Principal_StudentsPage';
import Principal_GradesPage from './PrincipalPages/Principal_GradesPage';
import Principal_AttendancePage from './PrincipalPages/Principal_AttendancePage';
import Principal_EmployeePage from './PrincipalPages/Principal_EmployeePage';
import Principal_SchoolYearPage from './PrincipalPages/Principal_SchoolYearPage';
import Principal_EnrolledStudentsPage from './PrincipalPages/Principal_EnrolledStudentsPage';
import Principal_SubjectsPage from './PrincipalPages/Principal_SubjectsPage';
import Principal_SectionListPage from './PrincipalPages/Principal_SectionListPage';
import Principal_SectionPage from './PrincipalPages/Principal_SectionPage';
import Principal_ListofStudentEnrolleesPage from './PrincipalPages/Principal_ListofStudentEnrolleesPage';
import Principal_SummaryReportonPromotionPage from './PrincipalPages/Principal_SummaryReportonPromotionPage';
import Principal_EarlyEnrollmentReportPage from './PrincipalPages/Principal_EarlyEnrollmentReportPage';
import Principal_StudentDetailPage from './PrincipalPages/Principal_StudentDetailPage';
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
import GradeLevel_AccountPage from './GradeLevelPages/GradeLevel_AccountPage';
import GradeLevel_AttendancePage from './GradeLevelPages/GradeLevel_AttendancePage';
import GradeLevel_EnrolledStudentsPage from './GradeLevelPages/GradeLevel_EnrolledStudentsPage';
import GradeLevel_GradesPage from './GradeLevelPages/GradeLevel_GradesPage';
import GradeLevel_SchoolYearPage from './GradeLevelPages/GradeLevel_SchoolYearPage';
import GradeLevel_SectionListPage from './GradeLevelPages/GradeLevel_SectionListPage';
import GradeLevel_StudentsPage from './GradeLevelPages/GradeLevel_StudentsPage';
import ClassAdviser_AccountPage from './ClassAdviserPages/ClassAdviser_AccountPage';
import ClassAdviser_StudentsPage from './ClassAdviserPages/ClassAdviser_StudentsPage';
import Academic_AccountPage from './AcademicPages/Academic_AccountPage';
import Academic_SchedulePage from './AcademicPages/Academic_SchedulePage';
import Academic_SectionPage from './AcademicPages/Academic_SectionPage';
import Subject_AccountPage from './SubjectPages/Subject_AccountPage';
import Subject_SubjectsPage from './SubjectPages/Subject_SubjectsPage';
import ProfilePage from './Utilities/ProfilePage';



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
            <Route path="/section-list" element={<Principal_SectionListPage />} />
            <Route path="/section" element={<Principal_SectionPage />} />
            <Route path="/students" element={<Principal_StudentsPage />} />
            <Route path="/students/:id/details" element={<Principal_StudentDetailPage />} />
            <Route path="/grades" element={<Principal_GradesPage />} />
            <Route path="/attendance" element={<Principal_AttendancePage />} />
            <Route path="/employees" element={<Principal_EmployeePage />} />
            <Route path="/school-year" element={<Principal_SchoolYearPage />} />
            <Route path="/enrolled-students" element={<Principal_EnrolledStudentsPage />} />
            <Route path="/subjects" element={<Principal_SubjectsPage />} />
            <Route path="/list-of-student-enrollees" element={<Principal_ListofStudentEnrolleesPage />} />
            <Route path="/summary-report-promotion" element={<Principal_SummaryReportonPromotionPage />} />
            <Route path="/early-enrollment-report" element={<Principal_EarlyEnrollmentReportPage />} />
            <Route path="/schedule" element={<Principal_SchedulePage />} />

            <Route path="/profile" element={<Student_ProfilePage />} />
            <Route path="/student-schedule" element={<Student_SchedulePage />} />
            <Route path="/student-grades" element={<Student_GradesPage />} />
            <Route path="/student-attendance" element={<Student_AttendancePage />} />
            <Route path="/enrollment" element={<Student_EnrollmentPage />} />
            <Route path="/enrollment/:studentId" element={<Student_EnrollmentPage />} />
            <Route path="/account" element={<Student_AccountPage />} />

            <Route path="/registrar-student" element={<Registrar_StudentsPage />} />
            <Route path="/registrar-teacher" element={<Registrar_TeacherPage />} />
            <Route path="/registrar-attendance" element={<Registrar_AttendancePage />} />
            <Route path="/registrar-early-enrollment-report" element={<Registrar_EarlyEnrollmentReportPage />} />
            <Route path="/registrar-enrolled-students" element={<Registrar_EnrolledStudentsPage />} />
            <Route path="/registrar-account" element={<Registrar_AccountPage />} />
            <Route path="/registrar-grades" element={<Registrar_GradesPage />} />
            <Route path="/registrar-list-of-student-enrollees" element={<Registrar_ListofStudentEnrolleesPage />} />
            <Route path="/registrar-school-year" element={<Registrar_SchoolYearPage />} />
            <Route path="/registrar-section-list" element={<Registrar_SectionListPage />} />
            <Route path="/registrar-section" element={<Registrar_SectionPage />} />
            <Route path="/registrar-summary-report-promotion" element={<Registrar_SummaryReportonPromotionPage />} />

            <Route path="/gradelevel-account" element={<GradeLevel_AccountPage />} />
            <Route path="/gradelevel-attendance" element={<GradeLevel_AttendancePage />} />
            <Route path="/gradelevel-enrolled-students" element={<GradeLevel_EnrolledStudentsPage />} />
            <Route path="/gradelevel-grades" element={<GradeLevel_GradesPage />} />
            <Route path="/gradelevel-school-year" element={<GradeLevel_SchoolYearPage />} />
            <Route path="/gradelevel-section-list" element={<GradeLevel_SectionListPage />} />
            <Route path="/gradelevel-students" element={<GradeLevel_StudentsPage />} />

            <Route path="/classadviser-account" element={<ClassAdviser_AccountPage />} />
            <Route path="/classadviser-students" element={<ClassAdviser_StudentsPage />} />

            <Route path="/academic-account" element={<Academic_AccountPage />} />
            <Route path="/academic-schedule" element={<Academic_SchedulePage />} />
            <Route path="/academic-section" element={<Academic_SectionPage />} />

            <Route path="/subject-account" element={<Subject_AccountPage />} />
            <Route path="/subject-subjects" element={<Subject_SubjectsPage />} />

          </Route>
          
        )}
        <Route path="*" element={<Navigate to={isAuthenticated ? '/home' : '/'} />} />
      </Routes>
    </Router>
  );
}

export default App;
