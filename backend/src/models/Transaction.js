const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const TransactionSchema = new mongoose.Schema({
    is_deleted: { type: Boolean, default: false, index: true },
    _id: {
        type: String,
        default: uuidv4,
        match: [/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/, 'Invalid UUID']
    },
    marketplace_page_id: {
        type: String,
        required: true,
        ref: 'MarketplacePage'
    },
    buyer_id: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'User'
    },
    seller_id: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'User'
    },
    amount: {
        type: Number,
        required: true,
        min: 0
    },
    platform_fee: {
        type: Number,
        default: 0,
        min: 0
    },
    seller_amount: {
        type: Number,
        required: true,
        min: 0
    },
    payment_method: {
        type: String,
        enum: ['MOMO', 'VNPAY', 'SANDBOX', 'COD', 'BANK_TRANSFER'],
        required: true
    },
    status: {
        type: String,
        enum: [
            'PENDING',
            'PROCESSING',
            'COMPLETED',
            'FAILED',
            'CANCELLED',
            'REFUNDED',
            'REFUND_PENDING'
        ],
        default: 'PENDING'
    },
    payout_status: {
        type: String,
        enum: [
            'PENDING',
            'PROCESSING',
            'COMPLETED',
            'FAILED'
        ],
        default: 'PENDING'
    },
    payout_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Payout',
        default: null
    },
    payment_gateway_transaction_id: {
        type: String,
        trim: true,
        default: null
    },
    payment_gateway_response: {
        type: mongoose.Schema.Types.Mixed,
        default: null
    },
    payment_url: {
        type: String,
        trim: true,
        default: null
    },
    qr_code_url: {
        type: String,
        trim: true,
        default: null
    },
    deep_link: {
        type: String,
        trim: true,
        default: null
    },
    paid_at: {
        type: Date,
        default: null
    },
    refund: {
        reason: {
            type: String,
            trim: true,
            maxlength: 500
        },
        requested_at: {
            type: Date,
            default: null
        },
        processed_at: {
            type: Date,
            default: null
        },
        refund_transaction_id: {
            type: String,
            trim: true
        }
    },
    created_page_id: {
        type: String,
        ref: 'Page',
        default: null
    },
    metadata: {
        type: mongoose.Schema.Types.Mixed,
        default: {}
    },
    ip_address: {
        type: String,
        trim: true,
        default: null
    },
    user_agent: {
        type: String,
        trim: true,
        default: null
    },
    created_at: {
        type: Date,
        default: Date.now
    },
    updated_at: {
        type: Date,
        default: Date.now
    },
    expires_at: {
        type: Date,
        default: function() {
            return new Date(Date.now() + 30 * 60 * 1000);
        }
    }
}, {
    collection: 'transactions',
    timestamps: false
});

// Indexes
TransactionSchema.index({ buyer_id: 1, status: 1 });
TransactionSchema.index({ seller_id: 1, status: 1 });
TransactionSchema.index({ marketplace_page_id: 1 });
TransactionSchema.index({ payment_gateway_transaction_id: 1 });
TransactionSchema.index({ status: 1, created_at: -1 });
TransactionSchema.index({ created_at: -1 });

// Pre-save middleware
TransactionSchema.pre('save', function(next) {
    this.updated_at = new Date();
    if (!this.seller_amount && this.amount) {
        this.seller_amount = this.amount - this.platform_fee;
    }
    next();
});

// Virtual fields
TransactionSchema.virtual('formatted_amount').get(function() {
    return new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND'
    }).format(this.amount);
});

TransactionSchema.virtual('formatted_platform_fee').get(function() {
    return new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND'
    }).format(this.platform_fee);
});

TransactionSchema.virtual('formatted_seller_amount').get(function() {
    return new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND'
    }).format(this.seller_amount);
});

TransactionSchema.virtual('is_expired').get(function() {
    if (this.status !== 'PENDING') return false;
    return new Date() > this.expires_at;
});

TransactionSchema.virtual('formatted_created_at').get(function() {
    return this.created_at ? this.created_at.toLocaleString('vi-VN') : null;
});

TransactionSchema.virtual('formatted_paid_at').get(function() {
    return this.paid_at ? this.paid_at.toLocaleString('vi-VN') : null;
});

