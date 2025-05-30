import React, { useState, useEffect, useCallback } from 'react';
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
  const [roleName, setRoleName] = useState('');
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

  // Add state for coordinator's grade level
  const [coordinatorGradeLevel, setCoordinatorGradeLevel] = useState(null);

  // Add this state for tab management
  const [activeTab, setActiveTab] = useState('basic');

  // Add state for student enrollment modal
  const [showEnrollModal, setShowEnrollModal] = useState(false);
  const [availableStudents, setAvailableStudents] = useState([]);
  const [selectedStudentsToEnroll, setSelectedStudentsToEnroll] = useState([]);
  const [enrollStudentSearchTerm, setEnrollStudentSearchTerm] = useState('');
  const [filteredAvailableStudents, setFilteredAvailableStudents] = useState([]);
  const [selectedGradeLevel, setSelectedGradeLevel] = useState('');

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

  // Memoize the fetchStudents function with useCallback
  const fetchStudents = useCallback(async (appliedFilters = {}) => {
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
      
      // Apply grade level restriction for grade level coordinators
      if (roleName === 'grade_level_coordinator' && coordinatorGradeLevel) {
        filteredParams.grade = coordinatorGradeLevel.toString();
      }
  
      // ✅ Always use apply-enrollment endpoint for this component
      // This ensures all roles including class advisers can see inactive students
      const endpoint = 'http://localhost:3001/students/apply-enrollment';
  
      // ✅ Make request with correct filters
      const response = await axios.get(endpoint, { params: filteredParams });
  
      console.log('Response from server:', response.data);
  
      // ✅ Ensure sorting by `current_yr_lvl` (highest grade first)
      const sortedStudents = response.data.sort((a, b) => b.lastname);
      
      // Apply coordinator grade level filtering to the results if needed
      let filteredStudents = sortedStudents;
      if (roleName === 'grade_level_coordinator' && coordinatorGradeLevel) {
        filteredStudents = sortedStudents.filter(student => 
          student.current_yr_lvl.toString() === coordinatorGradeLevel.toString()
        );
      }
      
      setStudents(filteredStudents);
      setFilteredStudents(filteredStudents);
    } catch (error) {
      if (error.response) {
        console.error('Server responded with an error:', error.response.data);
      } else if (error.request) {
        console.error('No response received from server. Request:', error.request);
      } else {
        console.error('Error setting up request:', error.message);
      }
    }
  }, [roleName, coordinatorGradeLevel]);

  useEffect(() => {
    const userId = localStorage.getItem('userId'); // Retrieve userId from localStorage
    if (userId) {
      console.log(`Retrieved userId from localStorage: ${userId}`); // Debugging log
      fetchUserRole(userId);
    } else {
      console.error('No userId found in localStorage');
    }
  }, []);

  useEffect(() => {
    fetchSchoolYears();
    fetchSections();
  }, []);

  // Add useEffect hook to refresh data when fetchStudents changes
  useEffect(() => {
    fetchStudents();
  }, [fetchStudents]);

  // Add useEffect hook to refresh data when coordinatorGradeLevel changes
  useEffect(() => {
    if (coordinatorGradeLevel) {
      // Refresh student data with the coordinator's grade level filter
      fetchStudents({ grade: coordinatorGradeLevel.toString() });
    }
  }, [coordinatorGradeLevel, fetchStudents]);

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

