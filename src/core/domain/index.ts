/**
 * Domain Layer - Public API
 *
 * This barrel export exposes all domain components.
 * The domain layer is pure TypeScript with no framework dependencies.
 */

// Entities
export type { Message, MessageRole } from './entities';
export { Conversation } from './entities';

// Value Objects
export { MessageContent, MESSAGE_ROLES } from './value-objects';
export { MessageRole as MessageRoleVO } from './value-objects';
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
