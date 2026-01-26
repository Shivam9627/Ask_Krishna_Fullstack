/**
 * Test Dual API Service (Gemini + GROQ)
 */

require('dotenv').config();
const dualAPIService = require('./services/dualAPIService');

async function testDualAPI() {
  console.log('\n🧪 Testing Dual API Service (Gemini + GROQ)...\n');
  
  console.log('📊 Current API Status:');
  const status = dualAPIService.getStatus();
  console.log(JSON.stringify(status, null, 2));
  
  if (!status.groqAvailable) {
    console.log('\n⚠️  GROQ API key not configured!');
    console.log('   1. Get free key: https://console.groq.com/keys');
    console.log('   2. Add to backend/.env: GROQ_API_KEY=gsk_xxx');
    console.log('   3. Restart: npm start\n');
    return;
  }
  
  console.log('\n💬 Generating response for: "What is wisdom?"\n');
  
  try {
    const response = await dualAPIService.generateResponse('What is wisdom?', 'english');
    console.log('\n✅ Response received:');
    console.log('---');
    console.log(response.substring(0, 500) + (response.length > 500 ? '...' : ''));
    console.log('---\n');
    
    console.log('📊 Final Stats:');
    const finalStatus = dualAPIService.getStatus();
    console.log(`  Gemini Calls: ${finalStatus.stats.geminiCalls}`);
    console.log(`  GROQ Calls: ${finalStatus.stats.groqCalls}`);
    console.log(`  Last Used API: ${finalStatus.lastUsedAPI}`);
    console.log(`  Quota Exhausted: ${finalStatus.quotaExhausted}`);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testDualAPI();
