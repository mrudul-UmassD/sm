const express = require('express');
const router = express.Router();
const { login, register, getProfile, changePassword } = require('../controllers/authController');
const { authenticate } = require('../middleware/auth');

// Authentication routes
router.post('/login', login);

// The following routes are disabled as per requirements
// Only email-based login is allowed
// router.post('/register', register);
// router.get('/profile', authenticate, getProfile);
// router.post('/change-password', authenticate, changePassword);

// Keep these routes but they will return 403 Forbidden from the controller
router.post('/register', register);
router.get('/profile', authenticate, getProfile);
router.post('/change-password', authenticate, changePassword);

module.exports = router; 