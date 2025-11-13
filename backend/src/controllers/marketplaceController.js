const mongoose = require('mongoose');
const MarketplacePage = require('../models/MarketplacePage');
const Page = require('../models/Page');
const Transaction = require('../models/Transaction');
const { v4: uuidv4 } = require('uuid');
const s3CopyService = require('../services/s3CopyService');
const screenshotService = require('../services/screenshotService');
const exportService = require('../services/exportService');
const Order = require('../models/Order');
const Review = require('../models/MarketplaceReview');
const AWS = require('aws-sdk');

// Configure AWS S3
AWS.config.update({ region: process.env.AWS_REGION || 'ap-southeast-1' });
const s3 = new AWS.S3();

// Helper function to get content from S3
const getFromS3 = async (s3Key) => {
    try {
        console.log('Attempting to get S3 object with key:', s3Key);
        const s3Response = await s3.getObject({
            Bucket: process.env.AWS_S3_BUCKET,
            Key: s3Key
        }).promise();

        return s3Response.Body.toString('utf-8');
    } catch (err) {
        console.error('Failed to get from S3:', s3Key, err.message);
        return null;
    }
};

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

/**
 * Get preview data (HTML + pageData with popups)
 * Cho phép preview công khai - trả về JSON với cả HTML và pageData
 */
exports.getPreviewData = async (req, res) => {
    try {
        const { id } = req.params;

        const marketplacePage = await MarketplacePage.findById(id).populate('page_id');
        if (!marketplacePage) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy marketplace page'
            });
        }

        const page = marketplacePage.page_id;
        if (!page) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy page data'
            });
        }

        // Lấy HTML từ S3
        let htmlContent = '';
        if (page.file_path) {
            const { getFromS3 } = require('../utils/s3');
            const s3Key = page.file_path.replace(/^https:\/\/[^\/]+\//, '');
            htmlContent = await getFromS3(s3Key);
        }

        if (!htmlContent) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy HTML content'
            });
        }

        // Trả về cả HTML và pageData
        res.json({
            success: true,
            data: {
                htmlContent,
                pageData: page.page_data || null
            }
        });
    } catch (error) {
        console.error('Get Preview Data Error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi tải preview data',
            error: error.message
        });
    }
};

/**
 * Preview marketplace page (trả về HTML)
 * Không yêu cầu auth - cho phép preview công khai
 */
