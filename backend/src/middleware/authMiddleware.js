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

module.exports = authMiddleware;