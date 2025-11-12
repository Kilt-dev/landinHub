const mongoose = require('mongoose');

/**
 * Deployment Model
 * Stores deployment information for landing pages on AWS CloudFront + Route 53
 * Backend-only model - AWS credentials never exposed to frontend
 */
const DeploymentSchema = new mongoose.Schema({
    page_id: {
        type: String,
        required: true,
        unique: true,
        ref: 'Page'
    },
    user_id: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'User'
    },

    // Deployment Status
    status: {
        type: String,
        enum: ['idle', 'deploying', 'deployed', 'failed'],
        default: 'idle'
    },

    // AWS Resources (Backend manages these)
    s3_bucket: {
        type: String,
        trim: true
    },
    s3_object_key: {
        type: String,
        trim: true
    },
    s3_url: {
        type: String,
        trim: true
    },

    cloudfront_distribution_id: {
        type: String,
        trim: true
    },
    cloudfront_domain: {
        type: String,
        trim: true
    },

    route53_hosted_zone_id: {
        type: String,
        trim: true
    },

    // Domain Settings (User configures these)
    custom_domain: {
        type: String,
        trim: true,
        lowercase: true,
        default: null
    },
    subdomain: {
        type: String,
        trim: true,
        lowercase: true,
        default: null
    },
    use_custom_domain: {
        type: Boolean,
        default: false
    },

    // SSL Certificate
    acm_certificate_arn: {
        type: String,
        trim: true
    },
    ssl_enabled: {
        type: Boolean,
        default: true
    },

    // Deployment Metadata
    deployed_url: {
        type: String,
        trim: true
    },
    last_deployed: {
        type: Date,
        default: null
    },
    deployment_count: {
        type: Number,
        default: 0,
        min: 0
    },

    // Error Tracking
    last_error: {
        type: String,
        default: null
    },
    error_count: {
        type: Number,
        default: 0,
        min: 0
    },

    // Build Info
    build_size: {
        type: Number, // in bytes
        default: 0
    },
    build_time: {
        type: Number, // in milliseconds
        default: 0
    },

    // Deployment Logs
    logs: [{
        timestamp: {
            type: Date,
            default: Date.now
        },
        message: String,
        level: {
            type: String,
            enum: ['info', 'warn', 'error', 'success'],
            default: 'info'
        }
    }]
}, {
    timestamps: true, // createdAt, updatedAt
    collection: 'deployments'
});

// Indexes for faster queries
DeploymentSchema.index({ page_id: 1 });
DeploymentSchema.index({ user_id: 1 });
DeploymentSchema.index({ status: 1 });
DeploymentSchema.index({ custom_domain: 1 });
DeploymentSchema.index({ cloudfront_distribution_id: 1 });

// Virtual for final deployed URL
DeploymentSchema.virtual('url').get(function() {
    if (this.use_custom_domain && this.custom_domain) {
        return `https://${this.custom_domain}`;
    } else if (this.subdomain) {
        return `https://${this.subdomain}.${process.env.AWS_ROUTE53_BASE_DOMAIN || 'landinghub.app'}`;
    } else if (this.cloudfront_domain) {
        return `https://${this.cloudfront_domain}`;
    }
    return null;
});

// Method to add deployment log
DeploymentSchema.methods.addLog = function(message, level = 'info') {
    this.logs.push({
        timestamp: new Date(),
        message,
        level
    });

    // Keep only last 100 logs to prevent document size explosion
    if (this.logs.length > 100) {
        this.logs = this.logs.slice(-100);
    }
};

// Method to update deployment status
DeploymentSchema.methods.updateStatus = function(status, errorMessage = null) {
    this.status = status;

    if (status === 'deployed') {
        this.last_deployed = new Date();
        this.deployment_count += 1;
        this.last_error = null;
        this.addLog('Deployment completed successfully', 'success');
    } else if (status === 'failed') {
        this.last_error = errorMessage;
        this.error_count += 1;
        this.addLog(`Deployment failed: ${errorMessage}`, 'error');
    } else if (status === 'deploying') {
        this.addLog('Deployment started', 'info');
    }
};

// Ensure virtuals are included in JSON
DeploymentSchema.set('toJSON', { virtuals: true });
DeploymentSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Deployment', DeploymentSchema);
