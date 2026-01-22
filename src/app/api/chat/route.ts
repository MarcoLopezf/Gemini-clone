import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { SendMessageUseCase } from '../../../core/application/use-cases/SendMessage';
import { InMemoryConversationRepository } from '../../../infrastructure/repositories/InMemoryConversationRepository';
import { GenkitAgent } from '../../../infrastructure/ai/GenkitAgent';
import { TavilySearchProvider } from '../../../infrastructure/tools/implementation/TavilySearchProvider';
import { LocalVectorKnowledgeBase } from '../../../infrastructure/tools/implementation/LocalVectorKnowledgeBase';
import { Conversation } from '../../../core/domain/entities/Conversation';

// Singleton setup to persist memory during development hot-reloads
const globalForService = globalThis as unknown as {
  useCase: SendMessageUseCase;
  repo: InMemoryConversationRepository;
};

if (!globalForService.useCase) {
  console.log('🏗️ [System] Initializing Dependencies...');
  
  // Infrastructure
  const repo = new InMemoryConversationRepository();
  // Ensure we have an API key, fallback to empty string might cause runtime errors if used, 
  // but allows build to pass. Ideally we check process.env
  const tavilyKey = process.env.TAVILY_API_KEY || '';
  if (!tavilyKey) console.warn('⚠️ [System] TAVILY_API_KEY is missing');
  
  const searchTool = new TavilySearchProvider(tavilyKey);
  const ragTool = new LocalVectorKnowledgeBase();
  
  // Load RAG documents
  try {
    const docPath = path.join(process.cwd(), 'src/infrastructure/data/docs/rag_survey.md');
    if (fs.existsSync(docPath)) {
        const content = fs.readFileSync(docPath, 'utf-8');
        ragTool.index([{
            id: 'rag_survey',
            content: content,
            metadata: { source: 'rag_survey.md' }
        }]);
        console.log('📚 [System] RAG Knowledge Base loaded.');
    } else {
        console.warn('⚠️ [System] RAG document not found at:', docPath);
    }
  } catch (err) {
      console.error('❌ [System] Failed to load RAG docs:', err);
  }
  
  // Agent with tools
  const agent = new GenkitAgent(searchTool, ragTool);

  globalForService.repo = repo;
  globalForService.useCase = new SendMessageUseCase(repo, agent);
  console.log('✅ [System] Dependencies Ready. Brain Active.');
}

const useCase = globalForService.useCase;
const repo = globalForService.repo;

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { messages, conversationId, modelId } = body;
    
    // Basic validation
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
        return NextResponse.json({ error: 'Messages array is mandatory' }, { status: 400 });
    }

    const lastMessage = messages[messages.length - 1];
    let targetId = conversationId;

    // Session Management (MVP)
    // If no ID provided, create new. 
    // If ID provided but not found (server restart), create new (or handle error).
    if (!targetId) {
       const newConv = new Conversation();
       await repo.save(newConv);
       targetId = newConv.id;
    } else {
        const exists = await repo.findById(targetId);
        if (!exists) {
             const newConv = new Conversation(targetId); // Try to preserve ID or create new? 
             // Logic: If client sends an ID that doesn't exist in memory (restart), 
             // strictly speaking we lost the history. 
             // We'll create a new conversation with that ID to allow continuing (though context is lost).
             await repo.save(newConv);
        }
    }

    const response = await useCase.execute({
      conversationId: targetId,
      content: lastMessage.content,
      modelId: modelId
    });

    return NextResponse.json({
      id: response.conversationId,
      role: 'model', // Domain uses 'model', Vercel AI SDK usually expects 'assistant' but 'model' is fine if frontend adapts
      content: response.modelResponse,
    });

  } catch (error: unknown) {
    console.error('❌ [API Error]:', error);
    const errorMessage = error instanceof Error ? error.message : 'Internal Server Error';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
