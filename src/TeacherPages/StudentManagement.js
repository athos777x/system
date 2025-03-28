import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Pagination from '../Utilities/pagination';
import axios from 'axios';
import '../TeacherPagesCss/StudentManagement.css';
import StudentSearchFilter from '../RoleSearchFilters/StudentSearchFilter';

function StudentManagement() {
  const [students, setStudents] = useState([]);
  const [filteredStudents, setFilteredStudents] = useState([]);
  const [selectedStudentId, setSelectedStudentId] = useState(null);
  const [studentsPerPage] = useState(20); // Adjust this number to set how many students per page
  const [currentPage, setCurrentPage] = useState(1);
  const [isEditing, setIsEditing] = useState(false); // Tracks edit mode
  const [editStudentData, setEditStudentData] = useState(null); // Stores the editable student data
  const [showCancelModal, setShowCancelModal] = useState(false); // Tracks cancel confirmation modal
  const [errors, setErrors] = useState({});

  const [schoolYears, setSchoolYears] = useState([]);
  const [sections, setSections] = useState([]);
  const [filteredSections, setFilteredSections] = useState([]);
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
    emergency_contactperson: '',
    status: 'active',
    archive_status: 'unarchive'
  });

  // Add this state for tab management
  const [activeTab, setActiveTab] = useState('basic');

  const navigate = useNavigate();

  // Add these validation functions after the useState declarations and before the useEffect hooks
  const validateLRN = (lrn) => {
    const lrnRegex = /^\d{1,100}$/;
    return lrnRegex.test(lrn) ? "" : "LRN must be between 1 and 100 digits";
  };

  const validateName = (name, fieldName) => {
    if (!name) return `${fieldName} is required`;
    const nameRegex = /^[A-Za-z\s\-']+$/;
    return nameRegex.test(name) ? "" : `${fieldName} should only contain letters, spaces, and hyphens`;
  };

  const validateContactNumber = (number, fieldName) => {
    if (!number) return ""; // Make it optional
    if (!number.startsWith('09')) return `${fieldName} must start with '09'`;
    const phoneRegex = /^09\d{9}$/;
    return phoneRegex.test(number) ? "" : `${fieldName} must be 11 digits starting with '09'`;
  };

  const validateEmail = (email) => {
    if (!email) return ""; // Make it optional
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email) ? "" : "Please enter a valid email address";
  };

  const validateAge = (age) => {
    const ageNum = parseInt(age);
    if (isNaN(ageNum)) return "Age must be a number";
    if (ageNum < 10 || ageNum > 20) return "Age must be between 10 and 20";
    return "";
  };

  const validateIncome = (income) => {
    if (!income) return "";  // Income is optional
    const incomeNum = parseFloat(income);
    if (isNaN(incomeNum) || incomeNum < 0) return "Please enter a valid income amount";
    return "";
  };

  useEffect(() => {
    fetchSchoolYears();
    fetchSections();
  }, []);

  useEffect(() => {
    if (filters.grade) {
      // Filter sections based on the selected grade level
      const sectionsForGrade = sections.filter(section => String(section.grade_level) === String(filters.grade));
      setFilteredSections(sectionsForGrade);
    } else {
      setFilteredSections(sections);
    }
  }, [filters.grade, sections]);

  const fetchSchoolYears = async () => {
    try {
      const response = await axios.get('http://localhost:3001/api/school_years');
      setSchoolYears(response.data);
    } catch (error) {
      console.error('Error fetching school years:', error);
    }
  };

  const fetchSections = async () => {
    try {
      const response = await axios.get('http://localhost:3001/sections');
      setSections(response.data);
      setFilteredSections(response.data);
    } catch (error) {
      console.error('Error fetching sections:', error);
    }
  };

  const fetchStudents = async (appliedFilters = {}) => {
    try {
      console.log('Original filters:', appliedFilters);
  
      // ✅ Remove empty filters before sending request
      const filteredParams = Object.fromEntries(
        Object.entries(appliedFilters).filter(([_, value]) => value !== '' && value !== null && value !== undefined)
      );
  
      console.log('Filtered params before request:', filteredParams);
  
      // ✅ Ensure `school_year` is included if missing
      if (!filteredParams.school_year) {
        try {
          const activeYearResponse = await axios.get('http://localhost:3001/active-school-year');
          filteredParams.school_year = activeYearResponse.data.school_year;
          console.log('No school year selected, using active year:', filteredParams.school_year);
        } catch (error) {
          console.error('Error fetching active school year:', error);
          return; // Stop execution if we can't get the active year
        }
      }
  
      // ✅ Make request with correct filters
      const response = await axios.get('http://localhost:3001/students', { params: filteredParams });
  
      console.log('Response from server:', response.data);
  
      // ✅ Ensure sorting by `current_yr_lvl` (highest grade first)
      const sortedStudents = response.data.sort((a, b) => b.lastname);
      setStudents(sortedStudents);
      setFilteredStudents(sortedStudents);
    } catch (error) {
      if (error.response) {
        console.error('Server responded with an error:', error.response.data);
      } else if (error.request) {
        console.error('No response received from server. Request:', error.request);
      } else {
        console.error('Error setting up request:', error.message);
      }
    }
  };
  

  const handleSearch = (searchTerm) => {
    setFilters((prevFilters) => ({ ...prevFilters, searchTerm }));
    //applyFilters({ ...filters, searchTerm });
  };

const handleFilterChange = (type, value) => {
    if (type === 'grade') {
      setFilters(prevFilters => ({
        ...prevFilters,
        [type]: value,
        section: '' // Reset section when grade changes
      }));
    } else {
    setFilters(prevFilters => ({
        ...prevFilters,
        [type]: value
    }));
    }
};

// const applyFilters = () => {
//     let filtered = students;

//     if (filters.school_year) {
//         filtered = filtered.filter(student => String(student.school_year) === filters.school_year);
//     }
//     if (filters.grade) {
//       filtered = filtered.filter(student => String(student.current_yr_lvl) === String(filters.grade));
//     }
//     if (filters.section) {
//       filtered = filtered.filter(student => String(student.section_name) === filters.section);
//     }
//     if (filters.searchTerm) {
//         filtered = filtered.filter(student => {
//             const firstName = student.firstname ? student.firstname.toLowerCase() : "";
//             const lastName = student.lastname ? student.lastname.toLowerCase() : "";
//             return firstName.includes(filters.searchTerm.toLowerCase()) || 
//                    lastName.includes(filters.searchTerm.toLowerCase());
//         });
//     }

