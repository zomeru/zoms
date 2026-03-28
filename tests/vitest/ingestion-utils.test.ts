import { describe, expect, it } from 'vitest';

import { createChunkId, createDocumentVectorPrefix, createStableHash } from '@/lib/ingestion/hash';
import { buildPlainText, slugify, stripMarkdown } from '@/lib/ingestion/normalize';
import { splitMarkdownIntoSections } from '@/lib/ingestion/sections';

describe('hash utilities', () => {
  describe('createStableHash', () => {
    it('produces deterministic output', () => {
      const input = { a: 1, b: 'hello' };
      expect(createStableHash(input)).toBe(createStableHash(input));
    });

    it('produces same hash regardless of key order', () => {
      const a = createStableHash({ x: 1, y: 2, z: 3 });
      const b = createStableHash({ z: 3, x: 1, y: 2 });
      expect(a).toBe(b);
    });

    it('produces different hashes for different inputs', () => {
      expect(createStableHash({ a: 1 })).not.toBe(createStableHash({ a: 2 }));
    });

    it('produces 64-char hex string (SHA-256)', () => {
      expect(createStableHash('test')).toMatch(/^[a-f0-9]{64}$/);
    });

    it('handles nested objects with sorted keys', () => {
      const a = createStableHash({ outer: { z: 1, a: 2 } });
      const b = createStableHash({ outer: { a: 2, z: 1 } });
      expect(a).toBe(b);
    });

    it('handles arrays', () => {
      const a = createStableHash([1, 2, 3]);
      const b = createStableHash([1, 2, 3]);
      expect(a).toBe(b);
      expect(createStableHash([1, 2, 3])).not.toBe(createStableHash([3, 2, 1]));
    });
  });

  describe('createChunkId', () => {
    it('produces deterministic chunk IDs', () => {
      const a = createChunkId('doc1', 'section1', 0, 'content');
      const b = createChunkId('doc1', 'section1', 0, 'content');
      expect(a).toBe(b);
    });

    it('includes document prefix', () => {
      const id = createChunkId('doc1', 'section1', 0, 'content');
      expect(id).toContain('doc:doc1:');
    });

    it('different content produces different IDs', () => {
      const a = createChunkId('doc1', 'section1', 0, 'content-a');
      const b = createChunkId('doc1', 'section1', 0, 'content-b');
      expect(a).not.toBe(b);
    });
  });

  describe('createDocumentVectorPrefix', () => {
    it('produces correct prefix format', () => {
      expect(createDocumentVectorPrefix('my-doc')).toBe('doc:my-doc:');
    });
  });
});

describe('normalize utilities', () => {
  describe('slugify', () => {
    it('lowercases and replaces spaces with hyphens', () => {
      expect(slugify('Hello World')).toBe('hello-world');
    });

    it('removes special characters', () => {
      expect(slugify('Hello, World!')).toBe('hello-world');
    });

    it('removes leading and trailing hyphens', () => {
      expect(slugify('--hello--')).toBe('hello');
    });

    it('handles empty strings', () => {
      expect(slugify('')).toBe('');
    });

    it('collapses consecutive hyphens', () => {
      expect(slugify('hello   world')).toBe('hello-world');
    });
  });

  describe('stripMarkdown', () => {
    it('removes headings', () => {
      expect(stripMarkdown('## Hello')).toBe('Hello');
    });

    it('extracts link text', () => {
      expect(stripMarkdown('[Click here](https://example.com)')).toBe('Click here');
    });

    it('removes emphasis markers', () => {
      expect(stripMarkdown('**bold** and *italic*')).toBe('bold and italic');
    });

    it('preserves code content but removes fences', () => {
      const input = '```js\nconsole.log("hi")\n```';
      const result = stripMarkdown(input);
      expect(result).toContain('console.log');
      expect(result).not.toContain('```');
    });

    it('collapses whitespace', () => {
      expect(stripMarkdown('hello    world')).toBe('hello world');
    });
  });

  describe('buildPlainText', () => {
    it('concatenates sections with title headers', () => {
      const result = buildPlainText([
        { title: 'Intro', content: 'Hello world', id: 'intro' },
        { title: 'Body', content: 'Main content here', id: 'body' }
      ]);
      expect(result).toContain('Intro');
      expect(result).toContain('Hello world');
      expect(result).toContain('Body');
      expect(result).toContain('Main content here');
    });

    it('returns title only for empty content sections', () => {
      const result = buildPlainText([{ title: 'Empty', content: '', id: 'empty' }]);
      expect(result).toBe('Empty');
    });
  });
});

describe('splitMarkdownIntoSections', () => {
  it('splits on headings', () => {
    const markdown = '## Introduction\nHello\n## Body\nWorld';
    const sections = splitMarkdownIntoSections(markdown);
    expect(sections).toHaveLength(2);
    expect(sections[0].title).toBe('Introduction');
    expect(sections[0].content).toBe('Hello');
    expect(sections[1].title).toBe('Body');
    expect(sections[1].content).toBe('World');
  });

  it('handles content before first heading', () => {
    const markdown = 'Preamble text\n## Section';
    const sections = splitMarkdownIntoSections(markdown);
    expect(sections[0].title).toBe('Body');
    expect(sections[0].content).toBe('Preamble text');
  });

  it('does not split on headings inside code fences', () => {
    const markdown = '```\n## Not a heading\n```\n## Real heading\nContent';
    const sections = splitMarkdownIntoSections(markdown);
    const realSection = sections.find((s) => s.title === 'Real heading');
    expect(realSection).toBeDefined();
    expect(realSection?.content).toBe('Content');
  });

  it('returns single body section for headingless content', () => {
    const sections = splitMarkdownIntoSections('Just plain text');
    expect(sections).toHaveLength(1);
    expect(sections[0].id).toBe('body');
    expect(sections[0].title).toBe('Body');
  });

  it('returns single body section for empty input', () => {
    const sections = splitMarkdownIntoSections('');
    expect(sections).toHaveLength(1);
    expect(sections[0].id).toBe('body');
  });

  it('slugifies section IDs', () => {
    const sections = splitMarkdownIntoSections('## My Cool Section\nContent');
    expect(sections[0].id).toBe('my-cool-section');
  });
});
