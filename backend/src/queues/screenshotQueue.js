const Queue = require('bull');
const screenshotService = require('../services/screenshotService');

// Create queue instance
const screenshotQueue = new Queue('screenshot-generation', {
    redis: {
        host: process.env.REDIS_HOST || 'localhost',
        port: process.env.REDIS_PORT || 6379,
        password: process.env.REDIS_PASSWORD || undefined,
        // Retry connection on failure
        retryStrategy: (times) => {
            const delay = Math.min(times * 50, 2000);
            return delay;
        }
    },
    defaultJobOptions: {
        attempts: 3, // Retry 3 times if failed
        backoff: {
            type: 'exponential',
            delay: 2000 // Start with 2s, then 4s, 8s
        },
        removeOnComplete: true, // Auto-cleanup successful jobs
        removeOnFail: false // Keep failed jobs for debugging
    }
});

/**
 * Process screenshot generation jobs
 * concurrency: Number of jobs to process in parallel
 */
screenshotQueue.process(3, async (job) => {
    const { pageId, htmlContent, s3Key, marketplacePageId, modelType, modelId } = job.data;
    const targetId = marketplacePageId || pageId || modelId;

    console.log(`📸 [Queue] Processing screenshot for ${modelType || 'page'} ${targetId} (Job ${job.id})`);

    try {
        let screenshotUrl;

        // Update progress
        await job.progress(25);

        // Check if we need to fetch HTML from S3
        if (s3Key) {
            console.log(`📥 [Queue] Fetching HTML from S3: ${s3Key}`);
            screenshotUrl = await screenshotService.generateScreenshotFromS3(s3Key, targetId);
        } else if (htmlContent) {
            console.log(`📄 [Queue] Generating from HTML content`);
            screenshotUrl = await screenshotService.generateScreenshot(htmlContent, targetId);
        } else {
            throw new Error('Either htmlContent or s3Key must be provided');
        }

        console.log(`✅ [Queue] Screenshot generated: ${screenshotUrl}`);

        // Update progress
        await job.progress(100);

        // Update database based on model type
        if (modelType && modelId) {
            await updateModelScreenshot(modelType, modelId, screenshotUrl);
        }

        return {
            success: true,
            screenshotUrl,
            pageId: targetId,
            modelType,
            modelId
        };
    } catch (error) {
        console.error(`❌ [Queue] Screenshot failed for ${modelType || 'page'} ${targetId}:`, error.message);
        throw error; // Bull will retry
    }
});

/**
 * Update database with screenshot URL based on model type
 */
async function updateModelScreenshot(modelType, modelId, screenshotUrl) {
    try {
        let Model;

        switch (modelType) {
            case 'MarketplacePage':
                Model = require('../models/MarketplacePage');
                break;
            case 'Page':
                Model = require('../models/Page');
                break;
            case 'Template':
                Model = require('../models/Template');
                break;
            default:
                console.warn(`⚠️  [Queue] Unknown model type: ${modelType}`);
                return;
        }

        await Model.findByIdAndUpdate(modelId, {
            screenshot_url: screenshotUrl,
            screenshot_status: 'completed',
            screenshot_updated_at: new Date()
        });

        console.log(`✅ [Queue] Updated ${modelType} ${modelId} with screenshot URL`);
    } catch (error) {
        console.error(`❌ [Queue] Failed to update ${modelType} ${modelId}:`, error.message);
        // Don't throw - screenshot is already generated, just DB update failed
    }
}

/**
 * Event listeners for monitoring
 */
screenshotQueue.on('completed', (job, result) => {
    console.log(`✅ [Queue] Job ${job.id} completed successfully:`, result.screenshotUrl);
});

screenshotQueue.on('failed', (job, err) => {
    console.error(`❌ [Queue] Job ${job.id} failed after ${job.attemptsMade} attempts:`, err.message);
});

screenshotQueue.on('stalled', (job) => {
    console.warn(`⚠️  [Queue] Job ${job.id} stalled`);
});

screenshotQueue.on('error', (error) => {
    console.error('❌ [Queue] Redis connection error:', error.message);
});

/**
 * Add screenshot generation job to queue (from HTML content)
 */
async function addScreenshotJob(pageId, htmlContent, options = {}) {
    const job = await screenshotQueue.add(
        {
            pageId: pageId,
            marketplacePageId: pageId,
            htmlContent: htmlContent,
            modelType: options.modelType,
            modelId: options.modelId || pageId
        },
        {
            priority: options.priority || 10, // Lower number = higher priority
            delay: options.delay || 0, // Delay in ms before processing
            ...options
        }
    );

    console.log(`📋 [Queue] Screenshot job added: ${job.id} for page ${pageId}`);
    return job;
}

/**
 * Add screenshot generation job from S3
 */
async function addScreenshotJobFromS3(s3Key, pageId, options = {}) {
    const job = await screenshotQueue.add(
        {
            s3Key: s3Key,
            pageId: pageId,
            marketplacePageId: pageId,
            modelType: options.modelType,
            modelId: options.modelId || pageId
        },
        {
            priority: options.priority || 10,
            delay: options.delay || 0,
            ...options
        }
    );

    console.log(`📋 [Queue] Screenshot job added from S3: ${job.id} for ${s3Key}`);
    return job;
}

/**
 * Get queue stats
 */
async function getQueueStats() {
    const [waiting, active, completed, failed, delayed] = await Promise.all([
        screenshotQueue.getWaitingCount(),
        screenshotQueue.getActiveCount(),
        screenshotQueue.getCompletedCount(),
        screenshotQueue.getFailedCount(),
        screenshotQueue.getDelayedCount()
    ]);

    return {
        waiting,
        active,
        completed,
        failed,
        delayed,
        total: waiting + active + delayed
    };
}

/**
 * Clean old jobs (run periodically)
 */
async function cleanQueue() {
    // Remove completed jobs older than 1 hour
    await screenshotQueue.clean(3600 * 1000, 'completed');
    // Remove failed jobs older than 24 hours
    await screenshotQueue.clean(24 * 3600 * 1000, 'failed');

    console.log('🧹 [Queue] Cleaned old jobs');
}

module.exports = {
    screenshotQueue,
    addScreenshotJob,
    addScreenshotJobFromS3,
    getQueueStats,
    cleanQueue
};
