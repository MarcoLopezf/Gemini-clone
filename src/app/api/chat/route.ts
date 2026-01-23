import { GenkitAgent } from '../../../infrastructure/ai/GenkitAgent';
import { TavilySearchProvider } from '../../../infrastructure/tools/implementation/TavilySearchProvider';
import { LocalVectorKnowledgeBase } from '../../../infrastructure/tools/implementation/LocalVectorKnowledgeBase';
import { InMemoryConversationRepository } from '../../../infrastructure/repositories/InMemoryConversationRepository';
import { Conversation } from '../../../core/domain/entities/Conversation';

// Singleton setup to persist memory during development hot-reloads
const globalForService = globalThis as unknown as {
  agent: GenkitAgent;
  repo: InMemoryConversationRepository;
};

if (!globalForService.agent) {
  console.log('🏗️ [System] Initializing Dependencies...');
  
  const tavilyKey = process.env.TAVILY_API_KEY || '';
  if (!tavilyKey) console.warn('⚠️ [System] TAVILY_API_KEY is missing');
  
  const searchTool = new TavilySearchProvider(tavilyKey);
  const ragTool = new LocalVectorKnowledgeBase();
  console.log('📚 [System] RAG Knowledge Base initializing (async vectorization)...');
  
  globalForService.agent = new GenkitAgent(searchTool, ragTool);
  globalForService.repo = new InMemoryConversationRepository();
  console.log('✅ [System] Dependencies Ready. Brain Active.');
}

const agent = globalForService.agent;
const repo = globalForService.repo;

// GET: List conversations or get single conversation
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (id) {
      // Get single conversation details
      const conversation = await repo.findById(id);
      if (!conversation) {
        return new Response('Not found', { status: 404 });
      }
      
      const history = conversation.getHistory();
      return Response.json({ 
        id: conversation.id,
        messages: history.map(m => ({ 
          role: m.role === 'model' ? 'assistant' : m.role, 
          content: m.content 
        })) 
      });
    } else {
      // List all conversations
      const conversations = await repo.findAll();
      return Response.json(conversations.map(c => {
        const history = c.getHistory();
        return {
          id: c.id,
          title: history[0]?.content.substring(0, 40) || 'New Chat',
          messageCount: history.length,
        };
      }));
    }
  } catch (error: unknown) {
    console.error('❌ [API GET Error]:', error);
    const errorMessage = error instanceof Error ? error.message : 'Internal Server Error';
    return Response.json({ error: errorMessage }, { status: 500 });
  }
}

// POST: Send message and stream response
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { messages, modelId, conversationId } = body;

    // Basic validation
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return new Response(JSON.stringify({ error: 'Messages array is mandatory' }), { 
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Get or create conversation
    let conversation: Conversation;
    if (conversationId) {
      const existing = await repo.findById(conversationId);
      conversation = existing || new Conversation();
    } else {
      conversation = new Conversation();
    }

    // Add user message to conversation
    const lastMessage = messages[messages.length - 1];
    if (lastMessage.role === 'user') {
      conversation.addMessage('user', lastMessage.content);
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
          let fullResponse = '';
          const generator = agent.generateStream(domainMessages, { modelId });
          
          for await (const chunk of generator) {
            controller.enqueue(new TextEncoder().encode(chunk));
            fullResponse += chunk;
          }
          
          // Save AI response to conversation
          if (fullResponse) {
            conversation.addMessage('model', fullResponse);
          }
          await repo.save(conversation);
          
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
        'X-Conversation-Id': conversation.id,
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
