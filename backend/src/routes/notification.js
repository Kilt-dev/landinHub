const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const notificationController = require('../controllers/notificationController');

/* ====== USER / SELLER / ADMIN ====== */
router.get('/notifications', authMiddleware, notificationController.getMyNotifications);
router.get('/notifications/unread/count', authMiddleware, notificationController.getUnreadCount);
router.patch('/notifications/:id/read', authMiddleware, notificationController.markAsRead);
router.patch('/notifications/read-all', authMiddleware, notificationController.markAllAsRead);

module.exports = router;