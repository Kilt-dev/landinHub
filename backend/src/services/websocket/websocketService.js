const AWS = require('aws-sdk');
const connectionManager = require('./connectionManager');

/**
 * WebSocket Service for AWS API Gateway WebSocket (OPTIMIZED)
 * Replaces Socket.IO for serverless architecture
 */
class WebSocketService {
    constructor() {
        this.apiGatewayManagementApi = null;
        this.endpoint = process.env.WEBSOCKET_API_ENDPOINT;
        this.maxRetries = 3;
        this.retryDelay = 1000; // 1 second base delay

        // Metrics
        this.metrics = {
            messagesSent: 0,
            messagesFailed: 0,
            staleConnectionsRemoved: 0
        };
    }

    /**
     * Initialize API Gateway Management API client
     * @param {string} endpoint - WebSocket API endpoint
     */
    initializeClient(endpoint) {
        if (endpoint) {
            this.endpoint = endpoint;
        }

        if (!this.endpoint) {
            console.warn('⚠️  WebSocket endpoint not configured');
            return;
        }

        // Convert wss:// to https:// for API Gateway Management API
        const httpsEndpoint = this.endpoint.replace('wss://', 'https://');

        this.apiGatewayManagementApi = new AWS.ApiGatewayManagementApi({
            endpoint: httpsEndpoint,
            region: process.env.AWS_REGION || 'ap-southeast-1',
            maxRetries: this.maxRetries,
            httpOptions: {
                timeout: 5000, // 5 second timeout
                connectTimeout: 3000 // 3 second connect timeout
            }
        });

        console.log(`✅ WebSocket client initialized with endpoint: ${httpsEndpoint}`);
    }

    /**
     * Send message to a specific connection with retry logic
     * @param {string} connectionId
     * @param {object} data
     * @param {number} retryCount
     */
    async sendToConnection(connectionId, data, retryCount = 0) {
        if (!this.apiGatewayManagementApi) {
            this.initializeClient();
        }

        if (!this.apiGatewayManagementApi) {
            console.warn('⚠️  Cannot send message: WebSocket not initialized');
            return false;
        }

        const params = {
            ConnectionId: connectionId,
            Data: JSON.stringify(data)
        };

        try {
            await this.apiGatewayManagementApi.postToConnection(params).promise();
            this.metrics.messagesSent++;
            return true;
        } catch (error) {
            // Handle stale connections (410 Gone)
            if (error.statusCode === 410) {
                console.log(`🗑️  Removing stale connection: ${connectionId}`);
                await connectionManager.removeConnection(connectionId);
                this.metrics.staleConnectionsRemoved++;
                return false;
            }

            // Handle rate limiting (429 Too Many Requests)
            if (error.statusCode === 429 && retryCount < this.maxRetries) {
                const delay = this.retryDelay * Math.pow(2, retryCount); // Exponential backoff
                console.log(`⏳ Rate limited, retrying in ${delay}ms... (attempt ${retryCount + 1}/${this.maxRetries})`);
                await this.sleep(delay);
                return this.sendToConnection(connectionId, data, retryCount + 1);
            }

            // Handle temporary errors
            if ((error.statusCode >= 500 || error.code === 'NetworkingError') && retryCount < this.maxRetries) {
                const delay = this.retryDelay * Math.pow(2, retryCount);
                console.log(`⏳ Temporary error, retrying in ${delay}ms... (attempt ${retryCount + 1}/${this.maxRetries})`);
                await this.sleep(delay);
                return this.sendToConnection(connectionId, data, retryCount + 1);
            }

            console.error(`❌ Error sending to connection ${connectionId}:`, error.message);
            this.metrics.messagesFailed++;
            return false;
        }
    }

    /**
     * Batch send messages to multiple connections (optimized)
     * @param {Array} connectionIds
     * @param {object} data
     * @param {number} batchSize - Number of concurrent sends
     */
    async sendToConnections(connectionIds, data, batchSize = 10) {
        const results = [];

        // Process in batches to avoid overwhelming API Gateway
        for (let i = 0; i < connectionIds.length; i += batchSize) {
            const batch = connectionIds.slice(i, i + batchSize);
            const batchPromises = batch.map(id =>
                this.sendToConnection(id, data).catch(err => {
                    console.error(`Batch send error for ${id}:`, err.message);
                    return false;
                })
            );

            const batchResults = await Promise.allSettled(batchPromises);
            results.push(...batchResults);
        }

        const successCount = results.filter(r => r.status === 'fulfilled' && r.value).length;
        return successCount;
    }

    /**
     * Send message to a specific user (all their connections)
     * @param {string} userId
     * @param {string} event
     * @param {object} data
     */
    async sendToUser(userId, event, data) {
        try {
            const connections = await connectionManager.getUserConnections(userId);

            if (connections.length === 0) {
                console.log(`⚠️  No connections found for user ${userId}`);
                return 0;
            }

            const message = {
                event,
                data,
                timestamp: new Date().toISOString()
            };

            const connectionIds = connections.map(conn => conn.connectionId);
            const successCount = await this.sendToConnections(connectionIds, message);

            console.log(`📤 Sent to user ${userId}: ${successCount}/${connections.length} connections`);
            return successCount;
        } catch (error) {
            console.error(`❌ Error sending to user ${userId}:`, error);
            return 0;
        }
    }

