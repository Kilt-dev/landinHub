const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const orderSchema = new mongoose.Schema({
    orderId: {
        type: String,
        default: uuidv4,
        unique: true,
        match: [/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/, 'Invalid UUID']
    },
    transactionId: {
        type: String,
        required: true,
        ref: 'Transaction'
    },
    buyerId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'User'
    },
    sellerId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'User'
    },
    marketplacePageId: {
        type: String,
        required: true,
        ref: 'MarketplacePage'
    },
    price: {
        type: Number,
        required: true,
        min: 0
    },
    createdPageId: {
        type: String,
        default: null,
        ref: 'Page'
    },
    status: {
        type: String,
        enum: ['pending', 'delivered', 'cancelled', 'refunded'],
        default: 'pending'
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
}, {
    collection: 'orders',
    timestamps: false
});

orderSchema.index({ transactionId: 1 });
orderSchema.index({ buyerId: 1, status: 1 });
orderSchema.index({ marketplacePageId: 1 });
orderSchema.index({ createdPageId: 1 });

orderSchema.pre('save', function(next) {
    this.updatedAt = new Date();
    next();
});

orderSchema.methods.deliverPage = async function() {
    if (this.status !== 'pending') return this;

    const MarketplacePage = require('./MarketplacePage');
    const Page = require('./Page');
    const Transaction = require('./Transaction');
    const { sendDeliveryConfirmation } = require('./email');

    const marketplacePage = await MarketplacePage.findById(this.marketplacePageId).populate('page_id');
    if (!marketplacePage || !marketplacePage.page_data) {
        throw new Error('MarketplacePage or page_data not found');
    }

    const newPage = new Page({
        _id: uuidv4(),
        user_id: this.buyerId,
        name: marketplacePage.title,
        description: marketplacePage.description,
        page_data: marketplacePage.page_data,
        file_path: marketplacePage.page_id.file_path,
        screenshot_url: marketplacePage.main_screenshot,
        status: 'CHƯA XUẤT BẢN'
    });
    await newPage.save();

    this.createdPageId = newPage._id;
    this.status = 'delivered';
    await this.save();

    const transaction = await Transaction.findById(this.transactionId);
    await transaction.setCreatedPage(newPage._id);

    await sendDeliveryConfirmation(this);

    return newPage;
};

// Đảm bảo xuất đúng model
module.exports = mongoose.model('Order', orderSchema);