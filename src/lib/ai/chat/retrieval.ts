import { streamGeneralAnswer, streamGroundedAnswer } from '@/lib/ai/chat-stream';
import { getDirectAssistantAnswer } from '@/lib/ai/directAnswers';
import { filterChatCitations } from '@/lib/ai/responseDecorations';
import {
  isFollowUpQuery,
  type QueryClassification,
  type QueryIntent
} from '@/lib/retrieval/classify';
import {
  retrieveBlogs,
  retrieveExperience,
  retrievePortfolio,
  retrieveProjects
} from '@/lib/retrieval/search';
import type { RetrievedChunk } from '@/lib/retrieval/types';
import { getVectorIndexClient } from '@/lib/vector/index';

import type { buildConversationHistory } from './messages';

type GroundedAnswerStream = Awaited<ReturnType<typeof streamGroundedAnswer>>;

export interface RetrievalMetadata {
  classification: QueryClassification;
  directAnswer: boolean;
  matchCount: number;
  matches: RetrievedChunk[];
}

function buildRetrievalQuery(
  question: string,
  conversationHistory: ReturnType<typeof buildConversationHistory>
): string {
  if (conversationHistory.length === 0) {
    return question;
  }

  return [
    'Conversation history:',
    ...conversationHistory.map(
      (message) => `${message.role === 'user' ? 'User' : 'Assistant'}: ${message.content}`
    ),
    `Current question: ${question}`
  ].join('\n');
}

function getRetriever(intent: QueryIntent) {
  switch (intent) {
    case 'EXPERIENCE_QUERY':
      return retrieveExperience;
    case 'PROJECT_QUERY':
      return retrieveProjects;
    case 'BLOG_QUERY':
      return retrieveBlogs;
    default:
      return retrievePortfolio;
  }
}

export async function resolveGroundedAnswer(input: {
  blogSlug?: string;
  classification: QueryClassification;
  conversationHistory: ReturnType<typeof buildConversationHistory>;
  memoryContext?: string;
  pathname?: string;
  question: string;
}): Promise<{
  groundedAnswer: GroundedAnswerStream;
  retrievalMetadata: RetrievalMetadata;
}> {
  const followUpQuery = isFollowUpQuery(input.question);

  const directAnswer = await getDirectAssistantAnswer({
    classification: input.classification,
    query: input.question
  });

  if (directAnswer) {
    const visibleCitations = filterChatCitations({
      citations: directAnswer.citations,
      classification: input.classification,
      query: input.question
    });

    return {
      groundedAnswer: {
        ...directAnswer,
        citations: visibleCitations
      },
      retrievalMetadata: {
        classification: input.classification,
        directAnswer: true,
        matchCount: visibleCitations.length,
        matches: []
      }
    };
  }

  if (input.classification.intent === 'GENERAL_KNOWLEDGE_QUERY' && !followUpQuery) {
    const generalAnswer = await streamGeneralAnswer({
      conversationHistory: input.conversationHistory,
      memoryContext: input.memoryContext,
      query: input.question,
      relatedBlogChunks: []
    });

    return {
      groundedAnswer: {
        ...generalAnswer,
        citations: []
      },
      retrievalMetadata: {
        classification: input.classification,
        directAnswer: false,
        matchCount: 0,
        matches: []
      }
    };
  }

  if (input.classification.intent === 'GENERAL_KNOWLEDGE_QUERY') {
    const retrieval = await retrievePortfolio({
      currentBlogSlug: input.blogSlug,
      query: buildRetrievalQuery(input.question, input.conversationHistory),
      vectorQuery: async ({ filter, query, topK }) =>
        await getVectorIndexClient().query({ filter, query, topK })
    });
    const visibleCitations = filterChatCitations({
      citations: retrieval.citations,
      classification: input.classification,
      query: input.question
    });
    const groundedAnswer = await streamGroundedAnswer({
      citations: visibleCitations,
      classification: retrieval.classification,
      conversationHistory: input.conversationHistory,
      currentBlogSlug: input.blogSlug,
      memoryContext: input.memoryContext,
      query: input.question,
      shouldRefuse: retrieval.shouldRefuse,
      supportingChunks: retrieval.matches
    });

    return {
      groundedAnswer: {
        ...groundedAnswer,
        citations: visibleCitations
      },
      retrievalMetadata: {
        classification: retrieval.classification,
        directAnswer: false,
        matchCount: retrieval.matches.length,
        matches: retrieval.matches
      }
    };
  }

  const retrieval = await getRetriever(input.classification.intent)({
    currentBlogSlug: input.blogSlug,
    query: buildRetrievalQuery(input.question, input.conversationHistory),
    vectorQuery: async ({ filter, query, topK }) =>
      await getVectorIndexClient().query({ filter, query, topK })
  });
  const visibleCitations = filterChatCitations({
    citations: retrieval.citations,
    classification: retrieval.classification,
    query: input.question
  });
  const groundedAnswer = await streamGroundedAnswer({
    citations: visibleCitations,
    classification: retrieval.classification,
    conversationHistory: input.conversationHistory,
    currentBlogSlug: input.blogSlug,
    memoryContext: input.memoryContext,
    query: input.question,
    shouldRefuse: retrieval.shouldRefuse,
    supportingChunks: retrieval.matches
  });

  return {
    groundedAnswer,
    retrievalMetadata: {
      classification: retrieval.classification,
      directAnswer: false,
      matchCount: retrieval.matches.length,
      matches: retrieval.matches
    }
  };
}