//     setFilteredStudents(filtered);
//     setCurrentPage(1); // Reset to first page when filters are applied
// };

const handleApplyFilters = () => {
    console.log('Applying filters:', filters);
    fetchStudents(filters); // Fetch students with the current filters
};

  const startAdding = () => {
    setIsAdding(true);
    setNewStudentData({
      lrn: '',
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
      annual_income: '',
      number_of_siblings: '',
      father_educ_lvl: '',
      mother_educ_lvl: '',
      father_contact_number: '',  
      mother_contact_number: '',
      emergency_number: '',
      status: 'active',
      active_status: 'unarchive',
      user_id: ''
    });
    setShowModal(true);
  };

  // Add this function to calculate age from birthdate
  const calculateAge = (birthdate) => {
    if (!birthdate) return '';
    
    const today = new Date();
    const birthDate = new Date(birthdate);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    // If birthday hasn't occurred yet this year, subtract 1 from age
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    return age.toString();
  };

  // Update the handleAddChange function
  const handleAddChange = (e) => {
    const { name, value } = e.target;
    let newErrors = { ...errors };

    // Validate based on field name
    switch (name) {
      case 'lrn':
        newErrors[name] = validateLRN(value);
        break;
      case 'lastname':
      case 'firstname':
        newErrors[name] = validateName(value, name.charAt(0).toUpperCase() + name.slice(1));
        break;
      case 'middlename':
        if (value.trim() !== '') {
          newErrors[name] = validateName(value, 'Middle name');
        } else {
          newErrors[name] = ""; // Clear error if empty
        }
        break;
      case 'contact_number':
      case 'father_contact_number':
      case 'mother_contact_number':
      case 'emergency_number':
        if (value.trim() !== '') {
          newErrors[name] = validateContactNumber(value, name.replace(/_/g, ' ').toLowerCase());
        } else {
          newErrors[name] = ""; // Clear error if empty
        }
        break;
      case 'email_address':
        if (value.trim() !== '') {
          newErrors[name] = validateEmail(value);
        } else {
          newErrors[name] = ""; // Clear error if empty
        }
        break;
      case 'birthdate':
        if (!value) {
          newErrors[name] = "Birthdate is required";
        } else {
          const calculatedAge = calculateAge(value);
          newErrors['age'] = validateAge(calculatedAge);
          setNewStudentData(prevData => ({
            ...prevData,
            [name]: value,
            age: calculatedAge
          }));
        }
        break;
      case 'annual_income':
        if (value.trim() !== '') {
          newErrors[name] = validateIncome(value);
        } else {
          newErrors[name] = ""; // Clear error if empty
        }
        break;
      case 'current_yr_lvl':
        newErrors[name] = !value ? "Year level is required" : "";
        break;
      case 'gender':
        newErrors[name] = !value ? "Gender is required" : "";
        break;
      default:
        // All other fields are optional
        newErrors[name] = "";
    }

    setErrors(newErrors);

    // Update the form data
    if (name !== 'birthdate') {  // birthdate is handled separately above
      setNewStudentData(prevData => ({
        ...prevData,
        [name]: value
      }));
    }
  };

  const formatCapitalization = (text) => {
    if (!text) return text;
    
    // For names and places - capitalize first letter of each word
    return text.split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  };

  const saveNewStudent = async () => {
    try {
      // Only basic information fields are required
      const requiredFields = [
        "lrn", "lastname", "firstname", "current_yr_lvl", 
        "birthdate", "gender", "age"
      ];

      // Validate all fields
      let newErrors = {};
      
      // Check required fields
      requiredFields.forEach(field => {
        if (!newStudentData[field]) {
          newErrors[field] = `${field.replace(/_/g, ' ')} is required`;
        }
      });

      // Run specific validations
      if (newStudentData.lrn) newErrors.lrn = validateLRN(newStudentData.lrn);
      if (newStudentData.lastname) newErrors.lastname = validateName(newStudentData.lastname, 'Last name');
      if (newStudentData.firstname) newErrors.firstname = validateName(newStudentData.firstname, 'First name');
      if (newStudentData.middlename && newStudentData.middlename.trim() !== '') {
        newErrors.middlename = validateName(newStudentData.middlename, 'Middle name');
      }

      // Optional field validations - only validate if they have a value
      if (newStudentData.contact_number) {
        newErrors.contact_number = validateContactNumber(newStudentData.contact_number, 'Contact number');
      }
      if (newStudentData.father_contact_number) {
        newErrors.father_contact_number = validateContactNumber(newStudentData.father_contact_number, 'Father contact number');
      }
      if (newStudentData.mother_contact_number) {
        newErrors.mother_contact_number = validateContactNumber(newStudentData.mother_contact_number, 'Mother contact number');
      }
      if (newStudentData.emergency_number) {
        newErrors.emergency_number = validateContactNumber(newStudentData.emergency_number, 'Emergency number');
      }
      if (newStudentData.email_address) {
        newErrors.email_address = validateEmail(newStudentData.email_address);
      }
      if (newStudentData.age) {
        newErrors.age = validateAge(newStudentData.age);
      }
      if (newStudentData.annual_income) {
        newErrors.annual_income = validateIncome(newStudentData.annual_income);
      }

      // Filter out empty error messages
      newErrors = Object.fromEntries(
        Object.entries(newErrors).filter(([_, value]) => value !== "")
      );

      // If there are validation errors, show them and prevent submission
      if (Object.keys(newErrors).length > 0) {
        setErrors(newErrors);
        alert("Please fix all validation errors before submitting");
        return;
      }
      
      // Create a clean data object with only the fields needed by the backend
      const cleanData = {
        lrn: newStudentData.lrn,
        lastname: formatCapitalization(newStudentData.lastname),
        firstname: formatCapitalization(newStudentData.firstname),
        middlename: newStudentData.middlename ? formatCapitalization(newStudentData.middlename) : '',
        current_yr_lvl: parseInt(newStudentData.current_yr_lvl, 10),
        birthdate: new Date(newStudentData.birthdate).toISOString().split('T')[0],
        gender: newStudentData.gender,
        age: parseInt(newStudentData.age, 10),
        home_address: newStudentData.home_address ? formatCapitalization(newStudentData.home_address) : '',
        barangay: newStudentData.barangay ? formatCapitalization(newStudentData.barangay) : '',
        city_municipality: newStudentData.city_municipality ? formatCapitalization(newStudentData.city_municipality) : '',
        province: newStudentData.province ? formatCapitalization(newStudentData.province) : '',
        contact_number: newStudentData.contact_number || '',
        email_address: newStudentData.email_address || '',
        mother_name: newStudentData.mother_name ? formatCapitalization(newStudentData.mother_name) : '',
        father_name: newStudentData.father_name ? formatCapitalization(newStudentData.father_name) : '',
        parent_address: newStudentData.parent_address ? formatCapitalization(newStudentData.parent_address) : '',
        father_occupation: newStudentData.father_occupation ? formatCapitalization(newStudentData.father_occupation) : '',
        mother_occupation: newStudentData.mother_occupation ? formatCapitalization(newStudentData.mother_occupation) : '',
        annual_hshld_income: newStudentData.annual_income ? newStudentData.annual_income : '0',
        number_of_siblings: newStudentData.number_of_siblings ? parseInt(newStudentData.number_of_siblings, 10) : 0,
        father_educ_lvl: newStudentData.father_educ_lvl || '',
        mother_educ_lvl: newStudentData.mother_educ_lvl || '',
        father_contact_number: newStudentData.father_contact_number || '',
        mother_contact_number: newStudentData.mother_contact_number || '',
        emergency_number: newStudentData.emergency_number || '',
        emergency_contactperson: newStudentData.emergency_contactperson || '',
        brigada_eskwela: '0',
        status: 'active',
        active_status: 'unarchive'
      };

      // Log the data before sending to the server for debugging
      console.log('Clean student data to be sent:', cleanData);

      // Send the POST request with detailed error handling
      try {
        const response = await fetch('http://localhost:3001/students', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(cleanData),
        });

        // Get the response data
        const responseText = await response.text();
        console.log('Response status:', response.status);
        console.log('Response text:', responseText);

        let responseData;
        try {
          if (responseText) {
            responseData = JSON.parse(responseText);
          }
        } catch (e) {
          console.log('Response is not JSON:', responseText);
        }

        // Check if the response is successful
        if (response.ok) {
          console.log('Student added successfully:', responseData);
          await fetchStudents(); // Refresh student list
          setIsAdding(false);
          setShowModal(false); // Close the modal
          alert('Student added successfully!');
        } else {
          // Handle error response
          console.error('Server error response:', responseText);
          
          // Try to extract more detailed error information
          let errorMessage = 'Unknown error';
          if (responseData && responseData.error) {
            errorMessage = responseData.error;
          } else if (responseData && responseData.message) {
            errorMessage = responseData.message;
          } else if (responseText) {
            errorMessage = responseText;
          }
          
          alert(`Error adding student: ${errorMessage}. Status: ${response.status}`);
        }
      } catch (fetchError) {
        console.error('Fetch error details:', fetchError);
        alert(`Error connecting to the server: ${fetchError.message}. Please try again later.`);
      }
    } catch (error) {
      console.error('General error in saveNewStudent function:', error);
      alert('An unexpected error occurred. Please try again or contact support.');
    }
  };
  
  

  
