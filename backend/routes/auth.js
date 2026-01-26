const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const OTP = require('../models/OTP');
const authMiddleware = require('../middleware/auth');
const emailService = require('../services/emailService');

const router = express.Router();

// Generate JWT token
const generateToken = (user) => {
  const payload = {
    userId: user._id.toString(),
    user_id: user._id.toString(),
    username: user.username,
    email: user.email
  };
  const token = jwt.sign(payload, process.env.JWT_SECRET || 'fallback-secret', { expiresIn: '30d' });
  console.log('🎫 Generated JWT token:', token.substring(0, 50) + '...');
  return token;
};

// Register user
router.post('/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;

    // Validation
    if (!username || !email || !password) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ 
      $or: [{ email }, { username }] 
    });

    if (existingUser) {
      return res.status(400).json({ 
        error: existingUser.email === email 
          ? 'Email already registered' 
          : 'Username already taken' 
      });
    }

    // Create new user
    const user = new User({
      username,
      email,
      password,
      emailVerified: false
    });

    await user.save();

    // Generate token
    const token = generateToken(user);

    // Return user data with token
    console.log('✅ Register response - token parts:', token.split('.').length);
    res.status(201).json({
      token: token,
      user_id: user._id.toString(),
      username: user.username,
      email: user.email,
      created_at: user.created_at,
      profileImage: user.profileImage
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Failed to register user' });
  }
});

// Login user
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validation
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Find user
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Generate token
    const token = generateToken(user);

    // Return user data with token
    console.log('✅ Login response - token parts:', token.split('.').length);
    res.json({
      token: token,
      user_id: user._id.toString(),
      username: user.username,
      email: user.email,
      created_at: user.created_at,
      profileImage: user.profileImage
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Failed to login' });
  }
});

// Logout (client-side mainly, but we can log it)
router.post('/logout', authMiddleware, (req, res) => {
  res.json({ message: 'Logged out successfully' });
});

// Get user profile
router.get('/profile', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.userId).select('-password');
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      user_id: user._id.toString(),
      username: user.username,
      email: user.email,
      created_at: user.created_at,
      profileImage: user.profileImage
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ error: 'Failed to get profile' });
  }
});

// Update user profile
router.put('/profile', authMiddleware, async (req, res) => {
  try {
    const { username, profileImage } = req.body;
    const user = await User.findById(req.userId);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Update fields
    if (username !== undefined) {
      // Check if username is taken by another user
      const existingUser = await User.findOne({ 
        username, 
        _id: { $ne: req.userId } 
      });
      if (existingUser) {
        return res.status(400).json({ error: 'Username already taken' });
      }
      user.username = username;
    }

    if (profileImage !== undefined) {
      user.profileImage = profileImage;
    }

    await user.save();

    res.json({
      user_id: user._id.toString(),
      username: user.username,
      email: user.email,
      created_at: user.created_at,
      profileImage: user.profileImage
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

// Send registration OTP
router.post('/send-registration-otp', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    // Check if email already registered
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    // Generate OTP
    const otp = OTP.generateOTP();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Delete old OTPs for this email
    await OTP.deleteMany({ 
      email: email.toLowerCase(), 
      type: 'registration' 
    });

    // Save new OTP
    const otpDoc = new OTP({
      email: email.toLowerCase(),
      otp,
      type: 'registration',
      expires_at: expiresAt
    });

    await otpDoc.save();

    // Send OTP email
    await emailService.sendOTP(email, otp, 'registration');

    res.json({ 
      message: 'OTP sent successfully',
      // In development, return OTP for testing
      ...(process.env.NODE_ENV === 'development' && { otp })
    });
  } catch (error) {
    console.error('Send OTP error:', error);
    res.status(500).json({ error: 'Failed to send OTP' });
  }
});

// Verify registration OTP
router.post('/verify-registration-otp', async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({ error: 'Email and OTP are required' });
    }

    // Find OTP
    const otpDoc = await OTP.findOne({
      email: email.toLowerCase(),
      otp,
      type: 'registration',
      expires_at: { $gt: new Date() },
      verified: false
    });

    if (!otpDoc) {
      return res.status(400).json({ error: 'Invalid or expired OTP' });
    }

    // Mark OTP as verified
    otpDoc.verified = true;
    await otpDoc.save();

    res.json({ message: 'OTP verified successfully' });
  } catch (error) {
    console.error('Verify OTP error:', error);
    res.status(500).json({ error: 'Failed to verify OTP' });
  }
});

// Send delete account OTP
router.post('/send-delete-otp', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Generate OTP
    const otp = OTP.generateOTP();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Delete old OTPs for this user
    await OTP.deleteMany({ 
      email: user.email.toLowerCase(), 
      type: 'delete',
      user_id: req.userId
    });

    // Save new OTP
    const otpDoc = new OTP({
      email: user.email.toLowerCase(),
      otp,
      type: 'delete',
      user_id: req.userId,
      expires_at: expiresAt
    });

    await otpDoc.save();

    // Send OTP email
    await emailService.sendOTP(user.email, otp, 'delete');

    res.json({ 
      message: 'OTP sent successfully',
      // In development, return OTP for testing
      ...(process.env.NODE_ENV === 'development' && { otp })
    });
  } catch (error) {
    console.error('Send delete OTP error:', error);
    res.status(500).json({ error: 'Failed to send OTP' });
  }
});

// Delete account
router.delete('/account', authMiddleware, async (req, res) => {
  try {
    const { otp } = req.body;

    if (!otp) {
      return res.status(400).json({ error: 'OTP is required' });
    }

    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Verify OTP
    const otpDoc = await OTP.findOne({
      email: user.email.toLowerCase(),
      otp,
      type: 'delete',
      user_id: req.userId,
      expires_at: { $gt: new Date() },
      verified: false
    });

    if (!otpDoc) {
      return res.status(400).json({ error: 'Invalid or expired OTP' });
    }

    // Delete user and all related data
    await User.findByIdAndDelete(req.userId);
    await OTP.deleteMany({ user_id: req.userId });
    // Note: You might want to delete user's chats too
    const Chat = require('../models/Chat');
    await Chat.deleteMany({ user_id: req.userId });

    res.json({ message: 'Account deleted successfully' });
  } catch (error) {
    console.error('Delete account error:', error);
    res.status(500).json({ error: 'Failed to delete account' });
  }
});

module.exports = router;
