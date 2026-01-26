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
  type ToolDependencies,
  type GenkitClientType
} from './genkit';
import { loadSystemPrompt } from './prompts/PromptLoader';

export class GenkitAgent implements GenerativeAgent {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private readonly tools: any[];
  private readonly toolDeps: ToolDependencies;
  private readonly ai: GenkitClientType;

  constructor(
    webSearch?: WebSearch,
    knowledgeBase?: KnowledgeBase,
    aiClient?: GenkitClientType // Optional: inject custom Genkit client for testing
  ) {
    this.toolDeps = { webSearch, knowledgeBase };
    this.ai = aiClient || genkitClient;
    this.tools = registerTools(this.ai, this.toolDeps);
    console.log(`🔧 [Agent] Registered ${this.tools.length} tools`);
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

      const response = await this.ai.generate({
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

  /**
   * Streaming response generator - yields text chunks as they arrive
   */
  async *generateStream(history: Message[], options?: { modelId?: string; activeTools?: string[] }): AsyncGenerator<string, void, unknown> {
    const systemPrompt = loadSystemPrompt();
    const targetModel = resolveModelId(options?.modelId);

    // Filter tools based on activeTools option
    // Tool objects from defineTool have the name in __action.name
    const enabledTools = this.tools.filter(tool => {
      const toolName = tool.__action?.name;
      return !options?.activeTools || options.activeTools.includes(toolName);
    });

    console.log('🚀 [Stream] Starting generateStream');
    console.log(`🚀 [Stream] Model: ${targetModel}`);
    console.log(`🚀 [Stream] History length: ${history.length}`);
    console.log(`🔧 [Stream] Active Tools: ${enabledTools.map((t: {__action?: {name: string}}) => t.__action?.name).join(', ') || 'None'}`);

    // 1. Prepare Messages
    const messages = toGenkitMessages(history, systemPrompt);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const currentMessages: any[] = [...messages];
    const maxTurns = 5;
    let turn = 0;

    while (turn < maxTurns) {
      turn++;
      console.log(`\n🔄 [Stream] === TURN ${turn}/${maxTurns} ===`);
      console.log(`🔄 [Stream] Messages count: ${currentMessages.length}`);
      console.log(`🔄 [Stream] Tools available: ${enabledTools.length}`);
      
      // 2. Call Genkit Stream
      console.log('📡 [Stream] Calling this.ai.generateStream...');
      const responseStream = await this.ai.generateStream({
        model: targetModel,
        messages: currentMessages,
        tools: enabledTools.length > 0 ? enabledTools : undefined,
        config: { temperature: 0.3 }
      });
      console.log('📡 [Stream] Stream created, starting to consume chunks...');

      // 3. Consume the stream and Yield text
      let chunkCount = 0;
      let totalTextLength = 0;
      for await (const chunk of responseStream.stream) {
        const textPart = chunk.text;
        if (textPart) {
          chunkCount++;
          totalTextLength += textPart.length;
          yield textPart; 
        }
      }
      console.log(`✅ [Stream] Stream consumed: ${chunkCount} chunks, ${totalTextLength} chars total`);

      // 4. Handle Tools (Post-stream)
      console.log('🔍 [Stream] Checking for tool requests...');
      
      // Safely parse response - LLM sometimes returns plain text instead of JSON
      let toolRequests;
      try {
        console.log('🔍 [Stream] Awaiting responseStream.response...');
        const fullResponse = await responseStream.response;
        console.log('🔍 [Stream] Got fullResponse, checking output...');
        console.log('🔍 [Stream] fullResponse keys:', Object.keys(fullResponse));
        toolRequests = fullResponse.output?.toolRequests;
        console.log(`🔍 [Stream] toolRequests: ${toolRequests ? toolRequests.length : 'none'}`);
      } catch (parseError) {
        console.warn('⚠️ [Stream] Could not parse response (likely plain text):', parseError);
        console.warn('⚠️ [Stream] Returning - text was already streamed');
        return;
      }

      if (!toolRequests || toolRequests.length === 0) {
        console.log('✅ [Stream] No tool requests, returning');
        return;
      }

      // 5. Execute Tool Logic
      const req = toolRequests[0];
      
      currentMessages.push({
        role: 'model',
        content: [{ toolRequest: { name: req.toolName, input: req.input, ref: req.ref } }]
      });

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let toolResultContent: any = { result: [] };
      
      try {
        if (req.toolName === 'web_search' && this.toolDeps.webSearch) {
          const res = await this.toolDeps.webSearch.search(req.input.query);
          toolResultContent = { result: res.results };
        } else if (req.toolName === 'knowledge_base' && this.toolDeps.knowledgeBase) {
          const res = await this.toolDeps.knowledgeBase.search(req.input.query);
          toolResultContent = { result: res };
        } else {
          toolResultContent = { result: "Tool unavailable" };
        }
      } catch (e: unknown) {
        const errorMessage = e instanceof Error ? e.message : 'Unknown error';
        toolResultContent = { result: `Error: ${errorMessage}` };
      }

      currentMessages.push({
        role: 'tool',
        content: [{ toolResponse: { name: req.toolName, output: toolResultContent, ref: req.ref } }]
      });
    }
  }
}