const cancelAdding = () => {
  // Reset form data and close modal
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
    annual_income: '',
    number_of_siblings: '',
    father_educ_lvl: '',
    mother_educ_lvl: '',
    father_contact_number: '',
    mother_contact_number: '',
    emergency_number: '',
    status: 'active',
    active_status: 'unarchive',
    user_id: ''
  });
  setShowModal(false);  // Close the modal
};

const enrollStudent = async (studentId) => {
  try {
    // Log the attempt to enroll a student
    console.log('Attempting to enroll student with ID:', studentId);

    const getCurrentSchoolYear = () => {
      const currentYear = new Date().getFullYear();
      const nextYear = currentYear + 1;
      return `${currentYear}-${nextYear}`;
    };
    // Define the payload with status 'active'
    const payload = {
      school_year: getCurrentSchoolYear(), // Adjust this value to the current school year
      status: 'active'
    };

    // Send the PUT request to enroll the student
    const response = await axios.put(`http://localhost:3001/students/${studentId}/enroll`, payload);

    // Log and check for successful response
    if (response.status === 200 || response.status === 201) {
      console.log('Enrollment successful:', response.data);
      alert('Student registered successfully');
      await fetchStudents(); // Refresh the student l ist after enrolling
    } else {
      console.warn('Failed to enroll student, non-200 response:', response);
      alert('Failed to enroll student.');
    }
  } catch (error) {
    // Log errors for better debugging
    if (error.response) {
      console.error('Error response:', error.response.data);
      alert('Error enrolling the student: ' + (error.response.data.error || 'Unknown error'));
    } else if (error.request) {
      console.error('No response from server:', error.request);
      alert('No response from the server. Please check your connection.');
    } else {
      console.error('Error setting up request:', error.message);
      alert('An error occurred: ' + error.message);
    }
  }
};

const validateStudent = async (studentId) => {
  try {
    console.log('Validating enrollment for student ID:', studentId);

    // Send the POST request to validate the enrollment
    const response = await axios.post('http://localhost:3001/validate-enrollment', { studentId });

    // Log and check for successful response
    if (response.status === 200) {
      console.log('Validation successful:', response.data);
      alert('Enrollment validated successfully');
      await fetchStudents(); // Refresh the student list after validating
    } else {
      console.warn('Failed to validate enrollment, non-200 response:', response);
      alert('Failed to validate enrollment.');
    }
  } catch (error) {
    if (error.response) {
      console.error('Error response:', error.response.data);
      alert('Error validating the enrollment: ' + (error.response.data.error || 'Unknown error'));
    } else if (error.request) {
      console.error('No response from server:', error.request);
      alert('No response from the server. Please check your connection.');
    } else {
      console.error('Error setting up request:', error.message);
      alert('An error occurred: ' + error.message);
    }
  }
};

const approveElective = async (studentElectiveId) => {
  try {
      const response = await axios.post('http://localhost:3001/approve-elective', {
          studentElectiveId
      });

      if (response.data.message) {
          alert(response.data.message);
          await fetchStudents(); // Refresh student list after approval
      } else {
          alert('Failed to approve elective.');
      }
  } catch (error) {
      console.error('Error approving elective:', error);
      alert('An error occurred while approving the elective.');
  }
};
const archiveStudent = async (studentId, status) => {
  try {
    console.log('Archiving student ID:', studentId, 'with status:', status);

    const response = await axios.put(`http://localhost:3001/students/${studentId}/archive`, { status });

    if (response.status === 200) {
      alert('Student archived successfully');
      await fetchStudents(); // Refresh the student list after archiving
    } else {
      console.warn('Failed to archive student, non-200 response:', response);
      alert('Failed to archive student.');
    }
  } catch (error) {
    if (error.response) {
      console.error('Error response:', error.response.data);
      alert('Error archiving the student: ' + (error.response.data.error || 'Unknown error'));
    } else if (error.request) {
      console.error('No response from server:', error.request);
      alert('No response from the server. Please check your connection.');
    } else {
      console.error('Error setting up request:', error.message);
      alert('An error occurred: ' + error.message);
    }
  }
};

