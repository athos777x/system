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
    if (!roleName) {
      console.error('Role name is not set');
      return;
    }
  
    try {
      const userId = localStorage.getItem('userId');  // Get the user ID from localStorage
      console.log('userId:', userId);  // Check if userId is available in the console
      console.log('Current role name:', roleName);  // Log the role name
  
      if (!userId) {
        console.error('User ID is missing');
        return;  // Exit if no userId is available
      }
  
      await axios.put('http://localhost:3001/update-subjects-status');  // Update subjects status
  
      const endpoint = roleName === 'subject_coordinator'
        ? `http://localhost:3001/subjects/by-coordinator/${userId}`  // Pass userId in the URL
        : `http://localhost:3001/subjects`;  // Regular subjects
      
      console.log('Using endpoint:', endpoint);  // Log the endpoint being used
  
      // Fetch subjects with parameters
      const requestParams = {
        ...filters,
        searchTerm: filters.searchTerm.trim(),
      };
      
      console.log('Request params being sent to API:', requestParams);
      
      const response = await axios.get(endpoint, {
        params: requestParams,
      });
      
      console.log('API Response data count:', response.data.length);
      console.log('Sample subject data:', response.data.length > 0 ? response.data[0] : 'No subjects');  // Log the API response data structure
      
      // Apply local filtering in case the backend filters aren't working
      let filteredData = response.data;
      
      // Apply search term filter locally
      if (filters.searchTerm && filters.searchTerm.trim() !== '') {
        const searchTerm = filters.searchTerm.trim().toLowerCase();
        filteredData = filteredData.filter(subject => 
          subject.subject_name.toLowerCase().includes(searchTerm)
        );
      }
      
      // Apply grade filter locally if specified
      if (filters.grade && filters.grade.trim() !== '') {
        console.log('Filtering by grade level:', filters.grade);
        console.log('Subject grade levels in data:', filteredData.map(subject => ({
          subject_name: subject.subject_name,
          grade_level: subject.grade_level,
          subject_type: subject.subject_type,
          elective: subject.elective, // Check for 'Y'/'N' format
          grade_level_type: typeof subject.grade_level
        })));
        
        // Convert both to strings for comparison to handle number/string type mismatch
        filteredData = filteredData.filter(subject => {
          // Skip grade filtering for elective subjects (which might have null grade_level)
          const isElective = subject.subject_type === 'elective' || subject.elective === 'Y';
          
          if (isElective) {
            return true; // Keep all elective subjects regardless of grade
          }
          
          return subject.grade_level !== null && 
                 subject.grade_level !== undefined && 
                 String(subject.grade_level) === String(filters.grade);
        });
        
        console.log('After grade filtering, remaining subjects:', filteredData.length);
      }
      
      // Apply school_year filter locally if specified
      if (filters.school_year && filters.school_year.trim() !== '') {
        filteredData = filteredData.filter(subject => 
          subject.school_year === filters.school_year
        );
      }
      
      // Remove local archive_status filtering since the backend now handles it
      // No need to filter by archive_status locally anymore
      
      console.log('After local filtering:', filteredData);
      
      // Check if filters were applied locally
      const usingLocalFilters = 
        (filters.searchTerm && filters.searchTerm.trim() !== '') ||
        (filters.grade && filters.grade.trim() !== '') ||
        (filters.school_year && filters.school_year.trim() !== '');
      
      setSubjects(response.data); // Keep the original data
      
      // Apply sorting to the filtered data
      const sortedData = sortSubjects(filteredData);
      setFilteredSubjects(sortedData); // Set sorted filtered data for display
    } catch (error) {
      console.error('Error fetching subjects:', error);
      
      // Enhanced error logging
      if (error.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        console.error('Error response data:', error.response.data);
        console.error('Error response status:', error.response.status);
        console.error('Error response headers:', error.response.headers);
      } else if (error.request) {
        // The request was made but no response was received
        console.error('Error request:', error.request);
      } else {
        // Something happened in setting up the request that triggered an Error
        console.error('Error message:', error.message);
      }
    }
  }, [filters, roleName]);
  
  
  
  
  

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
    console.log('Search term changed:', searchTerm);
    const newFilters = { 
      ...filters, 
      searchTerm
    };
    setFilters(newFilters);
    setPendingFilters(newFilters);
  };
  

  const applyFilters = useCallback((newFilters) => {
    console.log('Applying filters:', newFilters);
    setFilters(newFilters);
    setPendingFilters(newFilters); // Keep pendingFilters in sync with filters
  }, []);

  useEffect(() => {
    if (roleName) {
      console.log('Filters changed, fetching subjects with filters:', filters);
      fetchSubjects();
    }
  }, [roleName, filters, fetchSubjects]);
  
  // No need for the additional sorting effect since sorting is applied in fetchSubjects

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

  const [isSaving, setIsSaving] = useState(false);

  const saveNewSubject = async () => {
    if (isSaving) return; // prevent double click
    setIsSaving(true);
  
    try {
      const subjectData = {
        ...newSubjectData,
        grade_level: newSubjectData.subject_type === 'elective' ? null : newSubjectData.grade_level
      };
  
      console.log('Subject data being sent:', subjectData); // Check the data here
  
      if (isEditing) {
        // Use different endpoints based on role
        if (roleName === 'subject_coordinator') {
          // For subject coordinators, use the restricted edit endpoint
          const userId = localStorage.getItem('userId');
          await axios.put(`http://localhost:3001/subjects/coordinator-edit/${selectedSubject.subject_id}`, {
            userId,
            description: subjectData.description,
            status: subjectData.status
          });
        } else {
          // For other roles, use the standard endpoint
          await axios.put(`http://localhost:3001/subjects/${selectedSubject.subject_id}`, subjectData);
        }
      } else {
        await axios.post('http://localhost:3001/subjects', subjectData);
      }
  
      fetchSubjects();
      setShowModal(false);
      setSelectedSubject(null);
      setShowDetails(false);
      setErrors({});
    } catch (error) {
      console.error('Error saving subject:', error);
      if (error.response?.data?.error === 'Subject already exists') {
        setErrors({ subject_name: 'Subject already exists' });
      } else if (error.response?.data?.error === 'Not authorized to edit this subject') {
        setErrors({ general: 'You are not authorized to edit this subject' });
      } else {
        setErrors({ general: 'Error saving subject' });
      }
    } finally {
      setIsSaving(false);
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
    const action = subject.archive_status === 'archive' ? 'unarchive' : 'archive';
    const isElective = subject.subject_type === 'elective' || subject.elective === 'Y';
    
    try {
      console.log('Archive button clicked:', {
        subject_id: subject.subject_id,
        elective_id: subject.elective_id || null,
        action: action,
        current_archive_status: subject.archive_status,
        hasSchedule: subject.hasSched,
        isDisabled: subject?.archive_status !== 'archive' && subject?.hasSched === "1",
        subject_type: subject.subject_type || subject.elective,
        isElective: isElective,
        school_year_id: subject.school_year_id
      });
      
      // For elective subjects, the subject_id itself should be passed as elective_id
      // This is because the backend expects regular subjects and electives to be handled differently
      const elective_id = isElective ? subject.subject_id : (subject.elective_id || null);
      
      try {
        // First try with the standard endpoint
        console.log('Request being sent:', {
          url: `http://localhost:3001/subjects/${subject.subject_id}/archive`,
          method: 'PUT',
          data: {
            elective_id: elective_id,
            action: action,
            school_year_id: subject.school_year_id 
          }
        });
    
        const response = await axios.put(`http://localhost:3001/subjects/${subject.subject_id}/archive`, {
          elective_id: elective_id, 
          action: action,
          school_year_id: subject.school_year_id 
        });
        
        console.log('Archive response:', response.data);
      } catch (err) {
        if (err.response && err.response.data.error === 'No matching school year found') {
          // If the standard endpoint fails with school year error, try direct update
          console.log('Falling back to direct archive status update');
          
          // This is a backup approach that directly updates just the archive_status
          const directUpdateResponse = await axios.put(`http://localhost:3001/subjects/${subject.subject_id}`, {
            archive_status: action === 'archive' ? 'archive' : 'unarchive'
          });
          
          console.log('Direct update response:', directUpdateResponse.data);
        } else {
          // If it's not the school year error, rethrow for the outer catch block
          throw err;
        }
      }
  
      // Use a slight delay to ensure the DB has time to update before fetching
      setTimeout(() => {
        fetchSubjects();
        setSelectedSubject(null);
        setShowDetails(false);
      }, 300);
      
    } catch (error) {
      console.error(`Error archiving subject:`, error);
      if (error.response) {
        console.error('Error response data:', error.response.data);
        console.error('Error response status:', error.response.status);
        alert(`Failed to ${action} subject: ${error.response.data.error || 'Unknown error'}`);
      } else if (error.request) {
        console.error('No response received:', error.request);
        alert('No response received from server. Check your network connection.');
      } else {
        console.error('Error message:', error.message);
        alert(`Error: ${error.message}`);
      }
    }
  };

  const closeModal = () => {
    setShowModal(false);
    setErrors({});
  };

  const sortSubjects = useCallback((subjects) => {
    if (!subjects) return [];
    
    const sortedSubjects = [...subjects];
    
    // Sort by type (Regular first), then by grade level (ascending), then alphabetically
    return sortedSubjects.sort((a, b) => {
      // First sort by type: regular subjects first, then elective
      const typeA = a.subject_type === 'elective' || a.elective === 'Y' ? 1 : 0; // 0 for regular (comes first), 1 for elective
      const typeB = b.subject_type === 'elective' || b.elective === 'Y' ? 1 : 0; // 0 for regular (comes first), 1 for elective
      
      // Compare types (regular first, then elective)
      if (typeA !== typeB) return typeA - typeB;
      
      // For same type, sort by grade level (ascending)
      // Handle null or undefined grade levels (electives)
      const gradeA = a.grade_level === null || a.grade_level === undefined ? 999 : parseInt(a.grade_level);
      const gradeB = b.grade_level === null || b.grade_level === undefined ? 999 : parseInt(b.grade_level);
      
      const gradeCompare = gradeA - gradeB;
      if (gradeCompare !== 0) return gradeCompare;
      
      // For same grade, sort alphabetically
      return a.subject_name.localeCompare(b.subject_name);
    });
  }, []);

  return (
    <div className="subjects-management-container">
      <div className="subjects-management-header">
        <h1 className="subjects-management-title">Subject Management</h1>
        {roleName !== 'subject_coordinator' && (
          <button className="subjects-management-btn-add" onClick={startAdding}>
            Add Subject
          </button>
        )}
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
          <button onClick={() => {
            console.log('Filter button clicked, applying filters:', pendingFilters);
            applyFilters(pendingFilters);
          }}>
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
              <th>Type</th>
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
                      {subject.subject_type === 'elective' || subject.elective === 'Y' 
                        ? <span className="subject-type subject-type-elective">Elective</span> 
                        : <span className="subject-type subject-type-regular">Regular</span>}
                    </td>
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
                            disabled={subject?.archive_status !== 'archive' && subject?.hasSched === "1"}
                            title={subject?.archive_status !== 'archive' && subject?.hasSched === "1" ? 
                              "Cannot archive a subject with an active schedule" : 
                              (subject?.archive_status === 'archive' ? "Unarchive this subject" : "Archive this subject")}
                            style={{
                              opacity: subject?.archive_status !== 'archive' && subject?.hasSched === "1" ? 0.5 : 1, 
                              cursor: subject?.archive_status !== 'archive' && subject?.hasSched === "1" ? 'not-allowed' : 'pointer'
                            }}
                          >
                            {subject?.archive_status === 'archive' ? 'Unarchive' : 'Archive'}
                          </button>                    
                        )}
                      </div>
                    </td>
                  </tr>
                  {selectedSubject && selectedSubject.subject_id === subject.subject_id && selectedSubject.elective_id === subject.elective_id && showDetails && (
                    <tr key={`details-${subject.subject_id}-${subject.elective_id || ''}`}>
                      <td colSpan="5">
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
                              {roleName === 'subject_coordinator' && selectedSubject.school_year && (
                                <tr>
                                  <th>School Year:</th>
                                  <td>{selectedSubject.school_year}</td>
                                </tr>
                              )}
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
                  disabled={isEditing && roleName === 'subject_coordinator'}
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
                  disabled={isEditing && roleName === 'subject_coordinator'}
                >
                  <option value="regular">Regular Subject</option>
                  <option value="elective">Elective Subject</option>
                </select>
              </div>

              {newSubjectData.subject_type === 'elective' && (
                <div className="subjects-management-form-group">
                  <label>Capacity</label>
                  <input
                    name="max_capacity"
                    type="number"
                    value={newSubjectData.max_capacity}
                    onChange={handleAddChange}
                    required={newSubjectData.subject_type === 'elective'}
                    disabled={isEditing && roleName === 'subject_coordinator'}
                  >
                  </input>
                </div>
              )}

              {newSubjectData.subject_type === 'regular' && (
                <div className="subjects-management-form-group">
                  <label>Grade Level</label>
                  <select
                    name="grade_level"
                    value={newSubjectData.grade_level}
                    onChange={handleAddChange}
                    required={newSubjectData.subject_type === 'regular'}
                    disabled={isEditing && roleName === 'subject_coordinator'}
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
              
              {errors.general && (
                <div className="error-message" style={{ color: 'red', fontSize: '0.8em', marginTop: '5px', marginBottom: '10px' }}>
                  {errors.general}
                </div>
              )}

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
