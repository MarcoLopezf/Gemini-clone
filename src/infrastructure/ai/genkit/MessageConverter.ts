/**
 * MessageConverter
 * 
 * Converts domain Message objects to Genkit message format.
 * Pure function - no side effects.
 */

import { Message } from '../../../core/domain/entities/Message';

/**
 * Genkit message format
 */
export interface GenkitMessage {
  role: 'user' | 'model' | 'system';
  content: Array<{ text: string }>;
}

/**
 * Converts domain messages to Genkit format and optionally prepends system prompt.
 * 
 * @param history - Array of domain Message objects
 * @param systemPrompt - Optional system prompt to prepend
 * @returns Array of Genkit-formatted messages
 */
export function toGenkitMessages(
  history: Message[],
  systemPrompt?: string
): GenkitMessage[] {
  // Convert domain messages to Genkit format
  let messages: GenkitMessage[] = history.map((msg) => ({
    role: (msg.role === 'model' ? 'model' : 'user') as 'model' | 'user',
    content: [{ text: msg.content }],
  }));

  // Prepend system prompt if provided
  if (systemPrompt) {
    messages = [
      { role: 'system' as const, content: [{ text: systemPrompt }] },
      ...messages
    ];
  }

  return messages;
}

/**
 * Resolves the model ID from options to Genkit-compatible format.
 * 
 * @param modelId - Optional model ID from request
 * @returns Resolved Genkit model identifier
 */
export function resolveModelId(modelId?: string): string {
  // Default model
  const DEFAULT_MODEL = 'googleai/gemini-2.5-flash';
  
  if (!modelId) {
    return DEFAULT_MODEL;
  }
  
  // Map friendly names to actual model IDs
  if (modelId === 'gpt-5-nano') {
    return 'openai/gpt-4o';
  }
  
  return modelId;
}
