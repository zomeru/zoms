import type { Citation } from '@/lib/ai/schemas';
import type { ContentType } from '@/lib/content/types';
import type { QueryClassification } from '@/lib/retrieval/classify';

function normalizeQuery(query: string): string {
  return query.trim().toLowerCase();
}

export function isIdentityQuery(query: string): boolean {
  const normalized = normalizeQuery(query);

  return (
    normalized === 'who are you' ||
    normalized === 'who are you?' ||
    normalized === 'what are you' ||
    normalized === 'what are you?' ||
    normalized === 'are you ai' ||
    normalized === 'are you ai?'
  );
}

function isAboutPortfolioQuery(query: string): boolean {
  const normalized = normalizeQuery(query);

  return [
    'about you',
    'about zomer',
    'background',
    'introduce yourself',
    'personal info',
    'tell me about yourself',
    'tell me about zomer',
    'where are you based',
    'where do you live',
    'who is zomer'
  ].some((pattern) => normalized.includes(pattern));
}

function filterByContentType<T extends { contentType: ContentType }>(
  values: T[],
  contentType: ContentType
): T[] {
  return values.filter((value) => value.contentType === contentType);
}

export function filterChatCitations(input: {
  citations: Citation[];
  classification: QueryClassification;
  query: string;
}): Citation[] {
  if (isIdentityQuery(input.query)) {
    return [];
  }

  switch (input.classification.intent) {
    case 'BLOG_QUERY':
      return filterByContentType(input.citations, 'blog');
    case 'EXPERIENCE_QUERY':
      return filterByContentType(input.citations, 'experience');
    case 'PROJECT_QUERY':
      return filterByContentType(input.citations, 'project');
    case 'GENERAL_KNOWLEDGE_QUERY':
      return filterByContentType(input.citations, 'blog');
    default:
      if (isAboutPortfolioQuery(input.query)) {
        return filterByContentType(input.citations, 'about');
      }

      return [];
  }
}
