const jwt = require('jsonwebtoken');
const connectionManager = require('../../services/websocket/connectionManager');

/**
 * Lambda handler for WebSocket $connect route
 * Authenticates and saves new WebSocket connections
 */
exports.handler = async (event) => {
    console.log('🔌 WebSocket Connect Event:', JSON.stringify(event, null, 2));

    const connectionId = event.requestContext.connectionId;
    const queryParams = event.queryStringParameters || {};
    const token = queryParams.token;

    // Validate token
    if (!token) {
        console.error('❌ No token provided');
        return {
            statusCode: 401,
            body: JSON.stringify({ message: 'Unauthorized: No token provided' })
        };
    }

    try {
        // Verify JWT token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const userId = decoded.userId || decoded.id;

        if (!userId) {
            console.error('❌ Invalid token: No userId');
            return {
                statusCode: 401,
                body: JSON.stringify({ message: 'Unauthorized: Invalid token' })
            };
        }

        // Get user role (you might want to fetch this from database)
        const userRole = decoded.role || 'user';

        // Save connection to DynamoDB
        await connectionManager.saveConnection(connectionId, userId, {
            userRole,
            userName: decoded.name,
            userEmail: decoded.email
        });

        console.log(`✅ WebSocket connected: ${connectionId} for user ${userId} (${userRole})`);

        return {
            statusCode: 200,
            body: JSON.stringify({ message: 'Connected successfully' })
        };

    } catch (error) {
        console.error('❌ Connection error:', error);

        if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
            return {
                statusCode: 401,
                body: JSON.stringify({ message: 'Unauthorized: Invalid or expired token' })
            };
        }

        return {
            statusCode: 500,
            body: JSON.stringify({ message: 'Internal server error' })
        };
    }
};
