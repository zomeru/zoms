import { GoogleGenerativeAI } from '@google/generative-ai';

import {
  backendFrameworkTopics,
  cloudPlatformTopics,
  frontendFrameworkTopics,
  generalTopics
} from '@/constants/topics';
import { MAX_SUMMARY_LENGTH, MAX_TITLE_LENGTH } from '@/constants';

import { getErrorMessage } from './errorMessages';
import { extractAndFixJSON, handleCodeBlock, handleTextBlock } from './generateBlogHelpers';
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
 * Select a combination of topics
 * @returns Array of selected topics
 */
function selectCombinationOfTopics() {
  const frontendTopic = pickOneOrNone<TrendingTopic>(frontendFrameworkTopics);
  const backendTopic = pickOneOrNone<TrendingTopic>(backendFrameworkTopics, !frontendTopic);

  const frameworkTopics: TrendingTopic[] = [frontendTopic, backendTopic].filter(
    (t) => t !== undefined
  );

  const selectedCloudPlatformTopic = pickOneOrNone<TrendingTopic>(cloudPlatformTopics);

  const selectedGeneralTopics = pickRandom<TrendingTopic>(generalTopics, 2, 3);

  return {
    frameworkTopics,
    selectedCloudPlatformTopic,
    selectedGeneralTopics
  };
}

function formatTopicDescriptionAsMarkdown(topics: TrendingTopic[]): string {
  return topics.map((topic) => `- ${topic.title}: ${topic.description ?? ''}`).join('\n');
}

function formatTopicListAsMarkdown(topics: TrendingTopic[]): string {
  return topics.map((topic) => `- ${topic.title} | Resources: ${topic.urls.join(', ')}`).join('\n');
}

/**
 * Generate blog post content using Gemini AI
 */
export async function generateBlogContent(): Promise<GeneratedBlogPost> {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    throw new Error(getErrorMessage('MISSING_GEMINI_KEY'));
  }

  const { frameworkTopics, selectedCloudPlatformTopic, selectedGeneralTopics } =
    selectCombinationOfTopics();

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

  const prompt = `Write a comprehensive, informative, and technical blog post about:
${formatTopicListAsMarkdown(frameworkTopics)}

with combinations of topics from:
${formatTopicListAsMarkdown(selectedGeneralTopics)}
${selectedCloudPlatformTopic ? formatTopicListAsMarkdown([selectedCloudPlatformTopic]) : ''}

Contexts:
${formatTopicDescriptionAsMarkdown(frameworkTopics)}
${formatTopicDescriptionAsMarkdown(selectedGeneralTopics)}
${selectedCloudPlatformTopic ? formatTopicDescriptionAsMarkdown([selectedCloudPlatformTopic]) : ''}

Requirements:
1. Write in a professional, engaging tone suitable for software engineers
2. Include practical examples and code snippets where relevant
3. The blog post should be 1000-1500 words
4. Structure the content with clear sections (use ## for headings)
5. Include actionable insights and best practices
6. Target audience: intermediate to advanced web developers
7. Use markdown formatting: headers (# ## ### ####), bullet lists, **bold**, \`code\`, and code blocks
8. Don't include resource URLs in the blog body, just make them references for you to learn from (scrape them if you must)

CRITICAL: Respond with ONLY valid JSON in this exact format (no additional text before or after):

{
  "title": "Compelling and concise blog post title (Must be between 40 and 80 characters in length, spaces included — ABSOLUTE REQUIREMENT)",
  "summary": "Brief SEO-friendly summary (Must be between 100 and 200 characters, including spaces — NON-NEGOTIABLE; do not use backticks or quotes)",
  "body": "Full blog content in Markdown format. Use proper escaping for special characters.",
  "tags": ["tag1", "tag2", "tag3"], // This is important, always include this: include 3-8 relevant tags, all lowercase, no special characters
  "readTime": 5
}

JSON FORMATTING REQUIREMENTS:
- Use double quotes for ALL strings
- NO backticks (\`) in the summary field - use single quotes instead
- Escape any double quotes inside strings with backslash (\\")
- NO trailing commas
- NO comments in JSON
- Make sure all brackets and braces are properly closed
- The body field should contain valid markdown text
- Include 3-8 relevant tags, all lowercase, no special characters
- For code references in summary, use single quotes like 'satisfies' instead of backticks
- readTime: estimated reading time in minutes (calculate based on word count: ~200 words per minute)

Make sure the content is:
- Accurate and up-to-date (${new Date().getFullYear()}), with information from at least the last two months.
- Well-structured and easy to read
- Includes code examples where appropriate
- Provides real value to readers`;

  const result = await model.generateContent(prompt);
  const response = result.response;
  const text = response.text();

  // Parse the JSON response
  try {
    const jsonText = extractAndFixJSON(text);

    // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- JSON.parse returns unknown, safe to assert after validation
    const parsed = JSON.parse(jsonText) as {
      title: string;
      summary: string;
      body: string;
      tags: string[];
      readTime?: number;
    };

    // Validate required fields
    if (!parsed.title || !parsed.summary || !parsed.body) {
      throw new Error(getErrorMessage('MISSING_REQUIRED_FIELDS'));
    }

    return {
      title: parsed.title.slice(0, MAX_TITLE_LENGTH), // Ensure title length limit
      summary: parsed.summary.slice(0, MAX_SUMMARY_LENGTH), // Ensure summary length limit
      body: parsed.body,
      tags: Array.isArray(parsed.tags) ? parsed.tags.slice(0, 5) : [],
      readTime: parsed.readTime ?? 5 // Default to 5 minutes if not provided
    };
  } catch (error) {
    throw new Error(getErrorMessage('AI_GENERATION_FAILED'), { cause: error });
  }
}

/**
 * Convert markdown to Sanity block content
 */
export function markdownToBlocks(markdown: string): unknown[] {
  const blocks: unknown[] = [];
  const lines = markdown.split('\n');

  let inCodeBlock = false;
  let codeLanguage = '';
  let codeLines: string[] = [];

  let lineIndex = 0;
  while (lineIndex < lines.length) {
    const line = lines[lineIndex];

    const codeBlockResult = handleCodeBlock({
      line,
      lines,
      lineIndex,
      inCodeBlock,
      codeLanguage,
      codeLines
    });

    if (codeBlockResult.handled) {
      if (codeBlockResult.block) {
        blocks.push(codeBlockResult.block);
      }
      inCodeBlock = codeBlockResult.inCodeBlock;
      codeLanguage = codeBlockResult.codeLanguage;
      codeLines = codeBlockResult.codeLines;
      lineIndex = codeBlockResult.nextLineIndex;
      continue;
    }

    // Skip empty lines
    if (line.trim() === '') {
      lineIndex += 1;
      continue;
    }

    // Handle other block types
    const block = handleTextBlock(line, lineIndex);
    if (block) {
      blocks.push(block);
    }

    lineIndex += 1;
  }

  return blocks;
}
