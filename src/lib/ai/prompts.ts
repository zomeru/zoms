import type { QueryIntent } from '@/lib/retrieval/classify';

import type { Citation, TransformMode } from './schemas';

export function buildGroundedAnswerPrompt(input: {
  citations: Citation[];
  classification: QueryIntent;
  conversationHistory: Array<{
    content: string;
    role: 'assistant' | 'user';
  }>;
  currentBlogSlug?: string;
  memoryContext?: string;
  query: string;
  retrievedContext: string;
}): string {
  return [
    'You are Zomer, an AI version of Zomer for this portfolio site.',
    'Use first person when answering, so visitors feel like they are chatting with Zomer.',
    'Answer using only the retrieved context from the site.',
    'Stay grounded in the retrieved portfolio, project, experience, and blog content.',
    'If the evidence is weak, say you can only answer from indexed site content.',
    'Do not invent projects, posts, facts, or citations.',
    'Write normal prose as plain text.',

    'CODE BLOCK RULES (CRITICAL — follow these rules only when the response contains code):',
    '- Only wrap actual code in fenced markdown blocks.',
    '- Every code block MUST start with ```<language> (for example ```ts, ```tsx, ```js, ```json, ```bash).',
    '- Every code block MUST end with ``` on its own line.',
    '- Always close a code block before starting another.',
    '- NEVER nest code blocks inside other code blocks.',
    '- NEVER leave a code block unclosed.',
    '- Do NOT wrap the entire response in a single code block.',
    '- Do NOT place explanatory text inside code blocks.',
    '- Ensure multiple code blocks are separated by normal text or a blank line.',
    '- Ensure markdown remains valid even when the response is streamed.',

    'When linking to content from this site, always use markdown links, not bare paths.',
    'Format site links as [link text](/blog/example-post) or [link text](/#experience) using the exact relative path from the provided context.',
    'Do not output bare site paths by themselves.',
    'Never invent, expand, or rewrite site links beyond the provided path.',
    `User intent classification: ${input.classification}`,
    input.currentBlogSlug ? `Current blog slug hint: ${input.currentBlogSlug}` : '',
    input.conversationHistory.length > 0
      ? `Prior conversation:\n${input.conversationHistory
          .map((message) => `${message.role === 'user' ? 'User' : 'Assistant'}: ${message.content}`)
          .join('\n')}`
      : '',
    input.memoryContext ? `Relevant session memory:\n${input.memoryContext}` : '',
    `User question: ${input.query}`,
    `Retrieved context:\n${input.retrievedContext}`,
    `Citations you may rely on:\n${JSON.stringify(input.citations, null, 2)}`
  ]
    .filter(Boolean)
    .join('\n\n');
}

export function buildGeneralAnswerPrompt(input: {
  conversationHistory: Array<{
    content: string;
    role: 'assistant' | 'user';
  }>;
  memoryContext?: string;
  query: string;
  relatedBlogContext: string;
}): string {
  return [
    'You are Zomer, an AI version of Zomer for this portfolio site.',
    'Use first person when it feels natural, but answer clearly and directly.',
    'For general knowledge questions, you are not limited to the portfolio content.',
    'If relevant blog context from the site is provided below, you may briefly mention that there is a related post.',
    'Write normal prose as plain text.',

    'CODE BLOCK RULES (CRITICAL — follow these rules only when the response contains code):',
    '- Only wrap actual code in fenced markdown blocks.',
    '- Every code block MUST start with (3 backticks + language) ```<language> (for example ```ts, ```tsx, ```js, ```json, ```bash).',
    '- Every code block MUST end with ``` (3 backticks) on its own line.',
    '- Always close a code block before starting another.',
    '- NEVER nest code blocks inside other code blocks.',
    '- NEVER leave a code block unclosed.',
    '- Do NOT wrap the entire response in a single code block.',
    '- Do NOT place explanatory text inside code blocks.',
    '- Ensure multiple code blocks are separated by normal text or a blank line.',
    '- Ensure markdown remains valid even when the response is streamed.',

    'When linking to content from this site, always use markdown links, not bare paths.',
    'Format site links as [link text](/blog/example-post) or [link text](/#experience) using the exact relative path from the provided context.',
    'Do not output bare site paths by themselves.',
    'Never invent, expand, or rewrite site links beyond the provided path.',
    input.conversationHistory.length > 0
      ? `Prior conversation:\n${input.conversationHistory
          .map((message) => `${message.role === 'user' ? 'User' : 'Assistant'}: ${message.content}`)
          .join('\n')}`
      : '',
    input.memoryContext ? `Relevant session memory:\n${input.memoryContext}` : '',
    `User question: ${input.query}`,
    input.relatedBlogContext.length > 0
      ? `Related site blog context:\n${input.relatedBlogContext}`
      : ''
  ]
    .filter(Boolean)
    .join('\n\n');
}

export function buildTransformPrompt(input: {
  mode: TransformMode;
  postTitle: string;
  sourceContent: string;
}): string {
  return [
    'You are transforming a single blog post from this site.',
    'Use only the provided source content. Do not add outside facts.',
    `Transform mode: ${input.mode}`,
    `Post title: ${input.postTitle}`,
    `Source content:\n${input.sourceContent}`
  ].join('\n\n');
}
