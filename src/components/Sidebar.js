import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Sidebar.css';

const Sidebar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { role, hasPermission, logout, user, assignedClasses } = useAuth();

  const isActive = (path) => {
    return location.pathname === path;
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getNavItems = () => {
    const items = [];
    if (role !== 'teacher') {
      items.push({ path: '/', label: 'Dashboard', icon: '📊' });
    }

    // Add role-based navigation items
    if (role === 'vice_principal') {
      // Vice Principal has access to everything
      items.push(
        { path: '/students', label: 'Students', icon: '👥' },
        { path: '/attendance', label: 'Attendance', icon: '📅' },
        { path: '/marks', label: 'Marks', icon: '📝' },
        { path: '/fees', label: 'Fees', icon: '💰' },
        { path: '/reports', label: 'Reports', icon: '📋' },
        { path: '/monthly-test', label: 'Monthly Tests', icon: '📚' }
      );
    } else if (role === 'teacher') {
      // Teachers can access marks, attendance, and monthly tests
      if (hasPermission('marks')) {
        items.push({ path: '/marks', label: 'Marks', icon: '📝' });
      }
      if (hasPermission('attendance')) {
        items.push({ path: '/attendance', label: 'Attendance', icon: '📅' });
      }
      if (hasPermission('monthly_test')) {
        items.push({ path: '/monthly-test', label: 'Monthly Tests', icon: '📚' });
      }
    } else if (role === 'staff') {
      // Staff can access fees, reports, and student data
      if (hasPermission('fee')) {
        items.push({ path: '/fees', label: 'Fees', icon: '💰' });
      }
      if (hasPermission('report')) {
        items.push({ path: '/reports', label: 'Reports', icon: '📋' });
      }
      if (hasPermission('student_data')) {
        items.push({ path: '/students', label: 'Students', icon: '👥' });
      }
    }

    return items;
  };

  const navItems = getNavItems();

  return (
    <div className="sidebar">
      <div className="sidebar-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <img src="/image.png" alt="HSE Logo" style={{ width: 80, height: 80,marginRight: 10,objectFit: 'contain', transform: 'rotate(-90deg)' }} />
          <h2 style={{ margin: 0 }}>HSE Management</h2>
        </div>
        <div className="role-badge">
          {role === 'vice_principal' && 'Vice Principal'}
          {role === 'teacher' && 'Teacher'}
          {role === 'staff' && 'Staff'}
        </div>
        {user && (
          <div className="sidebar-user-top">
            <div className="sidebar-user-label">
              <span className="sidebar-user-label-title">
                {role === 'teacher' && 'Teacher Name:'}
                {role === 'staff' && 'Staff Name:'}
                {role === 'vice_principal' && 'Vice Principal:'}
              </span>
              <span className="sidebar-user-label-value">{user.first_name} {user.last_name}</span>
            </div>
            <div className="sidebar-user-label">
              <span className="sidebar-user-label-title">Email:</span> <span className="sidebar-user-label-value">{user.email}</span>
            </div>
            {role === 'teacher' && (
              <div className="sidebar-user-label">
                <span className="sidebar-user-label-title">Class Name:</span> <span className="sidebar-user-label-value">{assignedClasses && assignedClasses[0]?.name || user.class_name || '-'}</span>
              </div>
            )}
          </div>
        )}
      </div>
      
      <nav className="sidebar-nav">
        {navItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className={`sidebar-link ${isActive(item.path) ? 'active' : ''}`}
          >
            <span className="sidebar-icon">{item.icon}</span>
            <span className="sidebar-label">{item.label}</span>
          </Link>
        ))}
      </nav>

      <div className="sidebar-footer">
        <button 
          onClick={handleLogout}
          className="bg-blue-600 text-white logout-button"
        >
          <span className="logout-icon">🚪</span>
          <span className="logout-text">Logout</span>
        </button>
      </div>
    </div>
  );
};

export default Sidebar; 