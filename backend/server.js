const dns = require('dns');
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');

// Set DNS to prefer IPv4 and use Google DNS as fallback
dns.setDefaultResultOrder('ipv4first');

// Try to use Google DNS for better reliability
dns.setServers(['8.8.8.8', '8.8.4.4']);

dotenv.config();

const app = express();
if (process.env.VERCEL) {
  app.set('trust proxy', 1);
}

const parseOrigins = () => {
  const raw = process.env.FRONTEND_URL || 'http://localhost:3000';
  return raw.split(',').map((s) => s.trim()).filter(Boolean);
};

app.use(
  cors({
    origin: parseOrigins(),
    credentials: true,
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/api/auth', require('./routes/auth'));
app.use('/api/chat', require('./routes/chat'));
app.use('/api/history', require('./routes/history'));

app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Ask Krishna Backend is running' });
});

// Root for health checks on platforms that probe /
app.get('/', (req, res) => {
  res.json({ status: 'OK', service: 'ask-krishna-backend', health: '/api/health' });
});

app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
});

const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://shivam:shivam123@cluster0.t6ychqn.mongodb.net/ask-krishna';

const mongooseOptions = {
  serverSelectionTimeoutMS: 15000,
  family: 4,
  socketTimeoutMS: 45000,
  retryWrites: true,
  w: 'majority',
};

let retryCount = 0;
const MAX_RETRIES = 3;

function connectMongoDB() {
  mongoose
    .connect(MONGODB_URI, mongooseOptions)
    .then(() => {
      console.log('✅ Connected to MongoDB Atlas');
      app.listen(PORT, () => {
        console.log(`🚀 Server running on port ${PORT}`);
        console.log(`📡 Health check: http://localhost:${PORT}/api/health`);
      });
    })
    .catch((error) => {
      retryCount++;
      console.error(`❌ MongoDB connection error (attempt ${retryCount}/${MAX_RETRIES}):`, error.message);
      
      if (retryCount < MAX_RETRIES) {
        console.log(`⏳ Retrying in 5 seconds...\n`);
        setTimeout(() => connectMongoDB(), 5000);
      } else {
        console.log('\n⚠️  Failed to connect to MongoDB Atlas after multiple attempts.');
        console.log('💡 Troubleshooting steps:');
        console.log('   1. Run: node test-connection.js (to diagnose the issue)');
        console.log('   2. Disable VPN if active');
        console.log('   3. Restart your router');
        console.log('   4. Try a different network (mobile hotspot)');
        console.log('   5. Check MongoDB Atlas Network Access settings\n');
        process.exit(1);
      }
    });
}

connectMongoDB();

module.exports = app;
