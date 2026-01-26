const jwt = require('jsonwebtoken');
const User = require('../models/User');

const authMiddleware = async (req, res, next) => {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;
    let token = null;
    let userId = null;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7).trim();
      console.log('🔑 Token received:', token.substring(0, 50) + '...');
    }

    // Verify JWT token
    if (token) {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret');
        userId = decoded.userId || decoded.user_id;
        console.log('✅ JWT verified, userId:', userId);
      } catch (jwtError) {
        console.log('❌ JWT verification failed:', jwtError.message);
      }
    }
    
    // Fallback to X-User-Id header if JWT didn't work
    if (!userId) {
      userId = req.headers['x-user-id'];
      if (userId) {
        console.log('📌 Using X-User-Id header:', userId);
      }
    }

    if (!userId) {
      console.log('No userId found. Auth header:', authHeader ? 'present' : 'missing', 'X-User-Id:', req.headers['x-user-id'] || 'missing');
      return res.status(401).json({ error: 'Authentication required' });
    }

    // Verify user exists
    const user = await User.findById(userId);
    if (!user) {
      console.log('User not found for userId:', userId);
      return res.status(401).json({ error: 'User not found' });
    }

    // Attach user to request
    req.user = user;
    req.userId = userId;
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(401).json({ error: 'Authentication failed' });
  }
};

module.exports = authMiddleware;
