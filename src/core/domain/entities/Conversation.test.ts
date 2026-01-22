import { describe, it, expect } from 'vitest';
import { Conversation } from './Conversation';

describe('Conversation', () => {
  describe('creation', () => {
    it('should have a unique ID when created', () => {
      const conversation = new Conversation();

      expect(conversation.id).toBeDefined();
      expect(typeof conversation.id).toBe('string');
      expect(conversation.id.length).toBeGreaterThan(0);
    });

    it('should create different IDs for different conversations', () => {
      const conversation1 = new Conversation();
      const conversation2 = new Conversation();

      expect(conversation1.id).not.toBe(conversation2.id);
    });
  });

  describe('addMessage', () => {
    it('should add a user message to the history', () => {
      const conversation = new Conversation();

      conversation.addMessage('user', 'Hello, AI!');

      const history = conversation.getHistory();
      expect(history).toHaveLength(1);
      expect(history[0].role).toBe('user');
      expect(history[0].content).toBe('Hello, AI!');
    });

    it('should add a model message to the history', () => {
      const conversation = new Conversation();

      conversation.addMessage('model', 'Hello, human!');

      const history = conversation.getHistory();
      expect(history).toHaveLength(1);
      expect(history[0].role).toBe('model');
      expect(history[0].content).toBe('Hello, human!');
    });

    it('should add multiple messages in order', () => {
      const conversation = new Conversation();

      conversation.addMessage('user', 'First message');
      conversation.addMessage('model', 'Second message');
      conversation.addMessage('user', 'Third message');

      const history = conversation.getHistory();
      expect(history).toHaveLength(3);
      expect(history[0].content).toBe('First message');
      expect(history[1].content).toBe('Second message');
      expect(history[2].content).toBe('Third message');
    });
  });

  describe('getHistory', () => {
    it('should return an empty array when no messages', () => {
      const conversation = new Conversation();

      const history = conversation.getHistory();

      expect(history).toEqual([]);
    });

    it('should return a copy of messages (immutability)', () => {
      const conversation = new Conversation();
      conversation.addMessage('user', 'Test message');

      const history1 = conversation.getHistory();
      const history2 = conversation.getHistory();

      expect(history1).not.toBe(history2);
      expect(history1).toEqual(history2);
    });
  });

  describe('business rules', () => {
    it('should throw error when message content is empty', () => {
      const conversation = new Conversation();

      expect(() => conversation.addMessage('user', '')).toThrow(
        'Message content cannot be empty'
      );
    });

    it('should throw error when message content is only whitespace', () => {
      const conversation = new Conversation();

      expect(() => conversation.addMessage('user', '   ')).toThrow(
        'Message content cannot be empty'
      );
    });
  });

  describe('tool calls support', () => {
    it('should allow a message to have tool calls without text content', () => {
      const conversation = new Conversation();

      const toolCall = {
        id: 'call_1',
        name: 'search',
        args: { query: 'weather today' },
      };

      // This should NOT throw even with empty content, because we have toolCalls
      conversation.addMessageWithToolCalls('model', '', [toolCall]);

      const history = conversation.getHistory();
      expect(history).toHaveLength(1);
      expect(history[0].role).toBe('model');
      expect(history[0].content).toBe('');
      expect(history[0].toolCalls).toBeDefined();
      expect(history[0].toolCalls).toHaveLength(1);
      expect(history[0].toolCalls![0].name).toBe('search');
    });
  });
});
