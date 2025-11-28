const ChatRoom = require('../models/ChatRoom');
const ChatMessage = require('../models/ChatMessage');
const User = require('../models/User');
const { detectIntentAndRespond } = require('../services/aiResponseService');
const wsService = require('../services/websocket/websocketService');
const notificationService = require('../services/notificationService');

/**
 * Safely broadcast to WebSocket room
 * @param {string} room - Room identifier
 * @param {string} event - Event name
 * @param {Object} data - Data to send
 */
async function safeBroadcastToRoom(room, event, data) {
    try {
        await wsService.sendToRoom(room, event, data);
        return true;
    } catch (error) {
        console.error('[ChatController] WebSocket broadcast failed:', {
            error: error.message,
            room,
            event
        });
        return false;
    }
}

// Note: detectIntentAndRespond is now imported from aiResponseService
// which uses real data from chatContextService

// Create or get existing chat room for user
exports.createOrGetRoom = async (req, res) => {
    try {
        const userId = req.user.id;
        const { context } = req.body;

        // Check if user has an open room
        let room = await ChatRoom.findOne({
            user_id: userId,
            status: { $in: ['open', 'assigned'] }
        }).populate('admin_id', 'name email');

        if (!room) {
            // Create new room
            room = new ChatRoom({
                user_id: userId,
                context: context || {},
                subject: context?.action ? `Hỗ trợ ${context.action}` : 'Hỗ trợ chung'
            });
            await room.save();
            await room.populate('admin_id', 'name email');
        } else {
            // Update context if provided
            if (context) {
                room.context = { ...room.context, ...context };
                await room.save();
            }
        }

        res.json({
            success: true,
            room
        });
    } catch (error) {
        console.error('Create room error:', error);
        res.status(500).json({
            success: false,
            message: 'Không thể tạo phòng chat',
            error: error.message
        });
    }
};

// Create marketplace chat room (buyer-seller communication)
exports.createMarketplaceRoom = async (req, res) => {
    try {
        const buyerId = req.user.id;
        const { marketplacePageId, sellerId, pageTitle } = req.body;

        if (!marketplacePageId || !sellerId) {
            return res.status(400).json({
                success: false,
                message: 'marketplacePageId và sellerId là bắt buộc'
            });
        }

        // Không cho phép liên hệ chính mình
        if (buyerId === sellerId) {
            return res.status(400).json({
                success: false,
                message: 'Không thể liên hệ với chính mình'
            });
        }

        // Check if room already exists between buyer and seller for this page
        let room = await ChatRoom.findOne({
            user_id: buyerId,
            'context.marketplace_page_id': marketplacePageId,
            'context.seller_id': sellerId,
            'context.type': 'marketplace',
            status: { $in: ['open', 'assigned'] }
        }).populate('admin_id', 'name email');

        if (!room) {
            // Create new marketplace chat room
            room = new ChatRoom({
                user_id: buyerId,
                context: {
                    type: 'marketplace',
                    marketplace_page_id: marketplacePageId,
                    seller_id: sellerId,
                    page_title: pageTitle || 'Marketplace Page'
                },
                subject: `Liên hệ về: ${pageTitle || 'Marketplace Page'}`,
                tags: ['marketplace', 'buyer-seller']
            });
            await room.save();
            await room.populate('admin_id', 'name email');

            console.log(`✅ Created marketplace chat room ${room._id} between buyer ${buyerId} and seller ${sellerId}`);
        } else {
            console.log(`📦 Found existing marketplace room ${room._id}`);
        }

        res.json({
            success: true,
            room
        });
    } catch (error) {
        console.error('[ChatController] Create marketplace room error:', error);
        res.status(500).json({
            success: false,
            message: 'Không thể tạo phòng chat',
            error: error.message
        });
    }
};

// Get user's chat rooms
exports.getUserRooms = async (req, res) => {
    try {
        const userId = req.user.id;

        // Get rooms where user is the creator (buyer in marketplace context)
        const userRooms = await ChatRoom.findUserRooms(userId);

        // Also get marketplace rooms where user is the seller
        const sellerRooms = await ChatRoom.find({
            'context.type': 'marketplace',
            'context.seller_id': userId,
            status: { $in: ['open', 'assigned', 'resolved'] }
        })
            .sort({ last_message_at: -1 })
            .populate('user_id', 'name email'); // user_id is the buyer

        // Combine and deduplicate
        const allRooms = [...userRooms, ...sellerRooms];
        const uniqueRooms = allRooms.filter((room, index, self) =>
            index === self.findIndex(r => r._id.toString() === room._id.toString())
        );

        res.json({
            success: true,
            rooms: uniqueRooms
        });
    } catch (error) {
        console.error('Get user rooms error:', error);
        res.status(500).json({
            success: false,
            message: 'Không thể lấy danh sách chat',
            error: error.message
        });
    }
};

