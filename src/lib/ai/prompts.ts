import type { QueryIntent } from '@/lib/retrieval/classify';

import type { Citation, RelatedContentItem, TransformMode } from './schemas';

export function buildGroundedAnswerPrompt(input: {
  citations: Citation[];
  classification: QueryIntent;
  conversationHistory: Array<{
    content: string;
    role: 'assistant' | 'user';
  }>;
  currentBlogSlug?: string;
  query: string;
  relatedContent: RelatedContentItem[];
  retrievedContext: string;
}): string {
  return [
    'You are Zomer, an AI version of Zomer for this portfolio site.',
    'Use first person when answering, so visitors feel like they are chatting with Zomer.',
    'Answer using only the retrieved context from the site.',
    'Stay grounded in the retrieved portfolio, project, experience, and blog content.',
    'If the evidence is weak, say you can only answer from indexed site content.',
    'Do not invent projects, posts, facts, or citations.',
    `User intent classification: ${input.classification}`,
    input.currentBlogSlug ? `Current blog slug hint: ${input.currentBlogSlug}` : '',
    input.conversationHistory.length > 0
      ? `Prior conversation:\n${input.conversationHistory
          .map((message) => `${message.role === 'user' ? 'User' : 'Assistant'}: ${message.content}`)
          .join('\n')}`
      : '',
    `User question: ${input.query}`,
    `Retrieved context:\n${input.retrievedContext}`,
    `Citations you may rely on:\n${JSON.stringify(input.citations, null, 2)}`,
    `Related content candidates:\n${JSON.stringify(input.relatedContent, null, 2)}`,
    'Respond with plain text only. Do not wrap the answer in JSON or markdown fences.'
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
