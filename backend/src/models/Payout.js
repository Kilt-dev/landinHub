const mongoose = require('mongoose');

const PayoutSchema = new mongoose.Schema({
    // Người bán nhận tiền
    seller_id: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'User'
    },
    // Số tiền cần chuyển
    amount: {
        type: Number,
        required: true,
        min: 0
    },
    // Các transactions liên quan
    transaction_ids: [{
        type: String,
        ref: 'Transaction'
    }],
    // Trạng thái
    status: {
        type: String,
        enum: [
            'PENDING',      // Chờ admin xử lý
            'PROCESSING',   // Admin đang xử lý
            'COMPLETED',    // Đã chuyển tiền
            'FAILED',       // Thất bại
            'CANCELLED'     // Đã hủy
        ],
        default: 'PENDING'
    },
    // Thông tin ngân hàng của seller
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
    // Payment method for payout
    payout_method: {
        type: String,
        enum: ['BANK_TRANSFER', 'MOMO', 'VNPAY', 'MANUAL'],
        default: 'BANK_TRANSFER'
    },
    // Auto transfer result
    transfer_result: {
        type: mongoose.Schema.Types.Mixed
    },
    // Admin xử lý
    processed_by: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    // Thời gian xử lý
    processed_at: {
        type: Date,
        default: null
    },
    // Ghi chú
    notes: {
        type: String,
        trim: true,
        maxlength: 500
    },
    // Bằng chứng chuyển tiền (URL ảnh)
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

// Pre-save middleware
PayoutSchema.pre('save', function(next) {
    this.updated_at = new Date();
    next();
});

// Methods
PayoutSchema.methods.markAsCompleted = async function(processedBy, proofUrl, notes) {
    this.status = 'COMPLETED';
    this.processed_by = processedBy;
    this.processed_at = new Date();
    this.proof_url = proofUrl;
    this.notes = notes;

    // Cập nhật các transactions liên quan
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

// Static methods
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