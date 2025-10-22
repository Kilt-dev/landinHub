const mongoose = require('mongoose');

const bankAccountSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    // Thông tin ngân hàng
    bankName: {
        type: String,
        required: true,
        trim: true
    },
    bankCode: {
        type: String,
        trim: true
    },
    accountNumber: {
        type: String,
        required: true,
        trim: true
    },
    accountName: {
        type: String,
        required: true,
        trim: true
    },
    branch: {
        type: String,
        trim: true
    },
    // Status
    isVerified: {
        type: Boolean,
        default: false
    },
    isDefault: {
        type: Boolean,
        default: false
    },
    isActive: {
        type: Boolean,
        default: true
    },
    // Metadata
    verifiedAt: Date,
    verifiedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    notes: String
}, {
    timestamps: true
});

// Index
bankAccountSchema.index({ userId: 1, isDefault: 1 });
bankAccountSchema.index({ userId: 1, isActive: 1 });

// Ensure only one default per user
bankAccountSchema.pre('save', async function(next) {
    if (this.isDefault && this.isModified('isDefault')) {
        await this.constructor.updateMany(
            {
                userId: this.userId,
                _id: { $ne: this._id },
                isDefault: true
            },
            { $set: { isDefault: false } }
        );
    }
    next();
});

// Methods
bankAccountSchema.methods.setAsDefault = async function() {
    await this.constructor.updateMany(
        { userId: this.userId, isDefault: true },
        { $set: { isDefault: false } }
    );
    this.isDefault = true;
    return this.save();
};

bankAccountSchema.methods.verify = async function(verifiedBy) {
    this.isVerified = true;
    this.verifiedAt = new Date();
    this.verifiedBy = verifiedBy;
    return this.save();
};

// Statics
bankAccountSchema.statics.findByUserId = function(userId) {
    return this.find({ userId, isActive: true })
        .sort({ isDefault: -1, createdAt: -1 });
};

bankAccountSchema.statics.getDefault = function(userId) {
    return this.findOne({ userId, isDefault: true, isActive: true });
};

module.exports = mongoose.model('BankAccount', bankAccountSchema);