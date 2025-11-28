const ChatRoom = require('../models/ChatRoom');

/**
 * Middleware to verify user has access to a chat room
 * Checks if user is owner, assigned admin, or system admin
 */
exports.verifyChatRoomAccess = async (req, res, next) => {
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

    // Check access levels
    const isOwner = room.user_id.toString() === userId;
    const isAssignedAdmin = room.admin_id && room.admin_id.toString() === userId;
    const isSystemAdmin = req.user.role === 'admin';

    if (!isOwner && !isAssignedAdmin && !isSystemAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Không có quyền truy cập phòng chat này'
      });
    }

    // Attach room and access info to request
    req.chatRoom = room;
    req.chatAccess = {
      isOwner,
      isAssignedAdmin,
      isSystemAdmin,
      canSend: isOwner || isAssignedAdmin || isSystemAdmin,
      canClose: isOwner || isSystemAdmin,
      canAssign: isSystemAdmin
    };

    next();
  } catch (error) {
    console.error('[ChatAccessMiddleware] Error verifying access:', {
      error: error.message,
      roomId: req.params.roomId,
      userId: req.user?.id
    });
    return res.status(500).json({
      success: false,
      message: 'Lỗi kiểm tra quyền truy cập',
      error: error.message
    });
  }
};

/**
 * Middleware to verify user is room owner
 */
exports.verifyRoomOwner = async (req, res, next) => {
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

    if (room.user_id.toString() !== userId && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Chỉ chủ phòng mới có quyền thực hiện thao tác này'
      });
    }

    req.chatRoom = room;
    next();
  } catch (error) {
    console.error('[ChatAccessMiddleware] Error verifying owner:', {
      error: error.message,
      roomId: req.params.roomId
    });
    return res.status(500).json({
      success: false,
      message: 'Lỗi kiểm tra quyền sở hữu',
      error: error.message
    });
  }
};

/**
 * Middleware to validate room status for operations
 */
exports.validateRoomStatus = (allowedStatuses = ['open', 'assigned']) => {
  return (req, res, next) => {
    const room = req.chatRoom;

    if (!room) {
      return res.status(400).json({
        success: false,
        message: 'Room not loaded. Use verifyChatRoomAccess middleware first.'
      });
    }

    if (!allowedStatuses.includes(room.status)) {
      return res.status(400).json({
        success: false,
        message: `Không thể thực hiện thao tác này với phòng chat có trạng thái '${room.status}'`,
        allowedStatuses
      });
    }

    next();
  };
};
