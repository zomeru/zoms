import { GoogleGenerativeAI } from '@google/generative-ai';

import {
  aiProviderTopics,
  backendFrameworkTopics,
  cloudPlatformTopics,
  frontendFrameworkTopics,
  hostingTopics,
  webDevGeneralTopics
} from '@/constants/topics';
import { MAX_SUMMARY_LENGTH, MAX_TITLE_LENGTH } from '@/constants';

import { getErrorMessage } from './errorMessages';
import { extractAndFixJSON } from './generateBlogHelpers';
import { pickOneOrNone, pickRandom } from './utils';

export interface GeneratedBlogPost {
  title: string;
  summary: string;
  bodyMarkdown: string; // Now we store raw markdown instead of processing it
  tags: string[];
  readTime: number;
}

/**
 * Select a combination of topics
 * @returns Array of selected topics
 */
function selectCombinationOfTopics(): string[] {
  const frontendTopic = pickOneOrNone<string>(frontendFrameworkTopics);
  const backendTopic = pickOneOrNone<string>(backendFrameworkTopics, !frontendTopic);

  const fullStackTopics: string[] = [frontendTopic, backendTopic].filter((t) => t !== undefined);

  const cloudPlatformTopic = pickOneOrNone<string>(cloudPlatformTopics);
  const hostingTopic = pickOneOrNone<string>(hostingTopics, !cloudPlatformTopic);
  const cloudTopics = [cloudPlatformTopic, hostingTopic].filter((t) => t !== undefined);

  const aiTopic = pickOneOrNone<string>(aiProviderTopics);
  const selectedGeneralTopics = pickRandom<string>(webDevGeneralTopics, 2, 3);

  return [
    ...fullStackTopics,
    ...cloudTopics,
    ...(aiTopic ? [aiTopic] : []),
    ...selectedGeneralTopics
  ];
}

/**
 * Generate blog post content using Gemini AI
 */
export async function generateBlogContent(): Promise<GeneratedBlogPost> {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    throw new Error(getErrorMessage('MISSING_GEMINI_KEY'));
  }

  const topics = selectCombinationOfTopics();

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

  const prompt = `
Write a comprehensive, technically detailed blog post that demonstrates how the following web development topics can be integrated within a single application context:

${topics.map((t) => `- ${t}`).join('\n')}

All examples, explanations, and code snippets must use TypeScript as the primary language.

The article must be written for intermediate to advanced web developers, offering practical examples, best practices, and actionable insights. Ensure all content is accurate and current as of ${new Date().getFullYear()} (reflecting developments from the last two months).

Writing Guidelines:
1. Use a professional yet engaging tone suitable for software engineers.
2. Include relevant code snippets and technical explanations.
3. Word count: 1000–1500 words.
4. Structure clearly using Markdown headings (## for major sections).
5. Focus on actionable insights and real-world applications.
6. Target audience: intermediate to advanced developers.
7. Use valid Markdown formatting: headers (#, ##, ###), bullet points, **bold**, \`inline code\`, and fenced code blocks.
8. Do not include resource URLs in the content — you may reference them internally for accuracy.

CRITICAL OUTPUT FORMAT:
Respond with ONLY valid JSON in this exact structure:

{
  "title": "Compelling and concise blog title (40–80 characters total, including spaces — REQUIRED)",
  "summary": "SEO-friendly summary (100–200 characters total, including spaces — REQUIRED; no backticks or quotes)",
  "body": "Full blog post content in Markdown format. Escape all internal double quotes with a backslash (\\").",
  "tags": ["tag1", "tag2", "tag3"], // always include 3–5 relevant tags (lowercase, no special characters)
  "readTime": 5
}

JSON VALIDATION RULES:
- Use double quotes for all strings
- No backticks (\`) in the summary — use single quotes instead for code references
- Escape any double quotes inside strings
- No trailing commas or comments
- The body field must contain valid Markdown
- Include 3–5 relevant tags (lowercase, no special characters)
- Calculate readTime as total words ÷ 200 (rounded up)

Final Quality Requirements:
- Content must be accurate and up-to-date (${new Date().getFullYear()})
- Writing should be well-structured, clear, and valuable to professionals
- Include concise code examples where relevant
- Provide meaningful insights developers can apply immediately
`;

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
      bodyMarkdown: parsed.body, // Store raw markdown
      tags: Array.isArray(parsed.tags) ? parsed.tags.slice(0, 5) : [],
      readTime: parsed.readTime ?? 5 // Default to 5 minutes if not provided
    };
  } catch (error) {
    throw new Error(getErrorMessage('AI_GENERATION_FAILED'), { cause: error });
  }
}
