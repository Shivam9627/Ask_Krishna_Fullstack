#!/usr/bin/env node

/**
 * PDF Text Extraction Script
 * Run this once to extract text from the Bhagavad Gita PDF
 * Usage: node extract-pdf-text.js
 */

const fs = require('fs');
const path = require('path');

async function extractPDFText() {
  try {
    console.log('🚀 Extracting text from Bhagavad Gita PDF...\n');

    const pdfPath = path.join(__dirname, './Bhagavad-gita.pdf');
    const outputPath = path.join(__dirname, './backend/data/gita-text.txt');

    // Ensure output directory exists
    const outputDir = path.dirname(outputPath);
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
      console.log(`✅ Created directory: ${outputDir}`);
    }

    try {
      // Try using pdf-parse
      const pdf = require('pdf-parse');
      const fileBuffer = fs.readFileSync(pdfPath);
      
      console.log('📖 Reading PDF file...');
      const pdfData = await pdf(fileBuffer);
      
      const extractedText = pdfData.text;
      console.log(`✅ Extracted ${extractedText.length} characters from PDF`);
      
      // Save to file
      fs.writeFileSync(outputPath, extractedText);
      console.log(`✅ Saved to: ${outputPath}`);
      
      // Show preview
      console.log('\n📄 Preview (first 500 characters):');
      console.log('---');
      console.log(extractedText.substring(0, 500));
      console.log('---\n');
      
      console.log('✅ PDF text extraction complete!');
      console.log('📚 The RAG system will now use this extracted text for intelligent responses.\n');
      
    } catch (pdfError) {
      console.error('❌ pdf-parse failed:', pdfError.message);
      console.log('\n💡 Alternative: You can convert the PDF to text manually:');
      console.log('   1. Open Bhagavad-gita.pdf in your PDF reader');
      console.log('   2. Select all text (Ctrl+A)');
      console.log('   3. Copy to clipboard (Ctrl+C)');
      console.log('   4. Paste into a new file: backend/data/gita-text.txt');
      console.log('   5. Restart the backend server\n');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

// Run if executed directly
if (require.main === module) {
  extractPDFText();
}

module.exports = { extractPDFText };
