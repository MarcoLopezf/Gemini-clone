/**
 * GenkitAgent
 *
 * Implementation of GenerativeAgent using Google Genkit.
 */

import { genkit } from 'genkit';
import { googleAI, gemini15Flash } from '@genkit-ai/googleai';
import { GenerativeAgent } from '../../core/domain/interfaces/GenerativeAgent';
import { Message } from '../../core/domain/entities/Message';

// Initialize Genkit
const ai = genkit({
  plugins: [googleAI()],
  model: gemini15Flash,
});

export class GenkitAgent implements GenerativeAgent {
  async generateResponse(history: Message[]): Promise<string> {
    const response = await ai.generate({
      messages: history.map((msg) => ({
        role: (msg.role === 'model' ? 'model' : 'user') as 'model' | 'user',
        content: [{ text: msg.content }],
      })),
    });

    return response.text;
  }
}
