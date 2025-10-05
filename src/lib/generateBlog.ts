import { GoogleGenerativeAI } from '@google/generative-ai';

export interface TrendingTopic {
  title: string;
  url: string;
  description?: string;
}

export interface GeneratedBlogPost {
  title: string;
  summary: string;
  body: string;
  tags: string[];
}

/**
 * Fetch trending topics from various sources
 * This is a simplified version - in production, you'd want to scrape actual data
 * For now, we'll use placeholders and rely on Gemini's knowledge
 */
export async function fetchTrendingTopics(): Promise<TrendingTopic[]> {
  // In a real implementation, you would scrape these URLs:
  // - https://nextjs.org/blog
  // - https://github.com/trending/typescript?since=weekly
  // - https://github.com/trending/javascript?since=weekly
  // - https://www.reddit.com/r/webdev/

  // For now, return some default topics that Gemini can write about
  return [
    {
      title: 'Latest trends in React and Next.js',
      url: 'https://nextjs.org/blog',
      description: 'Recent updates and best practices in React and Next.js ecosystem'
    },
    {
      title: 'TypeScript best practices and new features',
      url: 'https://github.com/trending/typescript',
      description: 'Modern TypeScript patterns and trending repositories'
    },
    {
      title: 'Javascript best practices and new features',
      url: 'https://github.com/trending/javascript',
      description: 'Modern Javascript patterns and trending repositories'
    },
    {
      title: 'Web development trends and tools',
      url: 'https://www.reddit.com/r/webdev/',
      description: 'Popular discussions and tools in web development community'
    }
  ];
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
    return ['webdev'];
  }

  try {
    const tagsContent = tagsMatch[1];
    return tagsContent
      .split(',')
      .map((tag) => tag.trim().replace(/^"(.*)"$/u, '$1'))
      .filter((tag) => tag.length > 0);
  } catch {
    return ['webdev'];
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
 * Generate blog post content using Gemini AI
 */
export async function generateBlogContent(topic: TrendingTopic): Promise<GeneratedBlogPost> {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not configured');
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

  const prompt = `Write a comprehensive, informative blog post about: "${topic.title}".

Context: ${topic.description ?? 'No additional context provided'}

Requirements:
1. Write in a professional, engaging tone suitable for software engineers
2. Include practical examples and code snippets where relevant
3. The blog post should be 800-1200 words
4. Structure the content with clear sections (use ## for headings)
5. Include actionable insights and best practices
6. Target audience: intermediate to advanced web developers

CRITICAL: Respond with ONLY valid JSON in this exact format (no additional text before or after):

{
  "title": "Your compelling title here (max 100 characters)",
  "summary": "Brief summary for SEO (max 160 characters - avoid backticks and quotes)",
  "body": "Full markdown content here with proper escaping",
  "tags": ["tag1", "tag2", "tag3", "tag4"] (3-5 relevant tags)
}

JSON FORMATTING REQUIREMENTS:
- Use double quotes for ALL strings
- NO backticks (\`) in the summary field - use single quotes instead
- Escape any double quotes inside strings with backslash (")
- NO trailing commas
- NO comments in JSON
- Make sure all brackets and braces are properly closed
- The body field should contain valid markdown text
- Include exactly 4 relevant tags
- For code references in summary, use single quotes like 'satisfies' instead of backticks

Make sure the content is:
- Accurate and up-to-date
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
    };

    // Validate required fields
    if (!parsed.title || !parsed.summary || !parsed.body) {
      throw new Error('Missing required fields in generated content');
    }

    return {
      title: parsed.title.slice(0, 100), // Ensure title length limit
      summary: parsed.summary.slice(0, 160), // Ensure summary length limit
      body: parsed.body,
      tags: Array.isArray(parsed.tags) ? parsed.tags.slice(0, 5) : []
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

  let currentBlock: {
    _type: string;
    _key: string;
    style: string;
    children: Array<{ _type: string; text: string; marks?: string[] }>;
  } | null = null;

  let inCodeBlock = false;
  let codeLanguage = '';
  let codeLines: string[] = [];

  let lineIndex = 0;
  while (lineIndex < lines.length) {
    const line = lines[lineIndex];

    // Handle code blocks
    if (line.startsWith('```')) {
      if (inCodeBlock) {
        // End code block
        inCodeBlock = false;
        blocks.push({
          _type: 'codeBlock',
          _key: `code-${lineIndex}`,
          language: codeLanguage,
          code: codeLines.join('\n')
        });
        codeLines = [];
      } else {
        // Start code block
        inCodeBlock = true;
        codeLanguage = line.slice(3).trim() || 'javascript';
        codeLines = [];
      }
      lineIndex += 1;
      continue;
    }

    if (inCodeBlock) {
      codeLines.push(line);
      lineIndex += 1;
      continue;
    }

    // Handle headers
    if (line.startsWith('## ')) {
      currentBlock = {
        _type: 'block',
        _key: `block-${lineIndex}`,
        style: 'h2',
        children: [{ _type: 'span', text: line.slice(3) }]
      };
      blocks.push(currentBlock);
      currentBlock = null;
      lineIndex += 1;
      continue;
    }

    if (line.startsWith('### ')) {
      currentBlock = {
        _type: 'block',
        _key: `block-${lineIndex}`,
        style: 'h3',
        children: [{ _type: 'span', text: line.slice(4) }]
      };
      blocks.push(currentBlock);
      currentBlock = null;
      lineIndex += 1;
      continue;
    }

    // Handle empty lines
    if (line.trim() === '') {
      currentBlock = null;
      lineIndex += 1;
      continue;
    }

    // Handle normal text with inline code
    const textWithMarks = parseInlineCode(line);

    currentBlock = {
      _type: 'block',
      _key: `block-${lineIndex}`,
      style: 'normal',
      children: textWithMarks
    };
    blocks.push(currentBlock);
    currentBlock = null;
    lineIndex += 1;
  }

  return blocks;
}

/**
 * Parse inline code in a line of text
 */
function parseInlineCode(line: string): Array<{ _type: string; text: string; marks?: string[] }> {
  const textWithMarks: Array<{ _type: string; text: string; marks?: string[] }> = [];
  const codeRegex = /`([^`]+)`/gu;
  let lastIndex = 0;

  // eslint-disable-next-line @typescript-eslint/init-declarations -- match is assigned in loop condition
  let match: RegExpExecArray | null;

  while ((match = codeRegex.exec(line)) !== null) {
    // Add text before code
    if (match.index > lastIndex) {
      const textBefore = line.slice(lastIndex, match.index);
      if (textBefore) {
        textWithMarks.push({
          _type: 'span',
          text: textBefore
        });
      }
    }
    // Add code
    textWithMarks.push({
      _type: 'span',
      text: match[1],
      marks: ['code']
    });
    lastIndex = match.index + match[0].length;
  }

  // Add remaining text
  if (lastIndex < line.length) {
    const remainingText = line.slice(lastIndex);
    if (remainingText) {
      textWithMarks.push({
        _type: 'span',
        text: remainingText
      });
    }
  }

  // If no inline code, just add the whole line
  if (textWithMarks.length === 0) {
    textWithMarks.push({
      _type: 'span',
      text: line
    });
  }

  return textWithMarks;
}
