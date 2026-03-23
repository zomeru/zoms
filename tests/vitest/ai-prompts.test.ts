import { describe, expect, it } from 'vitest';

import { buildGroundedAnswerPrompt } from '@/lib/ai/prompts';

describe('AI prompts', () => {
  it('frames the assistant as an AI version of Zomer while keeping answers grounded', () => {
    const prompt = buildGroundedAnswerPrompt({
      citations: [],
      classification: 'GENERAL_PORTFOLIO_QUERY',
      conversationHistory: [],
      query: 'What did you work on at Evelan?',
      relatedContent: [],
      retrievedContext: 'Experience context'
    });

    expect(prompt).toContain('You are Zomer');
    expect(prompt).toContain('AI version of Zomer');
    expect(prompt).toContain('Answer using only the retrieved context from the site.');
    expect(prompt).toContain('Use first person');
  });
});
