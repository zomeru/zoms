import type { ContentType } from '@/lib/content/types';

export type QueryIntent =
  | 'BLOG_QUERY'
  | 'EXPERIENCE_QUERY'
  | 'GENERAL_KNOWLEDGE_QUERY'
  | 'GENERAL_PORTFOLIO_QUERY'
  | 'PROJECT_QUERY';

export interface QueryClassification {
  intent: QueryIntent;
  preferredContentTypes: ContentType[];
  query: string;
  strictContentTypes: boolean;
  tokens: string[];
}

const EXPERIENCE_KEYWORDS = [
  'career',
  'company',
  'companies',
  'employment',
  'experience',
  'experiences',
  'job',
  'jobs',
  'position',
  'positions',
  'responsibilities',
  'responsibility',
  'role',
  'roles',
  'work',
  'worked',
  'working'
];

const BLOG_KEYWORDS = ['article', 'articles', 'blog', 'blogs', 'post', 'posts', 'wrote', 'written'];
const PROJECT_KEYWORDS = [
  'app',
  'apps',
  'build',
  'built',
  'demo',
  'github',
  'portfolio',
  'project',
  'projects',
  'repo',
  'repository'
];
const PORTFOLIO_KEYWORDS = ['background', 'skill', 'skills'];
const PORTFOLIO_STACK_KEYWORDS = ['stack', 'tech', 'technologies', 'technology'];
const PORTFOLIO_SUBJECT_KEYWORDS = [
  'blog',
  'blogs',
  'experience',
  'experiences',
  'portfolio',
  'project',
  'projects',
  'site',
  'you',
  'your',
  'zomer'
];
const COMPANY_SUFFIXES = ['corp', 'corporation', 'gmbh', 'inc', 'llc', 'ltd'];
const FOLLOW_UP_PATTERNS = [
  /\b(it|that|them|they|those|this)\b/i,
  /^(and|also|continue|expand|more|what about|how about)\b/i,
  /\bbased on (that|this|it|them)\b/i
];

function tokenize(value: string): string[] {
  return value
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter(Boolean);
}

function hasKeyword(tokens: string[], keywords: string[]): boolean {
  return keywords.some((keyword) => tokens.includes(keyword));
}

function hasExperienceSignal(tokens: string[]): boolean {
  return tokens.some((token) => EXPERIENCE_KEYWORDS.includes(token) || token.startsWith('exper'));
}

function hasPortfolioSubjectSignal(tokens: string[], query: string): boolean {
  return (
    tokens.some((token) => PORTFOLIO_SUBJECT_KEYWORDS.includes(token)) ||
    /\b(your|you|this site|your site|your portfolio)\b/i.test(query)
  );
}

function createClassificationResult(input: {
  intent: QueryIntent;
  preferredContentTypes: ContentType[];
  query: string;
  strictContentTypes: boolean;
  tokens: string[];
}): QueryClassification {
  return {
    intent: input.intent,
    preferredContentTypes: input.preferredContentTypes,
    query: input.query,
    strictContentTypes: input.strictContentTypes,
    tokens: input.tokens
  };
}

function isExperienceQuery(tokens: string[], query: string): boolean {
  const mentionsCompany = tokens.some((token) => COMPANY_SUFFIXES.includes(token));

  return (
    mentionsCompany ||
    hasExperienceSignal(tokens) ||
    /\bwhat did .* do at\b/i.test(query) ||
    /\bwhere did .* work\b/i.test(query)
  );
}

function isPortfolioQuery(tokens: string[], query: string): boolean {
  return (
    hasKeyword(tokens, PORTFOLIO_KEYWORDS) ||
    (hasKeyword(tokens, PORTFOLIO_STACK_KEYWORDS) && hasPortfolioSubjectSignal(tokens, query)) ||
    /\b(who are you|about you|your background|your skills|your tech stack)\b/i.test(query)
  );
}

export function isFollowUpQuery(query: string): boolean {
  const trimmedQuery = query.trim();
  const tokens = tokenize(trimmedQuery);

  return tokens.length <= 12 && FOLLOW_UP_PATTERNS.some((pattern) => pattern.test(trimmedQuery));
}

export function classifyQueryIntent(query: string): QueryClassification {
  const tokens = tokenize(query);

  if (isExperienceQuery(tokens, query)) {
    return createClassificationResult({
      intent: 'EXPERIENCE_QUERY',
      preferredContentTypes: ['experience'],
      query,
      strictContentTypes: true,
      tokens
    });
  }

  if (hasKeyword(tokens, BLOG_KEYWORDS)) {
    return createClassificationResult({
      intent: 'BLOG_QUERY',
      preferredContentTypes: ['blog'],
      query,
      strictContentTypes: true,
      tokens
    });
  }

  if (hasKeyword(tokens, PROJECT_KEYWORDS)) {
    return createClassificationResult({
      intent: 'PROJECT_QUERY',
      preferredContentTypes: ['project'],
      query,
      strictContentTypes: true,
      tokens
    });
  }

  if (isPortfolioQuery(tokens, query)) {
    return createClassificationResult({
      intent: 'GENERAL_PORTFOLIO_QUERY',
      preferredContentTypes: ['about', 'experience', 'project'],
      query,
      strictContentTypes: false,
      tokens
    });
  }

  return createClassificationResult({
    intent: 'GENERAL_KNOWLEDGE_QUERY',
    preferredContentTypes: ['about', 'experience', 'project', 'blog'],
    query,
    strictContentTypes: false,
    tokens
  });
}
