/**
 * GenkitAgent
 *
 * Implementation of GenerativeAgent using Google Genkit.
 * 
 * This is a thin orchestrator that delegates to:
 * - GenkitClient: AI initialization
 * - ToolRegistry: Tool registration
 * - MessageConverter: Message format conversion
 * - PromptLoader: System prompt loading
 */

import { GenerativeAgent } from '../../core/domain/interfaces/GenerativeAgent';
import { Message } from '../../core/domain/entities/Message';
import { WebSearch } from '../../core/domain/ports/WebSearch';
import { KnowledgeBase } from '../../core/domain/ports/KnowledgeBase';
import { 
  genkitClient, 
  registerTools, 
  executeToolManually,
  toGenkitMessages, 
  resolveModelId,
  type ToolDependencies 
} from './genkit';
import { loadSystemPrompt } from './prompts/PromptLoader';

export class GenkitAgent implements GenerativeAgent {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private readonly tools: any[];
  private readonly toolDeps: ToolDependencies;

  constructor(
    webSearch?: WebSearch,
    knowledgeBase?: KnowledgeBase
  ) {
    this.toolDeps = { webSearch, knowledgeBase };
    this.tools = registerTools(genkitClient, this.toolDeps);
  }

  async generateResponse(history: Message[], options?: { modelId?: string }): Promise<string> {
    const systemPrompt = loadSystemPrompt();
    const targetModel = resolveModelId(options?.modelId);
    const messages = toGenkitMessages(history, systemPrompt);
    
    console.log(`Tools available ${this.tools.length}`);

    return this.runAgentLoop(messages, targetModel);
  }

  /**
   * Core agent loop - handles tool execution and response generation
   */
  private async runAgentLoop(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    initialMessages: any[],
    targetModel: string
  ): Promise<string> {
    const currentMessages = [...initialMessages];
    
    while (true) {
      const response = await genkitClient.generate({
        model: targetModel,
        messages: currentMessages,
        tools: this.tools.length > 0 ? this.tools : undefined,
      });

      // Debug logging
      console.log(`🤖 [Genkit] Raw Response Text:`, response.text);
      console.log(`🤖 [Genkit] Raw Response Keys:`, Object.keys(response));
      
      // Parse tool requests
      let toolRequests;
      try {
        toolRequests = response.output?.toolRequests;
      } catch (err) {
        console.error('❌ [Genkit] Error parsing response output:', err);
        toolRequests = null;
      }
      
      console.log(`🤖 [Genkit] Response generated. Content: "${response.text?.substring(0, 50)}..."`);
      console.log(`🤖 [Genkit] Tool Requests present: ${toolRequests ? toolRequests.length : 0}`);
      
      // If no tool requests, return the response
      if (!toolRequests || toolRequests.length === 0) {
        return response.text;
      }

      // Handle tool request (manual execution fallback)
      const toolRequest = toolRequests[0];
      
      // Add model's tool request to messages
      currentMessages.push({
        role: 'model',
        content: [{
          toolRequest: {
            name: toolRequest.toolName,
            input: toolRequest.input,
            ref: toolRequest.ref,
          },
        }],
      } as unknown as typeof currentMessages[0]);
      
      // Execute tool manually
      const toolResult = await executeToolManually(
        toolRequest.toolName,
        toolRequest.input as { query: string },
        this.toolDeps
      );

      // Add tool response to messages
      currentMessages.push({
        role: 'tool',
        content: [{
          toolResponse: {
            name: toolRequest.toolName,
            output: toolResult,
            ref: toolRequest.ref,
          },
        }],
      } as unknown as typeof currentMessages[0]);
    }
  }
}
