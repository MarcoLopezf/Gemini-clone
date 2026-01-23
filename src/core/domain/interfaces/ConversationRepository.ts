/**
 * ConversationRepository Interface (Port)
 *
 * Defines the contract for conversation persistence.
 */

import { Conversation } from '../entities/Conversation';

export interface ConversationRepository {
  findById(id: string): Promise<Conversation | null>;
  findAll(): Promise<Conversation[]>;
  save(conversation: Conversation): Promise<void>;
  create(): Promise<Conversation>;
}

