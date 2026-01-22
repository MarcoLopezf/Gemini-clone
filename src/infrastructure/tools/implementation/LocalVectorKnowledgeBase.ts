import fs from 'fs';
import path from 'path';
import { genkit } from 'genkit';
import { openAI, textEmbedding3Small } from 'genkitx-openai';
import { semanticChunk } from '../utils/semanticChunker';

// Initialize Genkit with OpenAI Plugin for Embeddings
const ai = genkit({
  plugins: [
    openAI({ apiKey: process.env.OPENAI_API_KEY })
  ],
});

interface DocumentChunk {
  id: number;
  text: string;
  vector?: number[];
}

/**
 * Extracts the embedding vector from the Genkit embed result.
 * Handles different possible return formats from the API.
 */
function extractEmbedding(result: unknown): number[] | null {
  // Log the raw result for debugging
  console.log('🔬 [RAG] Raw embed result type:', typeof result);
  console.log('🔬 [RAG] Raw embed result:', JSON.stringify(result, null, 2)?.substring(0, 500));
  
  // Case 1: Direct array of numbers
  if (Array.isArray(result)) {
    if (typeof result[0] === 'number') {
      return result as number[];
    }
    // Case 2: Array of objects with embedding property
    if (result[0] && typeof result[0] === 'object' && 'embedding' in result[0]) {
      return (result[0] as { embedding: number[] }).embedding;
    }
  }
  
  // Case 3: Object with embedding property
  if (result && typeof result === 'object' && 'embedding' in result) {
    return (result as { embedding: number[] }).embedding;
  }
  
  // Case 4: Object with data array containing embedding
  if (result && typeof result === 'object' && 'data' in result) {
    const data = (result as { data: Array<{ embedding: number[] }> }).data;
    if (Array.isArray(data) && data[0]?.embedding) {
      return data[0].embedding;
    }
  }
  
  console.error('❌ [RAG] Could not extract embedding from result');
  return null;
}

/**
 * LocalVectorKnowledgeBase
 * 
 * Real RAG implementation using OpenAI text-embedding-3-small for vectorization.
 * Reads rag_survey.md, chunks it, embeds it, and stores vectors in memory.
 * Search uses Cosine Similarity between query vector and document vectors.
 */
export class LocalVectorKnowledgeBase {
  private chunks: DocumentChunk[] = [];
  private isIndexed: boolean = false;
  private readonly docsPath: string;
  private initializationPromise: Promise<void>;

  constructor() {
    console.log('🧠 [RAG] ====================================');
    console.log('🧠 [RAG] LocalVectorKnowledgeBase Initialized');
    console.log('🧠 [RAG] Using OpenAI text-embedding-3-small');
    console.log('🧠 [RAG] ====================================');
    
    this.docsPath = path.join(
      process.cwd(),
      'src/infrastructure/data/docs/rag_survey.md'
    );
    
    console.log(`📁 [RAG] Doc path: ${this.docsPath}`);
    console.log(`🔑 [RAG] OpenAI Key present: ${process.env.OPENAI_API_KEY ? 'YES ' : 'NO ⚠️'}`);
    
    // Store initialization promise so search() can await it
    this.initializationPromise = this.indexDocuments().catch(err => {
        console.error('❌ [RAG Init Error]', err);
    });
  }

  /**
   * Wait for initialization to complete (useful for first requests)
   */
  async waitForReady(): Promise<boolean> {
    await this.initializationPromise;
    return this.isIndexed;
  }

