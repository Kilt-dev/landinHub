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
    default: null
  },
  sender_type: {
    type: String,
    enum: ['user', 'admin', 'bot'],
    required: true
  },
  message: {
    type: String,
    required: true
  },
  message_type: {
    type: String,
    enum: ['text', 'image', 'file', 'system'],
    default: 'text'
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  ai_metadata: {
    provider: {
      type: String,
      enum: ['groq', 'gemini', null],
      default: null
    },
    model: {
      type: String,
      default: null
    },
    context_used: {
      type: Boolean,
      default: false
    },
    response_time: {
      type: Number,
      default: null
    }
  },
  read_by_user: {
    type: Boolean,
    default: false
  },
  read_by_admin: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Index for fetching messages by room
chatMessageSchema.index({ room_id: 1, createdAt: -1 });

// Index for unread messages
chatMessageSchema.index({ room_id: 1, read_by_user: 1, read_by_admin: 1 });

module.exports = mongoose.model('ChatMessage', chatMessageSchema);
