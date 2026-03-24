import 'server-only';

import Supermemory from 'supermemory';

import { getAiEnv } from './env';

interface SearchSessionMemoryInput {
  limit: number;
  query: string;
  sessionKey: string;
}

interface StoreSessionMemoryInput {
  answer: string;
  question: string;
  sessionKey: string;
}

function createSupermemoryClient(): Supermemory | null {
  const env = getAiEnv();

  if (!env.SUPERMEMORY_API_KEY) {
    return null;
  }

  return new Supermemory({
    apiKey: env.SUPERMEMORY_API_KEY,
    maxRetries: 0,
    timeout: 5000
  });
}

function normalizeMemoryText(value: string): string {
  return value
    .replace(/```[\s\S]*?```/g, '[code example omitted]')
    .replace(/\s+/g, ' ')
    .trim();
}

function buildMemoryEntry(input: Omit<StoreSessionMemoryInput, 'sessionKey'>): string {
  const normalizedQuestion = normalizeMemoryText(input.question).slice(0, 240);
  const normalizedAnswer = normalizeMemoryText(input.answer).slice(0, 480);

  return `Question: ${normalizedQuestion}\nAnswer summary: ${normalizedAnswer}`;
}

export async function searchSessionMemory(input: SearchSessionMemoryInput): Promise<string[]> {
  const client = createSupermemoryClient();

  if (client === null) {
    return [];
  }

  const response = await client.search.memories({
    containerTag: input.sessionKey,
    limit: input.limit,
    q: input.query,
    rewriteQuery: false,
    searchMode: 'memories',
    threshold: 0.2
  });

  return response.results
    .map((result) => result.memory ?? result.chunk ?? null)
    .filter((value): value is string => typeof value === 'string' && value.trim().length > 0)
    .slice(0, input.limit);
}

export async function storeSessionMemory(input: StoreSessionMemoryInput): Promise<void> {
  const client = createSupermemoryClient();

  if (client === null) {
    return;
  }

  await client.add({
    containerTag: input.sessionKey,
    content: buildMemoryEntry(input),
    metadata: {
      source: 'chat-session'
    }
  });
}
