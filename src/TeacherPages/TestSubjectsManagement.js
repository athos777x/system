import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import '../TeacherPagesCss/TestSubjects.css';

function TestSubjectsManagement() {
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
      await axios.put('http://localhost:3001/update-subjects-status');
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
    fetchSubjects();
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
        await axios.put(`http://localhost:3001/subjects/${selectedSubject.subject_id}`, newSubjectData);
      } else {
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
    <div className="subjects-mgmt-container">
      <div className="subjects-mgmt-header">
        <h1 className="subjects-mgmt-title">Subject Management</h1>
        <button className="subjects-mgmt-btn-add" onClick={startAdding}>
          Add New Subject
        </button>
      </div>

      <div className="subjects-mgmt-filters">
        <div className="subjects-mgmt-search">
          <input
            type="text"
            placeholder="Search subjects..."
            value={filters.searchTerm}
            onChange={(e) => handleSearch(e.target.value)}
          />
        </div>
        <div className="subjects-mgmt-filters-group">
          <select
            value={filters.grade}
            onChange={(e) => applyFilters({ ...filters, grade: e.target.value })}
          >
            <option value="">All Grades</option>
            {grades.map(grade => (
              <option key={grade} value={grade}>Grade {grade}</option>
            ))}
          </select>
          <select
            value={filters.school_year}
            onChange={(e) => applyFilters({ ...filters, school_year: e.target.value })}
          >
            <option value="">All School Years</option>
            <option value="2023-2024">2023-2024</option>
            <option value="2024-2025">2024-2025</option>
          </select>
          <select
            value={filters.archive_status}
            onChange={(e) => applyFilters({ ...filters, archive_status: e.target.value })}
          >
            <option value="unarchive">Active</option>
            <option value="archive">Archived</option>
          </select>
          <button onClick={() => applyFilters(filters)}>
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" width="16" height="16">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
            </svg>
            Filter
          </button>
        </div>
      </div>

      <div className="subjects-mgmt-table-container">
        <table className="subjects-mgmt-table">
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
                    <td>
                      <span className={`status-${subject.status.toLowerCase()}`}>
                        {subject.status.charAt(0).toUpperCase() + subject.status.slice(1)}
                      </span>
                    </td>
                    <td>
                      <div className="subjects-mgmt-actions">
                        <button 
                          className="subjects-mgmt-btn subjects-mgmt-btn-view" 
                          onClick={() => handleViewClick(subject)}
                        >
                          View
                        </button>
                        <button 
                          className="subjects-mgmt-btn subjects-mgmt-btn-edit" 
                          onClick={() => handleEdit(subject)}
                        >
                          Edit
                        </button>
                        <button 
                          className="subjects-mgmt-btn subjects-mgmt-btn-archive" 
                          onClick={() => handleDelete(subject)}
                          disabled={subject?.sy_status === 'active'}
                        >
                          Archive
                        </button>
                      </div>
                    </td>
                  </tr>
                  {selectedSubject && selectedSubject.subject_id === subject.subject_id && showDetails && (
                    <tr>
                      <td colSpan="5">
                        <div className="subjects-mgmt-details">
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
      </div>

      {showModal && (
        <div className="subjects-mgmt-modal">
          <div className="subjects-mgmt-modal-content">
            <h2>{isEditing ? 'Edit Subject' : 'Add New Subject'}</h2>
            <form onSubmit={(e) => {
              e.preventDefault();
              saveNewSubject();
            }}>
              <div className="subjects-mgmt-form-group">
                <label>Subject Name</label>
                <input
                  type="text"
                  name="subject_name"
                  value={newSubjectData.subject_name}
                  onChange={handleAddChange}
                  required
                />
              </div>

              <div className="subjects-mgmt-form-group">
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

              <div className="subjects-mgmt-form-group">
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

              <div className="subjects-mgmt-form-group">
                <label>Description</label>
                <textarea
                  name="description"
                  value={newSubjectData.description}
                  onChange={handleAddChange}
                />
              </div>

              <div className="subjects-mgmt-modal-actions">
                <button 
                  type="button"
                  className="subjects-mgmt-btn subjects-mgmt-btn-archive" 
                  onClick={() => setShowModal(false)}
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="subjects-mgmt-btn subjects-mgmt-btn-edit"
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

export default TestSubjectsManagement;
