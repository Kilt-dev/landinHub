const express = require('express');
const router = express.Router();
const formSubmissionController = require('../controllers/formSubmissionController');
const authMiddleware = require('../middleware/auth');

/**
 * Form Submission Routes
 * Handles form submissions and management similar to LadiPage
 */

// Public route - Submit a form (called by end users from landing pages)
router.post('/submit', formSubmissionController.submitForm);

// Protected routes - Require authentication
router.use(authMiddleware);

// Get all submissions for current user (across all pages)
router.get('/submissions', formSubmissionController.getUserSubmissions);

// Get all submissions for a specific page
router.get('/submissions/:pageId', formSubmissionController.getPageSubmissions);

// Get a single submission
router.get('/submission/:id', formSubmissionController.getSubmission);

// Update submission (status, tags, notes)
router.patch('/submission/:id', formSubmissionController.updateSubmission);

// Delete single submission
router.delete('/submission/:id', formSubmissionController.deleteSubmission);

// Bulk delete submissions
router.delete('/submissions', formSubmissionController.deleteSubmission);

// Export submissions to CSV/JSON
router.get('/export/:pageId', formSubmissionController.exportSubmissions);

// Get submission statistics for a page
router.get('/stats/:pageId', formSubmissionController.getSubmissionStats);

module.exports = router;
