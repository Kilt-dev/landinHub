const mongoose = require('mongoose');

const PageSchema = new mongoose.Schema({
    _id: {
        type: String,
        required: true,
        match: [/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/, 'Invalid UUID']
    },
    user_id: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'User'
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
        maxlength: 1000
    },
    page_data: {
        type: mongoose.Schema.Types.Mixed,
        default: null
    },
    url: {
        type: String,
        trim: true,
    },
    file_path: {
        type: String,
        trim: true,
    },
    screenshot_url: {
        type: String,
        trim: true,
        default: null,
    },
    status: {
        type: String,
        enum: ['CHƯA XUẤT BẢN', 'ĐÃ XUẤT BẢN', 'ARCHIVED', 'ERROR'],
        default: 'CHƯA XUẤT BẢN'
    },
    views: {
        type: Number,
        default: 0,
        min: 0
    },
    conversions: {
        type: Number,
        default: 0,
        min: 0
    },
    revenue: {
        type: Number,
        default: 0,
        min: 0
    },
    zalo_chatbot_script_id: {
        type: String,
        default: null
    },
    cloudfrontDomain: {
        type: String,
        default: null
    },
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
    last_screenshot_generated: {
        type: Date,
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
    collection: 'pages',
    timestamps: false
});

PageSchema.index({ user_id: 1, updated_at: -1 });
PageSchema.index({ user_id: 1, status: 1 });
PageSchema.index({ user_id: 1, created_at: -1 });

PageSchema.pre('save', function(next) {
    try {
        this.updated_at = new Date();
        if (this.isModified('screenshot_url') && this.screenshot_url) {
            this.last_screenshot_generated = new Date();
        }
        next();
    } catch (error) {
        next(error);
    }
});

PageSchema.virtual('formatted_created_at').get(function() {
    return this.created_at ? this.created_at.toLocaleString('vi-VN') : null;
});

PageSchema.virtual('formatted_updated_at').get(function() {
    return this.updated_at ? this.updated_at.toLocaleString('vi-VN') : null;
});

PageSchema.virtual('html_url').get(function() {
    if (!this.file_path) return null;
    const s3Key = this.file_path.split('s3://')[1];
    return `https://${process.env.AWS_S3_BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com/${s3Key}/index.html`;
});

PageSchema.methods.needsScreenshotUpdate = function() {
    if (!this.last_screenshot_generated) return true;
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    return this.last_screenshot_generated < oneDayAgo;
};

PageSchema.statics.findPagesNeedingScreenshots = function() {
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    return this.find({
        status: { $ne: 'ARCHIVED' }, // Không lấy page đã lưu trữ
        $or: [
            { screenshot_url: null },
            { screenshot_url: '' },
            { last_screenshot_generated: { $lt: oneDayAgo } },
            { last_screenshot_generated: null }
        ]
    });
};

module.exports = mongoose.model('Page', PageSchema);