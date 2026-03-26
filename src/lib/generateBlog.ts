import { GoogleGenAI, ThinkingLevel } from '@google/genai';

import { MAX_SUMMARY_LENGTH, MAX_TITLE_LENGTH } from '@/constants';

import { getErrorMessage } from './errorMessages';
import {
  pickPrimaryBlogDomain,
  pickSecondaryBlogDomain,
  tryParseAIJSON
} from './generateBlogHelpers';
import log from './logger';

export interface GeneratedBlogPost {
  title: string;
  summary: string;
  body: string;
  tags: string[];
  readTime: number;
}

function getGeminiClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY environment variable is required for blog generation');
  }
  return new GoogleGenAI({ apiKey });
}

/**
 * Generate blog post content using Gemini AI
 */
export async function generateBlogContent(): Promise<GeneratedBlogPost> {
  const currentDate = new Date().toISOString().slice(0, 10);
  const recentWindow = '~3 weeks';
  const primaryDomain = pickPrimaryBlogDomain();
  const secondaryDomains = pickSecondaryBlogDomain();
  const secondaryDomainLine =
    secondaryDomains.length > 0
      ? `- Secondary: ${secondaryDomains.join(' | ')}`
      : '- Secondary: none';

  const systemInstruction = `
You are a principal full-stack software engineer and expert technical writer.

Write for experienced software engineers.
Be practical, concise, technically credible, and specific.
Avoid hype, filler, generic advice, and obvious AI-generated phrasing.
Focus on real-world engineering problems, tradeoffs, architecture, and implementation details.
Use code only when it materially improves understanding.
Prefer TypeScript when code is useful.
Return strict JSON only with no extra commentary or markdown fences.
`;

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

  log.info('Generating blog content with dynamic topic prompt', {
    currentDate,
    primaryDomain,
    secondaryDomains
  });

  const result = await getGeminiClient().models.generateContent({
    model: process.env.GEMINI_MODEL ?? 'gemini-3-flash-preview',
    contents: prompt,
    config: {
      systemInstruction,
      responseMimeType: 'application/json',
      responseSchema: {
        type: 'object',
        required: ['title', 'slug', 'excerpt', 'tags', 'content'],
        properties: {
          title: {
            type: 'string',
            description: `SEO-optimized title, max ${MAX_TITLE_LENGTH} characters`
          },
          slug: {
            type: 'string',
            description: 'kebab-case SEO-friendly slug'
          },
          excerpt: {
            type: 'string',
            description: `1-2 sentence SEO-friendly summary, max ${MAX_SUMMARY_LENGTH} characters`
          },
          tags: {
            type: 'array',
            minItems: 3,
            maxItems: 5,
            items: { type: 'string' },
            description: 'Relevant SEO keywords'
          },
          content: {
            type: 'string',
            description:
              'Full production-ready markdown blog post with H1-H3 hierarchy, concise and practical, targeting about 900-1200 words'
          }
        }
      },
      candidateCount: 1,
      temperature: 0.2,
      topP: 0.9,
      seed: 42,
      maxOutputTokens: 3000,
      thinkingConfig: {
        thinkingLevel: ThinkingLevel.LOW
      }
    }
  });

  if (!result.text) {
    throw new Error(getErrorMessage('AI_GENERATION_FAILED'));
  }

  try {
    const parsed = tryParseAIJSON(result.text);
    const wordCount = parsed.content.split(/\s+/).filter(Boolean).length;

    if (wordCount < 700) {
      throw new Error(getErrorMessage('AI_GENERATION_TOO_SHORT'));
    }

    const readTime = Math.max(1, Math.ceil(wordCount / 200));

    return {
      title: parsed.title.slice(0, MAX_TITLE_LENGTH),
      summary: parsed.excerpt.slice(0, MAX_SUMMARY_LENGTH),
      body: parsed.content,
      tags: parsed.tags.slice(0, 5),
      readTime
    };
  } catch (error) {
    throw new Error(getErrorMessage('AI_GENERATION_FAILED'), { cause: error });
  }
}
