const ChatRoom = require('../models/ChatRoom');
const ChatMessage = require('../models/ChatMessage');
const User = require('../models/User');
const OpenAI = require('openai');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// AI-powered intent detection and auto-response
const detectIntentAndRespond = async (message, context) => {
  try {
    const systemPrompt = `Bạn là trợ lý AI của Landing Hub - nền tảng tạo landing page.
Nhiệm vụ: Phân tích câu hỏi của user và đưa ra câu trả lời hữu ích.

Context về user:
- Đang ở trang: ${context.page || 'unknown'}
- Đang làm: ${context.action || 'unknown'}
- Page ID: ${context.page_id || 'N/A'}

Các chủ đề hỗ trợ:
1. BUILDER: Cách sử dụng page builder, kéo thả elements, chỉnh sửa properties, responsive design
2. MARKETPLACE: Mua bán template, pricing, licensing
3. DEPLOYMENT: Publish page, custom domain, CloudFront, SSL
4. PAYMENT: Thanh toán, MoMo, VNPay, transaction issues
5. ACCOUNT: Đăng ký, đăng nhập, subscription, profile

Trả lời ngắn gọn, rõ ràng bằng tiếng Việt. Nếu không chắc chắn, đề xuất chờ admin hỗ trợ.`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: message }
      ],
      temperature: 0.7,
      max_tokens: 500
    });

    const response = completion.choices[0].message.content;

    // Detect intent
    const intents = ['builder', 'marketplace', 'deployment', 'payment', 'account'];
    let detectedIntent = 'general';

    const lowerMessage = message.toLowerCase();
    if (lowerMessage.includes('builder') || lowerMessage.includes('kéo thả') || lowerMessage.includes('element')) {
      detectedIntent = 'builder';
    } else if (lowerMessage.includes('marketplace') || lowerMessage.includes('mua') || lowerMessage.includes('bán')) {
      detectedIntent = 'marketplace';
    } else if (lowerMessage.includes('deploy') || lowerMessage.includes('domain') || lowerMessage.includes('publish')) {
      detectedIntent = 'deployment';
    } else if (lowerMessage.includes('thanh toán') || lowerMessage.includes('payment') || lowerMessage.includes('momo')) {
      detectedIntent = 'payment';
    } else if (lowerMessage.includes('đăng ký') || lowerMessage.includes('đăng nhập') || lowerMessage.includes('tài khoản')) {
      detectedIntent = 'account';
    }

    return {
      response,
      intent: detectedIntent,
      confidence: 0.8
    };
  } catch (error) {
    console.error('AI response error:', error);
    return {
      response: 'Xin lỗi, tôi đang gặp sự cố. Một admin sẽ hỗ trợ bạn ngay!',
      intent: 'error',
      confidence: 0
    };
  }
};

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

// Get user's chat rooms
exports.getUserRooms = async (req, res) => {
  try {
    const userId = req.user.id;
    const rooms = await ChatRoom.findUserRooms(userId);

    res.json({
      success: true,
      rooms
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
exports.getRoomMessages = async (req, res) => {
  try {
    const { roomId } = req.params;
    const { limit = 50, skip = 0 } = req.query;
    const userId = req.user.id;

    // Verify user has access to this room
    const room = await ChatRoom.findById(roomId);
    if (!room) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy phòng chat'
      });
    }

    // Check access (user must be owner or admin)
    const isOwner = room.user_id.toString() === userId;
    const isAdmin = room.admin_id && room.admin_id.toString() === userId;
    const isSystemAdmin = req.user.role === 'admin';

    if (!isOwner && !isAdmin && !isSystemAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Không có quyền truy cập'
      });
    }

    const messages = await ChatMessage.findRoomMessages(roomId, parseInt(limit), parseInt(skip));

    // Mark messages as read
    if (isOwner) {
      await ChatMessage.markRoomMessagesAsRead(roomId, 'user');
      await room.resetUnreadUser();
    } else if (isAdmin || isSystemAdmin) {
      await ChatMessage.markRoomMessagesAsRead(roomId, 'admin');
      await room.resetUnreadAdmin();
    }

    res.json({
      success: true,
      messages: messages.reverse(), // Oldest first
      room
    });
  } catch (error) {
    console.error('Get messages error:', error);
    res.status(500).json({
      success: false,
      message: 'Không thể lấy tin nhắn',
      error: error.message
    });
  }
};

// Send message (REST API - fallback for Socket.IO)
exports.sendMessage = async (req, res) => {
  try {
    const { roomId } = req.params;
    const { message, message_type = 'text', attachments = [] } = req.body;
    const userId = req.user.id;

    const room = await ChatRoom.findById(roomId);
    if (!room) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy phòng chat'
      });
    }

    // Determine sender type
    const isOwner = room.user_id.toString() === userId;
    const isAdmin = req.user.role === 'admin';
    const senderType = isAdmin ? 'admin' : 'user';

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

    res.json({
      success: true,
      message: chatMessage
    });
  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({
      success: false,
      message: 'Không thể gửi tin nhắn',
      error: error.message
    });
  }
};

