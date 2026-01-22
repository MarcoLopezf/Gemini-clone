import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SendMessageUseCase } from './SendMessage';
import { ConversationRepository } from '../../domain/interfaces/ConversationRepository';
import { GenerativeAgent } from '../../domain/interfaces/GenerativeAgent';
import { Conversation } from '../../domain/entities/Conversation';

describe('SendMessageUseCase', () => {
  let useCase: SendMessageUseCase;
  let mockConversationRepository: ConversationRepository;
  let mockGenerativeAgent: GenerativeAgent;
  let testConversation: Conversation;

  beforeEach(() => {
    // Create a real conversation for testing
    testConversation = new Conversation();

    // Create mocks
    mockConversationRepository = {
      findById: vi.fn(),
      save: vi.fn(),
      create: vi.fn(),
    };

    mockGenerativeAgent = {
      generateResponse: vi.fn(),
    };

    useCase = new SendMessageUseCase(
      mockConversationRepository,
      mockGenerativeAgent
    );
  });

  describe('execute', () => {
    it('should retrieve a conversation by ID', async () => {
      // Arrange
      vi.mocked(mockConversationRepository.findById).mockResolvedValue(
        testConversation
      );
      vi.mocked(mockGenerativeAgent.generateResponse).mockResolvedValue(
        'AI response'
      );

      // Act
      await useCase.execute({
        conversationId: testConversation.id,
        content: 'Hello',
      });

      // Assert
      expect(mockConversationRepository.findById).toHaveBeenCalledWith(
        testConversation.id
      );
    });

    it('should add the user message to the conversation entity', async () => {
      // Arrange
      vi.mocked(mockConversationRepository.findById).mockResolvedValue(
        testConversation
      );
      vi.mocked(mockGenerativeAgent.generateResponse).mockResolvedValue(
        'AI response'
      );

      // Act
      await useCase.execute({
        conversationId: testConversation.id,
        content: 'Hello, AI!',
      });

      // Assert
      const history = testConversation.getHistory();
      expect(history.length).toBeGreaterThanOrEqual(1);
      expect(history[0].role).toBe('user');
      expect(history[0].content).toBe('Hello, AI!');
    });

    it('should call GenerativeAgent.generateResponse with the updated history', async () => {
      // Arrange
      vi.mocked(mockConversationRepository.findById).mockResolvedValue(
        testConversation
      );
      vi.mocked(mockGenerativeAgent.generateResponse).mockResolvedValue(
        'AI response'
      );

      // Act
      await useCase.execute({
        conversationId: testConversation.id,
        content: 'Hello',
      });

      // Assert
      expect(mockGenerativeAgent.generateResponse).toHaveBeenCalled();
      const calledWithHistory = vi.mocked(mockGenerativeAgent.generateResponse)
        .mock.calls[0][0];
      expect(calledWithHistory).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ role: 'user', content: 'Hello' }),
        ])
      );
    });

    it('should save the updated conversation back to the repository', async () => {
      // Arrange
      vi.mocked(mockConversationRepository.findById).mockResolvedValue(
        testConversation
      );
      vi.mocked(mockGenerativeAgent.generateResponse).mockResolvedValue(
        'AI response'
      );

      // Act
      await useCase.execute({
        conversationId: testConversation.id,
        content: 'Hello',
      });

      // Assert
      expect(mockConversationRepository.save).toHaveBeenCalledWith(
        testConversation
      );
    });

    it('should return the model response', async () => {
      // Arrange
      vi.mocked(mockConversationRepository.findById).mockResolvedValue(
        testConversation
      );
      vi.mocked(mockGenerativeAgent.generateResponse).mockResolvedValue(
        'Hello, human!'
      );

      // Act
      const result = await useCase.execute({
        conversationId: testConversation.id,
        content: 'Hello',
      });

      // Assert
      expect(result.modelResponse).toBe('Hello, human!');
      expect(result.conversationId).toBe(testConversation.id);
    });

    it('should throw error if conversation not found', async () => {
      // Arrange
      vi.mocked(mockConversationRepository.findById).mockResolvedValue(null);

      // Act & Assert
      await expect(
        useCase.execute({
          conversationId: 'non-existent-id',
          content: 'Hello',
        })
      ).rejects.toThrow('Conversation not found');
    });
  });
});
