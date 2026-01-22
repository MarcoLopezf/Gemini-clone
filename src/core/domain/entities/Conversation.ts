/**
 * Conversation Entity (Aggregate Root)
 *
 * Represents a conversation containing multiple messages.
 * Acts as the aggregate root for the conversation aggregate.
 */

import { Message } from './Message';

export interface ConversationProps {
  id: string;
  messages: Message[];
  createdAt: Date;
  updatedAt: Date;
}

export class Conversation {
  readonly id: string;
  private _messages: Message[];
  readonly createdAt: Date;
  private _updatedAt: Date;

  private constructor(props: ConversationProps) {
    this.id = props.id;
    this._messages = [...props.messages];
    this.createdAt = props.createdAt;
    this._updatedAt = props.updatedAt;
  }

  static create(id: string): Conversation {
    const now = new Date();
    return new Conversation({
      id,
      messages: [],
      createdAt: now,
      updatedAt: now,
    });
  }

  static fromMessages(id: string, messages: Message[]): Conversation {
    const now = new Date();
    return new Conversation({
      id,
      messages,
      createdAt: now,
      updatedAt: now,
    });
  }

  static restore(props: ConversationProps): Conversation {
    return new Conversation(props);
  }

  get messages(): readonly Message[] {
    return this._messages;
  }

  get updatedAt(): Date {
    return this._updatedAt;
  }

  get messageCount(): number {
    return this._messages.length;
  }

  get isEmpty(): boolean {
    return this._messages.length === 0;
  }

  addMessage(message: Message): void {
    this._messages.push(message);
    this._updatedAt = new Date();
  }

  getLastMessage(): Message | undefined {
    return this._messages[this._messages.length - 1];
  }

  getLastUserMessage(): Message | undefined {
    for (let i = this._messages.length - 1; i >= 0; i--) {
      if (this._messages[i].role.isUser()) {
        return this._messages[i];
      }
    }
    return undefined;
  }

  getLastModelMessage(): Message | undefined {
    for (let i = this._messages.length - 1; i >= 0; i--) {
      if (this._messages[i].role.isModel()) {
        return this._messages[i];
      }
    }
    return undefined;
  }

  /**
   * Returns the conversation history in a format suitable for LLM context
   */
  toHistory(): Array<{ role: string; content: string }> {
    return this._messages
      .filter((msg) => msg.content !== null)
      .map((msg) => ({
        role: msg.role.value,
        content: msg.content!.value,
      }));
  }

  toJSON(): Record<string, unknown> {
    return {
      id: this.id,
      messages: this._messages.map((m) => m.toJSON()),
      createdAt: this.createdAt.toISOString(),
      updatedAt: this._updatedAt.toISOString(),
    };
  }
}
