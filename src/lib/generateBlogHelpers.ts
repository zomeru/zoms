/**
 * Remove markdown code block wrappers from text
 */
export function removeMarkdownWrapper(text: string): string {
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
export function extractJSONObject(text: string): string {
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
export function extractTags(jsonText: string): string[] {
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
 * Manually reconstruct JSON from AI response
 */
export function reconstructJSON(jsonText: string): string {
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
export function extractAndFixJSON(text: string): string {
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
 * Find the end index of the body field in JSON text
 */
export function findBodyEnd(jsonText: string, bodyStart: number): number {
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
 * Handle code block parsing (both standard and alternative formats)
 */
// eslint-disable-next-line complexity -- Function complexity is justified for clarity
export function handleCodeBlock({
  line,
  lines,
  lineIndex,
  inCodeBlock,
  codeLanguage,
  codeLines
}: {
  line: string;
  lines: string[];
  lineIndex: number;
  inCodeBlock: boolean;
  codeLanguage: string;
  codeLines: string[];
}): {
  handled: boolean;
  inCodeBlock: boolean;
  codeLanguage: string;
  codeLines: string[];
  nextLineIndex: number;
  block?: unknown;
} {
  const trimmed = line.trim();

  // --- Handle opening code block (```lang)
  const startMatch = /^```(\w*)/.exec(trimmed);
  if (startMatch && !inCodeBlock) {
    return startCodeBlock(startMatch[1] || 'javascript', lineIndex);
  }

  // --- Handle alternative format (lang + next line is ```)
  if (!inCodeBlock && /^\w+$/.test(trimmed) && lines[lineIndex + 1]?.trim().startsWith('```')) {
    return startCodeBlock(trimmed, lineIndex + 1, 2);
  }

  // --- Handle closing ```
  if (trimmed === '```' && inCodeBlock) {
    return endCodeBlock(codeLanguage, codeLines, lineIndex);
  }

  // --- Accumulate lines if inside block
  if (inCodeBlock) {
    codeLines.push(line);
    return { handled: true, inCodeBlock, codeLanguage, codeLines, nextLineIndex: lineIndex + 1 };
  }

  // --- Not a code block line
  return { handled: false, inCodeBlock, codeLanguage, codeLines, nextLineIndex: lineIndex };
}

function startCodeBlock(language: string, index: number, offset = 1) {
  return {
    handled: true,
    inCodeBlock: true,
    codeLanguage: language,
    codeLines: [],
    nextLineIndex: index + offset
  };
}

function endCodeBlock(language: string, codeLines: string[], index: number) {
  const block = {
    _type: 'codeBlock',
    _key: `code-${index}`,
    language: normalizeLanguage(language),
    code: codeLines.join('\n')
  };
  return {
    handled: true,
    inCodeBlock: false,
    codeLanguage: '',
    codeLines: [],
    nextLineIndex: index + 1,
    block
  };
}

/**
 * Handle text blocks (headers, bullets, normal text)
 */
export function handleTextBlock(
  line: string,
  lineIndex: number
): ReturnType<typeof makeNormalBlock | typeof getHeadingBlock | typeof getBulletBlock> | null {
  // Handle headers
  const headingBlock = getHeadingBlock(line, lineIndex);
  if (headingBlock) {
    return headingBlock;
  }

  // Handle bullet list items
  const bulletBlock = getBulletBlock(line, lineIndex);
  if (bulletBlock) {
    return bulletBlock;
  }

  // Handle normal text
  return makeNormalBlock(line, lineIndex);
}

/**
 * Normalize language name to match Sanity schema
 */
export function normalizeLanguage(lang: string): string {
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
    htm: 'html'
    // Add more mappings as needed
  };

  return languageMap[langLower] || langLower || 'javascript';
}

/**
 * Parse inline markdown formatting (code, bold, bold+code, links) in a line of text
 */
export function parseInlineMarkdown(
  line: string
): Array<{ text: string; marks?: string[]; markDef?: { _type: string; href: string } }> {
  const textWithMarks: Array<{
    text: string;
    marks?: string[];
    markDef?: { _type: string; href: string };
  }> = [];

  // Enhanced regex to match inline code, bold text, bold text with inline code, and markdown links
  const markdownRegex =
    /(\*\*(?:[^*]|`[^`]*`)+\*\*)|(`[^`]+`)|(\*\*[^*]+\*\*)|(\[([^\]]+)\]\(([^)]+)\))/gu;
  let lastIndex = 0;

  // eslint-disable-next-line @typescript-eslint/init-declarations -- match is assigned in loop condition
  let match: RegExpExecArray | null;

  while ((match = markdownRegex.exec(line)) !== null) {
    // Add text before the match
    addTextBefore(textWithMarks, line, lastIndex, match.index);

    // Process the matched pattern
    processMarkdownMatch(textWithMarks, match);

    lastIndex = match.index + match[0].length;
  }

  // Add remaining text or return plain text if no matches
  return addRemainingText(textWithMarks, line, lastIndex);
}

/**
 * Add text before a markdown match
 */
export function addTextBefore(
  textWithMarks: Array<{
    text: string;
    marks?: string[];
    markDef?: { _type: string; href: string };
  }>,
  line: string,
  lastIndex: number,
  matchIndex: number
): void {
  if (matchIndex > lastIndex) {
    const textBefore = line.slice(lastIndex, matchIndex);
    if (textBefore) {
      textWithMarks.push({ text: textBefore });
    }
  }
}

/**
 * Process a markdown match and add formatted text
 */
export function processMarkdownMatch(
  textWithMarks: Array<{
    text: string;
    marks?: string[];
    markDef?: { _type: string; href: string };
  }>,
  match: RegExpExecArray
): void {
  if (match[1]) {
    // Bold text match (possibly containing inline code)
    const boldContent = match[1].slice(2, -2);
    if (boldContent.includes('`')) {
      const innerParts = parseBoldWithCode(boldContent);
      textWithMarks.push(...innerParts);
    } else {
      textWithMarks.push({ text: boldContent, marks: ['strong'] });
    }
  } else if (match[2]) {
    // Inline code match
    const codeText = match[2].slice(1, -1);
    textWithMarks.push({ text: codeText, marks: ['code'] });
  } else if (match[3]) {
    // Bold text match (no inline code)
    const boldText = match[3].slice(2, -2);
    textWithMarks.push({ text: boldText, marks: ['strong'] });
  } else if (match[4]) {
    // Markdown link match [text](url)
    const linkText = match[5]; // The text inside brackets
    const linkUrl = match[6]; // The URL inside parentheses
    const linkKey = `link-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;

    textWithMarks.push({
      text: linkText,
      marks: [linkKey],
      markDef: { _type: 'link', href: linkUrl }
    });
  }
}

/**
 * Add remaining text after all matches or return plain text if no formatting found
 */
export function addRemainingText(
  textWithMarks: Array<{
    text: string;
    marks?: string[];
    markDef?: { _type: string; href: string };
  }>,
  line: string,
  lastIndex: number
): Array<{ text: string; marks?: string[]; markDef?: { _type: string; href: string } }> {
  if (lastIndex < line.length) {
    const remainingText = line.slice(lastIndex);
    if (remainingText) {
      textWithMarks.push({ text: remainingText });
    }
  }

  // If no markdown formatting, just add the whole line
  if (textWithMarks.length === 0) {
    textWithMarks.push({ text: line });
  }

  return textWithMarks;
}

/**
 * Parse bold text that contains inline code
 * Example: "text with `code` inside" -> [{ text: "text with ", marks: ["strong"] }, { text: "code", marks: ["strong", "code"] }, { text: " inside", marks: ["strong"] }]
 */
function parseBoldWithCode(
  boldContent: string
): Array<{ text: string; marks?: string[]; markDef?: { _type: string; href: string } }> {
  const parts: Array<{
    text: string;
    marks?: string[];
    markDef?: { _type: string; href: string };
  }> = [];
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
export function getHeadingBlock(line: string, lineIndex: number) {
  const headingMatch = /^(#{1,4})\s+(.*)/.exec(line);
  if (!headingMatch) return null;
  const level = headingMatch[1].length;
  const text = headingMatch[2];
  const parsedText = parseInlineMarkdown(text);
  const textWithMarks = parsedText.map((span) => ({ _type: 'span', ...span }));

  // Extract markDefs from parsed text
  const markDefs = parsedText
    .filter((span) => span.markDef)
    .map((span) => ({ _key: span.marks?.[0], ...span.markDef }));

  const block = {
    _type: 'block',
    _key: `block-${lineIndex}`,
    style: `h${level}`,
    children: textWithMarks
  };

  return markDefs.length > 0 ? { ...block, markDefs } : block;
}

/** * Returns a bullet list block if the line is a list item, otherwise null */
export function getBulletBlock(line: string, lineIndex: number) {
  if (!(line.startsWith('* ') || line.startsWith('* '))) return null;
  const bulletText = line.startsWith('* ') ? line.slice(4) : line.slice(2);
  const parsedText = parseInlineMarkdown(bulletText);
  const textWithMarks = parsedText.map((span) => ({ _type: 'span', ...span }));

  // Extract markDefs from parsed text
  const markDefs = parsedText
    .filter((span) => span.markDef)
    .map((span) => ({ _key: span.marks?.[0], ...span.markDef }));

  const block = {
    _type: 'block',
    _key: `block-${lineIndex}`,
    style: 'normal',
    listItem: 'bullet',
    children: textWithMarks
  };

  return markDefs.length > 0 ? { ...block, markDefs } : block;
}

/** * Returns a normal text block */
export function makeNormalBlock(line: string, lineIndex: number) {
  const parsedText = parseInlineMarkdown(line);
  const textWithMarks = parsedText.map((span) => ({ _type: 'span', ...span }));

  // Extract markDefs from parsed text
  const markDefs = parsedText
    .filter((span) => span.markDef)
    .map((span) => ({ _key: span.marks?.[0], ...span.markDef }));

  const block = {
    _type: 'block',
    _key: `block-${lineIndex}`,
    style: 'normal',
    children: textWithMarks
  };

  return markDefs.length > 0 ? { ...block, markDefs } : block;
}