TransactionSchema.methods.markAsPaid = async function(paymentGatewayData = {}) {
    try {
        console.log('markAsPaid called for transaction:', this._id);

        this.status = 'COMPLETED';
        this.paid_at = new Date();
        this.payment_gateway_response = paymentGatewayData;
        await this.save();
        console.log('Transaction saved as COMPLETED:', this._id);

        const Order = require('./Order');
        const MarketplacePage = require('./MarketplacePage');
        const { sendOrderConfirmation } = require('../services/email');

        let order = await Order.findOne({ transactionId: this._id });
        if (!order) {
            console.log('No existing order found, creating new order...');
            const marketplacePage = await MarketplacePage.findById(this.marketplace_page_id);
            if (!marketplacePage) {
                console.error('MarketplacePage not found for ID:', this.marketplace_page_id);
                return this;
            }

            order = new Order({
                orderId: require('uuid').v4(),
                transactionId: this._id,
                buyerId: this.buyer_id,
                sellerId: this.seller_id,
                marketplacePageId: this.marketplace_page_id,
                price: this.amount,
                status: 'pending'
            });
            await order.save();
            console.log('New order created:', order.orderId);
        } else {
            console.log('Found existing order:', order.orderId);
        }

        if (order.status === 'pending') {
            await order.deliverPage();
            // 1. Emit real-time cho buyer
            global._io.to(`user_${order.buyerId}`).emit('order_delivered', {
                orderId: order.orderId,
                marketplacePageId: order.marketplacePageId,
                createdPageId: order.createdPageId
            });

            global._io.to(`user_${order.sellerId}`).emit('new_sale', {
                orderId: order.orderId,
                marketplacePageId: order.marketplacePageId,
                amount: this.amount
            });
            console.log('Order delivered:', order.orderId);
        } else {
            console.log('Order already processed:', order.status);
        }

        // Gửi email nhưng không để lỗi email làm gián đoạn
        try {
            await sendOrderConfirmation(order);
        } catch (emailError) {
            console.error('Failed to send order confirmation, continuing...:', emailError);
        }

        await MarketplacePage.findByIdAndUpdate(this.marketplace_page_id, { $inc: { sold_count: 1 } });
        console.log('Incremented sold_count for MarketplacePage:', this.marketplace_page_id);

        return this;
    } catch (error) {
        console.error('Error in markAsPaid:', error);
        throw error;
    }
};

TransactionSchema.methods.markAsFailed = async function(reason) {
    this.status = 'FAILED';
    this.metadata.failure_reason = reason;
    return this.save();
};

TransactionSchema.methods.cancel = async function(reason) {
    if (this.status === 'COMPLETED') {
        throw new Error('Cannot cancel completed transaction');
    }
    this.status = 'CANCELLED';
    this.metadata.cancellation_reason = reason;
    return this.save();
};

TransactionSchema.methods.requestRefund = async function(reason) {
    if (this.status !== 'COMPLETED') {
        throw new Error('Can only refund completed transactions');
    }
    this.status = 'REFUND_PENDING';
    this.refund = {
        reason: reason,
        requested_at: new Date()
    };
    return this.save();
};

TransactionSchema.methods.processRefund = async function(refundTransactionId) {
    if (this.status !== 'REFUND_PENDING') {
        throw new Error('Transaction is not in refund pending status');
    }
    this.status = 'REFUNDED';
    this.refund.processed_at = new Date();
    this.refund.refund_transaction_id = refundTransactionId;
    return this.save();
};

TransactionSchema.methods.setCreatedPage = async function(pageId) {
    this.created_page_id = pageId;
    return this.save();
};

// Static methods
TransactionSchema.statics.findPendingTransactions = function() {
    return this.find({
        status: 'PENDING',
        expires_at: { $gt: new Date() }
    }).sort({ created_at: -1 });
};

TransactionSchema.statics.findCompletedTransactions = function(options = {}) {
    const query = { status: 'COMPLETED' };

    if (options.buyer_id) {
        query.buyer_id = options.buyer_id;
    }

    if (options.seller_id) {
        query.seller_id = options.seller_id;
    }

    if (options.start_date) {
        query.created_at = { ...query.created_at, $gte: new Date(options.start_date) };
    }

    if (options.end_date) {
        query.created_at = { ...query.created_at, $lte: new Date(options.end_date) };
    }

    return this.find(query)
        .populate('buyer_id', 'name email')
        .populate('seller_id', 'name email')
        .populate('marketplace_page_id')
        .sort({ created_at: -1 });
};

