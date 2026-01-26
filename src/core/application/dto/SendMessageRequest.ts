/**
 * SendMessageRequest DTO
 */

export interface SendMessageRequest {
  conversationId: string;
  content: string;
  modelId?: string;
  activeTools?: string[]; // e.g., ['web_search', 'knowledge_base']
}
