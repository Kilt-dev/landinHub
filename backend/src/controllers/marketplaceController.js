const mongoose = require('mongoose');
const MarketplacePage = require('../models/MarketplacePage');
const Page = require('../models/Page');
const Transaction = require('../models/Transaction');
const { v4: uuidv4 } = require('uuid');
const s3CopyService = require('../services/s3CopyService');
const screenshotService = require('../services/screenshotService');
const exportService = require('../services/exportService');
const Order = require('../models/Order');
/**
 * Lấy danh sách marketplace pages (public)
 */
exports.getMarketplacePages = async (req, res) => {
    try {
        const {
            category,
            search,
            sort = 'newest',
            page = 1,
            limit = 12,
            price_min,
            price_max,
            is_featured
        } = req.query;

        let query = { status: 'ACTIVE' };

        // Filter by category
        if (category && category !== 'all') {
            query.category = category;
        }

        // Filter by price range
        if (price_min || price_max) {
            query.price = {};
            if (price_min) query.price.$gte = parseInt(price_min);
            if (price_max) query.price.$lte = parseInt(price_max);
        }

        // Filter by featured
        if (is_featured === 'true') {
            query.is_featured = true;
        }

        // Search
        let pages;
        if (search) {
            pages = await MarketplacePage.find({
                ...query,
                $or: [
                    { title: { $regex: search, $options: 'i' } },
                    { description: { $regex: search, $options: 'i' } },
                    { tags: { $in: [new RegExp(search, 'i')] } }
                ]
            });
        } else {
            pages = await MarketplacePage.find(query);
        }

        // Sort
        switch (sort) {
            case 'newest':
                pages = pages.sort((a, b) => b.created_at - a.created_at);
                break;
            case 'oldest':
                pages = pages.sort((a, b) => a.created_at - b.created_at);
                break;
            case 'price_low':
                pages = pages.sort((a, b) => a.price - b.price);
                break;
            case 'price_high':
                pages = pages.sort((a, b) => b.price - a.price);
                break;
            case 'popular':
                pages = pages.sort((a, b) => b.views - a.views);
                break;
            case 'bestseller':
                pages = pages.sort((a, b) => b.sold_count - a.sold_count);
                break;
            case 'rating':
                pages = pages.sort((a, b) => b.rating - a.rating);
                break;
            default:
                pages = pages.sort((a, b) => b.created_at - a.created_at);
        }

        // Pagination
        const startIndex = (page - 1) * limit;
        const endIndex = page * limit;
        const paginatedPages = pages.slice(startIndex, endIndex);

        // Populate seller info
        await MarketplacePage.populate(paginatedPages, {
            path: 'seller_id',
            select: 'name email'
        });

        res.json({
            success: true,
            data: paginatedPages,
            pagination: {
                total: pages.length,
                page: parseInt(page),
                limit: parseInt(limit),
                totalPages: Math.ceil(pages.length / limit)
            }
        });
    } catch (error) {
        console.error('Get Marketplace Pages Error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi lấy danh sách marketplace',
            error: error.message
        });
    }
};

/**
 * Lấy chi tiết marketplace page
 */
exports.getMarketplacePageDetail = async (req, res) => {
    try {
        const { id } = req.params;

        const marketplacePage = await MarketplacePage.findById(id)
            .populate('seller_id', 'name email')
            .populate('page_id');

        if (!marketplacePage) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy landing page'
            });
        }

        // Increment views
        await marketplacePage.incrementViews();

        res.json({
            success: true,
            data: marketplacePage
        });
    } catch (error) {
        console.error('Get Marketplace Page Detail Error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi lấy chi tiết landing page',
            error: error.message
        });
    }
};

/**
 * Lấy featured pages
 */
exports.getFeaturedPages = async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 10;
        const pages = await MarketplacePage.findFeaturedPages(limit);

        res.json({
            success: true,
            data: pages
        });
    } catch (error) {
        console.error('Get Featured Pages Error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi lấy featured pages',
            error: error.message
        });
    }
};

