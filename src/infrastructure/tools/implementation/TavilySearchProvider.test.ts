import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { TavilySearchProvider } from './TavilySearchProvider';

describe('TavilySearchProvider', () => {
  let provider: TavilySearchProvider;
  const apiKey = 'test-api-key';

  // Mock global fetch
  const fetchMock = vi.fn();
  global.fetch = fetchMock;

  beforeEach(() => {
    provider = new TavilySearchProvider(apiKey);
    fetchMock.mockReset();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should call Tavily API with correct parameters', async () => {
    // Arrange
    const query = 'Gemini 1.5 Flash';
    const mockResponse = {
      results: [
        {
          title: 'Gemini 1.5 Flash',
          url: 'https://deepmind.google/technologies/gemini/flash/',
          content: 'Gemini 1.5 Flash is our lightweight model...',
          score: 0.95,
          published_date: '2024-05-14',
        },
      ],
      answer: 'Gemini 1.5 Flash is a lightweight model.',
      query: query,
    };

    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => mockResponse,
    });

    // Act
    await provider.search(query, { searchDepth: 'basic' });

    // Assert
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledWith('https://api.tavily.com/search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        api_key: apiKey,
        query: query,
        search_depth: 'basic',
        include_answer: false, // Default or specific option
        limit: 5,
      }),
    });
  });

  it('should parse response and return WebSearchResponse', async () => {
    // Arrange
    const query = 'TypeScript';
    const mockResponse = {
      results: [
        {
          title: 'TypeScript - JavaScript that scales.',
          url: 'https://www.typescriptlang.org/',
          content: 'TypeScript is a strongly typed programming language...',
          score: 0.9,
        },
      ],
      query: query,
    };

    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => mockResponse,
    });

    // Act
    const result = await provider.search(query);

    // Assert
    expect(result.query).toBe(query);
    expect(result.results).toHaveLength(1);
    expect(result.results[0].title).toBe('TypeScript - JavaScript that scales.');
    expect(result.results[0].url).toBe('https://www.typescriptlang.org/');
  });

  it('should handle API errors gracefully', async () => {
    // Arrange
    fetchMock.mockResolvedValue({
      ok: false,
      statusText: 'Unauthorized',
    });

    // Act & Assert
    await expect(provider.search('fail')).rejects.toThrow(
      'Tavily API error: Unauthorized'
    );
  });
});
