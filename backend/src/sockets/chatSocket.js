const ChatRoom = require('../models/ChatRoom');
const ChatMessage = require('../models/ChatMessage');
const User = require('../models/User');
const { detectIntentAndRespond } = require('../services/aiResponseService');
const emailService = require('../services/emailService');

// Track online users with timestamps for cleanup
const onlineUsers = new Map(); // userId -> { socketId, lastSeen }
const typingUsers = new Map(); // roomId -> Set of userIds

// Periodic cleanup of stale entries (every 5 minutes)
setInterval(() => {
    const now = Date.now();
    const STALE_THRESHOLD = 10 * 60 * 1000; // 10 minutes

    let cleanedCount = 0;
    for (const [userId, data] of onlineUsers.entries()) {
        if (now - data.lastSeen > STALE_THRESHOLD) {
            onlineUsers.delete(userId);
            cleanedCount++;
        }
    }

    if (cleanedCount > 0) {
        console.log(`🧹 Cleaned up ${cleanedCount} stale entries from onlineUsers`);
    }
}, 5 * 60 * 1000); // Run every 5 minutes

// Note: detectIntentAndRespond is now imported from aiResponseService

// Notify room participants
const notifyRoom = (io, roomId, event, data) => {
    io.to(`chat_room_${roomId}`).emit(event, data);
};

// Notify specific user
const notifyUser = (io, userId, event, data) => {
    io.to(`user_${userId}`).emit(event, data);
};

// Get admin online status
const getAdminOnlineStatus = async () => {
    const admins = await User.find({ role: 'admin' });
    console.log('🔍 Checking admin status. Online users:', Array.from(onlineUsers.keys()));

    return admins.map(admin => {
        const adminIdStr = admin._id.toString();
        const userData = onlineUsers.get(adminIdStr);
        const isOnline = !!userData;
        console.log(`👤 Admin ${admin.name} (${adminIdStr}): ${isOnline ? 'ONLINE' : 'OFFLINE'}`);

        return {
            id: admin._id,
            name: admin.name,
            isOnline
        };
    });
};

/**
 * 🧠 SMART AI: Decide if should escalate to admin
 * Returns true if:
 * - AI confidence is low
 * - User explicitly asks for human
 * - Complex/urgent keywords detected
 * - Payment/refund issues
 */
const shouldEscalateToAdmin = (aiResult, userMessage) => {
    const message = userMessage.toLowerCase();

    // 1. Urgent keywords → Need admin immediately
    const urgentKeywords = [
        'lỗi', 'error', 'không hoạt động', 'bug', 'hack',
        'mất tiền', 'hoàn tiền', 'refund', 'complaint', 'khiếu nại',
        'urgent', 'gấp', 'khẩn cấp'
    ];
    if (urgentKeywords.some(keyword => message.includes(keyword))) {
        console.log('🚨 Urgent keywords detected → Escalate to admin');
        return true;
    }

    // 2. User explicitly asks for human
    const humanRequestKeywords = [
        'admin', 'người thật', 'human', 'nhân viên', 'hỗ trợ trực tiếp',
        'gặp admin', 'nói chuyện với người'
    ];
    if (humanRequestKeywords.some(keyword => message.includes(keyword))) {
        console.log('👤 User requests human → Escalate to admin');
        return true;
    }

    // 3. AI low confidence
    if (aiResult.confidence && aiResult.confidence < 0.6) {
        console.log(`🤔 AI confidence low (${aiResult.confidence}) → Escalate to admin`);
        return true;
    }

    // 4. Payment/refund issues
    if (aiResult.intent === 'payment' && (message.includes('lỗi') || message.includes('hoàn'))) {
        console.log('💳 Payment issue → Escalate to admin');
        return true;
    }

    return false; // AI can handle
};

/**
 * 📧 Handle escalation to admin
 * - Set room priority
 * - Send email to admin
 * - Send bot message informing user
 * - Notify online admins via socket
 */
