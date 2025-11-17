const User = require('../models/User');

/**
 * Dashboard Real-time Socket Handler
 * Handles real-time updates for admin and user dashboards
 */

module.exports = (io) => {
    io.on('connection', (socket) => {
        const userId = socket.userId;

        // ===== DASHBOARD EVENTS =====

        // Join dashboard room (for receiving dashboard updates)
        socket.on('dashboard:join', async () => {
            try {
                const user = await User.findById(userId);

                if (user.role === 'admin') {
                    socket.join('dashboard_admin');
                    console.log(`📊 Admin ${userId} joined dashboard room`);
                } else {
                    socket.join(`dashboard_user_${userId}`);
                    console.log(`📊 User ${userId} joined personal dashboard room`);
                }

                socket.emit('dashboard:joined', { success: true });
            } catch (error) {
                console.error('Dashboard join error:', error);
                socket.emit('dashboard:error', { message: 'Không thể tham gia dashboard' });
            }
        });

        // Leave dashboard room
        socket.on('dashboard:leave', () => {
            socket.leave('dashboard_admin');
            socket.leave(`dashboard_user_${userId}`);
            console.log(`📊 User ${userId} left dashboard room`);
        });

        // Request immediate dashboard refresh
        socket.on('dashboard:refresh', async () => {
            try {
                const user = await User.findById(userId);

                // Emit refresh event to trigger frontend to fetch new data
                if (user.role === 'admin') {
                    socket.emit('dashboard:refresh_data', { type: 'admin' });
                } else {
                    socket.emit('dashboard:refresh_data', { type: 'user' });
                }
            } catch (error) {
                console.error('Dashboard refresh error:', error);
            }
        });
    });
};

/**
 * Helper functions to emit dashboard updates from controllers
 */

// Notify all admins of data change
function notifyAdminDashboard(event, data) {
    if (global._io) {
        global._io.to('dashboard_admin').emit(event, data);
        console.log(`📊 Emitted ${event} to admin dashboard`);
    }
}

// Notify specific user's dashboard
function notifyUserDashboard(userId, event, data) {
    if (global._io) {
        global._io.to(`dashboard_user_${userId}`).emit(event, data);
        console.log(`📊 Emitted ${event} to user ${userId} dashboard`);
    }
}

// Notify both user and admin dashboards
function notifyAllDashboards(event, data) {
    if (global._io) {
        global._io.to('dashboard_admin').emit(event, data);
        console.log(`📊 Emitted ${event} to all dashboards`);
    }
}

module.exports.notifyAdminDashboard = notifyAdminDashboard;
module.exports.notifyUserDashboard = notifyUserDashboard;
module.exports.notifyAllDashboards = notifyAllDashboards;
