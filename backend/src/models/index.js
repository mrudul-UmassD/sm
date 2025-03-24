const User = require('./User');
const Project = require('./Project');
const Task = require('./Task');
const Comment = require('./Comment');
const PerformanceLog = require('./PerformanceLog');
const { sequelize } = require('../config/db');

// Define associations
// Project - Task associations (one-to-many)
Project.hasMany(Task, { foreignKey: 'project_id' });
Task.belongsTo(Project, { foreignKey: 'project_id' });

// User - Task associations (one-to-many)
User.hasMany(Task, { foreignKey: 'assigned_to', as: 'AssignedTasks' });
Task.belongsTo(User, { foreignKey: 'assigned_to', as: 'Assignee' });

// User - Comment associations (one-to-many)
User.hasMany(Comment, { foreignKey: 'user_id' });
Comment.belongsTo(User, { foreignKey: 'user_id' });

// Task - Comment associations (one-to-many)
Task.hasMany(Comment, { foreignKey: 'task_id' });
Comment.belongsTo(Task, { foreignKey: 'task_id' });

// User - PerformanceLog associations (one-to-many)
User.hasMany(PerformanceLog, { foreignKey: 'user_id' });
PerformanceLog.belongsTo(User, { foreignKey: 'user_id' });

// Task - PerformanceLog associations (one-to-many)
Task.hasMany(PerformanceLog, { foreignKey: 'task_id' });
PerformanceLog.belongsTo(Task, { foreignKey: 'task_id' });

// Sync all models with the database
const syncDatabase = async () => {
  try {
    await sequelize.sync({ alter: true });
    console.log('All models were synchronized successfully.');
    
    // Create default admin user if it doesn't exist
    const adminExists = await User.findOne({ where: { email: 'admin@smartsprint.com' } });
    
    if (!adminExists) {
      await User.create({
        name: 'Administrator',
        email: 'admin@smartsprint.com',
        password: 'admin',
        role: 'Admin',
        team: 'None',
        level: 'None',
      });
      console.log('Default admin user created.');
    }
  } catch (error) {
    console.error('Error synchronizing database:', error);
  }
};

module.exports = {
  User,
  Project,
  Task,
  Comment,
  PerformanceLog,
  syncDatabase,
}; 