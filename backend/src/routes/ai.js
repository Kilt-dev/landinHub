const express = require('express');
const router = express.Router();
const aiController = require('../controllers/aiController');
const authMiddleware = require('../middleware/authMiddleware');

/**
 * AI Routes
 * All routes require authentication
 */

// Generate AI content for text elements
router.post('/generate-content', authMiddleware, aiController.generateContent);

// Analyze landing page with AI
router.post('/analyze-page', authMiddleware, aiController.analyzePage);

// Get AI layout suggestions
router.post('/layout-suggestions', authMiddleware, aiController.getLayoutSuggestions);

module.exports = router;
