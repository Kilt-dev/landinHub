const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
    const authHeader = req.header('Authorization');
    const token = authHeader?.replace('Bearer ', '');
    if (!token) return res.status(401).json({ msg: 'No token, authorization denied' });

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        next();
    } catch (err) {
        res.status(401).json({ msg: 'Token is not valid' });
    }
};
