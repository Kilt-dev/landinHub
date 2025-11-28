/**
 * Native WebSocket client for AWS API Gateway WebSocket
 * Replaces Socket.IO for serverless architecture
 */

let ws = null;
let eventHandlers = {};
let reconnectAttempts = 0;
const MAX_RECONNECT_ATTEMPTS = 5;
const RECONNECT_DELAY = 3000;
let pingInterval = null;

/**
 * Initialize WebSocket connection
 * ✅ ENABLED - AWS API Gateway WebSocket deployed successfully
 */
export const initSocket = () => {
    if (ws && ws.readyState === WebSocket.OPEN) {
        return ws;
    }

    const token = localStorage.getItem('token');
    if (!token) {
        console.warn('⚠️ No token found for WebSocket connection');
        return null;
    }

    // Get WebSocket URL from environment
    const wsUrl = process.env.REACT_APP_WEBSOCKET_URL;

    // If WebSocket URL is not configured, skip WebSocket connection
    if (!wsUrl) {
        console.log('ℹ️ WebSocket URL not configured. Using REST API polling instead.');
        return null;
    }

    try {
        // Connect with token in query parameter
        ws = new WebSocket(`${wsUrl}?token=${encodeURIComponent(token)}`);

        ws.onopen = () => {
            console.log('✅ WebSocket connected');
            reconnectAttempts = 0;

            // Start ping/pong for keepalive
            startPingPong();

            // Emit connected event
            emitEvent('connect', {});
        };

        ws.onclose = () => {
            console.log('❌ WebSocket disconnected');
            stopPingPong();

            // Emit disconnected event
            emitEvent('disconnect', {});

            // Attempt to reconnect
            attemptReconnect();
        };

        ws.onerror = (error) => {
            console.error('⚠️ WebSocket error:', error);
            emitEvent('connect_error', error);
        };

        ws.onmessage = (event) => {
            try {
                const message = JSON.parse(event.data);
                console.log('📨 WebSocket message:', message);

                // Emit the event to registered handlers
                if (message.event) {
                    emitEvent(message.event, message.data);
                }
            } catch (error) {
                console.error('Error parsing WebSocket message:', error);
            }
        };

        return ws;
    } catch (error) {
        console.error('❌ Error creating WebSocket:', error);
        return null;
    }
};

/**
 * Attempt to reconnect
 */
function attemptReconnect() {
    if (reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
        console.error('Max reconnect attempts reached');
        return;
    }

    reconnectAttempts++;
    console.log(`Attempting to reconnect... (${reconnectAttempts}/${MAX_RECONNECT_ATTEMPTS})`);

    setTimeout(() => {
        initSocket();
    }, RECONNECT_DELAY);
}

/**
 * Start ping/pong for keepalive
 */
function startPingPong() {
    stopPingPong();
    pingInterval = setInterval(() => {
        if (ws && ws.readyState === WebSocket.OPEN) {
            sendMessage('ping', {});
        }
    }, 30000); // Ping every 30 seconds
}

/**
 * Stop ping/pong
 */
function stopPingPong() {
    if (pingInterval) {
        clearInterval(pingInterval);
        pingInterval = null;
    }
}

/**
 * Send message to WebSocket
 * @param {string} action
 * @param {object} data
 */
function sendMessage(action, data = {}) {
    if (!ws || ws.readyState !== WebSocket.OPEN) {
        console.warn('WebSocket not connected, cannot send message');
        return false;
    }

    ws.send(JSON.stringify({ action, ...data }));
    return true;
}

/**
 * Emit event to registered handlers
 * @param {string} event
 * @param {object} data
 */
function emitEvent(event, data) {
    if (eventHandlers[event]) {
        eventHandlers[event].forEach(handler => {
            try {
                handler(data);
            } catch (error) {
                console.error(`Error in event handler for ${event}:`, error);
            }
        });
    }
}

/**
 * Register event handler
 * @param {string} event
 * @param {Function} callback
 */
function on(event, callback) {
    if (!eventHandlers[event]) {
        eventHandlers[event] = [];
    }
    eventHandlers[event].push(callback);
}

/**
 * Remove event handler
 * @param {string} event
 * @param {Function} callback
 */
function off(event, callback) {
    if (eventHandlers[event]) {
        eventHandlers[event] = eventHandlers[event].filter(h => h !== callback);
    }
}

/**
 * Get the current WebSocket instance
 */
export const getSocket = () => {
    return ws;
};

/**
 * Disconnect WebSocket
 */
export const disconnectSocket = () => {
    stopPingPong();
    if (ws) {
        ws.close();
        ws = null;
    }
    eventHandlers = {};
};

/**
 * Join dashboard room
 */
export const joinDashboard = () => {
    sendMessage('dashboard:join');
    console.log('📊 Joining dashboard room...');
};

/**
 * Leave dashboard room
 */
export const leaveDashboard = () => {
    sendMessage('dashboard:leave');
    console.log('📊 Leaving dashboard room');
};

/**
 * Listen for dashboard updates
 * @param {Function} callback - Callback function to handle updates
 * @returns {Function} - Cleanup function to remove listener
 */
export const onDashboardUpdate = (callback) => {
    on('dashboard:update', callback);

    // Return cleanup function
    return () => {
        off('dashboard:update', callback);
    };
};

/**
 * Listen for any event
 * @param {string} event
 * @param {Function} callback
 * @returns {Function} - Cleanup function
 */
export const onEvent = (event, callback) => {
    on(event, callback);
    return () => off(event, callback);
};

/**
 * Join a chat room
 * @param {string} roomId - The chat room ID to join
 */
export const joinRoom = (roomId) => {
    if (!roomId) {
        console.warn('⚠️ Cannot join room: roomId is required');
        return;
    }

    const success = sendMessage('chat:join', { roomId });
    if (success) {
        console.log('📡 Joining room:', roomId);
    }
};

/**
 * Leave a chat room
 * @param {string} roomId - The chat room ID to leave
 */
export const leaveRoom = (roomId) => {
    if (!roomId) {
        console.warn('⚠️ Cannot leave room: roomId is required');
        return;
    }

    const success = sendMessage('chat:leave', { roomId });
    if (success) {
        console.log('📡 Leaving room:', roomId);
    }
};

/**
 * Send a chat message
 * @param {string} roomId - The chat room ID
 * @param {string} message - The message content
 * @param {string} senderType - 'user' or 'admin'
 */
export const sendChatMessage = (roomId, message, senderType = 'user') => {
    if (!roomId || !message) {
        console.warn('⚠️ Cannot send message: roomId and message are required');
        return false;
    }

    return sendMessage('chat:message', {
        roomId,
        message,
        sender_type: senderType,
        timestamp: new Date().toISOString()
    });
};

/**
 * Listen for new chat messages
 * @param {Function} callback - Callback function to handle new messages
 * @returns {Function} - Cleanup function
 */
export const onChatMessage = (callback) => {
    on('chat:message', callback);
    return () => off('chat:message', callback);
};

/**
 * Listen for room updates
 * @param {Function} callback - Callback function to handle room updates
 * @returns {Function} - Cleanup function
 */
export const onRoomUpdate = (callback) => {
    on('chat:room_update', callback);
    return () => off('chat:room_update', callback);
};

export default {
    initSocket,
    getSocket,
    disconnectSocket,
    joinDashboard,
    leaveDashboard,
    onDashboardUpdate,
    onEvent,
    joinRoom,
    leaveRoom,
    sendChatMessage,
    onChatMessage,
    onRoomUpdate
};
