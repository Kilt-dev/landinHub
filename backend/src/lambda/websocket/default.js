const connectionManager = require('../../services/websocket/connectionManager');
const websocketService = require('../../services/websocket/websocketService');

/**
 * Lambda handler for WebSocket $default route
 * Handles custom actions/messages from clients
 */
exports.handler = async (event) => {
    console.log('📨 WebSocket Default Event:', JSON.stringify(event, null, 2));

    const connectionId = event.requestContext.connectionId;
    const body = JSON.parse(event.body || '{}');
    const action = body.action;

    // Initialize WebSocket service with current endpoint
    const domainName = event.requestContext.domainName;
    const stage = event.requestContext.stage;
    const endpoint = `https://${domainName}/${stage}`;
    websocketService.initializeClient(endpoint);

    try {
        // Get connection details
        const connection = await connectionManager.getConnection(connectionId);

        if (!connection) {
            console.error('❌ Connection not found:', connectionId);
            return {
                statusCode: 404,
                body: JSON.stringify({ message: 'Connection not found' })
            };
        }

        const userId = connection.userId;
        const userRole = connection.userRole;

        // Handle different actions
        switch (action) {
            case 'dashboard:join':
                await handleDashboardJoin(connectionId, userId, userRole);
                break;

            case 'dashboard:leave':
                await handleDashboardLeave(connectionId, userId, userRole);
                break;

            case 'dashboard:refresh':
                await handleDashboardRefresh(connectionId, userRole);
                break;

            case 'chat:join_room':
                await handleChatJoinRoom(connectionId, userId, body.roomId);
                break;

            case 'chat:leave_room':
                await handleChatLeaveRoom(connectionId, body.roomId);
                break;

            case 'ping':
                // Simple ping/pong for keepalive
                await websocketService.sendToConnection(connectionId, {
                    event: 'pong',
                    data: { timestamp: new Date().toISOString() }
                });
                break;

            default:
                console.log(`⚠️  Unknown action: ${action}`);
                await websocketService.sendToConnection(connectionId, {
                    event: 'error',
                    data: { message: 'Unknown action' }
                });
        }

        return {
            statusCode: 200,
            body: JSON.stringify({ message: 'Action processed' })
        };

    } catch (error) {
        console.error('❌ Default handler error:', error);

        return {
            statusCode: 500,
            body: JSON.stringify({ message: 'Internal server error' })
        };
    }
};

/**
 * Handle dashboard join
 */
async function handleDashboardJoin(connectionId, userId, userRole) {
    if (userRole === 'admin') {
        await connectionManager.joinRoom(connectionId, 'dashboard_admin');
        console.log(`📊 Admin ${userId} joined dashboard room`);
    } else {
        await connectionManager.joinRoom(connectionId, `dashboard_user_${userId}`);
        console.log(`📊 User ${userId} joined personal dashboard room`);
    }

    await websocketService.sendToConnection(connectionId, {
        event: 'dashboard:joined',
        data: { success: true, userRole }
    });
}

/**
 * Handle dashboard leave
 */
async function handleDashboardLeave(connectionId, userId, userRole) {
    if (userRole === 'admin') {
        await connectionManager.leaveRoom(connectionId, 'dashboard_admin');
    } else {
        await connectionManager.leaveRoom(connectionId, `dashboard_user_${userId}`);
    }

    console.log(`📊 User ${userId} left dashboard room`);
}

/**
 * Handle dashboard refresh request
 */
async function handleDashboardRefresh(connectionId, userRole) {
    await websocketService.sendToConnection(connectionId, {
        event: 'dashboard:refresh_data',
        data: { type: userRole === 'admin' ? 'admin' : 'user' }
    });
}

/**
 * Handle chat room join
 */
async function handleChatJoinRoom(connectionId, userId, roomId) {
    if (!roomId) {
        await websocketService.sendToConnection(connectionId, {
            event: 'chat:error',
            data: { message: 'Room ID required' }
        });
        return;
    }

    await connectionManager.joinRoom(connectionId, `chat_room_${roomId}`);
    console.log(`💬 User ${userId} joined chat room ${roomId}`);

    await websocketService.sendToConnection(connectionId, {
        event: 'chat:joined_room',
        data: { roomId, success: true }
    });
}

/**
 * Handle chat room leave
 */
async function handleChatLeaveRoom(connectionId, roomId) {
    if (!roomId) {
        return;
    }

    await connectionManager.leaveRoom(connectionId, `chat_room_${roomId}`);
    console.log(`💬 Connection ${connectionId} left chat room ${roomId}`);
}
