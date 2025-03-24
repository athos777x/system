import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import '../TeacherPagesCss/SubjectsManagement.css';

function SubjectsManagement() {
  const [subjects, setSubjects] = useState([]);
  const [filteredSubjects, setFilteredSubjects] = useState([]);
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [schoolYears, setSchoolYears] = useState([]);
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
    subject_type: 'regular'
  });
  const [showDetails, setShowDetails] = useState(false);
  const [pendingFilters, setPendingFilters] = useState({ ...filters });
  const [errors, setErrors] = useState({});
  const [roleName, setRoleName] = useState('');

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

  useEffect(() => {
    const userId = localStorage.getItem('userId'); // Retrieve userId from localStorage
    if (userId) {
      console.log(`Retrieved userId from localStorage: ${userId}`); // Debugging log
      fetchUserRole(userId);
    } else {
      console.error('No userId found in localStorage');
    }
  }, []);

  const fetchSubjects = useCallback(async () => {
    try {
      await axios.put('http://localhost:3001/update-subjects-status');
      const response = await axios.get('http://localhost:3001/subjects', { 
        params: {
          ...filters,
          searchTerm: filters.searchTerm.trim()
        } 
      });
      setSubjects(response.data);
      setFilteredSubjects(response.data);
    } catch (error) {
      console.error('Error fetching subjects:', error);
    }
  }, [filters]);
  
  
  

  const fetchSchoolYears = async () => {
    try {
      const response = await axios.get('http://localhost:3001/api/school_years');
      setSchoolYears(response.data);
    } catch (error) {
      console.error('Error fetching school years:', error);
    }
  };
  
  useEffect(() => {
    fetchSchoolYears();
  }, []);

  const handleSearch = (searchTerm) => {
    const newFilters = { 
      ...filters, 
      searchTerm
    };
    setFilters(newFilters);
    setPendingFilters(newFilters);
  };
  

  const applyFilters = useCallback((newFilters) => {
    setFilters(newFilters);
  }, []);

  useEffect(() => {
      fetchSubjects();
  }, [filters, fetchSubjects]);

  useEffect(() => {
    fetchSchoolYears();
  }, []);

  const handleViewClick = (subject) => {
    if (
        selectedSubject &&
        selectedSubject.subject_id === subject.subject_id &&
        selectedSubject.elective_id === subject.elective_id
    ) {
        // If the same subject is clicked again, close details
        setSelectedSubject(null);
        setShowDetails(false);
    } else {
        // Otherwise, show the selected subject details
        setSelectedSubject(subject);
        setShowDetails(true);
    }
};




  const startAdding = () => {
    setShowModal(true);
    setIsEditing(false);
    setErrors({});
    setNewSubjectData({
      subject_name: '',
      grade_level: '7',
      status: 'active',
      description: '',
      archive_status: 'unarchive',
      subject_type: 'regular'
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
      // Prepare the data to be sent
      const subjectData = {
        ...newSubjectData,
        // Set grade_level to null for elective subjects
        grade_level: newSubjectData.subject_type === 'elective' ? null : newSubjectData.grade_level
      };

      if (isEditing) {
        await axios.put(`http://localhost:3001/subjects/${selectedSubject.subject_id}`, subjectData);
      } else {
        await axios.post('http://localhost:3001/subjects', subjectData);
      }
      fetchSubjects();
      setShowModal(false);
      setSelectedSubject(null);
      setShowDetails(false);
      setErrors({});
    } catch (error) {
      console.error(`Error ${isEditing ? 'updating' : 'adding'} subject:`, error);
      if (error.response?.data?.error === 'Subject already exists') {
        setErrors({ subject_name: `Subject already exists${isEditing ? ' in another record' : ''}` });
      } else {
        setErrors({ subject_name: `Error ${isEditing ? 'updating' : 'adding'} subject` });
      }
    }
  };

  const handleEdit = (subject) => {
    setSelectedSubject(subject);
    setShowModal(true);
    setIsEditing(true);
    setErrors({});
    setNewSubjectData(subject);
  };

  const handleDelete = async (subject) => {
    try {
      const action = subject.archive_status === 'archive' ? 'unarchive' : 'archive';
  
      await axios.put(`http://localhost:3001/subjects/${subject.subject_id}/archive`, {
        elective_id: subject.elective_id, 
        action: action, 
      });
  
      fetchSubjects();
      setSelectedSubject(null);
      setShowDetails(false);
    } catch (error) {
      console.error(`Error archiving subject:`, error);
    }
  };

  const closeModal = () => {
    setShowModal(false);
    setErrors({});
  };

  return (
    <div className="subjects-management-container">
      <div className="subjects-management-header">
        <h1 className="subjects-management-title">Subject Management</h1>
        <button className="subjects-management-btn-add" onClick={startAdding}>
          Add Subject
        </button>
      </div>

      <div className="subjects-management-filters">
        <div className="subjects-management-search">
          <input
            type="text"
            placeholder="Search subjects..."
            value={filters.searchTerm}
            onChange={(e) => handleSearch(e.target.value)}
          />
        </div>
        <div className="subjects-management-filters-group">
          <select
            value={pendingFilters.grade}
            onChange={(e) => setPendingFilters((prev) => ({ ...prev, grade: e.target.value }))}
          >
            <option value="">All Grades</option>
            {grades.map(grade => (
              <option key={grade} value={grade}>Grade {grade}</option>
            ))}
          </select>
          <select
            value={pendingFilters.school_year}
            onChange={(e) => setPendingFilters((prev) => ({ ...prev, school_year: e.target.value }))}
          >
            <option value="">All School Years</option>
            {schoolYears.map((year) => (
              <option key={year.school_year_id} value={year.school_year}>
                {year.school_year}
              </option>
            ))}
          </select>
          <select
            value={pendingFilters.archive_status}
            onChange={(e) => setPendingFilters((prev) => ({ ...prev, archive_status: e.target.value }))}
          >
            <option value="unarchive">Unarchived</option>
            <option value="archive">Archived</option>
          </select>
          <button onClick={() => applyFilters(pendingFilters)}>
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" width="16" height="16">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
            </svg>
            Filter
          </button>
        </div>
      </div>

      <div className="subjects-management-table-container">
        <table className="subjects-management-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Subject Name</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredSubjects.length > 0 ? (
              filteredSubjects.map((subject) => (
                <React.Fragment key={`${subject.subject_id}-${subject.elective_id || ''}`}>
                  <tr>
                    <td>{subject.subject_id}</td>
                    <td>{subject.subject_name}</td>
                    <td>
                      <span className={`status-${subject.status.toLowerCase()}`}>
                        {subject.status.charAt(0).toUpperCase() + subject.status.slice(1)}
                      </span>
                    </td>
                    <td>
                      <div className="subjects-management-actions">
                        <button 
                          className="subjects-management-btn subjects-management-btn-view" 
                          onClick={() => handleViewClick(subject)}
                        >
                          View
                        </button>
                        <button 
                          className="subjects-management-btn subjects-management-btn-edit" 
                          onClick={() => handleEdit(subject)}
                        >
                          Edit
                        </button>
                        {roleName === 'principal' && (
                        <button 
                        className={`subjects-management-btn ${subject?.archive_status === 'archive' ? 'subjects-management-btn-view' : 'subjects-management-btn-archive'}`}
                          onClick={() => handleDelete(subject)}
                          disabled={subject?.archive_status !== 'archive' && subject?.hasSched == "1"}
                        >
                          {subject?.archive_status === 'archive' ? 'Unarchive' : 'Archive'}
                        </button>
                        )}
                      </div>
                    </td>
                  </tr>
                  {selectedSubject && selectedSubject.subject_id === subject.subject_id && selectedSubject.elective_id === subject.elective_id && showDetails && (
                    <tr key={`details-${subject.subject_id}-${subject.elective_id || ''}`}>
                      <td colSpan="4">
                        <div className="subjects-management-details">
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
                                <th>Subject Type:</th>
                                <td>{selectedSubject.subject_type === 'elective' ? 'Elective Subject' : 'Regular Subject'}</td>
                              </tr>
                              {selectedSubject.subject_type !== 'elective' && (
                                <tr>
                                  <th>Grade Level:</th>
                                  <td>Grade {selectedSubject.grade_level}</td>
                                </tr>
                              )}
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
                <td colSpan="4" style={{ textAlign: 'center' }}>No subjects available.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="subjects-management-modal">
          <div className="subjects-management-modal-content">
            <h2>{isEditing ? 'Edit Subject' : 'Add New Subject'}</h2>
            <form onSubmit={(e) => {
              e.preventDefault();
              saveNewSubject();
            }}>
              <div className="subjects-management-form-group">
                <label>Subject Name</label>
                <input
                  type="text"
                  name="subject_name"
                  value={newSubjectData.subject_name}
                  onChange={handleAddChange}
                  required
                />
                {errors.subject_name && (
                  <div className="error-message" style={{ color: 'red', fontSize: '0.8em', marginTop: '5px' }}>
                    {errors.subject_name}
                  </div>
                )}
              </div>

              <div className="subjects-management-form-group">
                <label>Subject Type</label>
                <select
                  name="subject_type"
                  value={newSubjectData.subject_type}
                  onChange={handleAddChange}
                >
                  <option value="regular">Regular Subject</option>
                  <option value="elective">Elective Subject</option>
                </select>
              </div>

              {newSubjectData.subject_type === 'regular' && (
                <div className="subjects-management-form-group">
                  <label>Grade Level</label>
                  <select
                    name="grade_level"
                    value={newSubjectData.grade_level}
                    onChange={handleAddChange}
                    required={newSubjectData.subject_type === 'regular'}
                  >
                    {grades.map((grade) => (
                      <option key={grade} value={grade}>
                        Grade {grade}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="subjects-management-form-group">
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

              <div className="subjects-management-form-group">
                <label>Description</label>
                <textarea
                  name="description"
                  value={newSubjectData.description}
                  onChange={handleAddChange}
                />
              </div>

              <div className="subjects-management-modal-actions">
                <button 
                  type="submit"
                  className="subjects-management-btn subjects-management-btn-edit"
                >
                  {isEditing ? 'Save' : 'Add'}
                </button>
                <button 
                  type="button"
                  className="subjects-management-btn subjects-management-btn-archive" 
                  onClick={closeModal}
                >
                  Cancel
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
