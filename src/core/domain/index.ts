/**
 * Domain Layer - Public API
 *
 * This barrel export exposes all domain components.
 * The domain layer is pure TypeScript with no framework dependencies.
 */

// Entities
export { Message, Conversation } from './entities';
export type {
  MessageProps,
  ToolCall,
  ToolResult,
  ConversationProps,
} from './entities';

// Value Objects
export { MessageRole, MessageContent, MESSAGE_ROLES } from './value-objects';
export type { MessageRoleType } from './value-objects';

// Ports (Interfaces)
export type {
  GenerativeAgent,
  MessageChunk,
  GenerationOptions,
  ToolDefinition,
  KnowledgeBase,
  Document,
  SearchResult,
  KnowledgeBaseSearchOptions,
  WebSearch,
  WebSearchResult,
  WebSearchOptions,
  WebSearchResponse,
} from './ports';
