/**
 * GenerativeAgent Interface (Port)
 *
 * Defines the contract for interacting with the LLM.
 */

import { Message } from '../entities/Message';

export interface GenerativeAgent {
  generateResponse(history: Message[], options?: { modelId?: string }): Promise<string>;
}
