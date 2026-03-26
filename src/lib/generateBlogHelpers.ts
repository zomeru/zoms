import { z } from 'zod';

import { MAX_SUMMARY_LENGTH, MAX_TITLE_LENGTH } from '@/constants';

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

const AIResponseSchema = z
  .object({
    title: z
      .string()
      .trim()
      .min(1, 'Missing title')
      .max(MAX_TITLE_LENGTH, `Title exceeds max length of ${MAX_TITLE_LENGTH}`),

    slug: z
      .string()
      .trim()
      .min(1, 'Missing slug')
      .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug must be kebab-case'),

    excerpt: z
      .string()
      .trim()
      .min(1, 'Missing excerpt')
      .max(MAX_SUMMARY_LENGTH, `Excerpt exceeds max length of ${MAX_SUMMARY_LENGTH}`),

    tags: z
      .array(z.string().trim().min(1, 'Tag cannot be empty'))
      .min(3, 'At least 3 tags are required')
      .max(5, 'At most 5 tags are allowed')
      .refine(
        (tags) => new Set(tags.map((tag) => tag.toLowerCase())).size === tags.length,
        'Tags must be unique'
      ),

    content: z.string()
  })
  .strict();

type AiResponseType = z.infer<typeof AIResponseSchema>;

export function tryParseAIJSON(text: string): AiResponseType {
  try {
    const trimmed = text.trim();
    const parsed = AIResponseSchema.parse(JSON.parse(trimmed));

    parsed.content = formatLLMText(parsed.content);

    return parsed;
  } catch (error) {
    throw new Error(getErrorMessage('AI_JSON_PARSE_ERROR'), { cause: error });
  }
}

export function formatLLMText(text: string): string {
  return (
    text
      // convert escaped newlines -> real newlines
      .replace(/\\n/g, '\n')

      // normalize Windows line endings
      .replace(/\r\n/g, '\n')

      // remove extra blank lines (max 2)
      .replace(/\n{3,}/g, '\n\n')

      // trim outer whitespace
      .trim()
  );
}
