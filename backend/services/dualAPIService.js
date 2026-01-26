/**
 * Dual API Service - Gemini + GROQ Fallback
 * Uses Gemini first, automatically switches to GROQ if quota exhausted
 * GROQ offers 10k requests/month free with <1s response time
 */

require('dotenv').config();
const { GoogleGenerativeAI } = require('@google/generative-ai');

class DualAPIService {
  constructor() {
    const geminiKey = process.env.GEMINI_API_KEY;
    const groqKey = process.env.GROQ_API_KEY;

    // Initialize Gemini
    if (geminiKey) {
      this.genAI = new GoogleGenerativeAI(geminiKey);
      // Use gemini-pro (stable model) with fallback to other models
      try {
        this.geminiModel = this.genAI.getGenerativeModel({ model: 'gemini-pro' });
      } catch (e) {
        console.warn('⚠️  gemini-pro not available, trying alternatives...');
        this.geminiModel = null;
      }
    }

    // Store GROQ key for fetch requests
    this.groqKey = groqKey;

    // Stats
    this.stats = {
      geminiCalls: 0,
      groqCalls: 0,
      geminiErrors: 0,
      lastUsedAPI: null,
      quotaExhausted: false
    };

    this.maxRetries = 3;
  }

  /**
   * Generate response with dual API fallback
   */
  async generateResponse(prompt, language = 'english') {
    // Try Gemini first
    if (this.geminiModel && !this.stats.quotaExhausted) {
      try {
        console.log('🚀 Trying Gemini API...');
        const response = await this.generateWithGemini(prompt, language);
        this.stats.geminiCalls++;
        this.stats.lastUsedAPI = 'gemini';
        console.log('✅ Gemini response generated');
        return response;
      } catch (error) {
        // Check if it's quota exhausted
        if (error.message && (error.message.includes('429') || error.message.includes('RESOURCE_EXHAUSTED'))) {
          console.warn('⚠️  Gemini quota exhausted, switching to GROQ...');
          this.stats.quotaExhausted = true;
          this.stats.geminiErrors++;
          
          // Fall through to GROQ
          if (this.groqKey) {
            return this.generateWithGROQ(prompt, language);
          }
        } else {
          // Other errors, still try GROQ as backup
          console.warn(`⚠️  Gemini error (${error.message}), trying GROQ...`);
          this.stats.geminiErrors++;
          
          if (this.groqKey) {
            return this.generateWithGROQ(prompt, language);
          }
        }
        throw error;
      }
    }

    // If Gemini not available or quota exhausted, use GROQ
    if (this.groqKey) {
      console.log('🚀 Using GROQ API...');
      return this.generateWithGROQ(prompt, language);
    }

    throw new Error('No API services available. Please configure GEMINI_API_KEY or GROQ_API_KEY');
  }

  /**
   * Generate response using Gemini
   */
  async generateWithGemini(prompt, language, retryCount = 0) {
    try {
      const systemPrompt = language === 'hindi'
        ? `आप एक ज्ञानी और करुणामय गुरु हैं जो भगवद गीता के शिक्षाओं के आधार पर मार्गदर्शन प्रदान करते हैं। 
        आपके उत्तर भगवद गीता के अध्यायों और श्लोकों के संदर्भ में होने चाहिए।
        उत्तर देते समय:
        1. प्रासंगिक अध्याय और श्लोक संख्या का उल्लेख करें
        2. व्यावहारिक जीवन की स्थितियों से जोड़ें
        3. स्पष्ट और समझने योग्य भाषा में समझाएं
        4. करुणा और ज्ञान के साथ उत्तर दें
        
        उपयोगकर्ता का प्रश्न: ${prompt}`
        : `You are a wise and compassionate spiritual guide based on Bhagavad Gita teachings.
        When answering:
        1. Mention relevant chapter and verse numbers
        2. Connect to practical life situations
        3. Explain clearly and compassionately
        4. Provide wisdom and guidance
        
        User's question: ${prompt}`;

      const result = await this.geminiModel.generateContent(systemPrompt);
      const response = await result.response;
      return response.text();
    } catch (error) {
      if (retryCount < this.maxRetries && error.message && (error.message.includes('429') || error.message.includes('RESOURCE_EXHAUSTED'))) {
        const backoffDelay = Math.pow(2, retryCount) * 1000;
        console.log(`🔄 Gemini retry ${retryCount + 1}/${this.maxRetries} - waiting ${backoffDelay / 1000}s...`);
        await new Promise(resolve => setTimeout(resolve, backoffDelay));
        return this.generateWithGemini(prompt, language, retryCount + 1);
      }
      throw error;
    }
  }

  /**
   * Generate response using GROQ
   */
  async generateWithGROQ(prompt, language, retryCount = 0) {
    try {
      const systemPrompt = language === 'hindi'
        ? `आप एक ज्ञानी और करुणामय गुरु हैं जो भगवद गीता के शिक्षाओं के आधार पर मार्गदर्शन प्रदान करते हैं। भगवद गीता के अध्यायों और श्लोकों के संदर्भ में उत्तर दें।`
        : `You are a wise and compassionate spiritual guide based on Bhagavad Gita teachings. Reference relevant chapters and verses.`;
      
      const fullPrompt = `${systemPrompt}\n\nQuestion: ${prompt}`;

      // Use GROQ API (10k requests/month free, <1s response time)
      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'llama-3.1-8b-instant',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: prompt }
          ],
          max_tokens: 1000,
          temperature: 0.7,
          top_p: 0.9
        })
      });

      const responseText = await response.text();
      
      if (!response.ok) {
        throw new Error(`GROQ API error: ${response.status} - ${responseText}`);
      }

      let data;
      try {
        data = JSON.parse(responseText);
      } catch (e) {
        throw new Error(`Invalid JSON response from GROQ: ${responseText}`);
      }
      
      this.stats.groqCalls++;
      this.stats.lastUsedAPI = 'groq';
      
      // Extract text from OpenAI-style response
      if (data.choices && data.choices[0] && data.choices[0].message) {
        return data.choices[0].message.content;
      }
      throw new Error('Unexpected GROQ response format');
      
    } catch (error) {
      if (retryCount < this.maxRetries) {
        const backoffDelay = Math.pow(2, retryCount) * 1000;
        console.log(`🔄 GROQ retry ${retryCount + 1}/${this.maxRetries} - waiting...`);
        await new Promise(resolve => setTimeout(resolve, backoffDelay));
        return this.generateWithGROQ(prompt, language, retryCount + 1);
      }
      throw error;
    }
  }

  /**
   * Get current API status
   */
  getStatus() {
    return {
      geminiAvailable: !!this.geminiModel,
      groqAvailable: !!this.groqKey,
      quotaExhausted: this.stats.quotaExhausted,
      lastUsedAPI: this.stats.lastUsedAPI,
      stats: this.stats
    };
  }

  /**
   * Reset quota tracking
   */
  resetQuotaStatus() {
    this.stats.quotaExhausted = false;
    console.log('✅ Quota status reset');
  }
}

module.exports = new DualAPIService();
