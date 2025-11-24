const mongoose = require('mongoose');

const chatMessageSchema = new mongoose.Schema({
  room_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ChatRoom',
    required: true,
    index: true
  },
  sender_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  sender_type: {
    type: String,
    enum: ['user', 'admin', 'bot', 'seller'],
    required: true
  },
  message: {
    type: String,
    required: true,
    maxlength: 5000
  },
  message_type: {
    type: String,
    enum: ['text', 'image', 'file', 'system'],
    default: 'text'
  },
  // For images and files
  attachments: [{
    type: {
      type: String,
      enum: ['image', 'file']
    },
    url: String,
    filename: String,
    size: Number,
    mime_type: String
  }],
  is_read: {
    type: Boolean,
    default: false,
    index: true
  },
  // For AI-generated messages
  ai_metadata: {
    is_ai_generated: {
      type: Boolean,
      default: false
    },
    confidence: Number,
    intent: String, // 'builder_help', 'payment_issue', etc.
    suggested_actions: [String]
  },
  // Reference to message this is replying to
  reply_to: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ChatMessage'
  }
}, {
  timestamps: true
});

// Index for efficient queries
chatMessageSchema.index({ room_id: 1, createdAt: -1 });
chatMessageSchema.index({ room_id: 1, is_read: 1 });

// Methods
chatMessageSchema.methods.markAsRead = function() {
  this.is_read = true;
  return this.save();
};

// Static methods
chatMessageSchema.statics.findRoomMessages = function(roomId, limit = 50, skip = 0) {
  return this.find({ room_id: roomId })
    .sort({ createdAt: -1 })
    .limit(limit)
    .skip(skip)
    .populate('sender_id', 'name role')
    .populate('reply_to', 'message sender_id');
};

chatMessageSchema.statics.countUnreadMessages = function(roomId, senderType) {
  return this.countDocuments({
    room_id: roomId,
    is_read: false,
    sender_type: { $ne: senderType } // Count messages NOT from this sender type
  });
};

chatMessageSchema.statics.markRoomMessagesAsRead = function(roomId, excludeSenderType) {
  return this.updateMany(
    {
      room_id: roomId,
      is_read: false,
      sender_type: { $ne: excludeSenderType }
    },
    { is_read: true }
  );
};

module.exports = mongoose.model('ChatMessage', chatMessageSchema);
