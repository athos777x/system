import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import '../TeacherPagesCss/SectionList.css';

function SectionList() {
  const [sections, setSections] = useState([]);
  const [filteredSections, setFilteredSections] = useState([]);
  const [selectedSectionId, setSelectedSectionId] = useState(null);
  const [sectionDetails, setSectionDetails] = useState({});
  const [activeSchoolYear, setActiveSchoolYear] = useState(null);
  const [filters, setFilters] = useState({
    searchTerm: '',
    grade: '',
    section: ''
  });
  const [studentsByGender, setStudentsByGender] = useState({ boys: [], girls: [] });
  const [showStudents, setShowStudents] = useState(false);

  const fetchActiveSchoolYear = useCallback(async () => {
    try {
      const response = await axios.get('http://localhost:3001/school-years/active');
      setActiveSchoolYear(response.data.school_year_id);
      return response.data;
    } catch (error) {
      console.error('There was an error fetching the active school year!', error);
      return null;
    }
  }, []);

  const fetchSections = useCallback(async (schoolYearId) => {
    try {
      const response = await axios.get('http://localhost:3001/sections', {
        params: { schoolYearId }
      });
      console.log('Fetched sections:', response.data);
      setSections(response.data);
      setFilteredSections(response.data);
    } catch (error) {
      console.error('There was an error fetching the sections!', error);
    }
  }, []);

  const getUniqueGrades = (sections) => {
    const grades = sections.map(section => section.grade_level);
    return [...new Set(grades)];
  };

  useEffect(() => {
    async function loadSections() {
      const activeYear = await fetchActiveSchoolYear();
      if (activeYear) {
        fetchSections(activeYear.school_year_id);
      }
    }
    loadSections();
  }, [fetchActiveSchoolYear, fetchSections]);

  const applyFilters = (updatedFilters) => {
    console.log('Updated filters:', updatedFilters);
    let filtered = sections;

    if (updatedFilters.searchTerm) {
      filtered = filtered.filter(section =>
        section.section_name.toLowerCase().includes(updatedFilters.searchTerm.toLowerCase())
      );
    }

    if (updatedFilters.grade) {
      filtered = filtered.filter(section => section.grade_level === updatedFilters.grade);
    }

    if (updatedFilters.section) {
      filtered = filtered.filter(section => section.section_id === parseInt(updatedFilters.section));
    }

    console.log('Filtered sections:', filtered);
    setFilteredSections(filtered);
  };

  const handleSearch = (event) => {
    const searchTerm = event.target.value;
    setFilters(prev => ({ ...prev, searchTerm }));
    applyFilters({ ...filters, searchTerm });
  };

  const handleGradeChange = (event) => {
    const grade = event.target.value;
    setFilters(prev => ({ ...prev, grade }));
  };

  const handleSectionChange = (event) => {
    const section = event.target.value;
    setFilters(prev => ({ ...prev, section }));
  };

  const handleViewClick = async (sectionId) => {
    if (selectedSectionId === sectionId) {
      setSelectedSectionId(null);
      setSectionDetails({});
      setShowStudents(false);
    } else {
      setSelectedSectionId(sectionId);
      fetchSectionDetails(sectionId);
      fetchStudentsByGender(sectionId);
    }
  };

  const fetchSectionDetails = async (sectionId) => {
    try {
      const response = await axios.get(`http://localhost:3001/sections/${sectionId}`);
      console.log('Fetched section details:', response.data);
      setSectionDetails(response.data);
    } catch (error) {
      console.error('There was an error fetching the section details!', error);
    }
  };

  const fetchStudentsByGender = async (sectionId) => {
    try {
      const response = await axios.get(`http://localhost:3001/sections/${sectionId}/students`);
      const boys = response.data.boys;
      const girls = response.data.girls;
      setStudentsByGender({ boys, girls });
      setShowStudents(true);
    } catch (error) {
      console.error('There was an error fetching the students by gender!', error);
    }
  };

  const renderStudentsTable = () => (
    <table className="section-list-students-table">
      <thead>
        <tr>
          <th style={{ textAlign: 'left', width: '80px', paddingRight: '16px' }}>LRN</th>
          <th style={{ textAlign: 'left' }}>Boys</th>
          <th style={{ textAlign: 'left', width: '80px', paddingRight: '16px' }}>LRN</th>
          <th style={{ textAlign: 'left' }}>Girls</th>
        </tr>
      </thead>
      <tbody>
        {Array.from({ length: Math.max(studentsByGender.boys.length, studentsByGender.girls.length) }).map((_, index) => (
          <tr key={index}>
            <td style={{ textAlign: 'left', width: '80px', paddingRight: '16px' }}>
              {studentsByGender.boys[index] ? studentsByGender.boys[index].lrn : ''}
            </td>
            <td style={{ textAlign: 'left', paddingLeft: '8px' }}>
              {studentsByGender.boys[index] ? 
                `${studentsByGender.boys[index].lastname}, ${studentsByGender.boys[index].firstname} ${studentsByGender.boys[index].middlename || ''}` : ''}
            </td>
            <td style={{ textAlign: 'left', width: '80px', paddingRight: '16px' }}>
              {studentsByGender.girls[index] ? studentsByGender.girls[index].lrn : ''}
            </td>
            <td style={{ textAlign: 'left', paddingLeft: '8px' }}>
              {studentsByGender.girls[index] ? 
                `${studentsByGender.girls[index].lastname}, ${studentsByGender.girls[index].firstname} ${studentsByGender.girls[index].middlename || ''}` : ''}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );

  return (
    <div className="section-list-container">
      <div className="section-list-header">
        <h1 className="section-list-title">Class List</h1>
      </div>

      <div className="section-list-filters">
        <div className="section-list-search">
          <input
            type="text"
            placeholder="Search sections..."
            value={filters.searchTerm}
            onChange={handleSearch}
          />
        </div>
        <select
          className="section-list-select"
          value={filters.grade}
          onChange={handleGradeChange}
        >
          <option value="">All Grades</option>
          {getUniqueGrades(sections).map(grade => (
            <option key={grade} value={grade}>Grade {grade}</option>
          ))}
        </select>
        <select
          className="section-list-select"
          value={filters.section}
          onChange={handleSectionChange}
        >
          <option value="">All Sections</option>
          {sections.map(section => (
            <option key={section.section_id} value={section.section_id}>
              {section.section_name}
            </option>
          ))}
        </select>
        <button onClick={() => applyFilters(filters)}>Filter</button>
      </div>

      <div className="section-list-table-container">
        <table className="section-list-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Section Name</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredSections.length > 0 ? (
              filteredSections.map((section, index) => (
                <React.Fragment key={section.section_id}>
                  <tr>
                    <td>{section.section_id}</td>
                    <td>{section.section_name}</td>
                    <td>
                      <span className={`status-${section.status.toLowerCase()}`}>
                        {section.status.charAt(0).toUpperCase() + section.status.slice(1)}
                      </span>
                    </td>
                    <td>
                      <button 
                        className="section-list-btn"
                        onClick={() => handleViewClick(section.section_id)}
                      >
                        View
                      </button>
                    </td>
                  </tr>
                  {selectedSectionId === section.section_id && sectionDetails.section_id && (
                    <tr>
                      <td colSpan="4">
                        <div className="section-list-details">
                          <table>
                            <tbody>
                              <tr>
                                <th>Section ID:</th>
                                <td>{sectionDetails.section_id}</td>
                              </tr>
                              <tr>
                                <th>Section Name:</th>
                                <td>{sectionDetails.section_name}</td>
                              </tr>
                              <tr>
                                <th>Grade Level:</th>
                                <td>{sectionDetails.grade_level}</td>
                              </tr>
                              <tr>
                                <th>Status:</th>
                                <td>
                                  <span className={`status-${sectionDetails.status.toLowerCase()}`}>
                                    {sectionDetails.status}
                                  </span>
                                </td>
                              </tr>
                              <tr>
                                <th>Max Capacity:</th>
                                <td>{sectionDetails.max_capacity}</td>
                              </tr>
                              <tr>
                                <th>School Year:</th>
                                <td>{sectionDetails.school_year}</td>
                              </tr>
                            </tbody>
                          </table>
                          {showStudents && (
                            <div className="section-list-students-container">
                              <h3>Class List</h3>
                              {renderStudentsTable()}
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))
            ) : (
              <tr>
                <td colSpan="4" style={{ textAlign: 'center' }}>No sections available.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default SectionList;
