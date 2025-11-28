const mongoose = require('mongoose');

const chatRoomSchema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  admin_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
    index: true
  },
  status: {
    type: String,
    enum: ['active', 'pending', 'resolved', 'closed'],
    default: 'active',
    index: true
  },
  subject: {
    type: String,
    default: 'General Support'
  },
  context: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  tags: [{
    type: String
  }],
  ai_enabled: {
    type: Boolean,
    default: true
  },
  rating: {
    type: Number,
    min: 1,
    max: 5,
    default: null
  },
  feedback: {
    type: String,
    default: null
  },
  last_message_at: {
    type: Date,
    default: Date.now,
    index: true
  },
  resolved_at: {
    type: Date,
    default: null
  }
}, {
  timestamps: true
});

// Index for finding active chats
chatRoomSchema.index({ status: 1, last_message_at: -1 });

// Index for admin queries
chatRoomSchema.index({ admin_id: 1, status: 1 });

module.exports = mongoose.model('ChatRoom', chatRoomSchema);
