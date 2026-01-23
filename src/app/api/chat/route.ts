import { GenkitAgent } from '../../../infrastructure/ai/GenkitAgent';
import { TavilySearchProvider } from '../../../infrastructure/tools/implementation/TavilySearchProvider';
import { LocalVectorKnowledgeBase } from '../../../infrastructure/tools/implementation/LocalVectorKnowledgeBase';

// Singleton setup to persist memory during development hot-reloads
const globalForService = globalThis as unknown as {
  agent: GenkitAgent;
};

if (!globalForService.agent) {
  console.log('🏗️ [System] Initializing Dependencies...');
  
  const tavilyKey = process.env.TAVILY_API_KEY || '';
  if (!tavilyKey) console.warn('⚠️ [System] TAVILY_API_KEY is missing');
  
  const searchTool = new TavilySearchProvider(tavilyKey);
  const ragTool = new LocalVectorKnowledgeBase();
  console.log('📚 [System] RAG Knowledge Base initializing (async vectorization)...');
  
  globalForService.agent = new GenkitAgent(searchTool, ragTool);
  console.log('✅ [System] Dependencies Ready. Brain Active.');
}

const agent = globalForService.agent;

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { messages, modelId } = body;

    // Basic validation
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return new Response(JSON.stringify({ error: 'Messages array is mandatory' }), { 
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Convert frontend messages to domain format
    const domainMessages = messages.map((m: { role: string; content: string }) => ({
      role: (m.role === 'assistant' ? 'model' : 'user') as 'user' | 'model',
      content: m.content,
    }));

    // Create streaming response
    const stream = new ReadableStream({
      async start(controller) {
        try {
          const generator = agent.generateStream(domainMessages, { modelId });
          for await (const chunk of generator) {
            controller.enqueue(new TextEncoder().encode(chunk));
          }
          controller.close();
        } catch (e) {
          console.error('❌ [Stream Error]:', e);
          controller.error(e);
        }
      }
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Transfer-Encoding': 'chunked',
        'Cache-Control': 'no-cache',
      }
    });

  } catch (error: unknown) {
    console.error('❌ [API Error]:', error);
    const errorMessage = error instanceof Error ? error.message : 'Internal Server Error';
    return new Response(JSON.stringify({ error: errorMessage }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
