import React, { useState, useEffect } from 'react';
import axios from 'axios';
import '../TeacherPagesCss/GradesManagement.css';
import Pagination from '../Utilities/pagination';
import { useNavigate } from 'react-router-dom';
import StudentSearchFilter from '../RoleSearchFilters/StudentSearchFilter';

function GradesManagement() {
  const navigate = useNavigate();
  const [filteredStudents, setFilteredStudents] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [studentsPerPage] = useState(20);
  const [students, setStudents] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [editingStudent, setEditingStudent] = useState(null);
  const [gradesFetched, setGradesFetched] = useState(false);
  const [schoolYears, setSchoolYears] = useState([]);
  const [sections, setSections] = useState([]);
  const [filteredSections, setFilteredSections] = useState([]);
  const [roleName, setRoleName] = useState('');
  const [selectedSchoolYear, setSelectedSchoolYear] = useState({});
  const [assignedSubjects, setAssignedSubjects] = useState([]);
  const [coordinatorGradeLevel, setCoordinatorGradeLevel] = useState(null);
  const [filters, setFilters] = useState({
    searchTerm: '',
    school_year: '',
    grade: '',
    section: '',
    status: ''
  });
  const [selectedGradeLevel, setSelectedGradeLevel] = useState(null);
  const [studentSchoolYears, setStudentSchoolYears] = useState({});

  useEffect(() => {
    fetchAllSchoolYears();
    fetchSections();
  
    if (roleName) {
      if (roleName === 'grade_level_coordinator') {
        // Wait for coordinator grade level to be set before fetching students
        if (coordinatorGradeLevel) {
          fetchStudents({ grade: coordinatorGradeLevel.toString() });
        }
      } else {
      fetchStudents(roleName);
      if (roleName === 'subject_teacher') {
        fetchAssignedSubjects();
      }
    }
    }
  }, [roleName, coordinatorGradeLevel]);

  useEffect(() => {
    if (students.length > 0) {
      applyFilters();
    }
  }, [filters]);

  useEffect(() => {
    if (filters.grade) {
      // Filter sections based on the selected grade level
      const sectionsForGrade = sections.filter(section => String(section.grade_level) === String(filters.grade));
      setFilteredSections(sectionsForGrade);
    } else {
      setFilteredSections(sections);
    }
  }, [filters.grade, sections]);

  useEffect(() => {
    if (coordinatorGradeLevel && sections.length > 0) {
      // When coordinator's grade level is set, filter sections by that grade level
      const sectionsForGrade = sections.filter(section => 
        String(section.grade_level) === String(coordinatorGradeLevel)
      );
      setFilteredSections(sectionsForGrade);
    }
  }, [coordinatorGradeLevel, sections]);

  useEffect(() => {
    const userId = localStorage.getItem('userId'); // Retrieve userId from localStorage
    if (userId) {
      console.log(`Retrieved userId from localStorage: ${userId}`); // Debugging log
      fetchUserRole(userId);
    } else {
      console.error('No userId found in localStorage');
    }
  }, []);

  const fetchUserRole = async (userId) => {
    try {
      console.log(`Fetching role for user ID: ${userId}`); // Debugging log
      const response = await axios.get(`http://localhost:3001/user-role/${userId}`);
      if (response.status === 200) {
        console.log('Response received:', response.data); // Debugging log
        setRoleName(response.data.role_name);
        console.log('Role name set to:', response.data.role_name); // Debugging log
        
        // If user is a grade level coordinator, fetch their assigned grade level
        if (response.data.role_name === 'grade_level_coordinator') {
          fetchCoordinatorGradeLevel(userId);
        }
      } else {
        console.error('Failed to fetch role name. Response status:', response.status);
      }
    } catch (error) {
      if (error.response) {
        console.error('Error response from server:', error.response.data);
      } else if (error.request) {
        console.error('No response received from server. Request:', error.request);
      } else {
        console.error('Error setting up request:', error.message);
      }
    }
  };
  
  const fetchCoordinatorGradeLevel = async (userId) => {
    try {
      const response = await axios.get(`http://localhost:3001/coordinator-grade-level/${userId}`);
      if (response.status === 200 && response.data.gradeLevel) {
        console.log('Coordinator grade level:', response.data.gradeLevel);
        setCoordinatorGradeLevel(response.data.gradeLevel);
        // Auto-set the grade filter to the coordinator's assigned grade level
        setFilters(prev => ({ ...prev, grade: response.data.gradeLevel.toString() }));
      }
    } catch (error) {
      console.error('Error fetching coordinator grade level:', error);
    }
  };

  const fetchStudents = async (appliedFilters = {}) => {
    try {
      const userId = localStorage.getItem('userId'); // Retrieve userId from localStorage
      const filteredParams = { ...appliedFilters };
  
      if (userId) {
        filteredParams.user_id = userId; // Add user_id to the request parameters
      }
  
      // Correct the condition for roleName to use the appropriate endpoint
      const endpoint = roleName === 'subject_teacher'
        ? `http://localhost:3001/students/by-teacher`
        : 'http://localhost:3001/students';  // Default endpoint
  
      const response = await axios.get(endpoint, {
        params: filteredParams // Ensure you're passing filteredParams
      });
  
      // Sort students by last name (ascending order)
      const sortedStudents = response.data.sort((a, b) => b.lastName);
  
      let filteredStudents = sortedStudents;
      
      // For grade level coordinators, filter the students by their assigned grade level
      if (roleName === 'grade_level_coordinator' && coordinatorGradeLevel) {
        filteredStudents = sortedStudents.filter(student => 
          student.current_yr_lvl.toString() === coordinatorGradeLevel.toString()
        );
      }
  
      setStudents(filteredStudents);
      setFilteredStudents(filteredStudents);
    } catch (error) {
      console.error('Error fetching students:', error);
    }
  };
  
  const fetchAllSchoolYears = async () => {
    try {
      const response = await axios.get('http://localhost:3001/api/school_years');
      setSchoolYears(response.data);
    } catch (error) {
      console.error('Error fetching school years:', error);
    }
  };

  const fetchSchoolYearsGrades = async (studentId) => {
    try {
      // Important: For this specific endpoint, we always want to fetch ALL grade levels
      // for a student regardless of the coordinator's assigned grade level
      const response = await axios.get(`http://localhost:3001/get-grade-level/${studentId}`);
      
      if (response.status === 200) {
        // Store student-specific school years in the new state
        setStudentSchoolYears(prev => ({
          ...prev,
          [studentId]: response.data
        }));
        
        // Set default selected grade level and school year if not already set
        if (!selectedGradeLevel && response.data.length > 0) {
          setSelectedGradeLevel(response.data[0].grade_level);
          setSelectedSchoolYear(response.data[0].school_year_id);
        }
      } else {
        console.error('Failed to fetch school years:', response.status);
      }
    } catch (error) {
      console.error('Error fetching school years:', error);
    }
  };
  
  

  const fetchSections = async () => {
    try {
      const response = await axios.get('http://localhost:3001/sections');
      setSections(response.data);
      setFilteredSections(response.data);
    } catch (error) {
      console.error('Error fetching sections:', error);
    }
  };

  const handleStudentClick = async (student) => {
    if (selectedStudent && selectedStudent.student_id === student.student_id) {
        setSelectedStudent(null);
        setSubjects([]);
        setGradesFetched(false);
        setSelectedGradeLevel(null);
        setSelectedSchoolYear(null); // Reset school year when unselecting
        return;
    }

    setSelectedStudent(student);
    setEditingStudent(null);
    setGradesFetched(false);
    
    const gradeLevel = student.current_yr_lvl;
    const schoolYearId = student.school_year_id; // Ensure schoolYearId is retrieved
    const section_id = student.section_id

    setSelectedGradeLevel(gradeLevel);
    setSelectedSchoolYear(schoolYearId); // Set the selected school year

    if (!schoolYearId) {
        console.error("No school year found for the selected student.");
        return;
    }

    // Fetch subjects and grades with the correct school year
    const fetchedSubjects = await fetchSubjects(student.student_id, gradeLevel, schoolYearId,section_id);
    await fetchGrades(student.student_id, gradeLevel, fetchedSubjects, schoolYearId,section_id);
    await fetchSchoolYearsGrades(student.student_id); // Pass studentId here
};


  const fetchSubjects = async (studentId, gradeLevel, schoolYearId, section_id) => {
    if (!studentId || !gradeLevel || !schoolYearId) return [];

    try {
      const response = await axios.get('http://localhost:3001/api/subjects-card', {
        params: { 
          studentId, 
          gradeLevel,
          schoolYearId,
          section_id
        },
      });
      const subjectsData = response.data || [];
      setSubjects(subjectsData);
      return subjectsData;
    } catch (error) {
      console.error('Error fetching subjects:', error);
      return [];
    }
};



  const handleGradeChange = (index, period, value) => {
    // Allow empty value
    if (value === "") {
      setSubjects((prevSubjects) => {
        const updatedSubjects = [...prevSubjects];
        updatedSubjects[index] = { 
          ...updatedSubjects[index], 
          [period]: value,
          [`${period}_invalid`]: false 
        };
        return updatedSubjects;
      });
      return;
    }

    // Only allow numbers
    if (!/^\d+$/.test(value)) {
      return;
    }

    // Convert to number for validation
    const numValue = parseInt(value);

    // Set invalid flag if complete number is outside range
    const isInvalid = (value.length === 2 || value.length === 3) && (numValue < 70 || numValue > 100);

    setSubjects((prevSubjects) => {
      const updatedSubjects = [...prevSubjects];
      updatedSubjects[index] = { 
        ...updatedSubjects[index], 
        [period]: value,
        [`${period}_invalid`]: isInvalid 
      };

      // Only calculate final grade if all quarters have valid grades
      if (!isInvalid) {
        const q1 = parseFloat(updatedSubjects[index].q1) || 0;
        const q2 = parseFloat(updatedSubjects[index].q2) || 0;
        const q3 = parseFloat(updatedSubjects[index].q3) || 0;
        const q4 = parseFloat(updatedSubjects[index].q4) || 0;

        const hasAllGrades = updatedSubjects[index].q1 && 
                           updatedSubjects[index].q2 && 
                           updatedSubjects[index].q3 && 
                           updatedSubjects[index].q4;

        if (hasAllGrades) {
          const finalGrade = (q1 + q2 + q3 + q4) / 4;
          updatedSubjects[index].final = finalGrade.toFixed(2);
          updatedSubjects[index].remarks = finalGrade >= 75 ? "Passed" : "Failed";
        } else {
          updatedSubjects[index].final = "";
          updatedSubjects[index].remarks = "___";
        }
      }

      return updatedSubjects;
    });
  };

  const handleSaveChanges = async () => {
    try {
      if (!selectedStudent || subjects.length === 0) {
        alert("No student or subjects selected.");
        return;
      }

      // Filter to only include the subjects that the teacher is assigned to
      const formattedSubjects = subjects
        .filter(subject => roleName !== 'subject_teacher' || isSubjectAssigned(subject.subject_name))
        .map(subject => ({
          subject_name: subject.subject_name,
          q1: subject.q1 || null,
          q2: subject.q2 || null,
          q3: subject.q3 || null,
          q4: subject.q4 || null,
        }));

      if (formattedSubjects.length === 0) {
        alert("You don't have permission to edit any of these subjects.");
        return;
      }

      const response = await axios.post("http://localhost:3001/api/save-grade", {
        student_id: selectedStudent.student_id,
        student_name: `${selectedStudent.firstname} ${selectedStudent.lastname}`,
        grade_level: selectedStudent.current_yr_lvl,
        school_year_id: selectedStudent.school_year_id,
        subjects: formattedSubjects,
        section_id: selectedStudent.section_id
      });

      if (response.data.success) {
        alert("Grades updated successfully!");
        setEditingStudent(null);
        setSelectedStudent(null);
        setSubjects([]);
        setGradesFetched(false);
      } else {
        alert("Failed to save grades.");
      }
    } catch (error) {
      console.error("Error saving grades:", error.response?.data || error.message);
      alert("Failed to save grades.");
    }
  };

  const handleEditClick = async (student) => {
    if (editingStudent && editingStudent.student_id === student.student_id) {
        setEditingStudent(null);
        setSelectedStudent(null);
        setSubjects([]);
        setGradesFetched(false);
        setSelectedGradeLevel(null);
        setSelectedSchoolYear(null); // Reset school year when unselecting
        return;
    }

    setSelectedStudent(student);
    setEditingStudent(student);
    setGradesFetched(false);
    
    const gradeLevel = student.current_yr_lvl;
    const schoolYearId = student.school_year_id; // Ensure schoolYearId is retrieved
    const section_id = student.section_id;

    setSelectedGradeLevel(gradeLevel);
    setSelectedSchoolYear(schoolYearId); // Set the selected school year

    if (!schoolYearId) {
        console.error("No school year found for the selected student.");
        return;
    }

    // Fetch subjects and grades with the correct school year
    const fetchedSubjects = await fetchSubjects(student.student_id, gradeLevel, schoolYearId, section_id);
    await fetchGrades(student.student_id, gradeLevel, fetchedSubjects, schoolYearId, section_id);
  };


  const fetchGrades = async (studentId, gradeLevel, existingSubjects, schoolYearId, section_id) => {
    if (!studentId || !gradeLevel || !schoolYearId ) return;

    try {
      console.log('Fetching grades for:', { studentId, gradeLevel, schoolYearId, section_id  });

      const response = await axios.get('http://localhost:3001/api/grades', {
        params: { 
          studentId, 
          gradeLevel,
          schoolYearId,
          section_id
        },
      });

      console.log('Grades response:', response.data);

      if (!response.data || !response.data.grades || response.data.grades.length === 0) {
        console.log('No grades found, keeping existing subjects:', existingSubjects);
        setSubjects(existingSubjects);
        setGradesFetched(true);
        return;
      }

      const gradesData = response.data.grades;
      console.log('Fetched grades:', gradesData);

      const updatedSubjects = existingSubjects.map(subject => {
        // Find matching grade for this subject
        const matchingGrade = gradesData.find(grade => 
          grade.subject_name.toLowerCase().trim() === subject.subject_name.toLowerCase().trim()
        );

        console.log(`Matching grade for ${subject.subject_name}:`, matchingGrade);

        // If we found a matching grade, use its values
        if (matchingGrade) {
          return {
            ...subject,
            q1: matchingGrade.q1,
            q2: matchingGrade.q2,
            q3: matchingGrade.q3,
            q4: matchingGrade.q4,
            final: matchingGrade.q1 && matchingGrade.q2 && matchingGrade.q3 && matchingGrade.q4 
              ? ((parseFloat(matchingGrade.q1) + parseFloat(matchingGrade.q2) + 
                  parseFloat(matchingGrade.q3) + parseFloat(matchingGrade.q4)) / 4).toFixed(0)
              : null,
            remarks: matchingGrade.q1 && matchingGrade.q2 && matchingGrade.q3 && matchingGrade.q4
              ? ((parseFloat(matchingGrade.q1) + parseFloat(matchingGrade.q2) + 
                  parseFloat(matchingGrade.q3) + parseFloat(matchingGrade.q4)) / 4) >= 75
                ? "Passed" : "Failed"
              : "___"
          };
        }

        // If no matching grade was found, return the original subject
        return subject;
      });

      console.log('Final updated subjects:', updatedSubjects);
      setSubjects(updatedSubjects);
      setGradesFetched(true);
    } catch (error) {
      console.error('Error fetching grades:', error);
    }
  };

  const handleSearch = (searchTerm) => {
    setFilters((prevFilters) => ({ ...prevFilters, searchTerm }));
    applyFilters();
  };

  const handleFilterChange = (type, value) => {
    setFilters(prevFilters => ({
      ...prevFilters,
      [type]: value
    }));
  };

  const applyFilters = () => {
    let filtered = [...students]; // Create a new array to avoid mutating state directly

    // For grade level coordinators, enforce their assigned grade level filter regardless of other filters
    if (roleName === 'grade_level_coordinator' && coordinatorGradeLevel) {
      filtered = filtered.filter(student => String(student.current_yr_lvl) === String(coordinatorGradeLevel));
    }

    if (filters.school_year) {
      filtered = filtered.filter(student => String(student.school_year) === String(filters.school_year));
    }
    
    // Only apply grade filter if not a coordinator (coordinators already filtered by their grade level)
    if (filters.grade && !(roleName === 'grade_level_coordinator' && coordinatorGradeLevel)) {
      filtered = filtered.filter(student => String(student.current_yr_lvl) === String(filters.grade));
    }
    
    if (filters.section) {
      filtered = filtered.filter(student => String(student.section_name) === String(filters.section));
    }
    if (filters.status) {
      filtered = filtered.filter(student => student.student_status === filters.status);
    }
    if (filters.searchTerm) {
      const searchTerm = filters.searchTerm.toLowerCase();
      filtered = filtered.filter(student => {
        const fullName = `${student.firstname} ${student.lastname}`.toLowerCase();
        return fullName.includes(searchTerm);
      });
    }

    setFilteredStudents(filtered);
    setCurrentPage(1);
  };

  const paginate = (pageNumber) => setCurrentPage(pageNumber);
  const indexOfLastStudent = currentPage * studentsPerPage;
  const indexOfFirstStudent = indexOfLastStudent - studentsPerPage;
  const currentStudents = filteredStudents.slice(indexOfFirstStudent, indexOfLastStudent);

  const handleSchoolYearChange = async (event, student) => {
    const newSchoolYearId = event.target.value;
    
    // Update the selected school year for this specific student
    setSelectedSchoolYear(prev => ({
      ...prev,
      [student.student_id]: newSchoolYearId
    }));
    
    // Find the selected year's data to get its grade level
    const selectedYear = studentSchoolYears[student.student_id]?.find(
      year => year.school_year_id.toString() === newSchoolYearId.toString()
    );
    
    const gradeLevel = selectedYear?.grade_level || student.current_yr_lvl;
    const section_id = selectedYear?.section_id || student.section_id;
  
    // Important: We allow viewing ANY grade level for a specific student
    // even if the user is a grade level coordinator with a specific assigned grade
  
    // Fetch the subjects and grades for the selected student and new school year
    const fetchedSubjects = await fetchSubjects(student.student_id, gradeLevel, newSchoolYearId, section_id);
    await fetchGrades(student.student_id, gradeLevel, fetchedSubjects, newSchoolYearId, section_id);
  };

  const calculateQuarterAverage = (quarter) => {
    if (!subjects || subjects.length === 0) return "___";
    
    let total = 0;
    let count = 0;
    
    subjects.forEach(subject => {
      if (subject[quarter] && subject[quarter] !== "___") {
        const grade = parseFloat(subject[quarter]);
        if (!isNaN(grade)) {
          total += grade;
          count++;
        }
      }
    });
    
    if (count === 0) return "___";
    return (total / count).toFixed(0);
  };

  const calculateFinalAverage = () => {
    if (!subjects || subjects.length === 0) return "___";
    
    // Method 1: Use the calculated final grade from each subject
    let totalFinal = 0;
    let countFinal = 0;
    
    subjects.forEach(subject => {
      if (subject.final && subject.final !== "___") {
        const grade = parseFloat(subject.final);
        if (!isNaN(grade)) {
          totalFinal += grade;
          countFinal++;
        }
      }
    });
    
    // If we have final grades, use those
    if (countFinal > 0) {
      return (totalFinal / countFinal).toFixed(0);
    }
    
    // Method 2: Calculate based on quarter averages
    const q1Avg = calculateQuarterAverage("q1");
    const q2Avg = calculateQuarterAverage("q2");
    const q3Avg = calculateQuarterAverage("q3");
    const q4Avg = calculateQuarterAverage("q4");
    
    const quarterAverages = [q1Avg, q2Avg, q3Avg, q4Avg].filter(avg => avg !== "___");
    
    if (quarterAverages.length > 0) {
      const total = quarterAverages.reduce((sum, avg) => sum + parseFloat(avg), 0);
      return (total / quarterAverages.length).toFixed(0);
    }
    
    return "___";
  };

  const getFinalRemarksClass = () => {
    const finalAverage = calculateFinalAverage();
    if (finalAverage === "___") return "";
    
    // Check if all quarters have valid averages
    const hasAllQuarters = 
      calculateQuarterAverage("q1") !== "___" && 
      calculateQuarterAverage("q2") !== "___" && 
      calculateQuarterAverage("q3") !== "___" && 
      calculateQuarterAverage("q4") !== "___";
    
    const average = parseFloat(finalAverage);
    
    // If not all quarters have grades and current average is below passing
    if (!hasAllQuarters && average < 75) {
      return "incomplete";
    }
    
    return average >= 75 ? "passed" : "failed";
  };

  const getFinalRemarks = () => {
    const finalAverage = calculateFinalAverage();
    if (finalAverage === "___") return "___";
    
    // Check if all quarters have valid averages
    const hasAllQuarters = 
      calculateQuarterAverage("q1") !== "___" && 
      calculateQuarterAverage("q2") !== "___" && 
      calculateQuarterAverage("q3") !== "___" && 
      calculateQuarterAverage("q4") !== "___";
    
    const average = parseFloat(finalAverage);
    
    // If not all quarters have grades and current average is below passing
    if (!hasAllQuarters && average < 75) {
      return "Incomplete";
    }
    
    return average >= 75 ? "Passed" : "Failed";
  };

  const fetchAssignedSubjects = async () => {
    try {
      const userId = localStorage.getItem('userId');
      if (!userId) return;
      
      const response = await axios.get('http://localhost:3001/api/teacher/assigned-subjects', {
        params: { userId }
      });
      
      setAssignedSubjects(response.data);
    } catch (error) {
      console.error('Error fetching assigned subjects:', error);
    }
  };

  const isSubjectAssigned = (subjectName) => {
    if (roleName !== 'subject_teacher') return true; // Non-subject teachers can edit all subjects
    return assignedSubjects.some(subject => 
      subject.subject_name.toLowerCase().trim() === subjectName.toLowerCase().trim()
    );
  };

  return (
    <div className="grades-management-container">
      <div className="grades-management-header">
        <h1 className="grades-management-title">Grades</h1>
      </div>

      <StudentSearchFilter
        students={students}
        fetchStudents={fetchStudents}
        setFilteredStudents={setFilteredStudents}
        setCurrentPage={setCurrentPage}
        schoolYears={schoolYears}
        filteredSections={filteredSections} 
        filters={filters}
        setFilters={setFilters}
        coordinatorGradeLevel={coordinatorGradeLevel}
        roleName={roleName}
      />

      <div className="grades-management-table-container">
        <table className="grades-management-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Name</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {currentStudents.map((student, index) => (
              <React.Fragment key={student.student_id}>
                <tr>
                  <td>{student.student_id}</td>
                  <td>
                    {student.stud_name}
                  </td>
                  <td>
                    <div className="grades-management-actions">
                      <button 
                        className="grades-management-btn grades-management-btn-view"
                        onClick={() => handleStudentClick(student)}
                      >
                        View
                      </button>
                      {(roleName !== 'principal' && roleName !== 'registrar' && roleName !== 'grade_level_coordinator' && roleName !== 'class_adviser') && (
                        <>
                      <button 
                        className={`grades-management-btn grades-management-btn-edit ${editingStudent && editingStudent.student_id === student.student_id ? 'cancel' : ''}`}
                        onClick={() => handleEditClick(student)}
                        disabled={!editingStudent && selectedStudent?.student_id === student.student_id && selectedGradeLevel !== student.current_yr_lvl}
                        style={{ 
                          opacity: !editingStudent && selectedStudent?.student_id === student.student_id && selectedGradeLevel !== student.current_yr_lvl ? '0.5' : '1',
                          cursor: !editingStudent && selectedStudent?.student_id === student.student_id && selectedGradeLevel !== student.current_yr_lvl ? 'not-allowed' : 'pointer'
                        }}
                      >
                        {editingStudent && editingStudent.student_id === student.student_id ? "Cancel" : "Edit"}
                      </button>
                      {editingStudent && editingStudent.student_id === student.student_id && (
                        <button 
                          className="grades-management-btn grades-management-btn-save"
                          onClick={handleSaveChanges}
                        >
                          Save
                        </button>
                      )}
                      </>
                      )}
                    </div>
                  </td>
                </tr>
                {selectedStudent && selectedStudent.student_id === student.student_id && (
                  <tr>
                    <td colSpan="3">
                      <div className="grades-details-container">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                          <h3 className="grades-details-title">Grades for {student.firstname} {student.lastname}</h3>
                          <div className="grade-level-school-year-container">
                            {/* 
                              This dropdown intentionally shows ALL grade levels for the specific student
                              without any restrictions, even for grade level coordinators
                            */}
                            <select 
                              value={selectedSchoolYear[student.student_id] || student.school_year_id} 
                              onChange={(e) => handleSchoolYearChange(e, student)}
                              className="school-year-selector"
                              disabled={editingStudent !== null}
                            >
                              {studentSchoolYears[student.student_id]?.map((year) => (
                                <option key={year.school_year_id} value={year.school_year_id}>
                                  {`Grade ${year.grade_level} - SY ${year.school_year}`}
                                </option>
                              )) || schoolYears.map((year) => (
                                <option key={year.school_year_id} value={year.school_year_id}>
                                  {`Grade ${year.grade_level} - SY ${year.school_year}`}
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>
                        <table className="grades-details-table">
                          <thead>
                            <tr>
                              <th>Subjects</th>
                              <th>1st Grading</th>
                              <th>2nd Grading</th>
                              <th>3rd Grading</th>
                              <th>4th Grading</th>
                              <th>Final Grade</th>
                              <th>Remarks</th>
                            </tr>
                          </thead>
                          <tbody>
                            {subjects?.length > 0 ? (
                              subjects.map((subject, index) => {
                                const canEditSubject = isSubjectAssigned(subject.subject_name);
                                return (
                                <tr key={index}>
                                  <td>{subject.subject_name}</td>
                                  <td>
                                    {editingStudent && selectedGradeLevel === student.current_yr_lvl && canEditSubject ? (
                                      <input
                                        type="text"
                                        value={subject.q1 || ""}
                                        onChange={(e) => handleGradeChange(index, "q1", e.target.value)}
                                        placeholder="70-100"
                                        maxLength="3"
                                        style={{
                                          border: subject.q1_invalid ? '2px solid #ff4444' : '1px solid #ccc',
                                          backgroundColor: subject.q1_invalid ? '#fff0f0' : 'white'
                                        }}
                                      />
                                    ) : (
                                      subject.q1 || "___"
                                    )}
                                  </td>
                                  <td>
                                    {editingStudent && selectedGradeLevel === student.current_yr_lvl && canEditSubject ? (
                                      <input
                                        type="text"
                                        value={subject.q2 || ""}
                                        onChange={(e) => handleGradeChange(index, "q2", e.target.value)}
                                        placeholder="70-100"
                                        maxLength="3"
                                        style={{
                                          border: subject.q2_invalid ? '2px solid #ff4444' : '1px solid #ccc',
                                          backgroundColor: subject.q2_invalid ? '#fff0f0' : 'white'
                                        }}
                                      />
                                    ) : (
                                      subject.q2 || "___"
                                    )}
                                  </td>
                                  <td>
                                    {editingStudent && selectedGradeLevel === student.current_yr_lvl && canEditSubject ? (
                                      <input
                                        type="text"
                                        value={subject.q3 || ""}
                                        onChange={(e) => handleGradeChange(index, "q3", e.target.value)}
                                        placeholder="70-100"
                                        maxLength="3"
                                        style={{
                                          border: subject.q3_invalid ? '2px solid #ff4444' : '1px solid #ccc',
                                          backgroundColor: subject.q3_invalid ? '#fff0f0' : 'white'
                                        }}
                                      />
                                    ) : (
                                      subject.q3 || "___"
                                    )}
                                  </td>
                                  <td>
                                    {editingStudent && selectedGradeLevel === student.current_yr_lvl && canEditSubject ? (
                                      <input
                                        type="text"
                                        value={subject.q4 || ""}
                                        onChange={(e) => handleGradeChange(index, "q4", e.target.value)}
                                        placeholder="70-100"
                                        maxLength="3"
                                        style={{
                                          border: subject.q4_invalid ? '2px solid #ff4444' : '1px solid #ccc',
                                          backgroundColor: subject.q4_invalid ? '#fff0f0' : 'white'
                                        }}
                                      />
                                    ) : (
                                      subject.q4 || "___"
                                    )}
                                  </td>
                                  <td>
                                    {subject.final || "___"}
                                  </td>
                                  <td className={subject.remarks === "Passed" ? "passed" : subject.remarks === "Failed" ? "failed" : ""}>
                                    {subject.remarks || "___"}
                                  </td>
                                </tr>
                              )})
                            ) : (
                              <tr>
                                <td colSpan="7" style={{ textAlign: "center" }}>No academic records available.</td>
                              </tr>
                            )}
                            {subjects?.length > 0 && (
                              <tr>
                                <td><strong>General Average</strong></td>
                                <td>
                                  {calculateQuarterAverage("q1")}
                                </td>
                                <td>
                                  {calculateQuarterAverage("q2")}
                                </td>
                                <td>
                                  {calculateQuarterAverage("q3")}
                                </td>
                                <td>
                                  {calculateQuarterAverage("q4")}
                                </td>
                                <td>
                                  {calculateFinalAverage()}
                                </td>
                                <td className={getFinalRemarksClass()}>
                                  {getFinalRemarks()}
                                </td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>

      <Pagination
        totalItems={filteredStudents.length}
        itemsPerPage={studentsPerPage}
        currentPage={currentPage}
        onPageChange={paginate}
      />
    </div>
  );
}

export default GradesManagement;
