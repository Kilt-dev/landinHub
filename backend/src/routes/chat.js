const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chatController');
const { authMiddleware, isAdmin } = require('../middleware/authMiddleware');
const multer = require('multer');
const multerS3 = require('multer-s3');
const AWS = require('aws-sdk');
const path = require('path');

// Configure AWS S3
const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION || 'ap-southeast-1'
});

// Configure multer for S3 upload
const upload = multer({
  storage: multerS3({
    s3: s3,
    bucket: process.env.AWS_S3_BUCKET || 'landing-hub-deployments',
    acl: 'public-read',
    metadata: function (req, file, cb) {
      cb(null, { fieldName: file.fieldname });
    },
    key: function (req, file, cb) {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      const ext = path.extname(file.originalname);
      cb(null, `chat-uploads/${req.user.id}/${uniqueSuffix}${ext}`);
    }
  }),
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  },
  fileFilter: function (req, file, cb) {
    // Allow images and common document types
    const allowedMimes = [
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp',
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain'
    ];

    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Định dạng file không được hỗ trợ'));
    }
  }
});

// ===== USER ROUTES =====

// Create or get existing room
router.post('/rooms', authMiddleware, chatController.createOrGetRoom);

// Get user's chat rooms
router.get('/rooms', authMiddleware, chatController.getUserRooms);

// Get messages for a specific room
router.get('/rooms/:roomId/messages', authMiddleware, chatController.getRoomMessages);

// Send message (REST fallback)
router.post('/rooms/:roomId/messages', authMiddleware, chatController.sendMessage);

// Send message with AI auto-response
router.post('/rooms/:roomId/messages/ai', authMiddleware, chatController.sendMessageWithAI);

// Upload file to chat
router.post('/rooms/:roomId/upload', authMiddleware, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Không có file được upload'
      });
    }

    const fileData = {
      type: req.file.mimetype.startsWith('image/') ? 'image' : 'file',
      url: req.file.location,
      filename: req.file.originalname,
      size: req.file.size,
      mime_type: req.file.mimetype
    };

    res.json({
      success: true,
      file: fileData
    });
  } catch (error) {
    console.error('Upload file error:', error);
    res.status(500).json({
      success: false,
      message: 'Không thể upload file',
      error: error.message
    });
  }
});

// Close/resolve room
router.put('/rooms/:roomId/close', authMiddleware, chatController.closeRoom);

// Rate chat experience
router.post('/rooms/:roomId/rate', authMiddleware, chatController.rateRoom);

// ===== ADMIN ROUTES =====

// Get all support rooms
router.get('/admin/rooms', authMiddleware, isAdmin, chatController.getAllRooms);

// Assign room to current admin
router.put('/admin/rooms/:roomId/assign', authMiddleware, isAdmin, chatController.assignRoom);

// Update room status/priority
router.put('/admin/rooms/:roomId/status', authMiddleware, isAdmin, chatController.updateRoomStatus);

// Get chat statistics
router.get('/admin/stats', authMiddleware, isAdmin, chatController.getChatStats);

module.exports = router;
