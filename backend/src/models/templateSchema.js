const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const TemplateSchema = new mongoose.Schema({
    _id: {
        type: String,
        default: uuidv4,
        match: [/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/, 'Invalid UUID']
    },
    name: {
        type: String,
        required: true,
        trim: true,
        maxlength: 200
    },
    description: {
        type: String,
        trim: true,
        maxlength: 1000,
        default: ''
    },
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
            'Khác'
        ],
        default: 'Thương mại điện tử'
    },
    // Dữ liệu page_data để render - giống như Page model
    page_data: {
        type: mongoose.Schema.Types.Mixed,
        required: true,
        default: null
    },
    // File path lưu trữ template trên S3
    file_path: {
        type: String,
        trim: true,
    },
    // Thumbnail/screenshot của template
    thumbnail_url: {
        type: String,
        trim: true,
        required: true
    },
    // Screenshot URL để preview
    screenshot_url: {
        type: String,
        trim: true,
        default: null
    },
    // Giá template (0 = miễn phí)
    price: {
        type: Number,
        default: 0,
        min: 0
    },
    // Số lượt sử dụng template
    usage_count: {
        type: Number,
        default: 0,
        min: 0
    },
    // Meta data cho SEO
    meta_title: {
        type: String,
        trim: true,
        maxlength: 60
    },
    meta_description: {
        type: String,
        trim: true,
        maxlength: 160
    },
    // Tags để filter
    tags: [{
        type: String,
        trim: true
    }],
    // Trạng thái template
    status: {
        type: String,
        enum: ['ACTIVE', 'INACTIVE', 'DRAFT'],
        default: 'ACTIVE'
    },
    // Template có phải premium không
    is_premium: {
        type: Boolean,
        default: false
    },
    // Template có được featured không
    is_featured: {
        type: Boolean,
        default: false
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
    collection: 'templates',
    timestamps: false
});

// Indexes
TemplateSchema.index({ category: 1, status: 1 });
TemplateSchema.index({ is_featured: 1, status: 1 });
TemplateSchema.index({ price: 1, status: 1 });
TemplateSchema.index({ created_at: -1 });
TemplateSchema.index({ usage_count: -1 });

// Pre-save middleware
TemplateSchema.pre('save', function(next) {
    this.updated_at = new Date();
    next();
});

// Virtual fields
TemplateSchema.virtual('formatted_created_at').get(function() {
    return this.created_at ? this.created_at.toLocaleString('vi-VN') : null;
});

TemplateSchema.virtual('formatted_updated_at').get(function() {
    return this.updated_at ? this.updated_at.toLocaleString('vi-VN') : null;
});

TemplateSchema.virtual('formatted_price').get(function() {
    if (this.price === 0) return 'Miễn phí';
    return new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND'
    }).format(this.price);
});

// Methods
TemplateSchema.methods.incrementUsage = function() {
    this.usage_count += 1;
    return this.save();
};

// Method để tạo Page từ Template
TemplateSchema.methods.createPageFromTemplate = function(userId, pageName) {
    const Page = mongoose.model('Page');

    return new Page({
        _id: uuidv4(),
        user_id: userId,
        name: pageName || this.name,
        description: this.description,
        page_data: this.page_data, // Copy page_data từ template
        status: 'CHƯA XUẤT BẢN',
        meta_title: this.meta_title,
        meta_description: this.meta_description,
        created_at: new Date(),
        updated_at: new Date()
    });
};

// Static methods
TemplateSchema.statics.findActiveTemplates = function(options = {}) {
    const query = { status: 'ACTIVE' };

    if (options.category) {
        query.category = options.category;
    }

    if (options.is_premium !== undefined) {
        query.is_premium = options.is_premium;
    }

    if (options.is_featured !== undefined) {
        query.is_featured = options.is_featured;
    }

    return this.find(query).sort(options.sort || { usage_count: -1 });
};

TemplateSchema.statics.findFeaturedTemplates = function(limit = 10) {
    return this.find({
        status: 'ACTIVE',
        is_featured: true
    })
        .sort({ usage_count: -1 })
        .limit(limit);
};

TemplateSchema.statics.findByCategory = function(category) {
    return this.find({
        status: 'ACTIVE',
        category: category
    })
        .sort({ usage_count: -1 });
};

module.exports = mongoose.model('Template', TemplateSchema);