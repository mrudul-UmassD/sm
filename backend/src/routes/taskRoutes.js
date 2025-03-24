const express = require('express');
const router = express.Router();
const { 
  getAllTasks, 
  getTaskById, 
  createTask, 
  updateTask, 
  deleteTask,
  getTasksByProject,
  getTasksByUser,
  getTasksByStatus,
  logTaskTime
} = require('../controllers/taskController');
const { authenticate, authorize } = require('../middleware/auth');

// Task routes
router.get('/', authenticate, getAllTasks);
router.get('/:id', authenticate, getTaskById);
router.post('/', authenticate, authorize('Admin', 'Project Manager'), createTask);
router.put('/:id', authenticate, updateTask);
router.delete('/:id', authenticate, authorize('Admin', 'Project Manager'), deleteTask);
router.get('/project/:project_id', authenticate, getTasksByProject);
router.get('/user/:user_id', authenticate, getTasksByUser);
router.get('/status/:status', authenticate, getTasksByStatus);
router.post('/:task_id/log-time', authenticate, logTaskTime);

module.exports = router; 