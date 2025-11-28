const Notification = require('../models/Notification');

/**
 * Notification Service
 * Handles all notification creation and management
 */
class NotificationService {
    /**
     * Create admin reply notification
     * @param {Object} room - Chat room object
     * @param {Object} message - Chat message object
     * @param {string} adminName - Name of the admin
     */
    async createAdminReplyNotification(room, message, adminName) {
        try {
            await Notification.create({
                recipientId: room.user_id,
                type: 'admin_replied',
                title: 'Admin đã trả lời',
                message: `${adminName} đã trả lời yêu cầu hỗ trợ: "${room.subject}"`,
                metadata: {
                    roomId: room._id,
                    messagePreview: message.message.substring(0, 100),
                    adminName
                }
            });
            return { success: true };
        } catch (error) {
            console.error('[NotificationService] Failed to create admin reply notification:', {
                error: error.message,
                roomId: room._id,
                userId: room.user_id
            });
            return { success: false, error: error.message };
        }
    }

    /**
     * Create room assignment notification
     * @param {Object} room - Chat room object
     * @param {string} adminName - Name of the admin
     */
    async createRoomAssignmentNotification(room, adminName) {
        try {
            await Notification.create({
                recipientId: room.user_id,
                type: 'chat_assigned',
                title: 'Yêu cầu hỗ trợ đã được xử lý',
                message: `${adminName} đã nhận yêu cầu hỗ trợ của bạn`,
                metadata: {
                    roomId: room._id,
                    adminName
                }
            });
            return { success: true };
        } catch (error) {
            console.error('[NotificationService] Failed to create assignment notification:', {
                error: error.message,
                roomId: room._id
            });
            return { success: false, error: error.message };
        }
    }

    /**
     * Create room closed notification
     * @param {Object} room - Chat room object
     */
    async createRoomClosedNotification(room) {
        try {
            await Notification.create({
                recipientId: room.user_id,
                type: 'chat_resolved',
                title: 'Yêu cầu hỗ trợ đã hoàn tất',
                message: `Cuộc trò chuyện về "${room.subject}" đã được đóng`,
                metadata: {
                    roomId: room._id
                }
            });
            return { success: true };
        } catch (error) {
            console.error('[NotificationService] Failed to create closed notification:', {
                error: error.message,
                roomId: room._id
            });
            return { success: false, error: error.message };
        }
    }

    /**
     * Batch create notifications
     * @param {Array} notifications - Array of notification objects
     */
    async createBatch(notifications) {
        try {
            await Notification.insertMany(notifications, { ordered: false });
            return { success: true, count: notifications.length };
        } catch (error) {
            console.error('[NotificationService] Failed to batch create notifications:', {
                error: error.message,
                count: notifications.length
            });
            return { success: false, error: error.message };
        }
    }
}

module.exports = new NotificationService();