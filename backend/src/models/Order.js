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
        required: false, // ✅ Không bắt buộc để handle orders cũ không có transaction
        ref: 'Transaction',
        default: null
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
    payment_method: {
        type: String,
        enum: ['MOMO', 'VNPAY', 'SANDBOX', 'BANK_TRANSFER', null],
        default: null
    },
    createdPageId: {
        type: String,
        default: null,
        ref: 'Page'
    },
    status: {
        type: String,
        enum: ['pending', 'processing', 'delivered', 'cancelled', 'refunded'],
        default: 'pending'
    },
    refund_reason: {
        type: String,
        default: null
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    },
    is_deleted: {
        type: Boolean,
        default: false
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
    if (this.status !== 'pending') {
        console.log(`⚠️ Order ${this.orderId} status is not pending, skipping delivery`);
        return this;
    }

    const MarketplacePage = require('./MarketplacePage');
    const Page = require('./Page');
    const Transaction = require('./Transaction');
    const { sendDeliveryConfirmation } = require('./email');

    // ✅ FIX: Better error handling for missing marketplace page data
    const marketplacePage = await MarketplacePage.findById(this.marketplacePageId).populate('page_id');

    if (!marketplacePage) {
        console.error(`❌ MarketplacePage not found for ID: ${this.marketplacePageId}`);
        throw new Error(`MarketplacePage not found for ID: ${this.marketplacePageId}`);
    }

    if (!marketplacePage.page_data) {
        console.error(`❌ page_data not found for MarketplacePage: ${this.marketplacePageId}`);
        throw new Error(`page_data not found for MarketplacePage: ${this.marketplacePageId}`);
    }

    if (!marketplacePage.page_id) {
        console.error(`❌ page_id not found for MarketplacePage: ${this.marketplacePageId}`);
        throw new Error(`page_id not found for MarketplacePage: ${this.marketplacePageId}`);
    }

    console.log(`✅ Creating new page for buyer ${this.buyerId} from marketplace page ${this.marketplacePageId}`);

    const newPage = new Page({
        _id: uuidv4(),
        user_id: this.buyerId,
        name: marketplacePage.title,
        description: marketplacePage.description,
        page_data: marketplacePage.page_data,
        file_path: marketplacePage.page_id.file_path || null,
        screenshot_url: marketplacePage.main_screenshot,
        status: 'CHƯA XUẤT BẢN'
    });
    await newPage.save();
    console.log(`✅ New page created: ${newPage._id}`);

    this.createdPageId = newPage._id;
    this.status = 'delivered';
    await this.save();
    console.log(`✅ Order ${this.orderId} marked as delivered`);

    // ✅ Update transaction with created page ID
    if (this.transactionId) {
        try {
            const transaction = await Transaction.findById(this.transactionId);
            if (transaction) {
                await transaction.setCreatedPage(newPage._id);
                console.log(`✅ Transaction ${this.transactionId} updated with created page ID`);
            }
        } catch (txError) {
            console.error(`❌ Error updating transaction ${this.transactionId}:`, txError);
            // Don't fail delivery if transaction update fails
        }
    }

    // ✅ Send delivery confirmation email (non-critical)
    try {
        await sendDeliveryConfirmation(this);
        console.log(`✅ Delivery confirmation email sent for order ${this.orderId}`);
    } catch (emailError) {
        console.error(`❌ Failed to send delivery confirmation email:`, emailError);
        // Don't fail delivery if email fails
    }

    return newPage;
};

// Đảm bảo xuất đúng model
module.exports = mongoose.model('Order', orderSchema);