import { z } from 'zod';

import { getErrorMessage } from './errorMessages';

export const PRIMARY_BLOG_DOMAINS = [
  `Web development (TypeScript-first: frontend, backend, fullstack)
  - Frontend frameworks and app frameworks: React, Vue, Svelte, Solid, Angular, Astro
  - Backend frameworks and server frameworks: Hono, NestJS, Express, Fastify, Elysia, Koa, AdonisJS, Nitro
  - Fullstack meta frameworks: Next.js, Remix, Nuxt, SvelteKit, TanStack Start, SolidStart, Qwik City, RedwoodJS, Blitz.js, AnalogJS, Fresh, Waku, Vike, Vinxi`,
  'Mobile development (React Native, Expo, cross-platform TypeScript stacks)',
  'Backend systems and APIs (Node.js, Bun, serverless, edge, distributed systems)',
  'AI / LLM engineering (models, inference, agents, evaluation, memory, RAG)',
  'Developer tooling and DX (build systems, testing, CI/CD, observability)',
  'Security and privacy (web/mobile/app-layer security, auth, data protection)'
] as const;

export const SECONDARY_BLOG_DOMAINS = [
  'AI tooling and platforms (evaluation tools, orchestration frameworks, tracing systems)',
  'Databases and data management (SQL/NoSQL, vector databases, data modeling, ORMs such as Prisma, Drizzle, TypeORM)',
  'Cloud and infrastructure (deployment patterns, scaling, edge computing)',
  'Data layer (databases, caching, vector stores, streaming)',
  'Performance optimization (rendering, networking, runtime efficiency)'
] as const;

// 🧩 Define Zod schema for AI JSON output
const AIResponseSchema = z.object({
  title: z.string().min(1, 'Missing title'),
  slug: z.string().min(1, 'Missing slug'),
  excerpt: z.string().min(1, 'Missing excerpt'),
  tags: z.array(z.string().min(1)).min(5).max(8),
  content: z.string().min(1, 'Missing content')
});

type AiResponseType = z.infer<typeof AIResponseSchema>;

function pickRandomItem<T>(items: readonly T[]): T {
  const index = Math.floor(Math.random() * items.length);
  return items[index];
}

function pickRandomItems<T>(items: readonly T[], count: number): T[] {
  const pool = [...items];

  for (let index = pool.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [pool[index], pool[swapIndex]] = [pool[swapIndex], pool[index]];
  }

  return pool.slice(0, count);
}

export function pickPrimaryBlogDomain(): (typeof PRIMARY_BLOG_DOMAINS)[number] {
  return pickRandomItem(PRIMARY_BLOG_DOMAINS);
}

export function pickSecondaryBlogDomain(): Array<(typeof SECONDARY_BLOG_DOMAINS)[number]> {
  const selectionCount = Math.floor(Math.random() * 3);

  if (selectionCount === 0) {
    return [];
  }

  return pickRandomItems(SECONDARY_BLOG_DOMAINS, selectionCount);
}

export function tryParseAIJSON(text: string): AiResponseType {
  try {
    // Remove Markdown wrappers if present
    const cleaned = text
      .trim()
      .replace(/^```json\s*/i, '')
      .replace(/```$/i, '');

    // Try parsing directly
    const parsed: unknown = JSON.parse(cleaned);

    // Validate against schema
    const validated = AIResponseSchema.parse(parsed);

    return validated;
  } catch (error) {
    throw new Error(getErrorMessage('AI_JSON_PARSE_ERROR'), { cause: error });
  }
}