// New Modal State
const [showArchiveModal, setShowArchiveModal] = useState(false);
const [archiveStudentId, setArchiveStudentId] = useState(null);
const [archiveStatus, setArchiveStatus] = useState('');

const openArchiveModal = (studentId) => {
  setArchiveStudentId(studentId);
  setShowArchiveModal(true);
};

const closeArchiveModal = () => {
  setArchiveStudentId(null);
  setArchiveStatus('');
  setShowArchiveModal(false);
};

const handleArchive = () => {
  if (!archiveStatus) {
    alert('Please select an archive status.');
    return;
  }
  archiveStudent(archiveStudentId, archiveStatus);
  closeArchiveModal();
};

  const formatDate = (isoString) => {
    const date = new Date(isoString);
    return date.toLocaleDateString();
  };

  const toggleStudentDetails = (studentId) => {
    setSelectedStudentId(selectedStudentId === studentId ? null : studentId);
    if (selectedStudentId === studentId) {
      // If we're closing the details, also exit edit mode
      setIsEditing(false);
      setEditStudentData(null);
    }
  };

  const handleEditClick = (studentId) => {
    const student = currentStudents.find((s) => s.student_id === studentId);
    setEditStudentData(student);
    setIsEditing(true);
    setSelectedStudentId(studentId); // Ensure details are expanded
  };

  const paginate = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  const indexOfLastStudent = currentPage * studentsPerPage;
  const indexOfFirstStudent = indexOfLastStudent - studentsPerPage;
  const currentStudents = filteredStudents.slice(indexOfFirstStudent, indexOfLastStudent);

  const totalPages = Math.ceil(filteredStudents.length / studentsPerPage);
  const [roleName, setRoleName] = useState('');

  useEffect(() => {
    const userId = localStorage.getItem('userId'); // Retrieve userId from localStorage
    if (userId) {
      console.log(`Retrieved userId from localStorage: ${userId}`); // Debugging log
      fetchUserRole(userId);
    } else {
      console.error('No userId found in localStorage');
    }
  }, []);

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


  // Handle changes in editable fields
  // Update the handleEditChange function to auto-calculate age when birthdate changes
  const handleEditChange = (e) => {
    const { name, value } = e.target;
    
    // If birthdate is changed, automatically calculate and update age
    if (name === 'birthdate' && value) {
      const calculatedAge = calculateAge(value);
      setEditStudentData({ 
        ...editStudentData, 
        [name]: value,
        age: calculatedAge
      });
    } else {
      setEditStudentData({ ...editStudentData, [name]: value });
    }
  };

  const handleSave = async () => {
    if (!editStudentData || !editStudentData.student_id) {
        console.error('Student ID is missing or edit data is not initialized.');
        return;
    }

    // Required fields
    const requiredFields = [
        "lastname", "firstname", "current_yr_lvl", "birthdate", "gender",
        "age", "home_address", "barangay", "city_municipality", "province",
        "contact_number", "email_address", "father_contact_number", 
        "mother_contact_number", "emergency_number"
    ];

    // Check for missing fields
    let newErrors = {};
    requiredFields.forEach(field => {
        if (!editStudentData[field]) {
            newErrors[field] = "This field is required";
        }
    });

    // If errors exist, show them and prevent submission
    if (Object.keys(newErrors).length > 0) {
        setErrors(newErrors);
        return;
    }

    // Apply proper capitalization to text fields
    const formattedData = { ...editStudentData };
    
    // Fields that should be properly capitalized
    const capitalizeFields = [
      "lastname", "firstname", "middlename", "home_address", 
      "barangay", "city_municipality", "province", "mother_name", 
      "father_name", "parent_address", "father_occupation", "mother_occupation"
    ];
    
    // Apply capitalization
    capitalizeFields.forEach(field => {
      if (formattedData[field]) {
        formattedData[field] = formatCapitalization(formattedData[field]);
      }
    });

    // Format the birthdate before sending it to the backend
    const formattedBirthdate = new Date(formattedData.birthdate).toISOString().split('T')[0];

    // Update the student data with the formatted birthdate
    const updatedStudentData = { 
      ...formattedData, 
      birthdate: formattedBirthdate,
      annual_hshld_income: formattedData.annual_income || '',
      brigada_eskwela: '0' // Default value for brigada_eskwela
    };

    try {
        // Make the PUT request to the backend to update the student
        const response = await fetch(`http://localhost:3001/students/${editStudentData.student_id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(updatedStudentData),
        });

        // Check if the response is OK
        if (!response.ok) {
            throw new Error('Failed to save student data');
        }

        // Get the updated student data from the response
        const updatedStudent = await response.json();

        // Update the state with the updated student data
        setStudents((prevStudents) =>
            prevStudents.map((student) =>
                student.student_id === updatedStudent.student_id ? updatedStudent : student
            )
        );

        // Reset the form only after saving is successful
        setEditStudentData(null);

        // Refresh the student list
        await fetchStudents();

        // Untoggle the student detail view to return to the list of students
        toggleStudentDetails(); // Hide student detail view

    } catch (error) {
        console.error('Error saving student data:', error);
    }
};


  // Cancel edit with confirmation modal
  const cancelEdit = () => {
    setShowCancelModal(true);
  };

  // Confirm cancel
  const confirmCancel = (confirm) => {
    if (confirm) {
      setIsEditing(false);
      setSelectedStudentId(null);
    }
    setShowCancelModal(false);
  };

  const handlePrint = (studentId) => {
    // Locate the specific student-details-table
    const table = document.querySelector(".student-details-table");
  
    if (!table) {
      console.error("Student details table not found");
      return;
    }
  
    // Create a new window for displaying the content
    const printWindow = window.open("", "");
  
    // Generate printable content
    printWindow.document.write(`
      <html>
        <head>
          <title>Student Details</title>
          <style>
            table {
              border-collapse: collapse;
              width: 100%;
            }
            th, td {
              border: 1px solid #ddd;
              padding: 8px;
            }
            th {
              background-color: #f2f2f2;
              text-align: left;
            }
          </style>
        </head>
        <body>
          <h2>Student Details</h2>
          ${table.outerHTML}
        </body>
      </html>
    `);
  
    // Close the document and focus on the new window
    printWindow.document.close();
    printWindow.focus();
  };
  
  
  

  return (
    <div className="student-mgmt-container">
      <div className="student-mgmt-header">
        <h1 className="student-mgmt-title">Students</h1>
        {(roleName === 'registrar' || roleName === 'subject_teacher' || roleName === 'class_adviser' || roleName === 'grade_level_coordinator') && (
          <button className="student-mgmt-add-btn" onClick={startAdding}>
            Add New Student
          </button>
        )}
      </div>

      <StudentSearchFilter
        students={students}
        fetchStudents={fetchStudents}
        setFilteredStudents={setFilteredStudents}
        setCurrentPage={setCurrentPage}
        schoolYears={schoolYears}
        filteredSections={filteredSections} 
        filters={filters}
        setFilters={setFilters}
      />

      <div className="student-mgmt-table-container">
        <table className="student-mgmt-table">
        <thead>
          <tr>
            <th>#</th>
            <th>Name</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {currentStudents.map((student, index) => (
            <React.Fragment key={student.student_id}>
              <tr>
                <td>{student.student_id}</td>
                <td>{student.stud_name}</td>
                <td>
                    <span className={`status-${student.active_status ? student.active_status.toLowerCase() : 'pending'}`}>
                      {student.active_status ? student.active_status.toLowerCase() : 'pending'}
                    </span>
                  </td>
                  <td className="student-mgmt-actions">
                  <button 
                      className="student-mgmt-btn student-mgmt-btn-view"
                    onClick={() => toggleStudentDetails(student.student_id)}
                  >
                    View
                  </button>
                    {(roleName !== 'principal') && (
                  <button
                        className="student-mgmt-btn student-mgmt-btn-edit"
                    onClick={() => handleEditClick(student.student_id)}
                  >
                    Edit
                  </button>
                  )}
                    {(roleName === 'registrar' && student.active_status === null) && (
                    <button 
                        className="student-mgmt-btn student-mgmt-btn-register"
                      onClick={(e) => {
                        e.stopPropagation();
                        enrollStudent(student.student_id);
                      }}
                    >
                      Register
                    </button> 
                  )}
                </td>
              </tr>

              {selectedStudentId === student.student_id && (
                  <tr>
                <td colSpan="4">
                      <div className="student-mgmt-details">
                        <div className="student-mgmt-details-content">
                          {/* Left Column */}
                          <div className="student-mgmt-details-section">
                            <table className="student-details-view-table">
                      <tbody>
                      <tr>
                          <th>LRN:</th>
                          <td>
                            {isEditing ? (
                              <input
                                type="text"
                                name="lrn"
                                value={editStudentData ? editStudentData.lrn || "" : ""}
                                onChange={handleEditChange}
                              />
                            ) : (
                              student.lrn
                            )}
                          </td>
                        </tr>
                        <tr>
                          <th>Last Name:</th>
                          <td>
                            {isEditing ? (
                              <input
                                type="text"
                                name="lastname"
                                value={editStudentData ? editStudentData.lastname || "" : ""}
                                onChange={handleEditChange}
                              />
                            ) : (
                              student.lastname
                            )}
                          </td>
                        </tr>
                        <tr>
                          <th>First Name:</th>
                          <td>
                            {isEditing ? (
                              <input
                                type="text"
                                name="firstname"
                                value={editStudentData ? editStudentData.firstname || "" : ""}
                                onChange={handleEditChange}
                              />
                            ) : (
                              student.firstname
                            )}
                          </td>
                        </tr>
                        <tr>
                          <th>Middle Name:</th>
                          <td>
                            {isEditing ? (
                              <input
                                type="text"
                                name="middlename"
                                value={editStudentData ? editStudentData.middlename || "" : ""}
                                onChange={handleEditChange}
                              />
                            ) : (
                                      student.middlename
                            )}
                          </td>
                        </tr>
                        <tr>
                          <th>Grade Level:</th>
                          <td>
                            {isEditing ? (
                              <input
                                type="text"
                                name="current_yr_lvl"
                                value={editStudentData ? editStudentData.current_yr_lvl || "" : ""}
                                onChange={handleEditChange}
                              />
                            ) : (
                              student.current_yr_lvl
                            )}
                          </td>
                        </tr>
                        <tr>
                          <th>Birthdate:</th>
                          <td>
                            {isEditing ? (
                              <input
                                type="date"
                                name="birthdate"
                                value={editStudentData ? editStudentData.birthdate || "" : ""}
                                onChange={handleEditChange}
                              />
                            ) : (
                                      student.birthdate
                            )}
                          </td>
                        </tr>
                        <tr>
                          <th>Gender:</th>
                          <td>
                            {isEditing ? (
                                      <input
                                        type="text"
                                name="gender"
                                        value={editStudentData ? editStudentData.gender || "" : ""}
                                onChange={handleEditChange}
                                      />
                            ) : (
                              student.gender
                            )}
                          </td>
                        </tr>
                        <tr>
                          <th>Contact Number:</th>
                          <td>
                            {isEditing ? (
                              <input
                                type="text"
                                name="contact_number"
                                value={editStudentData ? editStudentData.contact_number || "" : ""}
                                onChange={handleEditChange}
                              />
                            ) : (
                              student.contact_number
                            )}
                          </td>
                        </tr>
                        <tr>
                          <th>Email:</th>
                          <td>
                            {isEditing ? (
                              <input
                                type="email"
                                name="email_address"
                                value={editStudentData ? editStudentData.email_address || "" : ""}
                                onChange={handleEditChange}
                              />
                            ) : (
                              student.email_address
                            )}
                          </td>
                        </tr>
                        <tr>
                          <th>Emergency Contact Person:</th>
                          <td>
                            {isEditing ? (
                              <input
                                type="text"
                                name="emergency_contactperson"
                                value={editStudentData ? editStudentData.emergency_contactperson || "" : ""}
                                onChange={handleEditChange}
                              />
                            ) : (
                              student.emergency_contactperson
                            )}
                          </td>
                        </tr>
                        <tr>
                          <th>Emergency Contact:</th>
                          <td>
                            {isEditing ? (
                              <input
                                type="text"
                                name="emergency_number"
                                value={editStudentData ? editStudentData.emergency_number || "" : ""}
                                onChange={handleEditChange}
                              />
                            ) : (
                              student.emergency_number
                            )}
                          </td>
                        </tr>
                              </tbody>
                            </table>
                          </div>

                          {/* Right Column */}
                          <div className="student-mgmt-details-section">
                            <table className="student-details-view-table">
                              <tbody>
                                <tr>
                                  <th>Parent Address:</th>
                          <td>
                            {isEditing ? (
                              <input
                                type="text"
                                        name="parent_address"
                                        value={editStudentData ? editStudentData.parent_address || "" : ""}
                                onChange={handleEditChange}
                              />
                            ) : (
                                      student.parent_address
                            )}
                          </td>
                        </tr>
                        <tr>
                                  <th>Mother's Name:</th>
                          <td>
                            {isEditing ? (
                              <input
                                type="text"
                                        name="mother_name"
                                        value={editStudentData ? editStudentData.mother_name || "" : ""}
                                onChange={handleEditChange}
                              />
                            ) : (
                                      student.mother_name
                            )}
                          </td>
                        </tr>
                        <tr>
                                  <th>Mother's Occupation:</th>
                          <td>
                            {isEditing ? (
                              <input
                                type="text"
                                        name="mother_occupation"
                                        value={editStudentData ? editStudentData.mother_occupation || "" : ""}
                                onChange={handleEditChange}
                              />
                            ) : (
                                      student.mother_occupation
                            )}
                          </td>
                        </tr>
                        <tr>
                                  <th>Father's Name:</th>
                          <td>
                            {isEditing ? (
                              <input
                                type="text"
                                        name="father_name"
                                        value={editStudentData ? editStudentData.father_name || "" : ""}
                                onChange={handleEditChange}
                              />
                            ) : (
                                      student.father_name
                            )}
                          </td>
                        </tr>
                        <tr>
                          <th>Father's Occupation:</th>
                          <td>
                            {isEditing ? (
                              <input
                                type="text"
                                name="father_occupation"
                                value={editStudentData ? editStudentData.father_occupation || "" : ""}
                                onChange={handleEditChange}
                              />
                            ) : (
                              student.father_occupation
                            )}
                          </td>
                        </tr>
                        <tr>
                                  <th>Annual Household Income:</th>
                          <td>
                            {isEditing ? (
                              <input
                                type="number"
                                        name="annual_income"
                                        value={editStudentData ? editStudentData.annual_hshld_income || "" : ""}
                                onChange={handleEditChange}
                              />
                            ) : (
                                      student.annual_hshld_income
                            )}
                          </td>
                        </tr>
                        <tr>
                          <th>Number of Siblings:</th>
                          <td>
                            {isEditing ? (
                              <input
                                type="number"
                                name="number_of_siblings"
                                value={editStudentData ? editStudentData.number_of_siblings || "" : ""}
                                onChange={handleEditChange}
                              />
                            ) : (
                              student.number_of_siblings
                            )}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                          </div>
                          
                          {/* Action Buttons */}
                          <div className="student-details-actions">
                            <div className="student-details-actions-right">
                      {isEditing ? (
                        <>
                                  <button
                                    className="student-mgmt-btn student-mgmt-btn-edit"
                                    onClick={handleSave}
                                  >
                            Save
                          </button>
                                  <button
                                    className="student-mgmt-btn student-mgmt-btn-archive"
                                    onClick={() => toggleStudentDetails(student.student_id)}
                                  >
                            Cancel
                          </button>
                        </>
                      ) : (
                            <>
                              <button
                                    className="student-mgmt-btn student-mgmt-btn-print"
                                    onClick={() => handlePrint(student.student_id)}
                              >
                                    Print
                              </button>
                                  {roleName === 'registrar' && (
                              <button
                                      className="student-mgmt-btn student-mgmt-btn-archive"
                                      onClick={() => openArchiveModal(student.student_id)}
                              >
                                      Archive
                              </button>
                          )}
                        </>
                      )}
                            </div>
                          </div>
                    </div>
                  </div>
                </td>
              </tr>
            )}
            </React.Fragment>
          ))}
        </tbody>
      </table>
      </div>

      <div className="student-mgmt-pagination">
      <Pagination
        totalItems={filteredStudents.length}
        itemsPerPage={studentsPerPage}
        currentPage={currentPage}
        onPageChange={paginate}
      />
    </div>

      {/* Modals */}
    {showCancelModal && (
        <div className="student-mgmt-modal">
          <div className="student-mgmt-modal-content">
          <h2>Cancel Editing?</h2>
          <p>Are you sure you want to cancel? Unsaved changes will be lost.</p>
            <div className="student-mgmt-modal-actions">
              <button className="student-mgmt-modal-btn student-mgmt-modal-btn-confirm" onClick={() => confirmCancel(true)}>
              Yes
            </button>
              <button className="student-mgmt-modal-btn student-mgmt-modal-btn-cancel" onClick={() => confirmCancel(false)}>
              No
            </button>
          </div>
        </div>
      </div>
    )}

      {showArchiveModal && (
        <div className="student-mgmt-modal">
          <div className="student-mgmt-modal-content">
            <div className="student-mgmt-modal-header">
            <h2>Archive Student</h2>
              <p>Please select a status to archive this student. This action cannot be undone.</p>
            </div>
            
            <select
              className="student-mgmt-modal-select"
              value={archiveStatus}
              onChange={(e) => setArchiveStatus(e.target.value)}
              required
            >
              <option value="">Select archive status</option>
              <option value="inactive">Inactive</option>
              <option value="withdrawn">Withdrawn</option>
              <option value="transferred">Transferred</option>
            </select>

            <div className="student-mgmt-modal-actions">
              <button 
                className="student-mgmt-modal-btn student-mgmt-modal-btn-cancel"
                onClick={closeArchiveModal}
              >
                Cancel
              </button>
              <button 
                className="student-mgmt-modal-btn student-mgmt-modal-btn-confirm"
                onClick={handleArchive}
                disabled={!archiveStatus}
              >
                Archive
              </button>
            </div>
          </div>
        </div>
      )}

      {showModal && (
        <div className="student-mgmt-modal">
          <div className="student-mgmt-modal-content student-mgmt-modal-large">
            <h2>Add New Student</h2>
            
            <div className="student-mgmt-tabs">
              <button 
                className={`student-mgmt-tab ${activeTab === 'basic' ? 'active' : ''}`}
                onClick={() => setActiveTab('basic')}
              >
                Basic Information
              </button>
              <button 
                className={`student-mgmt-tab ${activeTab === 'contact' ? 'active' : ''}`}
                onClick={() => setActiveTab('contact')}
              >
                Contact Information
              </button>
              <button 
                className={`student-mgmt-tab ${activeTab === 'family' ? 'active' : ''}`}
                onClick={() => setActiveTab('family')}
              >
                Family Information
              </button>
            </div>

            {/* Basic Information Tab */}
            <div className={`student-mgmt-tab-content ${activeTab === 'basic' ? 'active' : ''}`}>
              <div className="student-mgmt-form-grid">
                <div className="student-mgmt-form-group">
                  <label>LRN:</label>
                  <input
                    type="text"
                    name="lrn"
                    value={newStudentData.lrn}
                    onChange={handleAddChange}
                    className={errors.lrn ? "error" : ""}
                  />
                  {errors.lrn && <span className="student-mgmt-error">{errors.lrn}</span>}
                </div>
                <div className="student-mgmt-form-group">
                  <label>Lastname:</label>
                  <input
                    type="text"
                    name="lastname"
                    value={newStudentData.lastname}
                    onChange={handleAddChange}
                    className={errors.lastname ? "error" : ""}
                  />
                  {errors.lastname && <span className="student-mgmt-error">{errors.lastname}</span>}
                </div>
                <div className="student-mgmt-form-group">
                  <label>Middlename:</label>
                  <input
                    type="text"
                    name="middlename"
                    value={newStudentData.middlename}
                    onChange={handleAddChange}
                    className={errors.middlename ? "error" : ""}
                  />
                  {errors.middlename && <span className="student-mgmt-error">{errors.middlename}</span>}
                </div>
                <div className="student-mgmt-form-group">
                  <label>Firstname:</label>
                  <input
                    type="text"
                    name="firstname"
                    value={newStudentData.firstname}
                    onChange={handleAddChange}
                    className={errors.firstname ? "error" : ""}
                  />
                  {errors.firstname && <span className="student-mgmt-error">{errors.firstname}</span>}
                </div>
                <div className="student-mgmt-form-group">
                  <label>Year Level:</label>
                  <select
                    name="current_yr_lvl"
                    value={newStudentData.current_yr_lvl}
                    onChange={handleAddChange}
                    className={errors.current_yr_lvl ? "error" : ""}
                  >
                    <option value="">Select Year Level</option>
                    <option value="7">7</option>
                    <option value="8">8</option>
                    <option value="9">9</option>
                    <option value="10">10</option>
                  </select>
                  {errors.current_yr_lvl && <span className="student-mgmt-error">{errors.current_yr_lvl}</span>}
                </div>
                <div className="student-mgmt-form-group">
                  <label>Birthdate:</label>
                  <input
                    type="date"
                    name="birthdate"
                    value={newStudentData.birthdate}
                    onChange={handleAddChange}
                    className={errors.birthdate ? "error" : ""}
                  />
                  {errors.birthdate && <span className="student-mgmt-error">{errors.birthdate}</span>}
                </div>
                <div className="student-mgmt-form-group">
                  <label>Gender:</label>
                  <select
                    name="gender"
                    value={newStudentData.gender}
                    onChange={handleAddChange}
                    className={errors.gender ? "error" : ""}
                  >
                    <option value="">Select Gender</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                  </select>
                  {errors.gender && <span className="student-mgmt-error">{errors.gender}</span>}
                </div>
                <div className="student-mgmt-form-group">
                  <label>Age: <span className="auto-calculated">(Auto-calculated)</span></label>
                  <input
                    type="text"
                    name="age"
                    value={newStudentData.age}
                    readOnly
                    className={errors.age ? "error read-only" : "read-only"}
                  />
                  {errors.age && <span className="student-mgmt-error">{errors.age}</span>}
                </div>
              </div>
            </div>

            {/* Contact Information Tab */}
            <div className={`student-mgmt-tab-content ${activeTab === 'contact' ? 'active' : ''}`}>
              <div className="student-mgmt-form-grid">
                <div className="student-mgmt-form-group">
                  <label>Home Address:</label>
                  <input
                    type="text"
                    name="home_address"
                    value={newStudentData.home_address}
                    onChange={handleAddChange}
                    className={errors.home_address ? "error" : ""}
                  />
                  {errors.home_address && <span className="student-mgmt-error">{errors.home_address}</span>}
                </div>
                <div className="student-mgmt-form-group">
                  <label>Barangay:</label>
                  <input
                    type="text"
                    name="barangay"
                    value={newStudentData.barangay}
                    onChange={handleAddChange}
                    className={errors.barangay ? "error" : ""}
                  />
                  {errors.barangay && <span className="student-mgmt-error">{errors.barangay}</span>}
                </div>
                <div className="student-mgmt-form-group">
                  <label>City Municipality:</label>
                  <input
                    type="text"
                    name="city_municipality"
                    value={newStudentData.city_municipality}
                    onChange={handleAddChange}
                    className={errors.city_municipality ? "error" : ""}
                  />
                  {errors.city_municipality && <span className="student-mgmt-error">{errors.city_municipality}</span>}
                </div>
                <div className="student-mgmt-form-group">
                  <label>Province:</label>
                  <input
                    type="text"
                    name="province"
                    value={newStudentData.province}
                    onChange={handleAddChange}
                    className={errors.province ? "error" : ""}
                  />
                  {errors.province && <span className="student-mgmt-error">{errors.province}</span>}
                </div>
                <div className="student-mgmt-form-group">
                  <label>Contact Number:</label>
                  <input
                    type="text"
                    name="contact_number"
                    value={newStudentData.contact_number}
                    onChange={handleAddChange}
                    className={errors.contact_number ? "error" : ""}
                    maxLength={11}
                  />
                  {errors.contact_number && <span className="student-mgmt-error">{errors.contact_number}</span>}
                </div>
                <div className="student-mgmt-form-group">
                  <label>Email Address:</label>
                  <input
                    type="email"
                    name="email_address"
                    value={newStudentData.email_address}
                    onChange={handleAddChange}
                    className={errors.email_address ? "error" : ""}
                  />
                  {errors.email_address && <span className="student-mgmt-error">{errors.email_address}</span>}
                </div>
                <div className="student-mgmt-form-group">
                  <label>Emergency Contact Person:</label>
                  <input
                    type="text"
                    name="emergency_contactperson"
                    value={newStudentData.emergency_contactperson}
                    onChange={handleAddChange}
                    className={errors.emergency_contactperson ? "error" : ""}
                  />
                  {errors.emergency_contactperson && <span className="student-mgmt-error">{errors.emergency_contactperson}</span>}
                </div>
                <div className="student-mgmt-form-group">
                  <label>Emergency Contact Number:</label>
                  <input
                    type="text"
                    name="emergency_number"
                    value={newStudentData.emergency_number}
                    onChange={handleAddChange}
                    className={errors.emergency_number ? "error" : ""}
                    maxLength={11}
                  />
                  {errors.emergency_number && <span className="student-mgmt-error">{errors.emergency_number}</span>}
                </div>
              </div>
            </div>

            {/* Family Information Tab */}
            <div className={`student-mgmt-tab-content ${activeTab === 'family' ? 'active' : ''}`}>
              <div className="student-mgmt-form-grid">
                <div className="student-mgmt-form-group">
                  <label>Mother's Name:</label>
                  <input
                    type="text"
                    name="mother_name"
                    value={newStudentData.mother_name}
                    onChange={handleAddChange}
                    className={errors.mother_name ? "error" : ""}
                  />
                  {errors.mother_name && <span className="student-mgmt-error">{errors.mother_name}</span>}
                </div>
                <div className="student-mgmt-form-group">
                  <label>Mother's Contact Number:</label>
                  <input
                    type="text"
                    name="mother_contact_number"
                    value={newStudentData.mother_contact_number}
                    onChange={handleAddChange}
                    className={errors.mother_contact_number ? "error" : ""}
                    maxLength={11}
                  />
                  {errors.mother_contact_number && <span className="student-mgmt-error">{errors.mother_contact_number}</span>}
                </div>
                <div className="student-mgmt-form-group">
                  <label>Mother's Occupation:</label>
                  <input
                    type="text"
                    name="mother_occupation"
                    value={newStudentData.mother_occupation}
                    onChange={handleAddChange}
                    className={errors.mother_occupation ? "error" : ""}
                  />
                  {errors.mother_occupation && <span className="student-mgmt-error">{errors.mother_occupation}</span>}
                </div>
                <div className="student-mgmt-form-group">
                  <label>Mother's Education Level:</label>
                  <input
                    type="text"
                    name="mother_educ_lvl"
                    value={newStudentData.mother_educ_lvl}
                    onChange={handleAddChange}
                    className={errors.mother_educ_lvl ? "error" : ""}
                  />
                  {errors.mother_educ_lvl && <span className="student-mgmt-error">{errors.mother_educ_lvl}</span>}
                </div>
                <div className="student-mgmt-form-group">
                  <label>Father's Name:</label>
                  <input
                    type="text"
                    name="father_name"
                    value={newStudentData.father_name}
                    onChange={handleAddChange}
                    className={errors.father_name ? "error" : ""}
                  />
                  {errors.father_name && <span className="student-mgmt-error">{errors.father_name}</span>}
                </div>
                <div className="student-mgmt-form-group">
                  <label>Father's Contact Number:</label>
                  <input
                    type="text"
                    name="father_contact_number"
                    value={newStudentData.father_contact_number}
                    onChange={handleAddChange}
                    className={errors.father_contact_number ? "error" : ""}
                    maxLength={11}
                  />
                  {errors.father_contact_number && <span className="student-mgmt-error">{errors.father_contact_number}</span>}
                </div>
                <div className="student-mgmt-form-group">
                  <label>Father's Occupation:</label>
                  <input
                    type="text"
                    name="father_occupation"
                    value={newStudentData.father_occupation}
                    onChange={handleAddChange}
                    className={errors.father_occupation ? "error" : ""}
                  />
                  {errors.father_occupation && <span className="student-mgmt-error">{errors.father_occupation}</span>}
                </div>
                <div className="student-mgmt-form-group">
                  <label>Father's Education Level:</label>
                  <input
                    type="text"
                    name="father_educ_lvl"
                    value={newStudentData.father_educ_lvl}
                    onChange={handleAddChange}
                    className={errors.father_educ_lvl ? "error" : ""}
                  />
                  {errors.father_educ_lvl && <span className="student-mgmt-error">{errors.father_educ_lvl}</span>}
                </div>
                <div className="student-mgmt-form-group">
                  <label>Parent Address:</label>
                  <input
                    type="text"
                    name="parent_address"
                    value={newStudentData.parent_address}
                    onChange={handleAddChange}
                    className={errors.parent_address ? "error" : ""}
                  />
                  {errors.parent_address && <span className="student-mgmt-error">{errors.parent_address}</span>}
                </div>
                <div className="student-mgmt-form-group">
                  <label>Annual Household Income:</label>
                  <input
                    type="text"
                    name="annual_income"
                    value={newStudentData.annual_income}
                    onChange={handleAddChange}
                    className={errors.annual_income ? "error" : ""}
                  />
                  {errors.annual_income && <span className="student-mgmt-error">{errors.annual_income}</span>}
                </div>
                <div className="student-mgmt-form-group">
                  <label>Number of Siblings:</label>
                  <input
                    type="number"
                    name="number_of_siblings"
                    value={newStudentData.number_of_siblings}
                    onChange={handleAddChange}
                    className={errors.number_of_siblings ? "error" : ""}
                  />
                  {errors.number_of_siblings && <span className="student-mgmt-error">{errors.number_of_siblings}</span>}
                </div>
              </div>
            </div>

            <div className="student-mgmt-modal-actions">
              <div className="student-mgmt-tab-navigation">
                {activeTab !== 'basic' && (
                  <button 
                    type="button" 
                    className="student-mgmt-btn" 
                    onClick={() => setActiveTab(activeTab === 'family' ? 'contact' : 'basic')}
                  >
                    Previous
                  </button>
                )}
                {activeTab !== 'family' && (
                  <button 
                    type="button" 
                    className="student-mgmt-btn" 
                    onClick={() => setActiveTab(activeTab === 'basic' ? 'contact' : 'family')}
                  >
                    Next
                  </button>
                )}
              </div>
              <div className="student-mgmt-form-actions">
                <button className="student-mgmt-btn student-mgmt-btn-edit" onClick={saveNewStudent}>
                  Save
                </button>
                <button className="student-mgmt-btn" onClick={cancelAdding}>
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default StudentManagement;
