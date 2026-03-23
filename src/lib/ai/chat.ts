import 'server-only';

import { createOpenRouter } from '@openrouter/ai-sdk-provider';
import { smoothStream, streamText } from 'ai';

import type { QueryClassification } from '@/lib/retrieval/classify';
import type { RetrievedChunk } from '@/lib/retrieval/types';

import { getAiEnv } from './env';
import { buildGroundedAnswerPrompt } from './prompts';
import type { Citation, RelatedContentItem } from './schemas';

function getOpenRouterProvider() {
  const env = getAiEnv();

  return createOpenRouter({
    apiKey: env.OPENROUTER_API_KEY
  });
}

function createStaticTextStream(value: string): AsyncIterable<string> {
  return (async function* () {
    yield value;
  })();
}

function formatRetrievedContext(chunks: RetrievedChunk[]): string {
  return chunks
    .map((chunk, index) =>
      [
        `Source ${index + 1}`,
        `Title: ${chunk.title}`,
        `Content type: ${chunk.contentType}`,
        `Section: ${chunk.sectionTitle}`,
        chunk.tags.length > 0 ? `Tags: ${chunk.tags.join(', ')}` : '',
        `URL: ${chunk.url}`,
        `Content:\n${chunk.content}`
      ]
        .filter(Boolean)
        .join('\n')
    )
    .join('\n\n---\n\n');
}

export function buildRelatedContent(matches: RetrievedChunk[], limit = 3): RelatedContentItem[] {
  const seen = new Set<string>();

  return matches
    .filter((match) => {
      if (seen.has(match.documentId)) {
        return false;
      }

      seen.add(match.documentId);
      return true;
    })
    .slice(0, limit)
    .map((match) => ({
      contentType: match.contentType,
      reason: `Relevant ${match.contentType} content from the ${match.sectionTitle} section.`,
      title: match.title,
      url: match.url
    }));
}

export async function streamGroundedAnswer(input: {
  citations: Citation[];
  classification: QueryClassification;
  conversationHistory: Array<{
    content: string;
    role: 'assistant' | 'user';
  }>;
  currentBlogSlug?: string;
  query: string;
  relatedContent: RelatedContentItem[];
  shouldRefuse: boolean;
  supportingChunks: RetrievedChunk[];
}): Promise<{
  citations: Citation[];
  relatedContent: RelatedContentItem[];
  supported: boolean;
  textStream: AsyncIterable<string>;
}> {
  if (input.shouldRefuse) {
    return {
      citations: [],
      relatedContent: [],
      supported: false,
      textStream: createStaticTextStream(
        'I can only answer from content that is currently indexed on this site.'
      )
    };
  }

  const env = getAiEnv();
  const provider = getOpenRouterProvider();
  const result = streamText({
    experimental_transform: smoothStream({ chunking: 'word' }),
    model: provider.chat(env.OPENROUTER_CHAT_MODEL),
    prompt: buildGroundedAnswerPrompt({
      citations: input.citations,
      classification: input.classification.intent,
      conversationHistory: input.conversationHistory,
      currentBlogSlug: input.currentBlogSlug,
      query: input.query,
      relatedContent: input.relatedContent,
      retrievedContext: formatRetrievedContext(input.supportingChunks)
    }),
    temperature: 0
  });

  return {
    citations: input.citations,
    relatedContent: input.relatedContent,
    supported: true,
    textStream: result.textStream
  };
}
