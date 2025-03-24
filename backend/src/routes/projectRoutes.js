const express = require('express');
const router = express.Router();
const { 
  getAllProjects, 
  getProjectById, 
  createProject, 
  updateProject, 
  deleteProject,
  getProjectsByStatus
} = require('../controllers/projectController');
const { authenticate, authorize } = require('../middleware/auth');

// Project routes
router.get('/', authenticate, getAllProjects);
router.get('/:id', authenticate, getProjectById);
router.post('/', authenticate, authorize('Admin', 'Project Manager'), createProject);
router.put('/:id', authenticate, authorize('Admin', 'Project Manager'), updateProject);
router.delete('/:id', authenticate, authorize('Admin'), deleteProject);
router.get('/status/:status', authenticate, getProjectsByStatus);

module.exports = router; 