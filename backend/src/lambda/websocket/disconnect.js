const connectionManager = require('../../services/websocket/connectionManager');

/**
 * Lambda handler for WebSocket $disconnect route
 * Removes WebSocket connection from DynamoDB
 */
exports.handler = async (event) => {
    console.log('🔌 WebSocket Disconnect Event:', JSON.stringify(event, null, 2));

    const connectionId = event.requestContext.connectionId;

    try {
        // Get connection details before removing
        const connection = await connectionManager.getConnection(connectionId);

        // Remove connection from DynamoDB
        await connectionManager.removeConnection(connectionId);

        if (connection) {
            console.log(`✅ WebSocket disconnected: ${connectionId} (user: ${connection.userId})`);
        } else {
            console.log(`✅ WebSocket disconnected: ${connectionId} (connection not found)`);
        }

        return {
            statusCode: 200,
            body: JSON.stringify({ message: 'Disconnected successfully' })
        };

    } catch (error) {
        console.error('❌ Disconnect error:', error);

        return {
            statusCode: 500,
            body: JSON.stringify({ message: 'Internal server error' })
        };
    }
};
