const express = require('express');
const authMiddleware = require('../middleware/auth');
const dualAPIService = require('../services/dualAPIService');
const Chat = require('../models/Chat');

const router = express.Router();

// Send message and get response
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { prompt, language = 'english' } = req.body;

    if (!prompt || !prompt.trim()) {
      return res.status(400).json({ error: 'Message is required' });
    }

    // Check if API services are configured
    const apiStatus = dualAPIService.getStatus();
    if (!apiStatus.geminiAvailable && !apiStatus.huggingFaceAvailable) {
      return res.status(500).json({ 
        error: 'AI services not configured. Please set API keys in environment variables.' 
      });
    }

    // Get or create current chat session
    // For simplicity, we'll create a new chat for each conversation
    // You can modify this to maintain session-based chats
    let chat = await Chat.findOne({
      user_id: req.userId,
      created_at: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } // Last 24 hours
    }).sort({ created_at: -1 });

    // If no recent chat, create a new one
    if (!chat) {
      chat = new Chat({
        user_id: req.userId,
        language: language,
        messages: []
      });
    }

    // Add user message
    chat.messages.push({
      role: 'user',
      content: prompt.trim()
    });

    // Generate response using Dual API Service (Gemini + HuggingFace fallback)
    let response;
    try {
      response = await dualAPIService.generateResponse(prompt.trim(), language);
    } catch (apiError) {
      console.error('API Error:', apiError.message);
      
      // Handle quota exhausted
      if (apiError.message && (apiError.message.includes('429') || apiError.message.includes('RESOURCE_EXHAUSTED'))) {
        return res.status(429).json({ 
          error: 'API Quota Exceeded',
          message: language === 'hindi'
            ? '🙏 API की सीमा पार हो गई है। कृपया कुछ समय में पुनः प्रयास करें।'
            : '🙏 API quota exceeded. Please try again in a moment.',
          retryAfter: 60
        });
      }
      
      // Handle other errors
      return res.status(500).json({ 
        error: 'API Error',
        message: language === 'hindi'
          ? 'एक त्रुटि हुई। कृपया पुनः प्रयास करें।'
          : 'An error occurred. Please try again.',
        details: apiError.message
      });
    }

    // Add assistant message
    chat.messages.push({
      role: 'assistant',
      content: response
    });

    // Update title if it's the first message
    if (chat.messages.length === 2 && !chat.title) {
      const titleText = prompt.trim().substring(0, 50);
      chat.title = titleText.length < prompt.trim().length 
        ? titleText + '...' 
        : titleText;
    }

    // Save chat
    await chat.save();

    // Return response
    res.json({
      response: response,
      chat_id: chat._id
    });
  } catch (error) {
    console.error('Chat error:', error);
    res.status(500).json({ 
      error: 'Failed to process message',
      message: error.message 
    });
  }
});

module.exports = router;
