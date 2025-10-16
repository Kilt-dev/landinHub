const express = require('express');
const router = express.Router();
const analyticsController = require('../controllers/analyticsController');
const authenticate = require('../middleware/auth');

// Routes
router.get('/overview', authenticate, analyticsController.getUserAnalyticsOverview);
router.get('/page/:id', authenticate, analyticsController.getPageAnalytics);
router.get('/chart/:id?', authenticate, analyticsController.getChartData);
router.post('/update/:id', authenticate, analyticsController.updatePageAnalytics);

module.exports = router;