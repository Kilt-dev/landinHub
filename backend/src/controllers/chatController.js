const ChatRoom = require('../models/ChatRoom');
const ChatMessage = require('../models/ChatMessage');
const { buildAIContext, detectAdminNeed } = require('../services/ai/chatContextService');
const { generateResponse } = require('../services/ai/multiAIProvider');

/**
 * Create or get existing chat room for user
 */
exports.createOrGetRoom = async (req, res) => {
  try {
    const userId = req.user.id;

    // Check if user has active room
    let room = await ChatRoom.findOne({
      user_id: userId,
      status: { $in: ['active', 'pending'] }
    });

    // Create new room if none exists
    if (!room) {
      room = new ChatRoom({
        user_id: userId,
        status: 'active',
        subject: 'General Support',
        ai_enabled: true
      });
      await room.save();

      // Send welcome message from bot
      const welcomeMsg = new ChatMessage({
        room_id: room._id,
        sender_type: 'bot',
        message: 'Xin chào! 👋 Tôi là trợ lý AI của LandingHub. Tôi có thể giúp gì cho bạn hôm nay?'
      });
      await welcomeMsg.save();

      console.log(`✅ Created new chat room for user ${userId}`);
    }

    res.json({
      success: true,
      room: {
        id: room._id,
        status: room.status,
        subject: room.subject,
        ai_enabled: room.ai_enabled,
        created_at: room.createdAt
      }
    });
  } catch (error) {
    console.error('Error creating/getting room:', error);
    res.status(500).json({
      success: false,
      message: 'Không thể tạo phòng chat'
    });
  }
};

/**
 * Get all rooms for current user
 */
exports.getUserRooms = async (req, res) => {
  try {
    const userId = req.user.id;

    const rooms = await ChatRoom.find({ user_id: userId })
      .sort({ last_message_at: -1 })
      .limit(10);

    res.json({
      success: true,
      rooms
    });
  } catch (error) {
    console.error('Error fetching user rooms:', error);
    res.status(500).json({
      success: false,
      message: 'Không thể tải danh sách chat'
    });
  }
};

/**
 * Get messages for a specific room
 */
exports.getRoomMessages = async (req, res) => {
  try {
    const { roomId } = req.params;
    const userId = req.user.id;
    const limit = parseInt(req.query.limit) || 50;
    const before = req.query.before; // For pagination

    // Verify user has access to this room
    const room = await ChatRoom.findOne({
      _id: roomId,
      $or: [{ user_id: userId }, { admin_id: userId }]
    });

    if (!room) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy phòng chat'
      });
    }

    // Build query
    const query = { room_id: roomId };
    if (before) {
      query.createdAt = { $lt: new Date(before) };
    }

    const messages = await ChatMessage.find(query)
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();

    // Mark messages as read
    const isUser = room.user_id.toString() === userId.toString();
    await ChatMessage.updateMany(
      { room_id: roomId, [isUser ? 'read_by_user' : 'read_by_admin']: false },
      { [isUser ? 'read_by_user' : 'read_by_admin']: true }
    );

    res.json({
      success: true,
      messages: messages.reverse(), // Oldest first
      hasMore: messages.length === limit
    });
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json({
      success: false,
      message: 'Không thể tải tin nhắn'
    });
  }
};

/**
 * Send a message (user or admin)
 */
exports.sendMessage = async (req, res) => {
  try {
    const { roomId } = req.params;
    const { message } = req.body;
    const userId = req.user.id;

    if (!message || !message.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Tin nhắn không được để trống'
      });
    }

    // Verify room access
    const room = await ChatRoom.findOne({
      _id: roomId,
      $or: [{ user_id: userId }, { admin_id: userId }]
    });

    if (!room) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy phòng chat'
      });
    }

    // Determine sender type
    const isUser = room.user_id.toString() === userId.toString();
    const senderType = isUser ? 'user' : 'admin';

    // Create message
    const newMessage = new ChatMessage({
      room_id: roomId,
      sender_id: userId,
      sender_type: senderType,
      message: message.trim()
    });

    await newMessage.save();

    // Update room
    room.last_message_at = new Date();
    if (room.status === 'pending' && !isUser) {
      room.status = 'active'; // Admin joined
    }
    await room.save();

    // Emit to Socket.IO if available
    if (global._io) {
      const roomName = `chat_${roomId}`;
      global._io.to(roomName).emit('new_message', {
        id: newMessage._id,
        sender_type: senderType,
        message: newMessage.message,
        created_at: newMessage.createdAt
      });
    }

    res.json({
      success: true,
      message: newMessage
    });
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({
      success: false,
      message: 'Không thể gửi tin nhắn'
    });
  }
};

/**
 * Send message and get AI response
 */
