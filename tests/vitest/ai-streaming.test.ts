import { describe, expect, it } from 'vitest';

import { appendStreamText } from '@/lib/ai/streaming';

describe('AI streaming text assembly', () => {
  it('inserts a space when adjacent streamed chunks would merge words', () => {
    expect(appendStreamText('I', 'am an AI version of Zomer.')).toBe(
      'I am an AI version of Zomer.'
    );
  });

  it('does not insert spaces before punctuation or apostrophes', () => {
    expect(appendStreamText('I', "'m here")).toBe("I'm here");
    expect(appendStreamText('Hello', '.')).toBe('Hello.');
  });
});
