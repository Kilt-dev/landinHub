const express = require('express');
const router = express.Router();
const imageController = require('../controllers/imageController');
const authMiddleware = require('../middleware/authMiddleware');

// Route: Upload single image
router.post('/upload',authMiddleware, imageController.uploadSingle, imageController.uploadImage);

// Route: Upload multiple images
router.post('/upload/multiple', imageController.uploadMultiple, imageController.uploadImages);

// Route: Get images by pageId
router.get('/page/:pageId', authMiddleware, imageController.getPageImages);

// Route: Get all user images
router.get('/user', authMiddleware, imageController.getUserImages);

// Route: Delete image by key
router.delete('/:key', authMiddleware, imageController.deleteImage);

// Route: Get presigned URL for direct upload
router.post('/presigned-url', authMiddleware, imageController.getPresignedUrl);

module.exports = router;