const handleAdminEscalation = async (io, room, user, userMessage, aiResult) => {
    try {
        console.log(`🔔 Escalating chat ${room._id} to admin`);

        // Set room priority based on urgency
        const message = userMessage.toLowerCase();
        if (message.includes('gấp') || message.includes('urgent') || message.includes('khẩn cấp')) {
            room.priority = 'urgent';
        } else if (message.includes('lỗi') || message.includes('error')) {
            room.priority = 'high';
        } else {
            room.priority = 'normal';
        }

        // Add 'general' tag if not exist
        if (!room.tags.includes('general')) {
            room.tags.push('general');
        }

        await room.save();

        // 1. Send bot message to user
        const botMessage = new ChatMessage({
            room_id: room._id,
            sender_id: user._id,
            sender_type: 'bot',
            message: `Đã chuyển yêu cầu của bạn tới admin. Admin sẽ hỗ trợ bạn trong giây lát! 👨‍💼\n\n${aiResult.reason === 'AI Error' ? 'Hệ thống đang gặp vấn đề nhỏ, admin sẽ xử lý ngay.' : 'Câu hỏi này cần sự hỗ trợ từ chuyên gia.'}`,
            message_type: 'system'
        });

        await botMessage.save();
        await botMessage.populate('sender_id', 'name role');

        // Broadcast bot message
        notifyRoom(io, room._id.toString(), 'chat:new_message', {
            message: botMessage
        });

        // 2. Send email to admin (if configured)
        try {
            await emailService.notifyAdminNewChat(room, user);
        } catch (emailError) {
            console.log('⚠️  Email notification failed (not configured?):', emailError.message);
        }

        // 3. Notify all online admins via socket
        const admins = await User.find({ role: 'admin' });
        admins.forEach(admin => {
            const adminId = admin._id.toString();
            if (onlineUsers.get(adminId)) {
                notifyUser(io, adminId, 'chat:admin_needed', {
                    room: {
                        _id: room._id,
                        user_id: user._id,
                        subject: room.subject,
                        priority: room.priority,
                        tags: room.tags,
                        last_message_at: room.last_message_at
                    },
                    user: {
                        _id: user._id,
                        name: user.name,
                        email: user.email
                    },
                    message: userMessage
                });
            }
        });

        console.log(`✅ Admin escalation complete for room ${room._id}`);
    } catch (error) {
        console.error('❌ Escalation error:', error);
    }
};

