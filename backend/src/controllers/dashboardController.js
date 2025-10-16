const Page = require('../models/Page');
const mongoose = require('mongoose');

// ========== ULTIMATE DASHBOARD FIX ==========
const getDashboardData = async (req, res) => {
    console.log('🔍 [DASHBOARD] START - User:', req.user);

    try {
        // ✅ FIX 1: ANY userId format OK
        let userId;
        if (mongoose.Types.ObjectId.isValid(req.user._id)) {
            userId = new mongoose.Types.ObjectId(req.user._id);
        } else {
            userId = req.user._id; // String OK too
        }

        console.log('✅ [DASHBOARD] userId:', userId, 'type:', typeof userId);

        // ✅ FIX 2: COUNT FIRST (DEBUG)
        const totalCount = await Page.countDocuments({ user_id: userId });
        console.log('✅ [DASHBOARD] TOTAL PAGES IN DB:', totalCount);

        if (totalCount === 0) {
            return res.json({
                success: true,
                data: {
                    stats: { totalPages: 0, totalViews: '0', totalRevenue: '0M', livePages: 0, conversionRate: '0%' },
                    pages: []
                }
            });
        }

        // 3. STATS
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

        // 4. PAGES LIST
        const pages = await Page.find({ user_id: userId })
            .select('name description status views revenue created_at screenshot_url url _id updated_at')
            .sort({ updated_at: -1 })
            .limit(12)
            .lean();

        console.log('✅ [DASHBOARD] Found pages:', pages.length);
        console.log('First page:', pages[0]?.name);

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

        res.json({
            success: true,
            data: {
                stats: {
                    totalPages: statResult.totalPages,
                    totalViews: statResult.totalViews.toLocaleString(),
                    totalRevenue: (statResult.totalRevenue / 1000000).toFixed(1) + 'M',
                    livePages: statResult.livePages,
                    conversionRate: statResult.totalViews ? ((statResult.totalRevenue / statResult.totalViews) * 100).toFixed(1) + '%' : '0%'
                },
                pages: formattedPages
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