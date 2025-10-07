import { GoogleGenerativeAI } from '@google/generative-ai';

import {
  backendFrameworkTopics,
  cloudPlatformTopics,
  frontendFrameworkTopics,
  generalTopics
} from '@/constants/topics';
import { MAX_SUMMARY_LENGTH, MAX_TITLE_LENGTH } from '@/constants';

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
      // This should be the end of the body string
      if (i + 1 < jsonText.length && jsonText[i + 1] === ',') {
        return i;
      }
    }
  }

  // Fallback: find the last quote before tags
  const tagsIndex = jsonText.indexOf('"tags"');
  if (tagsIndex > bodyStart) {
    const lastQuote = jsonText.lastIndexOf('"', tagsIndex - 1);
    if (lastQuote > bodyStart) {
      return lastQuote;
    }
  }

  return -1;
}

/**
 * Manually reconstruct JSON from AI response
 */
function reconstructJSON(jsonText: string): string {
  const titleRegex = /"title"\s*:\s*"([^"]*(?:\\.[^"]*)*)"/u;
  const summaryRegex = /"summary"\s*:\s*"([^"]*(?:\\.[^"]*)*)"/u;
  const bodyStartRegex = /"body"\s*:\s*"/u;

  const titleMatch = titleRegex.exec(jsonText);
  const summaryMatch = summaryRegex.exec(jsonText);
  const bodyStartMatch = bodyStartRegex.exec(jsonText);

  if (!bodyStartMatch || !titleMatch || !summaryMatch) {
    throw new Error('Could not extract required JSON fields');
  }

  const bodyStart = bodyStartMatch.index + bodyStartMatch[0].length;
  const bodyEnd = findBodyEnd(jsonText, bodyStart);

  if (bodyEnd === -1) {
    throw new Error('Could not find end of body string');
  }

  const bodyContent = jsonText.slice(bodyStart, bodyEnd);
  const tags = extractTags(jsonText);

  // Construct clean JSON
  const cleanJson = {
    title: titleMatch[1],
    summary: summaryMatch[1],
    body: bodyContent,
    tags
  };

  return JSON.stringify(cleanJson);
}

/**
 * Attempt to extract and fix JSON from AI response
 */
function extractAndFixJSON(text: string): string {
  let jsonText = removeMarkdownWrapper(text);
  jsonText = extractJSONObject(jsonText);

  // First attempt: try parsing as-is
  try {
    JSON.parse(jsonText);
    return jsonText;
  } catch {
    // Initial parse failed, will attempt reconstruction
  }

  // If parsing fails, try to manually reconstruct the JSON
  try {
    return reconstructJSON(jsonText);
  } catch (parseError) {
    throw new Error('Failed to parse or reconstruct JSON from AI response', {
      cause: parseError
    });
  }
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
    throw new Error('Gemini API key is not configured');
  }

  const { frameworkTopics, selectedCloudPlatformTopic, selectedGeneralTopics } =
    selectCombinationOfTopics();

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

  const prompt = `Write a comprehensive, informative blog post about:
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
3. The blog post should be 800-1200 words
4. Structure the content with clear sections (use ## for headings)
5. Include actionable insights and best practices
6. Target audience: intermediate to advanced web developers

CRITICAL: Respond with ONLY valid JSON in this exact format (no additional text before or after):

{
  "title": "Compelling and concise blog post title (Must be between 40 and 80 characters in length, spaces included — ABSOLUTE REQUIREMENT)",
  "summary": "Brief SEO-friendly summary (Must be between 100 and 150 characters, including spaces — NON-NEGOTIABLE; do not use backticks or quotes)",
  "body": "Full blog content in Markdown format. Use proper escaping for special characters.",
  "tags": ["tag1", "tag2", "tag3"],
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
      throw new Error('Missing required fields in generated content');
    }

    return {
      title: parsed.title.slice(0, MAX_TITLE_LENGTH), // Ensure title length limit
      summary: parsed.summary.slice(0, MAX_SUMMARY_LENGTH), // Ensure summary length limit
      body: parsed.body,
      tags: Array.isArray(parsed.tags) ? parsed.tags.slice(0, 5) : [],
      readTime: parsed.readTime ?? 5 // Default to 5 minutes if not provided
    };
  } catch (error) {
    throw new Error('Failed to parse AI-generated content', { cause: error });
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

    // --- Handle fenced code blocks (both ```language and language```) ---
    // Check for opening code block: ``` followed by optional language
    const codeBlockStartMatch = /^```(\w*)/.exec(line);
    if (codeBlockStartMatch && !inCodeBlock) {
      // Start code block
      inCodeBlock = true;
      codeLanguage = codeBlockStartMatch[1] || 'javascript';
      codeLines = [];
      lineIndex += 1;
      continue;
    }

    // Check for code block with language on next line: language followed by ```
    if (!inCodeBlock && lineIndex + 1 < lines.length) {
      const nextLine = lines[lineIndex + 1];
      if (/^\w+$/.test(line.trim()) && nextLine.trim().startsWith('```')) {
        // Language is on current line, opening backticks on next line
        inCodeBlock = true;
        codeLanguage = line.trim();
        codeLines = [];
        lineIndex += 2; // Skip both lines
        continue;
      }
    }

    // Check for closing code block
    if (line.trim() === '```' && inCodeBlock) {
      // End code block
      blocks.push({
        _type: 'codeBlock',
        _key: `code-${lineIndex}`,
        language: normalizeLanguage(codeLanguage),
        code: codeLines.join('\n')
      });
      inCodeBlock = false;
      codeLanguage = '';
      codeLines = [];
      lineIndex += 1;
      continue;
    }

    if (inCodeBlock) {
      codeLines.push(line);
      lineIndex += 1;
      continue;
    }

    // --- Handle headers ---
    const headingBlock = getHeadingBlock(line, lineIndex);
    if (headingBlock) {
      blocks.push(headingBlock);
      lineIndex += 1;
      continue;
    }

    // --- Handle bullet list items ---
    const bulletBlock = getBulletBlock(line, lineIndex);
    if (bulletBlock) {
      blocks.push(bulletBlock);
      lineIndex += 1;
      continue;
    }

    // --- Handle empty line (skip) ---
    if (line.trim() === '') {
      lineIndex += 1;
      continue;
    }

    // --- Handle normal text ---
    blocks.push(makeNormalBlock(line, lineIndex));
    lineIndex += 1;
  }

  return blocks;
}

