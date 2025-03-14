import React, { useState, useEffect } from 'react';
import { FiEye, FiEyeOff } from 'react-icons/fi';
import '../CssFiles/profile.css';
import axios from 'axios'; // For API calls
import { useNavigate } from 'react-router-dom'; // For navigation

const ProfilePage = () => {
  const navigate = useNavigate();
  const [profilePicture, setProfilePicture] = useState('https://via.placeholder.com/150');
  const [userInfo, setUserInfo] = useState({
    firstname: '',
    middle_name: '',
    lastname: '',
    email: '',
    username: '',
    password: '',
  });
  const [originalPassword, setOriginalPassword] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Fetch user information from API
    const fetchUserInfo = async () => {
      const userId = localStorage.getItem('userId'); // Retrieve userId from localStorage
      if (!userId) {
        setError('User ID not found. Please log in again.');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        // Get basic user info
        const response = await axios.get(`http://localhost:3001/api/user-info/${userId}`);
        const userData = response.data;
        
        // Get role-specific info including email
        const roleId = userData.role_id;
        let emailAddress = '';
        
        // Fetch email based on role
        if (roleId === 2) { // Student
          const studentResponse = await axios.get(`http://localhost:3001/student/profile/${userId}`);
          emailAddress = studentResponse.data.email_address || '';
        } else {
          // For employees, we might need another endpoint
          // This is a placeholder - you'll need to implement the actual endpoint
          try {
            const employeeResponse = await axios.get(`http://localhost:3001/employee/profile/${userId}`);
            emailAddress = employeeResponse.data.email_address || '';
          } catch (err) {
            console.log('Employee email not available');
          }
        }
        
        // Combine the data
        setUserInfo({
          ...userData,
          email: emailAddress
        });
        setOriginalPassword(userData.password);
        
        setLoading(false);
      } catch (err) {
        console.error('Error fetching user info:', err.message);
        setError(err.response ? err.response.data.error : 'Failed to fetch user information');
        setLoading(false);
      }
    };

    fetchUserInfo();
  }, []);

  const handleProfilePictureChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfilePicture(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const handleEditClick = () => {
    setIsEditing(true);
  };

  const handleCancelClick = () => {
    // Reset password to original value
    setUserInfo(prev => ({
      ...prev,
      password: originalPassword
    }));
    setIsEditing(false);
    setShowPassword(false);
  };

  const handleSaveClick = async () => {
    const userId = localStorage.getItem('userId'); // Retrieve userId from localStorage

    if (!userId) {
      console.error('User ID not found. Please log in again.');
      return;
    }

    const payload = {
      firstname: userInfo.firstname,
      middle_name: userInfo.middle_name,
      lastname: userInfo.lastname,
      username: userInfo.username,
      password: userInfo.password,
    };

    try {
      const response = await axios.put(`http://localhost:3001/api/user-info/${userId}`, payload);
      console.log('User info saved successfully:', response.data);
      setOriginalPassword(userInfo.password);
      setIsEditing(false);
      setShowPassword(false);
    } catch (error) {
      console.error('Error saving user info:', error.response?.data || error.message);
    }
  };

  if (loading) {
    return <div className="loading-state">Loading user information...</div>;
  }

  if (error) {
    return <div className="error-state">{error}</div>;
  }

  return (
    <div className="profile-wrapper">
      <h1 className="profile-heading">Profile</h1>
      
      <div className="profile-content-vertical">
        {/* Profile picture section */}
        <div className="profile-picture-section">
          <div className="profile-image-container">
            <img src={profilePicture} alt="Profile" className="profile-image" />
          </div>
          <label className="change-picture-btn">
            Change Picture
            <input
              type="file"
              accept="image/*"
              onChange={handleProfilePictureChange}
              style={{ display: 'none' }}
            />
          </label>
        </div>
        
        {/* User information section */}
        <div className="profile-info-section">
          <div className="profile-form">
            <div className="form-row">
              <div className="form-group">
                <label>First Name</label>
                <div className="info-value">{userInfo.firstname}</div>
              </div>
              <div className="form-group">
                <label>Middle Name</label>
                <div className="info-value">{userInfo.middle_name || '-'}</div>
              </div>
            </div>
            
            <div className="form-row">
              <div className="form-group">
                <label>Last Name</label>
                <div className="info-value">{userInfo.lastname}</div>
              </div>
              <div className="form-group">
                <label>Email</label>
                <div className="info-value">{userInfo.email || '-'}</div>
              </div>
            </div>
            
            <div className="form-row">
              <div className="form-group">
                <label>Username</label>
                <div className="info-value">{userInfo.username}</div>
              </div>
              <div className="form-group">
                <label>Password</label>
                {isEditing ? (
                  <div className="password-field" style={{ position: 'relative' }}>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      className="form-control"
                      value={userInfo.password}
                      onChange={(e) => setUserInfo({...userInfo, password: e.target.value})}
                      style={{ paddingRight: '40px' }}
                    />
                    <button
                      type="button"
                      onClick={togglePasswordVisibility}
                      style={{
                        position: 'absolute',
                        right: '10px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer'
                      }}
                    >
                      {showPassword ? <FiEyeOff /> : <FiEye />}
                    </button>
                  </div>
                ) : (
                  <div className="info-value">••••••••</div>
                )}
              </div>
            </div>
            
            <div className="form-actions">
              {!isEditing ? (
                <button
                  type="button"
                  className="edit-profile-btn"
                  onClick={handleEditClick}
                >
                  Change Password
                </button>
              ) : (
                <div className="edit-buttons">
                  <button
                    type="button"
                    className="save-profile-btn"
                    onClick={handleSaveClick}
                  >
                    Save
                  </button>
                  <button
                    type="button"
                    className="cancel-profile-btn"
                    onClick={handleCancelClick}
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
