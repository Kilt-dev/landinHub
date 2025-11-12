const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const notificationController = require('../controllers/notificationController');

/* ====== USER / SELLER / ADMIN ====== */
router.get('/notifications', authMiddleware, notificationController.getMyNotifications);
router.patch('/notifications/:id/read', authMiddleware, notificationController.markAsRead);

module.exports = router;