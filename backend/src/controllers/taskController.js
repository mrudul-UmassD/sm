const { Task, User, Comment, PerformanceLog } = require('../models');

// Get all tasks
const getAllTasks = async (req, res) => {
  try {
    const tasks = await Task.findAll({
      include: [
        {
          model: User,
          as: 'Assignee',
          attributes: ['user_id', 'name', 'email', 'role', 'team', 'level'],
        },
      ],
    });
    
    res.status(200).json(tasks);
  } catch (error) {
    console.error('Get all tasks error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get task by ID
const getTaskById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const task = await Task.findByPk(id, {
      include: [
        {
          model: User,
          as: 'Assignee',
          attributes: ['user_id', 'name', 'email', 'role', 'team', 'level'],
        },
        {
          model: Comment,
          include: [
            {
              model: User,
              attributes: ['user_id', 'name', 'role', 'team'],
            },
          ],
        },
      ],
    });
    
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }
    
    res.status(200).json(task);
  } catch (error) {
    console.error('Get task by ID error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Create task
const createTask = async (req, res) => {
  try {
    const { project_id, title, description, status, assigned_to } = req.body;
    
    // Validate required fields
    if (!project_id || !title) {
      return res.status(400).json({ message: 'Project ID and title are required' });
    }
    
    // Check permissions (only admin and project manager can create tasks)
    if (req.user.role !== 'Admin' && req.user.role !== 'Project Manager') {
      return res.status(403).json({ message: 'Not authorized to create tasks' });
    }
    
    // Create task
    const task = await Task.create({
      project_id,
      title,
      description,
      status: status || 'Created',
      assigned_to,
    });
    
    res.status(201).json(task);
  } catch (error) {
    console.error('Create task error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Update task
const updateTask = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, status, assigned_to } = req.body;
    
    // Find task
    const task = await Task.findByPk(id);
    
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }
    
    // Different permission levels for different updates
    if (req.user.role !== 'Admin' && req.user.role !== 'Project Manager') {
      // Developers and testers can only update status (if assigned to them)
      if (req.user.user_id !== task.assigned_to || 
          (title !== undefined || description !== undefined || assigned_to !== undefined)) {
        return res.status(403).json({ message: 'Not authorized to update this task' });
      }
    }
    
    // Update task
    await task.update({
      title: title || task.title,
      description: description !== undefined ? description : task.description,
      status: status || task.status,
      assigned_to: assigned_to !== undefined ? assigned_to : task.assigned_to,
    });
    
    const updatedTask = await Task.findByPk(id, {
      include: [
        {
          model: User,
          as: 'Assignee',
          attributes: ['user_id', 'name', 'email', 'role', 'team', 'level'],
        },
      ],
    });
    
    res.status(200).json(updatedTask);
  } catch (error) {
    console.error('Update task error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Delete task
const deleteTask = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Find task
    const task = await Task.findByPk(id);
    
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }
    
    // Check permissions (only admin and project manager can delete tasks)
    if (req.user.role !== 'Admin' && req.user.role !== 'Project Manager') {
      return res.status(403).json({ message: 'Not authorized to delete tasks' });
    }
    
    // Delete task
    await task.destroy();
    
    res.status(200).json({ message: 'Task deleted successfully' });
  } catch (error) {
    console.error('Delete task error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get tasks by project
const getTasksByProject = async (req, res) => {
  try {
    const { project_id } = req.params;
    
    const tasks = await Task.findAll({
      where: { project_id },
      include: [
        {
          model: User,
          as: 'Assignee',
          attributes: ['user_id', 'name', 'email', 'role', 'team', 'level'],
        },
      ],
    });
    
    res.status(200).json(tasks);
  } catch (error) {
    console.error('Get tasks by project error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get tasks by user
const getTasksByUser = async (req, res) => {
  try {
    const { user_id } = req.params;
    
    const tasks = await Task.findAll({
      where: { assigned_to: user_id },
      include: [
        {
          model: User,
          as: 'Assignee',
          attributes: ['user_id', 'name', 'email', 'role', 'team', 'level'],
        },
      ],
    });
    
    res.status(200).json(tasks);
  } catch (error) {
    console.error('Get tasks by user error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get tasks by status
const getTasksByStatus = async (req, res) => {
  try {
    const { status } = req.params;
    
    const tasks = await Task.findAll({
      where: { status },
      include: [
        {
          model: User,
          as: 'Assignee',
          attributes: ['user_id', 'name', 'email', 'role', 'team', 'level'],
        },
      ],
    });
    
    res.status(200).json(tasks);
  } catch (error) {
    console.error('Get tasks by status error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Log time for a task
const logTaskTime = async (req, res) => {
  try {
    const { task_id } = req.params;
    const { time_spent } = req.body;
    
    // Validate input
    if (!time_spent || isNaN(time_spent) || time_spent <= 0) {
      return res.status(400).json({ message: 'Valid time spent is required (positive number)' });
    }
    
    // Find task
    const task = await Task.findByPk(task_id);
    
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }
    
    // Check if user is assigned to the task or is admin/project manager
    if (req.user.user_id !== task.assigned_to && 
        req.user.role !== 'Admin' && 
        req.user.role !== 'Project Manager') {
      return res.status(403).json({ message: 'Not authorized to log time for this task' });
    }
    
    // Create performance log
    const log = await PerformanceLog.create({
      user_id: req.user.user_id,
      task_id,
      time_spent,
    });
    
    res.status(201).json(log);
  } catch (error) {
    console.error('Log task time error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  getAllTasks,
  getTaskById,
  createTask,
  updateTask,
  deleteTask,
  getTasksByProject,
  getTasksByUser,
  getTasksByStatus,
  logTaskTime,
}; 