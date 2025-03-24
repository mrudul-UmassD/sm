import React, { useState, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import { 
  AppBar,
  Box,
  Toolbar,
  Typography,
  Button,
  IconButton,
  Menu,
  MenuItem,
  Divider,
  Avatar,
  Stack,
  CircularProgress
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import { AccountCircle, Assessment, Dashboard, ExitToApp, Group, ListAlt } from '@mui/icons-material';

const Navbar = () => {
  const { user, logout, loading } = useContext(AuthContext);
  const navigate = useNavigate();
  
  const [mobileMenuAnchorEl, setMobileMenuAnchorEl] = useState(null);
  const [userMenuAnchorEl, setUserMenuAnchorEl] = useState(null);
  
  const isMobileMenuOpen = Boolean(mobileMenuAnchorEl);
  const isUserMenuOpen = Boolean(userMenuAnchorEl);
  
  const handleMobileMenuOpen = (event) => {
    setMobileMenuAnchorEl(event.currentTarget);
  };
  
  const handleMobileMenuClose = () => {
    setMobileMenuAnchorEl(null);
  };
  
  const handleUserMenuOpen = (event) => {
    setUserMenuAnchorEl(event.currentTarget);
  };
  
  const handleUserMenuClose = () => {
    setUserMenuAnchorEl(null);
  };
  
  const handleLogout = () => {
    logout();
    navigate('/login');
    handleUserMenuClose();
  };
  
  // Guest links for unauthenticated users
  const guestLinks = (
    <Box>
      <Button color="inherit" component={Link} to="/login">
        Login
      </Button>
    </Box>
  );
  
  // Auth links for authenticated users
  const authLinks = (
    <>
      <Box sx={{ display: { xs: 'none', md: 'flex' }, alignItems: 'center' }}>
        <Button 
          color="inherit" 
          component={Link} 
          to="/dashboard"
          startIcon={<Dashboard />}
        >
          Dashboard
        </Button>
        
        {/* Admin and Project Manager links */}
        {user && (user.role === 'Admin' || user.role === 'Project Manager') && (
          <>
            <Button 
              color="inherit" 
              component={Link} 
              to="/projects"
              startIcon={<ListAlt />}
            >
              Projects
            </Button>
            <Button 
              color="inherit" 
              component={Link} 
              to="/users"
              startIcon={<Group />}
            >
              Users
            </Button>
            <Button 
              color="inherit" 
              component={Link} 
              to="/analytics"
              startIcon={<Assessment />}
            >
              Analytics
            </Button>
          </>
        )}
        
        {/* User profile button */}
        <IconButton
          onClick={handleUserMenuOpen}
          color="inherit"
          edge="end"
          sx={{ ml: 2 }}
        >
          <Avatar 
            sx={{ width: 32, height: 32, bgcolor: 'secondary.main' }}
          >
            {user?.name?.charAt(0) || 'U'}
          </Avatar>
        </IconButton>
        <Menu
          anchorEl={userMenuAnchorEl}
          open={isUserMenuOpen}
          onClose={handleUserMenuClose}
        >
          <MenuItem disabled>
            <Stack direction="column" spacing={0}>
              <Typography variant="subtitle2">{user?.name || 'User'}</Typography>
              <Typography variant="caption" color="text.secondary">
                {user?.role || 'User'} 
                {user?.team ? (user.team !== 'None' ? ` • ${user.team}` : '') : ''}
              </Typography>
            </Stack>
          </MenuItem>
          <Divider />
          <MenuItem onClick={handleLogout}>
            <ExitToApp sx={{ mr: 1 }} /> Logout
          </MenuItem>
        </Menu>
      </Box>
      
      {/* Mobile menu icon */}
      <Box sx={{ display: { xs: 'flex', md: 'none' } }}>
        <IconButton
          color="inherit"
          aria-label="menu"
          onClick={handleMobileMenuOpen}
          edge="end"
        >
          <MenuIcon />
        </IconButton>
      </Box>
      
      {/* Mobile menu */}
      <Menu
        anchorEl={mobileMenuAnchorEl}
        open={isMobileMenuOpen}
        onClose={handleMobileMenuClose}
      >
        <MenuItem onClick={() => { handleMobileMenuClose(); navigate('/dashboard'); }}>
          <Dashboard sx={{ mr: 1 }} /> Dashboard
        </MenuItem>
        
        {user && (user.role === 'Admin' || user.role === 'Project Manager') && (
          <>
            <MenuItem onClick={() => { handleMobileMenuClose(); navigate('/projects'); }}>
              <ListAlt sx={{ mr: 1 }} /> Projects
            </MenuItem>
            <MenuItem onClick={() => { handleMobileMenuClose(); navigate('/users'); }}>
              <Group sx={{ mr: 1 }} /> Users
            </MenuItem>
            <MenuItem onClick={() => { handleMobileMenuClose(); navigate('/analytics'); }}>
              <Assessment sx={{ mr: 1 }} /> Analytics
            </MenuItem>
          </>
        )}
        
        <Divider />
        <MenuItem onClick={() => { handleMobileMenuClose(); handleLogout(); }}>
          <ExitToApp sx={{ mr: 1 }} /> Logout
        </MenuItem>
      </Menu>
    </>
  );
  
  return (
    <Box sx={{ flexGrow: 1 }}>
      <AppBar position="static">
        <Toolbar>
          <Typography 
            variant="h6" 
            component={Link} 
            to="/" 
            sx={{ 
              flexGrow: 1, 
              textDecoration: 'none', 
              color: 'inherit',
              fontWeight: 'bold'
            }}
          >
            SmartSprint
          </Typography>
          
          {loading ? (
            <CircularProgress color="inherit" size={24} />
          ) : (
            user ? authLinks : guestLinks
          )}
        </Toolbar>
      </AppBar>
    </Box>
  );
};

export default Navbar; 