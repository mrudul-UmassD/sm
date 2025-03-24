import React, { useContext } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import { Box, CircularProgress } from '@mui/material';

const PrivateRoute = () => {
  const { user, loading } = useContext(AuthContext);

  // If still loading, show a loading spinner
  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
        <CircularProgress />
      </Box>
    );
  }

  // If not authenticated, redirect to login page
  if (!user) {
    return <Navigate to="/login" />;
  }

  // Otherwise, render the protected component
  return <Outlet />;
};

export default PrivateRoute; 