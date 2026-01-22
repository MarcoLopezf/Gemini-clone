/**
 * GenerativeAgent Port (Interface)
 *
 * Defines the contract for interacting with a generative AI agent.
 * Supports both synchronous generation and streaming.
 */

import { Conversation } from '../entities/Conversation';
import { Message } from '../entities/Message';

/**
 * Represents a chunk of streamed content from the model
 */
export interface MessageChunk {
  readonly content: string;
  readonly isComplete: boolean;
}

/**
 * Configuration options for generation
 */
export interface GenerationOptions {
  readonly temperature?: number;
  readonly maxTokens?: number;
  readonly stopSequences?: string[];
}

/**
 * Tool definition for the agent
 */
export interface ToolDefinition {
  readonly name: string;
  readonly description: string;
  readonly inputSchema: Record<string, unknown>;
}

/**
 * Port interface for generative AI agents
 */
export interface GenerativeAgent {
  /**
   * Generate a response for the given conversation
   */
  generate(
    conversation: Conversation,
    options?: GenerationOptions
  ): Promise<Message>;

  /**
   * Generate a streaming response for the given conversation
   */
  generateStream(
    conversation: Conversation,
    options?: GenerationOptions
  ): AsyncIterable<MessageChunk>;

  /**
   * Register available tools for the agent to use
   */
  registerTools(tools: ToolDefinition[]): void;
}
