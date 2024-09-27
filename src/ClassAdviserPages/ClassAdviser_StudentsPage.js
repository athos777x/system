import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import SearchFilter from '../RoleSearchFilters/SearchFilter';
import axios from 'axios';
import '../CssPage/Principal_StudentsPage.css';

function ClassAdviser_StudentsPage() {
  const [students, setStudents] = useState([]);
  const [filteredStudents, setFilteredStudents] = useState([]);
  const [selectedStudentId, setSelectedStudentId] = useState(null);
  const [filters, setFilters] = useState({
    searchTerm: '',
    school_year: '',
    grade: '',
    section: '',
    status: ''
  });

  const navigate = useNavigate();

  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async (appliedFilters = {}) => {
    try {
      const response = await axios.get('http://localhost:3001/students', {
        params: appliedFilters
      });
      const sortedStudents = response.data.sort((a, b) => a.firstname.localeCompare(b.firstname));
      setStudents(sortedStudents);
      setFilteredStudents(sortedStudents);
      console.log('Fetched students:', sortedStudents);
    } catch (error) {
      console.error('Error fetching students:', error);
    }
  };

  const handleSearch = (searchTerm) => {
    setFilters(prevFilters => {
      const updatedFilters = { ...prevFilters, searchTerm };
      applyFilters(updatedFilters);
      return updatedFilters;
    });
  };

  const handleFilterChange = (type, value) => {
    setFilters(prevFilters => {
      const updatedFilters = { ...prevFilters, [type]: value };
      return updatedFilters;
    });
  };

  const applyFilters = (updatedFilters) => {
    let filtered = students;

    if (updatedFilters.school_year) {
      filtered = filtered.filter(student => String(student.school_year) === updatedFilters.school_year);
    }
    if (updatedFilters.grade) {
      filtered = filtered.filter(student => student.current_yr_lvl === updatedFilters.grade);
    }
    if (updatedFilters.section) {
      filtered = filtered.filter(student => student.section_id == updatedFilters.section);
    }
    if (updatedFilters.status) {
      filtered = filtered.filter(student => student.student_status === updatedFilters.status);
    }
    if (updatedFilters.searchTerm) {
      filtered = filtered.filter(student =>
        student.firstname.toLowerCase().includes(updatedFilters.searchTerm.toLowerCase()) ||
        student.lastname.toLowerCase().includes(updatedFilters.searchTerm.toLowerCase())
      );
    }

    setFilteredStudents(filtered);
    console.log('Filtered students:', filtered);
  };

  const handleApplyFilters = () => {
    console.log('Applying filters:', filters);
    fetchStudents(filters);
  };

  const toggleStudentDetails = (studentId) => {
    setSelectedStudentId(selectedStudentId === studentId ? null : studentId);
  };

  const formatDate = (isoString) => {
    const date = new Date(isoString);
    return date.toLocaleDateString();
  };

  return (
    <div className="students-container">
      <h1 className="students-title">Students</h1>
      <div className="students-search-filter-container">
        <SearchFilter
          handleSearch={handleSearch}
          handleFilter={handleFilterChange}
          handleApplyFilters={handleApplyFilters}
        />
      </div>
      <div className="students-list">
        {filteredStudents.map((student, index) => (
          <div key={student.student_id} className="students-student-item-container" onClick={() => toggleStudentDetails(student.student_id)}>
            <div className="students-student-item">
              <p className="students-student-name">
                {index + 1}. {student.firstname} {student.middlename && `${student.middlename[0]}.`} {student.lastname}
              </p>
              <span className="students-student-info">Grade {student.current_yr_lvl} - {student.active_status === 'active' ? 'active' : 'inactive'}</span>
              <button className="students-view-button" onClick={() => navigate(`/students/${student.student_id}/details`)}>View</button>
            </div>
            {selectedStudentId === student.student_id && (
              <div className="students-student-details">
                <table>
                  <tbody>
                    <tr>
                      <th>Last Name:</th>
                      <td>{student.lastname}</td>
                    </tr>
                    <tr>
                      <th>First Name:</th>
                      <td>{student.firstname}</td>
                    </tr>
                    <tr>
                      <th>Middle Name:</th>
                      <td>{student.middlename}</td>
                    </tr>
                    <tr>
                      <th>Current Year Level:</th>
                      <td>{student.current_yr_lvl}</td>
                    </tr>
                    <tr>
                      <th>Birthdate:</th>
                      <td>{formatDate(student.birthdate)}</td>
                    </tr>
                    <tr>
                      <th>Gender:</th>
                      <td>{student.gender}</td>
                    </tr>
                    <tr>
                      <th>Age:</th>
                      <td>{student.age}</td>
                    </tr>
                    <tr>
                      <th>Home Address:</th>
                      <td>{student.home_address}</td>
                    </tr>
                    <tr>
                      <th>Barangay:</th>
                      <td>{student.barangay}</td>
                    </tr>
                    <tr>
                      <th>City/Municipality:</th>
                      <td>{student.city_municipality}</td>
                    </tr>
                    <tr>
                      <th>Province:</th>
                      <td>{student.province}</td>
                    </tr>
                    <tr>
                      <th>Contact Number:</th>
                      <td>{student.contact_number}</td>
                    </tr>
                    <tr>
                      <th>Email Address:</th>
                      <td>{student.email_address}</td>
                    </tr>
                    <tr>
                      <th>Mother's Name:</th>
                      <td>{student.mother_name}</td>
                    </tr>
                    <tr>
                      <th>Father's Name:</th>
                      <td>{student.father_name}</td>
                    </tr>
                    <tr>
                      <th>Parent Address:</th>
                      <td>{student.parent_address}</td>
                    </tr>
                    <tr>
                      <th>Father's Occupation:</th>
                      <td>{student.father_occupation}</td>
                    </tr>
                    <tr>
                      <th>Mother's Occupation:</th>
                      <td>{student.mother_occupation}</td>
                    </tr>
                    <tr>
                      <th>Annual Household Income:</th>
                      <td>{student.annual_hshld_income}</td>
                    </tr>
                    <tr>
                      <th>Number of Siblings:</th>
                      <td>{student.number_of_siblings}</td>
                    </tr>
                    <tr>
                      <th>Father's Education Level:</th>
                      <td>{student.father_educ_lvl}</td>
                    </tr>
                    <tr>
                      <th>Mother's Education Level:</th>
                      <td>{student.mother_educ_lvl}</td>
                    </tr>
                    <tr>
                      <th>Father's Contact Number:</th>
                      <td>{student.father_contact_number}</td>
                    </tr>
                    <tr>
                      <th>Mother's Contact Number:</th>
                      <td>{student.mother_contact_number}</td>
                    </tr>
                    <tr>
                      <th>Status:</th>
                      <td>{student.active_status === 'active' ? 'active' : 'inactive'}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default ClassAdviser_StudentsPage;
