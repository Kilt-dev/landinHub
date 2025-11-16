const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
    email: { type: String, required: true, unique: true },
    password: { type: String }, // Chỉ cho đăng ký thường, optional
    name: { type: String },
    role: { type: String, enum: ['user', 'admin'], default: 'user' },
    googleId: { type: String },
    subscription: { type: String, enum: ['free', 'premium'], default: 'free' },
    createdAt: { type: Date, default: Date.now },

    // 🔐 LOGIN TRACKING
    last_login: { type: Date, default: null },
    login_count: { type: Number, default: 0 },
    last_login_ip: { type: String, default: null },
});

// Middleware để hash password chỉ khi password tồn tại và được sửa đổi
userSchema.pre('save', async function (next) {
    if (!this.isModified('password') || !this.password) return next(); // Bỏ qua nếu password không tồn tại hoặc không thay đổi
    try {
        const salt = await bcrypt.genSalt(12);
        this.password = await bcrypt.hash(this.password, salt);
        next();
    } catch (err) {
        next(err);
    }
});

userSchema.methods.comparePassword = async function (candidatePassword) {
    if (!this.password) return false; // Trả về false nếu không có password (Google login)
    return bcrypt.compare(candidatePassword, this.password);
};

// 🔐 LOGIN TRACKING METHOD
userSchema.methods.trackLogin = async function (ipAddress = null) {
    this.last_login = new Date();
    this.login_count = (this.login_count || 0) + 1;
    if (ipAddress) {
        this.last_login_ip = ipAddress;
    }
    return this.save();
};

module.exports = mongoose.model('User', userSchema);