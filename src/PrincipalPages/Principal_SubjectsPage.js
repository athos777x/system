import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import SubjectsSearchFilter from '../RoleSearchFilters/SubjectsSearchFilter';
import '../CssPage/Principal_SubjectsPage.css';

function Principal_SubjectsPage() {
  const [subjects, setSubjects] = useState([]);
  const [filteredSubjects, setFilteredSubjects] = useState([]);
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [filters, setFilters] = useState({
    searchTerm: '',
    school_year: '',
    grade: '',
    archive_status: 'unarchive',
  });
  const [grades] = useState(['7', '8', '9', '10']);
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [newSubjectData, setNewSubjectData] = useState({
    subject_name: '',
    grade_level: '7',
    status: 'active',
    description: '',
    archive_status: 'unarchive',
  });
  const [selectedGrade, setSelectedGrade] = useState(null);

  const fetchSubjects = useCallback(async () => {
    try {
      const response = await axios.get('http://localhost:3001/subjects', {
        params: filters,
      });
      setSubjects(response.data);
      if (selectedGrade) {
        setFilteredSubjects(
          response.data.filter((subject) => String(subject.grade_level) === String(selectedGrade))
        );
      } else {
        setFilteredSubjects([]);
      }
    } catch (error) {
      console.error('Error fetching subjects:', error);
    }
  }, [filters, selectedGrade]);

  useEffect(() => {
    fetchSubjects();
  }, [fetchSubjects]);

  const handleGradeClick = (grade) => {
    setSelectedGrade(grade);
    setFilteredSubjects(subjects.filter((subject) => String(subject.grade_level) === String(grade)));
    setSelectedSubject(null);
  };

  const handleSubjectClick = (subject) => {
    setSelectedSubject(subject);
  };

  const handleSearch = (searchTerm) => {
    setFilters((prevFilters) => ({ ...prevFilters, searchTerm }));
  };

  const startAdding = () => {
    setShowModal(true);
    setIsEditing(false);
    setNewSubjectData({
      subject_name: '',
      grade_level: '7',
      status: 'active',
      description: '',
      archive_status: 'unarchive',
    });
  };

  const handleAddChange = (event) => {
    const { name, value } = event.target;
    setNewSubjectData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  const saveNewSubject = async () => {
    try {
      if (isEditing) {
        // Update existing subject
        await axios.put(`http://localhost:3001/subjects/${selectedSubject.subject_id}`, newSubjectData);
      } else {
        // Add new subject
        await axios.post('http://localhost:3001/subjects', newSubjectData);
      }
      fetchSubjects();
      setShowModal(false);
      setSelectedSubject(null);
    } catch (error) {
      console.error(`Error ${isEditing ? 'updating' : 'adding'} subject:`, error);
    }
  };

  const cancelAdding = () => {
    setShowModal(false);
  };

  const handleEdit = () => {
    setShowModal(true);
    setIsEditing(true);
    setNewSubjectData(selectedSubject);
  };

  const handleDelete = async () => {
    try {
      await axios.put(`http://localhost:3001/subjects/${selectedSubject.subject_id}/archive`);
      fetchSubjects();
      setSelectedSubject(null); // Clear details after deletion
    } catch (error) {
      console.error('Error deleting subject:', error);
    }
  };

  return (
    <div className="grades-container">
      <h2 className="grades-title">Subjects</h2>
      <div className="subjects-add-subject-button-container">
        <SubjectsSearchFilter handleSearch={handleSearch} />
      </div>
      <div className="subjects-add-subject-button-container">
        <button className="subjects-add-subject-button" onClick={startAdding}>
          + Add New Subject
        </button>
      </div>
      <div className="grades-table">
        <div className="table-column">
          <h3>Grade Levels</h3>
          <div className="grade-buttons">
            {grades.map((grade) => (
              <button
                key={grade}
                className={selectedGrade === grade ? 'active' : ''}
                onClick={() => handleGradeClick(grade)}
              >
                Grade {grade}
              </button>
            ))}
          </div>
        </div>
        <div className="table-column">
          <h3>Subjects</h3>
          {selectedGrade ? (
            filteredSubjects.length > 0 ? (
              <ul className="subjects-list">
                {filteredSubjects.map((subject) => (
                  <li
                    key={subject.subject_id}
                    className="subject-item"
                    onClick={() => handleSubjectClick(subject)}
                  >
                    {subject.subject_name} ({subject.status.charAt(0).toUpperCase() + subject.status.slice(1)})
                  </li>
                ))}
              </ul> 
            ) : (
              <p>No subjects available for Grade {selectedGrade}.</p>
            )
          ) : (
            <p>Please select a grade level to view its subjects.</p>
          )}
        </div>
        <div className="table-column">
          <h3>Subject Details</h3>
          {selectedSubject ? (
            <div className="subject-details">
              <table>
                <tbody>
                  <tr>
                    <td><strong>Name:</strong></td>
                    <td>{selectedSubject.subject_name}</td>
                  </tr>
                  <tr>
                    <td><strong>Grade Level:</strong></td>
                    <td>Grade {selectedSubject.grade_level}</td>
                  </tr>
                  <tr>
                    <td><strong>Status:</strong></td>
                    <td>{selectedSubject.status}</td>
                  </tr>
                  <tr>
                    <td><strong>Description:</strong></td>
                    <td>{selectedSubject.description || 'No description provided'}</td>
                  </tr>
                  <tr>
                    <td colSpan="2">
                      <div className="subject-actions">
                        <button className="edit-button" onClick={handleEdit}>
                          Edit
                        </button>
                        <button className="delete-button" onClick={handleDelete}>
                          Archive
                        </button>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          ) : (
            <p>Please select a subject to view its details.</p>
          )}
        </div>
      </div>
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>{isEditing ? 'Edit Subject' : 'Add New Subject'}</h3>
              <button className="close-btn" onClick={cancelAdding}>
                &times;
              </button>
            </div>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                saveNewSubject();
              }}
            >
              <div className="form-group">
                <label>Subject Name:</label>
                <input
                  type="text"
                  name="subject_name"
                  value={newSubjectData.subject_name}
                  onChange={handleAddChange}
                  required
                />
              </div>
              <div className="form-group">
                <label>Grade Level:</label>
                <select
                  name="grade_level"
                  value={newSubjectData.grade_level}
                  onChange={handleAddChange}
                >
                  {grades.map((grade) => (
                    <option key={grade} value={grade}>
                      Grade {grade}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Status:</label>
                <select
                  name="status"
                  value={newSubjectData.status}
                  onChange={handleAddChange}
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
              <div className="form-group">
                <label>Description:</label>
                <textarea
                  name="description"
                  value={newSubjectData.description}
                  onChange={handleAddChange}
                />
              </div>
              <div className="modal-buttons">
                <button type="button" onClick={cancelAdding}>
                  Cancel
                </button>
                <button type="submit">{isEditing ? 'Update' : 'Save'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Principal_SubjectsPage;