exports.previewMarketplacePage = async (req, res) => {
    try {
        const { id } = req.params;

        const marketplacePage = await MarketplacePage.findById(id).populate('page_id');
        if (!marketplacePage) {
            return res.status(404).send('<h1>Không tìm thấy marketplace page</h1>');
        }

        // Chỉ cho phép preview các page đã được approve
        if (marketplacePage.status !== 'ACTIVE') {
            return res.status(403).send('<h1>Page này chưa được duyệt để preview</h1>');
        }

        const page = marketplacePage.page_id;
        if (!page) {
            return res.status(404).send('<h1>Không tìm thấy page data</h1>');
        }

        // Lấy HTML từ S3
        let htmlContent = '';
        if (page.file_path) {
            const { getFromS3 } = require('../utils/s3');
            const s3Key = page.file_path.replace(/^https:\/\/[^\/]+\//, '');
            htmlContent = await getFromS3(s3Key);
        }

        if (!htmlContent) {
            return res.status(404).send('<h1>Không tìm thấy HTML content</h1>');
        }

        // Trả về HTML trực tiếp
        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        res.send(htmlContent);
    } catch (error) {
        console.error('Preview Marketplace Page Error:', error);
        res.status(500).send('<h1>Lỗi khi tải preview</h1><p>' + error.message + '</p>');
    }
};

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

const getValidObjectId = (id) => {
    if (!id) return null;
    if (mongoose.Types.ObjectId.isValid(id)) {
        return new mongoose.Types.ObjectId(id);
    }
    return null;
};

exports.getPurchasedPages = async (req, res) => {
    try {
        // ✅ LẤY TỪ req.user.id — do middleware authMiddleware gán
        const userId = req.user?.id;

        if (!userId) {
            return res.status(401).json({
                success: false,
                message: 'Không tìm thấy thông tin người dùng'
            });
        }

        const buyerObjectId = getValidObjectId(userId);
        if (!buyerObjectId) {
            return res.status(400).json({
                success: false,
                message: 'User ID không hợp lệ'
            });
        }

        const { page = 1, limit = 12, search, category } = req.query;
        const pageNum = parseInt(page, 10) || 1;
        const limitNum = parseInt(limit, 10) || 12;
        const skip = (pageNum - 1) * limitNum;

        const pipeline = [
            {
                $match: {
                    buyerId: buyerObjectId, // ObjectId hợp lệ
                    status: 'delivered'
                }
            },
            {
                $lookup: {
                    from: 'marketplace_pages',
                    localField: 'marketplacePageId',
                    foreignField: '_id',
                    as: 'marketplacePage'
                }
            },
            { $unwind: '$marketplacePage' },
            {
                $lookup: {
                    from: 'pages',
                    localField: 'createdPageId',
                    foreignField: '_id',
                    as: 'createdPage'
                }
            },
            { $unwind: { path: '$createdPage', preserveNullAndEmptyArrays: true } }
        ];

        // Filter search/category
        if (search || (category && category !== 'all')) {
            const matchStage = { $match: {} };
            if (search) {
                matchStage.$match.$or = [
                    { 'marketplacePage.title': { $regex: search, $options: 'i' } },
                    { 'marketplacePage.description': { $regex: search, $options: 'i' } },
                    { 'marketplacePage.tags': { $elemMatch: { $regex: search, $options: 'i' } } }
                ];
            }
            if (category && category !== 'all') {
                matchStage.$match['marketplacePage.category'] = category;
            }
            pipeline.push(matchStage);
        }

        // Đếm tổng
        const countPipeline = [...pipeline, { $count: 'total' }];
        const countResult = await Order.aggregate(countPipeline);
        const total = countResult.length > 0 ? countResult[0].total : 0;

        // Phân trang
        pipeline.push(
            { $sort: { createdAt: -1 } },
            { $skip: skip },
            { $limit: limitNum },
            {
                $project: {
                    _id: 1,
                    createdAt: 1,
                    marketplacePage: 1,
                    createdPage: 1
                }
            }
        );

        const results = await Order.aggregate(pipeline);

        const data = results.map(item => ({
            ...item.marketplacePage,
            purchased_at: item.createdAt,
            delivered_page: item.createdPage || null
        }));

        res.json({
            success: true,
            data,
            pagination: {
                currentPage: pageNum,
                totalPages: Math.ceil(total / limitNum),
                totalItems: total,
                itemsPerPage: limitNum
            }
        });
    } catch (error) {
        console.error('Get Purchased Pages Error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi lấy danh sách page đã mua',
            error: error.message
        });
    }
};
exports.getPageDetailWithOrder = async (req, res) => {
    try {
        const { id } = req.params;
        // ✅ LẤY TỪ req.user.id (do authMiddleware của bạn gán)
        const userId = req.user?.id;

        // 👇 Thêm header để tránh cache (tuỳ chọn nhưng nên có)
        res.set('Cache-Control', 'no-cache, no-store, must-revalidate');
        res.set('Pragma', 'no-cache');
        res.set('Expires', '0');

        const page = await MarketplacePage.findById(id)
            .populate('seller_id', 'name email')
            .populate('page_id')
            .lean();

        if (!page) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy page' });
        }

        let order = null;
        if (userId) {
            // ✅ Chuyển userId (string) thành ObjectId để so sánh với buyerId (ObjectId)
            const buyerObjectId = mongoose.Types.ObjectId.isValid(userId)
                ? new mongoose.Types.ObjectId(userId)
                : null;

            if (buyerObjectId) {
                order = await Order.findOne({
                    buyerId: buyerObjectId,      // ObjectId
                    marketplacePageId: id,       // string (UUID)
                    status: 'delivered'
                })
                    .populate('createdPageId')
                    .lean();
            }
        }

        // ✅ Xử lý an toàn khi userId không tồn tại
        const isSeller = userId
            ? (page.seller_id?._id?.toString() === userId)
            : false;

        const liked = userId
            ? (page.liked_by || []).map(i => i.toString()).includes(userId)
            : false;

        res.json({
            success: true,
            data: {
                ...page,
                order,
                isSeller,
                liked
            }
        });
    } catch (err) {
        console.error('getPageDetailWithOrder error:', err);
        res.status(500).json({ success: false, message: 'Lỗi server', error: err.message });
    }
};
exports.submitReview = async (req, res) => {
    try {
        const userId = req.user.id;
        const { id } = req.params;
        const { rating, comment } = req.body;
        if (!rating || rating < 1 || rating > 5)
            return res.status(400).json({ success: false, message: 'Rating 1-5' });

        // Kiểm tra đã mua & delivered
        const order = await Order.findOne({
            buyerId: userId,
            marketplacePageId: id,
            status: 'delivered'
        });
        if (!order)
            return res.status(403).json({ success: false, message: 'Chưa mua hoặc chưa nhận hàng' });

        // Upsert review
        const review = await Review.findOneAndUpdate(
            { marketplacePageId: id, buyerId: userId },
            { rating, comment },
            { new: true, upsert: true }
        );

        // Cập nhật lại rating trung bình
        const stats = await Review.aggregate([
            { $match: { marketplacePageId: id } },
            {
                $group: {
                    _id: null,
                    avgRating: { $avg: '$rating' },
                    count: { $sum: 1 }
                }
            }
        ]);
        const avg = stats.length ? stats[0].avgRating : 0;
        const count = stats.length ? stats[0].count : 0;
        await MarketplacePage.findByIdAndUpdate(id, {
            rating: parseFloat(avg.toFixed(1)),
            review_count: count
        });

        res.json({ success: true, data: review });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// Lấy danh sách review của page
exports.getReviews = async (req, res) => {
    try {
        const { id } = req.params;
        const reviews = await Review.find({ marketplacePageId: id })
            .populate('buyerId', 'name avatar')
            .sort({ createdAt: -1 })
            .lean();
        res.json({ success: true, data: reviews });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};