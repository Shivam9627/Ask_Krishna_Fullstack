/**
 * Test Gemini API Key - Verify it works and check quota
 * Run: node test-api-key.js
 */

const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

async function testAPIKey() {
  console.log('\n🔍 Testing Gemini API Key...\n');
  
  const apiKey = process.env.GEMINI_API_KEY;
  
  if (!apiKey) {
    console.error('❌ ERROR: GEMINI_API_KEY not found in .env file');
    return;
  }
  
  console.log(`✅ API Key Found: ${apiKey.substring(0, 10)}...${apiKey.substring(apiKey.length - 5)}`);
  
  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
    
    console.log('⏳ Testing API connection...\n');
    
    const result = await model.generateContent('What is wisdom? Answer in 2 sentences.');
    const response = await result.response;
    const text = response.text();
    
    console.log('✅ API IS WORKING!\n');
    console.log('📝 Response from API:');
    console.log('─'.repeat(50));
    console.log(text);
    console.log('─'.repeat(50));
    console.log('\n✅ Your API key is valid and quota is available!');
    
  } catch (error) {
    console.error('\n❌ API ERROR:');
    console.error('Error Message:', error.message);
    
    if (error.message.includes('429') || error.message.includes('RESOURCE_EXHAUSTED')) {
      console.error('\n⚠️  API QUOTA EXHAUSTED!');
      console.error('Reason: You\'ve used up your free quota.');
      console.error('\nSolutions:');
      console.error('1. Wait for quota to reset (usually 24 hours)');
      console.error('2. Check your Google Cloud console for usage limits');
      console.error('3. Upgrade your Google Cloud plan if needed');
    } else if (error.message.includes('API_KEY_INVALID')) {
      console.error('\n⚠️  INVALID API KEY!');
      console.error('Please check your GEMINI_API_KEY in .env file');
    } else {
      console.error('\n⚠️  GENERAL ERROR:');
      console.error('Check your internet connection and API key');
    }
  }
}

testAPIKey();
