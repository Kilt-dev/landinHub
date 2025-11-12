const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
    marketplacePageId: {
        type: String,
        required: true,
        index: true
    },
    buyerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    rating: {
        type: Number,
        min: 1,
        max: 5,
        required: true
    },
    comment: {
        type: String,
        trim: true,
        maxlength: 1000
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
}, { timestamps: false });

reviewSchema.index({ marketplacePageId: 1, buyerId: 1 }, { unique: true });

module.exports = mongoose.model('MarketplaceReview', reviewSchema);