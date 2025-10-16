const express = require('express');
const router = express.Router();
const templateController = require('../controllers/templateController');
const authMiddleware = require('../middleware/authMiddleware');

// ✅ ĐÚNG 100% - KHÔNG THỪA /templates!
router.get('/', templateController.getTemplates);                    // GET /api/templates
router.get('/:id/preview', templateController.previewTemplate);     // GET /api/templates/:id/preview
router.post('/:id/use', authMiddleware, templateController.useTemplate); // POST /api/templates/:id/use

// ADMIN ROUTES
router.post('/presigned-url', authMiddleware, templateController.getPresignedUrl);
router.post('/metadata', authMiddleware, templateController.saveTemplateMetadata);
router.put('/:id', authMiddleware, templateController.updateTemplate);
router.delete('/:id', authMiddleware, templateController.deleteTemplate);

module.exports = router;