const Page = require('../models/Page');
const mongoose = require('mongoose');

// Helper function để định dạng số tiền
const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND'
    }).format(amount);
};

// Helper function để tính phần trăm
const calculatePercentage = (value, total) => {
    return total > 0 ? ((value / total) * 100).toFixed(2) : 0;
};

/**
 * Lấy thống kê tổng quan của người dùng
 * GET /api/analytics/overview
 */
exports.getUserAnalyticsOverview = async (req, res) => {
    if (!req.user || !req.user.userId) {
        return res.status(401).json({
            error: 'Không tìm thấy thông tin người dùng. Vui lòng đăng nhập lại.'
        });
    }

    try {
        let userId;
        try {
            userId = new mongoose.Types.ObjectId(req.user.userId);
        } catch (err) {
            console.error('Invalid userId format:', req.user.userId, err);
            return res.status(400).json({ error: 'Invalid userId format' });
        }

        // Lấy tất cả pages của user
        const pages = await Page.find({ user_id: userId });

        // Tính toán các chỉ số tổng quan
        const totalPages = pages.length;
        const publishedPages = pages.filter(page => page.status === 'ĐÃ XUẤT BẢN').length;
        const totalViews = pages.reduce((sum, page) => sum + (page.views || 0), 0);
        const totalConversions = pages.reduce((sum, page) => sum + (page.conversions || 0), 0);
        const totalRevenue = pages.reduce((sum, page) => sum + (parseFloat(page.revenue?.replace('đ', '') || 0)), 0);
        const conversionRate = calculatePercentage(totalConversions, totalViews);

        // Tìm top 3 pages theo views
        const topPagesByViews = pages
            .sort((a, b) => (b.views || 0) - (a.views || 0))
            .slice(0, 3)
            .map(page => ({
                id: page._id.toString(),
                name: page.name,
                views: page.views || 0,
                conversions: page.conversions || 0,
                conversionRate: calculatePercentage(page.conversions || 0, page.views || 0),
                revenue: formatCurrency(parseFloat(page.revenue?.replace('đ', '') || 0)),
                screenshot_url: page.screenshot_url || null
            }));

        res.json({
            success: true,
            overview: {
                totalPages,
                publishedPages,
                totalViews,
                totalConversions,
                conversionRate: `${conversionRate}%`,
                totalRevenue: formatCurrency(totalRevenue),
                topPagesByViews
            }
        });
    } catch (err) {
        console.error('Lỗi lấy thống kê tổng quan:', err);
        res.status(500).json({
            error: 'Lỗi khi lấy thống kê tổng quan: ' + err.message
        });
    }
};

/**
 * Lấy thống kê chi tiết của một Landing Page
 * GET /api/analytics/page/:id
 */
exports.getPageAnalytics = async (req, res) => {
    if (!req.user || !req.user.userId) {
        return res.status(401).json({
            error: 'Không tìm thấy thông tin người dùng. Vui lòng đăng nhập lại.'
        });
    }

    const { id } = req.params;

    if (!id.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
        console.error('Validation error: Invalid page ID:', id);
        return res.status(400).json({ error: 'pageId không hợp lệ' });
    }

    try {
        const page = await Page.findOne({ _id: id, user_id: req.user.userId });
        if (!page) {
            console.error('Page not found for id:', id, 'user:', req.user.userId);
            return res.status(404).json({ error: 'Không tìm thấy landing page' });
        }

        const conversionRate = calculatePercentage(page.conversions || 0, page.views || 0);
        const revenue = parseFloat(page.revenue?.replace('đ', '') || 0);

        res.json({
            success: true,
            page: {
                id: page._id.toString(),
                name: page.name,
                url: page.url,
                status: page.status,
                views: page.views || 0,
                conversions: page.conversions || 0,
                conversionRate: `${conversionRate}%`,
                revenue: formatCurrency(revenue),
                screenshot_url: page.screenshot_url || null,
                created_at: page.created_at ? page.created_at.toLocaleString('vi-VN') : null,
                updated_at: page.updated_at ? page.updated_at.toLocaleString('vi-VN') : null
            }
        });
    } catch (err) {
        console.error('Lỗi lấy thống kê page:', err);
        res.status(500).json({
            error: 'Lỗi khi lấy thống kê landing page: ' + err.message
        });
    }
};

