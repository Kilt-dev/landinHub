const Notification = require('../models/Notification');

// Lấy danh sách thông báo của user đang đăng nhập
exports.getMyNotifications = async (req, res) => {
    try {
        const userId = req.user.id;
        const { after } = req.query; // Support polling with ?after=lastNotificationId

        let query = { recipientId: userId };

        // If polling for new notifications after a specific ID
        if (after) {
            query._id = { $gt: after };
        }

        const list = await Notification.find(query)
            .sort({ createdAt: -1 })
            .limit(50);

        // Count unread notifications
        const unreadCount = await Notification.countDocuments({
            recipientId: userId,
            isRead: false
        });

        res.json({
            success: true,
            data: list,
            unreadCount,
            hasNew: list.length > 0 && after // Indicates if there are new notifications since 'after'
        });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Lỗi khi lấy thông báo', error: err.message });
    }
};

// Đánh dấu 1 thông báo đã đọc
exports.markAsRead = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;

        await Notification.updateOne(
            { _id: id, recipientId: userId },
            { isRead: true }
        );

        res.json({ success: true, message: 'Đã đánh dấu đã đọc' });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Lỗi khi cập nhật thông báo', error: err.message });
    }
};

// Đánh dấu tất cả thông báo đã đọc
exports.markAllAsRead = async (req, res) => {
    try {
        const userId = req.user.id;

        await Notification.updateMany(
            { recipientId: userId, isRead: false },
            { isRead: true }
        );

        res.json({ success: true, message: 'Đã đánh dấu tất cả đã đọc' });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Lỗi khi cập nhật thông báo', error: err.message });
    }
};

// Get unread count
exports.getUnreadCount = async (req, res) => {
    try {
        const userId = req.user.id;

        const count = await Notification.countDocuments({
            recipientId: userId,
            isRead: false
        });

        res.json({ success: true, count });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Lỗi khi lấy số thông báo', error: err.message });
    }
};

// Helper function to create notification
exports.createNotification = async (recipientId, type, title, message, metadata = {}) => {
    try {
        const notification = new Notification({
            recipientId,
            type,
            title,
            message,
            metadata
        });

        await notification.save();

        // Send real-time notification via Socket.IO if available
        if (global._io) {
            global._io.to(`user_${recipientId}`).emit('new_notification', {
                id: notification._id,
                type,
                title,
                message,
                metadata,
                createdAt: notification.createdAt
            });
        }

        return notification;
    } catch (err) {
        console.error('Error creating notification:', err);
        return null;
    }
};