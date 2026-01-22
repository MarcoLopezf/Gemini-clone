/**
 * LocalVectorKnowledgeBase
 *
 * Implementation of KnowledgeBase using local in-memory vector search (simulated for now).
 */

import {
  KnowledgeBase,
  Document,
  SearchResult,
  KnowledgeBaseSearchOptions,
} from '../../../core/domain/ports/KnowledgeBase';

export class LocalVectorKnowledgeBase implements KnowledgeBase {
  constructor(private documents: Document[] = []) {}

  async search(
    query: string,
    options?: KnowledgeBaseSearchOptions
  ): Promise<SearchResult[]> {
    const limit = options?.limit ?? 5;
    const minScore = options?.minScore ?? 0.0;

    console.log(`[RAG] Searching for query: "${query}" (limit=${limit}, minScore=${minScore})`);

    // Simple keyword search simulation
    // In a real implementation, this would compute cosine similarity between query and document embeddings
    const results: SearchResult[] = this.documents
      .map((doc) => {
        const score = this.calculateRelevance(query, doc.content);
        return {
          document: doc,
          score,
        };
      })
      .filter((result) => result.score > minScore)
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);

    console.log(`[RAG] Found ${results.length} results.`);
    return results;
  }

  async index(documents: Document[]): Promise<void> {
    this.documents = [...this.documents, ...documents];
  }

  async remove(documentIds: string[]): Promise<void> {
    this.documents = this.documents.filter(
      (doc) => !documentIds.includes(doc.id)
    );
  }

  async clear(): Promise<void> {
    this.documents = [];
  }

  /**
   * Calculates a simple relevance score based on keyword presence.
   * TODO: Replace with real vector embedding cosine similarity.
   */
  private calculateRelevance(query: string, content: string): number {
    const normalize = (text: string) => text.toLowerCase();
    const queryTerm = normalize(query);
    const contentText = normalize(content);

    if (contentText.includes(queryTerm)) {
      return 0.9; // High score for exact match
    }

    // Check for partial word matches (very basic)
    const queryWords = queryTerm.split(/\s+/);
    const matches = queryWords.filter((word) => contentText.includes(word));

    if (matches.length > 0) {
      return 0.5 * (matches.length / queryWords.length);
    }

    return 0;
  }
}
