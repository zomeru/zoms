import 'server-only';

import { projects } from '@/constants/projects';
import { getLatestBlogPosts, getOldestBlogPosts } from '@/lib/blog';
import { getExperience } from '@/lib/experience';
import type { QueryClassification } from '@/lib/retrieval/classify';
import { formatDate } from '@/lib/utils';

import { isIdentityQuery } from './responseDecorations';
import type { Citation, RelatedContentItem } from './schemas';

interface DirectAssistantAnswer {
  citations: Citation[];
  relatedContent: RelatedContentItem[];
  supported: boolean;
  textStream: AsyncIterable<string>;
}

type TemporalDirection = 'latest' | 'oldest';

function createStaticTextStream(value: string): AsyncIterable<string> {
  return (async function* () {
    yield value;
  })();
}

function detectTemporalDirection(query: string): TemporalDirection | null {
  const normalized = query.toLowerCase();

  if (
    normalized.includes('latest') ||
    normalized.includes('newest') ||
    normalized.includes('most recent') ||
    normalized.includes('recent')
  ) {
    return 'latest';
  }

  if (
    normalized.includes('oldest') ||
    normalized.includes('earliest') ||
    normalized.includes('first')
  ) {
    return 'oldest';
  }

  return null;
}

function createDirectAnswer(answer: string, citations: Citation[]): DirectAssistantAnswer {
  return {
    citations,
    relatedContent: [],
    supported: true,
    textStream: createStaticTextStream(answer)
  };
}

function createBlogCitation(input: {
  direction: TemporalDirection;
  slug: string;
  summary: string;
  title: string;
}): Citation {
  return {
    contentType: 'blog',
    id: `direct:blog:${input.direction}:${input.slug}`,
    sectionTitle: 'Summary',
    snippet: input.summary,
    title: input.title,
    url: `/blog/${input.slug}`
  };
}

function createExperienceCitation(input: {
  company: string;
  direction: TemporalDirection;
  location: string;
  range: string;
  title: string;
}): Citation {
  return {
    contentType: 'experience',
    id: `direct:experience:${input.direction}:${input.company.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`,
    sectionTitle: 'Overview',
    snippet: `${input.title} at ${input.company} — ${input.range} — ${input.location}`,
    title: `${input.title} at ${input.company}`,
    url: '/#experience'
  };
}

function createProjectCitation(input: {
  description: string;
  direction: TemporalDirection;
  title: string;
}): Citation {
  return {
    contentType: 'project',
    id: `direct:project:${input.direction}:${input.title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`,
    sectionTitle: 'Overview',
    snippet: input.description,
    title: input.title,
    url: '/#projects'
  };
}

async function answerBlogBoundaryQuery(
  direction: TemporalDirection
): Promise<DirectAssistantAnswer | null> {
  const posts = direction === 'latest' ? await getLatestBlogPosts(1) : await getOldestBlogPosts(1);
  const post = posts.at(0);

  if (!post) {
    return null;
  }

  const citation = createBlogCitation({
    direction,
    slug: post.slug.current,
    summary: post.summary,
    title: post.title
  });
  const answer =
    direction === 'latest'
      ? `The latest blog post is "${post.title}", published on ${formatDate(post.publishedAt)}. You can read it at ${citation.url}.`
      : `The oldest blog post is "${post.title}", published on ${formatDate(post.publishedAt)}. You can read it at ${citation.url}.`;

  return createDirectAnswer(answer, [citation]);
}

async function answerExperienceBoundaryQuery(
  direction: TemporalDirection
): Promise<DirectAssistantAnswer | null> {
  const experiences = [...(await getExperience())].sort((left, right) => left.order - right.order);
  const experience = direction === 'latest' ? experiences[0] : experiences.at(-1);

  if (!experience) {
    return null;
  }

  const citation = createExperienceCitation({
    company: experience.company,
    direction,
    location: experience.location,
    range: experience.range,
    title: experience.title
  });
  const answer =
    direction === 'latest'
      ? `The most recent experience entry is ${experience.title} at ${experience.company} (${experience.range}, ${experience.location}).`
      : `The oldest experience entry is ${experience.title} at ${experience.company} (${experience.range}, ${experience.location}).`;

  return createDirectAnswer(answer, [citation]);
}

async function answerProjectBoundaryQuery(
  direction: TemporalDirection
): Promise<DirectAssistantAnswer | null> {
  const project = direction === 'latest' ? projects[0] : projects.at(-1);

  if (!project) {
    return null;
  }

  const citation = createProjectCitation({
    description: project.info,
    direction,
    title: project.name
  });
  const answer =
    direction === 'latest'
      ? `Based on the current portfolio ordering, the latest featured project is "${project.name}". ${project.info}`
      : `Based on the current portfolio ordering, the oldest listed project is "${project.name}". ${project.info}`;

  return createDirectAnswer(answer, [citation]);
}

export async function getDirectAssistantAnswer(input: {
  classification: QueryClassification;
  query: string;
}): Promise<DirectAssistantAnswer | null> {
  if (isIdentityQuery(input.query)) {
    return createDirectAnswer(
      "I'm Zomer, a Software Engineer. I can help with questions about my projects, experience, blog posts, personal background, or even a general question.",
      []
    );
  }

  const direction = detectTemporalDirection(input.query);

  if (!direction) {
    return null;
  }

  switch (input.classification.intent) {
    case 'BLOG_QUERY':
      return await answerBlogBoundaryQuery(direction);
    case 'EXPERIENCE_QUERY':
      return await answerExperienceBoundaryQuery(direction);
    case 'PROJECT_QUERY':
      return await answerProjectBoundaryQuery(direction);
    default:
      return null;
  }
}
