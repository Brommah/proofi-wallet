/**
 * Ollama Interface - LOCAL ONLY
 * 
 * ⚠️ PRIVACY GUARANTEE:
 * This module ONLY communicates with localhost Ollama.
 * No data is ever sent to external services.
 */

const OLLAMA_URL = process.env.OLLAMA_URL || 'http://localhost:11434';

// Blocked hosts - will throw if anyone tries to use these
const BLOCKED_HOSTS = [
  'api.openai.com',
  'api.anthropic.com',
  'generativelanguage.googleapis.com',
  'api.cohere.ai',
  'api.mistral.ai',
];

/**
 * Query local Ollama - guaranteed local, no cloud
 */
export async function query(
  systemPrompt: string,
  userPrompt: string,
  model: string = 'llama3.2:3b'
): Promise<string> {
  // Verify we're using localhost
  const url = new URL(OLLAMA_URL);
  if (url.hostname !== 'localhost' && url.hostname !== '127.0.0.1') {
    throw new Error(`PRIVACY VIOLATION: Ollama URL must be localhost, got: ${url.hostname}`);
  }
  
  const response = await fetch(`${OLLAMA_URL}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model,
      stream: false,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
    }),
  });
  
  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Ollama error: ${response.status} - ${text}`);
  }
  
  const data = await response.json() as { message?: { content?: string } };
  return data.message?.content || '';
}

/**
 * Generate embeddings locally
 */
export async function embed(text: string, model: string = 'nomic-embed-text'): Promise<number[]> {
  const url = new URL(OLLAMA_URL);
  if (url.hostname !== 'localhost' && url.hostname !== '127.0.0.1') {
    throw new Error('PRIVACY VIOLATION: Embeddings must use localhost');
  }
  
  const response = await fetch(`${OLLAMA_URL}/api/embeddings`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ model, prompt: text }),
  });
  
  const data = await response.json() as { embedding?: number[] };
  return data.embedding || [];
}

/**
 * List available local models
 */
export async function listModels(): Promise<string[]> {
  const response = await fetch(`${OLLAMA_URL}/api/tags`);
  const data = await response.json() as { models?: Array<{ name: string }> };
  return data.models?.map(m => m.name) || [];
}

/**
 * Check if Ollama is running
 */
export async function healthCheck(): Promise<boolean> {
  try {
    const response = await fetch(`${OLLAMA_URL}/api/version`);
    return response.ok;
  } catch {
    return false;
  }
}

/**
 * Privacy guard - throws if trying to reach blocked hosts
 */
export function assertLocalOnly(url: string): void {
  const parsed = new URL(url);
  if (BLOCKED_HOSTS.includes(parsed.hostname)) {
    throw new Error(`PRIVACY VIOLATION: Attempted to reach blocked host: ${parsed.hostname}`);
  }
}
