'use client';

interface TextBlock {
  content: string;
  type: 'text';
}

interface CodeBlock {
  content: string;
  language?: string;
  type: 'code';
}

type MessageBlock = CodeBlock | TextBlock;

const CODE_FENCE_OPEN_PATTERN = /^```([a-zA-Z0-9_-]+)?\s*$/;
const CODE_FENCE_CLOSE_PATTERN = /^```\s*$/;

function flushTextBlock(blocks: MessageBlock[], lines: string[]) {
  if (lines.length === 0) {
    return;
  }

  const content = lines.join('\n').trim();

  if (content.length > 0) {
    blocks.push({
      content,
      type: 'text'
    });
  }
}

function parseMessageBlocks(content: string): MessageBlock[] {
  const blocks: MessageBlock[] = [];
  const textLines: string[] = [];
  let codeLines: string[] = [];
  let currentLanguage: string | undefined = undefined;
  let inCodeBlock = false;

  for (const line of content.split('\n')) {
    if (!inCodeBlock) {
      const openMatch = CODE_FENCE_OPEN_PATTERN.exec(line.trim());

      if (openMatch) {
        flushTextBlock(blocks, textLines);
        textLines.length = 0;
        currentLanguage = openMatch[1] ? openMatch[1].toUpperCase() : undefined;
        inCodeBlock = true;
        continue;
      }

      textLines.push(line);
      continue;
    }

    if (CODE_FENCE_CLOSE_PATTERN.test(line.trim())) {
      blocks.push({
        content: codeLines.join('\n'),
        language: currentLanguage,
        type: 'code'
      });
      codeLines = [];
      currentLanguage = undefined;
      inCodeBlock = false;
      continue;
    }

    codeLines.push(line);
  }

  flushTextBlock(blocks, textLines);

  if (inCodeBlock) {
    blocks.push({
      content: codeLines.join('\n'),
      language: currentLanguage,
      type: 'code'
    });
  }

  return blocks;
}

function renderTextBlock(content: string) {
  return content.split(/\n{2,}/).map((paragraph, index) => (
    <p
      key={`${paragraph.slice(0, 24)}-${index}`}
      className='whitespace-pre-wrap text-sm leading-6 text-text-primary'
    >
      {paragraph}
    </p>
  ));
}

export default function ChatMessageContent({ content }: { content: string }) {
  const blocks = parseMessageBlocks(content);

  return (
    <div className='space-y-3'>
      {blocks.map((block, index) =>
        block.type === 'code' ? (
          <div
            key={`code-${index}`}
            className='overflow-hidden rounded-2xl border border-border bg-background/80'
          >
            <div className='flex items-center justify-between border-b border-border px-3 py-2'>
              <span className='font-mono text-[11px] uppercase tracking-[0.22em] text-text-muted'>
                {block.language ?? 'CODE'}
              </span>
            </div>
            <pre className='overflow-x-auto px-4 py-3 text-xs leading-6 text-text-primary'>
              <code>{block.content}</code>
            </pre>
          </div>
        ) : (
          <div key={`text-${index}`} className='space-y-3'>
            {renderTextBlock(block.content)}
          </div>
        )
      )}
    </div>
  );
}
