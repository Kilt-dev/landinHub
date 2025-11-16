const express = require('express');
const router = express.Router();
const {
    getUserFinancialReport,
    getAdminSystemReport,
    getPagePerformanceReport
} = require('../controllers/reportsController');
const authMiddleware = require('../middleware/authMiddleware');
const requireAdmin = require('../middleware/adminMiddleware');

/**
 * ========== USER REPORTS ==========
 */

// Báo cáo tài chính cá nhân
// GET /api/reports/financial?period=month&startDate=2024-01-01&endDate=2024-12-31
router.get('/financial', authMiddleware, getUserFinancialReport);

// Báo cáo hiệu suất pages
// GET /api/reports/pages
router.get('/pages', authMiddleware, getPagePerformanceReport);

/**
 * ========== ADMIN REPORTS ==========
 */

// Báo cáo tổng quan hệ thống (chỉ admin)
// GET /api/reports/admin/system?startDate=2024-01-01&endDate=2024-12-31
router.get('/admin/system', authMiddleware, requireAdmin, getAdminSystemReport);

module.exports = router;