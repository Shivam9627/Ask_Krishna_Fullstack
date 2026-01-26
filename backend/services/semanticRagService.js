const fs = require('fs');
const path = require('path');

/**
 * Advanced Semantic RAG Service
 * Uses sentence transformers for semantic similarity
 * This is the professional approach used in production RAG systems
 */

class SemanticRAGService {
  constructor() {
    this.pdfPath = path.join(__dirname, '../../Bhagavad-gita.pdf');
    this.dataDir = path.join(__dirname, '../data');
    this.chunks = [];
    this.embeddings = [];
    this.isInitialized = false;
    this.isEmbeddingReady = false;
    
    // Create data directory
    if (!fs.existsSync(this.dataDir)) {
      fs.mkdirSync(this.dataDir, { recursive: true });
    }
  }

  /**
   * Initialize the semantic RAG system
   */
  async initialize() {
    try {
      if (this.isInitialized) return;

      console.log('🚀 Initializing Semantic RAG System...');
      
      // Step 1: Extract or load text
      const text = await this.loadOrExtractText();
      
      // Step 2: Semantic chunking
      this.chunks = await this.semanticChunking(text);
      console.log(`✂️  Created ${this.chunks.length} semantic chunks`);
      
      // Step 3: Initialize embeddings in background
      this.initializeEmbeddings();
      
      this.isInitialized = true;
      console.log('✅ Semantic RAG initialized');
    } catch (error) {
      console.error('❌ RAG initialization error:', error.message);
      throw error;
    }
  }

  /**
   * Load or extract text from PDF
   */
  async loadOrExtractText() {
    try {
      const cachedPath = path.join(this.dataDir, 'gita-text.txt');
      
      // Try cached text first
      if (fs.existsSync(cachedPath)) {
        console.log('📖 Using cached text');
        const text = fs.readFileSync(cachedPath, 'utf-8');
        return text;
      }
      
      // Try PDF extraction
      try {
        console.log('📖 Extracting from PDF...');
        const pdf = require('pdf-parse');
        const fileBuffer = fs.readFileSync(this.pdfPath);
        const pdfData = await pdf(fileBuffer);
        const text = pdfData.text;
        
        // Cache it
        fs.writeFileSync(cachedPath, text);
        console.log('✅ PDF extracted and cached');
        return text;
      } catch (pdfError) {
        console.warn('⚠️  PDF extraction failed, using fallback');
        return this.loadFallbackText();
      }
    } catch (error) {
      console.error('❌ Text loading error:', error.message);
      return this.loadFallbackText();
    }
  }

