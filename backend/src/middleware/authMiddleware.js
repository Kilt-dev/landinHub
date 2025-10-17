const jwt = require('jsonwebtoken');

const authMiddleware = (req, res, next) => {
    const authHeader = req.header('Authorization');
    console.log('Authorization header:', authHeader); // Debug
    const token = authHeader?.replace('Bearer ', '');
    if (!token) {
        console.error('No token provided in Authorization header');
        return res.status(401).json({ msg: 'No token, authorization denied' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your_random_secret');
        console.log('Decoded token:', decoded); // Debug
        if (!decoded.userId) {
            console.error('Invalid token: userId not found');
            return res.status(401).json({ msg: 'Invalid token: userId not found' });
        }
        req.user = decoded; // Match original auth.js
        console.log('Set req.user:', req.user); // Debug
        next();
    } catch (err) {
        console.error('Token verification error:', err.message);
        return res.status(401).json({ msg: `Token is not valid: ${err.message}` });
    }
};
const isAdmin = (req, res, next) => {
    // Kiểm tra xem đã qua authMiddleware chưa
    if (!req.user) {
        console.error('❌ No user object found - isAdmin must be used after authMiddleware');
        return res.status(401).json({
            error: 'Không tìm thấy thông tin người dùng. Vui lòng đăng nhập lại.'
        });
    }

    // Kiểm tra role
    if (req.user.role !== 'admin') {
        console.warn('⚠️ Access denied for user:', req.user.email || req.user.userId, '(role:', req.user.role, ')');
        return res.status(403).json({
            error: 'Bạn không có quyền truy cập chức năng này. Chỉ admin mới được phép.'
        });
    }

    console.log('✅ Admin access granted for:', req.user.email || req.user.userId);
    next();
};

// ========== EXPORT CẢ HAI ==========
module.exports = authMiddleware; // Export default (giữ nguyên tương thích code cũ)
module.exports.isAdmin = isAdmin; // Export thêm isAdmin
module.exports.authMiddleware = authMiddleware; // Export named (optional)