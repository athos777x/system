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
    return <div className="profile-page">Loading...</div>;
  }

  if (error) {
    return <div className="profile-page">Error: {error}</div>;
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
          />
          <label htmlFor="profile-pic-input" className="upload-button">
            Change Profile Picture
          </label>
        </div>
        <div className="profile-info">
          {isEditing ? (
            <>
              <p>
                <strong>First Name:</strong>{' '}
                <input
                  type="text"
                  name="firstname"
                  value={userInfo.firstname}
                  onChange={handleInputChange}
                />
              </p>
              <p>
                <strong>Middle Name:</strong>{' '}
                <input
                  type="text"
                  name="middle_name"
                  value={userInfo.middle_name || ''}
                  onChange={handleInputChange}
                />
              </p>
              <p>
                <strong>Last Name:</strong>{' '}
                <input
                  type="text"
                  name="lastname"
                  value={userInfo.lastname}
                  onChange={handleInputChange}
                />
              </p>
              <p>
                <strong>Username:</strong>{' '}
                <input
                  type="text"
                  name="username"
                  value={userInfo.username}
                  onChange={handleInputChange}
                />
              </p>
              <p>
                <strong>Password:</strong>{' '}
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={userInfo.password}
                  onChange={handleInputChange}
                />
                <button 
                  type="button" 
                  onClick={() => setShowPassword(prev => !prev)} 
                  className="password-toggle-button"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? (
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" className="bi bi-eye" viewBox="0 0 16 16">
                      <path d="M8 3.5C4.5 3.5 1.5 6.5 0 8c1.5 1.5 4.5 4.5 8 4.5s6.5-3 8-4.5c-1.5-1.5-4.5-4.5-8-4.5zM8 12c-2.5 0-4.5-1.5-5.5-2.5C3.5 8.5 5.5 7 8 7s4.5 1.5 5.5 2.5C12.5 10.5 10.5 12 8 12z"/>
                      <path d="M8 9a1 1 0 1 0 0-2 1 1 0 0 0 0 2z"/>
                    </svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" className="bi bi-eye-slash" viewBox="0 0 16 16">
                      <path d="M13.5 8c-.5 0-1 .5-1 1s.5 1 1 1 1-.5 1-1-.5-1-1-1zM8 3.5c-2.5 0-4.5 1.5-5.5 2.5C3.5 8.5 5.5 10 8 10s4.5-1.5 5.5-2.5C12.5 5 10.5 3.5 8 3.5zM1.5 8c.5 0 1-.5 1-1s-.5-1-1-1-1 .5-1 1 .5 1 1 1zM8 0c-4.5 0-8 4-8 8s3.5 8 8 8c1.5 0 3-.5 4.5-1.5l-1-1.5C10.5 14 9 15 8 15c-3.5 0-6-3-6-6s2.5-6 6-6c1 0 2.5.5 3.5 1.5l1-1.5C11.5 1 9.5 0 8 0z"/>
                      <path d="M1.5 1.5l13 13 1-1-13-13-1 1z"/>
                    </svg>
                  )}
                </button>
              </p>
              <div className="button-group">
                <button onClick={handleSave}>Save</button>
                <button onClick={() => setIsEditing(false)}>Cancel</button>
              </div>
            </>
          ) : (
            <>
              <p><strong>First Name:</strong> {userInfo.firstname}</p>
              <p><strong>Middle Name:</strong> {userInfo.middle_name || 'N/A'}</p>
              <p><strong>Last Name:</strong> {userInfo.lastname}</p>
              <p><strong>Username:</strong> {userInfo.username}</p>
              <p><strong>Password:</strong> ******</p>
              <button onClick={() => setIsEditing(true)}>Edit</button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default ProfilePage;
