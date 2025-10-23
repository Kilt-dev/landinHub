const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const { isAdmin } = require('../middleware/authMiddleware');
const orderController = require('../controllers/orderController');
router.get('/my/orders', authMiddleware, orderController.getMyOrders);
router.get('/orders/:id', authMiddleware, orderController.getOrderDetail);
router.patch('/orders/:id/cancel', authMiddleware, orderController.cancelOrder);
console.log('>>> REGISTER PATCH /api/orders/:id/refund <<<');
router.patch('/orders/:id/refund', authMiddleware, orderController.requestRefund);
// sau dòng patch /refund
/* ====== SELLER ====== */
router.get('/seller/orders', authMiddleware, orderController.getSellerOrders);

/* ====== ADMIN ====== */
router.get('/admin/orders', authMiddleware, isAdmin, orderController.getAllOrders);
router.patch('/admin/orders/:id/status', authMiddleware, isAdmin, orderController.updateOrderStatus);
router.patch('/admin/orders/:id/refund/process', authMiddleware, isAdmin, orderController.processRefund);
router.get('/admin/orders', authMiddleware, isAdmin, orderController.getAllOrdersAdmin);
module.exports = router;