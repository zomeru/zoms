import { GoogleGenerativeAI } from '@google/generative-ai';

export interface TrendingTopic {
  title: string;
  url: string;
  description?: string;
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
      title: 'Web development trends and tools',
      url: 'https://www.reddit.com/r/webdev/',
      description: 'Popular discussions and tools in web development community'
    }
  ];
}

/**
 * Generate blog post content using Gemini AI
 */
export async function generateBlogContent(topic: TrendingTopic): Promise<{
  title: string;
  summary: string;
  body: string;
  tags: string[];
}> {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not configured');
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

  const prompt = `Write a comprehensive, informative blog post about: "${topic.title}".

Context: ${topic.description ?? 'No additional context provided'}

Requirements:
1. Write in a professional, engaging tone suitable for software engineers
2. Include practical examples and code snippets where relevant
3. The blog post should be 800-1200 words
4. Structure the content with clear sections (use ## for headings)
5. Include actionable insights and best practices
6. Target audience: intermediate to advanced web developers

Format your response as JSON with this structure:
{
  "title": "A compelling, SEO-friendly title (max 100 characters)",
  "summary": "A brief summary of the post (max 160 characters for SEO)",
  "body": "The full blog post content in markdown format",
  "tags": ["tag1", "tag2", "tag3"] (3-5 relevant tags)
}

Make sure the content is:
- Accurate and up-to-date
- Well-structured and easy to read
- Includes code examples where appropriate
- Provides real value to readers`;

  const result = await model.generateContent(prompt);
  const response = result.response;
  const text = response.text();

  // Parse the JSON response
  // Remove markdown code blocks if present
  const jsonText = text
    .replace(/```json\n?/g, '')
    .replace(/```\n?/g, '')
    .trim();

  try {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- JSON.parse returns unknown, safe to assert after validation
    const parsed = JSON.parse(jsonText) as {
      title: string;
      summary: string;
      body: string;
      tags: string[];
    };
    return {
      title: parsed.title,
      summary: parsed.summary,
      body: parsed.body,
      tags: parsed.tags
    };
  } catch (error) {
    // eslint-disable-next-line no-console -- Allow console for debugging
    console.error('Failed to parse Gemini response:', text);
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
          _type: 'code',
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
  const codeRegex = /`([^`]+)`/g;
  let lastIndex = 0;
  let match = codeRegex.exec(line);

  while (match !== null) {
    // Add text before code
    if (match.index > lastIndex) {
      textWithMarks.push({
        _type: 'span',
        text: line.slice(lastIndex, match.index)
      });
    }
    // Add code
    textWithMarks.push({
      _type: 'span',
      text: match[1],
      marks: ['code']
    });
    lastIndex = match.index + match[0].length;
    match = codeRegex.exec(line);
  }

  // Add remaining text
  if (lastIndex < line.length) {
    textWithMarks.push({
      _type: 'span',
      text: line.slice(lastIndex)
    });
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
