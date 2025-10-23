const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const { isAdmin } = require('../middleware/authMiddleware');
const adminMarketplaceController = require('../controllers/adminMarketplaceController');

/**
 * Marketplace management
 */

// Lấy danh sách pending pages
router.get('/pending', authMiddleware, isAdmin, adminMarketplaceController.getPendingPages);

// Lấy tất cả marketplace pages
router.get('/pages', authMiddleware, isAdmin, adminMarketplaceController.getAllMarketplacePages);

// Approve marketplace page
router.post('/pages/:id/approve', authMiddleware, isAdmin, adminMarketplaceController.approvePage);

// Reject marketplace page
router.post('/pages/:id/reject', authMiddleware, isAdmin, adminMarketplaceController.rejectPage);

// Suspend marketplace page
router.post('/pages/:id/suspend', authMiddleware, isAdmin, adminMarketplaceController.suspendPage);

// Toggle featured status
router.post('/pages/:id/toggle-featured', authMiddleware, isAdmin, adminMarketplaceController.toggleFeatured);

// Delete marketplace page
router.delete('/pages/:id', authMiddleware, isAdmin, adminMarketplaceController.deletePage);

// Lấy marketplace statistics
router.get('/stats', authMiddleware, isAdmin, adminMarketplaceController.getMarketplaceStats);

/**
 * Transaction management
 */

// Lấy tất cả transactions
router.get('/transactions', authMiddleware, isAdmin, adminMarketplaceController.getAllTransactions);

// Lấy refund requests
router.get('/refunds', authMiddleware, isAdmin, adminMarketplaceController.getRefundRequests);

// Process refund
router.post('/refunds/process', authMiddleware, isAdmin, adminMarketplaceController.processRefund);

// Reject refund
router.post('/refunds/reject', authMiddleware, isAdmin, adminMarketplaceController.rejectRefund);

module.exports = router;