/**
 * Lấy dữ liệu biểu đồ cho dashboard
 * GET /api/analytics/chart/:id?
 */
exports.getChartData = async (req, res) => {
    if (!req.user || !req.user.userId) {
        return res.status(401).json({
            error: 'Không tìm thấy thông tin người dùng. Vui lòng đăng nhập lại.'
        });
    }

    const { id } = req.params;
    let query = { user_id: req.user.userId };

    if (id && !id.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
        return res.status(400).json({ error: 'pageId không hợp lệ' });
    }

    if (id) {
        query._id = id;
    }

    try {
        const pages = await Page.find(query).sort({ updated_at: -1 });

        if (id && !pages.length) {
            return res.status(404).json({ error: 'Không tìm thấy landing page' });
        }

        // Giả lập dữ liệu thời gian (có thể thay bằng dữ liệu thực tế từ analytics)
        const labels = Array.from({ length: 7 }, (_, i) => {
            const date = new Date();
            date.setDate(date.getDate() - i);
            return date.toLocaleDateString('vi-VN');
        }).reverse();

        const viewsData = labels.map(() => Math.floor(Math.random() * 100)); // Giả lập
        const conversionsData = labels.map(() => Math.floor(Math.random() * 20)); // Giả lập

        const chart = {
            type: 'line',
            data: {
                labels: labels,
                datasets: [
                    {
                        label: 'Lượt xem',
                        data: viewsData,
                        borderColor: '#667eea',
                        backgroundColor: 'rgba(102, 126, 234, 0.2)',
                        fill: true,
                        tension: 0.4
                    },
                    {
                        label: 'Chuyển đổi',
                        data: conversionsData,
                        borderColor: '#34d399',
                        backgroundColor: 'rgba(52, 211, 153, 0.2)',
                        fill: true,
                        tension: 0.4
                    }
                ]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: { position: 'top' },
                    title: {
                        display: true,
                        text: id ? `Thống kê hiệu suất - ${pages[0].name}` : 'Thống kê tổng quan'
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        title: { display: true, text: 'Số lượng' }
                    },
                    x: {
                        title: { display: true, text: 'Ngày' }
                    }
                }
            }
        };

        res.json({
            success: true,
            chart
        });
    } catch (err) {
        console.error('Lỗi lấy dữ liệu biểu đồ:', err);
        res.status(500).json({
            error: 'Lỗi khi lấy dữ liệu biểu đồ: ' + err.message
        });
    }
};

/**
 * Cập nhật số liệu analytics cho page
 * POST /api/analytics/update/:id
 */
exports.updatePageAnalytics = async (req, res) => {
    if (!req.user || !req.user.userId) {
        return res.status(401).json({
            error: 'Không tìm thấy thông tin người dùng. Vui lòng đăng nhập lại.'
        });
    }

    const { id } = req.params;
    const { views, conversions, revenue } = req.body;

    if (!id.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
        return res.status(400).json({ error: 'pageId không hợp lệ' });
    }

    try {
        const page = await Page.findOne({ _id: id, user_id: req.user.userId });
        if (!page) {
            return res.status(404).json({ error: 'Không tìm thấy landing page' });
        }

        if (views !== undefined) page.views = Math.max(0, parseInt(views));
        if (conversions !== undefined) page.conversions = Math.max(0, parseInt(conversions));
        if (revenue !== undefined) page.revenue = formatCurrency(parseFloat(revenue));

        page.updated_at = new Date();
        await page.save();

        res.json({
            success: true,
            message: 'Cập nhật số liệu thành công',
            page: {
                id: page._id.toString(),
                name: page.name,
                views: page.views,
                conversions: page.conversions,
                revenue: page.revenue,
                updated_at: page.updated_at.toISOString()
            }
        });
    } catch (err) {
        console.error('Lỗi cập nhật số liệu:', err);
        res.status(500).json({
            error: 'Lỗi khi cập nhật số liệu: ' + err.message
        });
    }
};