import axios from 'axios';

// Helper to determine API base URL based on the current environment
const determineBaseUrl = () => {
  // First check if there's a cached baseUrl in localStorage 
  // (this would have been set by AuthContext)
  const cachedBaseUrl = localStorage.getItem('apiBaseUrl');
  if (cachedBaseUrl) {
    return cachedBaseUrl;
  }
  
  const hostname = window.location.hostname;
  let baseUrl = '';
  
  // Check if running in GitHub Codespaces
  if (hostname.includes('github.dev') || hostname.includes('app.github.dev')) {
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
  
  return baseUrl;
};

// Check if auth bypass is enabled
const isAuthBypassEnabled = () => {
  return localStorage.getItem('authBypass') === 'true';
};

// Create an axios instance with custom config
const api = axios.create({
  baseURL: determineBaseUrl(),
  timeout: 10000,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
});

// Add a request interceptor to include auth token
api.interceptors.request.use(
  (config) => {
    // Add auth token if available
    const token = localStorage.getItem('token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }

    // Add bypass parameter if enabled
    if (isAuthBypassEnabled()) {
      // Add bypass parameter to URL
      const separator = config.url.includes('?') ? '&' : '?';
      config.url = `${config.url}${separator}bypass=true`;
      console.log('AUTH BYPASS: Adding bypass parameter to request', config.url);
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add a response interceptor to handle common errors
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // Handle CORS errors
    if (error.message === 'Network Error') {
      console.error('CORS or Network Error:', error);
      return Promise.reject({
        response: {
          data: {
            message: 'Unable to connect to the server. Please check your connection or try again later.'
          }
        }
      });
    }

    // Don't redirect to login if bypass is enabled
    if (isAuthBypassEnabled() && error.response && error.response.status === 401) {
      console.log('AUTH BYPASS: Ignoring 401 error due to bypass being enabled');
      return Promise.reject(error);
    }

    // Handle 401 errors (unauthorized)
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    
    return Promise.reject(error);
  }
);

// Helper functions for using the API service
api.enableAuthBypass = () => {
  localStorage.setItem('authBypass', 'true');
  console.log('AUTH BYPASS: Enabled');
};

api.disableAuthBypass = () => {
  localStorage.removeItem('authBypass');
  console.log('AUTH BYPASS: Disabled');
};

export default api; 