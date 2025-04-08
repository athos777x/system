import React, { useState, useEffect } from 'react';
import Pagination from '../Utilities/pagination';
import axios from 'axios';
import '../TeacherPagesCss/EnrollmentRequests.css';

function EnrollmentRequests() {
  const [students, setStudents] = useState([]);
  const [filteredStudents, setFilteredStudents] = useState([]);
  const [selectedStudentId, setSelectedStudentId] = useState(null);
  const [studentsPerPage] = useState(20);
  const [currentPage, setCurrentPage] = useState(1);
  const [isEditing, setIsEditing] = useState(false);
  const [editStudentData, setEditStudentData] = useState(null);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [schoolYears, setSchoolYears] = useState([]);
  const [sections, setSections] = useState([]);
  const [filteredSections, setFilteredSections] = useState([]);
  const [requirementsChecked, setRequirementsChecked] = useState(false);
  const [showRequirementsModal, setShowRequirementsModal] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [subjects, setSubjects] = useState([]);

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

  const fetchStudents = async (appliedFilters = {}) => {
    try {
      // Log the applied filters to check what's being passed to the backend
      console.log('Applied filters:', appliedFilters);
  
      // Make the API request to get students with the applied filters
      const response = await axios.get('http://localhost:3001/students/pending-enrollment', {
        params: appliedFilters
      });
  
      // Log the full response from the server to see if it's working as expected
      console.log('Full response from server:', response);
  
      // Sort the students by first name
      const sortedStudents = response.data.sort((a, b) => a.firstname.localeCompare(b.firstname));
  
      // Log the sorted students before setting the state
      console.log('Sorted students:', sortedStudents);
      
      // Log each student's data to check the status field
      sortedStudents.forEach(student => {
        console.log(`Student ${student.student_id} status: ${student.enrollment_status}, type: ${typeof student.enrollment_status}`);
      });
  
      // Update the students and filteredStudents state
      setStudents(sortedStudents);
      setFilteredStudents(sortedStudents);
  
      // Log the state after setting it to ensure it's correct
      console.log('Students state updated:', sortedStudents);
  
    } catch (error) {
      // Log the error in detail if the request fails
      if (error.response) {
        console.error('Error response from server:', error.response.data);
      } else if (error.request) {
        console.error('No response from server. Request was:', error.request);
      } else {
        console.error('Error setting up request:', error.message);
      }
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
    setFilters(prevFilters => ({
        ...prevFilters,
        searchTerm
    }));
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
        filtered = filtered.filter(student => String(student.section_id) === filters.section);
    }
    if (filters.status) {
        filtered = filtered.filter(student => student.enrollment_status === filters.status);
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
    console.log('Filtered students:', filtered);
    setCurrentPage(1); // Reset to first page when filters are applied
};

const handleApplyFilters = () => {
    console.log('Applying filters:', filters);
    applyFilters(); // Apply filters only when the button is clicked
};


const validateStudent = async (studentId, action) => {
  try {
    console.log(`Validating enrollment for student ID: ${studentId} with action: ${action}`);

    // Send the POST request with the action (approve/reject)
    const response = await axios.post('http://localhost:3001/validate-enrollment', { studentId, action });

    // Check for successful response
    if (response.status === 200) {
      console.log('Validation successful:', response.data);
      alert(response.data.message);
      await fetchStudents(); // Refresh the student list after validation
    } else {
      console.warn('Failed to validate enrollment, non-200 response:', response);
      alert('Failed to validate enrollment.');
    }
  } catch (error) {
    if (error.response) {
      console.error('Error response:', error.response.data);
      alert('Error validating the enrollment: ' + (error.response.data.error || 'Unknown error'));
    } else if (error.request) {
      console.error('No response from server:', error.request);
      alert('No response from the server. Please check your connection.');
    } else {
      console.error('Error setting up request:', error.message);
      alert('An error occurred: ' + error.message);
    }
  }
};


const approveElective = async (studentElectiveId) => {
  try {
      const response = await axios.post('http://localhost:3001/approve-elective', {
          studentElectiveId
      });

      if (response.data.message) {
          alert(response.data.message);
          await fetchStudents(); // Refresh student list after approval
      } else {
          alert('Failed to approve elective.');
      }
  } catch (error) {
      console.error('Error approving elective:', error);
      alert('An error occurred while approving the elective.');
  }
};



  const formatDate = (isoString) => {
    const date = new Date(isoString);
    return date.toLocaleDateString();
  };

  const toggleStudentDetails = (studentId, editMode = false) => {
    if (editMode) {
      const student = currentStudents.find((s) => s.student_id === studentId);
      setEditStudentData(student); // Load student data into edit mode
    }
    setIsEditing(editMode);
    setSelectedStudentId(selectedStudentId === studentId ? null : studentId);
  };

  const paginate = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  const indexOfLastStudent = currentPage * studentsPerPage;
  const indexOfFirstStudent = indexOfLastStudent - studentsPerPage;
  const currentStudents = filteredStudents.slice(indexOfFirstStudent, indexOfLastStudent);

  const totalPages = Math.ceil(filteredStudents.length / studentsPerPage);
  const [roleName, setRoleName] = useState('');

  useEffect(() => {
    const userId = localStorage.getItem('userId'); // Retrieve userId from localStorage
    console.log('Current localStorage contents:', {
      userId: localStorage.getItem('userId'),
      role: localStorage.getItem('role'),
      isAuthenticated: localStorage.getItem('isAuthenticated')
    });
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


  // Handle changes in editable fields
  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditStudentData({ ...editStudentData, [name]: value });
  };

  const handleSave = async () => {
    if (!editStudentData || !editStudentData.student_id) {
      console.error('Student ID is missing or edit data is not initialized.');
      return;
    }
  
    // Format the birthdate before sending it to the backend
    const formattedBirthdate = new Date(editStudentData.birthdate).toISOString().split('T')[0];
  
    // Update the student data with the formatted birthdate
    const updatedStudentData = { ...editStudentData, birthdate: formattedBirthdate };
  
    try {
      // Make the PUT request to the backend to update the student
      const response = await fetch(`http://localhost:3001/students/${editStudentData.student_id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedStudentData),
      });
  
      // Check if the response is OK
      if (!response.ok) {
        throw new Error('Failed to save student data');
      }
  
      // Get the updated student data from the response
      const updatedStudent = await response.json();
  
      // Update the state with the updated student data
      setStudents((prevStudents) =>
        prevStudents.map((student) =>
          student.student_id === updatedStudent.student_id ? updatedStudent : student
        )
      );
  
      // Reset the form only after saving is successful
      setEditStudentData(null);
  
      // Show success message
      alert('Edited Successfully');
      
      // Refresh the student list
      await fetchStudents();
  
      // Untoggle the student detail view to return to the list of students
      toggleStudentDetails(); // This will hide the student detail view and go back to the list
  
    } catch (error) {
      console.error('Error saving student data:', error);
    }
  };
  


  // Cancel edit with confirmation modal
  const cancelEdit = () => {
    setShowCancelModal(true);
  };

  const fetchSubjectsAndGrades = async (studentId, gradeLevel, schoolYearId) => {
    try {
      const response = await axios.get('http://localhost:3001/api/subjects-card', {
        params: { 
          studentId, 
          gradeLevel,
          schoolYearId  
        },
      });
      const subjectsData = response.data || [];

      // Fetch grades for these subjects
      const gradesResponse = await axios.get('http://localhost:3001/api/grades', {
        params: { 
          studentId, 
          gradeLevel,
          schoolYearId 
        },
      });

      if (gradesResponse.data && gradesResponse.data.grades) {
        const gradesData = gradesResponse.data.grades;
        const updatedSubjects = subjectsData.map(subject => {
          const matchingGrade = gradesData.find(grade => 
            grade.subject_name.toLowerCase().trim() === subject.subject_name.toLowerCase().trim()
          );

          if (matchingGrade) {
            const q1 = parseFloat(matchingGrade.q1) || 0;
            const q2 = parseFloat(matchingGrade.q2) || 0;
            const q3 = parseFloat(matchingGrade.q3) || 0;
            const q4 = parseFloat(matchingGrade.q4) || 0;
            const final = ((q1 + q2 + q3 + q4) / 4).toFixed(0);

            return {
              ...subject,
              q1: matchingGrade.q1,
              q2: matchingGrade.q2,
              q3: matchingGrade.q3,
              q4: matchingGrade.q4,
              final: final,
              remarks: parseFloat(final) >= 75 ? "Passed" : "Failed"
            };
          }
          return subject;
        });
        setSubjects(updatedSubjects);
      }
    } catch (error) {
      console.error('Error fetching subjects and grades:', error);
    }
  };

  const EnrollmentModal = ({ student, onClose, onEnroll }) => {
    const [requirementsChecked, setRequirementsChecked] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
      const fetchData = async () => {
        setLoading(true);
        await fetchSubjectsAndGrades(
          student.student_id,
          student.current_yr_lvl,
          student.school_year_id
        );
        setLoading(false);
      };
      fetchData();
    }, [student]);

    const handleEnroll = () => {
      if (!requirementsChecked) {
        alert('Please check the requirements box before enrolling.');
        return;
      }

      // Check if student has any failed subjects
      const hasFailedSubjects = subjects.some(subject => subject.remarks === "Failed");
      if (hasFailedSubjects) {
        const confirmEnroll = window.confirm(
          'Warning: This student has failed subjects. Do you still want to proceed with enrollment?'
        );
        if (!confirmEnroll) return;
      }

      onEnroll(student.student_id);
    };

    return (
      <div className="enrollment-modal">
        <div className="enrollment-modal-content">
          <h2>Student Enrollment</h2>
          <div className="student-info">
            <table>
              <tbody>
                <tr>
                  <th>Student Name:</th>
                  <td>{`${student.firstname} ${student.middlename ? student.middlename + ' ' : ''}${student.lastname}`}</td>
                </tr>
                <tr>
                  <th>Grade Level:</th>
                  <td>{student.current_yr_lvl}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="grades-details-container">
            <h3>Previous School Year Grades</h3>
            {loading ? (
              <p>Loading grades...</p>
            ) : (
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
                  {subjects.length > 0 ? (
                    subjects.map((subject, index) => (
                      <tr key={index}>
                        <td>{subject.subject_name}</td>
                        <td>{subject.q1 || "___"}</td>
                        <td>{subject.q2 || "___"}</td>
                        <td>{subject.q3 || "___"}</td>
                        <td>{subject.q4 || "___"}</td>
                        <td>{subject.final || "___"}</td>
                        <td className={subject.remarks === "Passed" ? "passed" : subject.remarks === "Failed" ? "failed" : ""}>
                          {subject.remarks || "___"}
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
            )}
          </div>

          <div className="requirements-section">
            <label className="requirements-checkbox">
              <input
                type="checkbox"
                checked={requirementsChecked}
                onChange={(e) => setRequirementsChecked(e.target.checked)}
              />
              I confirm that all required documents have been submitted
            </label>
          </div>
          <div className="modal-actions">
            <button 
              className="pending-enrollment-btn pending-enrollment-btn-approve"
              onClick={handleEnroll}
            >
              Enroll
            </button>
            <button 
              className="pending-enrollment-btn pending-enrollment-btn-reject"
              onClick={onClose}
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="pending-enrollment-container">
      <div className="pending-enrollment-header">
        <h1 className="pending-enrollment-title">Pending Enrollment</h1>
      </div>

      <div className="pending-enrollment-filters">
        <div className="pending-enrollment-search">
          <input
            type="text"
            placeholder="Search students..."
            value={filters.searchTerm}
            onChange={(e) => handleSearch(e.target.value)}
          />
        </div>
        <div className="pending-enrollment-filters-group">
          <select
            className="pending-enrollment-select"
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
            className="pending-enrollment-select"
            value={filters.grade}
            onChange={(e) => handleFilterChange('grade', e.target.value)}
          >
            <option value="">Select Grade</option>
            {[7, 8, 9, 10].map((grade) => (
              <option key={grade} value={grade}>Grade {grade}</option>
            ))}
          </select>
          <select
            className="pending-enrollment-select"
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
          <button onClick={handleApplyFilters}>Filter</button>
        </div>
      </div>

      <div className="pending-enrollment-table-container">
        <table className="pending-enrollment-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Student Name</th>
              <th>Grade</th>
              <th>Section</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {currentStudents.length > 0 ? (
              currentStudents.map((student, index) => (
                <tr key={student.student_id}>
                  <td>{indexOfFirstStudent + index + 1}</td>
                  <td>{student.firstname} {student.middlename && `${student.middlename[0]}.`} {student.lastname}</td>
                  <td>{student.current_yr_lvl}</td>
                  <td>{student.section_id}</td>
                  <td>
                    <span className={`status-${student.enrollment_status ? student.enrollment_status.toLowerCase() : ''}`}>
                      {student.enrollment_status}
                    </span>
                  </td>
                  <td>
                    <div className="pending-enrollment-actions">
                      <button
                        className="pending-enrollment-btn pending-enrollment-btn-view"
                        onClick={() => toggleStudentDetails(student.student_id)}
                      >
                        View
                      </button>
                      {(roleName === 'registrar' || roleName === 'grade_level_coordinator' || roleName === 'class_adviser') && (
                        <>
                          {(student.active_status && student.active_status.toLowerCase() === 'pending') && (
                            <button 
                              className="pending-enrollment-btn pending-enrollment-btn-approve" 
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedStudent(student);
                                setShowRequirementsModal(true);
                              }}
                            >
                              Enroll
                            </button>
                          )}
                        </>
                      )}
                      <button
                        className="pending-enrollment-btn pending-enrollment-btn-reject"
                        onClick={(e) => {
                          e.stopPropagation();
                          validateStudent(student.student_id, 'reject');
                        }}
                      >
                        Reject
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="6" style={{ textAlign: 'center', padding: '2rem', color: '#666' }}>
                  No pending students found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {showRequirementsModal && selectedStudent && (
        <EnrollmentModal
          student={selectedStudent}
          onClose={() => {
            setShowRequirementsModal(false);
            setSelectedStudent(null);
          }}
          onEnroll={(studentId) => {
            validateStudent(studentId, 'approve');
            setShowRequirementsModal(false);
            setSelectedStudent(null);
          }}
        />
      )}

      {selectedStudentId && (
        <div className="pending-enrollment-details">
          <table>
            <tbody>
              <tr>
                <th>Student ID</th>
                <td>{editStudentData?.student_id || ''}</td>
              </tr>
              <tr>
                <th>First Name</th>
                <td>{editStudentData?.firstname || ''}</td>
              </tr>
              <tr>
                <th>Middle Name</th>
                <td>{editStudentData?.middlename || ''}</td>
              </tr>
              <tr>
                <th>Last Name</th>
                <td>{editStudentData?.lastname || ''}</td>
              </tr>
              <tr>
                <th>Grade</th>
                <td>{editStudentData?.current_yr_lvl || ''}</td>
              </tr>
              <tr>
                <th>Section</th>
                <td>{editStudentData?.section_id || ''}</td>
              </tr>
              <tr>
                <th>Status</th>
                <td>
                  <span className={`status-${editStudentData?.enrollment_status ? editStudentData.enrollment_status.toLowerCase() : ''}`}>
                    {editStudentData?.enrollment_status || ''}
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      )}

      <Pagination
        itemsPerPage={studentsPerPage}
        totalItems={filteredStudents.length}
        paginate={paginate}
        currentPage={currentPage}
      />
    </div>
  );
}

export default EnrollmentRequests;
