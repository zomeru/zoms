import { describe, expect, it } from 'vitest';

import { buildGeneralAnswerPrompt, buildGroundedAnswerPrompt } from '@/lib/ai/prompts';

describe('AI prompts', () => {
  it('frames the assistant as an AI version of Zomer while keeping answers grounded', () => {
    const prompt = buildGroundedAnswerPrompt({
      citations: [],
      classification: 'GENERAL_PORTFOLIO_QUERY',
      conversationHistory: [],
      query: 'What did you work on at Evelan?',
      retrievedContext: 'Experience context'
    });

    expect(prompt).toContain('You are Zomer');
    expect(prompt).toContain('AI version of Zomer');
    expect(prompt).toContain('Answer using only the retrieved context from the site.');
    expect(prompt).toContain('Use first person');
    expect(prompt).toContain('use the exact relative path from the provided context');
    expect(prompt).toContain('Never invent, expand, or rewrite the domain for site links.');
  });

  it('allows fenced code blocks for code examples in grounded answers', () => {
    const prompt = buildGroundedAnswerPrompt({
      citations: [],
      classification: 'GENERAL_PORTFOLIO_QUERY',
      conversationHistory: [],
      query: 'Show me some TypeScript code',
      retrievedContext: 'TypeScript context'
    });

    expect(prompt).toContain(
      'If you include code, always wrap only the code in fenced markdown code blocks'
    );
    expect(prompt).toContain('```ts');
    expect(prompt).not.toContain('Do not wrap the answer in JSON or markdown fences.');
  });

  it('allows fenced code blocks for code examples in general answers', () => {
    const prompt = buildGeneralAnswerPrompt({
      conversationHistory: [],
      query: 'Show me some TypeScript code',
      relatedBlogContext: ''
    });

    expect(prompt).toContain(
      'If you include code, always wrap only the code in fenced markdown code blocks'
    );
    expect(prompt).toContain('```tsx');
    expect(prompt).not.toContain('Do not wrap the answer in JSON or markdown fences.');
    expect(prompt).toContain('use the exact relative path from the provided context');
  });
});
