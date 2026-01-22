/**
 * Conversation Aggregate Root
 *
 * Manages a collection of messages in a conversation.
 */

import { Message, MessageRole } from './Message';

export class Conversation {
  readonly id: string;
  private messages: Message[] = [];

  constructor() {
    this.id = crypto.randomUUID();
  }

  addMessage(role: MessageRole, content: string): void {
    const trimmedContent = content.trim();

    if (trimmedContent.length === 0) {
      throw new Error('Message content cannot be empty');
    }

    this.messages.push({ role, content: trimmedContent });
  }

  getHistory(): Message[] {
    return [...this.messages];
  }
}
