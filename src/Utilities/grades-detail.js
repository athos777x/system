import React, { useState } from 'react';

const GradesDetail = ({ 
  title, 
  percentage, 
  data, 
  onAddActivity, 
  onPercentageChange, 
  onEditActivity, 
  onDeleteActivity 
}) => {
  return (
    <div className="grade-column">
      <h4>
        {title} ({percentage}%)
      </h4>
      {/* Dropdown to change percentage dynamically */}
      <select 
        value={percentage} 
        onChange={(e) => onPercentageChange(parseFloat(e.target.value))}
      >
        {[10, 20, 30, 40, 50].map((option) => (
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
            <th>Actions</th> {/* Add Actions Column */}
          </tr>
        </thead>
        <tbody>
          {data.map((item, index) => {
            const ps = ((item.scores / item.total_items) * 100).toFixed(2); // Percentage Score
            const ws = (ps * (percentage / 100)).toFixed(2); // Weighted Score
            return (
              <tr key={index}>
                <td>{item.remarks}</td>
                <td>{item.scores}</td>
                <td>{item.total_items}</td>
                <td>{ps}</td>
                <td>{ws}</td>
                <td>
                  {/* Edit and Delete buttons */}
                  <button onClick={() => onEditActivity(item, index)}>Edit</button>
                  <button onClick={() => onDeleteActivity(index)}>Delete</button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    
      <button className="add-activity-btn" onClick={onAddActivity}>
        + Add {title}
      </button>
    </div>
  );
};

export default GradesDetail;
