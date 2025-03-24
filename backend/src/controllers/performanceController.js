const { PerformanceLog, User, Task, Project } = require('../models');
const { Op, Sequelize } = require('sequelize');

// Get performance logs for a user
const getUserPerformanceLogs = async (req, res) => {
  try {
    const { user_id } = req.params;
    
    // Find user
    const user = await User.findByPk(user_id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Check permissions
    if (req.user.user_id !== parseInt(user_id) && 
        req.user.role !== 'Admin' && 
        req.user.role !== 'Project Manager') {
      return res.status(403).json({ message: 'Not authorized to view this user performance' });
    }
    
    const logs = await PerformanceLog.findAll({
      where: { user_id },
      include: [
        {
          model: Task,
          attributes: ['task_id', 'title', 'status', 'project_id'],
          include: [
            {
              model: Project,
              attributes: ['project_id', 'name'],
            },
          ],
        },
      ],
      order: [['recorded_at', 'DESC']],
    });
    
    res.status(200).json(logs);
  } catch (error) {
    console.error('Get user performance logs error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get performance logs for a task
const getTaskPerformanceLogs = async (req, res) => {
  try {
    const { task_id } = req.params;
    
    // Find task
    const task = await Task.findByPk(task_id);
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }
    
    const logs = await PerformanceLog.findAll({
      where: { task_id },
      include: [
        {
          model: User,
          attributes: ['user_id', 'name', 'role', 'team', 'level'],
        },
      ],
      order: [['recorded_at', 'DESC']],
    });
    
    res.status(200).json(logs);
  } catch (error) {
    console.error('Get task performance logs error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get performance logs for a project
const getProjectPerformanceLogs = async (req, res) => {
  try {
    const { project_id } = req.params;
    
    // Find project
    const project = await Project.findByPk(project_id);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }
    
    // Get all tasks for the project
    const tasks = await Task.findAll({
      where: { project_id },
      attributes: ['task_id'],
    });
    
    const taskIds = tasks.map(task => task.task_id);
    
    // Get performance logs for all tasks in the project
    const logs = await PerformanceLog.findAll({
      where: {
        task_id: {
          [Op.in]: taskIds,
        },
      },
      include: [
        {
          model: User,
          attributes: ['user_id', 'name', 'role', 'team', 'level'],
        },
        {
          model: Task,
          attributes: ['task_id', 'title', 'status'],
        },
      ],
      order: [['recorded_at', 'DESC']],
    });
    
    res.status(200).json(logs);
  } catch (error) {
    console.error('Get project performance logs error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get user performance analytics
const getUserPerformanceAnalytics = async (req, res) => {
  try {
    const { user_id } = req.params;
    
    // Find user
    const user = await User.findByPk(user_id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Check permissions
    if (req.user.user_id !== parseInt(user_id) && 
        req.user.role !== 'Admin' && 
        req.user.role !== 'Project Manager') {
      return res.status(403).json({ message: 'Not authorized to view this user analytics' });
    }
    
    // Get total time spent by task status
    const timeByTaskStatus = await PerformanceLog.findAll({
      attributes: [
        [Sequelize.fn('SUM', Sequelize.col('time_spent')), 'total_time'],
      ],
      include: [
        {
          model: Task,
          attributes: ['status'],
          required: true,
        },
      ],
      where: { user_id },
      group: ['Task.status'],
      raw: true,
    });
    
    // Get total time spent by project
    const timeByProject = await PerformanceLog.findAll({
      attributes: [
        [Sequelize.fn('SUM', Sequelize.col('time_spent')), 'total_time'],
      ],
      include: [
        {
          model: Task,
          attributes: [],
          required: true,
          include: [
            {
              model: Project,
              attributes: ['name'],
              required: true,
            },
          ],
        },
      ],
      where: { user_id },
      group: ['Task.Project.name'],
      raw: true,
    });
    
    // Get average time spent per task
    const avgTimePerTask = await PerformanceLog.findAll({
      attributes: [
        [Sequelize.fn('AVG', Sequelize.col('time_spent')), 'avg_time'],
      ],
      where: { user_id },
      raw: true,
    });
    
    // Combine all analytics
    const analytics = {
      user_id,
      name: user.name,
      role: user.role,
      team: user.team,
      level: user.level,
      timeByTaskStatus,
      timeByProject,
      avgTimePerTask: avgTimePerTask[0]?.avg_time || 0,
    };
    
    res.status(200).json(analytics);
  } catch (error) {
    console.error('Get user performance analytics error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get team performance analytics
const getTeamPerformanceAnalytics = async (req, res) => {
  try {
    const { team } = req.params;
    
    // Check permissions
    if (req.user.role !== 'Admin' && req.user.role !== 'Project Manager') {
      return res.status(403).json({ message: 'Not authorized to view team analytics' });
    }
    
    // Get users in the team
    const users = await User.findAll({
      where: { team },
      attributes: ['user_id', 'name', 'level'],
    });
    
    const userIds = users.map(user => user.user_id);
    
    // Get total time spent by user
    const timeByUser = await PerformanceLog.findAll({
      attributes: [
        'user_id',
        [Sequelize.fn('SUM', Sequelize.col('time_spent')), 'total_time'],
      ],
      where: {
        user_id: {
          [Op.in]: userIds,
        },
      },
      group: ['user_id'],
      raw: true,
    });
    
    // Add user details to the time data
    const timeByUserWithDetails = timeByUser.map(time => {
      const user = users.find(u => u.user_id === time.user_id);
      return {
        ...time,
        name: user?.name,
        level: user?.level,
      };
    });
    
    // Get total time spent by project for the team
    const timeByProject = await PerformanceLog.findAll({
      attributes: [
        [Sequelize.fn('SUM', Sequelize.col('time_spent')), 'total_time'],
      ],
      include: [
        {
          model: Task,
          attributes: [],
          required: true,
          include: [
            {
              model: Project,
              attributes: ['name'],
              required: true,
            },
          ],
        },
      ],
      where: {
        user_id: {
          [Op.in]: userIds,
        },
      },
      group: ['Task.Project.name'],
      raw: true,
    });
    
    // Combine all analytics
    const analytics = {
      team,
      timeByUser: timeByUserWithDetails,
      timeByProject,
    };
    
    res.status(200).json(analytics);
  } catch (error) {
    console.error('Get team performance analytics error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// AI integration placeholder for optimized task assignment
const getAiTaskRecommendations = async (req, res) => {
  try {
    // Check permissions
    if (req.user.role !== 'Admin' && req.user.role !== 'Project Manager') {
      return res.status(403).json({ message: 'Not authorized to access AI recommendations' });
    }
    
    // Placeholder response for AI integration
    const recommendations = {
      message: 'AI Task Assignment Recommendations (Placeholder)',
      note: 'This is a placeholder for AI-based task assignment recommendations. In a real implementation, this would analyze user performance data, skills, and current workload to suggest optimal task assignments.',
      recommendations: [
        {
          task_id: 1,
          task_title: 'Sample Task 1',
          recommended_user: {
            user_id: 3,
            name: 'John Doe',
            reason: 'Based on past performance and current workload',
          },
        },
        {
          task_id: 2,
          task_title: 'Sample Task 2',
          recommended_user: {
            user_id: 4,
            name: 'Jane Smith',
            reason: 'Based on expertise in this task domain',
          },
        },
      ],
    };
    
    res.status(200).json(recommendations);
  } catch (error) {
    console.error('Get AI task recommendations error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  getUserPerformanceLogs,
  getTaskPerformanceLogs,
  getProjectPerformanceLogs,
  getUserPerformanceAnalytics,
  getTeamPerformanceAnalytics,
  getAiTaskRecommendations,
}; 