exports.sendMessageWithAI = async (req, res) => {
  try {
    const { roomId } = req.params;
    const { message } = req.body;
    const userId = req.user.id;

    if (!message || !message.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Tin nhắn không được để trống'
      });
    }

    // Verify room
    const room = await ChatRoom.findOne({
      _id: roomId,
      user_id: userId
    });

    if (!room) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy phòng chat'
      });
    }

    // Save user message
    const userMessage = new ChatMessage({
      room_id: roomId,
      sender_id: userId,
      sender_type: 'user',
      message: message.trim()
    });
    await userMessage.save();

    // Check if needs admin
    const needsAdmin = detectAdminNeed(message);
    if (needsAdmin && !room.admin_id) {
      room.status = 'pending';
      room.priority = 'high';
      await room.save();

      // Send "escalating to admin" message
      const escalateMsg = new ChatMessage({
        room_id: roomId,
        sender_type: 'bot',
        message: 'Tôi sẽ kết nối bạn với admin để được hỗ trợ tốt hơn nhé! 👨‍💼 Vui lòng chờ trong giây lát...'
      });
      await escalateMsg.save();

      // Notify admins via Socket.IO
      if (global._io) {
        global._io.to('admin_room').emit('new_support_request', {
          room_id: roomId,
          user_id: userId,
          message: message.trim(),
          priority: 'high'
        });
      }

      return res.json({
        success: true,
        userMessage,
        aiMessage: escalateMsg,
        escalated: true
      });
    }

    // Generate AI response if AI is enabled and no admin assigned
    let aiMessage = null;
    if (room.ai_enabled && !room.admin_id) {
      try {
        // Build context
        const context = await buildAIContext(userId, message, room.context);

        // Get conversation history
        const history = await ChatMessage.find({ room_id: roomId })
          .sort({ createdAt: -1 })
          .limit(10)
          .lean();

        // Build messages array for AI
        const aiMessages = [
          { role: 'system', content: context.systemPrompt }
        ];

        // Add context data if available
        if (context.relevantData && Object.keys(context.relevantData).length > 0) {
          aiMessages.push({
            role: 'system',
            content: `Dữ liệu hệ thống:\n${JSON.stringify(context.relevantData, null, 2)}`
          });
        }

        // Add conversation history
        history.reverse().forEach(msg => {
          if (msg.sender_type === 'user') {
            aiMessages.push({ role: 'user', content: msg.message });
          } else if (msg.sender_type === 'bot') {
            aiMessages.push({ role: 'assistant', content: msg.message });
          }
        });

        // Generate response
        const aiResponse = await generateResponse(aiMessages);

        // Save AI message
        aiMessage = new ChatMessage({
          room_id: roomId,
          sender_type: 'bot',
          message: aiResponse.text,
          ai_metadata: {
            provider: aiResponse.provider,
            model: aiResponse.model,
            context_used: true,
            response_time: aiResponse.responseTime
          }
        });
        await aiMessage.save();

        console.log(`✅ AI response generated by ${aiResponse.provider} in ${aiResponse.responseTime}ms`);
      } catch (error) {
        console.error('❌ AI response failed:', error);
        // Send fallback message
        aiMessage = new ChatMessage({
          room_id: roomId,
          sender_type: 'bot',
          message: 'Xin lỗi, tôi đang gặp vấn đề kỹ thuật. Bạn có thể thử lại hoặc chat với admin để được hỗ trợ tốt hơn nhé! 😊'
        });
        await aiMessage.save();
      }
    }

    // Update room
    room.last_message_at = new Date();
    await room.save();

    // Emit to Socket.IO
    if (global._io) {
      const roomName = `chat_${roomId}`;
      global._io.to(roomName).emit('new_message', {
        id: userMessage._id,
        sender_type: 'user',
        message: userMessage.message,
        created_at: userMessage.createdAt
      });

      if (aiMessage) {
        global._io.to(roomName).emit('new_message', {
          id: aiMessage._id,
          sender_type: 'bot',
          message: aiMessage.message,
          created_at: aiMessage.createdAt
        });
      }
    }

    res.json({
      success: true,
      userMessage,
      aiMessage
    });
  } catch (error) {
    console.error('Error sending message with AI:', error);
    res.status(500).json({
      success: false,
      message: 'Không thể gửi tin nhắn'
    });
  }
};

/**
 * Admin: Get all pending support requests
 */
exports.getAdminPendingRooms = async (req, res) => {
  try {
    const rooms = await ChatRoom.find({
      status: 'pending'
    })
    .populate('user_id', 'name email')
    .sort({ priority: -1, last_message_at: -1 })
    .limit(50);

    res.json({
      success: true,
      rooms
    });
  } catch (error) {
    console.error('Error fetching pending rooms:', error);
    res.status(500).json({
      success: false,
      message: 'Không thể tải danh sách hỗ trợ'
    });
  }
};

/**
 * Admin: Assign room to self
 */
