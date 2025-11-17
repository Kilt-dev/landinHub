const AWS = require('aws-sdk');
const connectionManager = require('./connectionManager');

/**
 * WebSocket Service for AWS API Gateway WebSocket
 * Replaces Socket.IO for serverless architecture
 */
class WebSocketService {
    constructor() {
        this.apiGatewayManagementApi = null;
        this.endpoint = process.env.WEBSOCKET_API_ENDPOINT;
    }

    /**
     * Initialize API Gateway Management API client
     * @param {string} endpoint - WebSocket API endpoint (e.g., https://xxx.execute-api.region.amazonaws.com/prod)
     */
    initializeClient(endpoint) {
        if (endpoint) {
            this.endpoint = endpoint;
        }

        if (!this.endpoint) {
            console.warn('⚠️  WebSocket endpoint not configured');
            return;
        }

        this.apiGatewayManagementApi = new AWS.ApiGatewayManagementApi({
            endpoint: this.endpoint,
            region: process.env.AWS_REGION || 'ap-southeast-1'
        });

        console.log(`✅ WebSocket client initialized with endpoint: ${this.endpoint}`);
    }

    /**
     * Send message to a specific connection
     * @param {string} connectionId
     * @param {object} data
     */
    async sendToConnection(connectionId, data) {
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
            return true;
        } catch (error) {
            if (error.statusCode === 410) {
                // Connection is stale, remove it
                console.log(`🗑️  Removing stale connection: ${connectionId}`);
                await connectionManager.removeConnection(connectionId);
            } else {
                console.error(`❌ Error sending to connection ${connectionId}:`, error);
            }
            return false;
        }
    }

    /**
     * Send message to a specific user (all their connections)
     * @param {string} userId
     * @param {string} event
     * @param {object} data
     */
    async sendToUser(userId, event, data) {
        const connections = await connectionManager.getUserConnections(userId);

        const message = {
            event,
            data,
            timestamp: new Date().toISOString()
        };

        const promises = connections.map(conn =>
            this.sendToConnection(conn.connectionId, message)
        );

        const results = await Promise.allSettled(promises);
        const successCount = results.filter(r => r.status === 'fulfilled' && r.value).length;

        console.log(`📤 Sent to user ${userId}: ${successCount}/${connections.length} connections`);
        return successCount;
    }

    /**
     * Send message to a room/channel
     * @param {string} room
     * @param {string} event
     * @param {object} data
     */
    async sendToRoom(room, event, data) {
        const connections = await connectionManager.getRoomConnections(room);

        const message = {
            event,
            data,
            timestamp: new Date().toISOString()
        };

        const promises = connections.map(conn =>
            this.sendToConnection(conn.connectionId, message)
        );

        const results = await Promise.allSettled(promises);
        const successCount = results.filter(r => r.status === 'fulfilled' && r.value).length;

        console.log(`📤 Sent to room ${room}: ${successCount}/${connections.length} connections`);
        return successCount;
    }

    /**
     * Broadcast to all connections
     * @param {string} event
     * @param {object} data
     */
    async broadcast(event, data) {
        const connections = await connectionManager.getAllConnections();

        const message = {
            event,
            data,
            timestamp: new Date().toISOString()
        };

        const promises = connections.map(conn =>
            this.sendToConnection(conn.connectionId, message)
        );

        const results = await Promise.allSettled(promises);
        const successCount = results.filter(r => r.status === 'fulfilled' && r.value).length;

        console.log(`📢 Broadcast: ${successCount}/${connections.length} connections`);
        return successCount;
    }

    /**
     * Send to all admin users
     * @param {string} event
     * @param {object} data
     */
    async sendToAdmins(event, data) {
        const connections = await connectionManager.getAdminConnections();

        const message = {
            event,
            data,
            timestamp: new Date().toISOString()
        };

        const promises = connections.map(conn =>
            this.sendToConnection(conn.connectionId, message)
        );

        const results = await Promise.allSettled(promises);
        const successCount = results.filter(r => r.status === 'fulfilled' && r.value).length;

        console.log(`📤 Sent to admins: ${successCount}/${connections.length} connections`);
        return successCount;
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
}

// Export singleton instance
const websocketService = new WebSocketService();

// Initialize on module load if endpoint is available
if (process.env.WEBSOCKET_API_ENDPOINT) {
    websocketService.initializeClient();
}

module.exports = websocketService;
