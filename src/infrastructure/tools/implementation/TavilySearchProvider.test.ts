import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TavilySearchProvider } from './TavilySearchProvider';

// Mock the tavily module
const mockSearch = vi.fn();

vi.mock('@tavily/core', () => ({
  tavily: vi.fn(() => ({
    search: mockSearch,
  })),
  TavilyClient: vi.fn(),
}));

describe('TavilySearchProvider', () => {
  let provider: TavilySearchProvider;
  const apiKey = 'test-api-key';

  beforeEach(() => {
    vi.clearAllMocks();
    provider = new TavilySearchProvider(apiKey);
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

    mockSearch.mockResolvedValue(mockResponse);

    // Act
    await provider.search(query, { searchDepth: 'basic' });

    // Assert
    expect(mockSearch).toHaveBeenCalledTimes(1);
    expect(mockSearch).toHaveBeenCalledWith(query, expect.objectContaining({
      searchDepth: 'basic',
    }));
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

    mockSearch.mockResolvedValue(mockResponse);

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
    mockSearch.mockRejectedValue(new Error('API Error: Unauthorized'));

    // Act & Assert
    await expect(provider.search('fail')).rejects.toThrow('API Error: Unauthorized');
  });
});
