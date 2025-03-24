const express = require('express');
const router = express.Router();
const { 
  getCommentsByTask,
  createComment,
  updateComment,
  deleteComment
} = require('../controllers/commentController');
const { authenticate } = require('../middleware/auth');

// Comment routes
router.get('/task/:task_id', authenticate, getCommentsByTask);
router.post('/task/:task_id', authenticate, createComment);
router.put('/:id', authenticate, updateComment);
router.delete('/:id', authenticate, deleteComment);

module.exports = router; 