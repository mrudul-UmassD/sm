import React, { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { AuthContext } from '../../context/AuthContext';
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

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        // If user is a developer or tester, get their assigned tasks
        if (user.role === 'Developer' || user.role === 'Tester') {
          const tasksRes = await axios.get(`/tasks/user/${user.user_id}`);
          setTasks(tasksRes.data);
        } else {
          // For admin and project manager, get all tasks
          const tasksRes = await axios.get('/tasks');
          setTasks(tasksRes.data);
        }

        // Get all projects
        const projectsRes = await axios.get('/projects');
        setProjects(projectsRes.data);

        setLoading(false);
      } catch (err) {
        console.error('Dashboard data fetch error:', err);
        setError('Failed to load dashboard data. Please try again.');
        setLoading(false);
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
        Welcome back, {user.name}!
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
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
              
              {(user.role === 'Admin' || user.role === 'Project Manager') && (
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
              
              {(user.role === 'Admin' || user.role === 'Project Manager') && (
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

        {/* AI Recommendations for Admin and Project Manager */}
        {(user.role === 'Admin' || user.role === 'Project Manager') && (
          <Grid item xs={12}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="h6" gutterBottom>
                AI Task Recommendations
              </Typography>
              <Divider sx={{ mb: 2 }} />
              <Typography variant="body2" color="text.secondary" paragraph>
                Our AI suggests the following task assignments based on team members' skills, current workload, and past performance:
              </Typography>
              <Typography variant="body2" sx={{ fontStyle: 'italic', color: 'primary.main' }}>
                This is a placeholder for AI recommendations. In a real implementation, this would show AI-generated task assignments based on performance data.
              </Typography>
            </Paper>
          </Grid>
        )}
      </Grid>
    </Box>
  );
};

export default Dashboard; 