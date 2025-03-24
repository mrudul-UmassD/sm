const express = require('express');
const router = express.Router();
const { 
  getUserPerformanceLogs,
  getTaskPerformanceLogs,
  getProjectPerformanceLogs,
  getUserPerformanceAnalytics,
  getTeamPerformanceAnalytics,
  getAiTaskRecommendations
} = require('../controllers/performanceController');
const { authenticate, authorize } = require('../middleware/auth');

// Performance routes
router.get('/user/:user_id/logs', authenticate, getUserPerformanceLogs);
router.get('/task/:task_id/logs', authenticate, getTaskPerformanceLogs);
router.get('/project/:project_id/logs', authenticate, getProjectPerformanceLogs);
router.get('/user/:user_id/analytics', authenticate, getUserPerformanceAnalytics);
router.get('/team/:team/analytics', authenticate, authorize('Admin', 'Project Manager'), getTeamPerformanceAnalytics);
router.get('/ai/recommendations', authenticate, authorize('Admin', 'Project Manager'), getAiTaskRecommendations);

module.exports = router; 