  /**
   * Load fallback text
   */
  loadFallbackText() {
    // Comprehensive fallback content about Bhagavad Gita
    return `
Bhagavad Gita - The Song of the Lord

Chapter 2: Sankhya Yoga (The Yoga of Knowledge)

Verse 47: You have a right to perform your prescribed duty, but you are not entitled to the fruits of action. Never consider yourself the cause of the results of your activities, and never be attached to not doing your duty.

The Concept of Karma:
Karma is the universal law of cause and effect. Every action has consequences. Lord Krishna teaches Arjuna that one should focus on performing their duty (dharma) without attachment to the results. This is the essence of Karma Yoga.

Chapter 3: Karma Yoga (The Yoga of Action)

Work without attachment to results is the path to liberation. When you perform your duties with full dedication but without expecting rewards, you achieve spiritual peace and inner harmony.

The teaching emphasizes that action is necessary - even inaction is a form of action. One cannot achieve enlightenment by avoiding work, but by transforming the nature of work through proper understanding and detachment.

Chapter 4: Jnana Yoga (The Yoga of Knowledge)

Knowledge is the supreme purifier. Lord Krishna explains that through true knowledge, one transcends the cycle of birth and death. This knowledge is not intellectual but experiential understanding of the nature of reality.

Chapter 5: Karma Sannyasa Yoga (The Yoga of Renunciation)

Renunciation of the fruits of action is superior to renouncing action itself. A wise person performs all necessary actions but remains unattached to the outcomes.

Chapter 6: Dhyana Yoga (The Yoga of Meditation)

Meditation is the practice of withdrawing the mind from worldly distractions and focusing it inward. Through regular meditation practice, one develops clarity, peace, and spiritual advancement.

Steps for meditation:
1. Find a quiet place
2. Sit in a comfortable posture
3. Control your breathing
4. Withdraw senses from external objects
5. Focus on a point of concentration
6. Maintain steady awareness

Chapter 7: Jnana Vijnana Yoga (The Yoga of Knowledge and Wisdom)

The highest knowledge is understanding the nature of the divine. All manifestations in the universe come from the divine consciousness. Understanding this truth brings liberation.

Chapter 9: Raja Vidya Yoga (The Yoga of Royal Knowledge)

This is the king of secrets, the highest knowledge. It purifies, dispels darkness, and bestows supreme peace and eternal bliss.

Chapter 10: Vibhuti Yoga (The Yoga of Manifestations)

The divine manifests in everything. All virtues, all beauty, all strength come from the divine. By recognizing the divine in all things, one develops devotion and wisdom.

Chapter 12: Bhakti Yoga (The Yoga of Devotion)

The path of devoted love is the easiest path to the divine. Through pure devotion, surrender, and love, one achieves the highest goal. Devotion includes:
- Listening to divine teachings
- Chanting and singing prayers
- Remembering the divine constantly
- Serving others as service to the divine
- Complete surrender

Chapter 13: Ksetra Ksetrajna Yoga (The Yoga of the Field and the Knower)

Understanding the difference between the field (body/matter) and the knower (consciousness) is fundamental. The eternal soul observes the body and its changes without being affected.

Chapter 14: Guna Triya Yoga (The Yoga of the Three Gunas)

All nature operates through three qualities:
1. Sattva - purity, knowledge, harmony
2. Rajas - activity, passion, desire
3. Tamas - ignorance, inertia, darkness

By understanding these qualities, one transcends them and achieves liberation.

Chapter 15: Purusottama Yoga (The Yoga of the Supreme Being)

Understanding the supreme reality - that which transcends the material and spiritual worlds - is the highest knowledge. Recognition of this truth brings freedom and eternal peace.

Chapter 18: Moksha Sannyasa Yoga (The Yoga of Liberation Through Renunciation)

The ultimate teaching - perform your duty without attachment, surrender the fruits of action to the divine, maintain equanimity in success and failure. This is the path to liberation and eternal happiness.

Core Teachings of Bhagavad Gita:

1. Dharma (Duty): Everyone has a duty suited to their nature and position. Fulfilling this duty with proper attitude leads to spiritual progress.

2. Karma Yoga: Action without attachment to results. Performing work as a service to humanity and the divine.

3. Bhakti (Devotion): Pure love and devotion toward the divine. Surrendering one's life and actions to a higher power.

4. Jnana (Knowledge): Understanding the nature of reality, the eternal soul, and the divine consciousness.

5. Meditation and Self-discipline: Regular practice of meditation and control of senses leads to inner peace and spiritual awakening.

6. Equanimity: Maintaining a balanced mind in both success and failure, pleasure and pain.

7. Universal Love: Recognizing the divine in all beings and treating all with compassion and respect.

The Essence:
The Bhagavad Gita teaches that through understanding our true nature, performing our duties with proper attitude, developing devotion, and maintaining spiritual practices, we can achieve liberation and eternal peace while living in this world.
    `.trim();
  }

  /**
   * Semantic chunking - split text into meaningful chunks
   */
  async semanticChunking(text) {
    const chunks = [];
    
    // First, split by major sections (chapters, verses)
    const sections = text.split(/Chapter \d+:|Verse \d+:|^\d+\.|^[A-Z][A-Z\s]+$/m);
    
    let currentChunk = '';
    const maxChunkLength = 800; // characters per chunk

    for (const section of sections) {
      const trimmed = section.trim();
      
      if (!trimmed) continue;

      // If adding this section keeps us under the limit, add it
      if ((currentChunk + ' ' + trimmed).length <= maxChunkLength) {
        currentChunk += (currentChunk ? ' ' : '') + trimmed;
      } else {
        // Current chunk is full, save it and start new one
        if (currentChunk.length > 100) {
          chunks.push(currentChunk);
        }
        currentChunk = trimmed;
      }
    }

    // Don't forget the last chunk
    if (currentChunk.length > 100) {
      chunks.push(currentChunk);
    }

    // Further split very large chunks using sentence boundaries
    const finalChunks = [];
    for (const chunk of chunks) {
      if (chunk.length > 1000) {
        // Split by sentences
        const sentences = chunk.match(/[^.!?]+[.!?]+/g) || [chunk];
        let sentence_chunk = '';
        
        for (const sentence of sentences) {
          if ((sentence_chunk + sentence).length <= 800) {
            sentence_chunk += sentence;
          } else {
            if (sentence_chunk.length > 50) finalChunks.push(sentence_chunk.trim());
            sentence_chunk = sentence;
          }
        }
        if (sentence_chunk.length > 50) finalChunks.push(sentence_chunk.trim());
      } else {
        finalChunks.push(chunk);
      }
    }

    return finalChunks.filter(c => c.length > 50);
  }

  /**
   * Initialize embeddings (in background, non-blocking)
   */
  initializeEmbeddings() {
    // Generate embeddings asynchronously
    this.generateEmbeddings().then(() => {
      this.isEmbeddingReady = true;
      console.log('🧠 Semantic embeddings ready');
    }).catch(err => {
      console.warn('⚠️  Embedding generation skipped:', err.message);
      console.log('📌 System will use keyword-based search instead');
      this.isEmbeddingReady = false;
    });
  }

