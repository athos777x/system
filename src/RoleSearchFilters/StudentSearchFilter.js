import React, { useState, useEffect } from 'react';

function StudentSearchFilter({ students, fetchStudents, setFilteredStudents, setCurrentPage, schoolYears, filteredSections }) {
  const [filters, setFilters] = useState({
    searchID: '',
    searchTerm: '',
    school_year: '',
    grade: '',
    section: ''
  });

  // Store temporary filters without applying immediately
  const [tempFilters, setTempFilters] = useState({ ...filters });

  // Filter sections based on the selected grade
  const [availableSections, setAvailableSections] = useState(filteredSections);

  const handleSearch = (type, value) => {
    setTempFilters(prevFilters => ({
      ...prevFilters,
      [type]: value
    }));
  };

  const handleFilterChange = (type, value) => {
    setTempFilters(prevFilters => ({
      ...prevFilters,
      [type]: value,
      ...(type === 'grade' ? { section: '' } : {}) // ✅ Reset section when grade changes
    }));
  };

  // ✅ Update sections when grade is selected
  useEffect(() => {
    if (tempFilters.grade) {
      // ✅ Get sections based on selected grade level
      const sectionsForGrade = filteredSections.filter(section => String(section.grade_level) === String(tempFilters.grade));
      setAvailableSections(sectionsForGrade);
    } else {
      setAvailableSections([]); // ✅ Clear sections when no grade is selected
    }
  }, [tempFilters.grade, filteredSections]);

  // ✅ Prevent loading students until filters are applied
  const applyFilters = () => {
    let filtered = students;

    if (!filters.searchID && !filters.searchTerm && !filters.school_year && !filters.grade && !filters.section) {
      setFilteredStudents([]); // ✅ Clear student list when no filters are applied
      return;
    }

    if (filters.searchID) {
      filtered = filtered.filter(student => String(student.student_id) === filters.searchID); // ✅ Exact match
    }
    if (filters.school_year) {
      filtered = filtered.filter(student => String(student.school_year) === filters.school_year);
    }
    if (filters.grade) {
      filtered = filtered.filter(student => String(student.current_yr_lvl) === String(filters.grade));
    }
    if (filters.section) {
      filtered = filtered.filter(student => String(student.section_name) === filters.section);
    }
    if (filters.searchTerm) {
      filtered = filtered.filter(student => {
        const firstName = student.firstname ? student.firstname.toLowerCase() : "";
        const lastName = student.lastname ? student.lastname.toLowerCase() : "";
        return firstName.includes(filters.searchTerm.toLowerCase()) || 
               lastName.includes(filters.searchTerm.toLowerCase());
      });
    }

    setFilteredStudents(filtered);
    setCurrentPage(1); // ✅ Reset to first page when filters are applied
  };

  const handleApplyFilters = () => {
    console.log('Applying filters:', tempFilters);
  
    // ✅ Prevent fetching if no filters are applied
    const hasFilters = Object.values(tempFilters).some(value => value !== '');
    
    if (hasFilters) {
      setFilters(tempFilters); // ✅ Apply tempFilters when button is clicked
      fetchStudents(tempFilters); // ✅ Fetch students with applied filters
      applyFilters();
    } else {
      setFilteredStudents([]); // ✅ Clear student list if no filters are set
    }
  };

  return (
    <div className="student-mgmt-filters">
      {/* Search by Student ID */}
      <div className="student-mgmt-search">
        <input
          type="text"
          name="searchID"
          placeholder="Search by ID No..."
          value={tempFilters.searchID}
          onChange={(e) => handleSearch('searchID', e.target.value)}
        />
      </div>

      {/* Search by Student Name */}
      <div className="student-mgmt-search">
        <input
          type="text"
          name="searchTerm"
          placeholder="Search by student name..."
          value={tempFilters.searchTerm}
          onChange={(e) => handleSearch('searchTerm', e.target.value)}
        />
      </div>

      {/* Filters */}
      <div className="student-mgmt-filters-group">
        <select name="school_year" value={tempFilters.school_year} onChange={(e) => handleFilterChange('school_year', e.target.value)}>
          <option value="">Select School Year</option>
          {schoolYears.map((year) => (
            <option key={year.school_year_id} value={year.school_year}>
              {year.school_year}
            </option>
          ))}
        </select>

        <select name="grade" value={tempFilters.grade} onChange={(e) => handleFilterChange('grade', e.target.value)}>
          <option value="">Select Grade Level</option>
          {[7, 8, 9, 10].map((grade) => (
            <option key={grade} value={grade}>Grade {grade}</option>
          ))}
        </select>

        <select 
          name="section" 
          value={tempFilters.section} 
          onChange={(e) => handleFilterChange('section', e.target.value)}
          disabled={!tempFilters.grade} // ✅ Disable section dropdown until grade is selected
        >
          <option value="">Select Section</option>
          {availableSections.map((section) => (
            <option key={section.section_id} value={section.section_name}>
              {section.section_name}
            </option>
          ))}
        </select>
      </div>

      {/* Apply Filters Button */}
      <button onClick={handleApplyFilters}>Filter</button>
    </div>
  );
}

export default StudentSearchFilter;
