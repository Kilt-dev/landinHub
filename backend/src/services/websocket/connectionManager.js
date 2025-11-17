const AWS = require('aws-sdk');

// Initialize DynamoDB DocumentClient
const dynamodb = new AWS.DynamoDB.DocumentClient({
    region: process.env.AWS_REGION || 'ap-southeast-1'
});

const CONNECTIONS_TABLE = process.env.WEBSOCKET_CONNECTIONS_TABLE || 'websocket-connections';

/**
 * WebSocket Connection Manager using DynamoDB
 * Stores and manages WebSocket connections for serverless architecture
 */
class ConnectionManager {
    /**
     * Save a new WebSocket connection
     * @param {string} connectionId - API Gateway connection ID
     * @param {string} userId - User ID from JWT
     * @param {object} metadata - Additional connection metadata
     */
    async saveConnection(connectionId, userId, metadata = {}) {
        const params = {
            TableName: CONNECTIONS_TABLE,
            Item: {
                connectionId,
                userId,
                connectedAt: new Date().toISOString(),
                ttl: Math.floor(Date.now() / 1000) + (24 * 60 * 60), // 24 hours TTL
                ...metadata
            }
        };

        try {
            await dynamodb.put(params).promise();
            console.log(`✅ Connection saved: ${connectionId} for user ${userId}`);
            return true;
        } catch (error) {
            console.error('❌ Error saving connection:', error);
            throw error;
        }
    }

    /**
     * Remove a WebSocket connection
     * @param {string} connectionId - API Gateway connection ID
     */
    async removeConnection(connectionId) {
        const params = {
            TableName: CONNECTIONS_TABLE,
            Key: { connectionId }
        };

        try {
            await dynamodb.delete(params).promise();
            console.log(`✅ Connection removed: ${connectionId}`);
            return true;
        } catch (error) {
            console.error('❌ Error removing connection:', error);
            throw error;
        }
    }

    /**
     * Get connection by connectionId
     * @param {string} connectionId
     */
    async getConnection(connectionId) {
        const params = {
            TableName: CONNECTIONS_TABLE,
            Key: { connectionId }
        };

        try {
            const result = await dynamodb.get(params).promise();
            return result.Item || null;
        } catch (error) {
            console.error('❌ Error getting connection:', error);
            return null;
        }
    }

    /**
     * Get all connections for a specific user
     * @param {string} userId
     */
    async getUserConnections(userId) {
        const params = {
            TableName: CONNECTIONS_TABLE,
            IndexName: 'UserIdIndex',
            KeyConditionExpression: 'userId = :userId',
            ExpressionAttributeValues: {
                ':userId': userId
            }
        };

        try {
            const result = await dynamodb.query(params).promise();
            return result.Items || [];
        } catch (error) {
            console.error('❌ Error getting user connections:', error);
            return [];
        }
    }

    /**
     * Get all admin connections
     */
    async getAdminConnections() {
        const params = {
            TableName: CONNECTIONS_TABLE,
            FilterExpression: 'userRole = :role',
            ExpressionAttributeValues: {
                ':role': 'admin'
            }
        };

        try {
            const result = await dynamodb.scan(params).promise();
            return result.Items || [];
        } catch (error) {
            console.error('❌ Error getting admin connections:', error);
            return [];
        }
    }

    /**
     * Get all connections (for broadcasting)
     */
    async getAllConnections() {
        const params = {
            TableName: CONNECTIONS_TABLE
        };

        try {
            const result = await dynamodb.scan(params).promise();
            return result.Items || [];
        } catch (error) {
            console.error('❌ Error getting all connections:', error);
            return [];
        }
    }

    /**
     * Update connection metadata
     * @param {string} connectionId
     * @param {object} updates
     */
    async updateConnection(connectionId, updates) {
        // Build update expression
        const updateExpression = [];
        const expressionAttributeNames = {};
        const expressionAttributeValues = {};

        Object.keys(updates).forEach((key, index) => {
            updateExpression.push(`#attr${index} = :val${index}`);
            expressionAttributeNames[`#attr${index}`] = key;
            expressionAttributeValues[`:val${index}`] = updates[key];
        });

        const params = {
            TableName: CONNECTIONS_TABLE,
            Key: { connectionId },
            UpdateExpression: `SET ${updateExpression.join(', ')}`,
            ExpressionAttributeNames: expressionAttributeNames,
            ExpressionAttributeValues: expressionAttributeValues,
            ReturnValues: 'ALL_NEW'
        };

        try {
            const result = await dynamodb.update(params).promise();
            return result.Attributes;
        } catch (error) {
            console.error('❌ Error updating connection:', error);
            throw error;
        }
    }

    /**
     * Subscribe connection to a room/channel
     * @param {string} connectionId
     * @param {string} room - Room name (e.g., 'dashboard_admin', 'chat_room_123')
     */
    async joinRoom(connectionId, room) {
        try {
            const connection = await this.getConnection(connectionId);
            if (!connection) {
                throw new Error('Connection not found');
            }

            const rooms = connection.rooms || [];
            if (!rooms.includes(room)) {
                rooms.push(room);
                await this.updateConnection(connectionId, { rooms });
            }

            console.log(`✅ Connection ${connectionId} joined room: ${room}`);
            return true;
        } catch (error) {
            console.error('❌ Error joining room:', error);
            throw error;
        }
    }

    /**
     * Unsubscribe connection from a room
     * @param {string} connectionId
     * @param {string} room
     */
    async leaveRoom(connectionId, room) {
        try {
            const connection = await this.getConnection(connectionId);
            if (!connection) {
                return false;
            }

            const rooms = (connection.rooms || []).filter(r => r !== room);
            await this.updateConnection(connectionId, { rooms });

            console.log(`✅ Connection ${connectionId} left room: ${room}`);
            return true;
        } catch (error) {
            console.error('❌ Error leaving room:', error);
            return false;
        }
    }

    /**
     * Get all connections in a specific room
     * @param {string} room
     */
    async getRoomConnections(room) {
        const params = {
            TableName: CONNECTIONS_TABLE,
            FilterExpression: 'contains(rooms, :room)',
            ExpressionAttributeValues: {
                ':room': room
            }
        };

        try {
            const result = await dynamodb.scan(params).promise();
            return result.Items || [];
        } catch (error) {
            console.error('❌ Error getting room connections:', error);
            return [];
        }
    }
}

module.exports = new ConnectionManager();
