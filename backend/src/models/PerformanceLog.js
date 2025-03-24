const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const PerformanceLog = sequelize.define('PerformanceLog', {
  log_id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Users',
      key: 'user_id',
    },
  },
  task_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Tasks',
      key: 'task_id',
    },
  },
  time_spent: {
    type: DataTypes.INTEGER, // Time spent in minutes
    allowNull: false,
    defaultValue: 0,
  },
  recorded_at: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
  },
});

module.exports = PerformanceLog; 