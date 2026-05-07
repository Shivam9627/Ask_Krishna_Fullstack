const mongoose = require('mongoose');
const dns = require('dns').promises;
const dotenv = require('dotenv');

dotenv.config();

const testConnection = async () => {
  console.log('🧪 Testing MongoDB Atlas Connection...\n');

  const MONGODB_URI = process.env.MONGODB_URI;
  console.log(`📍 Connection String: ${MONGODB_URI.replace(/:[^:]*@/, ':****@')}\n`);

  // Test DNS resolution
  console.log('1️⃣ Testing DNS Resolution...');
  try {
    const result = await dns.resolveSrv('_mongodb._tcp.cluster0.t6ychqn.mongodb.net');
    console.log('✅ DNS SRV record resolved successfully');
    console.log('   Records:', result.length);
  } catch (dnsError) {
    console.log('❌ DNS SRV lookup failed:', dnsError.message);
    console.log('   This means your network is blocking SRV lookups');
    console.log('   Try: Disable VPN, Change DNS to 8.8.8.8, or Restart network adapter\n');
  }

  // Test MongoDB connection
  console.log('\n2️⃣ Testing MongoDB Connection...');
  try {
    await mongoose.connect(MONGODB_URI, {
      serverSelectionTimeoutMS: 10000,
      family: 4,
      socketTimeoutMS: 10000,
    });
    console.log('✅ Successfully connected to MongoDB Atlas!');
    console.log('   You can now run: npm run dev\n');
    await mongoose.disconnect();
    process.exit(0);
  } catch (mongoError) {
    console.log('❌ MongoDB connection failed:', mongoError.message);
    console.log('\n💡 Quick fixes to try:');
    console.log('   1. Disable VPN (if active)');
    console.log('   2. Restart your router');
    console.log('   3. Change DNS to Google: 8.8.8.8');
    console.log('   4. Check IP whitelist in MongoDB Atlas (you set 0.0.0.0 which is correct)');
    console.log('   5. Try mobile hotspot or different network temporarily\n');
    process.exit(1);
  }
};

testConnection();
