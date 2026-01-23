/**
 * PromptLoader
 * 
 * Utility for loading and parsing prompt files.
 * Supports frontmatter stripping for Genkit-style prompts.
 */

import fs from 'fs';
import path from 'path';

const DEFAULT_PROMPT_PATH = 'src/infrastructure/ai/prompts/system.prompt';

/**
 * Loads a system prompt from the filesystem.
 * Strips YAML frontmatter if present (between --- delimiters).
 * 
 * @param promptPath - Optional custom path to prompt file
 * @returns The prompt content, or empty string if file not found
 */
export function loadSystemPrompt(promptPath?: string): string {
  const targetPath = promptPath ?? path.join(process.cwd(), DEFAULT_PROMPT_PATH);
  
  try {
    const fileContent = fs.readFileSync(targetPath, 'utf-8');
    // Strip frontmatter if present (between --- and ---)
    return fileContent.replace(/^---[\s\S]*?---\n/, '').trim();
  } catch (error) {
    console.warn('[PromptLoader] Failed to load system prompt:', error);
    return '';
  }
}
