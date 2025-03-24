import React, { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { AuthContext } from '../../context/AuthContext';
import api from '../../services/api';
import {
  Box,
  Grid,
  Paper,
  Typography,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Chip,
  Button,
  Badge,
  Alert,
  CircularProgress
} from '@mui/material';
import {
  Assignment,
  Add,
  CheckCircle,
  Error,
  HourglassEmpty,
  Timeline
} from '@mui/icons-material';

const Dashboard = () => {
  const { user } = useContext(AuthContext);
  const [tasks, setTasks] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [bypassActive, setBypassActive] = useState(false);

  useEffect(() => {
    // Check if auth bypass is enabled
    const isAuthBypassEnabled = localStorage.getItem('authBypass') === 'true';
    if (isAuthBypassEnabled) {
      setBypassActive(true);
      console.log('AUTH BYPASS: Bypass is active in Dashboard');
      
      // Ensure the api service has bypass enabled
      api.enableAuthBypass();
    }
    
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Try to initialize database first if using bypass
        if (isAuthBypassEnabled) {
          try {
            console.log('Attempting to initialize database...');
            await axios.get('/debug/initialize?bypass=true');
            console.log('Database initialization successful');
          } catch (initError) {
            console.error('Database initialization error:', initError);
            // Continue anyway, as the main endpoints might still work
          }
        }

        let tasksData = [];
        let projectsData = [];

        // If auth bypass is enabled, or user is a developer/tester, get tasks
        if (isAuthBypassEnabled || !user || user.role === 'Developer' || user.role === 'Tester') {
          // Use direct axios calls with the bypass parameter added
          try {
            const tasksRes = isAuthBypassEnabled 
              ? await axios.get('/tasks?bypass=true')
              : await axios.get(`/tasks/user/${user.user_id}`);
            
            tasksData = tasksRes.data || [];
          } catch (taskError) {
            console.error('Error fetching tasks:', taskError);
            // Continue with empty tasks array
          }
        } else {
          // For admin and project manager, get all tasks
          try {
            const tasksRes = await axios.get('/tasks');
            tasksData = tasksRes.data || [];
          } catch (taskError) {
            console.error('Error fetching tasks:', taskError);
            // Continue with empty tasks array
          }
        }

        // Get all projects
        try {
          const projectsRes = isAuthBypassEnabled
            ? await axios.get('/projects?bypass=true')
            : await axios.get('/projects');
          
          projectsData = projectsRes.data || [];
        } catch (projectError) {
          console.error('Error fetching projects:', projectError);
          // Continue with empty projects array
        }

        // Set state with whatever data we were able to fetch
        setTasks(tasksData);
        setProjects(projectsData);
        setLoading(false);
      } catch (err) {
        console.error('Dashboard data fetch error:', err);
        
        // Set more descriptive error message based on the error
        let errorMessage = 'Failed to load dashboard data.';
        
        if (err.response?.status === 500) {
          errorMessage = 'Server error: The backend encountered an internal error. Try running database initialization.';
        } else if (err.response?.status === 401) {
          errorMessage = 'Authentication error: Not authorized to access this data. Try enabling authentication bypass.';
        } else if (err.message.includes('Network Error')) {
          errorMessage = 'Network error: Cannot connect to the backend server. Please make sure it is running.';
        }
        
        setError(errorMessage);
        setLoading(false);
        
        // If there's a server error, try to initialize the database
        if (err.response?.status === 500 && isAuthBypassEnabled) {
          try {
            console.log('Attempting to recover by initializing database...');
            setError('Server error detected. Attempting to recover by initializing database...');
            await axios.get('/debug/initialize?bypass=true');
            setError('Database initialization successful. Please refresh the page.');
          } catch (initError) {
            console.error('Recovery failed:', initError);
            setError('Recovery failed. Please check the server logs.');
          }
        }
      }
    };

    fetchData();
  }, [user]);

  // Get status color for task chips
  const getStatusColor = (status) => {
    switch (status) {
      case 'Created':
      case 'Assigned':
        return 'default';
      case 'In Progress':
        return 'primary';
      case 'Submitted':
      case 'Under Review':
        return 'warning';
      case 'Approved':
        return 'success';
      case 'Rejected':
      case 'Rework':
        return 'error';
      default:
        return 'default';
    }
  };

  // Get status color for project chips
  const getProjectStatusColor = (status) => {
    switch (status) {
      case 'Not Started':
        return 'default';
      case 'In Planning':
      case 'Active':
        return 'primary';
      case 'Paused':
        return 'warning';
      case 'Completed':
        return 'success';
      case 'Archived':
        return 'error';
      default:
        return 'default';
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ flexGrow: 1, p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Dashboard
      </Typography>
      <Typography variant="subtitle1" color="text.secondary" gutterBottom>
        Welcome back, {user?.name || 'User'}!
      </Typography>

      {bypassActive && (
        <Alert severity="info" sx={{ mb: 3 }}>
          Authentication bypass is active. You have admin access without login.
          <Button 
            size="small" 
            sx={{ ml: 2 }} 
            variant="outlined"
            onClick={() => {
              localStorage.removeItem('authBypass');
              window.location.href = '/login';
            }}
          >
            Disable Bypass
          </Button>
        </Alert>
      )}

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
          {error.includes('Server error') && (
            <Button 
              size="small" 
              color="inherit" 
              sx={{ ml: 2 }} 
              onClick={async () => {
                try {
                  await axios.get('/debug/initialize?bypass=true');
                  setError('Database initialized successfully. Please refresh the page.');
                } catch (err) {
                  setError('Failed to initialize database. Please check server logs.');
                }
              }}
            >
              Initialize Database
            </Button>
          )}
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* My Tasks */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
              <Typography variant="h6">
                <Assignment sx={{ mr: 1, verticalAlign: 'middle' }} />
                My Tasks
              </Typography>
              
              {(bypassActive || (user && (user.role === 'Admin' || user.role === 'Project Manager'))) && (
                <Button 
                  variant="contained" 
                  size="small" 
                  startIcon={<Add />}
                  component={Link}
                  to="/tasks/new"
                >
                  Create Task
                </Button>
              )}
            </Box>
            
            <Divider />
            
            {tasks.length === 0 ? (
              <Box py={2} textAlign="center">
                <Typography variant="body2" color="text.secondary">
                  No tasks assigned to you yet.
                </Typography>
              </Box>
            ) : (
              <List>
                {tasks.slice(0, 5).map((task) => (
                  <ListItem key={task.task_id} component={Link} to={`/tasks/${task.task_id}`} sx={{ textDecoration: 'none', color: 'inherit' }}>
                    <ListItemIcon>
                      {task.status === 'Approved' ? (
                        <CheckCircle color="success" />
                      ) : task.status === 'Rejected' ? (
                        <Error color="error" />
                      ) : (
                        <HourglassEmpty color="primary" />
                      )}
                    </ListItemIcon>
                    <ListItemText 
                      primary={task.title}
                      secondary={`Project: ${task.Project?.name || 'Unknown'}`}
                    />
                    <Chip 
                      label={task.status} 
                      size="small" 
                      color={getStatusColor(task.status)} 
                      variant="outlined" 
                    />
                  </ListItem>
                ))}
                
                {tasks.length > 5 && (
                  <Box textAlign="center" mt={1}>
                    <Button 
                      component={Link} 
                      to="/tasks" 
                      size="small"
                    >
                      View All Tasks
                    </Button>
                  </Box>
                )}
              </List>
            )}
          </Paper>
        </Grid>

        {/* Projects Overview */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
              <Typography variant="h6">
                <Timeline sx={{ mr: 1, verticalAlign: 'middle' }} />
                Projects Overview
              </Typography>
              
              {(bypassActive || (user && (user.role === 'Admin' || user.role === 'Project Manager'))) && (
                <Button 
                  variant="contained" 
                  size="small" 
                  startIcon={<Add />}
                  component={Link}
                  to="/projects/new"
                >
                  New Project
                </Button>
              )}
            </Box>
            
            <Divider />
            
            {projects.length === 0 ? (
              <Box py={2} textAlign="center">
                <Typography variant="body2" color="text.secondary">
                  No projects available.
                </Typography>
              </Box>
            ) : (
              <List>
                {projects.slice(0, 5).map((project) => (
                  <ListItem key={project.project_id} component={Link} to={`/projects/${project.project_id}`} sx={{ textDecoration: 'none', color: 'inherit' }}>
                    <ListItemText 
                      primary={project.name} 
                      secondary={project.description?.substring(0, 60) + (project.description?.length > 60 ? '...' : '')}
                    />
                    <Chip 
                      label={project.status} 
                      size="small" 
                      color={getProjectStatusColor(project.status)} 
                      variant="outlined" 
                    />
                  </ListItem>
                ))}
                
                {projects.length > 5 && (
                  <Box textAlign="center" mt={1}>
                    <Button 
                      component={Link} 
                      to="/projects" 
                      size="small"
                    >
                      View All Projects
                    </Button>
                  </Box>
                )}
              </List>
            )}
          </Paper>
        </Grid>
                
        {/* Status Overview */}
        <Grid item xs={12}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Task Status Overview
            </Typography>
            <Divider sx={{ mb: 2 }} />
            
            <Grid container spacing={2}>
              <Grid item xs={6} sm={3}>
                <Paper elevation={0} sx={{ p: 2, textAlign: 'center', bgcolor: 'grey.100' }}>
                  <Badge badgeContent={tasks.filter(t => t.status === 'In Progress').length} color="primary">
                    <Typography variant="subtitle1">In Progress</Typography>
                  </Badge>
                </Paper>
              </Grid>
              <Grid item xs={6} sm={3}>
                <Paper elevation={0} sx={{ p: 2, textAlign: 'center', bgcolor: 'grey.100' }}>
                  <Badge badgeContent={tasks.filter(t => t.status === 'Submitted' || t.status === 'Under Review').length} color="warning">
                    <Typography variant="subtitle1">Under Review</Typography>
                  </Badge>
                </Paper>
              </Grid>
              <Grid item xs={6} sm={3}>
                <Paper elevation={0} sx={{ p: 2, textAlign: 'center', bgcolor: 'grey.100' }}>
                  <Badge badgeContent={tasks.filter(t => t.status === 'Approved').length} color="success">
                    <Typography variant="subtitle1">Approved</Typography>
                  </Badge>
                </Paper>
              </Grid>
              <Grid item xs={6} sm={3}>
                <Paper elevation={0} sx={{ p: 2, textAlign: 'center', bgcolor: 'grey.100' }}>
                  <Badge badgeContent={tasks.filter(t => t.status === 'Rejected' || t.status === 'Rework').length} color="error">
                    <Typography variant="subtitle1">Rejected/Rework</Typography>
                  </Badge>
                </Paper>
              </Grid>
            </Grid>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Dashboard; 