  /**
   * 1. Ingest & Vectorize Process
   */
  private async indexDocuments() {
    console.log('');
    console.log('🔄 [RAG] ========== STARTING VECTORIZATION ==========');
    const startTime = Date.now();
    
    try {
        if (!fs.existsSync(this.docsPath)) {
            console.error(`❌ [RAG] Doc not found at: ${this.docsPath}`);
            return;
        }
        console.log('✅ [RAG] Document file exists');

        const content = fs.readFileSync(this.docsPath, 'utf-8');
        console.log(`📖 [RAG] Document loaded: ${content.length} characters`);
        
        // Semantic chunking with overlap for better context preservation
        const rawChunks = semanticChunk(content, {
            maxChunkSize: 500,      // ~500 chars per chunk
            overlapSize: 100,       // 100 chars overlap between chunks
            preserveHeaders: true   // Keep markdown headers
        });
        console.log(`📄 [RAG] Document split into ${rawChunks.length} semantic chunks`);
        console.log(`📊 [RAG] Avg chunk size: ${Math.round(content.length / rawChunks.length)} chars | Overlap: 100 chars`);

        console.log('');
        console.log('🚀 [RAG] Starting embedding generation...');
        console.log('📡 [RAG] Calling OpenAI API for each chunk...');
        
        let successCount = 0;
        let errorCount = 0;
        
        // Generate Embeddings in parallel
        this.chunks = await Promise.all(
            rawChunks.map(async (text, index) => {
                try {
                    const result = await ai.embed({
                        embedder: textEmbedding3Small,
                        content: text
                    });
                    
                    const embedding = extractEmbedding(result);
                    
                    if (embedding) {
                        successCount++;
                        if (successCount <= 3 || successCount % 20 === 0) {
                            console.log(`  ✓ [RAG] Chunk ${index + 1}/${rawChunks.length} embedded (${embedding.length} dims)`);
                        }
                        
                        return {
                            id: index,
                            text: text.trim(),
                            vector: embedding,
                        };
                    } else {
                        errorCount++;
                        return { id: index, text: text.trim() };
                    }
                } catch (e) {
                    errorCount++;
                    console.warn(`  ⚠️ [RAG] Failed to embed chunk ${index}:`, e instanceof Error ? e.message : e);
                    return { id: index, text: text.trim() };
                }
            })
        );

        const duration = ((Date.now() - startTime) / 1000).toFixed(2);
        const vectorizedCount = this.chunks.filter(c => c.vector).length;
        
        console.log('');
        console.log('🏁 [RAG] ========== VECTORIZATION COMPLETE ==========');
        console.log(`✅ [RAG] Vectors created: ${vectorizedCount}/${rawChunks.length}`);
        console.log(`❌ [RAG] Errors: ${errorCount}`);
        console.log(`⏱️  [RAG] Duration: ${duration}s`);
        console.log('🟢 [RAG] Vector Store is READY for queries!');
        console.log('====================================================');
        console.log('');
        
        this.isIndexed = true;

    } catch (error) {
        console.error('❌ [RAG] Critical Indexing Error:', error);
    }
  }

  /**
   * 2. Semantic Search
   */
  async search(query: string): Promise<string[]> {
    console.log('');
    console.log('🔍 [RAG] ========== SEARCH REQUEST ==========');
    console.log(`🔍 [RAG] Query: "${query}"`);
    
    // Wait for indexing to complete if not ready
    if (!this.isIndexed) {
        console.warn('⏳ [RAG] Indexing in progress. Waiting for completion...');
        await this.initializationPromise;
        if (!this.isIndexed) {
            console.warn('⚠️ [RAG] Indexing failed. Returning empty results.');
            return [];
        }
        console.log('✅ [RAG] Indexing complete. Proceeding with search.');
    }
    
    console.log(`📊 [RAG] Index Status: READY`);
    console.log(`📦 [RAG] Chunks in memory: ${this.chunks.length}`);
    console.log(`📦 [RAG] Chunks with vectors: ${this.chunks.filter(c => c.vector).length}`);

    try {
        console.log('📡 [RAG] Embedding query via OpenAI...');
        const queryStart = Date.now();
        
        // Embed the user query
        const result = await ai.embed({
            embedder: textEmbedding3Small,
            content: query
        });
        
        const queryVector = extractEmbedding(result);
        
        if (!queryVector) {
            console.error('❌ [RAG] Failed to extract query embedding');
            return [];
        }
        
        console.log(`✅ [RAG] Query embedded (${queryVector.length} dims) in ${Date.now() - queryStart}ms`);

        // Calculate Cosine Similarity
        console.log('🧮 [RAG] Calculating cosine similarity...');
        const scoredChunks = this.chunks
            .filter(chunk => chunk.vector)
            .map(chunk => ({
                text: chunk.text,
                score: this.cosineSimilarity(queryVector, chunk.vector!)
            }))
            .sort((a, b) => b.score - a.score);

        // Show top 5 matches for debugging
        console.log('');
        console.log('📊 [RAG] Top 5 Similarity Scores:');
        scoredChunks.slice(0, 5).forEach((match, i) => {
            const preview = match.text.substring(0, 50).replace(/\n/g, ' ');
            console.log(`  ${i + 1}. Score: ${match.score.toFixed(4)} | "${preview}..."`);
        });
        
        // Return Top 3 relevant chunks (Score > 0.3 threshold)
        const results = scoredChunks
            .filter(match => match.score > 0.3)
            .slice(0, 3)
            .map(match => match.text);
            
        console.log('');
        console.log(`🎯 [RAG] Returning ${results.length} results (threshold > 0.3)`);
        console.log('==========================================');
        console.log('');

        return results;

    } catch (error) {
        console.error('❌ [RAG] Search Error:', error);
        return [];
    }
  }

  /**
   * Math Helper: Cosine Similarity
   */
  cosineSimilarity(vecA: number[], vecB: number[]): number {
    const dotProduct = vecA.reduce((sum, a, i) => sum + a * vecB[i], 0);
    const magnitudeA = Math.sqrt(vecA.reduce((sum, a) => sum + a * a, 0));
    const magnitudeB = Math.sqrt(vecB.reduce((sum, b) => sum + b * b, 0));
    return dotProduct / (magnitudeA * magnitudeB);
  }
}
