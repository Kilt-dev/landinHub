const Order = require('../models/Order');
const Transaction = require('../models/Transaction');
const MarketplacePage = require('../models/MarketplacePage');
const { sendOrderCancellation, sendRefundRequest, sendRefundCompleted } = require('../services/email');
const Notification = require('../models/Notification');

/**
 * Lấy danh sách đơn hàng của user (buyer)
 */
exports.getMyOrders = async (req, res) => {
    try {
        const userId = req.user?.id || req.userId;
        const { status, page = 1, limit = 10 } = req.query;
        const skip = (parseInt(page) - 1) * parseInt(limit);

        const query = { buyerId: userId };
        if (status) query.status = status;

        const total = await Order.countDocuments(query);
        const orders = await Order.find(query)
            .populate('marketplacePageId', 'title main_screenshot price category')
            .populate('createdPageId', 'name status url')
            .populate('sellerId', 'name email')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit));

        res.json({
            success: true,
            data: orders,
            pagination: {
                total,
                page: parseInt(page),
                limit: parseInt(limit),
                totalPages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error('Get My Orders Error:', error);
        res.status(500).json({ success: false, message: 'Lỗi khi lấy đơn hàng', error: error.message });
    }
};

/**
 * Lấy danh sách đơn hàng của seller
 */
exports.getSellerOrders = async (req, res) => {
    try {
        const userId = req.user?.id || req.userId;
        const { status, page = 1, limit = 10 } = req.query;
        const skip = (parseInt(page) - 1) * parseInt(limit);

        const query = { sellerId: userId };
        if (status) query.status = status;

        const total = await Order.countDocuments(query);
        const orders = await Order.find(query)
            .populate('marketplacePageId', 'title main_screenshot price category')
            .populate('buyerId', 'name email')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit));

        res.json({
            success: true,
            data: orders,
            pagination: {
                total,
                page: parseInt(page),
                limit: parseInt(limit),
                totalPages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error('Get Seller Orders Error:', error);
        res.status(500).json({ success: false, message: 'Lỗi khi lấy đơn hàng', error: error.message });
    }
};

/**
 * Admin: lấy tất cả đơn hàng
 */
exports.getAllOrders = async (req, res) => {
    try {
        const { status, page = 1, limit = 20 } = req.query;
        const skip = (parseInt(page) - 1) * parseInt(limit);

        const query = {};
        if (status) query.status = status;

        const total = await Order.countDocuments(query);
        const orders = await Order.find(query)
            .populate('marketplacePageId', 'title price category')
            .populate('buyerId', 'name email')
            .populate('sellerId', 'name email')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit));

        res.json({
            success: true,
            data: orders,
            pagination: {
                total,
                page: parseInt(page),
                limit: parseInt(limit),
                totalPages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error('Get All Orders Error:', error);
        res.status(500).json({ success: false, message: 'Lỗi khi lấy đơn hàng', error: error.message });
    }
};

/**
 * User hủy đơn hàng (chỉ khi chưa delivered)
 */
exports.cancelOrder = async (req, res) => {
    try {
        const userId = req.user?.id || req.userId;
        const { id } = req.params;
        const { reason } = req.body;
        const order = await Order.findOne({ _id: id, buyerId: userId });
        if (!order) return res.status(404).json({ success: false, message: 'Không tìm thấy đơn hàng' });

        if (order.status === 'delivered') {
            return res.status(400).json({ success: false, message: 'Không thể hủy đơn đã giao' });
        }
        if (order.status === 'cancelled') {
            return res.status(400).json({ success: false, message: 'Đơn đã được hủy trước đó' });
        }

        order.status = 'cancelled';
        order.updatedAt = new Date();
        await order.save();

        // Hoàn tiền nếu đã thanh toán
        if (order.status === 'pending' || order.status === 'processing') {
            const tx = await Transaction.findById(order.transactionId);
            if (tx && tx.status === 'COMPLETED') {
                await tx.requestRefund(reason || 'Người mua hủy đơn');
            }
        }

        await sendOrderCancellation(order);

        res.json({ success: true, message: 'Đơn hàng đã được hủy', data: order });
    } catch (error) {
        console.error('Cancel Order Error:', error);
        res.status(500).json({ success: false, message: 'Lỗi khi hủy đơn', error: error.message });
    }
};
// orderController.js
exports.getAllOrdersAdmin = async (req, res) => {
    try {
        const { search, status, page = 1, limit = 20 } = req.query;
        const skip = (page - 1) * limit;

        let query = {};
        if (status && status !== 'all') query.status = status;
        if (search) {
            query.$or = [
                { orderId: { $regex: search, $options: 'i' } },
                { 'buyerId.name': { $regex: search, $options: 'i' } },
                { 'sellerId.name': { $regex: search, $options: 'i' } }
            ];
        }

        const orders = await Order.find(query)
            .populate('buyerId', 'name email')
            .populate('sellerId', 'name email')
            .populate('marketplacePageId', 'title price')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit));

        const total = await Order.countDocuments(query);

        res.json({
            success: true,
            data: orders,
            pagination: {
                total,
                page: parseInt(page),
                limit: parseInt(limit),
                totalPages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error('Get All Orders Admin Error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * User yêu cầu hoàn tiền (chỉ khi đã delivered)
 */
exports.requestRefund = async (req, res) => {

    try {
        const userId = req.user?.id || req.userId;
        const { id } = req.params;
        const { reason } = req.body;

        const order = await Order.findOne({ orderId: id, buyerId: userId });

        if (!order) return res.status(404).json({ success: false, message: 'Không tìm thấy đơn hàng' });

        if (order.status !== 'delivered') {
            return res.status(400).json({ success: false, message: 'Chỉ được hoàn tiền sau khi nhận hàng' });
        }

        const tx = await Transaction.findById(order.transactionId);
        if (!tx) return res.status(404).json({ success: false, message: 'Không tìm thấy giao dịch' });

        if (tx.status === 'REFUND_PENDING' || tx.status === 'REFUNDED') {
            return res.status(400).json({ success: false, message: 'Đã yêu cầu hoàn tiền trước đó' });
        }

        await sendRefundRequest(order);
        await tx.autoRefund(reason || 'Người mua yêu cầu hoàn tiền');

        const recipients = [order.sellerId];
        if (req.user.role !== 'admin') {
            const User = require('../models/User');
            const admins = await User.find({ role: 'admin' }, '_id');
            admins.forEach(a => recipients.push(a._id));
        }

        const notifications = await Notification.insertMany(
            recipients.map(rid => ({
                recipientId: rid,
                type: 'refund_requested',
                title: 'Yêu cầu hoàn tiền',
                message: `Đơn ${order.orderId} vừa được yêu cầu hoàn tiền.`,
                metadata: { orderId: order.orderId, buyerId: order.buyerId, reason }
            }))
        );

        notifications.forEach(n => {
            global._io?.to(`user_${n.recipientId}`).emit('new_notification', {
                _id: n._id,
                title: n.title,
                message: n.message,
                createdAt: n.createdAt,
                isRead: false
            });
        });


        res.json({ success: true, message: 'Yêu cầu hoàn tiền đã được gửi', data: tx });
    } catch (error) {
        console.error('Request Refund Error:', error);
        res.status(500).json({ success: false, message: 'Lỗi khi yêu cầu hoàn tiền', error: error.message });
    }
};

/**
 * Admin xử lý hoàn tiền
 */
exports.processRefund = async (req, res) => {
    try {
        const { id } = req.params;
        const { refundTransactionId } = req.body;

        const tx = await Transaction.findById(id);
        if (!tx) return res.status(404).json({ success: false, message: 'Không tìm thấy giao dịch' });

        if (tx.status !== 'REFUND_PENDING') {
            return res.status(400).json({ success: false, message: 'Giao dịch không ở trạng thái chờ hoàn tiền' });
        }

        await tx.processRefund(refundTransactionId);
        const order = await Order.findOne({ transactionId: tx._id });
        if (order) {
            order.status = 'refunded';
            order.updatedAt = new Date();
            await order.save();
            await sendRefundCompleted(order);
        }

        res.json({ success: true, message: 'Hoàn tiền thành công', data: tx });
    } catch (error) {
        console.error('Process Refund Error:', error);
        res.status(500).json({ success: false, message: 'Lỗi khi hoàn tiền', error: error.message });
    }
};

/**
 * Admin cập nhật trạng thái đơn (ví dụ: đổi thành delivered)
 */
exports.updateOrderStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status, note } = req.body;

        const order = await Order.findById(id);
        if (!order) return res.status(404).json({ success: false, message: 'Không tìm thấy đơn hàng' });

        const oldStatus = order.status;
        order.status = status;
        order.updatedAt = new Date();
        await order.save();

        res.json({ success: true, message: `Cập nhật trạng thái: ${oldStatus} → ${status}`, data: order });
    } catch (error) {
        console.error('Update Order Status Error:', error);
        res.status(500).json({ success: false, message: 'Lỗi khi cập nhật trạng thái', error: error.message });
    }
};

/**
 * Lấy chi tiết một đơn hàng
 */
exports.getOrderDetail = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.userId;
        const userRole = req.userRole; // bạn có thể gán từ middleware

        const order = await Order.findById(id)
            .populate('marketplacePageId', 'title main_screenshot price category')
            .populate('createdPageId', 'name status url file_path')
            .populate('buyerId', 'name email')
            .populate('sellerId', 'name email');

        if (!order) return res.status(404).json({ success: false, message: 'Không tìm thấy đơn hàng' });

        // Chỉ cho phép buyer, seller hoặc admin xem
        const isBuyer = order.buyerId._id.toString() === userId;
        const isSeller = order.sellerId._id.toString() === userId;
        const isAdmin = userRole === 'admin';
        if (!isBuyer && !isSeller && !isAdmin) {
            return res.status(403).json({ success: false, message: 'Không có quyền xem đơn hàng này' });
        }

        res.json({ success: true, data: order });
    } catch (error) {
        console.error('Get Order Detail Error:', error);
        res.status(500).json({ success: false, message: 'Lỗi khi lấy chi tiết đơn hàng', error: error.message });
    }
};