/**
 * Lấy bestsellers
 */
exports.getBestsellers = async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 10;
        const pages = await MarketplacePage.findBestsellers(limit);

        res.json({
            success: true,
            data: pages
        });
    } catch (error) {
        console.error('Get Bestsellers Error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi lấy bestsellers',
            error: error.message
        });
    }
};

/**
 * Lấy new arrivals
 */
exports.getNewArrivals = async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 10;
        const pages = await MarketplacePage.findNewArrival(limit);

        res.json({
            success: true,
            data: pages
        });
    } catch (error) {
        console.error('Get New Arrivals Error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi lấy new arrivals',
            error: error.message
        });
    }
};

/**
 * Đăng bán landing page (user) - UPDATED với auto copy images & screenshot
 */
exports.sellPage = async (req, res) => {
    try {
        const userId = req.user?.id || req.user?.userId || req.user?._id;
        if (!userId) {
            console.log('User ID is undefined');
            return res.status(401).json({
                success: false,
                message: 'Không thể xác thực người dùng'
            });
        }
        const {
            page_id,
            title,
            description,
            category,
            price,
            original_price,
            tags,
            demo_url
        } = req.body;

        console.log('sellPage called - userId:', userId, 'page_id:', page_id);

        // Kiểm tra page_id có tồn tại không
        if (!page_id) {
            console.log('No page_id provided');
            return res.status(400).json({
                success: false,
                message: 'page_id không được cung cấp'
            });
        }

        // Kiểm tra page có tồn tại và thuộc về user
        const page = await Page.findOne({
            _id: page_id,
            user_id: userId
        });
        console.log('Page found:', page);

        if (!page) {
            console.log('No page found for page_id:', page_id, 'userId:', userId);
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy landing page hoặc bạn không có quyền'
            });
        }

        // Kiểm tra page_data
        if (!page.page_data) {
            console.log('Page has no page_data:', page_id);
            return res.status(400).json({
                success: false,
                message: 'Landing page chưa có nội dung. Vui lòng tạo nội dung trước.'
            });
        }

        const marketplaceId = uuidv4();
        console.log('Generating marketplaceId:', marketplaceId);

        // Copy images
        console.log('Copying images to marketplace folder...');
        const { imageMap } = await s3CopyService.copyPageImagesToMarketplace(
            page.page_data,
            marketplaceId
        );

        // Update page_data with new image URLs
        const updatedPageData = s3CopyService.updatePageDataImages(page.page_data, imageMap);

        // Generate screenshot from HTML (not page_data)
        console.log('Generating screenshot from S3 HTML...');
        let screenshotUrl = null;
        try {
            // Get S3 key from file_path
            const getS3KeyFromFilePath = (file_path) => {
                if (!file_path) return null;
                const bucketName = process.env.AWS_S3_BUCKET;
                let s3Key;
                if (file_path.includes('landinghub-iconic')) {
                    s3Key = file_path.split('s3://landinghub-iconic/')[1];
                } else {
                    s3Key = file_path.split(`s3://${bucketName}/`)[1];
                }
                return s3Key.endsWith('index.html') ? s3Key : `${s3Key}/index.html`;
            };

            if (page.file_path) {
                const s3Key = getS3KeyFromFilePath(page.file_path);
                console.log('Fetching HTML from S3:', s3Key);
                screenshotUrl = await screenshotService.generateScreenshotFromS3(
                    s3Key,
                    marketplaceId
                );
                console.log('Screenshot generated successfully:', screenshotUrl);
            } else {
                console.warn('Page has no file_path, cannot generate screenshot from S3');
            }
        } catch (screenshotError) {
            console.error('Screenshot generation failed:', screenshotError);
            // Don't fail the entire request if screenshot fails
        }

        // Tạo marketplace page
        const marketplacePage = new MarketplacePage({
            _id: marketplaceId,
            page_id: page_id,
            seller_id: userId,
            title,
            description,
            category,
            price: parseFloat(price),
            original_price: original_price ? parseFloat(original_price) : null,
            tags: tags || [],
            demo_url: demo_url || page.url || '',
            main_screenshot: screenshotUrl,
            screenshots: screenshotUrl ? [screenshotUrl] : [],
            status: 'PENDING',
            page_data: updatedPageData
        });

        await marketplacePage.save();
        console.log('Marketplace page saved:', marketplacePage);

        res.status(201).json({
            success: true,
            message: 'Đăng bán landing page thành công! Hệ thống đã tự động copy images và tạo screenshot. Đang chờ admin duyệt.',
            data: marketplacePage
        });
    } catch (error) {
        console.error('Sell Page Error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi đăng bán landing page',
            error: error.message
        });
    }
};

