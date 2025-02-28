import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import SubjectsSearchFilter from '../RoleSearchFilters/SubjectsSearchFilter';
import '../CssPage/Principal_SubjectsPage.css';

function TestSubjectsPage() {
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
  const [showDetails, setShowDetails] = useState(false);

  const fetchSubjects = useCallback(async () => {
    try {
      // Ensure subjects are updated if the school year is inactive
      await axios.put('http://localhost:3001/update-subjects-status');
  
      // Fetch subjects after updating
      const response = await axios.get('http://localhost:3001/subjects', { params: filters });
      setSubjects(response.data);
      setFilteredSubjects(response.data);
    } catch (error) {
      console.error('Error fetching subjects:', error);
    }
  }, [filters]);
  
  useEffect(() => {
    fetchSubjects();
  }, [fetchSubjects]);

  const handleSearch = (searchTerm) => {
    setFilters((prevFilters) => ({ ...prevFilters, searchTerm }));
  };

  const handleApplyFilters = (newFilters) => {
    setFilters(newFilters);
  };

  const handleViewClick = (subject) => {
    if (selectedSubject && selectedSubject.subject_id === subject.subject_id) {
      setSelectedSubject(null);
      setShowDetails(false);
    } else {
      setSelectedSubject(subject);
      setShowDetails(true);
    }
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
      setShowDetails(false);
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
      setSelectedSubject(null);
      setShowDetails(false);
    } catch (error) {
      console.error('Error archiving subject:', error);
    }
  };

  return (
    <div className="sectionlist-container">
      <h1 className="sectionlist-title">Subjects</h1>
      <div className="sectionlist-search-filter-container">
        <SubjectsSearchFilter 
          handleSearch={handleSearch} 
          handleApplyFilters={handleApplyFilters} 
        />
      </div>
      <div style={{ display: 'flex', justifyContent: 'center', margin: '20px 0' }}>
        <button className="subjects-add-subject-button" onClick={startAdding}>
          + Add New Subject
        </button>
      </div>
      <table className="attendance-table">
        <thead>
          <tr>
            <th>#</th>
            <th>Subject Name</th>
            <th>Grade Level</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {filteredSubjects.length > 0 ? (
            filteredSubjects.map((subject, index) => (
              <React.Fragment key={subject.subject_id}>
                <tr>
                  <td>{index + 1}</td>
                  <td>{subject.subject_name}</td>
                  <td>Grade {subject.grade_level}</td>
                  <td>{subject.status.charAt(0).toUpperCase() + subject.status.slice(1)}</td>
                  <td>
                    <button className="sectionlist-view-button" onClick={() => handleViewClick(subject)}>View</button>
                  </td>
                </tr>
                {selectedSubject && selectedSubject.subject_id === subject.subject_id && showDetails && (
                  <tr>
                    <td colSpan="5">
                      <div className="sectionlist-details">
                        <table>
                          <tbody>
                            <tr>
                              <th>Subject ID:</th>
                              <td>{selectedSubject.subject_id}</td>
                            </tr>
                            <tr>
                              <th>Subject Name:</th>
                              <td>{selectedSubject.subject_name}</td>
                            </tr>
                            <tr>
                              <th>Grade Level:</th>
                              <td>Grade {selectedSubject.grade_level}</td>
                            </tr>
                            <tr>
                              <th>Status:</th>
                              <td>{selectedSubject.status}</td>
                            </tr>
                            <tr>
                              <th>Description:</th>
                              <td>{selectedSubject.description || 'No description provided'}</td>
                            </tr>
                          </tbody>
                        </table>
                        <div className="subject-actions">
                          <button className="edit-button" onClick={handleEdit}>
                            Edit
                          </button>
                          <button 
                            className="delete-button" 
                            onClick={handleDelete} 
                            disabled={selectedSubject?.sy_status === 'active'} 
                          >
                            Archive
                          </button>
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))
          ) : (
            <tr>
              <td colSpan="5" style={{ textAlign: 'center' }}>No subjects available.</td>
            </tr>
          )}
        </tbody>
      </table>

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

export default TestSubjectsPage;
