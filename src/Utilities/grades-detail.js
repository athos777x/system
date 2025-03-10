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

  // Calculate total scores
  const calculateTotalScores = () => {
    if (!data || data.length === 0) return { totalPS: 0, totalWS: 0 };
    
    let totalPS = 0;
    let totalWS = 0;
    
    data.forEach(item => {
      const ps = parseFloat(calculatePercentageScore(item.scores, item.total_items));
      const ws = parseFloat(calculateWeightedScore(ps, percentage));
      totalPS += ps;
      totalWS += ws;
    });
    
    // Average the PS if there are items
    if (data.length > 0) {
      totalPS = (totalPS / data.length).toFixed(2);
    }
    
    return { totalPS, totalWS: totalWS.toFixed(2) };
  };
  
  const { totalPS, totalWS } = calculateTotalScores();

  return (
    <div className="teacher-grades-detail-card">
      <h4>
        {title}
        <span>{percentage}%</span>
      </h4>
      
      {!isLocked && (roleName !== 'principal' && roleName !== 'grade_level_coordinator') && (
        <div className="grade-component-header">
          <div className="grade-component-percentage">
            <label htmlFor={`${title}-percentage`}>Percentage:</label>
            <select
              id={`${title}-percentage`}
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
              disabled={roleName === 'principal' || roleName === 'grade_level_coordinator' || isLocked}
              className="percentage-select"
            >
              {generatePercentageOptions().map((option) => (
                <option key={option} value={option}>
                  {option}%
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      {data.length > 0 ? (
        <div className="activity-list">
          {data.map((item, index) => {
            const ps = calculatePercentageScore(item.scores, item.total_items);
            const ws = calculateWeightedScore(ps, percentage);
            return (
              <div key={index} className="activity-item">
                <div className="activity-info">
                  <div className="activity-name">{item.remarks}</div>
                  <div className="activity-details">
                    Score: {item.scores}/{item.total_items} (PS: {ps}%, WS: {ws})
                  </div>
                </div>
                {!isLocked && (roleName !== 'principal' && roleName !== 'grade_level_coordinator') && (
                  <div className="activity-actions">
                    <button 
                      onClick={() => onEditActivity(item, index, title)}
                      className="teacher-grades-btn teacher-grades-edit-btn"
                      title="Edit activity"
                    >
                      Edit
                    </button>
                    <button 
                      onClick={() => onDeleteActivity(item, index, title)}
                      className="teacher-grades-btn teacher-grades-delete-btn"
                      title="Delete activity"
                    >
                      Delete
                    </button>
                  </div>
                )}
              </div>
            );
          })}
          
          <div className="grade-component-summary">
            <div className="grade-summary-item">
              <span>Average PS:</span>
              <span className="grade-summary-value">{totalPS}%</span>
            </div>
            <div className="grade-summary-item">
              <span>Total WS:</span>
              <span className="grade-summary-value">{totalWS}</span>
            </div>
          </div>
        </div>
      ) : (
        <div className="no-activities">
          <p>No {title.toLowerCase()} recorded yet.</p>
        </div>
      )}
    
      {!isLocked && roleName !== 'principal' && roleName !== 'grade_level_coordinator' && (
        <button className="add-activity-btn" onClick={onAddActivity}>
          + Add {title}
        </button>
      )}
    </div>
  );
};

export default GradesDetail;
