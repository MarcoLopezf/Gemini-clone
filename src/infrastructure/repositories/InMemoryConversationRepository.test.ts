import { describe, it, expect, beforeEach } from 'vitest';
import { InMemoryConversationRepository } from './InMemoryConversationRepository';
import { Conversation } from '../../core/domain/entities/Conversation';

describe('InMemoryConversationRepository', () => {
  let repository: InMemoryConversationRepository;

  beforeEach(() => {
    repository = new InMemoryConversationRepository();
  });

  describe('save', () => {
    it('should store the conversation entity', async () => {
      const conversation = new Conversation();
      conversation.addMessage('user', 'Hello');

      await repository.save(conversation);

      const retrieved = await repository.findById(conversation.id);
      expect(retrieved).not.toBeNull();
      expect(retrieved?.id).toBe(conversation.id);
    });
  });

  describe('findById', () => {
    it('should return the correct entity if it exists', async () => {
      const conversation = new Conversation();
      conversation.addMessage('user', 'Test message');
      await repository.save(conversation);

      const retrieved = await repository.findById(conversation.id);

      expect(retrieved).not.toBeNull();
      expect(retrieved?.id).toBe(conversation.id);
      expect(retrieved?.getHistory()).toHaveLength(1);
      expect(retrieved?.getHistory()[0].content).toBe('Test message');
    });

    it('should return null if entity does not exist', async () => {
      const retrieved = await repository.findById('non-existent-id');

      expect(retrieved).toBeNull();
    });

    it('should return a reconstructed copy, not the same reference', async () => {
      const conversation = new Conversation();
      conversation.addMessage('user', 'Original message');
      await repository.save(conversation);

      const retrieved1 = await repository.findById(conversation.id);
      const retrieved2 = await repository.findById(conversation.id);

      // Should be different object references
      expect(retrieved1).not.toBe(retrieved2);
      // But equal in data
      expect(retrieved1?.id).toBe(retrieved2?.id);
      expect(retrieved1?.getHistory()).toEqual(retrieved2?.getHistory());
    });
  });

  describe('create', () => {
    it('should create and store a new conversation', async () => {
      const conversation = await repository.create();

      expect(conversation.id).toBeDefined();
      expect(conversation.getHistory()).toEqual([]);

      // Should be retrievable
      const retrieved = await repository.findById(conversation.id);
      expect(retrieved).not.toBeNull();
      expect(retrieved?.id).toBe(conversation.id);
    });
  });
});
