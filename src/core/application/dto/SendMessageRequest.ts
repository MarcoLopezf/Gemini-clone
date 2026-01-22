/**
 * SendMessageRequest DTO
 */

export interface SendMessageRequest {
  conversationId: string;
  content: string;
  modelId?: string;
}
