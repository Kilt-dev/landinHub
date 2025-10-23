const express = require('express');
const router = express.Router();
const auth = require('../middleware/authMiddleware');
const marketplaceController = require('../controllers/marketplaceController');

/**
 * Protected routes - yêu cầu authentication (phải đặt trước dynamic routes)
 */

// Lấy marketplace pages của user
router.get('/my/pages', auth, marketplaceController.getMyMarketplacePages);

// Lấy các page đã mua
router.get('/my/purchased', auth, marketplaceController.getPurchasedPages);

// Lấy thống kê seller
router.get('/seller/stats', auth, marketplaceController.getSellerStats);

// Download marketplace page as HTML ZIP
router.get('/:id/download/html', auth, marketplaceController.downloadAsHTML);

// Download marketplace page as .iuhpage
router.get('/:id/download/iuhpage', auth, marketplaceController.downloadAsIUHPage);

// Đăng bán landing page
router.post('/sell', auth, marketplaceController.sellPage);

// Cập nhật marketplace page
router.put('/:id', auth, marketplaceController.updateMarketplacePage);

// Xóa marketplace page
router.delete('/:id', auth, marketplaceController.deleteMarketplacePage);

// Like/Unlike marketplace page
router.post('/:id/like', auth, marketplaceController.toggleLike);
router.get('/:id/detail', auth, marketplaceController.getPageDetailWithOrder);
/**
 * Public routes - không cần authentication
 */

// Lấy featured pages (phải đặt trước /:id)
router.get('/featured/list', marketplaceController.getFeaturedPages);

// Lấy bestsellers (phải đặt trước /:id)
router.get('/bestsellers/list', marketplaceController.getBestsellers);

// Lấy new arrivals (phải đặt trước /:id)
router.get('/new-arrivals/list', marketplaceController.getNewArrivals);

// Lấy danh sách marketplace pages
router.get('/', marketplaceController.getMarketplacePages);

// Lấy chi tiết marketplace page (phải đặt cuối cùng)
router.get('/:id', marketplaceController.getMarketplacePageDetail);
router.get("/:id/detail-order", auth, marketplaceController.getPageDetailWithOrder);
router.post('/:id/reviews', auth, marketplaceController.submitReview);
router.get('/:id/reviews', marketplaceController.getReviews);

module.exports = router;