const mongoose = require('mongoose');

const MarketplacePageSchema = new mongoose.Schema({
    _id: {
        type: String,
        required: true,
        match: [/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/, 'Invalid UUID']
    },
    // Tham chiếu đến Page gốc
    page_id: {
        type: String,
        required: true,
        ref: 'Page'
    },
    // Người bán
    seller_id: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'User'
    },
    // Tiêu đề bài đăng bán
    title: {
        type: String,
        required: true,
        trim: true,
        maxlength: 200
    },
    // Mô tả chi tiết cho marketplace
    description: {
        type: String,
        required: true,
        trim: true,
        maxlength: 2000
    },
    // Danh mục
    category: {
        type: String,
        enum: [
            'Thương mại điện tử',
            'Landing Page',
            'Blog',
            'Portfolio',
            'Doanh nghiệp',
            'Giáo dục',
            'Sự kiện',
            'Bất động sản',
            'Ẩm thực',
            'Du lịch',
            'Y tế',
            'Thời trang',
            'Khác'
        ],
        required: true,
        default: 'Landing Page'
    },
    // Giá bán (VND)
    price: {
        type: Number,
        required: true,
        min: 0,
        default: 0
    },
    // Giá gốc (để hiển thị giảm giá)
    original_price: {
        type: Number,
        default: null,
        min: 0
    },
    // Screenshots cho marketplace (có thể nhiều ảnh)
    screenshots: [{
        type: String,
        trim: true
    }],
    // Screenshot chính
    main_screenshot: {
        type: String,
        trim: true,
        default: null
    },
    // URL demo live
    demo_url: {
        type: String,
        trim: true,
        default: null
    },
    // ✅ Page data (copy from original page với updated image URLs)
    page_data: {
        type: mongoose.Schema.Types.Mixed,
        default: null
    },
    // Tags để tìm kiếm
    tags: [{
        type: String,
        trim: true
    }],
    // Trạng thái đăng bán
    status: {
        type: String,
        enum: ['DRAFT', 'PENDING', 'ACTIVE', 'SOLD_OUT', 'SUSPENDED', 'REJECTED'],
        default: 'DRAFT'
    },
    // Lý do từ chối (nếu bị reject bởi admin)
    rejection_reason: {
        type: String,
        trim: true,
        maxlength: 500,
        default: null
    },
    // Số lượt xem
    views: {
        type: Number,
        default: 0,
        min: 0
    },
    // Số lượt thích
    likes: {
        type: Number,
        default: 0,
        min: 0
    },
    // Người đã thích
    liked_by: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    // Số lượng đã bán
    sold_count: {
        type: Number,
        default: 0,
        min: 0
    },
    rating: {
        type: Number,
        default: 0,
        min: 0,
        max: 5
    },
    // Số lượng đánh giá
    review_count: {
        type: Number,
        default: 0,
        min: 0
    },
    // Featured trên marketplace
    is_featured: {
        type: Boolean,
        default: false
    },
    // Best seller
    is_bestseller: {
        type: Boolean,
        default: false
    },
    // Có tùy chỉnh sau khi mua không
    customizable: {
        type: Boolean,
        default: true
    },
    // Có hỗ trợ responsive không
    responsive: {
        type: Boolean,
        default: true
    },
    // Thời gian duyệt bởi admin
    approved_at: {
        type: Date,
        default: null
    },
    // Admin duyệt
    approved_by: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null
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
    collection: 'marketplace_pages',
    timestamps: false
});

// Indexes
MarketplacePageSchema.index({ seller_id: 1, status: 1 });
MarketplacePageSchema.index({ category: 1, status: 1 });
MarketplacePageSchema.index({ status: 1, is_featured: 1 });
MarketplacePageSchema.index({ status: 1, sold_count: -1 });
MarketplacePageSchema.index({ status: 1, rating: -1 });
MarketplacePageSchema.index({ created_at: -1 });
MarketplacePageSchema.index({ price: 1 });
MarketplacePageSchema.index({ tags: 1 });

// Text index cho tìm kiếm
MarketplacePageSchema.index({
    title: 'text',
    description: 'text',
    tags: 'text'
});

// Pre-save middleware
MarketplacePageSchema.pre('save', function(next) {
    this.updated_at = new Date();

    // Tự động set main_screenshot từ screenshots[0] nếu chưa có
    if (!this.main_screenshot && this.screenshots && this.screenshots.length > 0) {
        this.main_screenshot = this.screenshots[0];
    }

    // Tự động set bestseller nếu sold_count > 100
    if (this.sold_count >= 100) {
        this.is_bestseller = true;
    }

    next();
});

