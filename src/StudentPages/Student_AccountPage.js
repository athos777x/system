import React, { useState } from 'react';
import axios from 'axios';
import { FiEye, FiEyeOff } from 'react-icons/fi';
import '../StudentPagesCss/Student_AccountPage.css';

function Student_AccountPage() {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [message, setMessage] = useState('');

  const handlePasswordChange = async (event) => {
    event.preventDefault();
    if (newPassword !== confirmPassword) {
      setMessage('New password and confirm password do not match');
      return;
    }

    const userId = localStorage.getItem('userId');

    try {
      const response = await axios.put(`http://localhost:3001/user/${userId}/change-password`, {
        currentPassword,
        newPassword,
      });

      if (response.data.success) {
        setMessage('Password changed successfully');
      } else {
        setMessage(response.data.message);
      }
    } catch (error) {
      console.error('There was an error changing the password!', error);
      setMessage('An error occurred while changing the password');
    }
  };

  return (
    <div className="student-account-container">
      <h1>Change Password</h1>
      {message && <p className="student-account-message">{message}</p>}
      <form onSubmit={handlePasswordChange}>
        <div className="student-account-form-group">
          <label htmlFor="currentPassword">Current Password</label>
          <div className="student-account-password-wrapper">
            <input
              type={showCurrentPassword ? 'text' : 'password'}
              id="currentPassword"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              required
            />
            <button
              type="button"
              onClick={() => setShowCurrentPassword(!showCurrentPassword)}
              className="student-account-show-password-btn"
            >
              {showCurrentPassword ? <FiEyeOff className="student-account-password-icon" /> : <FiEye className="student-account-password-icon" />}
            </button>
          </div>
        </div>
        <div className="student-account-form-group">
          <label htmlFor="newPassword">New Password</label>
          <div className="student-account-password-wrapper">
            <input
              type={showNewPassword ? 'text' : 'password'}
              id="newPassword"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
            />
            <button
              type="button"
              onClick={() => setShowNewPassword(!showNewPassword)}
              className="student-account-show-password-btn"
            >
              {showNewPassword ? <FiEyeOff className="student-account-password-icon" /> : <FiEye className="student-account-password-icon" />}
            </button>
          </div>
        </div>
        <div className="student-account-form-group">
          <label htmlFor="confirmPassword">Confirm New Password</label>
          <div className="student-account-password-wrapper">
            <input
              type={showConfirmPassword ? 'text' : 'password'}
              id="confirmPassword"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="student-account-show-password-btn"
            >
              {showConfirmPassword ? <FiEyeOff className="student-account-password-icon" /> : <FiEye className="student-account-password-icon" />}
            </button>
          </div>
        </div>
        <button type="submit" className="student-account-change-password-button">Change Password</button>
      </form>
    </div>
  );
}

export default Student_AccountPage;
