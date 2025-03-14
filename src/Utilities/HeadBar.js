import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../CssFiles/headbar.css';
import { FiMenu, FiUser, FiLogOut } from 'react-icons/fi';
import defaultProfilePic from '../assets/user_pp.jpg'; // Import the default profile picture as fallback

function HeaderBar({ showSidebar, toggleSidebar, onLogout, user }) {
  const [dropdownVisible, setDropdownVisible] = useState(false);
  const [profilePicture, setProfilePicture] = useState(defaultProfilePic);
  const navigate = useNavigate();
  const userId = localStorage.getItem('userId');

  // Function to load the profile picture from localStorage or API
  const loadProfilePicture = async () => {
    // Clear the profile picture first to avoid showing the previous user's picture
    setProfilePicture(defaultProfilePic);
    
    // Get the current userId
    const currentUserId = localStorage.getItem('userId');
    if (!currentUserId) return;
    
    // Try to get the profile picture URL from localStorage
    const cachedProfilePicture = localStorage.getItem('profilePictureUrl');
    if (cachedProfilePicture) {
      // Add a cache-busting parameter to prevent caching
      const timestamp = new Date().getTime();
      setProfilePicture(`${cachedProfilePicture}?t=${timestamp}`);
    } else {
      // If not in localStorage, try to fetch it from the API
      try {
        const response = await fetch(`http://localhost:3001/api/profile-picture/${currentUserId}`);
        if (response.ok) {
          const data = await response.json();
          if (data && data.imageUrl) {
            const timestamp = new Date().getTime();
            const imageUrl = `${data.imageUrl}?t=${timestamp}`;
            setProfilePicture(imageUrl);
            // Cache it in localStorage
            localStorage.setItem('profilePictureUrl', data.imageUrl);
          }
        }
      } catch (error) {
        console.error('Error fetching profile picture:', error);
      }
    }
  };

  // Load the user's profile picture when the component mounts or userId changes
  useEffect(() => {
    loadProfilePicture();
    
    // Listen for storage events (for cross-tab synchronization)
    const handleStorageChange = (e) => {
      if (e.key === 'profilePictureUrl' || e.key === 'userId' || e.key === null) {
        loadProfilePicture();
      }
    };

    // Listen for custom storage events (for same-window updates)
    const handleCustomStorageEvent = () => {
      loadProfilePicture();
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('storage-local', handleCustomStorageEvent);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('storage-local', handleCustomStorageEvent);
    };
  }, [userId]); // Re-run when userId changes

  const toggleDropdown = () => {
    setDropdownVisible(!dropdownVisible);
  };

  const handleViewProfile = () => {
    navigate('/profile');
    setDropdownVisible(false);
  };

  const handleLogout = () => {
    setDropdownVisible(false);
    // Clear the profile picture before logging out
    setProfilePicture(defaultProfilePic);
    onLogout();
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownVisible && !event.target.closest('.profile-container')) {
        setDropdownVisible(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [dropdownVisible]);

  return (
    <div className="header">
      <button className="toggle-btn" onClick={toggleSidebar}>
        <FiMenu />
      </button>
      <h1>LNHS - MIS</h1>
      <div className="profile-container">
        <img 
          src={profilePicture} 
          alt="Profile" 
          className="profile-pic"
          onClick={toggleDropdown}
          onError={(e) => {
            // If the image fails to load, fall back to the default image
            e.target.src = defaultProfilePic;
          }}
        />
        {dropdownVisible && (
          <div className="dropdown-menu">
            <button className="dropdown-item" onClick={handleViewProfile}>
              <FiUser /> My Profile
            </button>
            <button className="dropdown-item" onClick={handleLogout}>
              <FiLogOut /> Logout
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default HeaderBar;
