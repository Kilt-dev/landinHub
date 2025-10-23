const User = require('../models/User');

/**
 * Middleware kiểm tra user có role admin không
 */
module.exports = async (req, res, next) => {
    try {
        // req.user đã được set bởi auth middleware
        if (!req.user || !req.user.id) {
            return res.status(401).json({
                success: false,
                message: 'Không có quyền truy cập'
            });
        }

        const user = await User.findById(req.user.id);

        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'User không tồn tại'
            });
        }

        if (user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Yêu cầu quyền admin'
            });
        }

        next();
    } catch (error) {
        console.error('Admin Middleware Error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi server'
        });
    }
};