const express = require('express');
const router = express.Router();
const { login, register, getProfile, changePassword } = require('../controllers/authController');
const { authenticate } = require('../middleware/auth');

// Authentication routes
router.post('/login', login);
router.post('/register', register);
router.get('/profile', authenticate, getProfile);
router.post('/change-password', authenticate, changePassword);

module.exports = router; 