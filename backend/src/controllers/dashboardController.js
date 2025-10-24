const Page = require('../models/Page');
const Order = require('../models/Order'); // Thêm Order
const mongoose = require('mongoose');

const getDashboardData = async (req, res) => {
    console.log('🔍 [DASHBOARD] START - User:', req.user);

    try {
        // 1. Lấy userId từ req.user
        const userIdRaw = req.user.userId || req.user.id || req.user._id;
        if (!userIdRaw) {
            return res.status(401).json({
                success: false,
                message: 'Không tìm thấy userId trong token'
            });
        }

        let userId;
        if (mongoose.Types.ObjectId.isValid(userIdRaw)) {
            userId = new mongoose.Types.ObjectId(userIdRaw);
        } else {
            userId = userIdRaw; // String UUID cho Order
        }
        console.log('✅ [DASHBOARD] userId:', userId, 'type:', typeof userId);

        // 2. Đếm tổng số pages
        const totalCount = await Page.countDocuments({ user_id: userId });
        console.log('✅ [DASHBOARD] TOTAL PAGES IN DB:', totalCount);

        // 3. Thống kê mua/bán từ Order
        const [purchaseStats, salesStats, lastPurchase, lastSale] = await Promise.all([
            // Purchase stats (as buyer)
            Order.aggregate([
                { $match: { buyerId: userId, status: 'delivered' } },
                { $group: { _id: null, total: { $sum: '$price' }, count: { $sum: 1 } } }
            ]),
            // Sales stats (as seller)
            Order.aggregate([
                { $match: { sellerId: userId, status: 'delivered' } },
                { $group: { _id: null, total: { $sum: '$price' }, count: { $sum: 1 } } }
            ]),
            // Last purchase
            Order.findOne({ buyerId: userId, status: 'delivered' })
                .sort({ createdAt: -1 })
                .populate('marketplacePageId', 'title'),
            // Last sale
            Order.findOne({ sellerId: userId, status: 'delivered' })
                .sort({ createdAt: -1 })
                .populate('marketplacePageId', 'title')
        ]);

        const paymentStats = {
            totalSpent: purchaseStats[0]?.total || 0,
            purchaseCount: purchaseStats[0]?.count || 0,
            totalEarned: salesStats[0]?.total || 0,
            salesCount: salesStats[0]?.count || 0
        };
        console.log('✅ [DASHBOARD] Payment stats:', paymentStats);

        // 4. Nếu không có dữ liệu
        if (totalCount === 0 && paymentStats.purchaseCount === 0 && paymentStats.salesCount === 0) {
            return res.json({
                success: true,
                data: {
                    stats: {
                        totalPages: 0,
                        totalViews: '0',
                        totalRevenue: '0M',
                        livePages: 0,
                        conversionRate: '0%'
                    },
                    paymentStats: {
                        totalSpent: 0,
                        purchaseCount: 0,
                        totalEarned: 0,
                        salesCount: 0
                    },
                    pages: []
                }
            });
        }

        // 5. Thống kê pages
        const stats = await Page.aggregate([
            { $match: { user_id: userId } },
            {
                $group: {
                    _id: null,
                    totalPages: { $sum: 1 },
                    totalViews: { $sum: { $ifNull: ['$views', 0] } },
                    totalRevenue: { $sum: { $ifNull: ['$revenue', 0] } },
                    livePages: {
                        $sum: { $cond: [{ $eq: ['$status', 'ĐÃ XUẤT BẢN'] }, 1, 0] }
                    }
                }
            }
        ]);

        const statResult = stats[0] || { totalPages: 0, totalViews: 0, totalRevenue: 0, livePages: 0 };
        console.log('✅ [DASHBOARD] Stats:', statResult);

        // 6. Lấy danh sách pages
        const pages = await Page.find({ user_id: userId })
            .select('name description status views revenue created_at screenshot_url url _id updated_at')
            .sort({ updated_at: -1 })
            .limit(12)
            .lean();

        console.log('✅ [DASHBOARD] Found pages:', pages.length);
        if (pages.length > 0) console.log('First page:', pages[0]?.name);

        const formattedPages = pages.map(page => ({
            id: page._id.toString(),
            title: page.name || 'Untitled',
            description: (page.description || '').substring(0, 80) + '...',
            status: page.status || 'CHƯA XUẤT BẢN',
            statusVN: page.status === 'ĐÃ XUẤT BẢN' ? 'LIVE' : 'DRAFT',
            views: (page.views || 0).toLocaleString(),
            revenue: ((page.revenue || 0) / 1000000).toFixed(1) + 'M',
            created: new Date(page.created_at || Date.now()).toLocaleDateString('vi-VN'),
            screenshot: page.screenshot_url || '/images/placeholder.jpg',
            url: page.url || `/preview/${page._id.toString()}`
        }));

        console.log('✅ [DASHBOARD] SUCCESS -', formattedPages.length, 'pages');

        // 7. Format tiền VND
        const formatVND = (amount) => {
            return new Intl.NumberFormat('vi-VN', {
                style: 'currency',
                currency: 'VND'
            }).format(amount);
        };

        res.json({
            success: true,
            data: {
                // TỔNG QUAN LANDING PAGES
                pages: {
                    total: statResult.totalPages,
                    live: statResult.livePages,
                    draft: statResult.totalPages - statResult.livePages,
                    totalViews: statResult.totalViews.toLocaleString('vi-VN'),
                    totalRevenue: formatVND(statResult.totalRevenue)
                },
                // THANH TOÁN - MUA
                purchases: {
                    title: 'Đã Mua',
                    count: paymentStats.purchaseCount,
                    totalSpent: formatVND(paymentStats.totalSpent),
                    totalSpentRaw: paymentStats.totalSpent,
                    avgPerPurchase: paymentStats.purchaseCount > 0
                        ? formatVND(Math.round(paymentStats.totalSpent / paymentStats.purchaseCount))
                        : formatVND(0),
                    lastPurchase: lastPurchase ? {
                        title: lastPurchase.marketplacePageId?.title || 'Unknown',
                        date: new Date(lastPurchase.createdAt).toLocaleString('vi-VN')
                    } : null
                },
                // THANH TOÁN - BÁN
                sales: {
                    title: 'Đã Bán',
                    count: paymentStats.salesCount,
                    totalEarned: formatVND(paymentStats.totalEarned),
                    totalEarnedRaw: paymentStats.totalEarned,
                    avgPerSale: paymentStats.salesCount > 0
                        ? formatVND(Math.round(paymentStats.totalEarned / paymentStats.salesCount))
                        : formatVND(0),
                    lastSale: lastSale ? {
                        title: lastSale.marketplacePageId?.title || 'Unknown',
                        date: new Date(lastSale.createdAt).toLocaleString('vi-VN')
                    } : null
                },
                // SỐ DƯ
                balance: {
                    title: 'Số Dư Ròng',
                    amount: formatVND(paymentStats.totalEarned - paymentStats.totalSpent),
                    amountRaw: paymentStats.totalEarned - paymentStats.totalSpent,
                    status: paymentStats.totalEarned >= paymentStats.totalSpent ? 'positive' : 'negative',
                    canWithdraw: paymentStats.totalEarned > paymentStats.totalSpent
                },
                // HOẠT ĐỘNG
                activity: {
                    totalTransactions: paymentStats.purchaseCount + paymentStats.salesCount,
                    lastPurchase: lastPurchase ? new Date(lastPurchase.createdAt).toLocaleString('vi-VN') : null,
                    lastSale: lastSale ? new Date(lastSale.createdAt).toLocaleString('vi-VN') : null
                },
                // DANH SÁCH PAGES
                pagesList: formattedPages
            }
        });
    } catch (error) {
        console.error('🚨 [DASHBOARD] ERROR:', error);
        res.status(500).json({
            success: false,
            message: error.message,
            debug: {
                userId: req.user?._id,
                userIdType: typeof req.user?._id,
                stack: error.stack
            }
        });
    }
};

module.exports = { getDashboardData };