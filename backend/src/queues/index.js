/**
 * Queue initialization and management
 * Import this file in server.js to start all queue workers
 */

const { screenshotQueue, cleanQueue } = require('./screenshotQueue');
const cron = require('node-cron');

/**
 * Initialize all queues
 */
function initializeQueues() {
    console.log('🚀 Initializing Bull queues...');

    // Screenshot queue is already processing (defined in screenshotQueue.js)
    console.log('📸 Screenshot queue worker started (concurrency: 3)');

    // Schedule cleanup every hour
    cron.schedule('0 * * * *', async () => {
        console.log('🧹 Running scheduled queue cleanup...');
        try {
            await cleanQueue();
        } catch (error) {
            console.error('Failed to clean queue:', error);
        }
    });

    console.log('✅ All queues initialized successfully');
}

/**
 * Graceful shutdown
 */
async function shutdownQueues() {
    console.log('🛑 Shutting down queues...');

    try {
        await screenshotQueue.close();
        console.log('✅ All queues closed successfully');
    } catch (error) {
        console.error('Error closing queues:', error);
    }
}

module.exports = {
    initializeQueues,
    shutdownQueues
};
