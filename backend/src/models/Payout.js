const mongoose = require('mongoose');

const PayoutSchema = new mongoose.Schema({
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
    transaction_ids: [{
        type: String,
        ref: 'Transaction'
    }],
    status: {
        type: String,
        enum: ['PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'CANCELLED'],
        default: 'PENDING'
    },
    bank_account_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'BankAccount'
    },
    bank_info: {
        bank_name: String,
        account_number: String,
        account_name: String,
        bank_code: String
    },
    payout_method: {
        type: String,
        enum: ['BANK_TRANSFER', 'MOMO', 'VNPAY', 'MANUAL'],
        default: 'BANK_TRANSFER'
    },
    transfer_result: {
        type: mongoose.Schema.Types.Mixed
    },
    processed_by: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    processed_at: {
        type: Date,
        default: null
    },
    notes: {
        type: String,
        trim: true,
        maxlength: 500
    },
    proof_url: {
        type: String,
        trim: true
    },
    created_at: {
        type: Date,
        default: Date.now
    },
    updated_at: {
        type: Date,
        default: Date.now
    }
}, {
    collection: 'payouts',
    timestamps: false
});

// Indexes
PayoutSchema.index({ seller_id: 1, status: 1 });
PayoutSchema.index({ status: 1, created_at: -1 });
PayoutSchema.index({ created_at: -1 });

PayoutSchema.pre('save', function(next) {
    this.updated_at = new Date();
    next();
});

PayoutSchema.methods.markAsCompleted = async function(processedBy, proofUrl, notes) {
    const Order = require('./Order');

    // Kiểm tra tất cả order liên quan đã delivered
    const orders = await Order.find({ transactionId: { $in: this.transaction_ids } });
    const allDelivered = orders.every(order => order.status === 'delivered');
    if (!allDelivered) {
        throw new Error('Not all related orders are delivered');
    }

    this.status = 'COMPLETED';
    this.processed_by = processedBy;
    this.processed_at = new Date();
    this.proof_url = proofUrl;
    this.notes = notes;

    const Transaction = require('./Transaction');
    await Transaction.updateMany(
        { _id: { $in: this.transaction_ids } },
        { $set: { payout_status: 'COMPLETED', payout_id: this._id } }
    );

    return this.save();
};

PayoutSchema.methods.markAsFailed = async function(reason) {
    this.status = 'FAILED';
    this.notes = reason;
    return this.save();
};

PayoutSchema.statics.findPending = function() {
    return this.find({ status: 'PENDING' })
        .populate('seller_id', 'name email')
        .sort({ created_at: 1 });
};

PayoutSchema.statics.calculatePendingAmount = async function(sellerId) {
    const Transaction = require('./Transaction');

    const result = await Transaction.aggregate([
        {
            $match: {
                seller_id: mongoose.Types.ObjectId(sellerId),
                status: 'COMPLETED',
                payout_status: { $ne: 'COMPLETED' }
            }
        },
        {
            $group: {
                _id: null,
                total: { $sum: '$seller_amount' },
                count: { $sum: 1 }
            }
        }
    ]);

    return result.length > 0 ? result[0] : { total: 0, count: 0 };
};

module.exports = mongoose.model('Payout', PayoutSchema);