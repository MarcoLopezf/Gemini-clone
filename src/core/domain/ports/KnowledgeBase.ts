/**
 * KnowledgeBase Port (Interface)
 *
 * Defines the contract for RAG (Retrieval-Augmented Generation) operations.
 * Used for searching and indexing local documentation.
 */

/**
 * Represents a document to be indexed
 */
export interface Document {
  readonly id: string;
  readonly content: string;
  readonly metadata?: Record<string, unknown>;
}

/**
 * Represents a search result from the knowledge base
 */
export interface SearchResult {
  readonly document: Document;
  readonly score: number;
  readonly snippet?: string;
}

/**
 * Options for search operations
 */
export interface KnowledgeBaseSearchOptions {
  readonly limit?: number;
  readonly minScore?: number;
  readonly filter?: Record<string, unknown>;
}

/**
 * Port interface for knowledge base / RAG operations
 */
export interface KnowledgeBase {
  /**
   * Search the knowledge base for relevant documents
   */
  search(
    query: string,
    options?: KnowledgeBaseSearchOptions
  ): Promise<SearchResult[]>;

  /**
   * Index documents into the knowledge base
   */
  index(documents: Document[]): Promise<void>;

  /**
   * Remove documents from the knowledge base
   */
  remove(documentIds: string[]): Promise<void>;

  /**
   * Clear all documents from the knowledge base
   */
  clear(): Promise<void>;
}
