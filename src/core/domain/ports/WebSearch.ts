/**
 * WebSearch Port (Interface)
 *
 * Defines the contract for web search operations.
 * Will be implemented using Tavily API.
 */

/**
 * Represents a web search result
 */
export interface WebSearchResult {
  readonly title: string;
  readonly url: string;
  readonly content: string;
  readonly score: number;
  readonly publishedDate?: string;
}

/**
 * Options for web search operations
 */
export interface WebSearchOptions {
  readonly limit?: number;
  readonly searchDepth?: 'basic' | 'advanced';
  readonly includeDomains?: string[];
  readonly excludeDomains?: string[];
  readonly includeAnswer?: boolean;
  readonly includeRawContent?: boolean;
}

/**
 * Response from web search including optional generated answer
 */
export interface WebSearchResponse {
  readonly results: WebSearchResult[];
  readonly answer?: string;
  readonly query: string;
}

/**
 * Port interface for web search operations
 */
export interface WebSearch {
  /**
   * Search the web for relevant information
   */
  search(query: string, options?: WebSearchOptions): Promise<WebSearchResponse>;
}
