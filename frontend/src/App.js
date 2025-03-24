import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { Container } from '@mui/material';

// Context
import { AuthProvider } from './context/AuthContext';

// Routing
import PrivateRoute from './components/routing/PrivateRoute';

// Layout
import Navbar from './components/layout/Navbar';

// Auth Components
import Login from './components/auth/Login';
import Register from './components/auth/Register';

// Dashboard
import Dashboard from './components/dashboard/Dashboard';

// User Management
import UserManagement from './components/users/UserManagement';

// Create theme
const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#f50057',
    },
  },
});

// Helper component for bypass route
const BypassRoute = ({ children }) => {
  useEffect(() => {
    // Enable auth bypass
    localStorage.setItem('authBypass', 'true');
    console.log('AUTH BYPASS: Auto-enabled for bypass route');
  }, []);
  
  return children;
};

const App = () => {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <Router>
          <Navbar />
          <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
            <Routes>
              {/* Public routes */}
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              
              {/* Bypass route - automatically enables auth bypass */}
              <Route path="/bypass" element={
                <BypassRoute>
                  <Dashboard />
                </BypassRoute>
              } />
              
              {/* Private routes */}
              <Route element={<PrivateRoute />}>
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/users" element={<UserManagement />} />
                {/* Additional routes will be added here */}
              </Route>
              
              {/* Default redirect */}
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
            </Routes>
          </Container>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
};

export default App; 