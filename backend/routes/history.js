const express = require('express');
const authMiddleware = require('../middleware/auth');
const Chat = require('../models/Chat');

const router = express.Router();

// Get all chat history for user
router.get('/', authMiddleware, async (req, res) => {
  try {
    const chats = await Chat.find({ user_id: req.userId })
      .sort({ created_at: -1 })
      .select('-__v');

    // Format response to match frontend expectations
    const formattedChats = chats.map(chat => ({
      _id: chat._id.toString(),
      title: chat.title,
      messages: chat.messages,
      date: chat.created_at,
      created_at: chat.created_at.getTime()
    }));

    res.json(formattedChats);
  } catch (error) {
    console.error('Get history error:', error);
    res.status(500).json({ error: 'Failed to fetch chat history' });
  }
});

// Get specific chat by ID
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const chat = await Chat.findOne({
      _id: req.params.id,
      user_id: req.userId
    }).select('-__v');

    if (!chat) {
      return res.status(404).json({ error: 'Chat not found' });
    }

    res.json({
      _id: chat._id.toString(),
      title: chat.title,
      messages: chat.messages,
      date: chat.created_at,
      created_at: chat.created_at.getTime()
    });
  } catch (error) {
    console.error('Get chat by ID error:', error);
    res.status(500).json({ error: 'Failed to fetch chat' });
  }
});

// Delete specific chat
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const chat = await Chat.findOneAndDelete({
      _id: req.params.id,
      user_id: req.userId
    });

    if (!chat) {
      return res.status(404).json({ error: 'Chat not found' });
    }

    res.json({ message: 'Chat deleted successfully' });
  } catch (error) {
    console.error('Delete chat error:', error);
    res.status(500).json({ error: 'Failed to delete chat' });
  }
});

// Delete all chats for user
router.delete('/', authMiddleware, async (req, res) => {
  try {
    await Chat.deleteMany({ user_id: req.userId });
    res.json({ message: 'All chats deleted successfully' });
  } catch (error) {
    console.error('Delete all chats error:', error);
    res.status(500).json({ error: 'Failed to delete chats' });
  }
});

module.exports = router;
