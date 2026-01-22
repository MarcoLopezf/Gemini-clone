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

interface TavilyResult {
  title: string;
  url: string;
  content: string;
  score: number;
  published_date?: string;
}

interface TavilyResponse {
  results: TavilyResult[];
  answer?: string;
  query: string;
}

export class TavilySearchProvider implements WebSearch {
  private readonly baseUrl = 'https://api.tavily.com/search';

  constructor(private readonly apiKey: string) {}

  async search(
    query: string,
    options?: WebSearchOptions
  ): Promise<WebSearchResponse> {
    try {
      const body = {
        api_key: this.apiKey,
        query: query,
        search_depth: options?.searchDepth ?? 'basic',
        include_answer: options?.includeAnswer ?? false,
        include_domains: options?.includeDomains,
        exclude_domains: options?.excludeDomains,
        include_raw_content: options?.includeRawContent,
        limit: options?.limit ?? 5,
      };

      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        throw new Error(`Tavily API error: ${response.statusText}`);
      }

      const data = (await response.json()) as TavilyResponse;

      return this.mapResponse(data);
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Unknown error during Tavily search');
    }
  }

  private mapResponse(data: TavilyResponse): WebSearchResponse {
    const results: WebSearchResult[] = data.results.map((item) => ({
      title: item.title,
      url: item.url,
      content: item.content,
      score: item.score,
      publishedDate: item.published_date,
    }));

    return {
      results,
      answer: data.answer,
      query: data.query,
    };
  }
}
