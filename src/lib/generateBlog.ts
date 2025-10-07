import { GoogleGenerativeAI } from '@google/generative-ai';
import type { PortableTextBlock } from '@portabletext/types';

import {
  backendFrameworkTopics,
  cloudPlatformTopics,
  frontendFrameworkTopics,
  generalTopics
} from '@/constants/topics';
import { MAX_SUMMARY_LENGTH, MAX_TITLE_LENGTH } from '@/constants';

import { handleCodeBlock, handleTextBlock } from './generateBlog.helpers';
import { pickOneOrNone, pickRandom } from './utils';

export interface TrendingTopic {
  title: string;
  urls: string[];
  description?: string;
}

export interface GeneratedBlogPost {
  title: string;
  summary: string;
  body: string;
  tags: string[];
  readTime: number;
}

/**
 * Remove markdown code block wrappers from text
 */
function removeMarkdownWrapper(text: string): string {
  let jsonText = text.trim();

  // Remove opening ```json or ``` if it's at the very start
  if (jsonText.startsWith('```json')) {
    jsonText = jsonText.slice(7);
  } else if (jsonText.startsWith('```')) {
    jsonText = jsonText.slice(3);
  }

  // Remove closing ``` if it's at the very end
  if (jsonText.endsWith('```')) {
    jsonText = jsonText.slice(0, -3);
  }

  return jsonText.trim();
}

/**
 * Extract JSON object from text
 */
function extractJSONObject(text: string): string {
  const jsonStart = text.indexOf('{');
  const jsonEnd = text.lastIndexOf('}');

  if (jsonStart !== -1 && jsonEnd !== -1 && jsonEnd > jsonStart) {
    return text.slice(jsonStart, jsonEnd + 1);
  }

  return text;
}

/**
 * Extract tags array from JSON text
 */
function extractTags(jsonText: string): string[] {
  const tagsRegex = /"tags"\s*:\s*\[([\s\S]*?)\]/u;
  const tagsMatch = tagsRegex.exec(jsonText);

  if (!tagsMatch) {
    return ['web development'];
  }

  try {
    const tagsContent = tagsMatch[1];
    return tagsContent
      .split(',')
      .map((tag) => tag.trim().replace(/^"(.*)"$/u, '$1'))
      .filter((tag) => tag.length > 0);
  } catch {
    return ['web development'];
  }
}

/**
 * Find the end index of the body field in JSON text
 */
function findBodyEnd(jsonText: string, bodyStart: number): number {
  let isEscaped = false;

  for (let i = bodyStart; i < jsonText.length; i += 1) {
    const char = jsonText[i];

    if (isEscaped) {
      isEscaped = false;
      continue;
    }

    if (char === '\\') {
      isEscaped = true;
      continue;
    }

    if (char === '"') {
      return i;
    }
  }

  return jsonText.length;
}

/**
 * Extract markdown body from JSON text
 */
function extractMarkdownBody(jsonText: string): string {
  const bodyRegex = /"body"\s*:\s*"/u;
  const bodyMatch = bodyRegex.exec(jsonText);

  if (!bodyMatch) {
    return '';
  }

  const bodyStart = bodyMatch.index + bodyMatch[0].length;
  const bodyEnd = findBodyEnd(jsonText, bodyStart);

  return jsonText
    .slice(bodyStart, bodyEnd)
    .replace(/\\n/g, '\n')
    .replace(/\\"/g, '"')
    .replace(/\\\\/g, '\\');
}

/**
 * Parse AI response and extract structured blog post data
 */
function parseAIResponse(responseText: string): GeneratedBlogPost {
  const cleanedText = removeMarkdownWrapper(responseText);
  const jsonText = extractJSONObject(cleanedText);

  // Extract fields manually to handle edge cases
  const titleRegex = /"title"\s*:\s*"([^"]+)"/u;
  const summaryRegex = /"summary"\s*:\s*"([^"]+)"/u;
  const readTimeRegex = /"readTime"\s*:\s*(\d+)/u;

  const titleMatch = titleRegex.exec(jsonText);
  const summaryMatch = summaryRegex.exec(jsonText);
  const readTimeMatch = readTimeRegex.exec(jsonText);

  return {
    title: (titleMatch?.[1] ?? 'Untitled Blog Post').substring(0, MAX_TITLE_LENGTH),
    summary: (summaryMatch?.[1] ?? 'No summary available').substring(0, MAX_SUMMARY_LENGTH),
    body: extractMarkdownBody(jsonText),
    tags: extractTags(jsonText),
    readTime: readTimeMatch ? parseInt(readTimeMatch[1], 10) : 5
  };
}

