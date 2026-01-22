/**
 * InMemoryConversationRepository
 *
 * Persists conversations in memory using a Map.
 * Simulates persistence by ensuring deep copies are stored/retrieved.
 */

import {
  Conversation,
  ConversationSnapshot,
} from '../../core/domain/entities/Conversation';
import { ConversationRepository } from '../../core/domain/interfaces/ConversationRepository';

export class InMemoryConversationRepository implements ConversationRepository {
  private store = new Map<string, ConversationSnapshot>();

  async findById(id: string): Promise<Conversation | null> {
    const snapshot = this.store.get(id);

    if (!snapshot) {
      return null;
    }

    // Reconstruct entity from snapshot (simulating database fetch)
    return Conversation.fromSnapshot(snapshot);
  }

  async save(conversation: Conversation): Promise<void> {
    // Store a snapshot (simulating database serialization)
    this.store.set(conversation.id, conversation.toSnapshot());
  }

  async create(): Promise<Conversation> {
    const conversation = new Conversation();
    await this.save(conversation);
    return conversation;
  }
}
