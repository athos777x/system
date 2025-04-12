import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Pagination from '../Utilities/pagination';
import axios from 'axios';
import '../TeacherPagesCss/EnrollStudentManagement.css';
import StudentSearchFilter from '../RoleSearchFilters/StudentSearchFilter';

function EnrollStudentManagement() {
  const [students, setStudents] = useState([]);
  const [filteredStudents, setFilteredStudents] = useState([]);
  const [selectedStudentId, setSelectedStudentId] = useState(null);
  const [studentsPerPage] = useState(20); // Adjust this number to set how many students per page
  const [currentPage, setCurrentPage] = useState(1);
  const [isEditing, setIsEditing] = useState(false); // Tracks edit mode
  const [editStudentData, setEditStudentData] = useState(null); // Stores the editable student data
  const [showCancelModal, setShowCancelModal] = useState(false); // Tracks cancel confirmation modal
  const [errors, setErrors] = useState({});
  const [enrollmentStatus, setEnrollmentStatus] = useState('Pending');

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
    brigada_eskwela: '0',
    brigada_remarks: '',
    status: 'active',
    archive_status: 'unarchive'
  });

  // Add this state for tab management
  const [activeTab, setActiveTab] = useState('basic');

  const navigate = useNavigate();

  // Add this constant for education levels near the top of the file, after the imports
  const EDUCATION_LEVELS = [
    "Elementary Level",
    "Elementary Graduate",
    "High School Level",
    "High School Graduate",
    "College Level",
    "College Graduate",
    "Vocational",
    "Post Graduate",
    "Doctorate",
    "No Formal Education"
  ];

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

  const validateSiblings = (siblings) => {
    if (!siblings && siblings !== 0) return ""; // Optional field
    const siblingCount = parseInt(siblings);
    if (isNaN(siblingCount)) return "Number of siblings must be a valid number";
    if (siblingCount < 0) return "Number of siblings cannot be negative";
    if (siblingCount > 20) return "Please verify number of siblings if more than 20";
    return "";
  };

  useEffect(() => {
    fetchSchoolYears();
    fetchSections();
    fetchStudents();
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

      // Add user_id to the filteredParams
      const userId = localStorage.getItem('userId'); // Retrieve userId from localStorage
      if (userId) {
        filteredParams.user_id = userId; // Add user_id to the request parameters
      }
  
      // ✅ Determine the endpoint based on roleName
      const endpoint = roleName === 'class_adviser' 
        ? 'http://localhost:3001/students/by-adviser' 
        : 'http://localhost:3001/students/apply-enrollment';
  
      // ✅ Make request with correct filters
      const response = await axios.get(endpoint, { params: filteredParams });
  
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
      annual_hshld_income: '',
      number_of_siblings: '',
      father_educ_lvl: '',
      mother_educ_lvl: '',
      father_contact_number: '',
      mother_contact_number: '',
      emergency_number: '',
      emergency_contactperson: '',
      brigada_eskwela: '0',
      brigada_remarks: '',
      status: 'active',
      active_status: 'unarchive',
      user_id: ''
    });
    setErrors({}); // Reset errors when starting to add a new student
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
        // Always validate; the function handles empty strings correctly.
        newErrors[name] = validateContactNumber(value, name.replace(/_/g, ' ').toLowerCase());
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
      case 'annual_hshld_income':
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
      case 'number_of_siblings':
        if (value.trim() !== '') {
          newErrors[name] = validateSiblings(value);
        } else {
          newErrors[name] = "";
        }
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
      if (newStudentData.annual_hshld_income) {
        newErrors.annual_hshld_income = validateIncome(newStudentData.annual_hshld_income);
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
        annual_hshld_income: newStudentData.annual_hshld_income ? newStudentData.annual_hshld_income : '0',
        number_of_siblings: newStudentData.number_of_siblings ? parseInt(newStudentData.number_of_siblings, 10) : 0,
        father_educ_lvl: newStudentData.father_educ_lvl || '',
        mother_educ_lvl: newStudentData.mother_educ_lvl || '',
        father_contact_number: newStudentData.father_contact_number || '',
        mother_contact_number: newStudentData.mother_contact_number || '',
        emergency_number: newStudentData.emergency_number || '',
        emergency_contactperson: newStudentData.emergency_contactperson || '',
        brigada_eskwela: newStudentData.brigada_eskwela,
        brigada_remarks: newStudentData.brigada_eskwela === '0' ? newStudentData.brigada_remarks : '',
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
  setIsAdding(false);
  setShowModal(false);
  setErrors({}); // Reset errors when closing the add new student modal
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
    const response = await axios.put(`http://localhost:3001/students/${studentId}/enroll-student`, payload);

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


const handleApplyEnrollment = async (studentId) => {
  try {
    const response = await axios.post('http://localhost:3001/apply-enrollment', { studentId });
    if (response.data.message) {
      setEnrollmentStatus('pending');
      alert(response.data.message);
    } else {
      alert('Failed to apply for enrollment. Please try again.');
    }
  } catch (error) {
    console.error('Error applying for enrollment:', error);
    alert('Failed to apply for enrollment. Please try again.');
  }
  fetchStudents();
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
      // If we're closing the details, also exit edit mode and clear errors
      setIsEditing(false);
      setEditStudentData(null);
      setErrors({}); // Reset errors when closing the details view
    } else {
      // Reset errors when opening the details view
      setErrors({});
    }
  };

  const handleEditClick = (studentId) => {
    const student = currentStudents.find((s) => s.student_id === studentId);
    setEditStudentData(student);
    setIsEditing(true);
    setSelectedStudentId(studentId); // Ensure details are expanded
    setErrors({}); // Reset errors when starting edit mode
    setIsAdding(false); // Ensure add mode is not active
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
        // Always validate; the function handles empty strings correctly.
        newErrors[name] = validateContactNumber(value, name.replace(/_/g, ' ').toLowerCase());
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
          setEditStudentData(prevData => ({
            ...prevData,
            [name]: value,
            age: calculatedAge
          }));
        }
        break;
      case 'annual_hshld_income':
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
      case 'number_of_siblings':
        if (value.trim() !== '') {
          newErrors[name] = validateSiblings(value);
        } else {
          newErrors[name] = "";
        }
        break;
      default:
        // All other fields are optional
        newErrors[name] = "";
    }

    setErrors(newErrors);

    // Update the form data
    if (name !== 'birthdate') {  // birthdate is handled separately above
      setEditStudentData(prevData => ({
        ...prevData,
        [name]: value
      }));
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

    // Run specific validations
    if (editStudentData.lrn) newErrors.lrn = validateLRN(editStudentData.lrn);
    if (editStudentData.lastname) newErrors.lastname = validateName(editStudentData.lastname, 'Last name');
    if (editStudentData.firstname) newErrors.firstname = validateName(editStudentData.firstname, 'First name');
    if (editStudentData.middlename && editStudentData.middlename.trim() !== '') {
      newErrors.middlename = validateName(editStudentData.middlename, 'Middle name');
    }

    // Optional field validations - only validate if they have a value
    if (editStudentData.contact_number) {
      newErrors.contact_number = validateContactNumber(editStudentData.contact_number, 'Contact number');
    }
    if (editStudentData.father_contact_number) {
      newErrors.father_contact_number = validateContactNumber(editStudentData.father_contact_number, 'Father contact number');
    }
    if (editStudentData.mother_contact_number) {
      newErrors.mother_contact_number = validateContactNumber(editStudentData.mother_contact_number, 'Mother contact number');
    }
    if (editStudentData.emergency_number) {
      newErrors.emergency_number = validateContactNumber(editStudentData.emergency_number, 'Emergency number');
    }
    if (editStudentData.email_address) {
      newErrors.email_address = validateEmail(editStudentData.email_address);
    }
    if (editStudentData.age) {
      newErrors.age = validateAge(editStudentData.age);
    }
    if (editStudentData.annual_hshld_income) {
      newErrors.annual_hshld_income = validateIncome(editStudentData.annual_hshld_income);
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
      annual_hshld_income: parseFloat(formattedData.annual_hshld_income.replace(/,/g, '')) || 0, // Format income to remove commas
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
        // setEditStudentData(null);

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
  
  
  

  // Add this function to calculate min and max dates for the birthdate picker
  const calculateDateRange = () => {
    const today = new Date();
    
    // For max date (minimum age of 10)
    const maxDate = new Date(today);
    maxDate.setFullYear(today.getFullYear() - 10);
    
    // For min date (maximum age of 20)
    const minDate = new Date(today);
    minDate.setFullYear(today.getFullYear() - 20);
    
    return {
      min: minDate.toISOString().split('T')[0],
      max: maxDate.toISOString().split('T')[0]
    };
  };

  return (
    <div className="enroll-student-container">
      <div className="enroll-student-header">
        <h1 className="enroll-student-title">Enroll Student Management</h1>
        {/* {(roleName === 'registrar' || roleName === 'subject_teacher' || roleName === 'class_adviser' || roleName === 'grade_level_coordinator') && (
          <button className="enroll-student-add-btn" onClick={startAdding}>
            Add New Student
          </button>
        )} */}
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

      <div className="enroll-student-table-container">
        <table className="enroll-student-table">
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
                  <td className="enroll-student-actions">
                    <button 
                      className="enroll-student-btn enroll-student-btn-view"
                      onClick={() => toggleStudentDetails(student.student_id)}
                    >
                      View
                    </button>
                    {/* {(roleName !== 'principal') && (
                      <button
                        className="enroll-student-btn enroll-student-btn-edit"
                        onClick={() => handleEditClick(student.student_id)}
                      >
                        Edit
                      </button>
                    )} */}
                    {/* {(roleName === 'registrar' && student.active_status === null) && (
                      <button 
                        className="enroll-student-btn enroll-student-btn-register"
                        onClick={(e) => {
                          e.stopPropagation();
                          enrollStudent(student.student_id);
                        }}
                      >
                        Register
                      </button> 
                    )} */}
                    {(roleName === 'registrar' && student.active_status === 'inactive') && (
                      <button 
                        className="enroll-student-btn enroll-student-btn-register"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleApplyEnrollment(student.student_id);
                        }}
                      >
                        Request Enrollment
                      </button>
                    )}
                  </td>
                </tr>

                {selectedStudentId === student.student_id && (
                  <tr>
                    <td colSpan="4">
                      <div className="enroll-student-details">
                        <div className="enroll-student-details-content">
                          {/* Left Column */}
                          <div className="enroll-student-details-section">
                            <table className="enroll-student-details-view-table">
                              <tbody>
                                <tr className="category-header" style={{ backgroundColor: '#f0f7f0' }}>
                                  <th colSpan="2" style={{ padding: '10px', color: '#2c5c2c', fontWeight: 'bold', fontSize: '0.95em', textTransform: 'uppercase', borderBottom: '1px solid #e0e0e0' }}>Basic Information</th>
                                </tr>
                                <tr>
                                  <th>LRN:</th>
                                  <td>
                                    {isEditing ? (
                                      <input
                                        type="text"
                                        name="lrn"
                                        value={editStudentData ? editStudentData.lrn || "" : ""}
                                        onChange={handleEditChange}
                                        className={errors.lrn ? "error" : ""}
                                      />
                                    ) : (
                                      student.lrn
                                    )}
                                    {errors.lrn && <span className="student-mgmt-error">{errors.lrn}</span>}
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
                                        className={errors.lastname ? "error" : ""}
                                      />
                                    ) : (
                                      student.lastname
                                    )}
                                    {errors.lastname && <span className="student-mgmt-error">{errors.lastname}</span>}
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
                                        className={errors.firstname ? "error" : ""}
                                      />
                                    ) : (
                                      student.firstname
                                    )}
                                    {errors.firstname && <span className="student-mgmt-error">{errors.firstname}</span>}
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
                                        className={errors.middlename ? "error" : ""}
                                      />
                                    ) : (
                                      student.middlename
                                    )}
                                    {errors.middlename && <span className="student-mgmt-error">{errors.middlename}</span>}
                                  </td>
                                </tr>
                                <tr>
                                  <th>Grade Level:</th>
                                  <td>
                                    {isEditing ? (
                                      <select
                                        name="current_yr_lvl"
                                        value={editStudentData ? editStudentData.current_yr_lvl || "" : ""}
                                        onChange={handleEditChange}
                                        className={errors.current_yr_lvl ? "error" : ""}
                                      >
                                        <option value="">Select Year Level</option>
                                        <option value="7">7</option>
                                        <option value="8">8</option>
                                        <option value="9">9</option>
                                        <option value="10">10</option>
                                      </select>
                                    ) : (
                                      student.current_yr_lvl
                                    )}
                                    {errors.current_yr_lvl && <span className="student-mgmt-error">{errors.current_yr_lvl}</span>}
                                  </td>
                                </tr>
                                <tr>
                                  <th>Section:</th>
                                  <td>
                                    {isEditing ? (
                                      <select
                                        name="section_id"
                                        value={editStudentData?.section_id || ""}
                                        onChange={handleEditChange}
                                      >
                                        <option value="">Select Section</option>
                                        {sections
                                          .filter((section) => section.grade_level === student.current_yr_lvl) // ✅ Filter sections by year level
                                          .map((section) => (
                                            <option key={section.id} value={section.section_id}>
                                              {section.section_name}
                                            </option>
                                          ))}
                                      </select>
                                    ) : (
                                      student?.section_name || "No Section"
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
                                        value={editStudentData ? new Date(editStudentData.birthdate).toISOString().split('T')[0] : ""}
                                        onChange={handleEditChange}
                                        min={calculateDateRange().min}
                                        max={calculateDateRange().max}
                                      />
                                    ) : (
                                      new Date(student.birthdate).toLocaleDateString('en-US', {
                                        year: 'numeric',
                                        month: 'long',
                                        day: 'numeric'
                                      })
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
                                        className={errors.gender ? "error" : ""}
                                      />
                                    ) : (
                                      student.gender
                                    )}
                                    {errors.gender && <span className="student-mgmt-error">{errors.gender}</span>}
                                  </td>
                                </tr>
                                <tr>
                                  <th>Age:</th>
                                  <td>{student.age}</td>
                                </tr>

                                <tr>
                                  <th>Status:</th>
                                  <td>
                                    {isEditing ? (
                                      <select
                                        name="active_status"
                                        value={editStudentData ? editStudentData.active_status || "" : ""}
                                        onChange={handleEditChange}
                                      >
                                        <option value="active">Active</option>
                                        <option value="inactive">Inactive</option>
                                        <option value="withdrawn">Withdrawn</option>
                                        <option value="transferred">Transferred</option>
                                      </select>
                                    ) : (
                                      student.active_status
                                    )}
                                  </td>
                                </tr>

                                <tr className="category-header" style={{ backgroundColor: '#f0f7f0' }}>
                                  <th colSpan="2" style={{ padding: '10px', color: '#2c5c2c', fontWeight: 'bold', fontSize: '0.95em', textTransform: 'uppercase', borderBottom: '1px solid #e0e0e0' }}>Contact Information</th>
                                </tr>
                                <tr>
                                  <th>Home Address:</th>
                                  <td>
                                    {isEditing ? (
                                      <input
                                        type="text"
                                        name="home_address"
                                        value={editStudentData ? editStudentData.home_address || "" : ""}
                                        onChange={handleEditChange}
                                        className={errors.home_address ? "error" : ""}
                                      />
                                    ) : (
                                      student.home_address
                                    )}
                                    {errors.home_address && <span className="student-mgmt-error">{errors.home_address}</span>}
                                  </td>
                                </tr>
                                <tr>
                                  <th>Barangay:</th>
                                  <td>
                                    {isEditing ? (
                                      <input
                                        type="text"
                                        name="barangay"
                                        value={editStudentData ? editStudentData.barangay || "" : ""}
                                        onChange={handleEditChange}
                                        className={errors.barangay ? "error" : ""}
                                      />
                                    ) : (
                                      student.barangay
                                    )}
                                    {errors.barangay && <span className="student-mgmt-error">{errors.barangay}</span>}
                                  </td>
                                </tr>
                                <tr>
                                  <th>City Municipality:</th>
                                  <td>
                                    {isEditing ? (
                                      <input
                                        type="text"
                                        name="city_municipality"
                                        value={editStudentData ? editStudentData.city_municipality || "" : ""}
                                        onChange={handleEditChange}
                                        className={errors.city_municipality ? "error" : ""}
                                      />
                                    ) : (
                                      student.city_municipality
                                    )}
                                    {errors.city_municipality && <span className="student-mgmt-error">{errors.city_municipality}</span>}
                                  </td>
                                </tr>
                                <tr>
                                  <th>Province:</th>
                                  <td>
                                    {isEditing ? (
                                      <input
                                        type="text"
                                        name="province"
                                        value={editStudentData ? editStudentData.province || "" : ""}
                                        onChange={handleEditChange}
                                        className={errors.province ? "error" : ""}
                                      />
                                    ) : (
                                      student.province
                                    )}
                                    {errors.province && <span className="student-mgmt-error">{errors.province}</span>}
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
                                        className={errors.contact_number ? "error" : ""}
                                        maxLength={11}
                                      />
                                    ) : (
                                      student.contact_number
                                    )}
                                    {errors.contact_number && <span className="student-mgmt-error">{errors.contact_number}</span>}
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
                                        className={errors.email_address ? "error" : ""}
                                      />
                                    ) : (
                                      student.email_address
                                    )}
                                    {errors.email_address && <span className="student-mgmt-error">{errors.email_address}</span>}
                                  </td>
                                </tr>
                              </tbody>
                            </table>
                          </div>

                          {/* Right Column */}
                          <div className="enroll-student-details-section">
                            <table className="enroll-student-details-view-table">
                              <tbody>
                                <tr className="category-header" style={{ backgroundColor: '#f0f7f0' }}>
                                  <th colSpan="2" style={{ padding: '10px', color: '#2c5c2c', fontWeight: 'bold', fontSize: '0.95em', textTransform: 'uppercase', borderBottom: '1px solid #e0e0e0' }}>Family Information</th>
                                </tr>
                                <tr>
                                  <th>Parent Address:</th>
                          <td>
                            {isEditing ? (
                              <input
                                type="text"
                                name="parent_address"
                                value={editStudentData ? editStudentData.parent_address || "" : ""}
                                onChange={handleEditChange}
                                className={errors.parent_address ? "error" : ""}
                              />
                            ) : (
                                      student.parent_address
                            )}
                            {errors.parent_address && <span className="student-mgmt-error">{errors.parent_address}</span>}
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
                                className={errors.mother_name ? "error" : ""}
                              />
                            ) : (
                                      student.mother_name
                            )}
                            {errors.mother_name && <span className="student-mgmt-error">{errors.mother_name}</span>}
                          </td>
                        </tr>
                        <tr>
                                  <th>Mother's Contact Number:</th>
                          <td>
                            {isEditing ? (
                              <input
                                type="text"
                                name="mother_contact_number"
                                value={editStudentData ? editStudentData.mother_contact_number || "" : ""}
                                onChange={handleEditChange}
                                className={errors.mother_contact_number ? "error" : ""}
                                maxLength={11}
                              />
                            ) : (
                              student.mother_contact_number
                            )}
                            {errors.mother_contact_number && <span className="student-mgmt-error">{errors.mother_contact_number}</span>}
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
                                className={errors.mother_occupation ? "error" : ""}
                              />
                            ) : (
                                      student.mother_occupation
                            )}
                            {errors.mother_occupation && <span className="student-mgmt-error">{errors.mother_occupation}</span>}
                          </td>
                        </tr>
                        <tr>
                          <th>Mother's Education Level:</th>
                          <td>
                            {isEditing ? (
                              <select
                                name="mother_educ_lvl"
                                value={editStudentData ? editStudentData.mother_educ_lvl || "" : ""}
                                onChange={handleEditChange}
                              >
                                <option value="">Select Education Level</option>
                                {EDUCATION_LEVELS.map((level) => (
                                  <option key={level} value={level}>{level}</option>
                                ))}
                              </select>
                            ) : (
                              student.mother_educ_lvl
                            )}
                            {errors.mother_educ_lvl && <span className="student-mgmt-error">{errors.mother_educ_lvl}</span>}
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
                                className={errors.father_name ? "error" : ""}
                              />
                            ) : (
                                      student.father_name
                            )}
                            {errors.father_name && <span className="student-mgmt-error">{errors.father_name}</span>}
                          </td>
                        </tr>
                        <tr>
                          <th>Father's Contact Number:</th>
                          <td>
                            {isEditing ? (
                              <input
                                type="text"
                                name="father_contact_number"
                                value={editStudentData ? editStudentData.father_contact_number || "" : ""}
                                onChange={handleEditChange}
                                className={errors.father_contact_number ? "error" : ""}
                                maxLength={11}
                              />
                            ) : (
                              student.father_contact_number
                            )}
                            {errors.father_contact_number && <span className="student-mgmt-error">{errors.father_contact_number}</span>}
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
                                className={errors.father_occupation ? "error" : ""}
                              />
                            ) : (
                              student.father_occupation
                            )}
                            {errors.father_occupation && <span className="student-mgmt-error">{errors.father_occupation}</span>}
                          </td>
                        </tr>
                        <tr>
                          <th>Father's Education Level:</th>
                          <td>
                            {isEditing ? (
                              <select
                                name="father_educ_lvl"
                                value={editStudentData ? editStudentData.father_educ_lvl || "" : ""}
                                onChange={handleEditChange}
                              >
                                <option value="">Select Education Level</option>
                                {EDUCATION_LEVELS.map((level) => (
                                  <option key={level} value={level}>{level}</option>
                                ))}
                              </select>
                            ) : (
                              student.father_educ_lvl
                            )}
                            {errors.father_educ_lvl && <span className="student-mgmt-error">{errors.father_educ_lvl}</span>}
                          </td>
                        </tr>
                        <tr>
                          <th>Annual Household Income:</th>
                          <td>
                            {isEditing ? (
                              <input
                                type="text"
                                name="annual_hshld_income"
                                value={editStudentData ? editStudentData.annual_hshld_income || "" : ""}
                                onChange={handleEditChange}
                                className={errors.annual_hshld_income ? "error" : ""}
                              />
                            ) : (
                              student.annual_hshld_income
                            )}
                            {errors.annual_hshld_income && <span className="student-mgmt-error">{errors.annual_hshld_income}</span>}
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
                                min="0"
                                max="20"
                                step="1"
                                className={errors.number_of_siblings ? "error" : ""}
                              />
                            ) : (
                              student.number_of_siblings
                            )}
                            {errors.number_of_siblings && <span className="student-mgmt-error">{errors.number_of_siblings}</span>}
                          </td>
                        </tr>

                        <tr className="category-header" style={{ backgroundColor: '#f0f7f0' }}>
                          <th colSpan="2" style={{ padding: '10px', color: '#2c5c2c', fontWeight: 'bold', fontSize: '0.95em', textTransform: 'uppercase', borderBottom: '1px solid #e0e0e0' }}>Emergency Contact Information</th>
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
                                className={errors.emergency_contactperson ? "error" : ""}
                              />
                            ) : (
                              student.emergency_contactperson
                            )}
                            {errors.emergency_contactperson && <span className="student-mgmt-error">{errors.emergency_contactperson}</span>}
                          </td>
                        </tr>
                        <tr>
                          <th>Emergency Contact Number:</th>
                          <td>
                            {isEditing ? (
                              <input
                                type="text"
                                name="emergency_number"
                                value={editStudentData ? editStudentData.emergency_number || "" : ""}
                                onChange={handleEditChange}
                                className={errors.emergency_number ? "error" : ""}
                                maxLength={11}
                              />
                            ) : (
                              student.emergency_number
                            )}
                            {errors.emergency_number && <span className="student-mgmt-error">{errors.emergency_number}</span>}
                          </td>
                        </tr>
                              </tbody>
                            </table>
                          </div>
                          
                          {/* Action Buttons */}
                          <div className="enroll-student-details-actions">
                            <div className="enroll-student-details-actions-right">
                      {isEditing ? (
                        <>
                                  <button
                                    className="enroll-student-btn enroll-student-btn-edit"
                                    onClick={handleSave}
                                  >
                            Save
                          </button>
                                  <button
                                    className="enroll-student-btn enroll-student-btn-archive"
                                    onClick={() => toggleStudentDetails(student.student_id)}
                                  >
                            Cancel
                          </button>
                        </>
                      ) : (
                            <>
                                  {/* Print button temporarily hidden
                                  <button
                                        className="enroll-student-btn enroll-student-btn-print"
                                        onClick={() => handlePrint(student.student_id)}
                                  >
                                        Print
                                  </button>
                                  */}
                                  {roleName === 'registrar' && (
                              <button
                                      className="enroll-student-btn enroll-student-btn-archive"
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

      <div className="enroll-student-pagination">
      <Pagination
        totalItems={filteredStudents.length}
        itemsPerPage={studentsPerPage}
        currentPage={currentPage}
        onPageChange={paginate}
      />
    </div>

      {/* Modals with updated class names */}
      {showCancelModal && (
        <div className="enroll-student-modal">
          <div className="enroll-student-modal-content">
          <h2>Cancel Editing?</h2>
          <p>Are you sure you want to cancel? Unsaved changes will be lost.</p>
            <div className="enroll-student-modal-actions">
              <button className="enroll-student-modal-btn enroll-student-modal-btn-confirm" onClick={() => confirmCancel(true)}>
              Yes
            </button>
              <button className="enroll-student-modal-btn enroll-student-modal-btn-cancel" onClick={() => confirmCancel(false)}>
              No
            </button>
          </div>
        </div>
      </div>
    )}

      {showArchiveModal && (
        <div className="enroll-student-modal">
          <div className="enroll-student-modal-content">
            <div className="enroll-student-modal-header">
            <h2>Archive Student</h2>
              <p>Please select a status to archive this student. This action cannot be undone.</p>
            </div>
            
            <select
              className="enroll-student-modal-select"
              value={archiveStatus}
              onChange={(e) => setArchiveStatus(e.target.value)}
              required
            >
              <option value="">Select archive status</option>
              <option value="inactive">Inactive</option>
              <option value="withdrawn">Withdrawn</option>
              <option value="transferred">Transferred</option>
            </select>

            <div className="enroll-student-modal-actions">
              <button 
                className="enroll-student-modal-btn enroll-student-modal-btn-cancel"
                onClick={closeArchiveModal}
              >
                Cancel
              </button>
              <button 
                className="enroll-student-modal-btn enroll-student-modal-btn-confirm"
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
        <div className="enroll-student-modal">
          <div className="enroll-student-modal-content enroll-student-modal-large">
            <h2>Add New Student</h2>
            
            <div className="enroll-student-tabs">
              <button 
                className={`enroll-student-tab ${activeTab === 'basic' ? 'active' : ''}`}
                onClick={() => setActiveTab('basic')}
              >
                Basic Information
              </button>
              <button 
                className={`enroll-student-tab ${activeTab === 'contact' ? 'active' : ''}`}
                onClick={() => setActiveTab('contact')}
              >
                Contact Information
              </button>
              <button 
                className={`enroll-student-tab ${activeTab === 'family' ? 'active' : ''}`}
                onClick={() => setActiveTab('family')}
              >
                Family Information
              </button>
            </div>

            {/* Basic Information Tab */}
            <div className={`enroll-student-tab-content ${activeTab === 'basic' ? 'active' : ''}`}>
              <div className="enroll-student-form-grid">
                <div className="enroll-student-form-group">
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
                <div className="enroll-student-form-group">
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
                <div className="enroll-student-form-group">
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
                <div className="enroll-student-form-group">
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
                <div className="enroll-student-form-group">
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
                <div className="enroll-student-form-group">
                  <label>Birthdate:</label>
                  <input
                    type="date"
                    name="birthdate"
                    value={newStudentData.birthdate}
                    onChange={handleAddChange}
                    min={calculateDateRange().min}
                    max={calculateDateRange().max}
                    className={errors.birthdate ? "error" : ""}
                  />
                  {errors.birthdate && <span className="student-mgmt-error">{errors.birthdate}</span>}
                </div>
                <div className="enroll-student-form-group">
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
                <div className="enroll-student-form-group">
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
                <div className="enroll-student-form-group">
                  <label>Brigada Eskwela Attendance:</label>
                  <select
                    name="brigada_eskwela"
                    value={newStudentData.brigada_eskwela}
                    onChange={handleAddChange}
                    className={errors.brigada_eskwela ? "error" : ""}
                  >
                    <option value="0">No</option>
                    <option value="1">Yes</option>
                  </select>
                  {errors.brigada_eskwela && <span className="student-mgmt-error">{errors.brigada_eskwela}</span>}
                </div>
                {(newStudentData.brigada_eskwela === '0' || newStudentData.brigada_eskwela === 0) && (
                  <div className="enroll-student-form-group">
                    <label>Remarks:</label>
                    <textarea
                      name="brigada_remarks"
                      value={newStudentData.brigada_remarks}
                      onChange={handleAddChange}
                      className={errors.brigada_remarks ? "error" : ""}
                      placeholder="Please provide reason for not attending Brigada Eskwela"
                      rows="3"
                    />
                    {errors.brigada_remarks && <span className="student-mgmt-error">{errors.brigada_remarks}</span>}
                  </div>
                )}
              </div>
            </div>

            {/* Contact Information Tab */}
            <div className={`enroll-student-tab-content ${activeTab === 'contact' ? 'active' : ''}`}>
              <div className="enroll-student-form-grid">
                <div className="enroll-student-form-group">
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
                <div className="enroll-student-form-group">
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
                <div className="enroll-student-form-group">
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
                <div className="enroll-student-form-group">
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
                <div className="enroll-student-form-group">
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
                <div className="enroll-student-form-group">
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
                <div className="enroll-student-form-group">
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
                <div className="enroll-student-form-group">
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
            <div className={`enroll-student-tab-content ${activeTab === 'family' ? 'active' : ''}`}>
              <div className="enroll-student-form-grid">
                <div className="enroll-student-form-group">
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
                <div className="enroll-student-form-group">
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
                <div className="enroll-student-form-group">
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
                <div className="enroll-student-form-group">
                  <label>Mother's Education Level:</label>
                  <select
                    name="mother_educ_lvl"
                    value={newStudentData.mother_educ_lvl}
                    onChange={handleAddChange}
                    className={errors.mother_educ_lvl ? "error" : ""}
                  >
                    <option value="">Select Education Level</option>
                    {EDUCATION_LEVELS.map((level) => (
                      <option key={level} value={level}>{level}</option>
                    ))}
                  </select>
                  {errors.mother_educ_lvl && <span className="student-mgmt-error">{errors.mother_educ_lvl}</span>}
                </div>
                <div className="enroll-student-form-group">
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
                <div className="enroll-student-form-group">
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
                <div className="enroll-student-form-group">
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
                <div className="enroll-student-form-group">
                  <label>Father's Education Level:</label>
                  <select
                    name="father_educ_lvl"
                    value={newStudentData.father_educ_lvl}
                    onChange={handleAddChange}
                    className={errors.father_educ_lvl ? "error" : ""}
                  >
                    <option value="">Select Education Level</option>
                    {EDUCATION_LEVELS.map((level) => (
                      <option key={level} value={level}>{level}</option>
                    ))}
                  </select>
                  {errors.father_educ_lvl && <span className="student-mgmt-error">{errors.father_educ_lvl}</span>}
                </div>
                <div className="enroll-student-form-group">
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
                <div className="enroll-student-form-group">
                  <label>Annual Household Income:</label>
                  <input
                    type="text"
                    name="annual_hshld_income"
                    value={newStudentData.annual_hshld_income}
                    onChange={handleAddChange}
                    className={errors.annual_hshld_income ? "error" : ""}
                  />
                  {errors.annual_hshld_income && <span className="student-mgmt-error">{errors.annual_hshld_income}</span>}
                </div>
                <div className="enroll-student-form-group">
                  <label>Number of Siblings:</label>
                  <input
                    type="number"
                    name="number_of_siblings"
                    value={newStudentData.number_of_siblings}
                    onChange={handleAddChange}
                    min="0"
                    max="20"
                    step="1"
                    className={errors.number_of_siblings ? "error" : ""}
                  />
                  {errors.number_of_siblings && <span className="student-mgmt-error">{errors.number_of_siblings}</span>}
                </div>
              </div>
            </div>

            <div className="enroll-student-modal-actions">
              <div className="enroll-student-tab-navigation">
                {activeTab !== 'basic' && (
                  <button 
                    type="button" 
                    className="enroll-student-btn" 
                    onClick={() => setActiveTab(activeTab === 'family' ? 'contact' : 'basic')}
                  >
                    Previous
                  </button>
                )}
                {activeTab !== 'family' && (
                  <button 
                    type="button" 
                    className="enroll-student-btn" 
                    onClick={() => setActiveTab(activeTab === 'basic' ? 'contact' : 'family')}
                  >
                    Next
                  </button>
                )}
              </div>
              <div className="enroll-student-form-actions">
                <button className="enroll-student-btn enroll-student-btn-edit" onClick={saveNewStudent}>
                  Save
                </button>
                <button className="enroll-student-btn" onClick={cancelAdding}>
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

export default EnrollStudentManagement;
