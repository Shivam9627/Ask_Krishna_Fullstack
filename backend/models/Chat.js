const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  role: {
    type: String,
    required: true,
    enum: ['user', 'assistant']
  },
  content: {
    type: String,
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
}, { _id: false });

const chatSchema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  title: {
    type: String,
    default: 'New Conversation',
    maxlength: 200
  },
  messages: {
    type: [messageSchema],
    default: []
  },
  language: {
    type: String,
    enum: ['english', 'hindi'],
    default: 'english'
  },
  created_at: {
    type: Date,
    default: Date.now,
    index: true
  },
  updated_at: {
    type: Date,
    default: Date.now
  }
});

// Generate title from first user message
chatSchema.pre('save', function(next) {
  if (this.isNew && this.messages.length > 0) {
    const firstUserMessage = this.messages.find(msg => msg.role === 'user');
    if (firstUserMessage && !this.title) {
      const titleText = firstUserMessage.content.substring(0, 50);
      this.title = titleText.length < firstUserMessage.content.length 
        ? titleText + '...' 
        : titleText;
    }
  }
  this.updated_at = Date.now();
  next();
});

// Index for efficient queries
chatSchema.index({ user_id: 1, created_at: -1 });

module.exports = mongoose.model('Chat', chatSchema);
