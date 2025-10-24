const express = require('express');
const router = express.Router();
const {
    getUserFinancialReport,
    getAdminSystemReport,
    getPagePerformanceReport
} = require('../controllers/reportsController');
const { authenticateToken } = require('../middleware/authMiddleware');
const { requireAdmin } = require('../middleware/adminMiddleware');

/**
 * ========== USER REPORTS ==========
 */

// Báo cáo tài chính cá nhân
// GET /api/reports/financial?period=month&startDate=2024-01-01&endDate=2024-12-31
router.get('/financial', authenticateToken, getUserFinancialReport);

// Báo cáo hiệu suất pages
// GET /api/reports/pages
router.get('/pages', authenticateToken, getPagePerformanceReport);

/**
 * ========== ADMIN REPORTS ==========
 */

// Báo cáo tổng quan hệ thống (chỉ admin)
// GET /api/reports/admin/system?startDate=2024-01-01&endDate=2024-12-31
router.get('/admin/system', authenticateToken, requireAdmin, getAdminSystemReport);

module.exports = router;