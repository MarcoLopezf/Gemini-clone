/**
 * KnowledgeBase Port (Interface)
 *
 * Defines the contract for RAG (Retrieval-Augmented Generation) operations.
 * Used for searching local documentation with semantic similarity.
 */

/**
 * Port interface for knowledge base / RAG operations
 * 
 * Simple interface for semantic search using vector embeddings.
 * Returns relevant text chunks from the knowledge base.
 */
export interface KnowledgeBase {
  /**
   * Search the knowledge base for relevant documents
   * @param query - The search query
   * @returns Array of relevant text chunks
   */
  search(query: string): Promise<string[]>;
}
