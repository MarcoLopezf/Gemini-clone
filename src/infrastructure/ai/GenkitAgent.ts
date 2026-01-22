/**
 * GenkitAgent
 *
 * Implementation of GenerativeAgent using Google Genkit.
 */

import { genkit, z } from 'genkit';
import { openAI } from 'genkitx-openai';
import { googleAI } from '@genkit-ai/google-genai';
import fs from 'fs';
import path from 'path';
import { GenerativeAgent } from '../../core/domain/interfaces/GenerativeAgent';
import { Message } from '../../core/domain/entities/Message';
import { WebSearch } from '../../core/domain/ports/WebSearch';
import { KnowledgeBase } from '../../core/domain/ports/KnowledgeBase';

// Initialize Genkit
const ai = genkit({
  plugins: [
    googleAI(), 
    openAI({ apiKey: process.env.OPENAI_API_KEY }) // Make sure to load env var
  ],
  // Default model - can be overridden in generate call
  model: 'googleai/gemini-2.5-flash',
});

export class GenkitAgent implements GenerativeAgent {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private readonly tools: any[] = [];

  constructor(
    private readonly webSearch?: WebSearch,
    private readonly knowledgeBase?: KnowledgeBase
  ) {
    // Define tools once upon initialization
    if (this.webSearch) {
      try {
        this.tools.push(ai.defineTool({
          name: 'web_search',
          description: 'Finds current information from the internet.',
          inputSchema: z.object({ query: z.string() }),
          outputSchema: z.object({ result: z.unknown() }),
        }, async () => ({ result: '' }))); 
      } catch {
        // Ignore if already registered (hot reload safety)
      }
    }
    if (this.knowledgeBase) {
      try {
        this.tools.push(ai.defineTool({
          name: 'knowledge_base',
          description: 'Access internal knowledge base. Use this for queries about RAG (Retrieval Augmented Generation), project architecture, technical docs, and company policies.',
          inputSchema: z.object({ query: z.string() }),
          outputSchema: z.object({ result: z.unknown() }),
        }, async () => ({ result: '' })));
      } catch {
          // Ignore
      }
    }
  }

  async generateResponse(history: Message[], options?: { modelId?: string }): Promise<string> {
    const systemPrompt = this.loadSystemPrompt();
    
    // Determine Model ID
    let targetModel = 'googleai/gemini-2.5-flash'; // Default
    if (options?.modelId === 'gpt-5-nano') {
        // Map pseudo-model to real OpenAI model for now, or use custom if plugin supports it
        // Assuming 'openai/gpt-4o' as the "nano" equivalent for this demo or actual model if available
        targetModel = 'openai/gpt-4o'; 
    } else if (options?.modelId) {
        targetModel = options.modelId;
    }

    // ... (rest of logic) ...
    // ...
    
    // MAIN LOOP logic needs to use ai.generate with specific model
    // However, ai.generate usually uses the configured default model unless overridden?
    // Genkit v0.5+ / v1.x usually supports passing 'model' in generate options.
    
    // Convert history for Genkit
    // ... existing conversion code ...
    let messages = history.map((msg) => ({
      role: (msg.role === 'model' ? 'model' : 'user') as 'model' | 'user',
      content: [{ text: msg.content }],
    }));

    if (systemPrompt) {
        messages = [
            { role: 'system' as 'user', content: [{ text: systemPrompt }] },
            ...messages
        ];
    }
    
    const tools = this.tools;
    const currentMessages = [...messages];
    
    while (true) {
        const response = await ai.generate({
            model: targetModel, // Override default model
            messages: currentMessages,
            // We pass tool definitions so the model knows they exist
            tools: tools.length > 0 ? tools : undefined,
        });

        // Debug Log
        const toolRequests = response.output?.toolRequests;
        console.log(`🤖 [Genkit] Response generated. Content: "${response.text?.substring(0, 50)}..."`);
        console.log(`🤖 [Genkit] Tool Requests present: ${toolRequests ? toolRequests.length : 0}`);
        
        if (toolRequests && toolRequests.length > 0) {
            // Append model's tool request message to history
            // Genkit response object usually has a way to get the message part
            // For manual loop, we construct the 'model' message with tool calls
            // Add model's tool request message to history
            // We need to add the MODEL's tool request first
            currentMessages.push({
               role: 'model',
               content: [
                 {
                   toolRequest: {
                     name: toolRequests[0].toolName,
                     input: toolRequests[0].input,
                     ref: toolRequests[0].ref,
                   },
                 },
               ] as unknown as [{ text: string }], // Force cast to satisfy simplified Message type
            } as unknown as { role: 'model'; content: [{ text: string }] }); // Genkit Message type workaround
            
            const toolRequest = toolRequests[0]; // Handle first tool request
            console.log(`🛠️ [Agent] Intercepted Tool Request: ${toolRequest.toolName} with input:`, toolRequest.input);
            
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            let toolResultContent: any = { result: [] };

            if (toolRequest.toolName === 'web_search' && this.webSearch) {
                console.log(`🔍 [Agent] Executing Web Search...`);
                const result = await this.webSearch.search(toolRequest.input.query as string);
                console.log(`✅ [Agent] Web Search Result Count: ${result.results.length}`);
                toolResultContent = { result: result.results ?? [] };
            } else if (toolRequest.toolName === 'knowledge_base' && this.knowledgeBase) {
                console.log(`📚 [Agent] Executing RAG Search with query: "${toolRequest.input.query}"`);
                const result = await this.knowledgeBase.search(toolRequest.input.query as string);
                console.log(`✅ [Agent] RAG Result Count: ${result.length}`);
                if (result.length > 0) {
                     console.log(`📄 [Agent] First result sample: ${JSON.stringify(result[0]).substring(0, 100)}...`);
                }
                toolResultContent = { result: result ?? [] };
            }
            
            // Fallback for empty/null content
            if (!toolResultContent || !toolResultContent.result || (Array.isArray(toolResultContent.result) && toolResultContent.result.length === 0)) {
                toolResultContent = { result: "No information found for this query." };
            }

            // Then the TOOL response
            currentMessages.push({
               role: 'tool' as 'user', 
               content: [
                 {
                   toolResponse: {
                     name: toolRequest.toolName,
                     output: toolResultContent,
                     ref: toolRequest.ref,
                   },
                 },
               ] as unknown as [{ text: string }],
           } as unknown as { role: 'user'; content: [{ text: string }] });
           
           // Loop continues to call ai.generate again with updated history
           continue;
        }

        // If no tool requests, return the text
        return response.text;
    }
  }

  private loadSystemPrompt(): string {
    try {
      const promptPath = path.join(
        process.cwd(),
        'src/infrastructure/ai/prompts/system.prompt'
      );
      // Simple read, in reality we might parse frontmatter
      const fileContent = fs.readFileSync(promptPath, 'utf-8');
      // Strip frontmatter if present (between --- and ---)
      return fileContent.replace(/^---[\s\S]*?---\n/, '').trim();
    } catch (error) {
      console.warn('Failed to load system prompt:', error);
      return '';
    }
  }
}
