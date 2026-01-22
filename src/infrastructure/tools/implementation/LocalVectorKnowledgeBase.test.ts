import { describe, it, expect, beforeEach } from 'vitest';
import { LocalVectorKnowledgeBase } from './LocalVectorKnowledgeBase';
import { Document } from '../../../core/domain/ports/KnowledgeBase';

describe('LocalVectorKnowledgeBase', () => {
  let knowledgeBase: LocalVectorKnowledgeBase;
  const mockDocs: Document[] = [
    {
      id: 'doc-1',
      content:
        'Modular RAG is an advanced retrieval augmented generation pattern.',
      metadata: { title: 'RAG Survey' },
    },
    {
      id: 'doc-2',
      content: 'Apples are delicious fruits that grow on trees.',
      metadata: { title: 'Fruits' },
    },
  ];

  beforeEach(() => {
    // Inject mock documents directly for testing logic without FS dependency
    knowledgeBase = new LocalVectorKnowledgeBase(mockDocs);
  });

  describe('search', () => {
    it('should return relevant results for a matching query', async () => {
      const results = await knowledgeBase.search('Modular RAG');

      expect(results.length).toBeGreaterThan(0);
      expect(results[0].document.content).toContain('Modular RAG');
      expect(results[0].score).toBeGreaterThan(0);
    });

    it('should return empty results for irrelevant query', async () => {
      const results = await knowledgeBase.search('Banana');

      // Assuming simple implementation or mock behavior: 'Banana' is not in docs
      // Note: If using semantic search, it might return low score, but we expect filtering or 0 matches if strictly keyword based for now,
      // or simply verify score is low/empty.
      // For this test we assume empty or filtered out.
      expect(results).toHaveLength(0);
    });

    it('should return a score/relevance score', async () => {
      const results = await knowledgeBase.search('Apples');

      expect(results).toHaveLength(1);
      expect(results[0].score).toBeDefined();
      expect(typeof results[0].score).toBe('number');
    });
  });
});
