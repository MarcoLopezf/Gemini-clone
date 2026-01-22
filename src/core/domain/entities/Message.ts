/**
 * Message Entity
 *
 * Represents a single message in a conversation.
 * Can be from user, model, or a tool.
 */

import { MessageContent } from '../value-objects/MessageContent';
import { MessageRole } from '../value-objects/MessageRole';

export interface ToolCall {
  readonly id: string;
  readonly name: string;
  readonly args: Record<string, unknown>;
}

export interface ToolResult {
  readonly toolCallId: string;
  readonly result: unknown;
}

export interface MessageProps {
  id: string;
  role: MessageRole;
  content: MessageContent | null;
  createdAt: Date;
  toolCalls?: ToolCall[];
  toolResult?: ToolResult;
}

export class Message {
  readonly id: string;
  readonly role: MessageRole;
  readonly content: MessageContent | null;
  readonly createdAt: Date;
  readonly toolCalls?: ToolCall[];
  readonly toolResult?: ToolResult;

  private constructor(props: MessageProps) {
    this.id = props.id;
    this.role = props.role;
    this.content = props.content;
    this.createdAt = props.createdAt;
    this.toolCalls = props.toolCalls;
    this.toolResult = props.toolResult;
  }

  static create(props: MessageProps): Message {
    return new Message(props);
  }

  static createUserMessage(id: string, content: string): Message {
    return new Message({
      id,
      role: MessageRole.user(),
      content: MessageContent.create(content),
      createdAt: new Date(),
    });
  }

  static createModelMessage(
    id: string,
    content: string | null,
    toolCalls?: ToolCall[]
  ): Message {
    return new Message({
      id,
      role: MessageRole.model(),
      content: content ? MessageContent.create(content) : null,
      createdAt: new Date(),
      toolCalls,
    });
  }

  static createToolMessage(id: string, toolResult: ToolResult): Message {
    return new Message({
      id,
      role: MessageRole.tool(),
      content: null,
      createdAt: new Date(),
      toolResult,
    });
  }

  hasToolCalls(): boolean {
    return this.toolCalls !== undefined && this.toolCalls.length > 0;
  }

  hasToolResult(): boolean {
    return this.toolResult !== undefined;
  }

  getContentAsString(): string {
    return this.content?.value ?? '';
  }

  toJSON(): Record<string, unknown> {
    return {
      id: this.id,
      role: this.role.value,
      content: this.content?.value ?? null,
      createdAt: this.createdAt.toISOString(),
      toolCalls: this.toolCalls,
      toolResult: this.toolResult,
    };
  }
}
