const MarketplacePage = require('../models/MarketplacePage');
const Transaction = require('../models/Transaction');
const paymentService = require('../services/payment/paymentService');

/**
 * Lấy danh sách marketplace pages pending approval
 */
exports.getPendingPages = async (req, res) => {
    try {
        const pages = await MarketplacePage.findPendingApproval();

        res.json({
            success: true,
            data: pages
        });
    } catch (error) {
        console.error('Get Pending Pages Error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi lấy danh sách pending pages',
            error: error.message
        });
    }
};

/**
 * Lấy tất cả marketplace pages (admin)
 */
exports.getAllMarketplacePages = async (req, res) => {
    try {
        const { status, category, page = 1, limit = 20 } = req.query;

        let query = {};

        if (status) {
            query.status = status;
        }

        if (category) {
            query.category = category;
        }

        const skip = (page - 1) * limit;

        const pages = await MarketplacePage.find(query)
            .populate('seller_id', 'name email')
            .populate('page_id')
            .sort({ created_at: -1 })
            .skip(skip)
            .limit(parseInt(limit));

        const total = await MarketplacePage.countDocuments(query);

        res.json({
            success: true,
            data: pages,
            pagination: {
                total,
                page: parseInt(page),
                limit: parseInt(limit),
                totalPages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error('Get All Marketplace Pages Error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi lấy danh sách marketplace pages',
            error: error.message
        });
    }
};

/**
 * Approve marketplace page
 */
exports.approvePage = async (req, res) => {
    try {
        const adminId = req.user.id;
        const { id } = req.params;

        const marketplacePage = await MarketplacePage.findById(id);

        if (!marketplacePage) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy marketplace page'
            });
        }

        await marketplacePage.approve(adminId);

        res.json({
            success: true,
            message: 'Đã duyệt marketplace page',
            data: marketplacePage
        });
    } catch (error) {
        console.error('Approve Page Error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi duyệt marketplace page',
            error: error.message
        });
    }
};

/**
 * Reject marketplace page
 */
exports.rejectPage = async (req, res) => {
    try {
        const { id } = req.params;
        const { reason } = req.body;

        if (!reason) {
            return res.status(400).json({
                success: false,
                message: 'Vui lòng nhập lý do từ chối'
            });
        }

        const marketplacePage = await MarketplacePage.findById(id);

        if (!marketplacePage) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy marketplace page'
            });
        }

        await marketplacePage.reject(reason);

        res.json({
            success: true,
            message: 'Đã từ chối marketplace page',
            data: marketplacePage
        });
    } catch (error) {
        console.error('Reject Page Error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi từ chối marketplace page',
            error: error.message
        });
    }
};

/**
 * Suspend marketplace page
 */
exports.suspendPage = async (req, res) => {
    try {
        const { id } = req.params;
        const { reason } = req.body;

        if (!reason) {
            return res.status(400).json({
                success: false,
                message: 'Vui lòng nhập lý do tạm ngưng'
            });
        }

        const marketplacePage = await MarketplacePage.findById(id);

        if (!marketplacePage) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy marketplace page'
            });
        }

        await marketplacePage.suspend(reason);

        res.json({
            success: true,
            message: 'Đã tạm ngưng marketplace page',
            data: marketplacePage
        });
    } catch (error) {
        console.error('Suspend Page Error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi tạm ngưng marketplace page',
            error: error.message
        });
    }
};

/**
 * Toggle featured status
 */
exports.toggleFeatured = async (req, res) => {
    try {
        const { id } = req.params;

        const marketplacePage = await MarketplacePage.findById(id);

        if (!marketplacePage) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy marketplace page'
            });
        }

        marketplacePage.is_featured = !marketplacePage.is_featured;
        await marketplacePage.save();

        res.json({
            success: true,
            message: `Đã ${marketplacePage.is_featured ? 'thêm vào' : 'gỡ khỏi'} featured`,
            data: marketplacePage
        });
    } catch (error) {
        console.error('Toggle Featured Error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi cập nhật featured status',
            error: error.message
        });
    }
};

/**
 * Delete marketplace page (admin)
 */
exports.deletePage = async (req, res) => {
    try {
        const { id } = req.params;

        const marketplacePage = await MarketplacePage.findById(id);

        if (!marketplacePage) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy marketplace page'
            });
        }

        await MarketplacePage.findByIdAndDelete(id);

        res.json({
            success: true,
            message: 'Đã xóa marketplace page'
        });
    } catch (error) {
        console.error('Delete Page Error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi xóa marketplace page',
            error: error.message
        });
    }
};

/**
 * Lấy marketplace statistics
 */
