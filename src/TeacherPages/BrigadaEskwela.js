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

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [absenceReason, setAbsenceReason] = useState('');
  const [selectedStudent, setSelectedStudent] = useState(null);

  const [showRemarksModal, setShowRemarksModal] = useState(false);
  const [newRemarks, setNewRemarks] = useState('');

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

  const handleToggleAttendance = (student) => {
    if (student.brigada_attendance === 'Attended') {
      // If student is present, show modal for marking absent
      setSelectedStudent(student);
      setShowModal(true);
      setAbsenceReason('');
    } else {
      // If student is absent, directly mark as present with "Attended" remark
      updateAttendance(student.student_id, true, "Attended");
    }
  };

  const handleModalSubmit = () => {
    if (!absenceReason.trim()) {
      alert('Please provide a reason for absence');
      return;
    }
    
    if (selectedStudent) {
      updateAttendance(selectedStudent.student_id, false, absenceReason);
      setShowModal(false);
      setAbsenceReason('');
      setSelectedStudent(null);
    }
  };

  const handleModalClose = () => {
    setShowModal(false);
    setAbsenceReason('');
    setSelectedStudent(null);
  };

  const updateAttendance = async (studentId, status) => {
    try {
      // Send the brigada_attendance status (0 or 1)
      await axios.put(`http://localhost:3001/brigada-eskwela/${studentId}`, {
        brigada_attendance: status ? 1 : 0, // Convert status to 1 or 0
      });
  
      // Update the students state to reflect the new attendance status
      const updatedStudents = students.map((student) => {
        if (student.student_id === studentId) {
          return {
            ...student,
            brigada_attendance: status ? 'Attended' : 'No',
          };
        }
        return student;
      });
      fetchStudents();
      setStudents(updatedStudents);
      setFilteredStudents(updatedStudents);
    } catch (error) {
      console.error('Error updating brigada attendance:', error);
      alert('Failed to update attendance. Please try again.');
    }
  };
  

  const handleAddRemarks = async (studentId, remarks) => {
    try {
      // Sending studentId in the URL
      await axios.post(`http://localhost:3001/brigada-eskwela/remarks`, {
        studentId: studentId,  // Send studentId with the body if needed, or just as a query parameter.
        remarks: remarks
      });

      // Update the students state to reflect the new remarks
      const updatedStudents = students.map((student) => {
        if (student.student_id === studentId) {
          return { 
            ...student, 
            remarks: remarks 
          };
        }
        return student;
      });

      setStudents(updatedStudents);
      setFilteredStudents(updatedStudents);
      setShowRemarksModal(false);
      setNewRemarks('');
      setSelectedStudent(null);
    } catch (error) {
      console.error('Error adding remarks:', error);
      alert('Failed to add remarks. Please try again.');
    }
};


  const handleRemarksModalClose = () => {
    setShowRemarksModal(false);
    setNewRemarks('');
    setSelectedStudent(null);
  };

  const paginate = (pageNumber) => setCurrentPage(pageNumber);
  const indexOfLastStudent = currentPage * studentsPerPage;
  const indexOfFirstStudent = indexOfLastStudent - studentsPerPage;
  const currentStudents = filteredStudents.slice(indexOfFirstStudent, indexOfLastStudent);

  return (
    <div className="brigada-container">
      <div className="brigada-header">
        <h1 className="brigada-title">Brigada Eskwela (Checking)</h1>
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
                  <td>
                    {student.brigada_attendance !== 'Attended' && (
                      <div className="button-group">
                        <button
                          className="toggle-attendance-btn"
                          onClick={() => handleToggleAttendance(student)}
                        >
                          Mark as Present
                        </button>
                        {!student.remarks && (
                        <button
                          className="add-remarks-btn"
                          onClick={() => {
                            setSelectedStudent(student);
                            setShowRemarksModal(true);
                            setNewRemarks(student.remarks || '');
                          }}
                        >
                          Add Remarks
                        </button>
                      )}
                      </div>
                    )}
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

      {showModal && (
        <div className="modal-overlay">
          <div className="modal">
            <h3>Reason for Absence</h3>
            <p className="modal-student-name">Student: {selectedStudent?.stud_name}</p>
            <textarea
              value={absenceReason}
              onChange={(e) => setAbsenceReason(e.target.value)}
              placeholder="Please provide a reason for absence..."
            ></textarea>
            <div className="modal-actions">
              <button onClick={() => handleModalSubmit()}>Submit</button>
              <button onClick={handleModalClose}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {showRemarksModal && (
        <div className="modal-overlay">
          <div className="modal">
            <h3>Add Remarks</h3>
            <p className="modal-student-name">Student: {selectedStudent?.stud_name}</p>
            <textarea
              value={newRemarks}
              onChange={(e) => setNewRemarks(e.target.value)}
              placeholder="Reason for absence"
            ></textarea>
            <div className="modal-actions">
              <button onClick={() => handleAddRemarks(selectedStudent.student_id, newRemarks)}>Save</button>
              <button onClick={handleRemarksModalClose}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default BrigadaEskwela;
