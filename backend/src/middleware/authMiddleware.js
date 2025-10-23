const jwt = require('jsonwebtoken');

const authMiddleware = (req, res, next) => {
    const authHeader = req.header('Authorization');
    console.log('Authorization header:', authHeader);
    const token = authHeader?.replace('Bearer ', '');
    if (!token) {
        console.error('No token provided in Authorization header');
        return res.status(401).json({ msg: 'No token, authorization denied' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your_random_secret');
        console.log('Decoded token:', decoded);
        // Chấp nhận cả userId, id, hoặc _id trong payload
        if (!decoded.userId && !decoded.id && !decoded._id) {
            console.error('Invalid token: userId, id, or _id not found');
            return res.status(401).json({ msg: 'Invalid token: user ID not found' });
        }

        // Normalize user object - đảm bảo luôn có trường .id
        req.user = {
            ...decoded,
            id: decoded.id || decoded.userId || decoded._id
        };

        console.log('Set req.user:', req.user);
        next();
    } catch (err) {
        console.error('Token verification error:', err.message);
        return res.status(401).json({ msg: `Token is not valid: ${err.message}` });
    }
};

const isAdmin = (req, res, next) => {
    if (!req.user) {
        console.error('❌ No user object found - isAdmin must be used after authMiddleware');
        return res.status(401).json({
            error: 'Không tìm thấy thông tin người dùng. Vui lòng đăng nhập lại.'
        });
    }

    if (req.user.role !== 'admin') {
        console.warn('⚠️ Access denied for user:', req.user.email || req.user.userId || req.user.id, '(role:', req.user.role, ')');
        return res.status(403).json({
            error: 'Bạn không có quyền truy cập chức năng này. Chỉ admin mới được phép.'
        });
    }

    console.log('✅ Admin access granted for:', req.user.email || req.user.userId || req.user.id);
    next();
};

module.exports = authMiddleware;
module.exports.isAdmin = isAdmin;
module.exports.authMiddleware = authMiddleware;