import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../../context/AuthContext';
import axios from 'axios';
import api from '../../services/api';
import {
  Box,
  Typography,
  Paper,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  CircularProgress,
  Grid,
  Snackbar
} from '@mui/material';
import { 
  Add as AddIcon, 
  Edit as EditIcon, 
  Delete as DeleteIcon,
  Person as PersonIcon 
} from '@mui/icons-material';

const UserManagement = () => {
  const { user } = useContext(AuthContext);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [bypassActive, setBypassActive] = useState(false);
  
  // Form states
  const [openDialog, setOpenDialog] = useState(false);
  const [dialogMode, setDialogMode] = useState('add'); // 'add' or 'edit'
  const [currentUser, setCurrentUser] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'Developer',
    team: 'None',
    level: 'None'
  });
  
  // Delete confirmation
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);
  
  // Snackbar notification
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  });

  useEffect(() => {
    // Check if auth bypass is enabled
    const isAuthBypassEnabled = localStorage.getItem('authBypass') === 'true';
    if (isAuthBypassEnabled) {
      setBypassActive(true);
      api.enableAuthBypass();
    }
    
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      // Use bypass parameter to avoid authentication issues
      const isAuthBypassEnabled = localStorage.getItem('authBypass') === 'true';
      const response = await axios.get(isAuthBypassEnabled ? '/users?bypass=true' : '/users');
      setUsers(response.data);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching users:', err);
      setError('Failed to load users. Please try again.');
      setLoading(false);
    }
  };
  
  const handleOpenDialog = (mode, userData = null) => {
    setDialogMode(mode);
    
    if (mode === 'edit' && userData) {
      setCurrentUser(userData);
      setFormData({
        name: userData.name,
        email: userData.email,
        password: '', // Don't populate password for security
        role: userData.role,
        team: userData.team,
        level: userData.level
      });
    } else {
      setCurrentUser(null);
      setFormData({
        name: '',
        email: '',
        password: '',
        role: 'Developer',
        team: 'None',
        level: 'None'
      });
    }
    
    setOpenDialog(true);
  };
  
  const handleCloseDialog = () => {
    setOpenDialog(false);
    setFormData({
      name: '',
      email: '',
      password: '',
      role: 'Developer',
      team: 'None',
      level: 'None'
    });
  };
  
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };
  
  const handleSubmit = async () => {
    try {
      setLoading(true);
      
      // Validate form
      if (!formData.name || !formData.email || (dialogMode === 'add' && !formData.password)) {
        setSnackbar({
          open: true,
          message: 'Please fill in all required fields',
          severity: 'error'
        });
        setLoading(false);
        return;
      }
      
      // Use bypass parameter to avoid authentication issues
      const isAuthBypassEnabled = localStorage.getItem('authBypass') === 'true';
      const bypassParam = isAuthBypassEnabled ? '?bypass=true' : '';
      
      if (dialogMode === 'add') {
        // Create new user
        await axios.post(`/users${bypassParam}`, formData);
        setSnackbar({
          open: true,
          message: 'User created successfully',
          severity: 'success'
        });
      } else {
        // Update existing user
        const updateData = { ...formData };
        if (!updateData.password) delete updateData.password; // Only send password if changed
        
        await axios.put(`/users/${currentUser.user_id}${bypassParam}`, updateData);
        setSnackbar({
          open: true,
          message: 'User updated successfully',
          severity: 'success'
        });
      }
      
      handleCloseDialog();
      fetchUsers();
      setLoading(false);
    } catch (err) {
      console.error('Error saving user:', err);
      setSnackbar({
        open: true,
        message: err.response?.data?.message || 'Error saving user',
        severity: 'error'
      });
      setLoading(false);
    }
  };
  
  const handleDeleteUser = (userData) => {
    setUserToDelete(userData);
    setOpenDeleteDialog(true);
  };
  
  const confirmDelete = async () => {
    try {
      setLoading(true);
      // Use bypass parameter to avoid authentication issues
      const isAuthBypassEnabled = localStorage.getItem('authBypass') === 'true';
      const bypassParam = isAuthBypassEnabled ? '?bypass=true' : '';
      
      await axios.delete(`/users/${userToDelete.user_id}${bypassParam}`);
      
      setSnackbar({
        open: true,
        message: 'User deleted successfully',
        severity: 'success'
      });
      
      setOpenDeleteDialog(false);
      fetchUsers();
      setLoading(false);
    } catch (err) {
      console.error('Error deleting user:', err);
      setSnackbar({
        open: true,
        message: err.response?.data?.message || 'Error deleting user',
        severity: 'error'
      });
      setLoading(false);
      setOpenDeleteDialog(false);
    }
  };
  
  const closeSnackbar = () => {
    setSnackbar({
      ...snackbar,
      open: false
    });
  };
  
  if (loading && users.length === 0) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
        <CircularProgress />
      </Box>
    );
  }
  
  // Ensure the current user (or bypass user) has admin rights
  const isAuthorized = bypassActive || (user && user.role === 'Admin');
  
  if (!isAuthorized) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">
          You don't have permission to access this page. Only administrators can manage users.
        </Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ flexGrow: 1, p: 3 }}>
      <Typography variant="h4" gutterBottom>
        <PersonIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
        User Management
      </Typography>
      
      {bypassActive && (
        <Alert severity="info" sx={{ mb: 3 }}>
          Authentication bypass is active. You have admin access without login.
        </Alert>
      )}
      
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}
      
      <Paper sx={{ p: 2, mb: 3 }}>
        <Box display="flex" justifyContent="flex-end">
          <Button 
            variant="contained" 
            startIcon={<AddIcon />} 
            color="primary"
            onClick={() => handleOpenDialog('add')}
          >
            Add New User
          </Button>
        </Box>
      </Paper>
      
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Email</TableCell>
              <TableCell>Role</TableCell>
              <TableCell>Team</TableCell>
              <TableCell>Level</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {users.map((userData) => (
              <TableRow key={userData.user_id}>
                <TableCell>{userData.name}</TableCell>
                <TableCell>{userData.email}</TableCell>
                <TableCell>
                  <Chip 
                    label={userData.role}
                    color={userData.role === 'Admin' ? 'error' : 
                          userData.role === 'Project Manager' ? 'warning' : 
                          'primary'}
                    size="small"
                  />
                </TableCell>
                <TableCell>{userData.team}</TableCell>
                <TableCell>{userData.level}</TableCell>
                <TableCell align="right">
                  <IconButton 
                    color="primary" 
                    onClick={() => handleOpenDialog('edit', userData)}
                    disabled={userData.email === 'admin@smartsprint.com' && userData.role === 'Admin'}
                  >
                    <EditIcon />
                  </IconButton>
                  <IconButton 
                    color="error" 
                    onClick={() => handleDeleteUser(userData)}
                    disabled={userData.email === 'admin@smartsprint.com' && userData.role === 'Admin'}
                  >
                    <DeleteIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
            {users.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} align="center">
                  No users found
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
      
      {/* Add/Edit User Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {dialogMode === 'add' ? 'Add New User' : 'Edit User'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                name="name"
                label="Full Name"
                value={formData.name}
                onChange={handleInputChange}
                fullWidth
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                name="email"
                label="Email Address"
                value={formData.email}
                onChange={handleInputChange}
                fullWidth
                required
                type="email"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                name="password"
                label={dialogMode === 'add' ? "Password (Required)" : "Password (Leave blank to keep unchanged)"}
                value={formData.password}
                onChange={handleInputChange}
                fullWidth
                type="password"
                required={dialogMode === 'add'}
              />
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Role</InputLabel>
                <Select
                  name="role"
                  value={formData.role}
                  onChange={handleInputChange}
                  label="Role"
                >
                  <MenuItem value="Admin">Admin</MenuItem>
                  <MenuItem value="Project Manager">Project Manager</MenuItem>
                  <MenuItem value="Developer">Developer</MenuItem>
                  <MenuItem value="Tester">Tester</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Team</InputLabel>
                <Select
                  name="team"
                  value={formData.team}
                  onChange={handleInputChange}
                  label="Team"
                >
                  <MenuItem value="Design">Design</MenuItem>
                  <MenuItem value="Database">Database</MenuItem>
                  <MenuItem value="Backend">Backend</MenuItem>
                  <MenuItem value="Frontend">Frontend</MenuItem>
                  <MenuItem value="DevOps">DevOps</MenuItem>
                  <MenuItem value="Tester/Security">Tester/Security</MenuItem>
                  <MenuItem value="None">None</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Level</InputLabel>
                <Select
                  name="level"
                  value={formData.level}
                  onChange={handleInputChange}
                  label="Level"
                >
                  <MenuItem value="Lead">Lead</MenuItem>
                  <MenuItem value="Senior">Senior</MenuItem>
                  <MenuItem value="Dev">Dev</MenuItem>
                  <MenuItem value="Junior">Junior</MenuItem>
                  <MenuItem value="None">None</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button 
            onClick={handleSubmit} 
            variant="contained" 
            color="primary"
            disabled={loading}
          >
            {loading ? <CircularProgress size={24} /> : 'Save'}
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Delete Confirmation Dialog */}
      <Dialog open={openDeleteDialog} onClose={() => setOpenDeleteDialog(false)}>
        <DialogTitle>Confirm Deletion</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete user "{userToDelete?.name}"? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDeleteDialog(false)}>Cancel</Button>
          <Button onClick={confirmDelete} color="error" variant="contained">
            {loading ? <CircularProgress size={24} /> : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Notification Snackbar */}
      <Snackbar 
        open={snackbar.open} 
        autoHideDuration={6000} 
        onClose={closeSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert 
          onClose={closeSnackbar} 
          severity={snackbar.severity} 
          variant="filled"
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default UserManagement; 