import React, { createContext, useState, useEffect } from 'react';
import axios from 'axios';

export const AuthContext = createContext();

// Helper to determine API base URL based on the current environment
const determineBaseUrl = () => {
  const hostname = window.location.hostname;
  let baseUrl = '';
  
  // Check if running in GitHub Codespaces
  if (hostname.includes('github.dev') || hostname.includes('app.github.dev')) {
    // Extract the port from the window.location.port or use default
    const port = window.location.port || '5000';
    // Extract the codespace name from the hostname
    const codespaceNameMatch = hostname.match(/(.*?)-\d+\.app\.github\.dev/);
    const codespaceName = codespaceNameMatch ? codespaceNameMatch[1] : '';
    
    // Construct the backend URL for GitHub Codespaces
    baseUrl = `https://${codespaceName}-5000.app.github.dev/api`;
  } else {
    // Development environment
    baseUrl = 'http://localhost:5000/api';
  }
  
  // Check for and fix duplicate /api paths
  if (baseUrl.includes('/api/api/')) {
    baseUrl = baseUrl.replace('/api/api/', '/api/');
    console.warn('Fixed duplicate /api/ in API URL');
  }
  
  // Save the base URL to localStorage for other components to use
  localStorage.setItem('apiBaseUrl', baseUrl);
  
  return baseUrl;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [baseUrl] = useState(determineBaseUrl());

  // Log the base URL for debugging
  console.log('API Base URL:', baseUrl);

  // Set up axios defaults
  axios.defaults.baseURL = baseUrl;
  axios.defaults.withCredentials = true; // Enable sending cookies with requests
  
  // Add token to requests if available
  useEffect(() => {
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } else {
      delete axios.defaults.headers.common['Authorization'];
    }
  }, [token]);

  // Check if user is logged in on page load
  useEffect(() => {
    const loadUser = async () => {
      // Check if auth bypass is enabled
      if (localStorage.getItem('authBypass') === 'true') {
        console.log('AUTH BYPASS: Setting default admin user in context');
        
        // Set a default admin user when bypass is enabled
        setUser({
          user_id: 1,
          name: 'Admin User',
          email: 'admin@smartsprint.com',
          role: 'Admin',
          team: 'None',
          level: 'None'
        });
        
        setLoading(false);
        return;
      }
      
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const res = await axios.get('/auth/profile');
        setUser(res.data);
        setLoading(false);
      } catch (err) {
        console.error('Error loading user:', err);
        localStorage.removeItem('token');
        setToken(null);
        setUser(null);
        setError('Authentication failed. Please login again.');
        setLoading(false);
      }
    };

    loadUser();
  }, [token]);

  // Login user
  const login = async (email, password) => {
    try {
      setLoading(true);
      setError(null);
      
      const res = await axios.post('/auth/login', { email, password });
      
      localStorage.setItem('token', res.data.token);
      setToken(res.data.token);
      setUser(res.data.user);
      setLoading(false);
      
      return res.data.user;
    } catch (err) {
      setLoading(false);
      const errorMsg = err.response?.data?.message || 'Login failed. Please try again.';
      console.error('Login error:', errorMsg, err);
      setError(errorMsg);
      throw err;
    }
  };

  // Register user - commented out as per requirements
  /*
  const register = async (userData) => {
    try {
      setLoading(true);
      setError(null);
      
      const res = await axios.post('/auth/register', userData);
      
      localStorage.setItem('token', res.data.token);
      setToken(res.data.token);
      setUser(res.data.user);
      setLoading(false);
      
      return res.data.user;
    } catch (err) {
      setLoading(false);
      const errorMsg = err.response?.data?.message || 'Registration failed. Please try again.';
      console.error('Registration error:', errorMsg, err);
      setError(errorMsg);
      throw err;
    }
  };
  */

  // Register stub function to maintain API compatibility
  const register = async () => {
    setError('Registration is disabled. Please use an existing account.');
    throw new Error('Registration is disabled');
  };

  // Logout user
  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
  };

  // Change password - commented out as per requirements
  /*
  const changePassword = async (currentPassword, newPassword) => {
    try {
      setLoading(true);
      setError(null);
      
      await axios.post('/auth/change-password', { 
        currentPassword, 
        newPassword 
      });
      
      setLoading(false);
      return true;
    } catch (err) {
      setLoading(false);
      const errorMsg = err.response?.data?.message || 'Password change failed. Please try again.';
      console.error('Password change error:', errorMsg, err);
      setError(errorMsg);
      throw err;
    }
  };
  */

  // Change password stub function to maintain API compatibility
  const changePassword = async () => {
    setError('Password change is disabled.');
    throw new Error('Password change is disabled');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        error,
        login,
        register,
        logout,
        changePassword,
        baseUrl
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}; 