const { GoogleGenerativeAI } = require('@google/generative-ai');
const crypto = require('crypto');
const { findAnswer, getAvailableTopics } = require('./bhagavadGitaKB');
const pdfService = require('./pdfService');
const semanticRagService = require('./semanticRagService');

class GeminiService {
  constructor() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.warn('⚠️  GEMINI_API_KEY not found in environment variables');
    }
    this.genAI = apiKey ? new GoogleGenerativeAI(apiKey) : null;
    this.model = null;
    
    if (this.genAI) {
      try {
        this.model = this.genAI.getGenerativeModel({ model: 'gemini-pro' });
      } catch (e) {
        console.warn('⚠️  gemini-pro not available');
      }
    }

    // Initialize PDF loading
    this.initializePDF();

    // Rate limiting and caching
    this.responseCache = new Map(); // Cache responses
    this.requestQueue = []; // Queue for pending requests
    this.isProcessing = false;
    this.rateLimitDelay = 2000; // 2 seconds between requests (reduced from 60)
    this.lastRequestTime = 0;
    this.maxRetries = 5; // Increased retries (was 3)
  }

  /**
   * Initialize PDF and RAG in background
   */
  initializePDF() {
    // Initialize Semantic RAG system asynchronously
    semanticRagService.initialize().then(() => {
      console.log('🧠 Semantic RAG system ready');
    }).catch(err => {
      console.warn('⚠️  Semantic RAG warning:', err.message);
    });

    pdfService.loadPDF().then(() => {
      console.log('📚 Bhagavad Gita PDF ready');
    }).catch(err => {
      console.warn('⚠️  PDF loading failed:', err.message);
    });
  }

  /**
   * Generate a hash key for caching
   */
  generateCacheKey(prompt, language) {
    return crypto.createHash('md5').update(`${prompt}:${language}`).digest('hex');
  }

  /**
   * Get cached response if available
   */
  getCachedResponse(prompt, language) {
    const key = this.generateCacheKey(prompt, language);
    return this.responseCache.get(key);
  }

  /**
   * Cache a response
   */
  cacheResponse(prompt, language, response) {
    const key = this.generateCacheKey(prompt, language);
    this.responseCache.set(key, response);
    // Auto-clear cache after 24 hours
    setTimeout(() => this.responseCache.delete(key), 24 * 60 * 60 * 1000);
  }

  /**
   * Wait for rate limit
   */
  async waitForRateLimit() {
    const timeSinceLastRequest = Date.now() - this.lastRequestTime;
    if (timeSinceLastRequest < this.rateLimitDelay) {
      const delayNeeded = this.rateLimitDelay - timeSinceLastRequest;
      console.log(`⏳ Rate limiting: waiting ${Math.ceil(delayNeeded / 1000)}s...`);
      await new Promise(resolve => setTimeout(resolve, delayNeeded));
    }
  }

  /**
   * Generate a response with retry logic and rate limiting
   */
  async generateResponse(prompt, language = 'english') {
    if (!this.model) {
      throw new Error('Gemini API key not configured. Please set GEMINI_API_KEY in your .env file');
    }

    // Check cache first
    const cachedResponse = this.getCachedResponse(prompt, language);
    if (cachedResponse) {
      console.log('✅ Returning cached response (fast!)');
      return cachedResponse;
    }

    // Direct API call with semantic RAG for intelligent responses
    return new Promise((resolve, reject) => {
      this.requestQueue.push({ 
        prompt, 
        language, 
        resolve, 
        reject,
        useRAG: true  // Flag to use RAG for intelligent answers
      });
      this.processQueue();
    });
  }

  /**
   * Process the request queue with rate limiting
   */
  async processQueue() {
    if (this.isProcessing || this.requestQueue.length === 0) {
      return;
    }

    this.isProcessing = true;

    while (this.requestQueue.length > 0) {
      const { prompt, language, resolve, reject, useRAG } = this.requestQueue.shift();

      try {
        // Wait for rate limit
        await this.waitForRateLimit();

        // Generate response using Semantic RAG
        let response;
        if (useRAG && semanticRagService.isReady()) {
          console.log('🧠 Using Semantic RAG for intelligent context...');
          response = await this.generateWithSemanticRAG(prompt, language);
        } else {
          response = await this.generateWithRetry(prompt, language);
        }
        
        // Cache the response
        this.cacheResponse(prompt, language, response);
        
        this.lastRequestTime = Date.now();
        resolve(response);
      } catch (error) {
        console.error('Gemini API Error:', error.message);
        
        // For any error, try to resolve with API response
        // Don't give up on quota errors - let user try again with fresh retry
        reject(error);
      }
    }

    this.isProcessing = false;
  }

  /**
   * Generate response using Semantic RAG (Retrieval Augmented Generation)
   */
  async generateWithSemanticRAG(prompt, language = 'english', retryCount = 0) {
    try {
      // Get relevant context using semantic search
      const ragResult = await semanticRagService.getRAGAnswer(prompt);
      
      if (!ragResult || !ragResult.context) {
        // Fallback to standard generation if RAG fails
        console.log('⚠️  Semantic RAG context not found, using standard generation');
        return this.generateWithRetry(prompt, language);
      }

      // Create prompt with semantic context
      const systemPrompt = language === 'hindi'
        ? `आप एक ज्ञानी आध्यात्मिक गुरु हैं जो भगवद गीता की गहन शिक्षाओं के आधार पर सहायक, संरचित उत्तर देते हैं।

**भगवद गीता से प्रासंगिक ज्ञान:**
${ragResult.context}

**उपयोगकर्ता का प्रश्न:** ${prompt}

**निर्देश:**
1. उपर्युक्त ज्ञान का उपयोग करके एक विस्तृत, गहन और सहायक उत्तर दें
2. ChatGPT जैसी शैली में उत्तर दें - स्पष्ट, व्यवस्थित, सुव्यवस्थित और सुपाठ्य
3. ## शीर्षक और * बुलेट बिंदु का उपयोग करें
4. प्रासंगिक श्लोक संख्या और शिक्षाओं को उद्धृत करें
5. आधुनिक जीवन से संबंधित व्यावहारिक उदाहरण दें
6. प्रत्येक उत्तर को अद्वितीय और विचारशील बनाएं
7. हिंदी में सरल, प्रवाहमय और समझने योग्य भाषा का उपयोग करें
8. लंबे पैराग्राफ के बजाय छोटे, केंद्रित अनुभाग बनाएं`
        : `You are a wise spiritual teacher deeply knowledgeable about Bhagavad Gita teachings. Provide comprehensive, insightful answers that are well-structured and professionally formatted.

**Relevant Knowledge from Bhagavad Gita:**
${ragResult.context}

**User's Question:** ${prompt}

**Instructions:**
1. Provide a comprehensive, insightful answer using the above context
2. Format response like ChatGPT - clear, organized, professional, and easy to read
3. Use ## headings and * bullet points for structure
4. Quote relevant verses and teachings from the context
5. Provide practical examples from modern life
6. Make each response unique and thoughtfully crafted
7. Be conversational and engaging, not academic
8. Use clear sections rather than long paragraphs
9. Include practical wisdom that readers can apply
10. Ensure the response feels like a natural conversation`;

      const result = await this.model.generateContent(systemPrompt);
      const response = await result.response;
      const text = response.text();

      console.log('✅ Semantic RAG response generated successfully');
      return text;
    } catch (error) {
      console.error(`❌ Semantic RAG error at retry ${retryCount}/${this.maxRetries}: ${error.message}`);
      
      if (retryCount < this.maxRetries && error.message && error.message.includes('429')) {
        // Exponential backoff with jitter for rate limits
        const backoffDelay = Math.pow(2, retryCount) * 1000 + Math.random() * 1000;
        console.log(`🔄 Semantic RAG Retry ${retryCount + 1}/${this.maxRetries} - waiting ${(backoffDelay / 1000).toFixed(1)}s...`);
        await new Promise(resolve => setTimeout(resolve, backoffDelay));
        return this.generateWithSemanticRAG(prompt, language, retryCount + 1);
      }
      
      // Fall back to standard generation
      console.log('⚠️  Semantic RAG error, falling back to standard generation');
      return this.generateWithRetry(prompt, language);
    }
  }
  async generateWithRetry(prompt, language, retryCount = 0) {
    try {
      const systemPrompt = language === 'hindi' 
        ? `आप एक ज्ञानी और करुणामय गुरु हैं जो भगवद गीता के शिक्षाओं के आधार पर मार्गदर्शन प्रदान करते हैं। 
        आपके उत्तर भगवद गीता के अध्यायों और श्लोकों के संदर्भ में होने चाहिए।
        उत्तर देते समय:
        1. प्रासंगिक अध्याय और श्लोक संख्या का उल्लेख करें
        2. व्यावहारिक जीवन की स्थितियों से जोड़ें
        3. स्पष्ट और समझने योग्य भाषा में समझाएं
        4. करुणा और ज्ञान के साथ उत्तर दें
        5. यदि संबंधित श्लोक याद है तो उसका उल्लेख करें
        
        उपयोगकर्ता का प्रश्न: ${prompt}
        
        कृपया भगवद गीता के दृष्टिकोण से एक विस्तृत और सहायक उत्तर प्रदान करें।`
        
        : `You are a wise and compassionate spiritual guide who provides guidance based on the teachings of the Bhagavad Gita. 
        Your answers should be based on the chapters and verses of the Bhagavad Gita.
        When answering:
        1. Mention relevant chapter and verse numbers when applicable
        2. Connect teachings to practical life situations
        3. Explain in clear and understandable language
        4. Provide answers with compassion and wisdom
        5. Reference specific verses if relevant to the question
        
        User's question: ${prompt}
        
        Please provide a detailed and helpful answer from the perspective of the Bhagavad Gita.`;

      const result = await this.model.generateContent(systemPrompt);
      const response = await result.response;
      const text = response.text();

      console.log('✅ Response generated successfully');
      return text;
    } catch (error) {
      console.error(`❌ Error at retry ${retryCount}/${this.maxRetries}: ${error.message}`);
      
      if (retryCount < this.maxRetries && error.message && error.message.includes('429')) {
        // Exponential backoff with jitter: 1s, 2s, 4s, 8s, 16s
        const backoffDelay = Math.pow(2, retryCount) * 1000 + Math.random() * 1000;
        console.log(`🔄 Retry ${retryCount + 1}/${this.maxRetries} - waiting ${(backoffDelay / 1000).toFixed(1)}s...`);
        await new Promise(resolve => setTimeout(resolve, backoffDelay));
        return this.generateWithRetry(prompt, language, retryCount + 1);
      }
      
      if (retryCount < this.maxRetries && !error.message?.includes('429')) {
        // Also retry on other errors (network issues, etc)
        const backoffDelay = Math.pow(2, retryCount) * 500;
        console.log(`🔄 Retrying on error - waiting ${backoffDelay / 1000}s...`);
        await new Promise(resolve => setTimeout(resolve, backoffDelay));
        return this.generateWithRetry(prompt, language, retryCount + 1);
      }
      
      throw error;
    }
  }

  /**
   * Check if Gemini API is configured
   */
  isConfigured() {
    return this.model !== null;
  }
}

// Export singleton instance
module.exports = new GeminiService();
