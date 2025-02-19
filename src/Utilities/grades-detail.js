import React, { useState, useEffect } from 'react';
import axios from 'axios';

const GradesDetail = ({ 
  title, 
  percentage, 
  data, 
  onAddActivity, 
  onPercentageChange, 
  onEditActivity, 
  onDeleteActivity,
  readOnly,
  otherPercentages,
  isLocked
}) => {
  // Helper function to ensure grades don't exceed 100
  const calculatePercentageScore = (score, total) => {
    const rawPercentage = (score / total) * 100;
    return Math.min(rawPercentage, 100).toFixed(2);
  };

  // Helper function to calculate weighted score
  const calculateWeightedScore = (ps, weight) => {
    const weightedScore = (parseFloat(ps) * (weight / 100));
    return Math.min(weightedScore, weight).toFixed(2);
  };

  // Calculate maximum allowed percentage for this component
  const calculateMaxPercentage = () => {
    const totalOtherPercentages = Object.values(otherPercentages)
      .reduce((sum, value) => sum + value, 0) - percentage;
    return 100 - totalOtherPercentages;
  };

  // Generate available percentage options
  const generatePercentageOptions = () => {
    const maxPercentage = calculateMaxPercentage();
    const options = [];
    for (let i = 5; i <= maxPercentage; i += 5) {
      options.push(i);
    }
    return options;
  };

  const [roleName, setRoleName] = useState('');
  

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

  useEffect(() => {
    const userId = localStorage.getItem('userId'); // Retrieve userId from localStorage
    if (userId) {
      console.log(`Retrieved userId from localStorage: ${userId}`); // Debugging log
      fetchUserRole(userId);
    } else {
      console.error('No userId found in localStorage');
    }
  }, []);

  return (
    <div className="grade-column">
      <h4>
        {title} ({percentage}%)
      </h4>
      <select 
        value={percentage} 
        onChange={(e) => {
          const newValue = parseFloat(e.target.value);
          const maxAllowed = calculateMaxPercentage() + percentage;
          if (newValue <= maxAllowed) {
            onPercentageChange(newValue);
          } else {
            alert(`Total percentage cannot exceed 100%. Maximum allowed for ${title} is ${maxAllowed}%`);
          }
        }}
      >
        {generatePercentageOptions().map((option) => (
          <option key={option} value={option}>
            {option}%
          </option>
        ))}
      </select>
    
      <table>
        <thead>
          <tr>
            <th>Label</th>
            <th>Score</th>
            <th>Total</th>
            <th>PS</th>
            <th>WS</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {data.map((item, index) => {
            const ps = calculatePercentageScore(item.scores, item.total_items);
            const ws = calculateWeightedScore(ps, percentage);
            return (
              <tr key={index}>
                <td>{item.remarks}</td>
                <td>{item.scores}</td>
                <td>{item.total_items}</td>
                <td>{ps}</td>
                <td>{ws}</td>
                {!isLocked && (
                  <td>
                     {(roleName !== 'principal' && roleName !== 'grade_level_coordinator') && (
                        <>
                          <button onClick={() => onEditActivity(item, index, title)}>Edit</button>
                          <button onClick={() => onDeleteActivity(item, index, title)}>Delete</button>
                        </>
                      )}
                  </td>
                )}
              </tr>
            );
          })}
        </tbody>
      </table>
    
      {!isLocked && roleName !== 'principal' && (
        <button className="add-activity-btn" onClick={onAddActivity}>
          + Add {title}
        </button>
      )}

    </div>
  );
};

export default GradesDetail;
