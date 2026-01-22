/**
 * ToolCall Value Object
 *
 * Represents a tool/function call made by the AI model.
 */

export interface ToolCall {
  readonly id: string;
  readonly name: string;
  readonly args: Record<string, unknown>;
}
