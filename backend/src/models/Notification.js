const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
    recipientId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    type: {
        type: String,
        enum: [
            'refund_requested',
            'order_cancelled',
            'order_delivered',
            'review_received',
            'chat_message',
            'admin_joined_chat',
            'chat_escalated'
        ],
        required: true
    },
    title: String,
    message: String,
    metadata: {
        orderId: String,
        buyerId: mongoose.Schema.Types.ObjectId,
        reason: String,
        roomId: mongoose.Schema.Types.ObjectId,
        messageId: mongoose.Schema.Types.ObjectId,
        senderId: mongoose.Schema.Types.ObjectId
    },
    isRead: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now }
});

// Index for efficient queries
notificationSchema.index({ recipientId: 1, createdAt: -1 });
notificationSchema.index({ recipientId: 1, isRead: 1 });

module.exports = mongoose.model('Notification', notificationSchema);