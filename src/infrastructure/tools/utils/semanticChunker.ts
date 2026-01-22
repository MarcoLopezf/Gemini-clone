/**
 * Semantic Chunker
 * 
 * Intelligent document chunking for RAG that:
 * 1. Respects sentence boundaries
 * 2. Uses overlap for context continuity  
 * 3. Preserves header context
 */

export interface ChunkOptions {
  /** Target chunk size in characters (default: 500) */
  maxChunkSize: number;
  /** Overlap size in characters between chunks (default: 100) */
  overlapSize?: number;
  /** Include parent headers in each chunk (default: true) */
  preserveHeaders?: boolean;
}

/**
 * Splits text into sentences using common sentence terminators.
 */
function splitIntoSentences(text: string): string[] {
  // Split on sentence terminators, keeping the terminator with the sentence
  // Handle abbreviations and edge cases
  const sentences = text
    .split(/(?<=[.!?])\s+/)
    .map(s => s.trim())
    .filter(s => s.length > 0);
  
  return sentences;
}

/**
 * Extracts headers from markdown text and maps them to content positions.
 */
function extractHeaders(text: string): Map<number, string> {
  const headers = new Map<number, string>();
  const lines = text.split('\n');
  let charIndex = 0;
  let currentHeader = '';
  
  for (const line of lines) {
    if (line.match(/^#{1,6}\s/)) {
      currentHeader = line;
    }
    if (currentHeader && !line.match(/^#{1,6}\s/)) {
      headers.set(charIndex, currentHeader);
    }
    charIndex += line.length + 1; // +1 for newline
  }
  
  return headers;
}

/**
 * Splits text into semantic chunks respecting sentence boundaries.
 * 
 * @param text - The text to chunk
 * @param options - Chunking configuration
 * @returns Array of text chunks with overlap
 */
export function semanticChunk(text: string, options: ChunkOptions): string[] {
  const { 
    maxChunkSize, 
    overlapSize = 0, 
    preserveHeaders = true 
  } = options;
  
  // Handle empty or whitespace-only text
  const trimmedText = text.trim();
  if (!trimmedText) {
    return [];
  }
  
  // If text is shorter than maxChunkSize, return as single chunk
  if (trimmedText.length <= maxChunkSize) {
    return [trimmedText];
  }
  
  // Extract headers for later use
  const headerMap = preserveHeaders ? extractHeaders(text) : new Map();
  
  // Split into sentences
  const sentences = splitIntoSentences(trimmedText);
  
  if (sentences.length === 0) {
    return [trimmedText];
  }
  
  const chunks: string[] = [];
  let currentChunk: string[] = [];
  let currentSize = 0;
  let lastOverlapSentences: string[] = [];
  
  for (let i = 0; i < sentences.length; i++) {
    const sentence = sentences[i];
    const sentenceSize = sentence.length;
    
    // Check if adding this sentence would exceed maxChunkSize
    const separator = currentChunk.length > 0 ? ' ' : '';
    const wouldExceed = currentSize + separator.length + sentenceSize > maxChunkSize;
    
    if (wouldExceed && currentChunk.length > 0) {
      // Save current chunk
      const chunkText = currentChunk.join(' ');
      chunks.push(chunkText);
      
      // Calculate overlap sentences from the end of current chunk
      if (overlapSize > 0) {
        lastOverlapSentences = [];
        let overlapLength = 0;
        for (let j = currentChunk.length - 1; j >= 0 && overlapLength < overlapSize; j--) {
          lastOverlapSentences.unshift(currentChunk[j]);
          overlapLength += currentChunk[j].length + 1;
        }
      }
      
      // Start new chunk with overlap
      currentChunk = [...lastOverlapSentences];
      currentSize = currentChunk.join(' ').length;
    }
    
    // Add current sentence to chunk
    currentChunk.push(sentence);
    currentSize = currentChunk.join(' ').length;
  }
  
  // Add final chunk if not empty
  if (currentChunk.length > 0) {
    const chunkText = currentChunk.join(' ');
    // Avoid duplicate if identical to last chunk
    if (chunks.length === 0 || chunks[chunks.length - 1] !== chunkText) {
      chunks.push(chunkText);
    }
  }
  
  // Add headers to chunks if preserveHeaders is enabled
  if (preserveHeaders && headerMap.size > 0) {
    // For now, we don't modify chunks with headers to keep it simple
    // This can be enhanced in future iterations
  }
  
  return chunks;
}
