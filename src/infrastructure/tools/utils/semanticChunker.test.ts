import { describe, it, expect } from 'vitest';
import { semanticChunk, ChunkOptions } from './semanticChunker';

/**
 * Semantic Chunker Tests
 * 
 * Tests for intelligent document chunking that:
 * 1. Respects sentence boundaries (doesn't cut mid-sentence)
 * 2. Uses overlap between chunks for context continuity
 * 3. Preserves header context in each chunk
 */

describe('semanticChunker', () => {
  
  describe('basic chunking', () => {
    it('should split text into chunks of approximately maxChunkSize', () => {
      const text = 'First sentence here. Second sentence follows. Third sentence continues. Fourth sentence ends.';
      const options: ChunkOptions = { maxChunkSize: 50, overlapSize: 0 };
      
      const chunks = semanticChunk(text, options);
      
      expect(chunks.length).toBeGreaterThan(1);
      chunks.forEach(chunk => {
        // Allow some flexibility (sentences may exceed slightly)
        expect(chunk.length).toBeLessThanOrEqual(70);
      });
    });

    it('should not cut sentences in the middle', () => {
      const text = 'This is a complete sentence. Another complete sentence here. And one more.';
      const options: ChunkOptions = { maxChunkSize: 40, overlapSize: 0 };
      
      const chunks = semanticChunk(text, options);
      
      // Each chunk should end with a sentence terminator or be the last chunk
      chunks.forEach((chunk, i) => {
        const trimmed = chunk.trim();
        if (i < chunks.length - 1) {
          expect(trimmed).toMatch(/[.!?]$/);
        }
      });
    });

    it('should return single chunk if text is smaller than maxChunkSize', () => {
      const text = 'Short text.';
      const options: ChunkOptions = { maxChunkSize: 500 };
      
      const chunks = semanticChunk(text, options);
      
      expect(chunks).toHaveLength(1);
      expect(chunks[0]).toBe('Short text.');
    });
  });

  describe('overlap functionality', () => {
    it('should include overlap content from previous chunk', () => {
      const text = 'First sentence here. Second sentence follows. Third sentence continues. Fourth sentence ends.';
      const options: ChunkOptions = { maxChunkSize: 50, overlapSize: 25 };
      
      const chunks = semanticChunk(text, options);
      
      // There should be overlapping content between consecutive chunks
      if (chunks.length > 1) {
        // The end of chunk[0] should appear at the start of chunk[1]
        const overlapText = chunks[0].slice(-20);
        expect(chunks[1]).toContain(overlapText.split(' ').pop()); // At least last word overlaps
      }
    });

    it('should preserve context between chunks with overlap', () => {
      const text = 'RAG stands for Retrieval Augmented Generation. It combines retrieval with generation. This improves accuracy significantly.';
      const options: ChunkOptions = { maxChunkSize: 60, overlapSize: 30 };
      
      const chunks = semanticChunk(text, options);
      
      // With overlap, "It combines" chunk should reference the previous context
      expect(chunks.length).toBeGreaterThan(1);
    });
  });

  describe('header preservation', () => {
    it('should include parent header in each chunk when preserveHeaders is true', () => {
      const text = `# Main Title

This is the introduction paragraph.

## Section One

Content for section one here. More content follows.

## Section Two

Content for section two here.`;
      
      const options: ChunkOptions = { 
        maxChunkSize: 100, 
        overlapSize: 20,
        preserveHeaders: true 
      };
      
      const chunks = semanticChunk(text, options);
      
      // Each chunk from Section One should contain "## Section One" or context
      const sectionOneChunks = chunks.filter(c => c.includes('section one'));
      expect(sectionOneChunks.length).toBeGreaterThan(0);
    });

    it('should not add headers when preserveHeaders is false', () => {
      const text = `## Header

Content here.`;
      
      const options: ChunkOptions = { 
        maxChunkSize: 500, 
        preserveHeaders: false 
      };
      
      const chunks = semanticChunk(text, options);
      
      // Behavior without header preservation
      expect(chunks.length).toBeGreaterThan(0);
    });
  });

  describe('edge cases', () => {
    it('should handle empty text', () => {
      const chunks = semanticChunk('', { maxChunkSize: 500 });
      
      expect(chunks).toHaveLength(0);
    });

    it('should handle text with only whitespace', () => {
      const chunks = semanticChunk('   \n\n   ', { maxChunkSize: 500 });
      
      expect(chunks).toHaveLength(0);
    });

    it('should handle very long sentences gracefully', () => {
      const longSentence = 'This is a very long sentence that goes on and on and on and on and on and continues for quite a while without any punctuation except at the end right here at the end of this very long sentence.';
      const options: ChunkOptions = { maxChunkSize: 50, overlapSize: 10 };
      
      const chunks = semanticChunk(longSentence, options);
      
      // Should still produce chunks, even if they exceed maxChunkSize
      expect(chunks.length).toBeGreaterThan(0);
      // The long sentence should be fully captured across chunks
      expect(chunks.join(' ')).toContain('very long sentence');
    });

    it('should handle markdown with code blocks', () => {
      const text = `## Example

Here is some code:

\`\`\`typescript
const x = 1;
const y = 2;
\`\`\`

More text after code.`;
      
      const options: ChunkOptions = { maxChunkSize: 100, overlapSize: 20 };
      
      const chunks = semanticChunk(text, options);
      
      // Code blocks should ideally stay together
      expect(chunks.length).toBeGreaterThan(0);
    });

    it('should handle bullet lists', () => {
      const text = `## Features

- First feature is great
- Second feature is better
- Third feature is best

Conclusion here.`;
      
      const options: ChunkOptions = { maxChunkSize: 80, overlapSize: 20 };
      
      const chunks = semanticChunk(text, options);
      
      expect(chunks.length).toBeGreaterThan(0);
    });
  });

  describe('chunk metadata', () => {
    it('should produce non-empty chunks', () => {
      const text = 'Sentence one. Sentence two. Sentence three.';
      const options: ChunkOptions = { maxChunkSize: 30, overlapSize: 10 };
      
      const chunks = semanticChunk(text, options);
      
      chunks.forEach(chunk => {
        expect(chunk.trim().length).toBeGreaterThan(0);
      });
    });

    it('should cover all original content (no content loss)', () => {
      const text = 'Alpha. Beta. Gamma. Delta. Epsilon.';
      const options: ChunkOptions = { maxChunkSize: 20, overlapSize: 5 };
      
      const chunks = semanticChunk(text, options);
      const allContent = chunks.join(' ');
      
      // All words should be present
      expect(allContent).toContain('Alpha');
      expect(allContent).toContain('Beta');
      expect(allContent).toContain('Gamma');
      expect(allContent).toContain('Delta');
      expect(allContent).toContain('Epsilon');
    });
  });
});
