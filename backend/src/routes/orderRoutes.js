const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const { isAdmin } = require('../middleware/authMiddleware');
const orderController = require('../controllers/orderController');

// ✅ BUYER ROUTES - My purchased orders
router.get('/my', authMiddleware, orderController.getMyOrders);

// ✅ SELLER ROUTES - Orders for pages I'm selling
router.get('/seller', authMiddleware, orderController.getSellerOrders);

// Order details and actions
router.get('/:id', authMiddleware, orderController.getOrderDetail);
router.patch('/:id/cancel', authMiddleware, orderController.cancelOrder);
router.patch('/:id/refund', authMiddleware, orderController.requestRefund);

// ✅ ADMIN ROUTES
router.get('/admin/all', authMiddleware, isAdmin, orderController.getAllOrders);
router.get('/admin/stats', authMiddleware, isAdmin, orderController.getOrderStats);
router.patch('/admin/:id/status', authMiddleware, isAdmin, orderController.updateOrderStatus);
router.patch('/admin/:id/refund/process', authMiddleware, isAdmin, orderController.processRefund);

// Transactions list
router.get('/transactions', authMiddleware, orderController.getOrderTransactions);
module.exports = router;