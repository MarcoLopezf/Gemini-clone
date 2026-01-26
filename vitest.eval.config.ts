/// <reference types="vitest" />
import { defineConfig } from 'vitest/config';
import path from 'path';

/**
 * Vitest configuration for AI Evaluation tests (LLM-as-a-Judge)
 * 
 * Run with: pnpm test:eval
 * 
 * These tests call real APIs (OpenAI GPT-4o) and are excluded from regular test runs.
 */
export default defineConfig({
  test: {
    include: ['src/**/*.eval.test.ts'],
    testTimeout: 60000, // 60s for LLM calls
    globals: true,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