/**
 * Cập nhật marketplace page (user - chỉ cập nhật page của mình)
 */
exports.updateMarketplacePage = async (req, res) => {
    try {
        const userId = req.user?.id || req.user?.userId || req.user?._id;
        if (!userId) {
            return res.status(401).json({ success: false, message: 'Không thể xác thực người dùng' });
        }
        const { id } = req.params;
        const updates = req.body;

        const marketplacePage = await MarketplacePage.findOne({
            _id: id,
            seller_id: userId
        });

        if (!marketplacePage) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy marketplace page hoặc bạn không có quyền'
            });
        }

        // Chỉ cho phép update một số field nhất định
        const allowedUpdates = [
            'title',
            'description',
            'category',
            'price',
            'original_price',
            'tags',
            'demo_url',
            'screenshots'
        ];

        allowedUpdates.forEach(field => {
            if (updates[field] !== undefined) {
                marketplacePage[field] = updates[field];
            }
        });

        // Nếu đang ACTIVE và update, chuyển về PENDING để admin review lại
        if (marketplacePage.status === 'ACTIVE') {
            marketplacePage.status = 'PENDING';
        }

        await marketplacePage.save();

        res.json({
            success: true,
            message: 'Cập nhật marketplace page thành công',
            data: marketplacePage
        });
    } catch (error) {
        console.error('Update Marketplace Page Error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi cập nhật marketplace page',
            error: error.message
        });
    }
};

/**
 * Xóa marketplace page (user)
 */
exports.deleteMarketplacePage = async (req, res) => {
    try {
        const userId = req.user?.id || req.user?.userId || req.user?._id;
        if (!userId) {
            return res.status(401).json({ success: false, message: 'Không thể xác thực người dùng' });
        }
        const { id } = req.params;

        const marketplacePage = await MarketplacePage.findOne({
            _id: id,
            seller_id: userId
        });

        if (!marketplacePage) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy marketplace page hoặc bạn không có quyền'
            });
        }

        // Kiểm tra có transaction pending không
        const pendingTransactions = await Transaction.find({
            marketplace_page_id: id,
            status: { $in: ['PENDING', 'PROCESSING'] }
        });

        if (pendingTransactions.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'Không thể xóa vì còn giao dịch đang chờ xử lý'
            });
        }

        await MarketplacePage.findByIdAndDelete(id);

        res.json({
            success: true,
            message: 'Xóa marketplace page thành công'
        });
    } catch (error) {
        console.error('Delete Marketplace Page Error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi xóa marketplace page',
            error: error.message
        });
    }
};

/**
 * Lấy danh sách marketplace pages của user
 */
