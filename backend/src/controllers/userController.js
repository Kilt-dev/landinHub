const User = require('../models/User');
const jwt = require('jsonwebtoken');

exports.getUserInfo = async (req, res) => {
    try {
        const user = await User.findById(req.user.userId).select('-_id -password'); // Loại bỏ _id và password
        if (!user) return res.status(404).json({ msg: 'User not found' });

        let responseData = {
            name: user.name || 'Khách',
            email: user.email,
            role: user.role,
            googleId: user.googleId,
            subscription: user.subscription,
            createdAt: user.createdAt,
        };

        if (user.role === 'admin') {
            const users = await User.find().select('-_id -password');
            const reports = { total_brokers: users.length, total_leads: 50, total_revenue: 1000 };
            responseData = { ...responseData, users, reports };
        }

        res.json(responseData);
    } catch (err) {
        console.error('Get user info error:', err);
        res.status(500).json({ msg: 'Server error' });
    }
};

exports.updateUserInfo = async (req, res) => {
    const { name } = req.body; // Chỉ chấp nhận name
    try {
        const user = await User.findById(req.user.userId);
        if (!user) return res.status(404).json({ msg: 'User not found' });

        if (name) user.name = name; // Chỉ cho phép thay đổi tên

        await user.save();

        const newToken = jwt.sign(
            { userId: user._id, role: user.role, subscription: user.subscription },
            process.env.JWT_SECRET,
            { expiresIn: '1h' }
        );
        res.json({ token: newToken, user: { name: user.name, email: user.email, role: user.role, subscription: user.subscription, createdAt: user.createdAt } });
    } catch (err) {
        console.error('Update user info error:', err);
        res.status(500).json({ msg: 'Server error' });
    }
};