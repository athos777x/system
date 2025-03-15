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
  const [uploadingImage, setUploadingImage] = useState(false);
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

      // Check if we have a cached profile picture URL in localStorage
      const cachedProfilePicture = localStorage.getItem('profilePictureUrl');
      if (cachedProfilePicture) {
        // Add a cache-busting parameter
        const timestamp = new Date().getTime();
        setProfilePicture(`${cachedProfilePicture}?t=${timestamp}`);
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
        
        // Fetch profile picture if available and we don't have a cached one
        if (!cachedProfilePicture) {
          try {
            const profilePicResponse = await axios.get(`http://localhost:3001/api/profile-picture/${userId}`);
            if (profilePicResponse.data && profilePicResponse.data.imageUrl) {
              const imageUrl = profilePicResponse.data.imageUrl;
              // Add a cache-busting parameter
              const timestamp = new Date().getTime();
              setProfilePicture(`${imageUrl}?t=${timestamp}`);
              // Cache the URL in localStorage
              localStorage.setItem('profilePictureUrl', imageUrl);
            }
          } catch (err) {
            console.log('Profile picture not available or error fetching it:', err.message);
            // Keep the default profile picture
          }
        }
        
        setLoading(false);
      } catch (err) {
        console.error('Error fetching user info:', err.message);
        setError(err.response ? err.response.data.error : 'Failed to fetch user information');
        setLoading(false);
      }
    };

    fetchUserInfo();
  }, []);

  const handleProfilePictureChange = async (e) => {
    const file = e.target.files[0];
    if (file) {
      // Show local preview immediately
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfilePicture(reader.result);
      };
      reader.readAsDataURL(file);
      
      // Upload to server
      await uploadProfilePicture(file);
    }
  };
  
  const uploadProfilePicture = async (file) => {
    const userId = localStorage.getItem('userId');
    if (!userId) {
      console.error('User ID not found. Please log in again.');
      return;
    }
    
    try {
      setUploadingImage(true);
      
      // Create form data for file upload
      const formData = new FormData();
      formData.append('profilePicture', file);
      formData.append('userId', userId);
      
      // Upload the image
      const response = await axios.post(
        'http://localhost:3001/api/upload-profile-picture',
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        }
      );
      
      // Update the profile picture with the URL returned from the server
      if (response.data && response.data.imageUrl) {
        // Add a timestamp as a cache-busting query parameter
        const timestamp = new Date().getTime();
        const imageUrlWithCacheBuster = `${response.data.imageUrl}?t=${timestamp}`;
        setProfilePicture(imageUrlWithCacheBuster);
        
        // Also update the image in localStorage to persist across page refreshes
        localStorage.setItem('profilePictureUrl', response.data.imageUrl);
        
        // Dispatch a storage event to notify other components of the change
        // This is needed because localStorage events don't trigger in the same window
        window.dispatchEvent(new Event('storage'));
        
        // Dispatch a custom event for same-window updates
        window.dispatchEvent(new Event('storage-local'));
        
        console.log('Profile picture uploaded successfully');
      }
      
      setUploadingImage(false);
    } catch (error) {
      console.error('Error uploading profile picture:', error.response?.data || error.message);
      setUploadingImage(false);
      // Show error message to user
      alert('Failed to upload profile picture. Please try again.');
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

  // Add this function to get the profile picture URL with a cache buster
  const getProfilePictureWithCacheBuster = (url) => {
    if (!url) return 'https://via.placeholder.com/150';
    
    // Add a timestamp as a cache-busting query parameter if it's not already there
    if (url.includes('?t=')) return url;
    
    const timestamp = new Date().getTime();
    return `${url}?t=${timestamp}`;
  };

  if (loading) {
    return <div className="user-profile-loading-state">Loading user information...</div>;
  }

  if (error) {
    return <div className="user-profile-error-state">{error}</div>;
  }

  return (
    <div className="user-profile-wrapper">
      <h1 className="user-profile-heading">Profile</h1>
      
      <div className="user-profile-content-vertical">
        {/* Profile picture section */}
        <div className="user-profile-picture-section">
          <div className="user-profile-image-container">
            <img 
              src={getProfilePictureWithCacheBuster(profilePicture)} 
              alt="Profile" 
              className="user-profile-image"
              key={profilePicture} // Add a key to force re-render when the URL changes
            />
            {uploadingImage && (
              <div className="user-profile-image-upload-overlay">
                <div className="user-profile-spinner"></div>
                <p>Uploading...</p>
              </div>
            )}
          </div>
          <label className="user-profile-change-picture-btn" disabled={uploadingImage}>
            {uploadingImage ? 'Uploading...' : 'Change Picture'}
            <input
              type="file"
              accept="image/*"
              onChange={handleProfilePictureChange}
              style={{ display: 'none' }}
              disabled={uploadingImage}
            />
          </label>
        </div>
        
        {/* User information section */}
        <div className="user-profile-info-section">
          <div className="user-profile-form">
            <div className="user-profile-form-row">
              <div className="user-profile-form-group">
                <label>First Name</label>
                <div className="user-profile-info-value">{userInfo.firstname}</div>
              </div>
              <div className="user-profile-form-group">
                <label>Middle Name</label>
                <div className="user-profile-info-value">{userInfo.middle_name || '-'}</div>
              </div>
            </div>
            
            <div className="user-profile-form-row">
              <div className="user-profile-form-group">
                <label>Last Name</label>
                <div className="user-profile-info-value">{userInfo.lastname}</div>
              </div>
              <div className="user-profile-form-group">
                <label>Email</label>
                <div className="user-profile-info-value">{userInfo.email || '-'}</div>
              </div>
            </div>
            
            <div className="user-profile-form-row">
              <div className="user-profile-form-group">
                <label>Username</label>
                <div className="user-profile-info-value">{userInfo.username}</div>
              </div>
              <div className="user-profile-form-group">
                <label>Password</label>
                {isEditing ? (
                  <div className="user-profile-password-field" style={{ position: 'relative' }}>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      className="user-profile-form-control"
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
                  <div className="user-profile-info-value">••••••••</div>
                )}
              </div>
            </div>
            
            <div className="user-profile-form-actions">
              {!isEditing ? (
                <button
                  type="button"
                  className="user-profile-edit-btn"
                  onClick={handleEditClick}
                >
                  Change Password
                </button>
              ) : (
                <div className="user-profile-edit-buttons">
                  <button
                    type="button"
                    className="user-profile-save-btn"
                    onClick={handleSaveClick}
                  >
                    Save
                  </button>
                  <button
                    type="button"
                    className="user-profile-cancel-btn"
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
