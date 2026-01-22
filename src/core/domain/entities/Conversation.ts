/**
 * Conversation Aggregate Root
 *
 * Manages a collection of messages in a conversation.
 */

import { Message, MessageRole } from './Message';
import { ToolCall } from '../value-objects/ToolCall';

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

  addMessageWithToolCalls(
    role: MessageRole,
    content: string,
    toolCalls: ToolCall[]
  ): void {
    const trimmedContent = content.trim();

    // Message is valid if it has content OR toolCalls (not both empty)
    if (trimmedContent.length === 0 && toolCalls.length === 0) {
      throw new Error('Message must have content or tool calls');
    }

    this.messages.push({ role, content: trimmedContent, toolCalls });
  }

  getHistory(): Message[] {
    return [...this.messages];
  }
}