exports.assignRoomToSelf = async (req, res) => {
  try {
    const { roomId } = req.params;
    const adminId = req.user.id;

    const room = await ChatRoom.findByIdAndUpdate(
      roomId,
      {
        admin_id: adminId,
        status: 'active',
        ai_enabled: false // Disable AI when admin joins
      },
      { new: true }
    ).populate('user_id', 'name email');

    if (!room) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy phòng chat'
      });
    }

    // Send system message
    const systemMsg = new ChatMessage({
      room_id: roomId,
      sender_type: 'bot',
      message_type: 'system',
      message: `Admin đã tham gia chat. Bạn sẽ được hỗ trợ trực tiếp! 👨‍💼`
    });
    await systemMsg.save();

    // Notify user via Socket.IO
    if (global._io) {
      global._io.to(`user_${room.user_id._id}`).emit('admin_joined', {
        room_id: roomId,
        message: systemMsg.message
      });

      global._io.to(`chat_${roomId}`).emit('new_message', {
        id: systemMsg._id,
        sender_type: 'bot',
        message_type: 'system',
        message: systemMsg.message,
        created_at: systemMsg.createdAt
      });
    }

    res.json({
      success: true,
      room
    });
  } catch (error) {
    console.error('Error assigning room:', error);
    res.status(500).json({
      success: false,
      message: 'Không thể nhận phòng chat'
    });
  }
};

/**
 * Close chat room with rating
 */
exports.closeRoom = async (req, res) => {
  try {
    const { roomId } = req.params;
    const { rating, feedback } = req.body;
    const userId = req.user.id;

    const room = await ChatRoom.findOne({
      _id: roomId,
      user_id: userId
    });

    if (!room) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy phòng chat'
      });
    }

    room.status = 'closed';
    room.resolved_at = new Date();
    if (rating) room.rating = rating;
    if (feedback) room.feedback = feedback;
    await room.save();

    // Send closing message
    const closeMsg = new ChatMessage({
      room_id: roomId,
      sender_type: 'bot',
      message_type: 'system',
      message: 'Chat đã được đóng. Cảm ơn bạn đã sử dụng dịch vụ! 🙏'
    });
    await closeMsg.save();

    // Notify via Socket.IO
    if (global._io) {
      global._io.to(`chat_${roomId}`).emit('chat_closed', {
        room_id: roomId
      });
    }

    res.json({
      success: true,
      message: 'Đã đóng chat'
    });
  } catch (error) {
    console.error('Error closing room:', error);
    res.status(500).json({
      success: false,
      message: 'Không thể đóng chat'
    });
  }
};

/**
 * Admin: Get all rooms assigned to admin
 */
exports.getAdminRooms = async (req, res) => {
  try {
    const adminId = req.user.id;
    const { status } = req.query; // Optional filter by status

    let query = { admin_id: adminId };
    if (status) {
      query.status = status;
    }

    const rooms = await ChatRoom.find(query)
      .populate('user_id', 'name email')
      .sort({ last_message_at: -1 })
      .limit(100);

    res.json({
      success: true,
      rooms
    });
  } catch (error) {
    console.error('Error fetching admin rooms:', error);
    res.status(500).json({
      success: false,
      message: 'Không thể tải danh sách chat'
    });
  }
};

/**
 * Admin: Get statistics
 */
exports.getAdminStats = async (req, res) => {
  try {
    const adminId = req.user.id;

    // Get counts by status
    const statusCounts = await ChatRoom.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    // Get admin's active rooms
    const myActiveRooms = await ChatRoom.countDocuments({
      admin_id: adminId,
      status: { $in: ['active', 'pending'] }
    });

    // Get pending rooms (not assigned to anyone)
    const pendingRooms = await ChatRoom.countDocuments({
      status: 'pending',
      admin_id: null
    });

    // Get today's stats
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todayStats = await ChatRoom.aggregate([
      {
        $match: {
          createdAt: { $gte: today }
        }
      },
      {
        $group: {
          _id: null,
          newRooms: { $sum: 1 },
          resolved: {
            $sum: {
              $cond: [{ $eq: ['$status', 'resolved'] }, 1, 0]
            }
          }
        }
      }
    ]);

    // Average rating
    const ratingStats = await ChatRoom.aggregate([
      {
        $match: {
          rating: { $ne: null }
        }
      },
      {
        $group: {
          _id: null,
          avgRating: { $avg: '$rating' },
          totalRatings: { $sum: 1 }
        }
      }
    ]);

    // Format response
    const stats = {
      byStatus: statusCounts.reduce((acc, s) => {
        acc[s._id] = s.count;
        return acc;
      }, {}),
      myActiveRooms,
      pendingRooms,
      today: todayStats[0] || { newRooms: 0, resolved: 0 },
      rating: ratingStats[0] || { avgRating: 0, totalRatings: 0 }
    };

    res.json({
      success: true,
      stats
    });
  } catch (error) {
    console.error('Error fetching admin stats:', error);
    res.status(500).json({
      success: false,
      message: 'Không thể tải thống kê'
    });
  }
};
