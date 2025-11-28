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
        console.log('⚠️ WebSocket already connected');
        return ws;
    }

    const token = localStorage.getItem('token');
    if (!token) {
        console.warn('⚠️ No token found for WebSocket connection');
        emitEvent('connect_error', { message: 'No authentication token' });
        return null;
    }

    const wsUrl = process.env.REACT_APP_WEBSOCKET_URL;

    if (!wsUrl) {
        console.log('ℹ️ WebSocket URL not configured. Using REST API polling instead.');
        emitEvent('not_configured', { message: 'WebSocket URL not configured' });
        return null;
    }

    try {
        // Connect with token in query parameter
        ws = new WebSocket(`${wsUrl}?token=${encodeURIComponent(token)}`);

        ws.onopen = () => {
            console.log('✅ WebSocket connected');
            reconnectAttempts = 0;
            startPingPong();
            emitEvent('connected', { status: 'connected' });
        };

        ws.onclose = (event) => {
            console.log('❌ WebSocket disconnected:', event.code, event.reason);
            stopPingPong();
            emitEvent('disconnected', { code: event.code, reason: event.reason });

            // Don't reconnect if closed intentionally (code 1000)
            if (event.code !== 1000) {
                attemptReconnect();
            }
        };

        ws.onerror = (error) => {
            console.error('⚠️ WebSocket error:', error);
            emitEvent('error', { message: 'WebSocket error', error });
        };

        ws.onmessage = (event) => {
            try {
                const message = JSON.parse(event.data);
                console.log('📨 WebSocket message:', message.event || message.action || 'unknown');

                // Handle both event formats: {event, data} or {action, ...data}
                const eventName = message.event || message.action || 'message';
                const data = message.data || message;

                emitEvent(eventName, data);
            } catch (error) {
                console.error('❌ Error parsing WebSocket message:', error);
                emitEvent('parse_error', { message: 'Failed to parse message', error });
            }
        };

        return ws;
    } catch (error) {
        console.error('❌ Error creating WebSocket:', error);
        emitEvent('error', { message: 'Failed to create WebSocket', error });
        return null;
    }
};

/**
 * Attempt to reconnect
 */
function attemptReconnect() {
    if (reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
        console.error('❌ Max reconnect attempts reached');
        emitEvent('reconnect_failed', { attempts: reconnectAttempts });
        return;
    }

    reconnectAttempts++;
    console.log(`🔄 Reconnecting... (${reconnectAttempts}/${MAX_RECONNECT_ATTEMPTS})`);

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
    }, 30000);
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
 * @param {string} action - Action name (e.g., 'join_room', 'chat:message')
 * @param {object} data - Data payload
 */
export function sendMessage(action, data = {}) {
    if (!ws || ws.readyState !== WebSocket.OPEN) {
        console.warn('⚠️ WebSocket not connected, cannot send message');
        emitEvent('send_error', { message: 'WebSocket not connected' });
        return false;
    }

    try {
        ws.send(JSON.stringify({ action, ...data }));
        return true;
    } catch (error) {
        console.error('❌ Error sending WebSocket message:', error);
        emitEvent('send_error', { message: 'Failed to send message', error });
        return false;
    }
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
                console.error(`❌ Error in event handler for ${event}:`, error);
            }
        });
    }
}

/**
 * Register event handler
 * @param {string} event
 * @param {Function} callback
 * @returns {Function} Cleanup function
 */
export function on(event, callback) {
    if (!eventHandlers[event]) {
        eventHandlers[event] = new Set();
    }
    eventHandlers[event].add(callback);

    // Return cleanup function
    return () => off(event, callback);
}

/**
 * Remove event handler
 * @param {string} event
 * @param {Function} callback
 */
export function off(event, callback) {
    if (eventHandlers[event]) {
        eventHandlers[event].delete(callback);
        if (eventHandlers[event].size === 0) {
            delete eventHandlers[event];
        }
    }
}

/**
 * Get the current WebSocket instance
 */
export const getSocket = () => ws;

/**
 * Disconnect WebSocket
 * @param {boolean} silent - Don't trigger reconnect
 */
export const disconnectSocket = (silent = false) => {
    stopPingPong();
    if (ws) {
        if (silent) {
            // Remove close handler temporarily to prevent reconnect
            ws.onclose = null;
        }
        ws.close(1000, 'User disconnected');
        ws = null;
    }
    reconnectAttempts = 0;
};

/**
 * Join a specific room
 * @param {string} roomId - Room identifier
 */
export const joinRoom = (roomId) => {
    console.log(`📡 Joining room: ${roomId}`);
    return sendMessage('join_room', { roomId });
};

/**
 * Leave a specific room
 * @param {string} roomId - Room identifier
 */
export const leaveRoom = (roomId) => {
    console.log(`📡 Leaving room: ${roomId}`);
    return sendMessage('leave_room', { roomId });
};

/**
 * Join dashboard room
 */
export const joinDashboard = () => {
    return sendMessage('dashboard:join');
};

/**
 * Leave dashboard room
 */
export const leaveDashboard = () => {
    return sendMessage('dashboard:leave');
};

/**
 * Listen for dashboard updates
 * @param {Function} callback - Callback function to handle updates
 * @returns {Function} - Cleanup function to remove listener
 */
export const onDashboardUpdate = (callback) => {
    return on('dashboard:update', callback);
};

/**
 * Listen for chat updates
 * @param {Function} callback
 * @returns {Function} - Cleanup function
 */
export const onChatUpdate = (callback) => {
    return on('chat:update', callback);
};

/**
 * Listen for room updates
 * @param {Function} callback
 * @returns {Function} - Cleanup function
 */
export const onRoomUpdate = (callback) => {
    return on('room:update', callback);
};

/**
 * Listen for admin status changes
 * @param {Function} callback
 * @returns {Function} - Cleanup function
 */
export const onAdminStatus = (callback) => {
    return on('admin:status', callback);
};

/**
 * Get WebSocket status
 */
export const getStatus = () => ({
    isConnected: ws && ws.readyState === WebSocket.OPEN,
    isConnecting: ws && ws.readyState === WebSocket.CONNECTING,
    reconnectAttempts,
    isConfigured: !!process.env.REACT_APP_WEBSOCKET_URL
});

// Export default object for compatibility
export default {
    initSocket,
    getSocket,
    disconnectSocket,
    sendMessage,
    joinRoom,
    leaveRoom,
    joinDashboard,
    leaveDashboard,
    onDashboardUpdate,
    onChatUpdate,
    onRoomUpdate,
    onAdminStatus,
    on,
    off,
    getStatus
};