import React, { useState, useEffect } from 'react';
import profilePic from '../png/user_pp.jpg'; // Default profile picture
import '../CssFiles/profile.css'; // CSS for styling
import axios from 'axios'; // For API calls
import { useNavigate } from 'react-router-dom'; // For navigation

function ProfilePage() {
  const navigate = useNavigate();

  const [profilePicture, setProfilePicture] = useState(profilePic); // Profile picture state
  const [userInfo, setUserInfo] = useState({
    firstname: '',
    middle_name: '',
    lastname: '',
    username: '',
    password: '', // Password added
  }); // State to store user information
  const [isEditing, setIsEditing] = useState(false); // State to toggle editing
  const [loading, setLoading] = useState(true); // Loading state
  const [error, setError] = useState(null); // Error state
  const [showPassword, setShowPassword] = useState(false); // State to toggle password visibility

  useEffect(() => {
    const fetchUserInfo = async () => {
      const userId = localStorage.getItem('userId'); // Retrieve userId from localStorage
      if (!userId) {
        setError('User ID not found. Please log in again.');
        setLoading(false);
        return;
      }

      try {
        const response = await axios.get(`http://localhost:3001/api/user-info/${userId}`); // API URL
        setUserInfo(response.data);
      } catch (err) {
        console.error('Error fetching user info:', err.message);
        setError(err.response ? err.response.data.error : 'Failed to fetch user information');
      } finally {
        setLoading(false);
      }
    };

    fetchUserInfo();
  }, []);

  const handleProfilePictureChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setProfilePicture(reader.result); // Set profile picture preview
      };
      reader.readAsDataURL(file);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setUserInfo((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
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

    console.log('Saving user info with payload:', payload);

    try {
      const response = await axios.put(`http://localhost:3001/api/user-info/${userId}`, payload);
      console.log('User info saved successfully:', response.data);
      setIsEditing(false); // Exit editing mode after successful save
    } catch (error) {
      console.error('Error saving user info:', error.response?.data || error.message);
    }
  };

  if (loading) {
    return (
      <div className="profile-page">
        <div className="loading-state">Loading profile information...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="profile-page">
        <div className="error-state">Error: {error}</div>
      </div>
    );
  }

  return (
    <div className="profile-page">
      <h1>My Profile</h1>
      <div className="profile-card">
        <div className="profile-pic-container">
          <img src={profilePicture} alt="Profile" className="profile-pic-large" />
          <input
            type="file"
            accept="image/*"
            id="profile-pic-input"
            onChange={handleProfilePictureChange}
            style={{ display: 'none' }}
          />
          <label htmlFor="profile-pic-input" className="upload-button">
            Change Profile Picture
          </label>
        </div>

        <div className="profile-info">
          {isEditing ? (
            <>
              <p>
                <strong>First Name</strong>
                <input
                  type="text"
                  name="firstname"
                  value={userInfo.firstname}
                  onChange={handleInputChange}
                  placeholder="Enter first name"
                />
              </p>
              <p>
                <strong>Middle Name</strong>
                <input
                  type="text"
                  name="middle_name"
                  value={userInfo.middle_name || ''}
                  onChange={handleInputChange}
                  placeholder="Enter middle name"
                />
              </p>
              <p>
                <strong>Last Name</strong>
                <input
                  type="text"
                  name="lastname"
                  value={userInfo.lastname}
                  onChange={handleInputChange}
                  placeholder="Enter last name"
                />
              </p>
              <p>
                <strong>Username</strong>
                <input
                  type="text"
                  name="username"
                  value={userInfo.username}
                  onChange={handleInputChange}
                  placeholder="Enter username"
                />
              </p>
              <p>
                <strong>Password</strong>
                <div style={{ display: 'flex', alignItems: 'center', flex: 1 }}>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    value={userInfo.password}
                    onChange={handleInputChange}
                    placeholder="Enter password"
                    style={{ flex: 1 }}
                  />
                  <button 
                    type="button" 
                    onClick={() => setShowPassword(prev => !prev)} 
                    className="password-toggle-button"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? (
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16">
                        <path d="M16 8s-3-5.5-8-5.5S0 8 0 8s3 5.5 8 5.5S16 8 16 8zM1.173 8a13.133 13.133 0 0 1 1.66-2.043C4.12 4.668 5.88 3.5 8 3.5c2.12 0 3.879 1.168 5.168 2.457A13.133 13.133 0 0 1 14.828 8c-.058.087-.122.183-.195.288-.335.48-.83 1.12-1.465 1.755C11.879 11.332 10.119 12.5 8 12.5c-2.12 0-3.879-1.168-5.168-2.457A13.134 13.134 0 0 1 1.172 8z"/>
                        <path d="M8 5.5a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5zM4.5 8a3.5 3.5 0 1 1 7 0 3.5 3.5 0 0 1-7 0z"/>
                      </svg>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16">
                        <path d="M13.359 11.238C15.06 9.72 16 8 16 8s-3-5.5-8-5.5a7.028 7.028 0 0 0-2.79.588l.77.771A5.944 5.944 0 0 1 8 3.5c2.12 0 3.879 1.168 5.168 2.457A13.134 13.134 0 0 1 14.828 8c-.058.087-.122.183-.195.288-.335.48-.83 1.12-1.465 1.755-.165.165-.337.328-.517.486l.708.709z"/>
                        <path d="M11.297 9.176a3.5 3.5 0 0 0-4.474-4.474l.823.823a2.5 2.5 0 0 1 2.829 2.829l.822.822zm-2.943 1.299.822.822a3.5 3.5 0 0 1-4.474-4.474l.823.823a2.5 2.5 0 0 0 2.829 2.829z"/>
                        <path d="M3.35 5.47c-.18.16-.353.322-.518.487A13.134 13.134 0 0 0 1.172 8l.195.288c.335.48.83 1.12 1.465 1.755C4.121 11.332 5.881 12.5 8 12.5c.716 0 1.39-.133 2.02-.36l.77.772A7.029 7.029 0 0 1 8 13.5C3 13.5 0 8 0 8s.939-1.721 2.641-3.238l.708.709zm10.296 8.884-12-12 .708-.708 12 12-.708.708z"/>
                      </svg>
                    )}
                  </button>
                </div>
              </p>
              <div className="button-group">
                <button className="save-button" onClick={handleSave}>Save Changes</button>
                <button className="cancel-button" onClick={() => setIsEditing(false)}>Cancel</button>
              </div>
            </>
          ) : (
            <>
              <p><strong>First Name</strong> {userInfo.firstname}</p>
              <p><strong>Middle Name</strong> {userInfo.middle_name || 'N/A'}</p>
              <p><strong>Last Name</strong> {userInfo.lastname}</p>
              <p><strong>Username</strong> {userInfo.username}</p>
              <p><strong>Password</strong> ******</p>
              <button className="edit-button" onClick={() => setIsEditing(true)}>Edit Profile</button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default ProfilePage;
