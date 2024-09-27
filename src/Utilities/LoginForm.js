import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { FiEye, FiEyeOff } from 'react-icons/fi';
import '../CssFiles/LoginForm.css';

function LoginForm({ onLogin }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (event) => {
    event.preventDefault();
    try {
      const response = await axios.post('http://localhost:3001/login', { username, password });
      if (response.data.authenticated) {
        console.log(`Login successful. User ID: ${response.data.userId}`);
        localStorage.setItem('userId', response.data.userId); // Store userId in localStorage
        localStorage.setItem('role', response.data.role);
        onLogin(username, password, navigate, response.data.role);
      } else {
        alert('Incorrect username or password');
      }
    } catch (error) {
      console.error('There was an error!', error);
    }
  };

  return (
    <div className="login-wrapper">
      <form onSubmit={handleLogin} className="login-container">
        <h1 className="portal-title">LNHS PORTAL</h1>
        <img src="/lnhs-logo.png" alt="School Logo" className="login-logo" />
        <h2 className="login-header">Login</h2>
        <div className="form-group">
          <label htmlFor="username">Username</label>
          <input
            type="text"
            id="username"
            placeholder="Enter your username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
        </div>
        <div className="form-group">
          <label htmlFor="password">Password</label>
          <div className="password-wrapper">
            <input
              type={showPassword ? 'text' : 'password'}
              id="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="show-password-btn"
            >
              {showPassword ? <FiEyeOff className="password-icon" /> : <FiEye className="password-icon" />}
            </button>
          </div>
        </div>
        <button type="submit" className="login-btn">Login</button>
      </form>
    </div>
  );
}

export default LoginForm;