  /**
   * Generate embeddings using Hugging Face transformers
   */
  async generateEmbeddings() {
    try {
      console.log('🔧 Generating semantic embeddings...');
      
      const { pipeline } = await import('@xenova/transformers');
      
      // Initialize embeddings pipeline
      const embeddingsPipeline = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');
      
      console.log('📊 Creating embeddings for chunks...');
      
      this.embeddings = [];
      for (let i = 0; i < this.chunks.length; i++) {
        if (i % 10 === 0) {
          console.log(`  Processing chunk ${i + 1}/${this.chunks.length}...`);
        }
        
        const embedding = await embeddingsPipeline(this.chunks[i], { pooling: 'mean', normalize: true });
        
        // Convert to array and normalize
        this.embeddings.push(Array.from(embedding.data));
      }
      
      console.log(`✅ Generated embeddings for ${this.chunks.length} chunks`);
      return true;
    } catch (error) {
      console.warn('⚠️  Embedding generation failed:', error.message);
      return false;
    }
  }

  /**
   * Semantic similarity search using cosine distance
   */
  cosineSimilarity(a, b) {
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;
    
    for (let i = 0; i < a.length; i++) {
      dotProduct += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }
    
    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  }

  /**
   * Search using semantic similarity or keyword fallback
   */
  async search(query, topK = 5) {
    if (!this.isInitialized) {
      await this.initialize();
    }

    try {
      // If embeddings are ready, use semantic search
      if (this.isEmbeddingReady && this.embeddings.length > 0) {
        return await this.semanticSearch(query, topK);
      } else {
        // Fall back to keyword search
        return this.keywordSearch(query, topK);
      }
    } catch (error) {
      console.error('❌ Search error:', error.message);
      return this.keywordSearch(query, topK);
    }
  }

  /**
   * Semantic search using embeddings
   */
  async semanticSearch(query, topK = 5) {
    try {
      const { pipeline } = await import('@xenova/transformers');
      const embeddingsPipeline = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');
      
      // Get query embedding
      const queryEmbedding = await embeddingsPipeline(query, { pooling: 'mean', normalize: true });
      const queryVector = Array.from(queryEmbedding.data);
      
      // Calculate similarities
      const similarities = this.embeddings.map((embedding, idx) => ({
        idx,
        content: this.chunks[idx],
        similarity: this.cosineSimilarity(queryVector, embedding)
      }));

      // Sort by similarity and return top K
      return similarities
        .sort((a, b) => b.similarity - a.similarity)
        .slice(0, topK)
        .map(item => ({ content: item.content }));
    } catch (error) {
      console.warn('Semantic search failed, using keyword search:', error.message);
      return this.keywordSearch(query, topK);
    }
  }

  /**
   * Keyword-based search fallback
   */
  keywordSearch(query, topK = 5) {
    const queryTerms = query.toLowerCase().split(/\s+/).filter(t => t.length > 2);
    
    const scores = this.chunks.map((chunk, idx) => {
      const chunkLower = chunk.toLowerCase();
      let score = 0;
      
      queryTerms.forEach(term => {
        // Exact word match
        const exactMatches = (chunkLower.match(new RegExp(`\\b${term}\\b`, 'g')) || []).length;
        score += exactMatches * 3;
        
        // Substring match
        if (chunkLower.includes(term)) {
          score += 1;
        }
      });

      return { idx, content: chunk, score };
    });

    return scores
      .filter(s => s.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, topK)
      .map(item => ({ content: item.content }));
  }

  /**
   * Get RAG answer with context
   */
  async getRAGAnswer(question) {
    try {
      if (!this.isInitialized) {
        await this.initialize();
      }

      console.log(`🔍 Semantic search: "${question.substring(0, 50)}..."`);
      const relevantChunks = await this.search(question, 5);

      if (relevantChunks.length === 0) {
        return null;
      }

      const context = relevantChunks
        .map((chunk, idx) => `**[Source ${idx + 1}]**\n${chunk.content}`)
        .join('\n\n---\n\n');

      return { context, chunks: relevantChunks };
    } catch (error) {
      console.error('❌ RAG error:', error.message);
      return null;
    }
  }

  /**
   * Check status
   */
  getStatus() {
    return {
      initialized: this.isInitialized,
      chunksCount: this.chunks.length,
      embeddingsReady: this.isEmbeddingReady,
      searchMode: this.isEmbeddingReady ? 'semantic' : 'keyword'
    };
  }

  isReady() {
    return this.isInitialized;
  }
}

module.exports = new SemanticRAGService();
