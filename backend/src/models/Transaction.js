const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const TransactionSchema = new mongoose.Schema({
    _id: {
        type: String,
        default: uuidv4,
        match: [/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/, 'Invalid UUID']
    },
    // Marketplace page được mua
    marketplace_page_id: {
        type: String,
        required: true,
        ref: 'MarketplacePage'
    },
    // Người mua
    buyer_id: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'User'
    },
    // Người bán
    seller_id: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'User'
    },
    // Số tiền giao dịch (VND)
    amount: {
        type: Number,
        required: true,
        min: 0
    },
    // Phí platform (VND) - ví dụ 10% của amount
    platform_fee: {
        type: Number,
        default: 0,
        min: 0
    },
    // Số tiền seller nhận được
    seller_amount: {
        type: Number,
        required: true,
        min: 0
    },
    // Phương thức thanh toán
    payment_method: {
        type: String,
        enum: ['MOMO', 'VNPAY', 'SANDBOX', 'COD', 'BANK_TRANSFER'],
        required: true
    },
    // Trạng thái giao dịch
    status: {
        type: String,
        enum: [
            'PENDING',      // Chờ thanh toán
            'PROCESSING',   // Đang xử lý
            'COMPLETED',    // Hoàn thành
            'FAILED',       // Thất bại
            'CANCELLED',    // Đã hủy
            'REFUNDED',     // Đã hoàn tiền
            'REFUND_PENDING' // Chờ hoàn tiền
        ],
        default: 'PENDING'
    },
    // Trạng thái chuyển tiền cho seller
    payout_status: {
        type: String,
        enum: [
            'PENDING',      // Chờ chuyển tiền
            'PROCESSING',   // Đang xử lý
            'COMPLETED',    // Đã chuyển tiền
            'FAILED'        // Thất bại
        ],
        default: 'PENDING'
    },
    // Payout ID nếu đã được tạo payout
    payout_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Payout',
        default: null
    },
    // ID giao dịch từ payment gateway
    payment_gateway_transaction_id: {
        type: String,
        trim: true,
        default: null
    },
    // Response từ payment gateway
    payment_gateway_response: {
        type: mongoose.Schema.Types.Mixed,
        default: null
    },
    // URL thanh toán (cho MOMO, VNPay)
    payment_url: {
        type: String,
        trim: true,
        default: null
    },
    // Mã QR thanh toán (cho MOMO)
    qr_code_url: {
        type: String,
        trim: true,
        default: null
    },
    // Deep link (cho MOMO app)
    deep_link: {
        type: String,
        trim: true,
        default: null
    },
    // Thời gian thanh toán thành công
    paid_at: {
        type: Date,
        default: null
    },
    // Thông tin refund
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
    // Page được tạo sau khi mua (copy từ marketplace page)
    created_page_id: {
        type: String,
        ref: 'Page',
        default: null
    },
    // Metadata bổ sung
    metadata: {
        type: mongoose.Schema.Types.Mixed,
        default: {}
    },
    // IP address của buyer
    ip_address: {
        type: String,
        trim: true,
        default: null
    },
    // User agent
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
    // Expiry time cho transaction (30 phút)
    expires_at: {
        type: Date,
        default: function() {
            return new Date(Date.now() + 30 * 60 * 1000); // 30 minutes
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
TransactionSchema.index({ expires_at: 1 }, { expireAfterSeconds: 0 }); // TTL index
TransactionSchema.index({ created_at: -1 });

// Pre-save middleware
TransactionSchema.pre('save', function(next) {
    this.updated_at = new Date();

    // Tự động tính seller_amount nếu chưa có
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

// Methods
TransactionSchema.methods.markAsPaid = async function(paymentGatewayData = {}) {
    this.status = 'COMPLETED';
    this.paid_at = new Date();
    this.payment_gateway_response = paymentGatewayData;
    return this.save();
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
        // Convert to ObjectId if string
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

    console.log('calculateRevenue match:', JSON.stringify(match));

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

    console.log('calculateRevenue result:', result);

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

module.exports = mongoose.model('Transaction', TransactionSchema);