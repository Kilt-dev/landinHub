const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
    recipientId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    type: {
        type: String,
        enum: ['refund_requested', 'order_cancelled', 'order_delivered', 'review_received'],
        required: true
    },
    title: String,
    message: String,
    metadata: {
        orderId: String,
        buyerId: mongoose.Schema.Types.ObjectId,
        reason: String
    },
    isRead: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Notification', notificationSchema);