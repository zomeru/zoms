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
const PORTFOLIO_KEYWORDS = [
  'background',
  'know',
  'skill',
  'skills',
  'stack',
  'tech',
  'technologies',
  'technology'
];
const COMPANY_SUFFIXES = ['corp', 'corporation', 'gmbh', 'inc', 'llc', 'ltd'];

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

export function classifyQueryIntent(query: string): QueryClassification {
  const tokens = tokenize(query);
  const mentionsCompany = tokens.some((token) => COMPANY_SUFFIXES.includes(token));

  if (
    mentionsCompany ||
    hasExperienceSignal(tokens) ||
    /\bwhat did .* do at\b/i.test(query) ||
    /\bwhere did .* work\b/i.test(query)
  ) {
    return {
      intent: 'EXPERIENCE_QUERY',
      preferredContentTypes: ['experience'],
      query,
      strictContentTypes: true,
      tokens
    };
  }

  if (hasKeyword(tokens, BLOG_KEYWORDS)) {
    return {
      intent: 'BLOG_QUERY',
      preferredContentTypes: ['blog'],
      query,
      strictContentTypes: true,
      tokens
    };
  }

  if (hasKeyword(tokens, PROJECT_KEYWORDS)) {
    return {
      intent: 'PROJECT_QUERY',
      preferredContentTypes: ['project'],
      query,
      strictContentTypes: true,
      tokens
    };
  }

  if (hasKeyword(tokens, PORTFOLIO_KEYWORDS)) {
    return {
      intent: 'GENERAL_PORTFOLIO_QUERY',
      preferredContentTypes: ['about', 'experience', 'project'],
      query,
      strictContentTypes: false,
      tokens
    };
  }

  return {
    intent: 'GENERAL_KNOWLEDGE_QUERY',
    preferredContentTypes: ['about', 'experience', 'project', 'blog'],
    query,
    strictContentTypes: false,
    tokens
  };
}
