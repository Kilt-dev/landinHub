const mongoose = require('mongoose');

/**
 * FormSubmission Model - Stores all form submissions from landing pages
 * Similar to LadiPage form management system
 */
const FormSubmissionSchema = new mongoose.Schema({
    _id: {
        type: String,
        required: true,
        default: () => require('uuid').v4()
    },
    // Reference to the page this submission came from
    page_id: {
        type: String,
        required: true,
        ref: 'Page',
        index: true
    },
    // Reference to the form element ID within the page
    form_id: {
        type: String,
        required: true,
        index: true
    },
    // Owner of the page (for quick access)
    user_id: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'User',
        index: true
    },
    // Form data submitted by end user
    form_data: {
        type: Map,
        of: mongoose.Schema.Types.Mixed,
        required: true
    },
    // Metadata about submission
    metadata: {
        // IP address of submitter
        ip_address: String,
        // User agent (browser info)
        user_agent: String,
        // Referrer URL
        referrer: String,
        // UTM parameters for tracking
        utm_source: String,
        utm_medium: String,
        utm_campaign: String,
        utm_term: String,
        utm_content: String,
        // Device info
        device_type: {
            type: String,
            enum: ['desktop', 'tablet', 'mobile', 'unknown'],
            default: 'unknown'
        },
        // Browser language
        language: String,
        // Screen resolution
        screen_resolution: String
    },
    // Status of this submission
    status: {
        type: String,
        enum: ['new', 'read', 'replied', 'archived', 'spam'],
        default: 'new',
        index: true
    },
    // Tags for organizing submissions
    tags: [{
        type: String,
        trim: true
    }],
    // Notes added by page owner
    notes: {
        type: String,
        maxlength: 2000
    },
    // Integration status
    integrations: {
        // Google Sheets export
        google_sheets: {
            exported: { type: Boolean, default: false },
            exported_at: Date,
            sheet_id: String,
            row_number: Number,
            error: String
        },
        // Email notification
        email: {
            sent: { type: Boolean, default: false },
            sent_at: Date,
            recipient: String,
            error: String
        },
        // Webhook
        webhook: {
            sent: { type: Boolean, default: false },
            sent_at: Date,
            url: String,
            status_code: Number,
            error: String
        },
        // Third-party CRM
        crm: {
            synced: { type: Boolean, default: false },
            synced_at: Date,
            crm_type: String, // 'hubspot', 'salesforce', etc.
            crm_id: String,
            error: String
        }
    },
    // Timestamps
    submitted_at: {
        type: Date,
        default: Date.now,
        index: true
    },
    updated_at: {
        type: Date,
        default: Date.now
    }
}, {
    collection: 'form_submissions',
    timestamps: false
});

// Compound indexes for efficient queries
FormSubmissionSchema.index({ page_id: 1, submitted_at: -1 });
FormSubmissionSchema.index({ user_id: 1, submitted_at: -1 });
FormSubmissionSchema.index({ page_id: 1, status: 1, submitted_at: -1 });
FormSubmissionSchema.index({ user_id: 1, status: 1, submitted_at: -1 });
FormSubmissionSchema.index({ form_id: 1, submitted_at: -1 });

// Update timestamp on save
FormSubmissionSchema.pre('save', function(next) {
    this.updated_at = new Date();
    next();
});

// Virtual for formatted date
FormSubmissionSchema.virtual('formatted_submitted_at').get(function() {
    return this.submitted_at ? this.submitted_at.toLocaleString('vi-VN') : null;
});

// Method to check if submission is recent (within 24 hours)
FormSubmissionSchema.methods.isRecent = function() {
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    return this.submitted_at > oneDayAgo;
};

// Static method to get submissions stats for a page
FormSubmissionSchema.statics.getPageStats = async function(pageId) {
    const stats = await this.aggregate([
        { $match: { page_id: pageId } },
        {
            $group: {
                _id: null,
                total: { $sum: 1 },
                new: {
                    $sum: { $cond: [{ $eq: ['$status', 'new'] }, 1, 0] }
                },
                read: {
                    $sum: { $cond: [{ $eq: ['$status', 'read'] }, 1, 0] }
                },
                replied: {
                    $sum: { $cond: [{ $eq: ['$status', 'replied'] }, 1, 0] }
                },
                archived: {
                    $sum: { $cond: [{ $eq: ['$status', 'archived'] }, 1, 0] }
                },
                spam: {
                    $sum: { $cond: [{ $eq: ['$status', 'spam'] }, 1, 0] }
                }
            }
        }
    ]);

    return stats.length > 0 ? stats[0] : {
        total: 0,
        new: 0,
        read: 0,
        replied: 0,
        archived: 0,
        spam: 0
    };
};

// Static method to get recent submissions
FormSubmissionSchema.statics.getRecentSubmissions = function(userId, limit = 10) {
    return this.find({ user_id: userId })
        .sort({ submitted_at: -1 })
        .limit(limit)
        .populate('page_id', 'name url');
};

// Static method to export submissions to array format (for CSV/Excel)
FormSubmissionSchema.statics.exportToArray = async function(filter = {}) {
    const submissions = await this.find(filter).sort({ submitted_at: -1 });

    if (submissions.length === 0) return [];

    // Get all unique field names
    const allFields = new Set();
    submissions.forEach(sub => {
        Object.keys(sub.form_data.toObject()).forEach(key => allFields.add(key));
    });

    // Create header row
    const headers = ['ID', 'Ngày gửi', 'Trạng thái', ...Array.from(allFields), 'IP', 'Device'];

    // Create data rows
    const rows = submissions.map(sub => {
        const row = [
            sub._id,
            sub.formatted_submitted_at,
            sub.status,
        ];

        // Add form data fields
        allFields.forEach(field => {
            row.push(sub.form_data.get(field) || '');
        });

        // Add metadata
        row.push(sub.metadata?.ip_address || '');
        row.push(sub.metadata?.device_type || '');

        return row;
    });

    return [headers, ...rows];
};

module.exports = mongoose.model('FormSubmission', FormSubmissionSchema);
