/**
 * MessageContent Value Object
 *
 * Represents validated message content.
 * Ensures content is non-empty and trimmed.
 */

export class MessageContent {
  private readonly _value: string;

  private constructor(value: string) {
    this._value = value;
  }

  static create(value: string): MessageContent {
    const trimmed = value.trim();

    if (trimmed.length === 0) {
      throw new Error('Message content cannot be empty');
    }

    return new MessageContent(trimmed);
  }

  static createOptional(value: string | undefined | null): MessageContent | null {
    if (value === undefined || value === null) {
      return null;
    }

    const trimmed = value.trim();
    if (trimmed.length === 0) {
      return null;
    }

    return new MessageContent(trimmed);
  }

  get value(): string {
    return this._value;
  }

  get length(): number {
    return this._value.length;
  }

  equals(other: MessageContent): boolean {
    return this._value === other._value;
  }

  contains(substring: string): boolean {
    return this._value.includes(substring);
  }

  toString(): string {
    return this._value;
  }
}
