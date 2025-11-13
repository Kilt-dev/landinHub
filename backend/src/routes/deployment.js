const express = require('express');
const router = express.Router();
const deploymentController = require('../controllers/deploymentController');
const authMiddleware = require('../middleware/authMiddleware');

/**
 * Deployment Routes
 * Handles AWS CloudFront + Route 53 deployments
 * All routes require authentication - AWS credentials stored in backend .env only
 */

// All deployment routes require authentication
router.use(authMiddleware);

/**
 * Main deployment endpoint
 * POST /api/deployment/:pageId/deploy
 * Body: { customDomain?, subdomain? }
 */
router.post('/:pageId/deploy', deploymentController.deployPage);

/**
 * Get deployment information
 * GET /api/deployment/:pageId
 */
router.get('/:pageId', deploymentController.getDeploymentInfo);

/**
 * Manually invalidate CloudFront cache
 * POST /api/deployment/:pageId/invalidate
 */
router.post('/:pageId/invalidate', deploymentController.invalidateDeployment);

/**
 * Delete deployment
 * DELETE /api/deployment/:pageId
 */
router.delete('/:pageId', deploymentController.deleteDeployment);

/**
 * Test form submission for deployed page
 * POST /api/deployment/:pageId/test-form
 * For testing purposes - simulates end user form submission
 */
router.post('/:pageId/test-form', deploymentController.testFormSubmission);

module.exports = router;
