/**
 * SendMessage Use Case
 *
 * Orchestrates sending a user message and getting an AI response.
 */

import { ConversationRepository } from '../../domain/interfaces/ConversationRepository';
import { GenerativeAgent } from '../../domain/interfaces/GenerativeAgent';
import { SendMessageRequest } from '../dto/SendMessageRequest';
import { SendMessageResponse } from '../dto/SendMessageResponse';

export class SendMessageUseCase {
  constructor(
    private readonly conversationRepository: ConversationRepository,
    private readonly generativeAgent: GenerativeAgent
  ) {}

  async execute(request: SendMessageRequest): Promise<SendMessageResponse> {
    // 1. Retrieve conversation by ID
    const conversation = await this.conversationRepository.findById(
      request.conversationId
    );

    if (!conversation) {
      throw new Error('Conversation not found');
    }

    // 2. Add user message to conversation
    conversation.addMessage('user', request.content);

    // 3. Call GenerativeAgent with updated history
    const history = conversation.getHistory();
    const modelResponse = await this.generativeAgent.generateResponse(history);

    // 4. Add model response to conversation
    conversation.addMessage('model', modelResponse);

    // 5. Save updated conversation
    await this.conversationRepository.save(conversation);

    // 6. Return response
    return {
      modelResponse,
      conversationId: conversation.id,
    };
  }
}