exports.getMyMarketplacePages = async (req, res) => {
    try {
        const userId = req.user?.id || req.user?.userId || req.user?._id;
        if (!userId) {
            console.error('User ID is undefined in getMyMarketplacePages');
            return res.status(401).json({
                success: false,
                message: 'Không thể xác thực người dùng'
            });
        }

        const { status } = req.query;
        let query = { seller_id: userId };
        if (status) {
            query.status = status;
        }

        console.log('Fetching marketplace pages for user:', userId, 'query:', query);

        const pages = await MarketplacePage.find(query)
            .populate('page_id')
            .sort({ created_at: -1 });

        console.log(`Found ${pages.length} marketplace pages for user ${userId}`);

        res.json({ success: true, data: pages });
    } catch (error) {
        console.error('Get My Marketplace Pages Error:', error);
        res.status(500).json({ success: false, message: 'Lỗi khi lấy danh sách marketplace pages', error: error.message });
    }
};

/**
 * Like/Unlike marketplace page
 */
exports.toggleLike = async (req, res) => {
    try {
        const userId = req.user?.id || req.user?.userId || req.user?._id;
        if (!userId) {
            return res.status(401).json({ success: false, message: 'Không thể xác thực người dùng' });
        }
        const { id } = req.params;

        const marketplacePage = await MarketplacePage.findById(id);

        if (!marketplacePage) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy marketplace page'
            });
        }

        await marketplacePage.toggleLike(userId);

        res.json({
            success: true,
            message: 'Cập nhật trạng thái like thành công',
            data: {
                likes: marketplacePage.likes,
                liked: marketplacePage.liked_by.map(id => id.toString()).includes(userId.toString())
            }
        });
    } catch (error) {
        console.error('Toggle Like Error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi cập nhật trạng thái like',
            error: error.message
        });
    }
};

/**
 * Lấy thống kê seller
 */
exports.getSellerStats = async (req, res) => {
    try {
        const userId = req.user?.id || req.user?.userId || req.user?._id;
        if (!userId) {
            return res.status(401).json({ success: false, message: 'Không thể xác thực người dùng' });
        }

        console.log('getSellerStats userId:', userId);

        // Đếm số marketplace pages - Mongoose tự convert string to ObjectId
        const totalPages = await MarketplacePage.countDocuments({ seller_id: userId });
        const activePages = await MarketplacePage.countDocuments({
            seller_id: userId,
            status: 'ACTIVE'
        });
        const pendingPages = await MarketplacePage.countDocuments({
            seller_id: userId,
            status: 'PENDING'
        });

        // Tính tổng doanh thu
        const revenue = await Transaction.calculateRevenue({ seller_id: userId });
        console.log('Revenue calculated:', revenue);

        // Lấy top selling pages
        const topPages = await MarketplacePage.find({ seller_id: userId })
            .sort({ sold_count: -1 })
            .limit(5)
            .populate('page_id');

        res.json({
            success: true,
            data: {
                totalPages,
                activePages,
                pendingPages,
                revenue: revenue.total_seller_amount || 0,
                totalSales: revenue.transaction_count || 0,
                topPages
            }
        });
    } catch (error) {
        console.error('Get Seller Stats Error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi lấy thống kê seller',
            error: error.message
        });
    }
};

/**
 * Download marketplace page as HTML ZIP
 */
