import React, { useState, useContext, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import api from '../../services/api';
import { 
  Box, 
  Container, 
  TextField, 
  Button, 
  Typography, 
  Paper, 
  Avatar,
  Alert,
  CircularProgress,
  Checkbox,
  FormControlLabel,
  Divider
} from '@mui/material';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';

const Login = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [codespaceInfo, setCodespaceInfo] = useState(null);
  const [bypassAuth, setBypassAuth] = useState(false);
  
  const { login, error, loading, baseUrl } = useContext(AuthContext);
  const navigate = useNavigate();
  
  const { email, password } = formData;
  
  // Detect GitHub Codespaces environment
  useEffect(() => {
    const hostname = window.location.hostname;
    const isCodespace = hostname.includes('github.dev') || hostname.includes('app.github.dev');
    
    if (isCodespace) {
      setCodespaceInfo({
        hostname,
        apiUrl: baseUrl,
        inCodespace: true
      });
      
      // Set default admin credentials for easier testing in Codespaces
      setFormData({
        email: 'admin@smartsprint.com',
        password: 'admin'
      });
    }

    // Check if auth bypass is already enabled
    if (localStorage.getItem('authBypass') === 'true') {
      setBypassAuth(true);
    }
  }, [baseUrl]);
  
  const onChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    // Clear form error when user types
    setFormError('');
  };

  const handleBypassChange = (e) => {
    setBypassAuth(e.target.checked);
    if (e.target.checked) {
      api.enableAuthBypass();
    } else {
      api.disableAuthBypass();
    }
  };
  
  const onSubmit = async (e) => {
    e.preventDefault();
    
    // If bypass is enabled, skip login and go directly to dashboard
    if (bypassAuth) {
      console.log('AUTH BYPASS: Skipping login and redirecting to dashboard');
      // Force a reload to the dashboard path rather than using navigate
      // This ensures the component fully remounts and recognizes the bypass
      window.location.href = '/dashboard';
      return;
    }
    
    // Validate form
    if (!email || !password) {
      setFormError('Please enter both email and password');
      return;
    }
    
    try {
      setIsSubmitting(true);
      await login(email, password);
      setIsSubmitting(false);
      navigate('/dashboard');
    } catch (error) {
      console.error('Login error:', error);
      setIsSubmitting(false);
      // If we're in a Codespace and get a CORS error, show a more helpful message
      if (codespaceInfo?.inCodespace && 
          (error.message?.includes('Network Error') || 
           error.message?.includes('CORS'))) {
        setFormError('CORS error detected in GitHub Codespaces. Make sure the backend server is running and accessible. You might need to accept the certificate in a new tab by visiting: ' + baseUrl);
      }
    }
  };
  
  // Helper function to open backend URL in a new tab to accept certificate
  const openBackendUrl = () => {
    window.open(baseUrl, '_blank');
  };
  
  return (
    <Container component="main" maxWidth="xs">
      <Paper elevation={3} sx={{ p: 4, mt: 8, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <Avatar sx={{ m: 1, bgcolor: 'primary.main' }}>
          <LockOutlinedIcon />
        </Avatar>
        <Typography component="h1" variant="h5">
          Sign In
        </Typography>
        
        {codespaceInfo?.inCodespace && (
          <Alert severity="info" sx={{ width: '100%', mt: 2 }}>
            Running in GitHub Codespaces environment.
            <Button 
              size="small" 
              sx={{ ml: 1 }}
              onClick={openBackendUrl}
            >
              Test API Connection
            </Button>
          </Alert>
        )}
        
        {(error || formError) && (
          <Alert severity="error" sx={{ width: '100%', mt: 2 }}>
            {error || formError}
          </Alert>
        )}
        
        <Box component="form" onSubmit={onSubmit} sx={{ mt: 3, width: '100%' }}>
          <TextField
            margin="normal"
            required
            fullWidth
            id="email"
            label="Email Address"
            name="email"
            autoComplete="email"
            autoFocus
            value={email}
            onChange={onChange}
            disabled={bypassAuth}
          />
          <TextField
            margin="normal"
            required
            fullWidth
            name="password"
            label="Password"
            type="password"
            id="password"
            autoComplete="current-password"
            value={password}
            onChange={onChange}
            disabled={bypassAuth}
          />

          <FormControlLabel
            control={
              <Checkbox 
                checked={bypassAuth}
                onChange={handleBypassChange}
                color="primary"
              />
            }
            label="Bypass Authentication (Skip Login)"
          />
          
          <Button
            type="submit"
            fullWidth
            variant="contained"
            sx={{ mt: 3, mb: 2 }}
            disabled={loading || isSubmitting}
          >
            {loading || isSubmitting ? (
              <CircularProgress size={24} color="inherit" />
            ) : (
              bypassAuth ? 'Continue to Dashboard' : 'Sign In'
            )}
          </Button>
          
          <Box sx={{ textAlign: 'center', mt: 2 }}>
            <Typography variant="body2">
              {/* Registration link removed as per requirements */}
              Only email login is available
            </Typography>
          </Box>
        </Box>
      </Paper>
    </Container>
  );
};

export default Login; 