import React, { useState, useEffect } from 'react';
import axios from 'axios';
import '../TeacherPagesCss/TestGradesManagement.css';
import Pagination from '../Utilities/pagination';
import { useNavigate } from 'react-router-dom';

function TestGradesManagement() {
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
  const [filters, setFilters] = useState({
    searchTerm: '',
    school_year: '',
    grade: '',
    section: '',
    status: ''
  });

  useEffect(() => {
    fetchStudents();
    fetchSchoolYears();
    fetchSections();
  }, []);

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

  const fetchStudents = async (appliedFilters = {}) => {
    try {
      const response = await axios.get('http://localhost:3001/students', {
        params: appliedFilters
      });
      const sortedStudents = response.data.sort((a, b) => b.current_yr_lvl - a.current_yr_lvl);
      setStudents(sortedStudents);
      setFilteredStudents(sortedStudents);
    } catch (error) {
      console.error('Error fetching students:', error);
    }
  };

  const fetchSchoolYears = async () => {
    try {
      const response = await axios.get('http://localhost:3001/api/school_years');
      setSchoolYears(response.data);
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
      return;
    }

    setSelectedStudent(student);
    setEditingStudent(null);
    const gradeLevel = student.current_yr_lvl;
    const fetchedSubjects = await fetchSubjects(student.student_id, gradeLevel);
    await fetchGrades(student.student_id, gradeLevel, fetchedSubjects);
  };

  const fetchSubjects = async (studentId, gradeLevel) => {
    if (!studentId || !gradeLevel) return [];

    try {
      const response = await axios.get('http://localhost:3001/api/subjects-card', {
        params: { studentId, gradeLevel },
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
    setSubjects((prevSubjects) => {
      const updatedSubjects = [...prevSubjects];
      updatedSubjects[index] = { ...updatedSubjects[index], [period]: value };

      const q1 = parseFloat(updatedSubjects[index].q1) || 0;
      const q2 = parseFloat(updatedSubjects[index].q2) || 0;
      const q3 = parseFloat(updatedSubjects[index].q3) || 0;
      const q4 = parseFloat(updatedSubjects[index].q4) || 0;

      const finalGrade = (q1 + q2 + q3 + q4) / 4;
      updatedSubjects[index].final = isNaN(finalGrade) ? "" : finalGrade.toFixed(2);
      updatedSubjects[index].remarks = finalGrade >= 75 ? "Passed" : "Failed";

      return updatedSubjects;
    });
  };

  const handleSaveChanges = async () => {
    try {
      if (!selectedStudent || subjects.length === 0) {
        alert("No student or subjects selected.");
        return;
      }

      const formattedSubjects = subjects.map(subject => ({
        subject_name: subject.subject_name,
        q1: subject.q1 || null,
        q2: subject.q2 || null,
        q3: subject.q3 || null,
        q4: subject.q4 || null,
      }));

      const response = await axios.post("http://localhost:3001/api/save-grade", {
        student_id: selectedStudent.student_id,
        student_name: `${selectedStudent.firstname} ${selectedStudent.lastname}`,
        grade_level: selectedStudent.current_yr_lvl,
        school_year_id: selectedStudent.school_year_id,
        subjects: formattedSubjects
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
      return;
    }

    setSelectedStudent(student);
    setEditingStudent(student);
    const gradeLevel = student.current_yr_lvl;
    const fetchedSubjects = await fetchSubjects(student.student_id, gradeLevel);
    await fetchGrades(student.student_id, gradeLevel, fetchedSubjects);
  };

  const fetchGrades = async (studentId, gradeLevel, existingSubjects) => {
    if (!studentId || !gradeLevel || gradesFetched) return;

    try {
      const response = await axios.get('http://localhost:3001/api/grades', {
        params: { studentId, gradeLevel },
      });

      if (response.data.success) {
        const fetchedGrades = response.data.grades;
        const updatedSubjects = (existingSubjects || []).map(subject => {
          const subjectGrades = fetchedGrades.find(grade => grade.subject_name === subject.subject_name) || {};
          return { ...subject, ...subjectGrades };
        });

        setSubjects(updatedSubjects);
        setGradesFetched(true);
      }
    } catch (error) {
      console.error('Error fetching grades:', error);
    }
  };

  const handleSearch = (searchTerm) => {
    setFilters((prevFilters) => ({ ...prevFilters, searchTerm }));
    applyFilters({ ...filters, searchTerm });
  };

  const handleFilterChange = (type, value) => {
    setFilters(prevFilters => ({
      ...prevFilters,
      [type]: value
    }));
  };

  const applyFilters = () => {
    let filtered = students;

    if (filters.school_year) {
      filtered = filtered.filter(student => String(student.school_year) === filters.school_year);
    }
    if (filters.grade) {
      filtered = filtered.filter(student => student.current_yr_lvl === filters.grade);
    }
    if (filters.section) {
      filtered = filtered.filter(student => String(student.section_name) === filters.section);
    }
    if (filters.status) {
      filtered = filtered.filter(student => student.student_status === filters.status);
    }
    if (filters.searchTerm) {
      filtered = filtered.filter(student => {
        const firstName = student.firstname ? student.firstname.toLowerCase() : "";
        const lastName = student.lastname ? student.lastname.toLowerCase() : "";
        return firstName.includes(filters.searchTerm.toLowerCase()) || 
          lastName.includes(filters.searchTerm.toLowerCase());
      });
    }

    setFilteredStudents(filtered);
    setCurrentPage(1);
  };

  const handleApplyFilters = () => {
    console.log('Applying filters:', filters);
    fetchStudents(filters);
  };

  const paginate = (pageNumber) => setCurrentPage(pageNumber);
  const indexOfLastStudent = currentPage * studentsPerPage;
  const indexOfFirstStudent = indexOfLastStudent - studentsPerPage;
  const currentStudents = filteredStudents.slice(indexOfFirstStudent, indexOfLastStudent);

  return (
    <div className="grades-mgmt-container">
      <div className="grades-mgmt-header">
        <h1 className="grades-mgmt-title">Grades</h1>
      </div>

      <div className="student-mgmt-filters">
        <div className="student-mgmt-search">
          <input
            type="text"
            placeholder="Search by student name..."
            onChange={(e) => handleSearch(e.target.value)}
          />
        </div>
        <div className="student-mgmt-filters-group">
          <select
            value={filters.school_year}
            onChange={(e) => handleFilterChange('school_year', e.target.value)}
          >
            <option value="">Select School Year</option>
            {schoolYears.map((year) => (
              <option key={year.school_year_id} value={year.school_year}>
                {year.school_year}
              </option>
            ))}
          </select>
          <select
            value={filters.grade}
            onChange={(e) => handleFilterChange('grade', e.target.value)}
          >
            <option value="">Select Grade Level</option>
            {[7, 8, 9, 10].map((grade) => (
              <option key={grade} value={grade}>Grade {grade}</option>
            ))}
          </select>
          <select
            value={filters.section}
            onChange={(e) => handleFilterChange('section', e.target.value)}
          >
            <option value="">Select Section</option>
            {filteredSections.map((section) => (
              <option key={section.section_id} value={section.section_name}>
                {section.section_name}
              </option>
            ))}
          </select>
        </div>
        <button onClick={handleApplyFilters}>Filter</button>
      </div>

      <div className="grades-mgmt-table-container">
        <table className="grades-mgmt-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Student Name</th>
              <th>Grade Level</th>
              <th>Section</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {currentStudents.map((student, index) => (
              <React.Fragment key={student.student_id}>
                <tr>
                  <td>{indexOfFirstStudent + index + 1}</td>
                  <td>
                    {student.firstname} {student.middlename && `${student.middlename[0]}.`} {student.lastname}
                  </td>
                  <td>Grade {student.current_yr_lvl}</td>
                  <td>Section {student.section_name}</td>
                  <td>
                    <div className="grades-mgmt-actions">
                      <button 
                        className="grades-mgmt-btn grades-mgmt-btn-view"
                        onClick={() => handleStudentClick(student)}
                      >
                        View
                      </button>
                      {(roleName !== 'principal' && roleName !== 'registrar' && roleName !== 'grade_level_coordinator') && (
                        <>
                      <button 
                        className={`grades-mgmt-btn grades-mgmt-btn-edit ${editingStudent && editingStudent.student_id === student.student_id ? 'cancel' : ''}`}
                        onClick={() => handleEditClick(student)}
                      >
                        {editingStudent && editingStudent.student_id === student.student_id ? "Cancel" : "Edit"}
                      </button>
                      {editingStudent && editingStudent.student_id === student.student_id && (
                        <button 
                          className="grades-mgmt-btn grades-mgmt-btn-save"
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
                    <td colSpan="5">
                      <div className="grades-details-container">
                        <h3 className="grades-details-title">Grades for {student.firstname} {student.lastname}</h3>
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
                              subjects.map((subject, index) => (
                                <tr key={index}>
                                  <td>{subject.subject_name}</td>
                                  <td>
                                    {editingStudent ? (
                                      <input
                                        type="text"
                                        value={subject.q1 || ""}
                                        onChange={(e) => handleGradeChange(index, "q1", e.target.value)}
                                      />
                                    ) : (
                                      subject.q1 || "___"
                                    )}
                                  </td>
                                  <td>
                                    {editingStudent ? (
                                      <input
                                        type="text"
                                        value={subject.q2 || ""}
                                        onChange={(e) => handleGradeChange(index, "q2", e.target.value)}
                                      />
                                    ) : (
                                      subject.q2 || "___"
                                    )}
                                  </td>
                                  <td>
                                    {editingStudent ? (
                                      <input
                                        type="text"
                                        value={subject.q3 || ""}
                                        onChange={(e) => handleGradeChange(index, "q3", e.target.value)}
                                      />
                                    ) : (
                                      subject.q3 || "___"
                                    )}
                                  </td>
                                  <td>
                                    {editingStudent ? (
                                      <input
                                        type="text"
                                        value={subject.q4 || ""}
                                        onChange={(e) => handleGradeChange(index, "q4", e.target.value)}
                                      />
                                    ) : (
                                      subject.q4 || "___"
                                    )}
                                  </td>
                                  <td>
                                    {(() => {
                                      const q1 = parseFloat(subject.q1) || 0;
                                      const q2 = parseFloat(subject.q2) || 0;
                                      const q3 = parseFloat(subject.q3) || 0;
                                      const q4 = parseFloat(subject.q4) || 0;
                                      const finalGrade = (q1 + q2 + q3 + q4) / 4 || "___";
                                      return isNaN(finalGrade) ? "___" : finalGrade.toFixed(2);
                                    })()}
                                  </td>
                                  <td className={(() => {
                                    const q1 = parseFloat(subject.q1) || 0;
                                    const q2 = parseFloat(subject.q2) || 0;
                                    const q3 = parseFloat(subject.q3) || 0;
                                    const q4 = parseFloat(subject.q4) || 0;
                                    const finalGrade = (q1 + q2 + q3 + q4) / 4;
                                    return isNaN(finalGrade) ? "" : finalGrade >= 75 ? "passed" : "failed";
                                  })()}>
                                    {(() => {
                                      const q1 = parseFloat(subject.q1) || 0;
                                      const q2 = parseFloat(subject.q2) || 0;
                                      const q3 = parseFloat(subject.q3) || 0;
                                      const q4 = parseFloat(subject.q4) || 0;
                                      const finalGrade = (q1 + q2 + q3 + q4) / 4;
                                      return isNaN(finalGrade) ? "___" : finalGrade >= 75 ? "Passed" : "Failed";
                                    })()}
                                  </td>
                                </tr>
                              ))
                            ) : (
                              <tr>
                                <td colSpan="7" style={{ textAlign: "center" }}>No academic records available.</td>
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

export default TestGradesManagement;
