const Notification = require('../models/Notification');

// Lấy danh sách thông báo của user đang đăng nhập
exports.getMyNotifications = async (req, res) => {
    try {
        const userId = req.user.id;
        const list = await Notification.find({ recipientId: userId })
            .sort({ createdAt: -1 })
            .limit(50);

        res.json({ success: true, data: list });
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