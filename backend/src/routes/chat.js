const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const chatController = require('../controllers/chatController');

// All chat routes require authentication
router.use(authMiddleware);

// User chat endpoints
router.post('/rooms', chatController.createOrGetRoom);
router.get('/rooms', chatController.getUserRooms);
router.get('/rooms/:roomId/messages', chatController.getRoomMessages);
router.post('/rooms/:roomId/messages', chatController.sendMessage);
router.post('/rooms/:roomId/messages/ai', chatController.sendMessageWithAI);
router.post('/rooms/:roomId/de-escalate', chatController.deEscalateRoom);
router.post('/rooms/:roomId/close', chatController.closeRoom);

// Admin chat endpoints
router.get('/admin/rooms', chatController.getAdminRooms);
router.get('/admin/rooms/pending', chatController.getAdminPendingRooms);
router.get('/admin/stats', chatController.getAdminStats);
router.post('/admin/rooms/:roomId/assign', chatController.assignRoomToSelf);

module.exports = router;