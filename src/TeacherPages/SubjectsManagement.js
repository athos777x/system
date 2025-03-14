import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import '../TeacherPagesCss/SubjectsManagement.css';
import { FiPlus, FiEdit2, FiArchive } from 'react-icons/fi';

function SubjectsManagement() {
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
      // Ensure subjects are updated if the school year is inactive
      await axios.put('http://localhost:3001/update-subjects-status');
  
      // Fetch subjects after updating
      const response = await axios.get('http://localhost:3001/subjects', { params: filters });
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
    <div className="subject-mgmt-container">
      <h2 className="subject-mgmt-title">Subjects Management</h2>
      {/* <div className="subjects-add-subject-button-container">
        <SubjectsSearchFilter handleSearch={handleSearch} />
      </div> */}
      <div className="subject-mgmt-add-btn-container">
        <button className="subject-mgmt-add-btn" onClick={startAdding}>
          <FiPlus /> Add New Subject
        </button>
      </div>
      <div className="subject-mgmt-grid">
        <div className="subject-mgmt-column">
          <h3>Grade Levels</h3>
          <div className="subject-mgmt-grade-buttons">
            {grades.map((grade) => (
              <button
                key={grade}
                className={`subject-mgmt-grade-btn ${selectedGrade === grade ? 'active' : ''}`}
                onClick={() => handleGradeClick(grade)}
              >
                Grade {grade}
              </button>
            ))}
          </div>
        </div>
        <div className="subject-mgmt-column">
          <h3>Subjects</h3>
          {selectedGrade ? (
            filteredSubjects.length > 0 ? (
              <ul className="subject-mgmt-list">
                {filteredSubjects.map((subject) => (
                  <li
                    key={subject.subject_id}
                    className={`subject-mgmt-item ${selectedSubject?.subject_id === subject.subject_id ? 'active' : ''}`}
                    onClick={() => handleSubjectClick(subject)}
                  >
                    <div className="subject-mgmt-item-name">{subject.subject_name}</div>
                    <span className={`subject-mgmt-status ${subject.status}`}>
                      {subject.status.charAt(0).toUpperCase() + subject.status.slice(1)}
                    </span>
                  </li>
                ))}
              </ul> 
            ) : (
              <div className="subject-mgmt-empty-message">
                No subjects available for Grade {selectedGrade}.
              </div>
            )
          ) : (
            <div className="subject-mgmt-empty-message">
              Please select a grade level to view its subjects.
            </div>
          )}
        </div>
        <div className="subject-mgmt-column">
          <h3>Subject Details</h3>
          {selectedSubject ? (
            <div className="subject-mgmt-details">
              <table>
                <tbody>
                  <tr>
                    <td>Name</td>
                    <td>{selectedSubject.subject_name}</td>
                  </tr>
                  <tr>
                    <td>Grade Level</td>
                    <td>Grade {selectedSubject.grade_level}</td>
                  </tr>
                  <tr>
                    <td>Status</td>
                    <td>
                      <span className={`subject-mgmt-status ${selectedSubject.status}`}>
                        {selectedSubject.status.charAt(0).toUpperCase() + selectedSubject.status.slice(1)}
                      </span>
                    </td>
                  </tr>
                  <tr>
                    <td>Description</td>
                    <td>{selectedSubject.description || 'No description provided'}</td>
                  </tr>
                </tbody>
              </table>
              
              <div className="subject-mgmt-actions">
                <button className="subject-mgmt-edit-btn" onClick={handleEdit}>
                  <FiEdit2 /> Edit
                </button>
                <button 
                  className="subject-mgmt-archive-btn" 
                  onClick={handleDelete}
                  disabled={selectedSubject?.sy_status === 'active'}
                >
                  <FiArchive /> Archive
                </button>
              </div>
            </div>
          ) : (
            <div className="subject-mgmt-empty-message">
              Please select a subject to view its details.
            </div>
          )}
        </div>
      </div>
      {showModal && (
        <div className="subject-mgmt-modal-overlay">
          <div className="subject-mgmt-modal">
            <div className="subject-mgmt-modal-header">
              <h3 className="subject-mgmt-modal-title">
                {isEditing ? 'Edit Subject' : 'Add New Subject'}
              </h3>
              <button className="subject-mgmt-modal-close" onClick={() => setShowModal(false)}>
                &times;
              </button>
            </div>
            
            <form onSubmit={(e) => {
              e.preventDefault();
              saveNewSubject();
            }}>
              <div className="subject-mgmt-form-group">
                <label>Subject Name</label>
                <input
                  type="text"
                  name="subject_name"
                  value={newSubjectData.subject_name}
                  onChange={handleAddChange}
                  required
                />
              </div>

              <div className="subject-mgmt-form-group">
                <label>Grade Level</label>
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

              <div className="subject-mgmt-form-group">
                <label>Status</label>
                <select
                  name="status"
                  value={newSubjectData.status}
                  onChange={handleAddChange}
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>

              <div className="subject-mgmt-form-group">
                <label>Description</label>
                <textarea
                  name="description"
                  value={newSubjectData.description}
                  onChange={handleAddChange}
                  placeholder="Enter subject description..."
                />
              </div>

              <div className="subject-mgmt-modal-buttons">
                <button 
                  type="button" 
                  className="subject-mgmt-modal-btn subject-mgmt-modal-cancel"
                  onClick={() => setShowModal(false)}
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="subject-mgmt-modal-btn subject-mgmt-modal-submit"
                >
                  {isEditing ? 'Update' : 'Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default SubjectsManagement;