/**
 * Normalize language name to match Sanity schema
 */
function normalizeLanguage(lang: string): string {
  const langLower = lang.toLowerCase().trim();
  
  // Map common variations to schema values
  const languageMap: Record<string, string> = {
    js: 'javascript',
    ts: 'typescript',
    py: 'python',
    sh: 'bash',
    shell: 'bash',
    yml: 'yaml',
    gql: 'graphql',
    md: 'markdown',
    htm: 'html',
    // Add more mappings as needed
  };

  return languageMap[langLower] || langLower || 'javascript';
}

/**
 * Parse inline markdown formatting (code, bold, bold+code) in a line of text
 */
function parseInlineMarkdown(line: string): Array<{ text: string; marks?: string[] }> {
  const textWithMarks: Array<{ text: string; marks?: string[] }> = [];

  // Enhanced regex to match inline code, bold text, and bold text with inline code
  // Patterns:
  // 1. **text with `code`** - Bold text containing inline code
  // 2. `code` - Inline code
  // 3. **bold** - Bold text
  const markdownRegex = /(\*\*(?:[^*]|`[^`]*`)+\*\*)|(`[^`]+`)|(\*\*[^*]+\*\*)/gu;
  let lastIndex = 0;

  // eslint-disable-next-line @typescript-eslint/init-declarations -- match is assigned in loop condition
  let match: RegExpExecArray | null;

  while ((match = markdownRegex.exec(line)) !== null) {
    // Add text before the match
    if (match.index > lastIndex) {
      const textBefore = line.slice(lastIndex, match.index);
      if (textBefore) {
        textWithMarks.push({
          text: textBefore
        });
      }
    }

    // Determine the type of match and add appropriate formatting
    if (match[1]) {
      // Bold text match (possibly containing inline code) - match[1]
      const boldContent = match[1].slice(2, -2); // Remove outer **
      
      // Check if bold content contains inline code
      if (boldContent.includes('`')) {
        // Parse the content recursively to handle inline code within bold
        const innerParts = parseBoldWithCode(boldContent);
        textWithMarks.push(...innerParts);
      } else {
        // Plain bold text
        textWithMarks.push({
          text: boldContent,
          marks: ['strong']
        });
      }
    } else if (match[2]) {
      // Inline code match (backticks) - match[2]
      const codeText = match[2].slice(1, -1); // Remove backticks
      textWithMarks.push({
        text: codeText,
        marks: ['code']
      });
    } else if (match[3]) {
      // Bold text match (no inline code) - match[3]
      const boldText = match[3].slice(2, -2); // Remove asterisks
      textWithMarks.push({
        text: boldText,
        marks: ['strong']
      });
    }

    lastIndex = match.index + match[0].length;
  }

  // Add remaining text
  if (lastIndex < line.length) {
    const remainingText = line.slice(lastIndex);
    if (remainingText) {
      textWithMarks.push({
        text: remainingText
      });
    }
  }

  // If no markdown formatting, just add the whole line
  if (textWithMarks.length === 0) {
    textWithMarks.push({
      text: line
    });
  }

  return textWithMarks;
}

/**
 * Parse bold text that contains inline code
 * Example: "text with `code` inside" -> [{ text: "text with ", marks: ["strong"] }, { text: "code", marks: ["strong", "code"] }, { text: " inside", marks: ["strong"] }]
 */
function parseBoldWithCode(boldContent: string): Array<{ text: string; marks?: string[] }> {
  const parts: Array<{ text: string; marks?: string[] }> = [];
  const codeRegex = /`([^`]+)`/gu;
  let lastIndex = 0;

  // eslint-disable-next-line @typescript-eslint/init-declarations -- match is assigned in loop condition
  let match: RegExpExecArray | null;

  while ((match = codeRegex.exec(boldContent)) !== null) {
    // Add bold text before the code
    if (match.index > lastIndex) {
      const textBefore = boldContent.slice(lastIndex, match.index);
      if (textBefore) {
        parts.push({
          text: textBefore,
          marks: ['strong']
        });
      }
    }

    // Add code with both bold and code marks
    const codeText = match[1];
    parts.push({
      text: codeText,
      marks: ['strong', 'code']
    });

    lastIndex = match.index + match[0].length;
  }

  // Add remaining bold text
  if (lastIndex < boldContent.length) {
    const remainingText = boldContent.slice(lastIndex);
    if (remainingText) {
      parts.push({
        text: remainingText,
        marks: ['strong']
      });
    }
  }

  return parts;
}

/** * Returns a heading block if the line is a heading, otherwise null */
function getHeadingBlock(line: string, lineIndex: number) {
  const headingMatch = /^(#{1,4})\s+(.*)/.exec(line);
  if (!headingMatch) return null;
  const level = headingMatch[1].length;
  const text = headingMatch[2];
  const textWithMarks = parseInlineMarkdown(text).map((span) => ({ _type: 'span', ...span }));
  return {
    _type: 'block',
    _key: `block-${lineIndex}`,
    style: `h${level}`,
    children: textWithMarks
  };
}

/** * Returns a bullet list block if the line is a list item, otherwise null */
function getBulletBlock(line: string, lineIndex: number) {
  if (!(line.startsWith('* ') || line.startsWith('* '))) return null;
  const bulletText = line.startsWith('* ') ? line.slice(4) : line.slice(2);
  const textWithMarks = parseInlineMarkdown(bulletText).map((span) => ({ _type: 'span', ...span }));
  return {
    _type: 'block',
    _key: `block-${lineIndex}`,
    style: 'normal',
    listItem: 'bullet',
    children: textWithMarks
  };
}

/** * Returns a normal text block */
function makeNormalBlock(line: string, lineIndex: number) {
  const textWithMarks = parseInlineMarkdown(line).map((span) => ({ _type: 'span', ...span }));
  return { _type: 'block', _key: `block-${lineIndex}`, style: 'normal', children: textWithMarks };
}
