const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const { isAdmin } = require('../middleware/authMiddleware');
const payoutController = require('../controllers/payoutController');

/**
 * Admin routes
 */

// Lấy tất cả yêu cầu rút tiền
router.get('/admin/all', authMiddleware, isAdmin, payoutController.getAllPayouts);

// Lấy thống kê payout
router.get('/admin/stats', authMiddleware, isAdmin, payoutController.getPayoutStats);

// Duyệt yêu cầu rút tiền
router.post('/admin/:id/approve', authMiddleware, isAdmin, payoutController.approvePayout);

// Từ chối yêu cầu rút tiền
router.post('/admin/:id/reject', authMiddleware, isAdmin, payoutController.rejectPayout);

/**
 * Seller routes
 */

// Tạo yêu cầu rút tiền
router.post('/request', authMiddleware, payoutController.requestPayout);

// Lấy lịch sử rút tiền của mình
router.get('/my-payouts', authMiddleware, payoutController.getMyPayouts);

module.exports = router;