const enrollStudent = async (studentId, gradeLevel) => {
  try {
    // Log the attempt to enroll a student
    console.log('Attempting to enroll student with ID:', studentId, 'to grade level:', gradeLevel);

    // Get active school year from server
    const schoolYearResponse = await axios.get('http://localhost:3001/active-school-year');
    const activeSchoolYear = schoolYearResponse.data.school_year;
    
    // Define the payload with status 'active' and the next grade level
    const payload = {
      school_year: activeSchoolYear,
      status: 'active',
      grade_level: gradeLevel
    };

    // Send the PUT request to enroll the student
    const response = await axios.put(`http://localhost:3001/students/${studentId}/enroll-student`, payload);

    // Log and check for successful response
    if (response.status === 200 || response.status === 201) {
      console.log('Enrollment successful:', response.data);
      alert('Student registered successfully');
      fetchStudents(); // Refresh the student list after enrolling
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
    fetchStudents();
  } catch (error) {
    console.error('Error applying for enrollment:', error);
    alert('Failed to apply for enrollment. Please try again.');
  }
  fetchStudents();
};

// const validateStudent = async (studentId) => {
//   try {
//     console.log('Validating enrollment for student ID:', studentId);

//     // Send the POST request to validate the enrollment
//     const response = await axios.post('http://localhost:3001/validate-enrollment', { studentId });

//     // Log and check for successful response
//     if (response.status === 200) {
//       console.log('Validation successful:', response.data);
//       alert('Enrollment validated successfully');
//       await fetchStudents(); // Refresh the student list after validating
//     } else {
//       console.warn('Failed to validate enrollment, non-200 response:', response);
//       alert('Failed to validate enrollment.');
//     }
//   } catch (error) {
//     if (error.response) {
//       console.error('Error response:', error.response.data);
//       alert('Error validating the enrollment: ' + (error.response.data.error || 'Unknown error'));
//     } else if (error.request) {
//       console.error('No response from server:', error.request);
//       alert('No response from the server. Please check your connection.');
//     } else {
//       console.error('Error setting up request:', error.message);
//       alert('An error occurred: ' + error.message);
//     }
//   }
// };

// const approveElective = async (studentElectiveId) => {
//   try {
//       const response = await axios.post('http://localhost:3001/approve-elective', {
//           studentElectiveId
//       });

//       if (response.data.message) {
//           alert(response.data.message);
//           await fetchStudents(); // Refresh student list after approval
//       } else {
//           alert('Failed to approve elective.');
//       }
//   } catch (error) {
//       console.error('Error approving elective:', error);
//       alert('An error occurred while approving the elective.');
//   }
// };

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

  const fetchUserRole = async (userId) => {
    try {
      console.log(`Fetching role for user ID: ${userId}`); // Debugging log
      const response = await axios.get(`http://localhost:3001/user-role/${userId}`);
      if (response.status === 200) {
        console.log('Response received:', response.data); // Debugging log
        setRoleName(response.data.role_name);
        console.log('Role name set to:', response.data.role_name); // Debugging log
        
        // If user is a grade level coordinator, fetch their assigned grade level
        if (response.data.role_name === 'grade_level_coordinator') {
          fetchCoordinatorGradeLevel(userId);
        }
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

  const fetchCoordinatorGradeLevel = async (userId) => {
    try {
      const response = await axios.get(`http://localhost:3001/coordinator-grade-level/${userId}`);
      if (response.status === 200 && response.data.gradeLevel) {
        console.log('Coordinator grade level:', response.data.gradeLevel);
        setCoordinatorGradeLevel(response.data.gradeLevel);
        // Auto-set the grade filter to the coordinator's assigned grade level
        setFilters(prev => ({ ...prev, grade: response.data.gradeLevel.toString() }));
      }
    } catch (error) {
      console.error('Error fetching coordinator grade level:', error);
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

  // Add function to fetch available students for enrollment
  const fetchAvailableStudents = async () => {
    try {
      console.log('Fetching available students...');
      const response = await axios.get('http://localhost:3001/students/available-for-enrollment');
      
      console.log('Raw student data received:', response.data);
      
      if (!response.data || !Array.isArray(response.data)) {
        console.error('Unexpected response format:', response.data);
        setAvailableStudents([]);
        setFilteredAvailableStudents([]);
        return;
      }
      
      // Normalize the student data to ensure consistent property naming
      const normalizedStudents = response.data.map(student => {
        // Create a normalized student object
        const normalizedStudent = {
          ...student,
          // Ensure all required properties exist with fallbacks
          student_id: student.student_id,
          lastname: student.lastname || '',
          firstname: student.firstname || '',
          // Create student_name if it doesn't exist
          student_name: student.student_name || 
                       (student.lastname && student.firstname ? 
                        `${student.lastname}, ${student.firstname}` : 
                        'Unknown'),
          // Handle both possible grade level property names
          current_yr_lvl: student.current_yr_lvl || student.grade_level || '',
          grade_level: student.grade_level || student.current_yr_lvl || ''
        };
        
        return normalizedStudent;
      });
      
      console.log('Normalized student data:', normalizedStudents);
  
      // Sort students alphabetically by lastname
      const sortedStudents = normalizedStudents.sort((a, b) =>
        a.lastname.localeCompare(b.lastname) || a.firstname.localeCompare(b.firstname)
      );
      
      let filteredStudents = sortedStudents;
      
      // If user is a grade level coordinator, filter by their assigned grade level
      if (roleName === 'grade_level_coordinator' && coordinatorGradeLevel) {
        filteredStudents = sortedStudents.filter(student => {
          const studentGradeLevel = student.current_yr_lvl || student.grade_level;
          return studentGradeLevel && studentGradeLevel.toString() === coordinatorGradeLevel.toString();
        });
        
        // Also set the selected grade level to the coordinator's assigned grade level
        setSelectedGradeLevel(coordinatorGradeLevel.toString());
      }
  
      setAvailableStudents(filteredStudents);
      setFilteredAvailableStudents(filteredStudents);
      console.log('Available students loaded:', filteredStudents.length);
      console.log('Sample student data:', filteredStudents[0]);
    } catch (error) {
      console.error('Error fetching available students:', error);
      alert('Error fetching available students for enrollment');
      setAvailableStudents([]);
      setFilteredAvailableStudents([]);
    }
  };
  

  // Function to filter available students based on search term and grade level
  const filterAvailableStudents = (searchTerm, gradeLevel) => {
    // Check if availableStudents is defined and not empty
    if (!availableStudents || availableStudents.length === 0) {
      return;
    }
    
    let filtered = availableStudents;
    
    // Apply search term filter if it exists
    if (searchTerm && searchTerm.trim() !== '') {
      // Log what we're searching for debugging
      console.log('Searching for:', searchTerm);
      
      filtered = filtered.filter(student => {
        if (!student) return false;
        
        // Check for student_name property first (combined name)
        if (student.student_name && 
            student.student_name.toLowerCase().includes(searchTerm)) {
          return true;
        }
        
        // Check lastname
        if (student.lastname && 
            student.lastname.toLowerCase().includes(searchTerm)) {
          return true;
        }
        
        // Check firstname
        if (student.firstname && 
            student.firstname.toLowerCase().includes(searchTerm)) {
          return true;
        }
        
        // Check combined lastname + firstname manually
        const fullName = `${student.lastname}, ${student.firstname}`.toLowerCase();
        if (fullName.includes(searchTerm)) {
          return true;
        }
        
        // Check ID
        if (student.student_id && 
            student.student_id.toString().includes(searchTerm)) {
          return true;
        }
        
        return false;
      });
      
      // Log filtered results for debugging
      console.log('Filtered results length:', filtered.length);
    }
    
    // For grade level coordinators, always filter by their assigned grade level
    if (roleName === 'grade_level_coordinator' && coordinatorGradeLevel) {
      filtered = filtered.filter(student => 
        student && student.current_yr_lvl && 
        student.current_yr_lvl.toString() === coordinatorGradeLevel.toString()
      );
    } 
    // Otherwise, apply grade level filter if selected
    else if (gradeLevel) {
      filtered = filtered.filter(student => 
        student && (student.current_yr_lvl || student.grade_level) && 
        (student.current_yr_lvl?.toString() === gradeLevel || 
         student.grade_level?.toString() === gradeLevel)
      );
    }
    
    // Sort alphabetically by last name
    filtered.sort((a, b) => {
      if (!a.lastname || !b.lastname) return 0;
      return a.lastname.localeCompare(b.lastname) || 
             (a.firstname && b.firstname ? a.firstname.localeCompare(b.firstname) : 0);
    });
    
    setFilteredAvailableStudents(filtered);
  };

  // Function to handle the search in enrollment modal
  const handleEnrollmentSearch = (e) => {
    const searchTerm = e.target.value.trim().toLowerCase();
    console.log('Search term entered:', searchTerm); // Debug log
    
    setEnrollStudentSearchTerm(searchTerm);
    
    // Call filterAvailableStudents with current search term and grade level
    filterAvailableStudents(searchTerm, selectedGradeLevel);
  };

  // Function to handle grade level filter change
  const handleGradeLevelChange = (e) => {
    const gradeLevel = e.target.value;
    setSelectedGradeLevel(gradeLevel);
    
    filterAvailableStudents(enrollStudentSearchTerm, gradeLevel);
  };

  // Function to open the enrollment modal
  const openEnrollModal = () => {
    fetchAvailableStudents();
    setShowEnrollModal(true);
    setSelectedStudentsToEnroll([]);
    setEnrollStudentSearchTerm('');
    setSelectedGradeLevel('');
  };

  // Function to close the enrollment modal
  const closeEnrollModal = () => {
    setShowEnrollModal(false);
    setSelectedStudentsToEnroll([]);
    setEnrollStudentSearchTerm('');
    setSelectedGradeLevel('');
  };

  // Function to handle student selection for enrollment
  const handleStudentSelection = (studentId) => {
    setSelectedStudentsToEnroll(prevSelected => {
      if (prevSelected.includes(studentId)) {
        return prevSelected.filter(id => id !== studentId);
      } else {
        return [...prevSelected, studentId];
      }
    });
  };

  // Function to execute the enrollment of the selected students
  const executeEnrollment = async () => {
    if (selectedStudentsToEnroll.length === 0) {
      alert('Please select at least one student to enroll');
      return;
    }
    
    try {
      // Show confirmation dialog
      if (window.confirm(`Are you sure you want to enroll ${selectedStudentsToEnroll.length} student(s)?`)) {
        // Use Promise.all to enroll all selected students in parallel
        const enrollmentPromises = selectedStudentsToEnroll.map(studentId => {
          // Find the student to get their current grade level
          const student = filteredAvailableStudents.find(s => s.student_id === studentId);
          
          if (!student) {
            console.error('Student not found:', studentId);
            return Promise.reject(new Error(`Student with ID ${studentId} not found`));
          }
          
          // Get grade level, checking both possible property names
          const currentGradeLevel = student.grade_level || student.current_yr_lvl;
          
          if (!currentGradeLevel) {
            console.error('Grade level missing for student:', student);
            return Promise.reject(new Error(`Grade level information missing for student ${studentId}`));
          }
          
          const nextGradeLevel = parseInt(currentGradeLevel) + 1;
          return enrollStudent(studentId, nextGradeLevel);
        });
        
        await Promise.all(enrollmentPromises);
        alert(`Successfully enrolled ${selectedStudentsToEnroll.length} student(s)`);
        closeEnrollModal();
        await fetchStudents(); // Refresh the list
      }
    } catch (error) {
      console.error('Error enrolling students:', error);
      alert('Error enrolling students. Please try again.');
    }
  };

  return (
    <div className="enroll-student-container">
      <div className="enroll-student-header">
        <h1 className="enroll-student-title">Enroll Student Management</h1>
        {(roleName === 'registrar' || roleName === 'subject_teacher' || roleName === 'class_adviser' || roleName === 'grade_level_coordinator') && (
          <button className="enroll-student-add-btn" onClick={openEnrollModal}>
            Request Enrollment for Old Student
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
        coordinatorGradeLevel={coordinatorGradeLevel}
        roleName={roleName}
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
                    {(roleName === 'registrar' || roleName === 'class_adviser' || roleName === 'grade_level_coordinator' || roleName === 'subject_teacher') && student.active_status === 'inactive' && (
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
                                        <option value="">All Grade Levels</option>
                                        <option value="7">Grade 7</option>
                                        <option value="8">Grade 8</option>
                                        <option value="9">Grade 9</option>
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

      {/* Enroll Student Modal */}
      {showEnrollModal && (
        <div className="enroll-student-modal">
          <div className="enroll-student-modal-content enroll-student-modal-large">
            <h2>Enroll Students</h2>
            <p>Select students from the list below to enroll</p>
            
            <div className="enroll-student-filters">
              <div className="enroll-student-search">
                <input
                  type="text"
                  placeholder="Search by name or ID..."
                  value={enrollStudentSearchTerm}
                  onChange={handleEnrollmentSearch}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      // Prevent form submission if inside a form
                      e.preventDefault();
                      // Re-apply the filter explicitly when Enter is pressed
                      filterAvailableStudents(enrollStudentSearchTerm, selectedGradeLevel);
                    }
                  }}
                  className="enroll-student-search-input"
                />
                {enrollStudentSearchTerm && (
                  <button 
                    className="clear-search-btn" 
                    onClick={() => {
                      setEnrollStudentSearchTerm('');
                      filterAvailableStudents('', selectedGradeLevel);
                    }}
                    style={{
                      position: 'absolute',
                      right: '10px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'transparent',
                      border: 'none',
                      cursor: 'pointer'
                    }}
                  >
                    ✕
                  </button>
                )}
              </div>
              
              <div className="enroll-student-grade-filter">
                <select
                  value={selectedGradeLevel}
                  onChange={handleGradeLevelChange}
                  className="enroll-student-grade-select"
                  disabled={roleName === 'grade_level_coordinator' && coordinatorGradeLevel}
                >
                  <option value="">All Grade Levels</option>
                  {roleName === 'grade_level_coordinator' && coordinatorGradeLevel ? (
                    <option value={coordinatorGradeLevel}>Grade {coordinatorGradeLevel}</option>
                  ) : (
                    <>
                      <option value="7">Grade 7</option>
                      <option value="8">Grade 8</option>
                      <option value="9">Grade 9</option>
                    </>
                  )}
                </select>
              </div>
            </div>
            
            <div className="enroll-student-list">
              {filteredAvailableStudents.length > 0 ? (
                <table className="enroll-student-table">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Name</th>
                      <th>Current Level</th>
                      <th>Enroll to Grade</th>
                      <th width="50px">
                        <input 
                          type="checkbox" 
                          onChange={(e) => {
                            if (e.target.checked) {
                              // Select all students
                              setSelectedStudentsToEnroll(filteredAvailableStudents.map(s => s.student_id));
                            } else {
                              // Deselect all
                              setSelectedStudentsToEnroll([]);
                            }
                          }}
                          checked={
                            filteredAvailableStudents.length > 0 && 
                            selectedStudentsToEnroll.length === filteredAvailableStudents.length
                          }
                        />
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredAvailableStudents.map((student) => (
                      <tr 
                        key={student.student_id}
                        className={selectedStudentsToEnroll.includes(student.student_id) ? 'selected-row' : ''}
                        onClick={() => handleStudentSelection(student.student_id)}
                      >
                        <td>{student.student_id}</td>
                        <td>{student.student_name || `${student.lastname}, ${student.firstname}`}</td>
                        <td>{student.grade_level || student.current_yr_lvl}</td>
                        <td>{parseInt(student.grade_level || student.current_yr_lvl) + 1}</td>
                        <td>
                          <input
                            type="checkbox"
                            checked={selectedStudentsToEnroll.includes(student.student_id)}
                            onChange={() => handleStudentSelection(student.student_id)}
                            onClick={(e) => e.stopPropagation()}
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p className="no-results">No students available for enrollment or matching your search.</p>
              )}
            </div>
            
            <div className="enrollment-summary">
              <p>{selectedStudentsToEnroll.length} student(s) selected for enrollment</p>
            </div>
            
            <div className="enroll-student-modal-actions enrollment-actions-right">
              <button className="enroll-student-modal-btn enroll-student-modal-btn-cancel" onClick={closeEnrollModal}>
                Cancel
              </button>
              <button 
                className="enroll-student-modal-btn enroll-student-modal-btn-confirm" 
                onClick={executeEnrollment}
                disabled={selectedStudentsToEnroll.length === 0}
              >
                Enroll Selected Students
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default EnrollStudentManagement;