// Virtual fields
MarketplacePageSchema.virtual('formatted_price').get(function() {
    if (this.price === 0) return 'Miễn phí';
    return new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND'
    }).format(this.price);
});

MarketplacePageSchema.virtual('formatted_original_price').get(function() {
    if (!this.original_price) return null;
    return new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND'
    }).format(this.original_price);
});

MarketplacePageSchema.virtual('discount_percentage').get(function() {
    if (!this.original_price || this.original_price <= this.price) return 0;
    return Math.round(((this.original_price - this.price) / this.original_price) * 100);
});

MarketplacePageSchema.virtual('is_on_sale').get(function() {
    return this.original_price && this.original_price > this.price;
});

MarketplacePageSchema.virtual('formatted_created_at').get(function() {
    return this.created_at ? this.created_at.toLocaleString('vi-VN') : null;
});

MarketplacePageSchema.virtual('formatted_updated_at').get(function() {
    return this.updated_at ? this.updated_at.toLocaleString('vi-VN') : null;
});

// Methods
MarketplacePageSchema.methods.incrementViews = async function() {
    this.views += 1;
    return this.save();
};

MarketplacePageSchema.methods.incrementSoldCount = async function() {
    this.sold_count += 1;
    return this.save();
};

MarketplacePageSchema.methods.toggleLike = async function(userId) {
    const userIdStr = userId.toString();
    const likedByStr = this.liked_by.map(id => id.toString());

    if (likedByStr.includes(userIdStr)) {
        // Unlike
        this.liked_by = this.liked_by.filter(id => id.toString() !== userIdStr);
        this.likes = Math.max(0, this.likes - 1);
    } else {
        // Like
        this.liked_by.push(userId);
        this.likes += 1;
    }

    return this.save();
};

MarketplacePageSchema.methods.approve = async function(adminId) {
    this.status = 'ACTIVE';
    this.approved_by = adminId;
    this.approved_at = new Date();
    this.rejection_reason = null;
    return this.save();
};

MarketplacePageSchema.methods.reject = async function(reason) {
    this.status = 'REJECTED';
    this.rejection_reason = reason;
    this.approved_by = null;
    this.approved_at = null;
    return this.save();
};

MarketplacePageSchema.methods.suspend = async function(reason) {
    this.status = 'SUSPENDED';
    this.rejection_reason = reason;
    return this.save();
};

MarketplacePageSchema.methods.updateRating = async function(newRating, reviewCount) {
    // Cập nhật rating trung bình
    this.rating = newRating;
    this.review_count = reviewCount;
    return this.save();
};

// Static methods
MarketplacePageSchema.statics.findActivePages = function(options = {}) {
    const query = { status: 'ACTIVE' };

    if (options.category) {
        query.category = options.category;
    }

    if (options.seller_id) {
        query.seller_id = options.seller_id;
    }

    if (options.is_featured !== undefined) {
        query.is_featured = options.is_featured;
    }

    if (options.price_min !== undefined) {
        query.price = { ...query.price, $gte: options.price_min };
    }

    if (options.price_max !== undefined) {
        query.price = { ...query.price, $lte: options.price_max };
    }

    return this.find(query);
};

MarketplacePageSchema.statics.findFeaturedPages = function(limit = 10) {
    return this.find({
        status: 'ACTIVE',
        is_featured: true
    })
        .populate('seller_id', 'name email')
        .sort({ sold_count: -1, rating: -1 })
        .limit(limit);
};

MarketplacePageSchema.statics.findBestsellers = function(limit = 10) {
    return this.find({
        status: 'ACTIVE',
        is_bestseller: true
    })
        .populate('seller_id', 'name email')
        .sort({ sold_count: -1 })
        .limit(limit);
};

MarketplacePageSchema.statics.findNewArrival = function(limit = 10) {
    return this.find({
        status: 'ACTIVE'
    })
        .populate('seller_id', 'name email')
        .sort({ created_at: -1 })
        .limit(limit);
};

MarketplacePageSchema.statics.searchPages = function(searchTerm, options = {}) {
    const query = {
        $text: { $search: searchTerm },
        status: 'ACTIVE'
    };

    if (options.category) {
        query.category = options.category;
    }

    return this.find(query, { score: { $meta: 'textScore' } })
        .sort({ score: { $meta: 'textScore' } });
};

MarketplacePageSchema.statics.findPendingApproval = function() {
    return this.find({ status: 'PENDING' })
        .populate('seller_id', 'name email')
        .sort({ created_at: 1 });
};

module.exports = mongoose.model('MarketplacePage', MarketplacePageSchema);