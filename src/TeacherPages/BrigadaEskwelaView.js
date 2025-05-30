import React, { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import Pagination from '../Utilities/pagination';
import '../TeacherPagesCss/BrigadaEskwela.css';
import StudentSearchFilter from '../RoleSearchFilters/StudentSearchFilter';

function BrigadaEskwelaView() {
  const [students, setStudents] = useState([]);
  const [filteredStudents, setFilteredStudents] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [studentsPerPage] = useState(20);
  const [schoolYears, setSchoolYears] = useState([]);
  const [sections, setSections] = useState([]);
  const [filteredSections, setFilteredSections] = useState([]);
  const [roleName, setRoleName] = useState('');
  const [coordinatorGradeLevel, setCoordinatorGradeLevel] = useState(null);
  const [filters, setFilters] = useState({
    searchTerm: '',
    grade: '',
    section: '',
  });

  useEffect(() => {
    const userId = localStorage.getItem('userId'); // Retrieve userId from localStorage
    if (userId) {
      console.log(`Retrieved userId from localStorage: ${userId}`); // Debugging log
      fetchUserRole(userId);
    } else {
      console.error('No userId found in localStorage');
    }
    fetchSchoolYears();
    fetchSections();
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

  useEffect(() => {
    if (filters.grade) {
      const sectionsForGrade = sections.filter(
        (section) => String(section.grade_level) === String(filters.grade)
      );
      setFilteredSections(sectionsForGrade);
    } else {
      setFilteredSections(sections);
    }
  }, [filters.grade, sections]);

  // Refetch students when coordinator's grade level changes
  useEffect(() => {
    if (coordinatorGradeLevel) {
      fetchStudents();
    }
  }, [coordinatorGradeLevel]);

  const fetchStudents = useCallback(async (appliedFilters = {}) => {
    try {
      const response = await axios.get('http://localhost:3001/brigada-eskwela', {
        params: appliedFilters,
      });
      
      let studentsData = response.data.sort((a, b) =>
        a.stud_name.localeCompare(b.stud_name)
      );
      
      // For grade level coordinators, filter the students by their assigned grade level
      if (roleName === 'grade_level_coordinator' && coordinatorGradeLevel) {
        console.log('Filtering students for grade level coordinator. Grade level:', coordinatorGradeLevel);
        studentsData = studentsData.filter(student => 
          student.grade_lvl.toString() === coordinatorGradeLevel.toString()
        );
      }
      
      setStudents(studentsData);
      setFilteredStudents(studentsData);
    } catch (err) {
      console.error('Error fetching data:', err);
    }
  }, [roleName, coordinatorGradeLevel]);

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
      
      let sectionsData = response.data;
      
      // For grade level coordinators, filter the sections by their assigned grade level
      if (roleName === 'grade_level_coordinator' && coordinatorGradeLevel) {
        console.log('Filtering sections for grade level coordinator. Grade level:', coordinatorGradeLevel);
        sectionsData = sectionsData.filter(section => 
          section.grade_level.toString() === coordinatorGradeLevel.toString()
        );
      }
      
      setSections(sectionsData);
      setFilteredSections(sectionsData);
    } catch (error) {
      console.error('Error fetching sections:', error);
    }
  };

  const handleSearch = (searchTerm) => {
    setFilters((prevFilters) => ({ ...prevFilters, searchTerm }));
    applyFilters({ ...filters, searchTerm });
  };

  const handleFilterChange = (type, value) => {
    setFilters((prevFilters) => ({
      ...prevFilters,
      [type]: value,
    }));
  };

  const applyFilters = () => {
    let filtered = students;

    if (filters.school_year) {
      filtered = filtered.filter(
        (student) => String(student.school_year) === filters.school_year
      );
    }
    if (filters.grade) {
      filtered = filtered.filter(
        (student) => String(student.grade_lvl) === String(filters.grade)
      );
    }
    if (filters.section) {
      filtered = filtered.filter(
        (student) => String(student.section_name) === String(filters.section)
      );
    }
    if (filters.searchTerm) {
      filtered = filtered.filter((student) =>
        student.stud_name
          .toLowerCase()
          .includes(filters.searchTerm.toLowerCase())
      );
    }

    setFilteredStudents(filtered);
    setCurrentPage(1);
  };

  const handleApplyFilters = () => {
    console.log('Applying filters:', filters);
    applyFilters();
  };

  const paginate = (pageNumber) => setCurrentPage(pageNumber);
  const indexOfLastStudent = currentPage * studentsPerPage;
  const indexOfFirstStudent = indexOfLastStudent - studentsPerPage;
  const currentStudents = filteredStudents.slice(indexOfFirstStudent, indexOfLastStudent);

  return (
    <div className="brigada-container">
      <div className="brigada-header">
        <h1 className="brigada-title">Brigada Eskwela (View Only)</h1>
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
        roleName={roleName}
        coordinatorGradeLevel={coordinatorGradeLevel}
      />

      <div className="brigada-table-container">
        <table className="brigada-table">
          <thead>
            <tr>
              <th>#</th>
              <th>LRN</th>
              <th>Name</th>
              <th>Brigada Attendance</th>
              <th>Remarks</th>
            </tr>
          </thead>
          <tbody>
            {currentStudents.length > 0 &&
              currentStudents.map((student) => (
                <tr key={student.student_id}>
                  <td>{student.student_id}</td>
                  <td>{student.lrn}</td>
                  <td>{student.stud_name}</td>
                  <td>
                    <span
                      className={student.brigada_attendance === 'Attended' ? 'status-yes' : 'status-no'}
                    >
                      {student.brigada_attendance === 'Attended' ? 'Yes' : 'No'}
                    </span>
                  </td>
                  <td>{student.remarks || '-'}</td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      <div className="brigada-pagination">
        <Pagination
          totalItems={filteredStudents.length}
          itemsPerPage={studentsPerPage}
          currentPage={currentPage}
          onPageChange={paginate}
        />
      </div>
    </div>
  );
}

export default BrigadaEskwelaView; 