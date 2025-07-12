import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const ProtectedRoute = ({ 
  children, 
  adminOnly = false, 
  publicRoute = false,
  allowUnauthenticated = false 
}) => {
  const { currentUser, loading } = useAuth();

  // Show loading state while auth is initializing
  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        minHeight: '100vh' 
      }}>
        <div>Loading...</div>
      </div>
    );
  }

  // Allow unauthenticated access for public routes
  if (allowUnauthenticated && publicRoute && !currentUser) {
    return children;
  }

  // Check if user is authenticated
  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  // Check admin-only routes
  if (adminOnly) {
    if (currentUser.role !== 'ADMIN') {
      return <Navigate to="/" replace />;
    }
  } else {
    // Regular routes - admin users should ONLY access /admin
    // But allow admin to access public routes (like home)
    if (currentUser.role === 'ADMIN' && !publicRoute) {
      return <Navigate to="/admin" replace />;
    }
  }

  return children;
};

export default ProtectedRoute;