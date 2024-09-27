import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import EmployeeSearchFilter from '../RoleSearchFilters/EmployeeSearchFilter';
import '../CssPage/Principal_EmployeePage.css';

function Principal_EmployeePage() {
  const [employees, setEmployees] = useState([]);
  const [filteredEmployees, setFilteredEmployees] = useState([]);
  const [roles, setRoles] = useState([]);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editFormData, setEditFormData] = useState({});
  const [filters, setFilters] = useState({
    searchTerm: '',
    position: '',
    showArchive: 'unarchive',
    status: ''
  });

  const fetchEmployees = useCallback(async () => {
    try {
      const response = await axios.get('http://localhost:3001/employees', {
        params: filters
      });
      const sortedEmployees = response.data.sort((a, b) => a.firstname.localeCompare(b.firstname));
      setEmployees(sortedEmployees);
      setFilteredEmployees(sortedEmployees);
    } catch (error) {
      console.error('Error fetching employees:', error);
    }
  }, [filters]);

  useEffect(() => {
    fetchEmployees();
    fetchRoles();
  }, [fetchEmployees]);

  const fetchRoles = async () => {
    try {
      const response = await axios.get('http://localhost:3001/roles');
      setRoles(response.data);
    } catch (error) {
      console.error('Error fetching roles:', error);
    }
  };

  const handleSearch = (searchTerm) => {
    setFilters(prevFilters => ({ ...prevFilters, searchTerm }));
  };

  const handleApplyFilters = (newFilters) => {
    setFilters(newFilters);
  };

  const toggleEmployeeDetails = (employeeId) => {
    if (selectedEmployeeId === employeeId) {
      setSelectedEmployeeId(null);
      setIsEditing(false);
    } else {
      setSelectedEmployeeId(employeeId);
      setIsEditing(false);
      const employee = employees.find(emp => emp.employee_id === employeeId);
      setEditFormData(employee);
    }
  };

  const startEditing = (employeeId) => {
    setSelectedEmployeeId(employeeId);
    setIsEditing(true);
    const employee = employees.find(emp => emp.employee_id === employeeId);
    setEditFormData(employee);
  };

  const handleEditChange = (event) => {
    const { name, value } = event.target;
    setEditFormData(prevFormData => ({
      ...prevFormData,
      [name]: value
    }));
  };

  const saveChanges = async () => {
    try {
      await axios.put(`http://localhost:3001/employees/${selectedEmployeeId}`, editFormData);
      fetchEmployees();  // Refresh the employee list after saving
      setIsEditing(false);
    } catch (error) {
      console.error('Error saving employee details:', error);
    }
  };

  const toggleArchiveStatus = async (employeeId, currentStatus) => {
    try {
      const newStatus = currentStatus === 'archive' ? 'unarchive' : 'archive';
      await axios.put(`http://localhost:3001/employees/${employeeId}/${newStatus}`);
      fetchEmployees();  // Refresh the employee list after changing archive status
    } catch (error) {
      console.error(`Error ${currentStatus === 'archive' ? 'unarchiving' : 'archiving'} employee:`, error);
    }
  };

  const cancelEditing = () => {
    setIsEditing(false);
    const employee = employees.find(emp => emp.employee_id === selectedEmployeeId);
    setEditFormData(employee);
  };

  const formatRoleName = (roleName) => {
    return roleName.replace(/_/g, ' ').split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  };

  return (
    <div className="employee-container">
  <h1 className="employee-title">Employees</h1>
  <div className="employee-search-filter-container">
    <EmployeeSearchFilter
      handleSearch={handleSearch}
      handleApplyFilters={handleApplyFilters}
    />
  </div>
  <div className="employee-list">
    {filteredEmployees.map((employee, index) => (
      <div key={employee.employee_id} className="employee-item-container">
        <div className="employee-item">
          <p className="employee-name">
            {index + 1}. {employee.firstname} {employee.middlename && `${employee.middlename[0]}.`} {employee.lastname}
          </p>
          <span className="employee-info">{formatRoleName(employee.role_name)} - {employee.status.charAt(0).toUpperCase() + employee.status.slice(1)}</span>
          <div className="employee-actions">
            <button className="employee-view-button" onClick={() => toggleEmployeeDetails(employee.employee_id)}>View</button>
            <button className="employee-edit-button" onClick={() => startEditing(employee.employee_id)}>Edit</button>
            <button
              className="employee-archive-button"
              onClick={() => toggleArchiveStatus(employee.employee_id, employee.archive_status)}
            >
              {employee.archive_status === 'archive' ? 'Unarchive' : 'Archive'}
            </button>
          </div>
        </div>
        {selectedEmployeeId === employee.employee_id && (
          <div className="employee-details">
            <table>
              <tbody>
                <tr>
                  <th>First Name:</th>
                  <td>
                    {isEditing ? (
                      <input
                        type="text"
                        name="firstname"
                        value={editFormData.firstname}
                        onChange={handleEditChange}
                      />
                    ) : (
                      employee.firstname
                    )}
                  </td>
                </tr>
                <tr>
                  <th>Middle Name:</th>
                  <td>
                    {isEditing ? (
                      <input
                        type="text"
                        name="middlename"
                        value={editFormData.middlename}
                        onChange={handleEditChange}
                      />
                    ) : (
                      employee.middlename
                    )}
                  </td>
                </tr>
                <tr>
                  <th>Last Name:</th>
                  <td>
                    {isEditing ? (
                      <input
                        type="text"
                        name="lastname"
                        value={editFormData.lastname}
                        onChange={handleEditChange}
                      />
                    ) : (
                      employee.lastname
                    )}
                  </td>
                </tr>
                <tr>
                  <th>Contact Number:</th>
                  <td>
                    {isEditing ? (
                      <input
                        type="text"
                        name="contact_number"
                        value={editFormData.contact_number}
                        onChange={handleEditChange}
                      />
                    ) : (
                      employee.contact_number
                    )}
                  </td>
                </tr>
                <tr>
                  <th>Address:</th>
                  <td>
                    {isEditing ? (
                      <input
                        type="text"
                        name="address"
                        value={editFormData.address}
                        onChange={handleEditChange}
                      />
                    ) : (
                      employee.address
                    )}
                  </td>
                </tr>
                <tr>
                  <th>Year Started:</th>
                  <td>
                    {isEditing ? (
                      <input
                        type="text"
                        name="year_started"
                        value={editFormData.year_started}
                        onChange={handleEditChange}
                      />
                    ) : (
                      employee.year_started
                    )}
                  </td>
                </tr>
                <tr>
                  <th>Role Name:</th>
                  <td>
                    {isEditing ? (
                      <select
                        name="role_name"
                        value={editFormData.role_name}
                        onChange={handleEditChange}
                      >
                        {roles.map((role, index) => (
                          <option key={index} value={role}>{role}</option>
                        ))}
                      </select>
                    ) : (
                      formatRoleName(employee.role_name)
                    )}
                  </td>
                </tr>
                <tr>
                  <th>Status:</th>
                  <td>
                    {isEditing ? (
                      <select
                        name="status"
                        value={editFormData.status}
                        onChange={handleEditChange}
                      >
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                      </select>
                    ) : (
                      employee.status.charAt(0).toUpperCase() + employee.status.slice(1)
                    )}
                  </td>
                </tr>
              </tbody>
            </table>
            {isEditing && (
              <div className="employee-edit-buttons">
                <button className="employee-save-button" onClick={saveChanges}>Save</button>
                <button className="employee-cancel-button" onClick={cancelEditing}>Cancel</button>
              </div>
            )}
          </div>
        )}
      </div>
    ))}
  </div>
</div>
  );
}

export default Principal_EmployeePage;
