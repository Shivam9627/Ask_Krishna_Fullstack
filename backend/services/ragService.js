const fs = require('fs');
const path = require('path');

// For now, we'll create a smart RAG system without heavy PDF dependencies
// We can extract text from PDF using a buffer reading approach or convert it separately

// Simple in-memory vector store for text search
class SimpleVectorStore {
  constructor() {
    this.documents = [];
    this.ids = [];
  }

  async add(docs, ids) {
    this.documents = docs;
    this.ids = ids;
    console.log(`✅ Indexed ${docs.length} document chunks`);
  }

  async query(text, topK = 5) {
    if (this.documents.length === 0) return [];
    
    // Simple keyword-based matching
    const queryTerms = text.toLowerCase().split(/\s+/).filter(t => t.length > 3);
    
    const scores = this.documents.map((doc, idx) => {
      const docText = doc.toLowerCase();
      let score = 0;
      
      queryTerms.forEach(term => {
        // Count occurrences
        const regex = new RegExp(`\\b${term}\\w*\\b`, 'g');
        const matches = docText.match(regex);
        score += (matches ? matches.length * 2 : 0);
      });
      
      return { idx, score, doc };
    });

    return scores
      .filter(s => s.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, topK)
      .map(s => s.doc);
  }
}

class RAGService {
  constructor() {
    this.pdfPath = path.join(__dirname, '../../Bhagavad-gita.pdf');
    this.vectorStore = new SimpleVectorStore();
    this.isInitialized = false;
    this.chunkSize = 800; // characters per chunk
  }

  /**
   * Initialize the RAG system
   */
  async initialize() {
    try {
      if (this.isInitialized) return;

      console.log('🚀 Initializing RAG system...');
      await this.loadAndProcessPDF();

      this.isInitialized = true;
      console.log('✅ RAG system ready for queries');
    } catch (error) {
      console.error('❌ Error initializing RAG:', error.message);
      throw error;
    }
  }

  /**
   * Load PDF and create vector store
   */
  async loadAndProcessPDF() {
    try {
      console.log('📖 Loading Bhagavad Gita PDF...');
      
      // Read PDF file as buffer
      const fileBuffer = fs.readFileSync(this.pdfPath);
      console.log(`📄 PDF file size: ${Math.round(fileBuffer.length / 1024)}KB`);

      // Extract text from PDF buffer (simple approach)
      // Note: For better PDF extraction, use pdfjs-dist or similar
      const textPath = path.join(__dirname, '../data/gita-text.txt');
      
      // Check if we have a pre-extracted text file
      let fullText;
      if (fs.existsSync(textPath)) {
        fullText = fs.readFileSync(textPath, 'utf-8');
        console.log('✅ Using pre-extracted text file');
      } else {
        // Attempt to extract using pdf-parse if available
        try {
          const pdf = require('pdf-parse');
          const pdfData = await pdf(fileBuffer);
          fullText = pdfData.text;
          // Save extracted text for future use
          if (!fs.existsSync(path.dirname(textPath))) {
            fs.mkdirSync(path.dirname(textPath), { recursive: true });
          }
          fs.writeFileSync(textPath, fullText);
        } catch (pdfError) {
          // If pdf-parse fails, create default content
          console.warn('⚠️  PDF extraction failed, using knowledge base only');
          fullText = 'Bhagavad Gita - Sacred Hindu Scripture. Please ask your questions about dharma, karma, yoga, and spirituality.';
        }
      }

      console.log(`📄 Text loaded: ${Math.round(fullText.length / 1024)}KB`);

      // Chunk the text
      const chunks = this.chunkText(fullText);
      console.log(`✂️  Created ${chunks.length} searchable chunks`);

      // Add to vector store
      const ids = chunks.map((_, idx) => `chunk-${idx}`);
      await this.vectorStore.add(chunks, ids);

      console.log('✅ Text indexed and ready for RAG');
    } catch (error) {
      console.error('❌ Error processing PDF:', error.message);
      throw error;
    }
  }

  /**
   * Split text into chunks with overlap
   */
  chunkText(text) {
    const chunks = [];
    
    // Split by double newlines first (paragraphs)
    const paragraphs = text
      .split(/\n\n+/)
      .map(p => p.trim())
      .filter(p => p.length > 20);

    let currentChunk = '';

    for (const para of paragraphs) {
      const combined = currentChunk + (currentChunk ? '\n\n' : '') + para;
      
      if (combined.length <= this.chunkSize) {
        currentChunk = combined;
      } else {
        if (currentChunk) {
          chunks.push(currentChunk);
        }
        currentChunk = para;
      }
    }

    if (currentChunk) {
      chunks.push(currentChunk);
    }

    // Filter out very small chunks
    return chunks.filter(c => c.length > 100);
  }

  /**
   * Search for relevant context
   */
  async search(query, topK = 5) {
    try {
      const results = await this.vectorStore.query(query, topK);

      if (!results || results.length === 0) {
        return [];
      }

      return results.map((doc, idx) => ({
        content: doc,
        relevance: idx
      }));
    } catch (error) {
      console.error('❌ Search error:', error.message);
      return [];
    }
  }

  /**
   * Format chunks into context for Gemini
   */
  formatContext(chunks) {
    if (!chunks || chunks.length === 0) {
      return '';
    }

    return chunks
      .map((chunk, idx) => `**Reference ${idx + 1}:**\n${chunk.content}`)
      .join('\n\n---\n\n');
  }

  /**
   * Get RAG answer
   */
  async getRAGAnswer(question) {
    try {
      if (!this.isInitialized) {
        await this.initialize();
      }

      console.log(`🔍 Searching PDF for: "${question.substring(0, 50)}..."`);
      const relevantChunks = await this.search(question, 5);

      if (relevantChunks.length === 0) {
        console.log('⚠️  No relevant content found in PDF');
        return null;
      }

      const context = this.formatContext(relevantChunks);
      return { context, chunks: relevantChunks };
    } catch (error) {
      console.error('❌ RAG error:', error.message);
      return null;
    }
  }

  /**
   * Check if ready
   */
  isReady() {
    return this.isInitialized;
  }
}

module.exports = new RAGService();
