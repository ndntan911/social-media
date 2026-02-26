const mongoose = require('mongoose');

const storySchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  image: {
    type: String,
    required: true,
  },
  caption: {
    type: String,
    maxlength: 500,
  },
  viewers: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    viewedAt: {
      type: Date,
      default: Date.now,
    },
  }],
  expiresAt: {
    type: Date,
    default: Date.now,
    expires: 24 * 60 * 60, // Auto-delete after 24 hours
  },
}, {
  timestamps: true,
});

// Index for efficient queries
storySchema.index({ user: 1, expiresAt: 1 });
storySchema.index({ expiresAt: 1 });

// Virtual for checking if story is expired
storySchema.virtual('isExpired').get(function() {
  return new Date() > this.expiresAt;
});

// Method to add viewer
storySchema.methods.addViewer = function(userId) {
  const existingViewer = this.viewers.find(viewer => 
    viewer.user.toString() === userId.toString()
  );
  
  if (!existingViewer) {
    this.viewers.push({ user: userId });
    return this.save();
  }
  return Promise.resolve(this);
};

module.exports = mongoose.model('Story', storySchema);
