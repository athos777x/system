import React, { useEffect, useState } from 'react';
import axios from 'axios';
import Pagination from '../Utilities/pagination';
import '../TeacherPagesCss/BrigadaEskwela.css';
import StudentSearchFilter from '../RoleSearchFilters/StudentSearchFilter';

function BrigadaEskwela() {
  const [students, setStudents] = useState([]);
  const [filteredStudents, setFilteredStudents] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [studentsPerPage] = useState(20);
  const [schoolYears, setSchoolYears] = useState([]);
  const [sections, setSections] = useState([]);
  const [filteredSections, setFilteredSections] = useState([]);
  const [filters, setFilters] = useState({
    searchTerm: '',
    grade: '',
    section: '',
  });

  // Modal state for absence reason
  const [showModal, setShowModal] = useState(false);
  const [absenceReason, setAbsenceReason] = useState('');
  const [currentStudentId, setCurrentStudentId] = useState(null);

  useEffect(() => {
    fetchSchoolYears();
    fetchSections();
  }, []);

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

  const fetchStudents = async (appliedFilters = {}) => {
    try {
      const response = await axios.get('http://localhost:3001/brigada-eskwela', {
        params: appliedFilters,
      });
      const sortedStudents = response.data.sort((a, b) =>
        a.stud_name.localeCompare(b.stud_name)
      );
      setStudents(sortedStudents);
      setFilteredStudents(sortedStudents);
    } catch (err) {
      console.error('Error fetching data:', err);
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

  const handleToggleAttendance = (studentId, currentStatus) => {
    if (!currentStatus) {
      setCurrentStudentId(studentId);
      setShowModal(true); // Show modal for absent reason
    } else {
      updateAttendance(studentId, currentStatus);
    }
  };

  const handleModalSubmit = () => {
    if (absenceReason.trim()) {
      updateAttendance(currentStudentId, false, absenceReason);
      setShowModal(false); // Close modal
      setAbsenceReason(''); // Clear reason input
    } else {
      alert('Please provide a reason for absence');
    }
  };

  const updateAttendance = async (studentId, status, reason = '') => {
    try {
      await axios.put(`http://localhost:3001/brigada-eskwela/${studentId}`, {
        brigada_attendance: status,
        absence_reason: reason, // Send the absence reason
      });

      const updatedStudents = students.map((student) => {
        if (student.student_id === studentId) {
          return { ...student, brigada_attendance: status, absence_reason: reason };
        }
        return student;
      });

      setStudents(updatedStudents);
      setFilteredStudents(updatedStudents);
    } catch (error) {
      console.error('Error updating brigada attendance:', error);
    }
  };

  const paginate = (pageNumber) => setCurrentPage(pageNumber);
  const indexOfLastStudent = currentPage * studentsPerPage;
  const indexOfFirstStudent = indexOfLastStudent - studentsPerPage;
  const currentStudents = filteredStudents.slice(indexOfFirstStudent, indexOfLastStudent);

  return (
    <div className="brigada-container">
      <div className="brigada-header">
        <h1 className="brigada-title">Brigada Eskwela</h1>
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
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {currentStudents.length > 0 &&
              currentStudents.map((student, index) => (
                <tr key={index}>
                  <td>{student.student_id}</td>
                  <td>{student.lrn}</td>
                  <td>{student.stud_name}</td>
                  <td>
                    <span
                      className={student.brigada_attendance ? 'status-yes' : 'status-no'}
                    >
                      {student.brigada_attendance ? 'Yes' : 'No'}
                    </span>
                  </td>
                  <td>{student.remarks || '-'}</td>
                  <td>
                    <button
                      className="toggle-attendance-btn"
                      onClick={() =>
                        handleToggleAttendance(student.student_id, student.brigada_attendance)
                      }
                    >
                      {student.brigada_attendance ? 'Mark as Absent' : 'Mark as Present'}
                    </button>
                  </td>
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

      {/* Modal for absence reason */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal">
            <h3>Enter Absence Reason</h3>
            <textarea
              value={absenceReason}
              onChange={(e) => setAbsenceReason(e.target.value)}
              placeholder="Why is the student absent?"
            ></textarea>
            <div className="modal-actions">
              <button onClick={handleModalSubmit}>Submit</button>
              <button onClick={() => setShowModal(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default BrigadaEskwela;
