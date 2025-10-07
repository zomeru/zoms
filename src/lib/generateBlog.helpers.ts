import type { PortableTextBlock } from '@portabletext/types';

/**
 * Normalize language names to standard formats
 */
export function normalizeLanguage(lang: string): string {
  const languageMap: Record<string, string> = {
    js: 'javascript',
    ts: 'typescript',
    py: 'python',
    rb: 'ruby',
    sh: 'bash',
    yml: 'yaml',
    md: 'markdown'
  };
  return languageMap[lang.toLowerCase()] ?? lang.toLowerCase();
}
/**
 * Parse inline markdown (code, bold, bold+code)
 */
export function parseInlineMarkdown(
  text: string
): Array<{ _type: 'span'; text: string; marks?: string[] }> {
  const children: Array<{ _type: 'span'; text: string; marks?: string[] }> = [];
  const inlinePattern = /(\*\*[^*]+(?:`[^`]+`[^*]*)*\*\*|`[^`]+`)/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null = null;

  while ((match = inlinePattern.exec(text)) !== null) {
    addTextBefore(children, text, lastIndex, match.index);
    processMarkdownMatch(children, match[0]);
    lastIndex = inlinePattern.lastIndex;
  }

  addRemainingText(children, text, lastIndex);
  return children.length > 0 ? children : [{ _type: 'span', text }];
}

/**
 * Helper: Add text before a match
 */
function addTextBefore(
  children: Array<{ _type: 'span'; text: string; marks?: string[] }>,
  text: string,
  lastIndex: number,
  matchIndex: number
): void {
  if (matchIndex > lastIndex) {
    children.push({ _type: 'span', text: text.substring(lastIndex, matchIndex) });
  }
}

/**
 * Helper: Process markdown match (bold, code, or bold+code)
 */
function processMarkdownMatch(
  children: Array<{ _type: 'span'; text: string; marks?: string[] }>,
  matchText: string
): void {
  if (matchText.startsWith('**') && matchText.endsWith('**')) {
    const boldText = matchText.slice(2, -2);
    children.push(...parseBoldWithCode(boldText));
  } else if (matchText.startsWith('`') && matchText.endsWith('`')) {
    children.push({
      _type: 'span',
      text: matchText.slice(1, -1),
      marks: ['code']
    });
  }
}

/**
 * Helper: Add remaining text after last match
 */
function addRemainingText(
  children: Array<{ _type: 'span'; text: string; marks?: string[] }>,
  text: string,
  lastIndex: number
): void {
  if (lastIndex < text.length) {
    children.push({ _type: 'span', text: text.substring(lastIndex) });
  }
}

/**
 * Parse bold text that may contain inline code
 */
function parseBoldWithCode(text: string): Array<{ _type: 'span'; text: string; marks?: string[] }> {
  const parts: Array<{ _type: 'span'; text: string; marks?: string[] }> = [];
  const codePattern = /`([^`]+)`/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null = null;

  while ((match = codePattern.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push({
        _type: 'span',
        text: text.substring(lastIndex, match.index),
        marks: ['strong']
      });
    }
    parts.push({
      _type: 'span',
      text: match[1],
      marks: ['strong', 'code']
    });
    lastIndex = codePattern.lastIndex;
  }

  if (lastIndex < text.length) {
    parts.push({
      _type: 'span',
      text: text.substring(lastIndex),
      marks: ['strong']
    });
  }

  return parts.length > 0 ? parts : [{ _type: 'span', text, marks: ['strong'] }];
}

/**
 * Parse inline markdown (code, bold, bold+code)
 */

/**
 * Helper: Add text before a match
 */

/**
 * Helper: Process markdown match (bold, code, or bold+code)
 */

/**
 * Helper: Add remaining text after last match
 */

/**
 * Parse bold text that may contain inline code
 */

/**
 * Create a code block
 */
export function makeCodeBlock(language: string, code: string): PortableTextBlock {
  return {
    _type: 'block',
    _key: `code-${Date.now()}-${Math.random()}`,
    style: 'normal',
    children: [
      {
        _type: 'code',
        _key: `code-child-${Date.now()}-${Math.random()}`,
        language: normalizeLanguage(language),
        code: code.trim()
      }
    ]
  };
}

/**
 * Create a normal text block
 */
export function makeNormalBlock(text: string, lineIndex: number): PortableTextBlock {
  return {
    _type: 'block',
    _key: `block-${lineIndex}-${Date.now()}`,
    style: 'normal',
    children: parseInlineMarkdown(text)
  };
}

/**
 * Get heading block if line is a heading
 */
/**
 * Get heading block if line is a heading
 */
export function getHeadingBlock(line: string, lineIndex: number): PortableTextBlock | null {
  const headingMatch = /^(#{1,4})\s+(.+)$/.exec(line);
  if (!headingMatch) return null;

  const level = headingMatch[1].length;
  const headingText = headingMatch[2];

  // Ensure level is within valid range and map to proper type
  let style: 'normal' | 'h1' | 'h2' | 'h3' | 'h4' = 'normal';
  if (level === 1) style = 'h1';
  else if (level === 2) style = 'h2';
  else if (level === 3) style = 'h3';
  else if (level === 4) style = 'h4';
  else style = 'normal';

  return {
    _type: 'block',
    _key: `heading-${lineIndex}-${Date.now()}`,
    style,
    children: parseInlineMarkdown(headingText)
  };
}

/**
 * Get bullet list block if line is a bullet
 */
export function getBulletBlock(line: string, lineIndex: number): PortableTextBlock | null {
  const bulletMatch = /^\*\s+(.+)$/.exec(line);
  if (!bulletMatch) return null;

  const bulletText = bulletMatch[1];

  return {
    _type: 'block',
    _key: `bullet-${lineIndex}-${Date.now()}`,
    style: 'normal',
    listItem: 'bullet',
    children: parseInlineMarkdown(bulletText)
  };
}

interface CodeBlockState {
  inCodeBlock: boolean;
  codeLanguage: string;
  codeLines: string[];
}

interface CodeBlockResult extends CodeBlockState {
  handled: boolean;
  nextLineIndex: number;
  block?: PortableTextBlock;
}

/**
 * Handle code block parsing (both standard and alternative formats)
 */
export function handleCodeBlock(
  line: string,
  lines: string[],
  lineIndex: number,
  state: CodeBlockState
): CodeBlockResult {
  const result = processCodeBlockStart(line, lines, lineIndex, state);
  if (result) return result;

  return processCodeBlockEnd(line, state);
}

/**
 * Process code block opening
 */
function processCodeBlockStart(
  line: string,
  lines: string[],
  lineIndex: number,
  state: CodeBlockState
): CodeBlockResult | null {
  const codeBlockStartMatch = /^```(\w*)/.exec(line);
  if (!codeBlockStartMatch || state.inCodeBlock) return null;

  let language = codeBlockStartMatch[1] || 'text';

  // Check if language is on the next line
  if (!language && lineIndex + 1 < lines.length) {
    const nextLine = lines[lineIndex + 1].trim();
    if (nextLine && !nextLine.startsWith('```') && /^[a-zA-Z]+$/.test(nextLine)) {
      language = nextLine;
      return {
        handled: true,
        inCodeBlock: true,
        codeLanguage: language,
        codeLines: [],
        nextLineIndex: lineIndex + 2
      };
    }
  }

  return {
    handled: true,
    inCodeBlock: true,
    codeLanguage: language,
    codeLines: [],
    nextLineIndex: lineIndex + 1
  };
}

/**
 * Process code block closing
 */
function processCodeBlockEnd(line: string, state: CodeBlockState): CodeBlockResult {
  if (state.inCodeBlock) {
    if (line.trim() === '```') {
      return {
        handled: true,
        inCodeBlock: false,
        codeLanguage: '',
        codeLines: [],
        nextLineIndex: -1,
        block: makeCodeBlock(state.codeLanguage, state.codeLines.join('\n'))
      };
    }

    state.codeLines.push(line);
    return {
      handled: true,
      inCodeBlock: state.inCodeBlock,
      codeLanguage: state.codeLanguage,
      codeLines: state.codeLines,
      nextLineIndex: -1
    };
  }

  return {
    handled: false,
    inCodeBlock: false,
    codeLanguage: '',
    codeLines: [],
    nextLineIndex: -1
  };
}

/**
 * Handle text blocks (headers, bullets, normal text)
 */
export function handleTextBlock(line: string, lineIndex: number): PortableTextBlock | null {
  const headingBlock = getHeadingBlock(line, lineIndex);
  if (headingBlock) return headingBlock;

  const bulletBlock = getBulletBlock(line, lineIndex);
  if (bulletBlock) return bulletBlock;

  return makeNormalBlock(line, lineIndex);
}
