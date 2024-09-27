import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import SubjectsSearchFilter from '../RoleSearchFilters/SubjectsSearchFilter';
import '../CssPage/Principal_SubjectsPage.css';

function Principal_SubjectsPage() {
  const [subjects, setSubjects] = useState([]);
  const [filteredSubjects, setFilteredSubjects] = useState([]);
  const [selectedSubjectId, setSelectedSubjectId] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editFormData, setEditFormData] = useState({});
  const [filters, setFilters] = useState({
    searchTerm: '',
    school_year: '',
    grade: '',
    archive_status: 'unarchive'
  });
  const [grades] = useState(['7', '8', '9', '10']); // Example grades
  const [schoolYears, setSchoolYears] = useState([]);
  const [isAdding, setIsAdding] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [newSubjectData, setNewSubjectData] = useState({
    subject_name: '',
    grade_level: '7',
    status: 'active',
    grading_criteria: '',
    description: '',
    school_year: '',
    archive_status: 'unarchive' // Default value
  });

  const fetchSubjects = useCallback(async () => {
    try {
      const response = await axios.get('http://localhost:3001/subjects', {
        params: filters
      });
      setSubjects(response.data);
      setFilteredSubjects(response.data);
    } catch (error) {
      console.error('Error fetching subjects:', error);
    }
  }, [filters]);

  const fetchSchoolYears = useCallback(async () => {
    try {
      const response = await axios.get('http://localhost:3001/api/school_years');
      setSchoolYears(response.data.map(sy => ({ id: sy.school_year_id, year: sy.school_year })));
    } catch (error) {
      console.error('Error fetching school years:', error);
    }
  }, []);

  useEffect(() => {
    fetchSubjects();
    fetchSchoolYears();
  }, [fetchSubjects, fetchSchoolYears]);

  const handleSearch = (searchTerm) => {
    setFilters(prevFilters => ({ ...prevFilters, searchTerm }));
  };

  const handleApplyFilters = (newFilters) => {
    setFilters(newFilters);
  };

  const toggleSubjectDetails = (subjectId) => {
    if (selectedSubjectId === subjectId) {
      setSelectedSubjectId(null);
      setIsEditing(false);
    } else {
      setSelectedSubjectId(subjectId);
      setIsEditing(false);
      const subject = subjects.find(sub => sub.subject_id === subjectId);
      setEditFormData(subject);
    }
  };

  const startEditing = (subjectId) => {
    setSelectedSubjectId(subjectId);
    setIsEditing(true);
    const subject = subjects.find(sub => sub.subject_id === subjectId);
    setEditFormData(subject);
  };

  const handleEditChange = (event) => {
    const { name, value } = event.target;

    // Map school year name to its ID
    if (name === 'school_year_id') {
      const selectedSchoolYear = schoolYears.find(sy => sy.year === value);
      setEditFormData(prevFormData => ({
        ...prevFormData,
        [name]: selectedSchoolYear ? selectedSchoolYear.id : value
      }));
    } else {
      setEditFormData(prevFormData => ({
        ...prevFormData,
        [name]: value
      }));
    }
  };

  const saveChanges = async () => {
    try {
      await axios.put(`http://localhost:3001/subjects/${selectedSubjectId}`, editFormData);
      fetchSubjects();  // Refresh the subjects list after saving
      setIsEditing(false);
    } catch (error) {
      console.error('Error saving subject details:', error);
    }
  };

  const cancelEditing = () => {
    setIsEditing(false);
    const subject = subjects.find(sub => sub.subject_id === selectedSubjectId);
    setEditFormData(subject);
  };

  const archiveSubject = async (subjectId) => {
    try {
      await axios.put(`http://localhost:3001/subjects/${subjectId}/archive`, {
        status: 'inactive',
        archive_status: 'archive'
      });
      fetchSubjects();  // Refresh the subjects list after archiving
    } catch (error) {
      console.error('Error archiving subject:', error);
    }
  };

  const unarchiveSubject = async (subjectId) => {
    try {
      await axios.put(`http://localhost:3001/subjects/${subjectId}/archive`, {
        status: 'active',
        archive_status: 'unarchive'
      });
      fetchSubjects();  // Refresh the subjects list after unarchiving
    } catch (error) {
      console.error('Error unarchiving subject:', error);
    }
  };

  const startAdding = () => {
    setIsAdding(true);
    setNewSubjectData({
      subject_name: '',
      grade_level: '7',
      status: 'active',
      grading_criteria: '',
      description: '',
      school_year: schoolYears.length > 0 ? schoolYears[0].year : '',
      archive_status: 'unarchive' // Default value
    });
    setShowModal(true);
  };

  const handleAddChange = (event) => {
    const { name, value } = event.target;
    setNewSubjectData(prevFormData => ({
      ...prevFormData,
      [name]: value
    }));
  };

  const saveNewSubject = async () => {
    try {
      await axios.post('http://localhost:3001/subjects', newSubjectData);
      fetchSubjects();
      setIsAdding(false);
      setShowModal(false);
    } catch (error) {
      console.error('Error adding new subject:', error);
    }
  };

  const cancelAdding = () => {
    setIsAdding(false);
    setShowModal(false);
  };

  return (
    <div className="subjects-container">
      <h1 className="subjects-title">Subjects</h1>
      <div className="subjects-search-filter-container">
        <SubjectsSearchFilter
          handleSearch={handleSearch}
          handleApplyFilters={handleApplyFilters}
        />
      </div>
      <div className="subjects-add-subject-button-container">
        <button className="subjects-add-subject-button" onClick={startAdding}>Add New Subject</button>
      </div>
      <div className="subjects-list">
        {filteredSubjects.map((subject, index) => (
          <div key={subject.subject_id} className="subject-item-container">
            <div className="subject-item">
              <p className="subject-name">{index + 1}. {subject.subject_name}</p>
              <span className="subject-info">Grade {subject.grade_level} - {subject.status.charAt(0).toUpperCase() + subject.status.slice(1)}</span>
              <div className="subject-actions">
                <button className="subject-view-button" onClick={() => toggleSubjectDetails(subject.subject_id)}>View</button>
                <button className="subject-edit-button" onClick={() => startEditing(subject.subject_id)}>Edit</button>
                {subject.archive_status === 'unarchive' ? (
                  <button className="subject-archive-button" onClick={() => archiveSubject(subject.subject_id)}>Archive</button>
                ) : (
                  <button className="subject-archive-button" onClick={() => unarchiveSubject(subject.subject_id)}>Unarchive</button>
                )}
              </div>
            </div>
            {selectedSubjectId === subject.subject_id && (
              <div className="subject-details">
                <table>
                  <tbody>
                    <tr>
                      <th>Subject Name:</th>
                      <td>
                        {isEditing ? (
                          <input
                            type="text"
                            name="subject_name"
                            value={editFormData.subject_name}
                            onChange={handleEditChange}
                          />
                        ) : (
                          subject.subject_name
                        )}
                      </td>
                    </tr>
                    <tr>
                      <th>Grade Level:</th>
                      <td>
                        {isEditing ? (
                          <select
                            name="grade_level"
                            value={editFormData.grade_level}
                            onChange={handleEditChange}
                          >
                            <option value="">Select Grade</option>
                            {grades.map((grade, index) => (
                              <option key={index} value={grade}>{grade}</option>
                            ))}
                          </select>
                        ) : (
                          subject.grade_level
                        )}
                      </td>
                    </tr>
                    <tr>
                      <th>Status:</th>
                      <td>
                        {isEditing ? (
                          <select
                            name="status"
                            value={editFormData.status}
                            onChange={handleEditChange}
                          >
                            <option value="active">Active</option>
                            <option value="inactive">Inactive</option>
                          </select>
                        ) : (
                          subject.status.charAt(0).toUpperCase() + subject.status.slice(1)
                        )}
                      </td>
                    </tr>
                    <tr>
                      <th>Grading Criteria:</th>
                      <td>
                        {isEditing ? (
                          <input
                            type="text"
                            name="grading_criteria"
                            value={editFormData.grading_criteria}
                            onChange={handleEditChange}
                          />
                        ) : (
                          subject.grading_criteria
                        )}
                      </td>
                    </tr>
                    <tr>
                      <th>Description:</th>
                      <td>
                        {isEditing ? (
                          <textarea
                            name="description"
                            value={editFormData.description}
                            onChange={handleEditChange}
                          />
                        ) : (
                          subject.description
                        )}
                      </td>
                    </tr>
                    <tr>
                      <th>School Year:</th>
                      <td>
                        {isEditing ? (
                          <span>{subject.school_year}</span>
                        ) : (
                          subject.school_year
                        )}
                      </td>
                    </tr>
                  </tbody>
                </table>
                {isEditing && (
                  <div className="subject-edit-buttons">
                    <button className="subject-save-button" onClick={saveChanges}>Save</button>
                    <button className="subject-cancel-button" onClick={cancelEditing}>Cancel</button>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {showModal && (
        <div className="subject-modal">
          <div className="subject-modal-content">
            <h2>Add New Subject</h2>
            <label>
              Subject Name:
              <input
                type="text"
                name="subject_name"
                value={newSubjectData.subject_name}
                onChange={handleAddChange}
              />
            </label>
            <label>
              Grade Level:
              <select
                name="grade_level"
                value={newSubjectData.grade_level}
                onChange={handleAddChange}
              >
                <option value="7">7</option>
                <option value="8">8</option>
                <option value="9">9</option>
                <option value="10">10</option>
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
              Grading Criteria:
              <input
                type="text"
                name="grading_criteria"
                value={newSubjectData.grading_criteria}
                onChange={handleAddChange}
              />
            </label>
            <label>
              Description:
              <textarea
                name="description"
                value={newSubjectData.description}
                onChange={handleAddChange}
              />
            </label>
            <label>
              School Year:
              <select
                name="school_year"
                value={newSubjectData.school_year}
                onChange={handleAddChange}
              >
                {schoolYears.map((year) => (
                  <option key={year.id} value={year.year}>
                    {year.year}
                  </option>
                ))}
              </select>
            </label>
            <div className="subject-button-group">
              <button className="subject-save-button" onClick={saveNewSubject}>Save</button>
              <button className="subject-cancel-button" onClick={cancelAdding}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Principal_SubjectsPage;
