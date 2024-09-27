import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import SectionSearchFilter from '../RoleSearchFilters/SectionListSearchFilter';
import '../CssPage/Principal_SectionListPage.css';

function Principal_SectionListPage() {
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

  const handleApplyFilters = (filters) => {
    setFilters(filters);
    applyFilters(filters);
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
    <table className="sectionlist-students-table">
      <thead>
        <tr>
          <th>Boys</th>
          <th>Girls</th>
        </tr>
      </thead>
      <tbody>
        {Array.from({ length: Math.max(studentsByGender.boys.length, studentsByGender.girls.length) }).map((_, index) => (
          <tr key={index}>
            <td>{studentsByGender.boys[index] ? `${index + 1}. ${studentsByGender.boys[index].firstname} ${studentsByGender.boys[index].lastname}` : ''}</td>
            <td>{studentsByGender.girls[index] ? `${index + 1}. ${studentsByGender.girls[index].firstname} ${studentsByGender.girls[index].lastname}` : ''}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );

  return (
    <div className="sectionlist-container">
      <h1 className="sectionlist-title">Section List</h1>
      <div className="sectionlist-search-filter-container">
        <SectionSearchFilter
          handleApplyFilters={handleApplyFilters}
          grades={getUniqueGrades(sections)}
          sections={sections}
        />
      </div>
      <div className="sectionlist-list">
        {filteredSections.length > 0 ? (
          filteredSections.map((section, index) => (
            <div key={section.section_id} className="sectionlist-item-container">
              <div className="sectionlist-item">
                <p className="sectionlist-name">
                  {index + 1}. Section {section.section_name}
                </p>
                <span className="sectionlist-info">Grade: {section.grade_level} - {section.status.charAt(0).toUpperCase() + section.status.slice(1)}</span>
                <div className="sectionlist-actions">
                  <button className="sectionlist-view-button" onClick={() => handleViewClick(section.section_id)}>View</button>
                </div>
              </div>
              {selectedSectionId === section.section_id && sectionDetails.section_id && (
                <div className="sectionlist-details">
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
                        <td>{sectionDetails.status}</td>
                      </tr>
                      <tr>
                        <th>Max Capacity:</th>
                        <td>{sectionDetails.max_capacity}</td>
                      </tr>
                      <tr>
                        <th>School Year:</th>
                        <td>{sectionDetails.school_year}</td>
                      </tr>
                      {/* Add other details as needed */}
                    </tbody>
                  </table>
                </div>
              )}
              {showStudents && selectedSectionId === section.section_id && (
                <div className="sectionlist-students-container">
                  {renderStudentsTable()}
                </div>
              )}
            </div>
          ))
        ) : (
          <p>No sections available.</p>
        )}
      </div>
    </div>
  );
}

export default Principal_SectionListPage;
