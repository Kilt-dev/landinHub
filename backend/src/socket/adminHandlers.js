const ChatRoom = require('../models/ChatRoom');
const ChatMessage = require('../models/ChatMessage');
const { createNotification } = require('../controllers/notificationController');

/**
 * Initialize admin chat handlers
 * These handlers are only for admin users
 */
function initAdminHandlers(io, socket) {
    const userId = socket.userId;

    // Verify user is admin (you should have an isAdmin check in your User model)
    // For now, we'll assume if they connect to admin namespace, they're authorized

    console.log(`👨‍💼 Admin ${userId} connected`);

    // Join admin room for notifications
    socket.join('admin_room');

    /**
     * Get all pending support requests
     */
    socket.on('get_pending_rooms', async () => {
        try {
            const rooms = await ChatRoom.find({
                status: 'open'
            })
                .populate('user_id', 'name email')
                .sort({ priority: -1, last_message_at: -1 })
                .limit(50)
                .lean();

            socket.emit('pending_rooms', {
                rooms
            });
        } catch (error) {
            console.error('Error fetching pending rooms:', error);
            socket.emit('error', {
                message: 'Không thể tải danh sách hỗ trợ'
            });
        }
    });

    /**
     * Get all active rooms assigned to this admin
     */
    socket.on('get_my_rooms', async () => {
        try {
            const rooms = await ChatRoom.find({
                admin_id: userId,
                status: { $in: ['assigned', 'open'] }
            })
                .populate('user_id', 'name email')
                .sort({ last_message_at: -1 })
                .lean();

            socket.emit('my_rooms', {
                rooms
            });
        } catch (error) {
            console.error('Error fetching admin rooms:', error);
            socket.emit('error', {
                message: 'Không thể tải danh sách chat'
            });
        }
    });

    /**
     * Assign a room to this admin
     */
    socket.on('assign_room', async (data) => {
        try {
            const { roomId } = data;

            const room = await ChatRoom.findByIdAndUpdate(
                roomId,
                {
                    admin_id: userId,
                    status: 'assigned',
                    ai_enabled: false // Disable AI when admin takes over
                },
                { new: true }
            ).populate('user_id', 'name email');

            if (!room) {
                return socket.emit('error', {
                    message: 'Không tìm thấy phòng chat'
                });
            }

            // Join the chat room
            socket.join(`chat_${roomId}`);

            // Send system message
            const systemMsg = new ChatMessage({
                room_id: roomId,
                sender_type: 'bot',
                message_type: 'system',
                message: `Admin đã tham gia chat. Bạn sẽ được hỗ trợ trực tiếp! 👨‍💼`
            });
            await systemMsg.save();

            // Send notification to user
            await createNotification(
                room.user_id._id,
                'admin_joined_chat',
                'Admin đã tham gia chat',
                'Bạn sẽ được hỗ trợ trực tiếp bởi admin',
                { roomId, adminId: userId }
            );

            // Notify user via Socket.IO
            io.to(`user_${room.user_id._id}`).emit('admin_joined', {
                room_id: roomId,
                admin_id: userId,
                admin_name: 'Admin',
                status: 'assigned'
            });

            // Also notify the chat room
            io.to(`chat_${roomId}`).emit('admin_joined', {
                room_id: roomId,
                admin_id: userId,
                admin_name: 'Admin',
                status: 'assigned'
            });

            // Broadcast system message
            io.to(`chat_${roomId}`).emit('new_message', {
                id: systemMsg._id,
                sender_type: 'bot',
                message_type: 'system',
                message: systemMsg.message,
                created_at: systemMsg.createdAt
            });

            // Confirm to admin
            socket.emit('room_assigned', {
                room
            });

            // Notify other admins
            socket.to('admin_room').emit('room_taken', {
                roomId,
                takenBy: userId
            });

            console.log(`✅ Admin ${userId} assigned to room ${roomId}`);
        } catch (error) {
            console.error('Error assigning room:', error);
            socket.emit('error', {
                message: 'Không thể nhận phòng chat'
            });
        }
    });

    /**
     * Close/resolve a room
     */
    socket.on('resolve_room', async (data) => {
        try {
            const { roomId, notes } = data;

            const room = await ChatRoom.findOne({
                _id: roomId,
                admin_id: userId
            });

            if (!room) {
                return socket.emit('error', {
                    message: 'Không tìm thấy phòng chat'
                });
            }

            room.status = 'resolved';
            room.resolved_at = new Date();
            if (notes) {
                room.context = { ...room.context, admin_notes: notes };
            }
            await room.save();

            // Send closing message
            const closeMsg = new ChatMessage({
                room_id: roomId,
                sender_type: 'bot',
                message_type: 'system',
                message: 'Chat đã được giải quyết. Cảm ơn bạn đã liên hệ! 🙏'
            });
            await closeMsg.save();

            // Notify user
            io.to(`chat_${roomId}`).emit('chat_resolved', {
                room_id: roomId,
                message: closeMsg.message
            });

            // Broadcast system message
            io.to(`chat_${roomId}`).emit('new_message', {
                id: closeMsg._id,
                sender_type: 'bot',
                message_type: 'system',
                message: closeMsg.message,
                created_at: closeMsg.createdAt
            });

            socket.emit('room_resolved', {
                roomId
            });

            console.log(`✅ Room ${roomId} resolved by admin ${userId}`);
        } catch (error) {
            console.error('Error resolving room:', error);
            socket.emit('error', {
                message: 'Không thể đóng chat'
            });
        }
    });

    /**
     * Transfer room to another admin
     */
    socket.on('transfer_room', async (data) => {
        try {
            const { roomId, targetAdminId } = data;

            const room = await ChatRoom.findOne({
                _id: roomId,
                admin_id: userId
            });

            if (!room) {
                return socket.emit('error', {
                    message: 'Không tìm thấy phòng chat'
                });
            }

            room.admin_id = targetAdminId;
            await room.save();

            // Send system message
            const transferMsg = new ChatMessage({
                room_id: roomId,
                sender_type: 'bot',
                message_type: 'system',
                message: `Chat đã được chuyển cho admin khác.`
            });
            await transferMsg.save();

            // Notify all parties
            io.to(`chat_${roomId}`).emit('new_message', {
                id: transferMsg._id,
                sender_type: 'bot',
                message_type: 'system',
                message: transferMsg.message,
                created_at: transferMsg.createdAt
            });

            io.to(`user_${targetAdminId}`).emit('room_transferred_to_you', {
                roomId
            });

            socket.emit('room_transferred', {
                roomId,
                to: targetAdminId
            });

            console.log(`✅ Room ${roomId} transferred from ${userId} to ${targetAdminId}`);
        } catch (error) {
            console.error('Error transferring room:', error);
            socket.emit('error', {
                message: 'Không thể chuyển chat'
            });
        }
    });

    /**
     * Get room statistics
     */
    socket.on('get_stats', async () => {
        try {
            const stats = await ChatRoom.aggregate([
                {
                    $group: {
                        _id: '$status',
                        count: { $sum: 1 }
                    }
                }
            ]);

            const myActiveRooms = await ChatRoom.countDocuments({
                admin_id: userId,
                status: 'assigned'
            });

            const avgResponseTime = await ChatMessage.aggregate([
                {
                    $match: {
                        sender_type: 'admin',
                        createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } // Last 24h
                    }
                },
                {
                    $group: {
                        _id: null,
                        avgTime: { $avg: '$ai_metadata.response_time' }
                    }
                }
            ]);

            socket.emit('admin_stats', {
                roomsByStatus: stats.reduce((acc, s) => {
                    acc[s._id] = s.count;
                    return acc;
                }, {}),
                myActiveRooms,
                avgResponseTime: avgResponseTime[0]?.avgTime || 0
            });
        } catch (error) {
            console.error('Error fetching stats:', error);
            socket.emit('error', {
                message: 'Không thể tải thống kê'
            });
        }
    });

    /**
     * Disconnect
     */
    socket.on('disconnect', () => {
        console.log(`Admin ${userId} disconnected`);
    });
}

module.exports = initAdminHandlers;