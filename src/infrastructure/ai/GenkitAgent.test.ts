import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GenkitAgent } from './GenkitAgent';
import { Message } from '../../core/domain/entities/Message';
import { WebSearch } from '../../core/domain/ports/WebSearch';
import { KnowledgeBase } from '../../core/domain/ports/KnowledgeBase';
import fs from 'fs';

// Mock dependencies
const { mockGenerate } = vi.hoisted(() => {
  return { mockGenerate: vi.fn() };
});

vi.mock('genkit', () => ({
  genkit: () => ({
    generate: mockGenerate,
    defineTool: vi.fn(),
  }),
  z: {
    object: () => ({}),
    string: () => ({}),
    number: () => ({}),
  },
}));

vi.mock('@genkit-ai/google-genai', () => ({
  googleAI: () => ({}),
}));

// Mock FS with specific implementation
vi.mock('fs', () => ({
  default: { readFileSync: vi.fn() },
  readFileSync: vi.fn(),
}));

describe('GenkitAgent', () => {
  let agent: GenkitAgent;
  let mockWebSearch: WebSearch;
  let mockKnowledgeBase: KnowledgeBase;

  beforeEach(() => {
    vi.resetAllMocks();

    // Setup FS mock return value
    vi.mocked(fs.readFileSync).mockReturnValue('You are a helpful assistant.');

    // Mock Ports
    mockWebSearch = {
      search: vi.fn(),
    };
    mockKnowledgeBase = {
      search: vi.fn(),
      index: vi.fn(),
      remove: vi.fn(),
      clear: vi.fn(),
    };

    // Instantiate with dependencies
    agent = new GenkitAgent(mockWebSearch, mockKnowledgeBase);
  });

  describe('generateResponse', () => {
    it('should execute web_search tool when requested by LLM and return final answer', async () => {
      // Arrange
      const history: Message[] = [{ role: 'user', content: 'Apple stock?' }];
      
      // Mock Step 1: LLM returns tool request
      mockGenerate.mockResolvedValueOnce({
        text: '',
        output: {
          toolRequests: [
            {
              toolName: 'web_search',
              input: { query: 'apple stock' },
              ref: 'ref-123'
            }
          ]
        },
      });

      // Mock Step 2: Web Search executes (mocked dependency)
      vi.mocked(mockWebSearch.search).mockResolvedValue({
        results: [{ title: 'Apple', url: '...', content: 'Apple is $150', score: 1 }],
        query: 'apple stock'
      });

      // Mock Step 3: LLM called again with tool result, returns final text
      mockGenerate.mockResolvedValueOnce({
        text: 'Apple stock is $150',
        output: null // No more tools
      });

      // Act
      const response = await agent.generateResponse(history);

      // Assert
      expect(response).toBe('Apple stock is $150');
      
      // Verify WebSearch was called
      expect(mockWebSearch.search).toHaveBeenCalledWith('apple stock');

      // Verify generate was called twice (Initial + with tool result)
      expect(mockGenerate).toHaveBeenCalledTimes(2);
    });

    it('should execute knowledge_base tool when requested and return final answer', async () => {
      // Arrange
      const history: Message[] = [{ role: 'user', content: 'What is RAG?' }];

      // Mock Step 1: Tool Request
      mockGenerate.mockResolvedValueOnce({
        text: '',
        output: {
          toolRequests: [
            {
              toolName: 'knowledge_base',
              input: { query: 'RAG' },
              ref: 'ref-456'
            }
          ]
        }
      });

      // Mock Step 2: KB Search
      vi.mocked(mockKnowledgeBase.search).mockResolvedValue([
        { document: { id: '1', content: 'RAG is...' }, score: 0.9 }
      ]);

      // Mock Step 3: Final Answer
      mockGenerate.mockResolvedValueOnce({
        text: 'RAG stands for Retrieval Augmented Generation',
        output: null
      });

      // Act
      const response = await agent.generateResponse(history);

      // Assert
      expect(response).toBe('RAG stands for Retrieval Augmented Generation');
      expect(mockKnowledgeBase.search).toHaveBeenCalledWith('RAG');
      expect(mockGenerate).toHaveBeenCalledTimes(2);
    });
    
    it('should load system prompt from file', async () => {
        // Arrange
        mockGenerate.mockResolvedValue({ text: 'Hello', output: null });
        
        // Act
        await agent.generateResponse([{ role: 'user', content: 'Hi' }]);

        // Assert
        expect(fs.readFileSync).toHaveBeenCalled();
        // Check if prompt calls included the system instruction
        // Note: Implementation specific check, might need adjustment based on how we inject system prompt
    });
  });
});
