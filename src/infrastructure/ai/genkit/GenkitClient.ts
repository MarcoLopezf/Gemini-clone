/**
 * GenkitClient
 * 
 * Singleton initialization of Genkit AI client with plugins.
 * Responsible only for AI client setup - no business logic.
 */

import { genkit } from 'genkit';
import { openAI } from 'genkitx-openai';
import { googleAI } from '@genkit-ai/google-genai';

/**
 * Initialized Genkit client with Google AI and OpenAI plugins.
 * This is a singleton - the same instance is reused across the application.
 */
export const genkitClient = genkit({
  plugins: [
    googleAI(),
    openAI({ apiKey: process.env.OPENAI_API_KEY })
  ],
  model: 'googleai/gemini-2.5-flash',
});

/**
 * Type export for the Genkit client instance
 */
export type GenkitClientType = typeof genkitClient;
