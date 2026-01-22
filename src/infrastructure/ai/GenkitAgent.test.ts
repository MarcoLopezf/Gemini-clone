import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GenkitAgent } from './GenkitAgent';
import { Message } from '../../core/domain/entities/Message';

// Mock the entire 'genkit' module
const { mockGenerate } = vi.hoisted(() => {
  return { mockGenerate: vi.fn() };
});

vi.mock('genkit', () => ({
  genkit: () => ({
    generate: mockGenerate,
  }),
  z: {},
}));

vi.mock('@genkit-ai/googleai', () => ({
  googleAI: () => ({}),
  gemini15Flash: 'gemini-1.5-flash',
}));

describe('GenkitAgent', () => {
  let agent: GenkitAgent;

  beforeEach(() => {
    vi.resetAllMocks();
    agent = new GenkitAgent();
  });

  describe('generateResponse', () => {
    it('should accept history and convert to Genkit format', async () => {
      // Arrange
      const history: Message[] = [
        { role: 'user', content: 'Hello' },
        { role: 'model', content: 'Hi there' },
      ];

      mockGenerate.mockResolvedValue({
        text: 'Mock response',
      });

      // Act
      await agent.generateResponse(history);

      // Assert
      expect(mockGenerate).toHaveBeenCalled();
      const callArgs = mockGenerate.mock.calls[0][0];
      expect(callArgs).toBeDefined();
      expect(callArgs.messages).toHaveLength(2);
      expect(callArgs.messages[0].role).toBe('user');
      expect(callArgs.messages[1].role).toBe('model');
    });

    it('should return the generated text response', async () => {
      // Arrange
      mockGenerate.mockResolvedValue({
        text: 'I am Gemini',
      });

      const history: Message[] = [{ role: 'user', content: 'Who are you?' }];

      // Act
      const response = await agent.generateResponse(history);

      // Assert
      expect(response).toBe('I am Gemini');
    });
  });
});