exports.downloadAsHTML = async (req, res) => {
    try {
        const userId = req.user?.id || req.user?.userId || req.user?._id;
        if (!userId) {
            console.error('User ID is undefined in downloadAsHTML');
            return res.status(401).json({ success: false, message: 'Không thể xác thực người dùng' });
        }

        const { id } = req.params;

        const marketplacePage = await MarketplacePage.findById(id).populate([
            { path: 'page_id' },
            { path: 'seller_id', select: 'name email' }
        ]);
        if (!marketplacePage) {
            console.error('MarketplacePage not found for ID:', id);
            return res.status(404).json({ success: false, message: 'Không tìm thấy marketplace page' });
        }

        if (!marketplacePage.seller_id) {
            console.error('seller_id is undefined for MarketplacePage:', id);
            return res.status(500).json({ success: false, message: 'Dữ liệu seller_id không hợp lệ' });
        }

        const order = await Order.findOne({
            marketplacePageId: id,
            buyerId: userId,
            status: 'delivered'
        });

        const isSeller = marketplacePage.seller_id.toString() === userId.toString();
        if (!order && !isSeller) {
            return res.status(403).json({
                success: false,
                message: 'Bạn cần mua và nhận landing page này trước khi tải xuống'
            });
        }

        const page = order ? await Page.findById(order.createdPageId) : marketplacePage.page_id;
        if (!page || !page.file_path) {
            console.error('Page or file_path not found for MarketplacePage:', id, 'order:', order?._id);
            return res.status(400).json({ success: false, message: 'Landing page không có HTML content' });
        }

        const zipPath = await exportService.exportAsHTMLZip(marketplacePage, page.page_data, page.file_path);
        res.download(zipPath, `${marketplacePage.title}.zip`, () => exportService.cleanupTempFile(zipPath));
    } catch (error) {
        console.error('Download HTML Error:', error);
        res.status(500).json({ success: false, message: 'Lỗi khi tải xuống HTML', error: error.message });
    }
};

exports.downloadAsIUHPage = async (req, res) => {
    try {
        const userId = req.user.id;
        const { id } = req.params;

        const marketplacePage = await MarketplacePage.findById(id).populate('page_id');
        if (!marketplacePage) return res.status(404).json({ success: false, message: 'Không tìm thấy marketplace page' });

        const order = await Order.findOne({
            marketplacePageId: id,
            buyerId: userId,
            status: 'delivered'
        });

        const isSeller = marketplacePage.seller_id.toString() === userId.toString();
        if (!order && !isSeller) {
            return res.status(403).json({ success: false, message: 'Bạn cần mua và nhận landing page này trước khi tải xuống' });
        }

        const page = order ? await Page.findById(order.createdPageId) : marketplacePage.page_id;
        if (!page || !page.file_path) {
            return res.status(400).json({ success: false, message: 'Landing page không có HTML content' });
        }

        const filePath = await exportService.exportAsIUHPage(marketplacePage, page.page_data, page.file_path);
        res.download(filePath, `${marketplacePage.title}.iuhpage`, () => exportService.cleanupTempFile(filePath));
    } catch (error) {
        console.error('Download IUHPage Error:', error);
        res.status(500).json({ success: false, message: 'Lỗi khi tải xuống .iuhpage', error: error.message });
    }
};
/**
 * Get purchased pages - Lấy danh sách các page đã mua
 */
exports.getPurchasedPages = async (req, res) => {
    try {
        const userId = req.user.id;
        const { page = 1, limit = 12, search, category } = req.query;
        const skip = (parseInt(page) - 1) * parseInt(limit);

        let query = { buyerId: userId, status: 'delivered' };
        if (search) {
            query['marketplacePageId.title'] = { $regex: search, $options: 'i' };
        }
        if (category && category !== 'all') {
            query['marketplacePageId.category'] = category;
        }

        const totalItems = await Order.countDocuments(query);

        const orders = await Order.find(query)
            .populate({
                path: 'marketplacePageId',
                select: 'title description main_screenshot price category',
                populate: { path: 'seller_id', select: 'name email' }
            })
            .populate('createdPageId', 'name status url html_url file_path')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit));

        const pagesWithPurchaseDate = orders.map(order => ({
            ...order.marketplacePageId.toObject(),
            purchased_at: order.createdAt,
            delivered_page: order.createdPageId
        }));

        res.json({
            success: true,
            data: pagesWithPurchaseDate,
            pagination: {
                currentPage: parseInt(page),
                totalPages: Math.ceil(totalItems / parseInt(limit)),
                totalItems,
                itemsPerPage: parseInt(limit)
            }
        });
    } catch (error) {
        console.error('Get Purchased Pages Error:', error);
        res.status(500).json({ success: false, message: 'Lỗi khi lấy danh sách page đã mua', error: error.message });
    }
};