import { describe, it, expect, beforeEach, vi } from 'vitest';
import { LocalVectorKnowledgeBase } from './LocalVectorKnowledgeBase';

/**
 * Real RAG Tests - OpenAI Embeddings
 * 
 * Tests for the LocalVectorKnowledgeBase using OpenAI's text-embedding-3-small model.
 */

// Sample vectors for mocking embeddings (1536 dimensions for text-embedding-3-small)
const createMockVector = (seed: number): number[] => {
  return Array.from({ length: 1536 }, (_, i) => Math.sin(seed + i * 0.1));
};

// Hoist the mock function so it's available during vi.mock execution
const { mockEmbed } = vi.hoisted(() => ({
  mockEmbed: vi.fn(),
}));

// Mock the genkit module
vi.mock('genkit', () => ({
  genkit: vi.fn(() => ({
    embed: mockEmbed,
  })),
}));

// Mock genkitx-openai
vi.mock('genkitx-openai', () => ({
  openAI: vi.fn(() => ({})),
  textEmbedding3Small: 'text-embedding-3-small',
}));

// Mock fs module
vi.mock('fs', () => ({
  default: {
    existsSync: vi.fn(() => true),
    readFileSync: vi.fn(() => `# RAG Survey

Retrieval-Augmented Generation (RAG) is a technique that combines retrieval and generation.

## Advanced RAG

Advanced RAG improves upon naive RAG with pre-retrieval and post-retrieval strategies.

## Modular RAG

Modular RAG offers enhanced adaptability with specialized components like search and memory modules.`),
  },
  existsSync: vi.fn(() => true),
  readFileSync: vi.fn(() => `# RAG Survey

Retrieval-Augmented Generation (RAG) is a technique that combines retrieval and generation.

## Advanced RAG

Advanced RAG improves upon naive RAG with pre-retrieval and post-retrieval strategies.

## Modular RAG

Modular RAG offers enhanced adaptability with specialized components like search and memory modules.`),
}));

describe('LocalVectorKnowledgeBase - Real RAG with OpenAI Embeddings', () => {
  let knowledgeBase: LocalVectorKnowledgeBase;

  beforeEach(async () => {
    vi.clearAllMocks();
    
    // Default: Return embedding result for any content
    let seedCounter = 0;
    mockEmbed.mockImplementation(async () => {
      seedCounter++;
      return { embedding: createMockVector(seedCounter) };
    });
  });

  describe('constructor', () => {
    it('should trigger async indexing on instantiation', async () => {
      knowledgeBase = new LocalVectorKnowledgeBase();
      
      // Give time for async indexing to start
      await new Promise(r => setTimeout(r, 100));
      
      // The constructor should have initiated the indexing process
      expect(knowledgeBase).toBeDefined();
    });
  });

  describe('search', () => {
    it('should return string array of relevant chunks', async () => {
      // Setup: Make query vector similar to document vectors
      mockEmbed.mockImplementation(async () => {
        // All vectors are similar (same seed) to ensure high cosine similarity
        return { embedding: createMockVector(1) };
      });

      knowledgeBase = new LocalVectorKnowledgeBase();
      
      // Wait for indexing to complete
      await new Promise(r => setTimeout(r, 600));
      
      const results = await knowledgeBase.search('What is Modular RAG?');
      
      expect(Array.isArray(results)).toBe(true);
      expect(results.length).toBeGreaterThan(0);
      // Results should be strings, not SearchResult objects
      expect(typeof results[0]).toBe('string');
    });

    it('should return at most 3 chunks', async () => {
      // All similar vectors
      mockEmbed.mockResolvedValue({ embedding: createMockVector(1) });

      knowledgeBase = new LocalVectorKnowledgeBase();
      
      await new Promise(r => setTimeout(r, 600));
      
      const results = await knowledgeBase.search('RAG retrieval generation');
      
      expect(results.length).toBeLessThanOrEqual(3);
    });

    it('should return empty array for completely unrelated query', async () => {
      // Use a flag to differentiate document vs query embeddings
      // Document embeddings happen during indexing, query embedding happens in search()
      let indexingComplete = false;
      mockEmbed.mockImplementation(async () => {
        if (indexingComplete) {
          // Query vector is orthogonal: all elements are [1, -1, 1, -1, ...]
          // This creates near-zero cosine similarity with uniform vectors
          return { embedding: Array.from({ length: 1536 }, (_, i) => (i % 2 === 0 ? 1 : -1)) };
        }
        // Document vectors are uniform [1, 1, 1, 1, ...]
        return { embedding: Array.from({ length: 1536 }, () => 1) };
      });

      knowledgeBase = new LocalVectorKnowledgeBase();
      await new Promise(r => setTimeout(r, 600));
      
      // Mark indexing as complete before search
      indexingComplete = true;
      const results = await knowledgeBase.search('quantum physics black holes');
      
      // Cosine similarity with orthogonal vectors should be ~0, below 0.3 threshold
      expect(results.length).toBe(0);
    });

    it('should handle search when still indexing gracefully', async () => {
      // All similar vectors for consistent results
      mockEmbed.mockResolvedValue({ embedding: createMockVector(1) });
      
      knowledgeBase = new LocalVectorKnowledgeBase();
      
      // Search immediately - should wait for indexing to complete
      const results = await knowledgeBase.search('test query');
      
      // With proper await, search should now return results (not fail or return empty)
      expect(Array.isArray(results)).toBe(true);
      // Since all vectors are similar and index completes, we should get results
      expect(results.length).toBeGreaterThan(0);
    });
  });

  describe('cosineSimilarity', () => {
    it('should calculate correct cosine similarity between vectors', async () => {
      knowledgeBase = new LocalVectorKnowledgeBase();
      
      // Identical vectors should have similarity of 1
      const vecA = [1, 0, 0];
      const vecB = [1, 0, 0];
      expect(knowledgeBase.cosineSimilarity(vecA, vecB)).toBeCloseTo(1, 5);
      
      // Orthogonal vectors should have similarity of 0
      const vecC = [1, 0, 0];
      const vecD = [0, 1, 0];
      expect(knowledgeBase.cosineSimilarity(vecC, vecD)).toBeCloseTo(0, 5);
      
      // Opposite vectors should have similarity of -1
      const vecE = [1, 0, 0];
      const vecF = [-1, 0, 0];
      expect(knowledgeBase.cosineSimilarity(vecE, vecF)).toBeCloseTo(-1, 5);
    });
  });

  describe('integration with OpenAI embeddings', () => {
    it('should use text-embedding-3-small model for embeddings', async () => {
      mockEmbed.mockResolvedValue({ embedding: createMockVector(1) });
      
      knowledgeBase = new LocalVectorKnowledgeBase();
      
      await new Promise(r => setTimeout(r, 600));
      await knowledgeBase.search('test query');
      
      // Verify embed was called with the correct embedder
      expect(mockEmbed).toHaveBeenCalledWith(
        expect.objectContaining({
          embedder: 'text-embedding-3-small',
        })
      );
    });
  });
});
