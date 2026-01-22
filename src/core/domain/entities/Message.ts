/**
 * Message Value Object
 *
 * Represents a single message in a conversation.
 */

export type MessageRole = 'user' | 'model' | 'tool';

export interface Message {
  readonly role: MessageRole;
  readonly content: string;
}
