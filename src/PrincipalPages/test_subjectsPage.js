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
  }, [filters]);
  

  const handleSearch = (searchTerm) => {
    setFilters((prevFilters) => ({ ...prevFilters, searchTerm }));
  };

  const applyFilters = (newFilters) => {
    setFilters(newFilters);
    fetchSubjects(); // Fetch subjects after updating filters
  };
  
  

  const handleViewClick = (subject) => {
    setSelectedSubject(selectedSubject?.subject_id === subject.subject_id ? null : subject);
    setShowDetails(!showDetails);
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

  const handleEdit = (subject) => {
    setSelectedSubject(subject);
    setShowModal(true);
    setIsEditing(true);
    setNewSubjectData(subject);
  };

  const handleDelete = async (subject) => {
    try {
      await axios.put(`http://localhost:3001/subjects/${subject.subject_id}/archive`);
      fetchSubjects();
      setSelectedSubject(null);
      setShowDetails(false);
    } catch (error) {
      console.error('Error archiving subject:', error);
    }
  };

  return (
    <div className="section-container">
      <h1 className="section-title">Subject Management</h1>
      <div className="section-search-filter-container">
        <SubjectsSearchFilter handleSearch={handleSearch} handleApplyFilters={applyFilters} />
      </div>
      <div className="section-add-section-button-container">
        <button className="section-add-section-button" onClick={startAdding}>
          Add New Subject
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
                    <button className="section-view-button" onClick={() => handleViewClick(subject)}>View</button>
                    <button className="section-edit-button" onClick={() => handleEdit(subject)}>Edit</button>
                    <button 
                      className="section-archive-button" 
                      onClick={() => handleDelete(subject)} 
                      disabled={subject?.sy_status === 'active'}
                    >
                      Archive
                    </button>
                  </td>
                </tr>
                {selectedSubject && selectedSubject.subject_id === subject.subject_id && showDetails && (
                  <tr>
                    <td colSpan="5">
                      <div className="section-details">
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
                        {/* Buttons moved to main row */}
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
        <div className="section-modal">
          <div className="section-modal-content">
            <h2>{isEditing ? 'Edit Subject' : 'Add New Subject'}</h2>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                saveNewSubject();
              }}
            >
              <label>
                Subject Name:
                <input
                  type="text"
                  name="subject_name"
                  value={newSubjectData.subject_name}
                  onChange={handleAddChange}
                  required
                />
              </label>
              <label>
                Grade Level:
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
              </label>
              <label>
                Status:
                <select
                  name="status"
                  value={newSubjectData.status}
                  onChange={handleAddChange}
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </label>
              <label>
                Description:
                <textarea
                  name="description"
                  value={newSubjectData.description}
                  onChange={handleAddChange}
                />
              </label>
              <div className="section-button-group">
                <button className="section-cancel-button" onClick={cancelAdding}>
                  Cancel
                </button>
                <button className="section-save-button" type="submit">{isEditing ? 'Update' : 'Save'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default TestSubjectsPage;
