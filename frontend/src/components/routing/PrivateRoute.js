import React, { useContext } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import { Box, CircularProgress } from '@mui/material';

const PrivateRoute = () => {
  const { user, loading } = useContext(AuthContext);
  
  // Check if auth bypass is enabled
  const isAuthBypassEnabled = localStorage.getItem('authBypass') === 'true';

  // If still loading, show a loading spinner
  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
        <CircularProgress />
      </Box>
    );
  }

  // If auth bypass is enabled, allow access regardless of user state
  if (isAuthBypassEnabled) {
    console.log('AUTH BYPASS: Allowing access to protected route');
    return <Outlet />;
  }

  // If not authenticated, redirect to login page
  if (!user) {
    return <Navigate to="/login" />;
  }

  // Otherwise, render the protected component
  return <Outlet />;
};

export default PrivateRoute; 