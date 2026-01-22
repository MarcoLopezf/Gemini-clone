/**
 * TavilySearchProvider
 *
 * Implementation of WebSearch using Tavily API.
 */

import {
  WebSearch,
  WebSearchOptions,
  WebSearchResponse,
  WebSearchResult,
} from '../../../core/domain/ports/WebSearch';
import { TavilyClient, tavily } from '@tavily/core';

export class TavilySearchProvider implements WebSearch {
  private readonly client: TavilyClient;

  constructor(apiKey: string) {
    this.client = tavily({ apiKey });
  }

  async search(
    query: string,
    options?: WebSearchOptions
  ): Promise<WebSearchResponse> {
    try {
      const response = await this.client.search(query, {
        searchDepth: options?.searchDepth === 'advanced' ? 'advanced' : 'basic',
        maxResults: options?.limit ?? 5,
        includeAnswer: options?.includeAnswer ?? false,
        includeRawContent: false,
        includeDomains: options?.includeDomains,
        excludeDomains: options?.excludeDomains,
        includeImages: false, // Not using images for now
      });

      // Map SDK response to our domain WebSearchResponse
      // SDK response structure is { results: [...], answer: string, query: string, ... }
      
      const results: WebSearchResult[] = response.results.map((item: {
        title: string;
        url: string;
        content: string;
        score?: number;
        published_date?: string;
      }) => ({
        title: item.title,
        url: item.url,
        content: item.content,
        score: item.score ?? 0,
        publishedDate: item.published_date,
      }));

      return {
        results,
        answer: response.answer,
        query: response.query,
      };
    } catch (error) {
      console.error('[TavilySearchProvider] Error searching:', error);
      throw error;
    }
  }
}