// Send message with AI auto-response
exports.sendMessageWithAI = async (req, res) => {
  try {
    const { roomId } = req.params;
    const { message, enableAI = true } = req.body;
    const userId = req.user.id;

    const room = await ChatRoom.findById(roomId);
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
      message,
      message_type: 'text'
    });

    await userMessage.save();
    await userMessage.populate('sender_id', 'name role');
    await room.incrementUnreadAdmin();

    let aiResponse = null;

    // Generate AI response if no admin is assigned and AI is enabled
    if (enableAI && !room.admin_id) {
      const aiResult = await detectIntentAndRespond(message, room.context || {});

      // Create AI bot message
      const botMessage = new ChatMessage({
        room_id: roomId,
        sender_id: userId, // Use system user or create a bot user
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

      // Update room tags based on detected intent
      if (aiResult.intent && !room.tags.includes(aiResult.intent)) {
        room.tags.push(aiResult.intent);
        await room.save();
      }
    }

    res.json({
      success: true,
      userMessage,
      aiResponse
    });
  } catch (error) {
    console.error('Send message with AI error:', error);
    res.status(500).json({
      success: false,
      message: 'Không thể gửi tin nhắn',
      error: error.message
    });
  }
};

// Close/resolve room
exports.closeRoom = async (req, res) => {
  try {
    const { roomId } = req.params;
    const userId = req.user.id;

    const room = await ChatRoom.findById(roomId);
    if (!room) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy phòng chat'
      });
    }

    // Only owner or admin can close
    const isOwner = room.user_id.toString() === userId;
    const isAdmin = req.user.role === 'admin';

    if (!isOwner && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Không có quyền đóng phòng chat'
      });
    }

    room.status = 'resolved';
    await room.save();

    // Create system message
    const systemMessage = new ChatMessage({
      room_id: roomId,
      sender_id: userId,
      sender_type: 'admin',
      message: 'Cuộc hội thoại đã được đóng.',
      message_type: 'system'
    });
    await systemMessage.save();

    res.json({
      success: true,
      room
    });
  } catch (error) {
    console.error('Close room error:', error);
    res.status(500).json({
      success: false,
      message: 'Không thể đóng phòng chat',
      error: error.message
    });
  }
};

// Rate chat experience
exports.rateRoom = async (req, res) => {
  try {
    const { roomId } = req.params;
    const { score, feedback } = req.body;
    const userId = req.user.id;

    const room = await ChatRoom.findById(roomId);
    if (!room) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy phòng chat'
      });
    }

    // Only owner can rate
    if (room.user_id.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Không có quyền đánh giá'
      });
    }

    room.rating = {
      score: Math.max(1, Math.min(5, score)), // Ensure 1-5 range
      feedback,
      rated_at: new Date()
    };

    await room.save();

    res.json({
      success: true,
      room
    });
  } catch (error) {
    console.error('Rate room error:', error);
    res.status(500).json({
      success: false,
      message: 'Không thể đánh giá',
      error: error.message
    });
  }
};

// ===== ADMIN ENDPOINTS =====

// Get all support rooms (admin)
exports.getAllRooms = async (req, res) => {
  try {
    const { status, assigned } = req.query;

    const filter = {};
    if (status) {
      filter.status = status;
    } else {
      filter.status = { $in: ['open', 'assigned'] }; // Default: active rooms
    }

    if (assigned === 'true') {
      filter.admin_id = { $ne: null };
    } else if (assigned === 'false') {
      filter.admin_id = null;
    }

    const rooms = await ChatRoom.find(filter)
      .sort({ priority: -1, last_message_at: -1 })
      .populate('user_id', 'name email')
      .populate('admin_id', 'name email');

    res.json({
      success: true,
      rooms
    });
  } catch (error) {
    console.error('Get all rooms error:', error);
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

    res.json({
      success: true,
      room
    });
  } catch (error) {
    console.error('Assign room error:', error);
    res.status(500).json({
      success: false,
      message: 'Không thể assign phòng chat',
      error: error.message
    });
  }
};

// Update room status/priority
exports.updateRoomStatus = async (req, res) => {
  try {
    const { roomId } = req.params;
    const { status, priority, tags } = req.body;

    const room = await ChatRoom.findById(roomId);
    if (!room) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy phòng chat'
      });
    }

    if (status) room.status = status;
    if (priority) room.priority = priority;
    if (tags) room.tags = tags;

    await room.save();

    res.json({
      success: true,
      room
    });
  } catch (error) {
    console.error('Update room status error:', error);
    res.status(500).json({
      success: false,
      message: 'Không thể cập nhật trạng thái',
      error: error.message
    });
  }
};

// Get chat statistics (admin)
exports.getChatStats = async (req, res) => {
  try {
    const [totalRooms, openRooms, assignedRooms, resolvedToday] = await Promise.all([
      ChatRoom.countDocuments({}),
      ChatRoom.countDocuments({ status: 'open' }),
      ChatRoom.countDocuments({ status: 'assigned' }),
      ChatRoom.countDocuments({
        status: 'resolved',
        updatedAt: { $gte: new Date(new Date().setHours(0, 0, 0, 0)) }
      })
    ]);

    // Average rating
    const ratedRooms = await ChatRoom.find({ 'rating.score': { $exists: true } });
    const avgRating = ratedRooms.length > 0
      ? ratedRooms.reduce((sum, room) => sum + room.rating.score, 0) / ratedRooms.length
      : 0;

    res.json({
      success: true,
      stats: {
        totalRooms,
        openRooms,
        assignedRooms,
        resolvedToday,
        avgRating: avgRating.toFixed(2),
        totalRated: ratedRooms.length
      }
    });
  } catch (error) {
    console.error('Get chat stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Không thể lấy thống kê',
      error: error.message
    });
  }
};

module.exports = exports;