exports.getMarketplaceStats = async (req, res) => {
    try {

        const { start, end } = req.query; // ?start=2025-01-01&end=2025-01-31
        const totalPages = await MarketplacePage.countDocuments();
        const activePages = await MarketplacePage.countDocuments({ status: 'ACTIVE' });
        const pendingPages = await MarketplacePage.countDocuments({ status: 'PENDING' });
        const suspendedPages = await MarketplacePage.countDocuments({ status: 'SUSPENDED' });

        const totalTransactions = await Transaction.countDocuments();
        const completedTransactions = await Transaction.countDocuments({ status: 'COMPLETED' });
        const pendingTransactions = await Transaction.countDocuments({ status: 'PENDING' });

        const revenue = await Transaction.calculateRevenue({
            start_date: start,
            end_date: end
        });

        // Top sellers
        const topSellers = await Transaction.aggregate([
            { $match: { status: 'COMPLETED' } },
            {
                $group: {
                    _id: '$seller_id',
                    total_sales: { $sum: 1 },
                    total_revenue: { $sum: '$seller_amount' }
                }
            },
            { $sort: { total_sales: -1 } },
            { $limit: 10 }
        ]);

        // Populate seller info
        const User = require('../models/User');
        for (let seller of topSellers) {
            const user = await User.findById(seller._id, 'name email');
            seller.seller = user;
        }

        const topPages = await MarketplacePage.find({ status: 'ACTIVE' })
            .sort({ sold_count: -1 })
            .limit(10)
            .populate('seller_id', 'name email');

        res.json({
            success: true,
            data: {
                overview: {
                    totalPages,
                    activePages,
                    pendingPages,
                    suspendedPages,
                    totalTransactions,
                    completedTransactions,
                    pendingTransactions,
                    totalRevenue: revenue.total_revenue,
                    platformFee: revenue.total_platform_fee
                },
                topSellers,
                topPages
            }
        });
    } catch (error) {
        console.error('Get Marketplace Stats Error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi lấy thống kê marketplace',
            error: error.message
        });
    }
};

/**
 * Lấy tất cả transactions
 */
exports.getAllTransactions = async (req, res) => {
    try {
        const { status, page = 1, limit = 20 } = req.query;

        let query = {};
        if (status) {
            query.status = status;
        }

        const skip = (page - 1) * limit;

        const transactions = await Transaction.find(query)
            .populate('buyer_id', 'name email')
            .populate('seller_id', 'name email')
            .populate('marketplace_page_id')
            .sort({ created_at: -1 })
            .skip(skip)
            .limit(parseInt(limit));

        const total = await Transaction.countDocuments(query);

        res.json({
            success: true,
            data: transactions,
            pagination: {
                total,
                page: parseInt(page),
                limit: parseInt(limit),
                totalPages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error('Get All Transactions Error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi lấy danh sách transactions',
            error: error.message
        });
    }
};

/**
 * Lấy refund requests
 */
exports.getRefundRequests = async (req, res) => {
    try {
        const requests = await Transaction.findRefundRequests();

        res.json({
            success: true,
            data: requests
        });
    } catch (error) {
        console.error('Get Refund Requests Error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi lấy danh sách refund requests',
            error: error.message
        });
    }
};

/**
 * Process refund (admin)
 */
exports.processRefund = async (req, res) => {
    try {
        const { transaction_id } = req.body;

        const result = await paymentService.processRefund(
            transaction_id,
            'Admin approved refund'
        );
        await sendRefundCompleted(order);
        await Notification.create({
            recipientId: order.buyerId,
            type: 'refund_completed',
            title: 'Hoàn tiền thành công',
            message: `Đơn ${order.orderId} đã được hoàn tiền.`,
            metadata: { orderId: order.orderId }
        });

        global._io.to(`user_${order.buyerId}`).emit('new_notification', {
            title: 'Hoàn tiền thành công',
            message: `Đơn ${order.orderId} đã được hoàn tiền.`,
            isRead: false,
            createdAt: new Date()
        });

        if (result.success) {
            res.json({
                success: true,
                message: 'Đã hoàn tiền thành công',
                data: result.transaction
            });
        } else {
            res.status(500).json({
                success: false,
                message: result.error
            });
        }
    } catch (error) {
        console.error('Process Refund Error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

/**
 * Reject refund request
 */
exports.rejectRefund = async (req, res) => {
    try {
        const { transaction_id, reason } = req.body;

        const transaction = await Transaction.findById(transaction_id);

        if (!transaction) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy transaction'
            });
        }

        if (transaction.status !== 'REFUND_PENDING') {
            return res.status(400).json({
                success: false,
                message: 'Transaction không trong trạng thái chờ hoàn tiền'
            });
        }

        transaction.status = 'COMPLETED';
        transaction.metadata.refund_rejection_reason = reason;
        await transaction.save();

        res.json({
            success: true,
            message: 'Đã từ chối yêu cầu hoàn tiền',
            data: transaction
        });
    } catch (error) {
        console.error('Reject Refund Error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};