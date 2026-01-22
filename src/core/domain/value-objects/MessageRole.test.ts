import { describe, it, expect } from 'vitest';
import { MessageRole } from './MessageRole';

describe('MessageRole', () => {
  describe('create', () => {
    it('should create a valid user role', () => {
      const role = MessageRole.create('user');
      expect(role.value).toBe('user');
    });

    it('should create a valid model role', () => {
      const role = MessageRole.create('model');
      expect(role.value).toBe('model');
    });

    it('should create a valid tool role', () => {
      const role = MessageRole.create('tool');
      expect(role.value).toBe('tool');
    });

    it('should throw error for invalid role', () => {
      expect(() => MessageRole.create('invalid')).toThrow(
        'Invalid message role: "invalid"'
      );
    });
  });

  describe('factory methods', () => {
    it('should create user role via factory', () => {
      const role = MessageRole.user();
      expect(role.isUser()).toBe(true);
    });

    it('should create model role via factory', () => {
      const role = MessageRole.model();
      expect(role.isModel()).toBe(true);
    });

    it('should create tool role via factory', () => {
      const role = MessageRole.tool();
      expect(role.isTool()).toBe(true);
    });
  });

  describe('equals', () => {
    it('should return true for equal roles', () => {
      const role1 = MessageRole.user();
      const role2 = MessageRole.user();
      expect(role1.equals(role2)).toBe(true);
    });

    it('should return false for different roles', () => {
      const role1 = MessageRole.user();
      const role2 = MessageRole.model();
      expect(role1.equals(role2)).toBe(false);
    });
  });
});