/**
 * Fetch trending topics from various sources
 */
export async function fetchTrendingTopics(): Promise<TrendingTopic[]> {
  const allTopics = [
    ...generalTopics,
    ...frontendFrameworkTopics,
    ...backendFrameworkTopics,
    ...cloudPlatformTopics
  ];

  // Shuffle and pick 10 random topics for variety
  const shuffled = allTopics.sort(() => Math.random() - 0.5);
  return shuffled.slice(0, 10);
}

/**
 * Convert markdown to Sanity blocks
 */
function markdownToBlocks(markdown: string): PortableTextBlock[] {
  const blocks: PortableTextBlock[] = [];
  const lines = markdown.split('\n');

  let inCodeBlock = false;
  let codeLanguage = '';
  let codeLines: string[] = [];
  let lineIndex = 0;

  while (lineIndex < lines.length) {
    const line = lines[lineIndex];

    // Handle code blocks
    const codeResult = handleCodeBlock(line, lines, lineIndex, {
      inCodeBlock,
      codeLanguage,
      codeLines
    });

    if (codeResult.handled) {
      inCodeBlock = codeResult.inCodeBlock;
      codeLanguage = codeResult.codeLanguage;
      codeLines = codeResult.codeLines;

      if (codeResult.block) {
        blocks.push(codeResult.block);
      }

      if (codeResult.nextLineIndex > lineIndex) {
        lineIndex = codeResult.nextLineIndex;
        continue;
      }

      lineIndex += 1;
      continue;
    }

    // Handle text blocks (headers, bullets, normal text)
    if (!inCodeBlock && line.trim()) {
      const textBlock = handleTextBlock(line, lineIndex);
      if (textBlock) {
        blocks.push(textBlock);
      }
    }

    lineIndex += 1;
  }

  return blocks;
}

/**
 * Generate blog post using Gemini AI
 */
export async function generateBlogPost(topics: TrendingTopic[]): Promise<GeneratedBlogPost> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not configured');
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

  // Pick a random topic
  const topic = pickRandom(topics, 1, 1)[0];
  const relatedTopic = pickOneOrNone(topics.filter((t) => t.title !== topic.title));

  const prompt = `You are a technical blog writer specializing in web development.

Write a comprehensive, professional blog post about "${topic.title}".
${relatedTopic ? `You may also reference or compare with "${relatedTopic.title}" if relevant.` : ''}

${topic.description ? `Context: ${topic.description}` : ''}

Requirements:
1. Write 800-1200 words of substantive technical content
2. Include practical code examples with proper syntax highlighting
3. Use markdown formatting: headers (# ## ### ####), bullet lists, **bold**, \`code\`, and code blocks
4. Code blocks should use this format:
   \`\`\`javascript
   const example = "like this";
   \`\`\`
5. Make it informative, accurate, and valuable for developers
6. Include best practices and real-world use cases
7. Calculate readTime based on word count (~200 words/minute, round to nearest minute)

Return ONLY a valid JSON object (no markdown wrapper) with this exact structure:
{
  "title": "An engaging, SEO-friendly title (max 100 chars)",
  "summary": "A compelling 2-3 sentence summary (max 250 chars)",
  "body": "Full markdown blog post content here with \\n for newlines",
  "tags": ["3-5 relevant tags"],
  "readTime": 5
}`;

  const result = await model.generateContent(prompt);
  const responseText = result.response.text();

  return parseAIResponse(responseText);
}

/**
 * Convert generated blog post to Sanity document format
 */
export function convertToSanityDocument(post: GeneratedBlogPost, slug: string) {
  return {
    _type: 'blogPost',
    title: post.title,
    slug: {
      _type: 'slug',
      current: slug
    },
    summary: post.summary,
    publishedAt: new Date().toISOString(),
    modifiedAt: new Date().toISOString(),
    body: markdownToBlocks(post.body),
    tags: post.tags,
    source: 'automated/gemini',
    generated: true,
    readTime: post.readTime
  };
}

// Export markdownToBlocks for use in API route
export { markdownToBlocks };
