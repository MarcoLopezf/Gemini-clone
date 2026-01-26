import { describe, it, expect, beforeAll, beforeEach, vi } from 'vitest';
import { genkit } from 'genkit';
import { openAI } from 'genkitx-openai';
import * as dotenv from 'dotenv';
import { GenkitAgent } from './GenkitAgent';

// Load env vars for the test (OpenAI Key)
dotenv.config({ path: '.env' });

// Create a fresh Genkit client for this test file using OpenAI
// Using gpt-4o-mini for the agent (fast and cheap) and gpt-4o for the judge (accurate)
const evalGenkitClient = genkit({
  plugins: [openAI({ apiKey: process.env.OPENAI_API_KEY })],
  model: 'openai/gpt-4o-mini',
});

// Setup Judge (OpenAI GPT-4o for accurate evaluation)
const judgeAi = genkit({
  plugins: [openAI({ apiKey: process.env.OPENAI_API_KEY })],
  model: 'openai/gpt-4o',
});

// Helper to consume the agent's stream and return full text
async function getAgentResponse(agent: GenkitAgent, query: string, tools?: string[]) {
  const generator = agent.generateStream(
    [{ role: 'user', content: query }],
    { activeTools: tools, modelId: 'openai/gpt-4o-mini' }
  );
  let fullText = '';
  for await (const chunk of generator) {
    fullText += chunk;
  }
  return fullText;
}

// Helper: The AI Judge Logic
async function evaluateResponse(question: string, agentResponse: string, expectedContext: string) {
  const prompt = `
    ROLE: You are an impartial AI Judge evaluating a Chatbot's performance.
    
    INPUT DATA:
    - User Question: "${question}"
    - Expected Fact (from Tool): "${expectedContext}"
    - Chatbot Response: "${agentResponse}"
    
    TASK:
    1. Did the chatbot answer the question?
    2. Is the chatbot's answer consistent with the "Expected Fact"?
    
    OUTPUT:
    Return ONLY a JSON object: { "pass": boolean, "reason": string }
  `;

  const result = await judgeAi.generate({
    prompt: prompt,
    config: { temperature: 0.1 }
  });

  const text = result.text.replace(/\`\`\`json|\`\`\`/g, '').trim();
  return JSON.parse(text);
}

describe('🤖 GenkitAgent AI Evaluation (Judge: GPT-4o)', () => {
  let agent: GenkitAgent;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let mockWebSearch: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let mockKnowledgeBase: any;

  beforeAll(() => {
    // Mock Dependencies
    mockWebSearch = {
      search: vi.fn().mockResolvedValue({ results: "Bitcoin price is $150,000 USD as of today." })
    };

    mockKnowledgeBase = {
      search: vi.fn().mockResolvedValue(["RAG stands for Retrieval Augmented Generation.", "It combines search with generation."])
    };

    // Instantiate Agent with Mocks AND injected fresh Genkit client
    agent = new GenkitAgent(mockWebSearch, mockKnowledgeBase, evalGenkitClient);
  });

  beforeEach(() => {
    // Clear mocks before each test
    mockWebSearch.search.mockClear();
    mockKnowledgeBase.search.mockClear();
  });

  it('should use Web Search for crypto prices and answer correctly', async () => {
    const question = "What is the price of Bitcoin right now?";

    // Run Agent
    const response = await getAgentResponse(agent, question, ['web_search']);
    console.log('📝 Agent Response (Web):', response.substring(0, 200));

    // Verify Tool Call (Spies)
    expect(mockWebSearch.search).toHaveBeenCalled();

    // Verify Logic with AI Judge
    const verdict = await evaluateResponse(question, response, "Bitcoin price is $150,000 USD");

    console.log(`👨‍⚖️ Verdict (Web):`, verdict);
    expect(verdict.pass).toBe(true);
  }, 60000);

  it('should use Knowledge Base for RAG questions', async () => {
    const question = "Explain what RAG means based on our docs.";

    // Run Agent
    const response = await getAgentResponse(agent, question, ['knowledge_base']);
    console.log('📝 Agent Response (RAG):', response.substring(0, 200));

    // Verify Tool Call
    expect(mockKnowledgeBase.search).toHaveBeenCalled();

    // Verify Logic with AI Judge
    const verdict = await evaluateResponse(question, response, "RAG stands for Retrieval Augmented Generation");

    console.log(`👨‍⚖️ Verdict (RAG):`, verdict);
    expect(verdict.pass).toBe(true);
  }, 60000);

  it('should respect tool toggles (disable all tools)', async () => {
    const question = "What is the capital of France?";

    // Run with NO tools enabled - agent should answer from its own knowledge
    const response = await getAgentResponse(agent, question, []);
    console.log('📝 Agent Response (No Tools):', response.substring(0, 200));

    // Verify that NO tools were called
    expect(mockWebSearch.search).not.toHaveBeenCalled();
    expect(mockKnowledgeBase.search).not.toHaveBeenCalled();

    // The agent should still be able to answer general knowledge questions
    const verdict = await evaluateResponse(
      question,
      response,
      "Paris is the capital of France"
    );

    console.log(`👨‍⚖️ Verdict (No Tools):`, verdict);
    expect(verdict.pass).toBe(true);
  }, 60000);
});
