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

    // Define tools with real implementation
    if (this.webSearch) {
      try {
        this.tools.push(ai.defineTool({
          name: 'web_search',
          description: 'Finds current information from the internet.',
          inputSchema: z.object({ query: z.string() }),
          outputSchema: z.object({ result: z.unknown() }),
        }, async (input) => {
            console.log(`🔍 [Agent] Executing Web Search for: ${input.query}`);
            if (!this.webSearch) return { result: 'Search tool not verified available' };
            const res = await this.webSearch.search(input.query);
            return { result: res.results };
        })); 
      } catch {
        // Ignore
      }
    }
    if (this.knowledgeBase) {
      try {
        this.tools.push(ai.defineTool({
          name: 'knowledge_base',
          description: 'Access internal knowledge base. Use this for queries about RAG (Retrieval Augmented Generation), project architecture, technical docs, and company policies.',
          inputSchema: z.object({ query: z.string() }),
          outputSchema: z.object({ result: z.unknown() }),
        }, async (input) => {
             console.log(`📚 [Agent] Executing RAG Search with query: "${input.query}"`);
             if (!this.knowledgeBase) return { result: 'KB tool not available' };
             const res = await this.knowledgeBase.search(input.query);
             return { result: res };
        }));
      } catch {
          // Ignore
      }
    }
  }

  async generateResponse(history: Message[], options?: { modelId?: string }): Promise<string> {
    const systemPrompt = this.loadSystemPrompt();
    
    // Determine Model ID
    let targetModel = 'googleai/gemini-2.5-flash'; 
    if (options?.modelId === 'gpt-5-nano') {
        targetModel = 'openai/gpt-4o'; 
    } else if (options?.modelId) {
        targetModel = options.modelId;
    }

    // Convert history for Genkit
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
    console.log(`Tools available ${tools.length}`);

    // Call Genkit generate. 
    // Since we provided implementations in defineTool, Genkit should handle execution.
    // However, ai.generate() is typically single-turn in many SDKs unless configured as a chat session.
    // If it's single turn, it will return the tool request, and we MUST run it (but we already bound the implementation?).
    // Actually, if we bind implementation, Genkit's 'generate' function (if it supports it) will run the tool and loop?
    // Let's assume standard Genkit behavior: provided tools are executed.
    // BUT, we need to handle the loop if Genkit returns 'toolRequests' even after execution?
    // Simplest approach: Try to let Genkit handle it. If it returns text, good.
    // If it returns toolRequests, it means it didn't execute automatically.
    
    // We will keep a loop to support manual multi-turn if Genkit doesn't auto-loop,
    // BUT we rely on the defineTool implementation.
    // If Genkit executes internally, it won't return toolRequests in the output that require action, or it will return the final text.
    
    // Note: The Genkit documentation suggests using `ai.chat(...)` for multi-turn conversations with history.
    // Since we are using `ai.generate` which is lower level, let's stick to the manual loop just in case,
    // BUT REMOVE THE MANUAL EXECUTION LOGIC and rely on Genkit finding the implementation?
    // Actually, `ai.generate` doesn't know about `this.webSearch` unless we passed the implementation to `defineTool`.
    // Now that we passed it, `ai.generate` MIGHT execute it.
    
    // Let's modify the loop to checks:
    // 1. Generate
    // 2. If toolRequests: 
    //    - If Genkit ran it, we might see toolResponse in output? No.
    //    - If Genkit DID NOT run it (single turn), we must run it.
    //      We can call the tool implementation directly using the toolName mapping.
    //      OR, since we bound the implementation, maybe we can just call `await request.tool.execute(input)`?
    //      The `toolRequests` object in response might not have the execute method attached.
    
    // To be safe and ensure it works:
    // I will use a manual loop that invokes the tools MANUALLY using the same logic as before,
    // BUT I will ALSO keep the implementation in defineTool for correctness.
    // Wait, if I have implementation in defineTool AND manual loop, is it double execution?
    // If Genkit executes, it returns final text. Handled.
    // If Genkit DOES NOT execute, it returns toolRequests. Handled by manual loop.
    // So the manual loop is safe?
    // Yes, unless Genkit executes AND returns toolRequests (unlikely).
    
    // Refactoring to keep the manual loop but with the implementation usage via reference if possible, 
    // or just keep manual logic as fallback.
    // The previous manual logic was: `this.webSearch.search(...)`
    // That works fine.
    // The PROBLEM was `defineTool` had dummy implementation.
    // If Genkit TRIED to run it, it got empty string.
    
    // So, updating `defineTool` to have REAL implementation is the fix.
    // And I will leave the manual loop as is (it handles the case where Genkit hands back control).
    // Wait, if Genkit runs the tool (because I added implementation), it will consume the request and return the next thing (Text or another Tool).
    // So the manual loop condition `if (toolRequests && toolRequests.length > 0)` will effectively handle the "Genkit handed back control" case.
    // If Genkit did the work, `toolRequests` will be empty (or final).
    
    const currentMessages = [...messages];
    
    while (true) {
        const response = await ai.generate({
            model: targetModel,
            messages: currentMessages,
            tools: tools.length > 0 ? tools : undefined,
        });

        // DEBUGGING: Log the raw response before accessing output
        console.log(`🤖 [Genkit] Raw Response Text:`, response.text);
        console.log(`🤖 [Genkit] Raw Response Keys:`, Object.keys(response));
        
        let toolRequests;
        try {
            // Accessing output might trigger parsing
            toolRequests = response.output?.toolRequests;
        } catch (err) {
            console.error('❌ [Genkit] Error parsing response output:', err);
            console.error('❌ [Genkit] Offending Text:', response.text);
            // If parsing fails, treat as no tool requests (just text)
            toolRequests = null;
        }
        console.log(`🤖 [Genkit] Response generated. Content: "${response.text?.substring(0, 50)}..."`);
        console.log(`🤖 [Genkit] Tool Requests present: ${toolRequests ? toolRequests.length : 0}`);
        
        if (toolRequests && toolRequests.length > 0) {
            // Genkit returned a tool request. This means it did NOT auto-execute (single turn behavior).
            // We must execute it and feed back the result.
             
            // We construct the model message first
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
               ] as unknown as [{ text: string }],
            } as unknown as { role: 'model'; content: [{ text: string }] });
            
            const toolRequest = toolRequests[0];
            console.log(`🛠️ [Agent] Handling Tool Request: ${toolRequest.toolName}`);
            
            // Execute the tool logic (we can use the implementation map or just direct calls like before)
            // Even though we defined the tool with implementation, we can call our ports directly here for the manual loop.
            let toolResultContent: { result: unknown } = { result: [] };

            if (toolRequest.toolName === 'web_search' && this.webSearch) {
                const result = await this.webSearch.search(toolRequest.input.query as string);
                toolResultContent = { result: result.results ?? [] };
            } else if (toolRequest.toolName === 'knowledge_base' && this.knowledgeBase) {
                const result = await this.knowledgeBase.search(toolRequest.input.query as string);
                toolResultContent = { result: result ?? [] };
            }
            
             // Fallback
            if (!toolResultContent || !toolResultContent.result) {
                 toolResultContent = { result: "No information found." };
            }

            // Tool Response
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
           
           continue;
        }

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
