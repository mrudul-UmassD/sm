const express = require('express');
const router = express.Router();
const { 
  getAllUsers, 
  getUserById, 
  createUser, 
  updateUser, 
  deleteUser,
  getUsersByRole,
  getUsersByTeam
} = require('../controllers/userController');
const { authenticate, authorize } = require('../middleware/auth');

// User routes
router.get('/', authenticate, getAllUsers);
router.get('/:id', authenticate, getUserById);
router.post('/', authenticate, createUser);
router.put('/:id', authenticate, updateUser);
router.delete('/:id', authenticate, authorize('Admin'), deleteUser);
router.get('/role/:role', authenticate, getUsersByRole);
router.get('/team/:team', authenticate, getUsersByTeam);

module.exports = router; 