/**
 * MessageRole Value Object
 *
 * Represents the valid roles a message can have in a conversation.
 * Immutable and validated at construction time.
 */

export const MESSAGE_ROLES = ['user', 'model', 'tool'] as const;

export type MessageRoleType = (typeof MESSAGE_ROLES)[number];

export class MessageRole {
  private readonly _value: MessageRoleType;

  private constructor(value: MessageRoleType) {
    this._value = value;
  }

  static create(value: string): MessageRole {
    if (!MessageRole.isValid(value)) {
      throw new Error(
        `Invalid message role: "${value}". Valid roles are: ${MESSAGE_ROLES.join(', ')}`
      );
    }
    return new MessageRole(value as MessageRoleType);
  }

  static isValid(value: string): value is MessageRoleType {
    return MESSAGE_ROLES.includes(value as MessageRoleType);
  }

  static user(): MessageRole {
    return new MessageRole('user');
  }

  static model(): MessageRole {
    return new MessageRole('model');
  }

  static tool(): MessageRole {
    return new MessageRole('tool');
  }

  get value(): MessageRoleType {
    return this._value;
  }

  equals(other: MessageRole): boolean {
    return this._value === other._value;
  }

  isUser(): boolean {
    return this._value === 'user';
  }

  isModel(): boolean {
    return this._value === 'model';
  }

  isTool(): boolean {
    return this._value === 'tool';
  }

  toString(): string {
    return this._value;
  }
}
