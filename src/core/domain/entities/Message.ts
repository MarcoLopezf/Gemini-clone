/**
 * Message Value Object
 *
 * Represents a single message in a conversation.
 * Supports both text content and tool calls.
 */

import { ToolCall } from '../value-objects/ToolCall';

export type MessageRole = 'user' | 'model' | 'tool';

export interface Message {
  readonly role: MessageRole;
  readonly content: string;
  readonly toolCalls?: ToolCall[];
}
