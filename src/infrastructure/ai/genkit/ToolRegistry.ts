/**
 * ToolRegistry
 * 
 * Responsible for registering Genkit tools with their implementations.
 * Decoupled from the agent for better testability.
 */

import { z } from 'genkit';
import { WebSearch } from '../../../core/domain/ports/WebSearch';
import { KnowledgeBase } from '../../../core/domain/ports/KnowledgeBase';
import { GenkitClientType } from './GenkitClient';

/**
 * Dependencies for tool registration
 */
export interface ToolDependencies {
  webSearch?: WebSearch;
  knowledgeBase?: KnowledgeBase;
}

/**
 * Registers available tools with the Genkit client.
 * 
 * @param ai - Genkit client instance
 * @param deps - Tool dependencies (ports)
 * @returns Array of registered tools
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function registerTools(ai: GenkitClientType, deps: ToolDependencies): any[] {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const tools: any[] = [];

  // Register Web Search tool
  if (deps.webSearch) {
    try {
      const webSearch = deps.webSearch;
      tools.push(ai.defineTool({
        name: 'web_search',
        description: 'Finds current information from the internet.',
        inputSchema: z.object({ query: z.string() }),
        outputSchema: z.object({ result: z.unknown() }),
      }, async (input) => {
        console.log(`🔍 [Agent] Executing Web Search for: ${input.query}`);
        const res = await webSearch.search(input.query);
        return { result: res.results };
      }));
    } catch {
      // Tool registration failed, continue without it
    }
  }

  // Register Knowledge Base (RAG) tool
  if (deps.knowledgeBase) {
    try {
      const knowledgeBase = deps.knowledgeBase;
      tools.push(ai.defineTool({
        name: 'knowledge_base',
        description: 'Access internal knowledge base. Use this for queries about RAG (Retrieval Augmented Generation), project architecture, technical docs, and company policies.',
        inputSchema: z.object({ query: z.string() }),
        outputSchema: z.object({ result: z.unknown() }),
      }, async (input) => {
        console.log(`📚 [Agent] Executing RAG Search with query: "${input.query}"`);
        const res = await knowledgeBase.search(input.query);
        return { result: res };
      }));
    } catch {
      // Tool registration failed, continue without it
    }
  }

  return tools;
}

/**
 * Executes a tool request manually (fallback for when Genkit doesn't auto-execute).
 * 
 * @param toolName - Name of the tool to execute
 * @param input - Tool input
 * @param deps - Tool dependencies
 * @returns Tool result
 */
export async function executeToolManually(
  toolName: string,
  input: { query: string },
  deps: ToolDependencies
): Promise<{ result: unknown }> {
  console.log(`🛠️ [Agent] Handling Tool Request: ${toolName}`);

  if (toolName === 'web_search' && deps.webSearch) {
    const result = await deps.webSearch.search(input.query);
    return { result: result.results ?? [] };
  }

  if (toolName === 'knowledge_base' && deps.knowledgeBase) {
    const result = await deps.knowledgeBase.search(input.query);
    return { result: result ?? [] };
  }

  return { result: 'No information found.' };
}