// Get messages for a room
// Note: Should use chatAccessMiddleware.verifyChatRoomAccess in routes
exports.getRoomMessages = async (req, res) => {
    try {
        const { roomId } = req.params;
        const limit = Math.min(parseInt(req.query.limit) || 50, 200); // Cap at 200
        const skip = parseInt(req.query.skip) || 0;

        // If middleware is used, room will be in req.chatRoom
        const room = req.chatRoom || await ChatRoom.findById(roomId);
        if (!room) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy phòng chat'
            });
        }

        const userId = req.user.id;
        const isOwner = room.user_id.toString() === userId;
        const isAdmin = room.admin_id && room.admin_id.toString() === userId;
        const isSystemAdmin = req.user.role === 'admin';

        // Check if this is a marketplace room
        const isMarketplaceRoom = room.context?.type === 'marketplace';
        const isSeller = isMarketplaceRoom && room.context?.seller_id === userId;

        // Check access if middleware not used
        if (!req.chatAccess && !isOwner && !isAdmin && !isSystemAdmin && !isSeller) {
            return res.status(403).json({
                success: false,
                message: 'Không có quyền truy cập'
            });
        }

        // Fetch messages
        const messages = await ChatMessage.findRoomMessages(roomId, limit, skip);

        // Mark messages as read in background (don't wait)
        setImmediate(async () => {
            try {
                if (isOwner) {
                    await Promise.all([
                        ChatMessage.markRoomMessagesAsRead(roomId, 'user'),
                        room.resetUnreadUser()
                    ]);
                } else if (isAdmin || isSystemAdmin) {
                    await Promise.all([
                        ChatMessage.markRoomMessagesAsRead(roomId, 'admin'),
                        room.resetUnreadAdmin()
                    ]);
                }
            } catch (err) {
                console.error('[ChatController] Failed to mark messages as read:', {
                    error: err.message,
                    roomId,
                    userId
                });
            }
        });

        res.json({
            success: true,
            messages: messages.reverse(), // Oldest first
            room,
            pagination: {
                limit,
                skip,
                hasMore: messages.length === limit
            }
        });
    } catch (error) {
        console.error('[ChatController] Get messages error:', {
            error: error.message,
            stack: error.stack,
            roomId: req.params.roomId,
            userId: req.user?.id
        });
        res.status(500).json({
            success: false,
            message: 'Không thể lấy tin nhắn',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

// Send message (REST API - fallback for Socket.IO)
// Note: Should use chatValidationMiddleware.validateSendMessage in routes
exports.sendMessage = async (req, res) => {
    try {
        const { roomId } = req.params;
        const { message, message_type = 'text', attachments = [] } = req.body;
        const userId = req.user.id;

        const room = req.chatRoom || await ChatRoom.findById(roomId);
        if (!room) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy phòng chat'
            });
        }

        // Check if this is a marketplace room and determine sender type
        const isMarketplaceRoom = room.context?.type === 'marketplace';
        const isBuyer = room.user_id.toString() === userId;
        const isSeller = isMarketplaceRoom && room.context?.seller_id === userId;
        const isAdmin = req.user.role === 'admin';

        // Validate access for marketplace rooms
        if (isMarketplaceRoom && !isBuyer && !isSeller && !isAdmin) {
            return res.status(403).json({
                success: false,
                message: 'Không có quyền gửi tin nhắn trong phòng này'
            });
        }

        // Determine sender type
        let senderType;
        if (isMarketplaceRoom) {
            senderType = isSeller ? 'seller' : 'user';
        } else {
            senderType = isAdmin ? 'admin' : 'user';
        }

        // Create message
        const chatMessage = new ChatMessage({
            room_id: roomId,
            sender_id: userId,
            sender_type: senderType,
            message: message.trim(),
            message_type,
            attachments
        });

        await chatMessage.save();
        await chatMessage.populate('sender_id', 'name role');

        // Broadcast message via WebSocket to all room participants
        await safeBroadcastToRoom(`chat_room_${roomId}`, 'chat:new_message', {
            message: chatMessage
        });

        // Handle admin reply notifications (async, non-blocking)
        if (isAdmin) {
            setImmediate(async () => {
                // Send email notification
                try {
                    const { sendAdminReplyNotification } = require('../services/email');
                    await sendAdminReplyNotification(room, chatMessage);
                } catch (emailError) {
                    console.error('[ChatController] Failed to send admin reply email:', {
                        error: emailError.message,
                        roomId,
                        userId
                    });
                }

                // Create in-app notification
                await notificationService.createAdminReplyNotification(
                    room,
                    chatMessage,
                    req.user.name
                );
            });
        }

        // Update room unread count (non-blocking)
        setImmediate(async () => {
            try {
                if (isMarketplaceRoom) {
                    // For marketplace rooms: user=buyer, admin=seller
                    if (isSeller) {
                        await room.incrementUnreadUser(); // Seller sends, increment buyer's unread
                    } else if (isBuyer) {
                        await room.incrementUnreadAdmin(); // Buyer sends, increment seller's unread
                    }
                } else {
                    // For support rooms: regular user-admin logic
                    if (senderType === 'user') {
                        await room.incrementUnreadAdmin();
                    } else {
                        await room.incrementUnreadUser();
                    }
                }
            } catch (err) {
                console.error('[ChatController] Failed to update unread count:', {
                    error: err.message,
                    roomId,
                    senderType
                });
            }
        });

        res.json({
            success: true,
            message: chatMessage
        });
    } catch (error) {
        console.error('[ChatController] Send message error:', {
            error: error.message,
            stack: error.stack,
            roomId: req.params.roomId,
            userId: req.user?.id
        });
        res.status(500).json({
            success: false,
            message: 'Không thể gửi tin nhắn',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

// Send message with AI auto-response
exports.sendMessageWithAI = async (req, res) => {
    try {
        const { roomId } = req.params;
        const { message, enableAI = true } = req.body;
        const userId = req.user.id;

        const room = req.chatRoom || await ChatRoom.findById(roomId);
        if (!room) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy phòng chat'
            });
        }

        // Create user message
        const userMessage = new ChatMessage({
            room_id: roomId,
            sender_id: userId,
            sender_type: 'user',
            message: message.trim(),
            message_type: 'text'
        });

        await userMessage.save();
        await userMessage.populate('sender_id', 'name role');

        // Broadcast user message via WebSocket
        await safeBroadcastToRoom(`chat_room_${roomId}`, 'chat:new_message', {
            message: userMessage
        });

        // Update unread count (non-blocking)
        setImmediate(() => room.incrementUnreadAdmin().catch(err =>
            console.error('[ChatController] Failed to increment unread:', err.message)
        ));

        let aiResponse = null;

        // Generate AI response if no admin is assigned and AI is enabled
        if (enableAI && !room.admin_id) {
            try {
                const aiResult = await detectIntentAndRespond(
                    message,
                    room.context || {},
                    userId
                );

                // Create AI bot message
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

                aiResponse = botMessage;

                // Broadcast AI response via WebSocket
                await safeBroadcastToRoom(`chat_room_${roomId}`, 'chat:new_message', {
                    message: aiResponse
                });

                // Update room tags based on detected intent (non-blocking)
                if (aiResult.intent && !room.tags.includes(aiResult.intent)) {
                    setImmediate(() => {
                        room.tags.push(aiResult.intent);
                        room.save().catch(err =>
                            console.error('[ChatController] Failed to update tags:', err.message)
                        );
                    });
                }
            } catch (aiError) {
                console.error('[ChatController] AI response generation failed:', {
                    error: aiError.message,
                    roomId,
                    userId
                });
                // Continue without AI response if it fails
            }
        }

        res.json({
            success: true,
            userMessage,
            aiResponse
        });
    } catch (error) {
        console.error('[ChatController] Send message with AI error:', {
            error: error.message,
            stack: error.stack,
            roomId: req.params.roomId,
            userId: req.user?.id
        });
        res.status(500).json({
            success: false,
            message: 'Không thể gửi tin nhắn',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

// Close/resolve room
exports.closeRoom = async (req, res) => {
    try {
        const { roomId } = req.params;
        const userId = req.user.id;

        const room = req.chatRoom || await ChatRoom.findById(roomId);
        if (!room) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy phòng chat'
            });
        }

        // Check permissions
        const isOwner = room.user_id.toString() === userId;
        const isAdmin = req.user.role === 'admin';

        if (!isOwner && !isAdmin) {
            return res.status(403).json({
                success: false,
                message: 'Không có quyền đóng phòng chat'
            });
        }

        // Update room status
        room.status = 'resolved';
        await room.save();

        // Create system message
        const systemMessage = new ChatMessage({
            room_id: roomId,
            sender_id: userId,
            sender_type: isAdmin ? 'admin' : 'user',
            message: `Cuộc hội thoại đã được đóng bởi ${req.user.name || 'người dùng'}.`,
            message_type: 'system'
        });
        await systemMessage.save();

        // Broadcast room closed event
        await safeBroadcastToRoom(`chat_room_${roomId}`, 'chat:room_closed', {
            room,
            closedBy: req.user.name
        });

        // Send notification (non-blocking)
        if (isAdmin && room.user_id.toString() !== userId) {
            setImmediate(() =>
                notificationService.createRoomClosedNotification(room)
            );
        }

        res.json({
            success: true,
            room
        });
    } catch (error) {
        console.error('[ChatController] Close room error:', {
            error: error.message,
            stack: error.stack,
            roomId: req.params.roomId,
            userId: req.user?.id
        });
        res.status(500).json({
            success: false,
            message: 'Không thể đóng phòng chat',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

// Rate chat experience
// Note: Should use chatValidationMiddleware.validateRating in routes
exports.rateRoom = async (req, res) => {
    try {
        const { roomId } = req.params;
        const { score, feedback } = req.body;
        const userId = req.user.id;

        const room = req.chatRoom || await ChatRoom.findById(roomId);
        if (!room) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy phòng chat'
            });
        }

        // Only owner can rate
        if (room.user_id.toString() !== userId && req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Chỉ chủ phòng mới có quyền đánh giá'
            });
        }

        // Check if already rated
        if (room.rating && room.rating.score) {
            return res.status(400).json({
                success: false,
                message: 'Phòng chat này đã được đánh giá'
            });
        }

        room.rating = {
            score: Math.max(1, Math.min(5, Math.round(score))), // Ensure 1-5 range
            feedback: feedback ? feedback.trim() : undefined,
            rated_at: new Date()
        };

        await room.save();

        res.json({
            success: true,
            room,
            message: 'Cảm ơn bạn đã đánh giá!'
        });
    } catch (error) {
        console.error('[ChatController] Rate room error:', {
            error: error.message,
            stack: error.stack,
            roomId: req.params.roomId,
            userId: req.user?.id
        });
        res.status(500).json({
            success: false,
            message: 'Không thể đánh giá',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

// ===== ADMIN ENDPOINTS =====

// Get all support rooms (admin)
exports.getAllRooms = async (req, res) => {
    try {
        const { status, assigned } = req.query;

        const filter = {};

        // ✅ FIX: Support 'all' status to fetch all chats
        if (status && status !== 'all') {
            filter.status = status;
        } else if (!status) {
            // Default: only active rooms (open or assigned)
            filter.status = { $in: ['open', 'assigned'] };
        }
        // If status === 'all', don't filter by status

        if (assigned === 'true') {
            filter.admin_id = { $ne: null };
        } else if (assigned === 'false') {
            filter.admin_id = null;
        }

        const rooms = await ChatRoom.find(filter)
            .sort({ priority: -1, last_message_at: -1 })
            .populate('user_id', 'name email')
            .populate('admin_id', 'name email');

        console.log(`✅ Fetched ${rooms.length} chat rooms with filter:`, filter);

        res.json({
            success: true,
            rooms,
            count: rooms.length
        });
    } catch (error) {
        console.error('❌ Get all rooms error:', error);
        res.status(500).json({
            success: false,
            message: 'Không thể lấy danh sách phòng chat',
            error: error.message
        });
    }
};

// Assign room to admin
exports.assignRoom = async (req, res) => {
    try {
        const { roomId } = req.params;
        const adminId = req.user.id;

        const room = await ChatRoom.findById(roomId);
        if (!room) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy phòng chat'
            });
        }

        // Check if already assigned
        if (room.admin_id) {
            return res.status(400).json({
                success: false,
                message: 'Phòng chat đã được assign cho admin khác'
            });
        }

        // Assign admin
        await room.assignAdmin(adminId);
        await room.populate('user_id', 'name email');
        await room.populate('admin_id', 'name email');

        // Create system message
        const systemMessage = new ChatMessage({
            room_id: roomId,
            sender_id: adminId,
            sender_type: 'admin',
            message: `Admin ${req.user.name} đã tham gia hỗ trợ.`,
            message_type: 'system'
        });
        await systemMessage.save();

        // Broadcast room assignment
        await safeBroadcastToRoom(`chat_room_${roomId}`, 'chat:room_assigned', {
            room,
            admin: req.user
        });

        // Send notification (non-blocking)
        setImmediate(() =>
            notificationService.createRoomAssignmentNotification(room, req.user.name)
        );

        res.json({
            success: true,
            room
        });
    } catch (error) {
        console.error('[ChatController] Assign room error:', {
            error: error.message,
            stack: error.stack,
            roomId: req.params.roomId,
            adminId: req.user?.id
        });
        res.status(500).json({
            success: false,
            message: 'Không thể assign phòng chat',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

// Update room status/priority
// Note: Should use chatValidationMiddleware.validateStatusUpdate in routes
exports.updateRoomStatus = async (req, res) => {
    try {
        const { roomId } = req.params;
        const { status, priority, tags } = req.body;

        const room = req.chatRoom || await ChatRoom.findById(roomId);
        if (!room) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy phòng chat'
            });
        }

        const updates = {};
        if (status && status !== room.status) {
            updates.status = status;
            room.status = status;
        }
        if (priority && priority !== room.priority) {
            updates.priority = priority;
            room.priority = priority;
        }
        if (tags && JSON.stringify(tags) !== JSON.stringify(room.tags)) {
            updates.tags = tags;
            room.tags = tags;
        }

        // Only save if there are actual changes
        if (Object.keys(updates).length === 0) {
            return res.json({
                success: true,
                room,
                message: 'Không có thay đổi nào'
            });
        }

        await room.save();

        // Broadcast status update
        await safeBroadcastToRoom(`chat_room_${roomId}`, 'chat:room_updated', {
            room,
            updates
        });

        res.json({
            success: true,
            room,
            updates
        });
    } catch (error) {
        console.error('[ChatController] Update room status error:', {
            error: error.message,
            stack: error.stack,
            roomId: req.params.roomId,
            userId: req.user?.id
        });
        res.status(500).json({
            success: false,
            message: 'Không thể cập nhật trạng thái',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

// Get chat statistics (admin)
exports.getChatStats = async (req, res) => {
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // Optimize queries with Promise.all for parallel execution
        const [
            totalRooms,
            openRooms,
            assignedRooms,
            resolvedToday,
            ratingStats
        ] = await Promise.all([
            ChatRoom.countDocuments({}),
            ChatRoom.countDocuments({ status: 'open' }),
            ChatRoom.countDocuments({ status: 'assigned' }),
            ChatRoom.countDocuments({
                status: 'resolved',
                updatedAt: { $gte: today }
            }),
            // Use aggregation for better performance on rating calculation
            ChatRoom.aggregate([
                { $match: { 'rating.score': { $exists: true, $ne: null } } },
                {
                    $group: {
                        _id: null,
                        avgRating: { $avg: '$rating.score' },
                        totalRated: { $sum: 1 },
                        maxRating: { $max: '$rating.score' },
                        minRating: { $min: '$rating.score' }
                    }
                }
            ])
        ]);

        const ratingData = ratingStats[0] || {
            avgRating: 0,
            totalRated: 0,
            maxRating: 0,
            minRating: 0
        };

        res.json({
            success: true,
            stats: {
                totalRooms,
                openRooms,
                assignedRooms,
                resolvedToday,
                avgRating: ratingData.avgRating ? ratingData.avgRating.toFixed(2) : '0.00',
                totalRated: ratingData.totalRated,
                maxRating: ratingData.maxRating,
                minRating: ratingData.minRating
            }
        });
    } catch (error) {
        console.error('[ChatController] Get chat stats error:', {
            error: error.message,
            stack: error.stack,
            userId: req.user?.id
        });
        res.status(500).json({
            success: false,
            message: 'Không thể lấy thống kê',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

module.exports = exports;