TransactionSchema.statics.findUserPurchases = function(userId) {
    return this.find({
        buyer_id: userId,
        status: 'COMPLETED'
    })
        .populate('marketplace_page_id')
        .populate('seller_id', 'name email')
        .sort({ created_at: -1 });
};

TransactionSchema.statics.findUserSales = function(userId) {
    return this.find({
        seller_id: userId,
        status: 'COMPLETED'
    })
        .populate('marketplace_page_id')
        .populate('buyer_id', 'name email')
        .sort({ created_at: -1 });
};

TransactionSchema.statics.calculateRevenue = async function(options = {}) {
    const mongoose = require('mongoose');
    const match = { status: 'COMPLETED' };

    if (options.seller_id) {
        match.seller_id = typeof options.seller_id === 'string'
            ? new mongoose.Types.ObjectId(options.seller_id)
            : options.seller_id;
    }

    if (options.start_date) {
        match.created_at = { ...match.created_at, $gte: new Date(options.start_date) };
    }

    if (options.end_date) {
        match.created_at = { ...match.created_at, $lte: new Date(options.end_date) };
    }

    const result = await this.aggregate([
        { $match: match },
        {
            $group: {
                _id: null,
                total_revenue: { $sum: '$amount' },
                total_platform_fee: { $sum: '$platform_fee' },
                total_seller_amount: { $sum: '$seller_amount' },
                transaction_count: { $sum: 1 }
            }
        }
    ]);

    return result.length > 0 ? result[0] : {
        total_revenue: 0,
        total_platform_fee: 0,
        total_seller_amount: 0,
        transaction_count: 0
    };
};

TransactionSchema.statics.findRefundRequests = function() {
    return this.find({
        status: 'REFUND_PENDING'
    })
        .populate('buyer_id', 'name email')
        .populate('seller_id', 'name email')
        .populate('marketplace_page_id')
        .sort({ 'refund.requested_at': 1 });
};
function notDeletedPlugin(schema) {
    schema.pre(/^find/, function() {
        if (this.getOptions().withDeleted) return; // cho phép override
        this.where({ is_deleted: { $ne: true } });
    });
    schema.pre('countDocuments', function() {
        if (this.getOptions().withDeleted) return;
        this.where({ is_deleted: { $ne: true } });
    });
}
TransactionSchema.plugin(notDeletedPlugin);
TransactionSchema.statics.cleanupPending = async function() {
    const expired = new Date(Date.now() - 30 * 60 * 1000); // 30 phút trước
    const res = await this.deleteMany({
        status: 'PENDING',
        created_at: { $lt: expired }
    });
    return res.deletedCount;
};
TransactionSchema.methods.autoRefund = async function(reason = 'User request') {
    if (!['COMPLETED', 'REFUND_PENDING'].includes(this.status))
        throw new Error('Only completed or pending-refund transactions can be refunded');

    const daysSincePaid = (Date.now() - this.paid_at) / (1000 * 3600 * 24);
    const canAuto = daysSincePaid < 7 && this.payout_status !== 'COMPLETED';

    if (canAuto) {
        // hoàn ngay
        this.status = 'REFUNDED';
        this.refund = {
            reason,
            requested_at: new Date(),
            processed_at: new Date(),
            refund_transaction_id: `AUTO_${this._id}`
        };
        await this.save();

        // trừ doanh thu marketplacePage
        await MarketplacePage.findByIdAndUpdate(this.marketplace_page_id, {
            $inc: { sold_count: -1 }
        });

        // hoàn tiền ví (giả lửa ví điện tử)
        await paymentService.refundToBuyer(this.payment_gateway_transaction_id, this.amount);

        return { success: true, auto: true };
    } else {
        // chuyển admin duyệt
        await this.requestRefund(reason);
        return { success: true, auto: false };
    }
};


module.exports = mongoose.model('Transaction', TransactionSchema);
