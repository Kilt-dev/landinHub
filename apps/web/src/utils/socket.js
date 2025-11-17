import { io } from 'socket.io-client';

let socket = null;

/**
 * Initialize Socket.IO connection
 */
export const initSocket = () => {
    if (socket && socket.connected) {
        return socket;
    }

    const token = localStorage.getItem('token');
    if (!token) {
        console.warn('No token found for socket connection');
        return null;
    }

    const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000';

    socket = io(apiUrl, {
        auth: {
            token: token
        },
        transports: ['websocket', 'polling']
    });

    socket.on('connect', () => {
        console.log('✅ Socket connected:', socket.id);
    });

    socket.on('disconnect', () => {
        console.log('❌ Socket disconnected');
    });

    socket.on('connect_error', (error) => {
        console.error('Socket connection error:', error);
    });

    return socket;
};

/**
 * Get the current socket instance
 */
export const getSocket = () => {
    return socket;
};

/**
 * Disconnect socket
 */
export const disconnectSocket = () => {
    if (socket) {
        socket.disconnect();
        socket = null;
    }
};

/**
 * Join dashboard room
 */
export const joinDashboard = () => {
    if (!socket || !socket.connected) {
        console.warn('Socket not connected, cannot join dashboard');
        return;
    }

    socket.emit('dashboard:join');
    console.log('📊 Joining dashboard room...');
};

/**
 * Leave dashboard room
 */
export const leaveDashboard = () => {
    if (!socket || !socket.connected) {
        return;
    }

    socket.emit('dashboard:leave');
    console.log('📊 Leaving dashboard room');
};

/**
 * Listen for dashboard updates
 * @param {Function} callback - Callback function to handle updates
 * @returns {Function} - Cleanup function to remove listener
 */
export const onDashboardUpdate = (callback) => {
    if (!socket) {
        console.warn('Socket not initialized');
        return () => {};
    }

    socket.on('dashboard:update', callback);

    // Return cleanup function
    return () => {
        socket.off('dashboard:update', callback);
    };
};

export default {
    initSocket,
    getSocket,
    disconnectSocket,
    joinDashboard,
    leaveDashboard,
    onDashboardUpdate
};
