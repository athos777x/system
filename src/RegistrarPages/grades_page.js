import React, { useState, useEffect } from 'react';
import axios from 'axios';
import SearchFilter from '../RoleSearchFilters/SearchFilter';
import '../RegistrarPagesCss/Registrar_SectionPage.css';
import Pagination from '../Utilities/pagination';
import GradeDetail from '../Utilities/grades-detail';
import { useNavigate } from 'react-router-dom';

function GradesPage() {
const navigate = useNavigate();
const [filteredStudents, setFilteredStudents] = useState([]);
const [selectedGradeDetailStudent, setSelectedGradeDetailStudent] = useState(null); // For View Grade Details
const [currentPage, setCurrentPage] = useState(1);
const [selectedStudent, setSelectedStudent] = useState(null);
const [studentsPerPage] = useState(5); // Adjust this number to set how many students per page
const [students, setStudents] = useState([]);
const [expandedStudent, setExpandedStudent] = useState(null);
const [subjects, setSubjects] = useState([]);
const [isEditing, setIsEditing] = useState(false);
const [editingStudent, setEditingStudent] = useState(null); // Track which student is in edit mode
const [gradesFetched, setGradesFetched] = useState(false);
const [filters, setFilters] = useState({
    searchTerm: '',
    school_year: '',
    grade: '',
    section: '',
    status: ''
});
const paginate = (pageNumber) => {
    setCurrentPage(pageNumber);
};
const indexOfLastStudent = currentPage * studentsPerPage;
const indexOfFirstStudent = indexOfLastStudent - studentsPerPage;
const currentStudents = filteredStudents.slice(indexOfFirstStudent, indexOfLastStudent);

const totalPages = Math.ceil(filteredStudents.length / studentsPerPage);

useEffect(() => {
    fetchStudents(); // Fetch all students initially (without filters)
}, []); // Run only once when the component mounts



const fetchStudents = async (appliedFilters = {}) => {
    try {
    const response = await axios.get('http://localhost:3001/students', {
        params: appliedFilters
    });
    const sortedStudents = response.data.sort((a, b) => b.current_yr_lvl - a.current_yr_lvl);
    setStudents(sortedStudents);
      setFilteredStudents(sortedStudents); // Initialize filteredStudents
    } catch (error) {
    console.error('Error fetching students:', error);
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
    setIsEditing(false);
    const gradeLevel = student.current_yr_lvl; // Ensure correct grade level is passed

    // Fetch subjects first, then fetch grades
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
      return subjectsData; // Return subjects for use in fetchGrades
    } catch (error) {
    console.error('Error fetching subjects:', error);
    return [];
    }
};

const handleGradeChange = (index, period, value) => {
    setSubjects((prevSubjects) => {
        const updatedSubjects = [...prevSubjects];
        updatedSubjects[index] = { ...updatedSubjects[index], [period]: value };

        // Calculate the final grade
        const q1 = parseFloat(updatedSubjects[index].q1) || 0;
        const q2 = parseFloat(updatedSubjects[index].q2) || 0;
        const q3 = parseFloat(updatedSubjects[index].q3) || 0;
        const q4 = parseFloat(updatedSubjects[index].q4) || 0;

        const finalGrade = (q1 + q2 + q3 + q4) / 4;
        updatedSubjects[index].final = isNaN(finalGrade) ? "" : finalGrade.toFixed(2);

        // Determine remarks
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

        console.log("Submitting grades:", formattedSubjects);

        const response = await axios.post("http://localhost:3001/api/save-grade", {
            student_id: selectedStudent.student_id,
            student_name: `${selectedStudent.firstname} ${selectedStudent.lastname}`,
            grade_level: selectedStudent.current_yr_lvl,
            school_year_id: selectedStudent.school_year_id,
            subjects: formattedSubjects
        });

        console.log("Server response:", response.data);

        if (response.data.success) {
            alert("Grades updated successfully!");
            
            // ✅ Close the table just like the Cancel button
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
        // If clicking "Cancel", close the table
        setEditingStudent(null);
        setSelectedStudent(null);
        setSubjects([]);
        setGradesFetched(false);
        return;
    }

    setSelectedStudent(student);
    setEditingStudent(student); // Enable edit mode for this student
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

        // Ensure existingSubjects are used
        const updatedSubjects = (existingSubjects || []).map(subject => {
        const subjectGrades = fetchedGrades.find(grade => grade.subject_name === subject.subject_name) || {};
        return { ...subject, ...subjectGrades };
        });

        setSubjects(updatedSubjects);
        setGradesFetched(true);
    } else {
        console.warn('No grades found for this student.');
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
    console.log('Filtered students:', filtered);
    setCurrentPage(1); // Reset to first page when filters are applied
};


const handleApplyFilters = () => {
    console.log('Applying filters:', filters);
    fetchStudents(filters); // Fetch students only when the button is clicked
};

return (
    <div className="section-container">
    <h1 className="section-title">Grades</h1>
    <div className="section-search-filter-container">
        <SearchFilter
        handleSearch={handleSearch}
        handleFilter={handleFilterChange}
        handleApplyFilters={handleApplyFilters}
        />
    </div>
    <table className="attendance-table">
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
                    <td>{index + 1}</td>
                    <td>
                    {student.firstname} {student.middlename && `${student.middlename[0]}.`} {student.lastname}
                    </td>
                    <td>Grade {student.current_yr_lvl}</td>
                    <td>Section {student.section_name}</td>
                    <td>
                    <button className="section-view-button" onClick={() => handleStudentClick(student)}>
                        {expandedStudent === student.student_id ? 'View' : 'View'}
                    </button>
                    <button className="section-view-button" onClick={() => handleEditClick(student)}>
                    {editingStudent && editingStudent.student_id === student.student_id ? "Cancel" : "Edit"}
                    </button>
                    {editingStudent && editingStudent.student_id === student.student_id && (
                    <button className="section-view-button" onClick={handleSaveChanges}>
                        Save
                    </button>
                    )}
                    </td>
                </tr>
                {selectedStudent && selectedStudent.student_id === student.student_id && (
                    <tr>
                    <td colSpan="5">
                        <div className="grades-table-container">
                        <h3>Grades for {student.firstname} {student.lastname}</h3>
                        <table className="subjects-table">
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
                                        <td>
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
    <Pagination
        totalItems={filteredStudents.length}
        itemsPerPage={studentsPerPage}
        currentPage={currentPage}
        onPageChange={paginate}
    />
    </div>
);
}

export default GradesPage;
