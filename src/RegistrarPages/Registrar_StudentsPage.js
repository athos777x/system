import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import SearchFilter from '../RoleSearchFilters/SearchFilter';
import axios from 'axios';
import '../RegistrarPagesCss/Registrar_StudentsPage.css';

function Registrar_StudentsPage() {
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
  const [isAdding, setIsAdding] = useState(false);
  const [showModal, setShowModal] = useState(false);
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
      archive_status: 'unarchive' // Default value
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
      filtered = filtered.filter(student => student.section_id === updatedFilters.section);
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
      archive_status: 'unarchive' // Default value
    });
    setShowModal(true);
  };

  const handleAddChange = (event) => {
    const { name, value } = event.target;
    console.log(`Changing ${name} to ${value}`); // Debug log
  
    setNewStudentData(prevFormData => ({
      ...prevFormData,
      [name]: value
    }));
  };
  

  const saveNewSection = async () => {
    try {
      // Ensure correct data structure
      const correctedStudentData = {
        ...newStudentData,
        city_municipality: newStudentData.city_municipality, // Confirming correct field name
      };
  
      // Log data before sending it to the server
      console.log('Corrected student data to be sent:', correctedStudentData);
  
      // Send the POST request to save the new student
      const response = await axios.post('http://localhost:3000/students', correctedStudentData);
  
      // Check if the student was added successfully (status 201)
      if (response.status === 201) {
        console.log('Student added successfully:', response.data);
  
        // Refresh the student list to show the newly added student
        await fetchStudents(); 
  
        // Close the modal and reset the form
        setIsAdding(false);
        setShowModal(false);
  
        // Optionally clear the form data
        setNewStudentData({
          lastname: '', middlename: '', firstname: '', current_yr_lvl: '', birthdate: '', gender: '', age: '',
          home_address: '', barangay: '', city_municipality: '', province: '', contact_number: '', email_address: '',
          mother_name: '', father_name: '', parent_address: '', father_occupation: '', mother_occupation: '',
          annual_hshld_income: '', number_of_siblings: '', father_educ_lvl: '', mother_educ_lvl: '',
          father_contact_number: '', mother_contact_number: '', emergency_number: '', status: 'active',
          archive_status: 'unarchive'
        });
      } else {
        // Log and display the error if status is not 201
        console.error('Failed to add student. Response:', response);
        alert('Failed to add student. Please try again.');
      }
    } catch (error) {
      // Enhanced error logging
      if (error.response) {
        console.error('Error response:', error.response.data);
        alert(`Error adding student: ${error.response.data.error || 'Unknown error'}. Please check the input fields and try again.`);
      } else if (error.request) {
        console.error('No response received:', error.request);
        alert('No response from the server. Please check your connection and try again.');
      } else {
        console.error('Error in request setup:', error.message);
        alert('There was an error setting up the request. Please try again.');
      }
    }
  };
  
  
  
  
  
  
  const cancelAdding = () => {
    setIsAdding(false);
    setShowModal(false);
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
      <div className="students-add-student-button-container">
        <button className="students-add-student-button" onClick={startAdding}>Add New Student</button>
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
      {showModal && (
        <div className="section-modal">
          <div className="section-modal-content">
            <h2>Add New Student</h2>
            <label>
              lastname:
              <input
                type="text"
                name="lastname"
                value={newStudentData.lastname}
                onChange={handleAddChange}
              />
            </label>
            <label>
              middlename:
              <input
                type="text"
                name="middlename"
                value={newStudentData.middlename}
                onChange={handleAddChange}              
              />
            </label>
            <label>
              firstname:
              <input
                type="text"
                name="firstname"
                value={newStudentData.firstname}
                onChange={handleAddChange}
              />
            </label>
            <label>
              current_yr_lvl:
              <input
                type="text"
                name="current_yr_lvl"
                value={newStudentData.current_yr_lvl}
                onChange={handleAddChange}
              />
            </label>
            <label>
              birthdate:
              <input
                type="date"
                name="birthdate"
                value={newStudentData.birthdate}
                onChange={handleAddChange}
              />
            </label>
            <label>
              gender:
              <input
                type="text"
                name="gender"
                value={newStudentData.gender}
                onChange={handleAddChange}
              />
            </label>
            <label>
              age:
              <input
                type="text"
                name="age"
                value={newStudentData.age}
                onChange={handleAddChange}
              />
            </label>
            <label>
              home_address:
              <input
                type="text"
                name="home_address"
                value={newStudentData.home_address}
                onChange={handleAddChange}
              />
            </label>
            <label>
              barangay:
              <input
                type="text"
                name="barangay"
                value={newStudentData.barangay}
                onChange={handleAddChange}
              />
            </label>
            <label>
              city_municipality:
              <input
                type="text"
                name="city_municipality"
                value={newStudentData.city_municipality}
                onChange={handleAddChange}
              />
            </label>
            <label>
              province:
              <input
                type="text"
                name="province"
                value={newStudentData.province}
                onChange={handleAddChange}
              />
            </label>
            <label>
              contact_number:
              <input
                type="text"
                name="contact_number"
                value={newStudentData.contact_number}
                onChange={handleAddChange}
              />
            </label>
            <label>
              email_address:
              <input
                type="email"
                name="email_address"
                value={newStudentData.email_address}
                onChange={handleAddChange}
              />
            </label>
            <label>
              mother_name:
              <input
                type="text"
                name="mother_name"
                value={newStudentData.mother_name}
                onChange={handleAddChange}
              />
            </label>  
            <label>
              father_name:
              <input
                type="text"
                name="father_name"
                value={newStudentData.father_name}
                onChange={handleAddChange}
              />
            </label>
            <label>
              parent_address:
              <input
                type="text"
                name="parent_address"
                value={newStudentData.parent_address}
                onChange={handleAddChange}
              />
            </label>
            <label>
              father_occupation:
              <input
                type="text"
                name="father_occupation"
                value={newStudentData.father_occupation}
                onChange={handleAddChange}
              />
            </label>
            <label>
              mother_occupation:
              <input
                type="text"
                name="mother_occupation"
                value={newStudentData.mother_occupation}
                onChange={handleAddChange}
              />
            </label>
            <label>
              annual_hshld_income:
              <input
                type="text"
                name="annual_hshld_income"
                value={newStudentData.annual_hshld_income}
                onChange={handleAddChange}
              />
            </label>
            <label>
              current_yr_lvl:
              <input
                type="text"
                name="current_yr_lvl"
                value={newStudentData.current_yr_lvl}
                onChange={handleAddChange}
              />
            </label>
            <label>
              number_of_siblings:
              <input
                type="text"
                name="number_of_siblings"
                value={newStudentData.number_of_siblings}
                onChange={handleAddChange}
              />
            </label>
            <label>
              father_educ_lvl:
              <input
                type="text"
                name="father_educ_lvl"
                value={newStudentData.father_educ_lvl}
                onChange={handleAddChange}
              />
            </label>
            <label>
              mother_educ_lvl:
              <input
                type="text"
                name="mother_educ_lvl"
                value={newStudentData.mother_educ_lvl}
                onChange={handleAddChange}
              />
            </label>
            <label>
              father_contact_number:
              <input
                type="text"
                name="father_contact_number"
                value={newStudentData.father_contact_number}
                onChange={handleAddChange}
              />
            </label>
            <label>
              mother_contact_number:
              <input
                type="text"
                name="mother_contact_number"
                value={newStudentData.mother_contact_number}
                onChange={handleAddChange}
              />
            </label>
            <label>
              emergency_number:
              <input
                type="number"
                name="emergency_number"
                value={newStudentData.emergency_number}
                onChange={handleAddChange}
              />
            </label>
            <label>
              Status:
              <select
                name="status"
                value={newStudentData.status}
                onChange={handleAddChange}
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </label>
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

export default Registrar_StudentsPage;
