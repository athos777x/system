import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import SearchFilter from '../RoleSearchFilters/SearchFilter';
import axios from 'axios';
import '../RegistrarPagesCss/Registrar_StudentsPage.css';

function Registrar_TeacherPage() {
  const [students, setStudents] = useState([]);
  const [filteredStudents, setFilteredStudents] = useState([]);
  const [isAdding, setIsAdding] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [filters, setFilters] = useState({
    searchTerm: '', // Retaining only searchTerm for name filtering
  });
  const [newStudentData, setNewStudentData] = useState({
    lastname: '',
    middlename: '',
    firstname: '',
    current_yr_lvl: '',
    birthdate: '',
    gender: '',
    age: '',
    home_address: '',
    barangay: '', 
    city_municipality: '',
    province: '',
    contact_number: '',
    email_address: '',
    mother_name: '',
    father_name: '',
    parent_address: '',
    father_occupation: '',
    mother_occupation: '',
    annual_hshld_income: '',
    number_of_siblings: '',
    father_educ_lvl: '',
    mother_educ_lvl: '',
    father_contact_number: '',
    mother_contact_number: '',
    emergency_number: '',
    status: 'active',
    archive_status: 'unarchive', // Default value
    section_id: ''
  });

  const navigate = useNavigate();

  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async (appliedFilters = {}) => {
    try {
      console.log('Applied filters:', appliedFilters);
      const response = await axios.get('http://localhost:3001/students', {
        params: appliedFilters
      });
      const sortedStudents = response.data.sort((a, b) => a.firstname.localeCompare(b.firstname));
      setStudents(sortedStudents);
      setFilteredStudents(sortedStudents);
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

  const applyFilters = (updatedFilters) => {
    let filtered = students;
    if (updatedFilters.searchTerm) {
      filtered = filtered.filter(student =>
        student.firstname.toLowerCase().includes(updatedFilters.searchTerm.toLowerCase()) ||
        student.lastname.toLowerCase().includes(updatedFilters.searchTerm.toLowerCase())
      );
    }
    setFilteredStudents(filtered);
  };

  const handleApplyFilters = () => {
    console.log('Applying filters:', filters);
    fetchStudents(filters);
  };

  const startAdding = () => {
    setIsAdding(true);
    setNewStudentData({
      lastname: '',
      middlename: '',
      firstname: '',
      current_yr_lvl: '',
      birthdate: '',
      gender: '',
      age: '',
      home_address: '',
      barangay: '', 
      city_municipality: '',
      province: '',
      contact_number: '',
      email_address: '',
      mother_name: '',
      father_name: '',
      parent_address: '',
      father_occupation: '',
      mother_occupation: '',
      annual_hshld_income: '',
      number_of_siblings: '',
      father_educ_lvl: '',
      mother_educ_lvl: '',
      father_contact_number: '',  
      mother_contact_number: '',
      emergency_number: '',
      status: 'active',
      active_status: 'unarchive', // Default value
      section_id: '',
      user_id: ''
    });
    setShowModal(true);
  };

  const handleAddChange = (e) => {
    const { name, value } = e.target;
    setNewStudentData((prevState) => ({
      ...prevState,
      [name]: value
    }));
  };

  const saveNewSection = async () => {
    try {
      const correctedStudentData = {
        ...newStudentData,
        status: newStudentData.status || 'active',
        active_status: newStudentData.archive_status || 'unarchive',
        section_id: newStudentData.section_id,
        user_id: newStudentData.user_id || '1'
      };
      const response = await axios.post('http://localhost:3001/students', correctedStudentData);
      if (response.status === 201) {
        await fetchStudents();
        setIsAdding(false);
        setShowModal(false);
      } else {
        alert('Failed to add student. Please try again.');
      }
    } catch (error) {
      console.error('Error adding student:', error);
      alert('There was an error adding the student. Please try again.');
    }
  };

  const cancelAdding = () => {
    setNewStudentData({
      lastname: '',
      middlename: '',
      firstname: '',
      current_yr_lvl: '',
      birthdate: '',
      gender: '',
      age: '',
      home_address: '',
      barangay: '',
      city_municipality: '',
      province: '',
      contact_number: '',
      email_address: '',
      mother_name: '',
      father_name: '',
      parent_address: '',
      father_occupation: '',
      mother_occupation: '',
      annual_hshld_income: '',
      number_of_siblings: '',
      father_educ_lvl: '',
      mother_educ_lvl: '',
      father_contact_number: '',
      mother_contact_number: '',
      emergency_number: '',
      status: 'active',
      active_status: 'unarchive',
      section_id: '',
      user_id: ''  
    });
    setShowModal(false);
  };

  return (
    <div className="students-container">
      <h1 className="students-title">Teacher</h1>
      <div className="students-search-filter-container">
        <SearchFilter
          handleSearch={handleSearch}
          handleApplyFilters={handleApplyFilters}
        />
      </div>
      <div className="students-add-student-button-container">
        <button className="students-add-student-button" onClick={startAdding}>Add New Teacher</button>
      </div>
      <div className="students-list">
        {filteredStudents.map((student, index) => (
          <div key={student.student_id} className="students-student-item-container">
            <div className="students-student-item">
              <p className="students-student-name">
                {index + 1}. {student.firstname} {student.middlename && `${student.middlename[0]}.`} {student.lastname}
              </p>
              <span className="students-student-info">Grade {student.current_yr_lvl} - {student.active_status}</span>
            </div>
          </div>
        ))}
      </div>
      {showModal && (
        <div className="section-modal">
          <div className="section-modal-content">
            <h2>Add New Student</h2>
            <label>
              Lastname:
              <input
                type="text"
                name="lastname"
                value={newStudentData.lastname}
                onChange={handleAddChange}
              />
            </label>
            <label>
              Middlename:
              <input
                type="text"
                name="middlename"
                value={newStudentData.middlename}
                onChange={handleAddChange}
              />
            </label>
            <label>
              Firstname:
              <input
                type="text"
                name="firstname"
                value={newStudentData.firstname}
                onChange={handleAddChange}
              />
            </label>
            {/* Additional form fields here */}
            <div className="section-button-group">
              <button className="section-save-button" onClick={saveNewSection}>Save</button>
              <button className="section-cancel-button" onClick={cancelAdding}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Registrar_TeacherPage;
