/**
 * Test Dual API Service
 * Tests Gemini first, then falls back to HuggingFace if needed
 */

const dualAPIService = require('./services/dualAPIService');
require('dotenv').config();

async function testDualAPI() {
  console.log('\n🔍 Testing Dual API Service (Gemini + HuggingFace)\n');
  
  const apiStatus = dualAPIService.getStatus();
  console.log('📊 API Status:');
  console.log(`  Gemini Available: ${apiStatus.geminiAvailable ? '✅' : '❌'}`);
  console.log(`  HuggingFace Available: ${apiStatus.huggingFaceAvailable ? '✅' : '❌'}`);
  console.log(`  Quota Exhausted: ${apiStatus.quotaExhausted ? '⚠️ YES' : '✅ NO'}\n`);
  
  if (!apiStatus.geminiAvailable && !apiStatus.huggingFaceAvailable) {
    console.error('❌ No API services configured!');
    console.error('Set GEMINI_API_KEY or HUGGING_FACE_API_KEY in .env');
    return;
  }

  try {
    console.log('⏳ Generating response...\n');
    const response = await dualAPIService.generateResponse(
      'What is wisdom according to Bhagavad Gita?',
      'english'
    );
    
    console.log('✅ Response Generated!\n');
    console.log('📝 Response:');
    console.log('─'.repeat(60));
    console.log(response);
    console.log('─'.repeat(60));
    
    const finalStatus = dualAPIService.getStatus();
    console.log(`\n✅ Response was generated using: ${finalStatus.lastUsedAPI.toUpperCase()}`);
    console.log(`📊 Stats: Gemini: ${finalStatus.stats.geminiCalls}, HuggingFace: ${finalStatus.stats.hfCalls}`);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testDualAPI();
