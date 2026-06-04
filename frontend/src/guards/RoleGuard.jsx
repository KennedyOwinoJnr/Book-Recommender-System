import React from 'react';
import { Navigate } from 'react-router-dom';

const RoleGuard = ({ children, allowedRoles }) => {
  const userString = localStorage.getItem('user');
  
  if (!userString) {
    return <Navigate to="/login" replace />;
  }

  try {
    const user = JSON.parse(userString);
    const userRoles = user.roles || [];

    // Check if user has at least one of the allowed roles
    const hasAccess = userRoles.some(role => allowedRoles.includes(role));

    if (!hasAccess) {
      // If unauthorized, redirect to standard member portal dashboard
      return <Navigate to="/dashboard" replace />;
    }

    return children;
  } catch (e) {
    return <Navigate to="/login" replace />;
  }
};

export default RoleGuard;
