const mongoose = require('mongoose');

const chatSchema = new mongoose.Schema({
  participants: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    lastRead: {
      type: Date,
      default: Date.now,
    },
  }],
  lastMessage: {
    text: String,
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  isGroupChat: {
    type: Boolean,
    default: false,
  },
  groupName: {
    type: String,
    maxlength: 50,
  },
  groupAdmin: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
}, {
  timestamps: true,
});

// Index for efficient queries
chatSchema.index({ 'participants.user': 1 });
chatSchema.index({ updatedAt: -1 });

// Virtual for unread count
chatSchema.virtual('unreadCount').get(function() {
  // This would be populated based on current user
  return 0; // Placeholder - calculated in routes
});

module.exports = mongoose.model('Chat', chatSchema);
