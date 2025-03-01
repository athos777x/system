import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import SectionSearchFilter from '../RoleSearchFilters/SectionSearchFilter'; 
import '../RegistrarPagesCss/Registrar_SectionPage.css';

function GradesPage() {
  const [sections, setSections] = useState([]);
  const [filteredSections, setFilteredSections] = useState([]);
  const [selectedSectionId, setSelectedSectionId] = useState(null);
  const [students, setStudents] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [grades, setGrades] = useState({});
  const [selectedGradingPeriod, setSelectedGradingPeriod] = useState(null);
  const [percentages] = useState({ WW: 30, PT: 50, QA: 20 });

  useEffect(() => {
    fetchSections();
  }, []);

  const fetchSections = async () => {
    try {
      const response = await axios.get('http://localhost:3001/sections');
      setSections(response.data);
      setFilteredSections(response.data);
    } catch (error) {
      console.error('Error fetching sections:', error);
    }
  };

  const handleSectionClick = async (sectionId) => {
    if (selectedSectionId === sectionId) {
      setSelectedSectionId(null);
      setStudents([]);
      setSubjects([]);
      setGrades({});
      return;
    }
    setSelectedSectionId(sectionId);
    fetchStudents({ section_id: sectionId });
    fetchSubjects(sectionId);
  };

  const fetchStudents = async (appliedFilters = {}) => {
    try {
      console.log('Applied filters:', appliedFilters);
      const response = await axios.get('http://localhost:3001/students', {
        params: appliedFilters
      });
      console.log('Full response from server:', response);
      const sortedStudents = response.data.sort((a, b) => b.current_yr_lvl - a.current_yr_lvl);
      console.log('Sorted students:', sortedStudents);
      setStudents(sortedStudents);
    } catch (error) {
      if (error.response) {
        console.error('Error response from server:', error.response.data);
      } else if (error.request) {
        console.error('No response received from server. Request was:', error.request);
      } else {
        console.error('Error setting up request:', error.message);
      }
    }
  };

  const fetchSubjects = async (sectionId) => {
    try {
      const response = await axios.get(`http://localhost:3001/subjects-for-assignment/${sectionId}`);
      setSubjects(response.data);
    } catch (error) {
      console.error('Error fetching subjects:', error);
    }
  };

  const fetchGrades = async (studentId, subjectName) => {
    try {
      const response = await axios.get('http://localhost:3001/student-grades', {
        params: { student_id: studentId, subject_name: subjectName, period: selectedGradingPeriod }
      });
      setGrades(prev => ({ ...prev, [`${studentId}-${subjectName}`]: response.data.grade || '-' }));
    } catch (error) {
      console.error('Error fetching grades:', error);
    }
  };

  useEffect(() => {
    if (students.length > 0 && subjects.length > 0) {
      students.forEach(student => {
        subjects.forEach(subject => {
          fetchGrades(student.student_id, subject.subject_name);
        });
      });
    }
  }, [students, subjects, selectedGradingPeriod]);

  return (
    <div className="section-container">
      <h1 className="section-title">Grades</h1>
      <div className="section-search-filter-container">
        <SectionSearchFilter handleApplyFilters={setFilteredSections} grades={[]} sections={sections} />
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
          {students.map((student, index) => (
            <tr key={student.student_id}>
              <td>{index + 1}</td>
              <td>{student.name}</td>
              <td>Grade {student.grade_level}</td>
              <td>Section {student.section_name}</td>
              <td>
                <button className="section-view-button" onClick={() => handleSectionClick(student.section_id)}>
                  {selectedSectionId === student.section_id ? 'Hide' : 'View'}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {selectedSectionId && (
        <div className="grades-table-container">
          <h2>Grades for Section {selectedSectionId}</h2>
          <label>Grading Period:</label>
          <select value={selectedGradingPeriod} onChange={(e) => setSelectedGradingPeriod(e.target.value)}>
            <option value="">Select Grading Period</option>
            <option value="1">1st Grading</option>
            <option value="2">2nd Grading</option>
            <option value="3">3rd Grading</option>
            <option value="4">4th Grading</option>
          </select>
          <table className="grades-table">
            <thead>
              <tr>
                <th>Student ID</th>
                <th>Name</th>
                {subjects.map((subject) => (
                  <th key={subject.id}>{subject.subject_name}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {students.map((student) => (
                <tr key={student.student_id}>
                  <td>{student.student_id}</td>
                  <td>{student.name}</td>
                  {subjects.map((subject) => (
                    <td key={subject.id}>{grades[`${student.student_id}-${subject.subject_name}`] || '-'}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default GradesPage;
