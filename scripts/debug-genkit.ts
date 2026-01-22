import { genkit } from 'genkit';
import { googleAI } from '@genkit-ai/google-genai';

// Simple script to debug Genkit message construction manually
async function debugGenkit() {
  const ai = genkit({
    plugins: [googleAI()],
    model: 'googleai/gemini-1.5-flash',
  });

  // Mock a history where model requests a tool, and we provide the response
  const messages: any[] = [
      { role: 'user', content: [{ text: 'tell me about rag' }] },
      { role: 'model', content: [{ toolRequest: { name: 'knowledge_base', input: { query: 'rag' }, ref: 'ref-123' } }] },
      // Try construct tool response
      { role: 'tool', content: [{ toolResponse: { name: 'knowledge_base', output: { result: 'rag is cool' }, ref: 'ref-123' } }] }
  ];

  try {
      console.log('Testing generate with manual history...');
      const response = await ai.generate({
          messages: messages,
          // tools not strictly needed if we are just continuing conversation, but good to have
      });
      console.log('Success:', response.text);
  } catch (e) {
      console.error('Failed:', e);
  }
}

debugGenkit();
