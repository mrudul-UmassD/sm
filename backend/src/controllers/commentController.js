const { Comment, User, Task } = require('../models');

// Get all comments for a task
const getCommentsByTask = async (req, res) => {
  try {
    const { task_id } = req.params;
    
    const comments = await Comment.findAll({
      where: { task_id },
      include: [
        {
          model: User,
          attributes: ['user_id', 'name', 'role', 'team'],
        },
      ],
      order: [['createdAt', 'DESC']],
    });
    
    res.status(200).json(comments);
  } catch (error) {
    console.error('Get comments by task error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Create comment
const createComment = async (req, res) => {
  try {
    const { task_id } = req.params;
    const { content } = req.body;
    
    // Validate required fields
    if (!content) {
      return res.status(400).json({ message: 'Comment content is required' });
    }
    
    // Check if task exists
    const task = await Task.findByPk(task_id);
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }
    
    // Create comment
    const comment = await Comment.create({
      task_id,
      user_id: req.user.user_id,
      content,
    });
    
    // Fetch the created comment with user details
    const createdComment = await Comment.findByPk(comment.comment_id, {
      include: [
        {
          model: User,
          attributes: ['user_id', 'name', 'role', 'team'],
        },
      ],
    });
    
    res.status(201).json(createdComment);
  } catch (error) {
    console.error('Create comment error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Update comment
const updateComment = async (req, res) => {
  try {
    const { id } = req.params;
    const { content } = req.body;
    
    // Validate required fields
    if (!content) {
      return res.status(400).json({ message: 'Comment content is required' });
    }
    
    // Find comment
    const comment = await Comment.findByPk(id);
    
    if (!comment) {
      return res.status(404).json({ message: 'Comment not found' });
    }
    
    // Check if user is authorized to update the comment
    if (req.user.user_id !== comment.user_id && req.user.role !== 'Admin') {
      return res.status(403).json({ message: 'Not authorized to update this comment' });
    }
    
    // Update comment
    await comment.update({ content });
    
    // Fetch the updated comment with user details
    const updatedComment = await Comment.findByPk(id, {
      include: [
        {
          model: User,
          attributes: ['user_id', 'name', 'role', 'team'],
        },
      ],
    });
    
    res.status(200).json(updatedComment);
  } catch (error) {
    console.error('Update comment error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Delete comment
const deleteComment = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Find comment
    const comment = await Comment.findByPk(id);
    
    if (!comment) {
      return res.status(404).json({ message: 'Comment not found' });
    }
    
    // Check if user is authorized to delete the comment
    if (req.user.user_id !== comment.user_id && 
        req.user.role !== 'Admin' && 
        req.user.role !== 'Project Manager') {
      return res.status(403).json({ message: 'Not authorized to delete this comment' });
    }
    
    // Delete comment
    await comment.destroy();
    
    res.status(200).json({ message: 'Comment deleted successfully' });
  } catch (error) {
    console.error('Delete comment error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  getCommentsByTask,
  createComment,
  updateComment,
  deleteComment,
}; 