module.exports = (io) => {
    io.on('connection', (socket) => {
        const userId = socket.userId;
        console.log(`💬 Chat: User ${userId} (type: ${typeof userId}) connected via socket ${socket.id}`);

        // Track online status - ensure userId is string with timestamp
        const userIdStr = userId.toString();
        onlineUsers.set(userIdStr, {
            socketId: socket.id,
            lastSeen: Date.now()
        });
        console.log(`📝 Added to onlineUsers: ${userIdStr}`);

        // Join user's personal room (already done in server.js, but ensure)
        socket.join(`user_${userId}`);

        // 🔔 Broadcast admin online status change (with caching)
        (async () => {
            const user = await User.findById(userId);
            // Cache user info in socket
            socket.userData = {
                id: user._id,
                name: user.name,
                role: user.role
            };

            if (user && user.role === 'admin') {
                // Wait a bit to ensure old connection is fully disconnected
                await new Promise(resolve => setTimeout(resolve, 100));
                const adminStatus = await getAdminOnlineStatus();
                io.emit('chat:admin_status', { admins: adminStatus });
                console.log(`✅ Admin ${user.name} is now ONLINE - Broadcasting to all clients`);
            }
        })();

        // ===== CHAT EVENTS =====

        // Join a specific chat room
        socket.on('chat:join_room', async (data) => {
            try {
                const { roomId } = data;

                // Verify access to room
                const room = await ChatRoom.findById(roomId)
                    .populate('user_id', 'name email role')
                    .populate('admin_id', 'name email');

                if (!room) {
                    socket.emit('chat:error', { message: 'Không tìm thấy phòng chat' });
                    return;
                }

                const isOwner = room.user_id._id.toString() === userId;
                const isAdmin = room.admin_id && room.admin_id._id.toString() === userId;
                const user = await User.findById(userId);
                const isSystemAdmin = user && user.role === 'admin';

                if (!isOwner && !isAdmin && !isSystemAdmin) {
                    socket.emit('chat:error', { message: 'Không có quyền truy cập phòng này' });
                    return;
                }

                // Join Socket.IO room
                socket.join(`chat_room_${roomId}`);
                console.log(`✅ User ${userId} (${user.name}) joined chat room ${roomId}`);

                // Mark messages as read
                if (isOwner) {
                    await ChatMessage.markRoomMessagesAsRead(roomId, 'user');
                    await room.resetUnreadUser();
                } else if (isAdmin || isSystemAdmin) {
                    await ChatMessage.markRoomMessagesAsRead(roomId, 'admin');
                    await room.resetUnreadAdmin();
                }

                // Notify others that user joined
                socket.to(`chat_room_${roomId}`).emit('chat:user_joined', {
                    roomId,
                    user: {
                        id: userId,
                        name: user.name,
                        role: user.role
                    }
                });

                // Send full room data with admin info
                socket.emit('chat:joined_room', {
                    roomId,
                    room: {
                        ...room.toObject(),
                        admin_info: room.admin_id ? {
                            id: room.admin_id._id,
                            name: room.admin_id.name,
                            email: room.admin_id.email,
                            isOnline: !!onlineUsers.get(room.admin_id._id.toString())
                        } : null
                    }
                });
            } catch (error) {
                console.error('Join room error:', error);
                socket.emit('chat:error', { message: 'Lỗi khi tham gia phòng chat' });
            }
        });

        // Leave chat room
        socket.on('chat:leave_room', async (data) => {
            try {
                const { roomId } = data;
                socket.leave(`chat_room_${roomId}`);

                // Stop typing if was typing
                if (typingUsers.has(roomId)) {
                    typingUsers.get(roomId).delete(userId);
                    notifyRoom(io, roomId, 'chat:typing', {
                        roomId,
                        userId,
                        isTyping: false
                    });
                }

                console.log(`User ${userId} left chat room ${roomId}`);
            } catch (error) {
                console.error('Leave room error:', error);
            }
        });

        // Send message
        socket.on('chat:send_message', async (data) => {
            try {
                // Update lastSeen for heartbeat
                const userIdStr = userId.toString();
                const userData = onlineUsers.get(userIdStr);
                if (userData) {
                    userData.lastSeen = Date.now();
                }

                const { roomId, message, message_type = 'text', attachments = [], enableAI = true } = data;

                const room = await ChatRoom.findById(roomId);
                if (!room) {
                    socket.emit('chat:error', { message: 'Không tìm thấy phòng chat' });
                    return;
                }

                const user = await User.findById(userId);
                const senderType = user.role === 'admin' ? 'admin' : 'user';

                // Create message
                const chatMessage = new ChatMessage({
                    room_id: roomId,
                    sender_id: userId,
                    sender_type: senderType,
                    message,
                    message_type,
                    attachments
                });

                await chatMessage.save();
                await chatMessage.populate('sender_id', 'name role');

                // Update room
                if (senderType === 'user') {
                    await room.incrementUnreadAdmin();
                } else {
                    await room.incrementUnreadUser();
                }

                // Broadcast to room
                notifyRoom(io, roomId, 'chat:new_message', {
                    message: chatMessage
                });

                // Notify user in personal room about unread count update
                if (senderType === 'admin' && room.user_id) {
                    notifyUser(io, room.user_id.toString(), 'chat:unread_update', {
                        roomId,
                        unreadCount: room.unread_count_user
                    });
                }

                // Generate AI response if applicable
                if (enableAI && senderType === 'user' && !room.admin_id) {
                    console.log(`🤖 AI will respond to: "${message}"`);

                    // Delay AI response slightly to feel more natural
                    setTimeout(async () => {
                        try {
                            // 🎯 Emit bot typing indicator immediately
                            notifyRoom(io, roomId, 'chat:user_typing', {
                                roomId,
                                userId: 'bot',
                                userName: 'AI Assistant',
                                isTyping: true
                            });

                            console.log('🔄 Calling AI service...');
                            const aiResult = await detectIntentAndRespond(message, room.context || {}, userId);
                            console.log('✅ AI response received:', aiResult);

                            // Stop bot typing indicator
                            notifyRoom(io, roomId, 'chat:user_typing', {
                                roomId,
                                userId: 'bot',
                                userName: 'AI Assistant',
                                isTyping: false
                            });

                            // 🧠 SMART ESCALATION: Check if AI needs admin help
                            const needsAdmin = shouldEscalateToAdmin(aiResult, message);

                            if (needsAdmin) {
                                console.log('⬆️ Escalating to admin');
                                // AI không tự tin → Notify admin
                                await handleAdminEscalation(io, room, user, message, aiResult);
                            } else {
                                console.log('💬 Sending AI response to user');
                                // AI tự tin → Send AI response
                                const botMessage = new ChatMessage({
                                    room_id: roomId,
                                    sender_id: userId,
                                    sender_type: 'bot',
                                    message: aiResult.response,
                                    message_type: 'text',
                                    ai_metadata: {
                                        is_ai_generated: true,
                                        confidence: aiResult.confidence,
                                        intent: aiResult.intent
                                    }
                                });

                                await botMessage.save();
                                await botMessage.populate('sender_id', 'name role');

                                console.log(`📤 Broadcasting AI message to room ${roomId}:`, botMessage.message);
                                // Broadcast AI response
                                notifyRoom(io, roomId, 'chat:new_message', {
                                    message: botMessage
                                });

                                // Update room tags
                                if (aiResult.intent && !room.tags.includes(aiResult.intent)) {
                                    room.tags.push(aiResult.intent);
                                    await room.save();

                                    // Notify admins about tagged room
                                    const admins = await User.find({ role: 'admin' });
                                    admins.forEach(admin => {
                                        notifyUser(io, admin._id.toString(), 'chat:room_tagged', {
                                            roomId,
                                            tags: room.tags
                                        });
                                    });
                                }
                            }
                        } catch (aiError) {
                            console.error('❌ AI response error:', aiError);
                            console.error('Error stack:', aiError.stack);

                            // Stop bot typing on error
                            notifyRoom(io, roomId, 'chat:user_typing', {
                                roomId,
                                userId: 'bot',
                                userName: 'AI Assistant',
                                isTyping: false
                            });

                            // If AI fails, escalate to admin
                            await handleAdminEscalation(io, room, user, message, { needsAdmin: true, reason: 'AI Error' });
                        }
                    }, 300); // 0.3 second delay - faster response!
                } else {
                    console.log(`⏭️ Skipping AI (enableAI: ${enableAI}, senderType: ${senderType}, has admin: ${!!room.admin_id})`);
                }

                socket.emit('chat:message_sent', {
                    success: true,
                    message: chatMessage
                });

            } catch (error) {
                console.error('Send message error:', error);
                socket.emit('chat:error', { message: 'Không thể gửi tin nhắn' });
            }
        });

        // Typing indicator
        socket.on('chat:typing', async (data) => {
            try {
                const { roomId, isTyping } = data;

                if (!typingUsers.has(roomId)) {
                    typingUsers.set(roomId, new Set());
                }

                const user = await User.findById(userId);

                if (isTyping) {
                    typingUsers.get(roomId).add(userId);
                } else {
                    typingUsers.get(roomId).delete(userId);
                }

                // Notify others in room
                socket.to(`chat_room_${roomId}`).emit('chat:user_typing', {
                    roomId,
                    userId,
                    userName: user.name,
                    isTyping
                });
            } catch (error) {
                console.error('Typing indicator error:', error);
            }
        });

        // Mark messages as read
        socket.on('chat:mark_read', async (data) => {
            try {
                const { roomId } = data;

                const room = await ChatRoom.findById(roomId);
                if (!room) return;

                const user = await User.findById(userId);
                const isOwner = room.user_id.toString() === userId;
                const isAdmin = user.role === 'admin';

                if (isOwner) {
                    await ChatMessage.markRoomMessagesAsRead(roomId, 'user');
                    await room.resetUnreadUser();
                } else if (isAdmin) {
                    await ChatMessage.markRoomMessagesAsRead(roomId, 'admin');
                    await room.resetUnreadAdmin();
                }

                // Notify sender that messages were read
                socket.to(`chat_room_${roomId}`).emit('chat:messages_read', {
                    roomId,
                    readBy: userId
                });
            } catch (error) {
                console.error('Mark read error:', error);
            }
        });

        // Admin assigns themselves to a room
        socket.on('chat:admin_assign', async (data) => {
            try {
                const { roomId } = data;

                const user = await User.findById(userId);
                if (user.role !== 'admin') {
                    socket.emit('chat:error', { message: 'Không có quyền admin' });
                    return;
                }

                const room = await ChatRoom.findById(roomId);
                if (!room) {
                    socket.emit('chat:error', { message: 'Không tìm thấy phòng chat' });
                    return;
                }

                await room.assignAdmin(userId);
                await room.populate('user_id', 'name email');
                await room.populate('admin_id', 'name email');

                // Create system message
                const systemMessage = new ChatMessage({
                    room_id: roomId,
                    sender_id: userId,
                    sender_type: 'admin',
                    message: `${user.name} đã tham gia hỗ trợ bạn! 👋`,
                    message_type: 'system'
                });
                await systemMessage.save();

                // Notify room
                notifyRoom(io, roomId, 'chat:admin_assigned', {
                    room,
                    admin: {
                        id: user._id,
                        name: user.name,
                        email: user.email
                    },
                    systemMessage
                });

                // Notify user
                notifyUser(io, room.user_id._id.toString(), 'chat:admin_joined', {
                    roomId,
                    admin: {
                        id: user._id,
                        name: user.name
                    }
                });

                // Send email notification to user (if configured)
                try {
                    await emailService.notifyUserAdminResponse(
                        room,
                        room.user_id,
                        `Admin ${user.name} đã tham gia hỗ trợ bạn!`
                    );
                } catch (emailError) {
                    console.log('⚠️  Email notification failed:', emailError.message);
                }

                socket.emit('chat:assign_success', { room });
            } catch (error) {
                console.error('Admin assign error:', error);
                socket.emit('chat:error', { message: 'Không thể assign phòng chat' });
            }
        });

        // Get online admin status
        socket.on('chat:get_admin_status', async () => {
            try {
                const adminStatus = await getAdminOnlineStatus();
                socket.emit('chat:admin_status', { admins: adminStatus });
            } catch (error) {
                console.error('Get admin status error:', error);
            }
        });

        // Close room
        socket.on('chat:close_room', async (data) => {
            try {
                const { roomId } = data;

                const room = await ChatRoom.findById(roomId);
                if (!room) {
                    socket.emit('chat:error', { message: 'Không tìm thấy phòng chat' });
                    return;
                }

                const user = await User.findById(userId);
                const isOwner = room.user_id.toString() === userId;
                const isAdmin = user.role === 'admin';

                if (!isOwner && !isAdmin) {
                    socket.emit('chat:error', { message: 'Không có quyền đóng phòng' });
                    return;
                }

                room.status = 'resolved';
                await room.save();

                // Create system message
                const systemMessage = new ChatMessage({
                    room_id: roomId,
                    sender_id: userId,
                    sender_type: isAdmin ? 'admin' : 'user',
                    message: 'Cuộc hội thoại đã được đóng. Cảm ơn bạn đã liên hệ! ✅',
                    message_type: 'system'
                });
                await systemMessage.save();

                // Notify room
                notifyRoom(io, roomId, 'chat:room_closed', {
                    roomId,
                    systemMessage
                });
            } catch (error) {
                console.error('Close room error:', error);
                socket.emit('chat:error', { message: 'Không thể đóng phòng' });
            }
        });

        // ===== DISCONNECT =====
        socket.on('disconnect', () => {
            console.log(`💬 Chat: User ${userId} disconnected`);
            const userIdStr = userId.toString();
            onlineUsers.delete(userIdStr);
            console.log(`📝 Removed from onlineUsers: ${userIdStr}`);

            // 🔔 Broadcast admin offline status change (using cached data)
            if (socket.userData && socket.userData.role === 'admin') {
                (async () => {
                    const adminStatus = await getAdminOnlineStatus();
                    io.emit('chat:admin_status', { admins: adminStatus });
                    console.log(`⚠️ Admin ${socket.userData.name} is now OFFLINE - Broadcasting to all clients`);
                })();
            }

            // Clear typing indicators
            typingUsers.forEach((users, roomId) => {
                if (users.has(userIdStr)) {
                    users.delete(userIdStr);
                    notifyRoom(io, roomId, 'chat:user_typing', {
                        roomId,
                        userId,
                        isTyping: false
                    });
                }
            });
        });
    });
};