    /**
     * Send message to a room/channel (optimized with caching)
     * @param {string} room
     * @param {string} event
     * @param {object} data
     */
    async sendToRoom(room, event, data) {
        try {
            const connections = await connectionManager.getRoomConnections(room);

            if (connections.length === 0) {
                console.log(`⚠️  No connections in room ${room}`);
                return 0;
            }

            const message = {
                event,
                data,
                timestamp: new Date().toISOString()
            };

            const connectionIds = connections.map(conn => conn.connectionId);
            const successCount = await this.sendToConnections(connectionIds, message);

            console.log(`📤 Sent to room ${room}: ${successCount}/${connections.length} connections`);
            return successCount;
        } catch (error) {
            console.error(`❌ Error sending to room ${room}:`, error);
            return 0;
        }
    }

    /**
     * Broadcast to all connections (use sparingly)
     * @param {string} event
     * @param {object} data
     */
    async broadcast(event, data) {
        try {
            const connections = await connectionManager.getAllConnections();

            if (connections.length === 0) {
                console.log(`⚠️  No active connections for broadcast`);
                return 0;
            }

            const message = {
                event,
                data,
                timestamp: new Date().toISOString()
            };

            const connectionIds = connections.map(conn => conn.connectionId);
            const successCount = await this.sendToConnections(connectionIds, message, 20); // Larger batch for broadcast

            console.log(`📢 Broadcast: ${successCount}/${connections.length} connections`);
            return successCount;
        } catch (error) {
            console.error(`❌ Error broadcasting:`, error);
            return 0;
        }
    }

    /**
     * Send to all admin users
     * @param {string} event
     * @param {object} data
     */
    async sendToAdmins(event, data) {
        try {
            const connections = await connectionManager.getAdminConnections();

            if (connections.length === 0) {
                console.log(`⚠️  No admin connections found`);
                return 0;
            }

            const message = {
                event,
                data,
                timestamp: new Date().toISOString()
            };

            const connectionIds = connections.map(conn => conn.connectionId);
            const successCount = await this.sendToConnections(connectionIds, message);

            console.log(`📤 Sent to admins: ${successCount}/${connections.length} connections`);
            return successCount;
        } catch (error) {
            console.error(`❌ Error sending to admins:`, error);
            return 0;
        }
    }

    // ===== DASHBOARD EVENTS =====

    /**
     * Notify user dashboard update
     * @param {string} userId
     * @param {object} updateData
     */
    async notifyUserDashboard(userId, updateData) {
        return this.sendToRoom(`dashboard_user_${userId}`, 'dashboard:update', updateData);
    }

    /**
     * Notify admin dashboard update
     * @param {object} updateData
     */
    async notifyAdminDashboard(updateData) {
        return this.sendToRoom('dashboard_admin', 'dashboard:update', updateData);
    }

    /**
     * Notify all dashboards
     * @param {object} updateData
     */
    async notifyAllDashboards(updateData) {
        const adminResult = await this.notifyAdminDashboard(updateData);
        console.log(`📊 Notified all dashboards`);
        return adminResult;
    }

    // ===== CHAT EVENTS =====

    /**
     * Notify chat room
     * @param {string} roomId
     * @param {string} event
     * @param {object} data
     */
    async notifyChatRoom(roomId, event, data) {
        return this.sendToRoom(`chat_room_${roomId}`, event, data);
    }

    // ===== ORDER EVENTS =====

    /**
     * Notify order delivered
     * @param {string} buyerId
     * @param {object} orderData
     */
    async notifyOrderDelivered(buyerId, orderData) {
        return this.sendToUser(buyerId, 'order_delivered', orderData);
    }

    /**
     * Notify new sale
     * @param {string} sellerId
     * @param {object} saleData
     */
    async notifyNewSale(sellerId, saleData) {
        return this.sendToUser(sellerId, 'new_sale', saleData);
    }

    // ===== UTILITY METHODS =====

    /**
     * Sleep utility for retry delays
     * @param {number} ms
     */
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * Get service metrics
     */
    getMetrics() {
        return {
            ...this.metrics,
            successRate: this.metrics.messagesSent > 0
                ? ((this.metrics.messagesSent / (this.metrics.messagesSent + this.metrics.messagesFailed)) * 100).toFixed(2) + '%'
                : 'N/A'
        };
    }

    /**
     * Reset metrics
     */
    resetMetrics() {
        this.metrics = {
            messagesSent: 0,
            messagesFailed: 0,
            staleConnectionsRemoved: 0
        };
    }

    /**
     * Health check
     */
    isHealthy() {
        return this.apiGatewayManagementApi !== null && this.endpoint !== null;
    }
}

// Export singleton instance
const websocketService = new WebSocketService();

// Initialize on module load if endpoint is available
if (process.env.WEBSOCKET_API_ENDPOINT) {
    websocketService.initializeClient();
}

module.exports = websocketService;