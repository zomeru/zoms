import { z } from "zod";

import { MAX_SUMMARY_LENGTH, MAX_TITLE_LENGTH } from "@/constants";

import { getErrorMessage } from "../errorMessages";
import { log } from "../logger";

export const PRIMARY_BLOG_DOMAINS = [
  `Web development (TypeScript-first: frontend, backend, fullstack)
  - Frontend frameworks and app frameworks: React, Vue, Svelte, Solid, Angular, Astro
  - Backend frameworks and server frameworks: Hono, NestJS, Express, Fastify, Elysia, Koa, AdonisJS, Nitro
  - Fullstack meta frameworks: Next.js, Remix, Nuxt, SvelteKit, TanStack Start, SolidStart, Qwik City, RedwoodJS, Blitz.js, AnalogJS, Fresh, Waku, Vike, Vinxi`,
  "Mobile development (React Native, Expo, cross-platform TypeScript stacks)",
  "Backend systems and APIs (Node.js, Bun, serverless, edge, distributed systems)",
  "AI / LLM engineering (models, inference, agents, evaluation, memory, RAG)",
  "Developer tooling and DX (build systems, testing, CI/CD, observability)",
  "Security and privacy (web/mobile/app-layer security, auth, data protection)"
] as const;

export const SECONDARY_BLOG_DOMAINS = [
  "AI tooling and platforms (evaluation tools, orchestration frameworks, tracing systems)",
  "Databases and data management (SQL/NoSQL, vector databases, data modeling, ORMs such as Prisma, Drizzle, TypeORM)",
  "Cloud and infrastructure (deployment patterns, scaling, edge computing)",
  "Data layer (databases, caching, vector stores, streaming)",
  "Performance optimization (rendering, networking, runtime efficiency)"
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

export const AIResponseSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, "Missing title")
    .max(MAX_TITLE_LENGTH, `Title exceeds max length of ${MAX_TITLE_LENGTH}`),

  slug: z
    .string()
    .trim()
    .min(1, "Missing slug")
    .transform((s) =>
      s
        .toLowerCase()
        .replace(/[^a-z0-9-]/g, "-")
        .replace(/-+/g, "-")
        .replace(/^-|-$/g, "")
    ),

  excerpt: z
    .string()
    .trim()
    .min(1, "Missing excerpt")
    .max(MAX_SUMMARY_LENGTH, `Excerpt exceeds max length of ${MAX_SUMMARY_LENGTH}`),

  tags: z
    .array(z.string().trim().min(1, "Tag cannot be empty"))
    .min(3, "At least 3 tags are required")
    .max(5, "At most 5 tags are allowed")
    .refine(
      (tags) => new Set(tags.map((tag) => tag.toLowerCase())).size === tags.length,
      "Tags must be unique"
    ),

  content: z.string()
});

type AiResponseType = z.infer<typeof AIResponseSchema>;

function extractJSON(text: string): string {
  const trimmed = text.trim();

  // Strip markdown code fences (```json...``` or ```...```)
  const fenceMatch = trimmed.match(/^```(?:json)?\s*\n?([\s\S]*?)\n?```\s*$/);
  if (fenceMatch?.[1]) {
    return fenceMatch[1].trim();
  }

  // Find first { ... } block if there's surrounding noise
  const braceStart = trimmed.indexOf("{");
  const braceEnd = trimmed.lastIndexOf("}");
  if (braceStart !== -1 && braceEnd > braceStart) {
    return trimmed.slice(braceStart, braceEnd + 1);
  }

  return trimmed;
}

export function tryParseAIJSON(text: string): AiResponseType {
  try {
    const json = extractJSON(text);
    const parsed = AIResponseSchema.parse(JSON.parse(json));

    parsed.content = formatLLMText(parsed.content);

    return parsed;
  } catch (error) {
    log.error("AI JSON parse failed", {
      rawTextLength: text.length,
      rawTextPreview: text.slice(0, 300),
      error: error instanceof Error ? error.message : String(error)
    });
    throw new Error(getErrorMessage("AI_JSON_PARSE_ERROR"), { cause: error });
  }
}

export function formatLLMText(text: string): string {
  return (
    text
      // convert escaped newlines -> real newlines
      .replace(/\\n/g, "\n")

      // normalize Windows line endings
      .replace(/\r\n/g, "\n")

      // remove extra blank lines (max 2)
      .replace(/\n{3,}/g, "\n\n")

      // trim outer whitespace
      .trim()
  );
}

export const generatePrompt = (): string => {
  const currentDate = new Date().toISOString().slice(0, 10);
  const recentWindow = "~3 weeks";
  const primaryDomain = pickPrimaryBlogDomain();
  const secondaryDomains = pickSecondaryBlogDomain();
  const secondaryDomainLine =
    secondaryDomains.length > 0
      ? `- Secondary: ${secondaryDomains.join(" | ")}`
      : "- Secondary: none";

  const prompt = `
Generate ONE production-ready technical blog post for software engineers.

Current date:
- Today is ${currentDate}
- Topic and examples should feel current within roughly ${recentWindow}

Selected domains:
- Primary: ${primaryDomain}
${secondaryDomainLine}

Requirements:
- Choose one specific, practical, fresh engineering topic centered on the primary domain
- Secondary domains may be used only if they materially sharpen the article
- Focus on one real problem, migration, tradeoff, implementation pattern, or architectural decision
- Avoid broad overviews, vague trend summaries, and stale topics
- If tools are mentioned, keep them secondary unless one tool is clearly central
- Target 900–1200 words
- Optimize for SEO without clickbait
- Use clear H1–H3 markdown structure
- Include code only if it materially improves understanding.
- Include hyperlinks for the mentioned tools/libraries/frameworks to official documentation. (2 sentences max per explanation)

Return valid JSON with this shape:
{
  "title": "SEO-optimized title (max ${MAX_TITLE_LENGTH} chars)",
  "slug": "kebab-case-seo-friendly-slug",
  "excerpt": "1-2 sentence SEO-friendly summary (max ${MAX_SUMMARY_LENGTH} chars)",
  "tags": ["keyword1", "keyword2", "keyword3"],
  "content": "Full markdown blog post"
}
`;

  log.info("Generating blog content with dynamic topic prompt", {
    currentDate,
    primaryDomain,
    secondaryDomains
  });

  return prompt;
};
