import "server-only";

import { getBlogPosts, getLatestBlogPosts, getOldestBlogPosts } from "@/lib/blog";
import { getExperience } from "@/lib/experience";
import { getProjects } from "@/lib/projects";
import type { QueryClassification } from "@/lib/retrieval/classify";
import { formatDate } from "@/lib/utils";

import { isIdentityQuery } from "./responseDecorations";
import type { Citation } from "./schemas";

interface DirectAssistantAnswer {
  citations: Citation[];
  supported: boolean;
  textStream: AsyncIterable<string>;
}

type TemporalDirection = "latest" | "oldest";
type QuantityRequest = { count: number; kind: "count" } | { kind: "all" } | null;
const DIGIT_COUNT_PATTERN = /\b(\d+)\b/;
const WORD_COUNT_PATTERN = /\b(one|two|three|four|five)\b/;

const NUMBER_WORDS: Record<string, number> = {
  one: 1,
  two: 2,
  three: 3,
  four: 4,
  five: 5
};

function createStaticTextStream(value: string): AsyncIterable<string> {
  return (async function* () {
    yield value;
  })();
}

function detectTemporalDirection(query: string): TemporalDirection | null {
  const normalized = query.toLowerCase();

  if (
    normalized.includes("latest") ||
    normalized.includes("newest") ||
    normalized.includes("most recent") ||
    normalized.includes("recent")
  ) {
    return "latest";
  }

  if (
    normalized.includes("oldest") ||
    normalized.includes("earliest") ||
    normalized.includes("first")
  ) {
    return "oldest";
  }

  return null;
}

function detectQuantityRequest(query: string): QuantityRequest {
  const normalized = query.toLowerCase();

  if (/\ball\b/.test(normalized)) {
    return { kind: "all" };
  }

  const numericMatch = DIGIT_COUNT_PATTERN.exec(normalized);

  if (numericMatch) {
    return {
      count: Math.max(1, Number.parseInt(numericMatch[1], 10)),
      kind: "count"
    };
  }

  const wordMatch = WORD_COUNT_PATTERN.exec(normalized);

  if (wordMatch) {
    return {
      count: NUMBER_WORDS[wordMatch[1]],
      kind: "count"
    };
  }

  return null;
}

function formatNumberedList(lines: string[]): string {
  return lines.map((line, index) => `${index + 1}. ${line}`).join("\n");
}

function isAllQuantity(quantity: QuantityRequest): quantity is { kind: "all" } {
  return quantity?.kind === "all";
}

function isCountQuantity(quantity: QuantityRequest): quantity is { count: number; kind: "count" } {
  return quantity?.kind === "count";
}

function isMultiItemQuantity(quantity: QuantityRequest): boolean {
  return isAllQuantity(quantity) || (isCountQuantity(quantity) && quantity.count > 1);
}

function getRequestedCount(quantity: QuantityRequest): number {
  return isCountQuantity(quantity) ? quantity.count : 1;
}

function selectEntriesByDirection<T>(
  entries: T[],
  direction: TemporalDirection,
  quantity: QuantityRequest
): T[] {
  if (isAllQuantity(quantity)) {
    return entries;
  }

  const count = getRequestedCount(quantity);

  if (direction === "latest") {
    return entries.slice(0, count);
  }

  return [...entries].reverse().slice(0, count);
}

function createDirectAnswer(answer: string, citations: Citation[]): DirectAssistantAnswer {
  return {
    citations,
    supported: true,
    textStream: createStaticTextStream(answer)
  };
}

function createBlogCitation(input: {
  direction: TemporalDirection;
  slug: string;
  title: string;
}): Citation {
  return {
    contentType: "blog",
    id: `direct:blog:${input.direction}:${input.slug}`,
    sectionTitle: "Summary",
    snippet: input.title,
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
    contentType: "experience",
    id: `direct:experience:${input.direction}:${input.company.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`,
    sectionTitle: "Overview",
    snippet: `${input.title} at ${input.company} — ${input.range} — ${input.location}`,
    title: `${input.title} at ${input.company}`,
    url: "/#experience"
  };
}

function createProjectCitation(input: {
  description: string;
  direction: TemporalDirection;
  title: string;
}): Citation {
  return {
    contentType: "project",
    id: `direct:project:${input.direction}:${input.title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`,
    sectionTitle: "Overview",
    snippet: input.description,
    title: input.title,
    url: "/#projects"
  };
}

async function answerBlogBoundaryQuery(
  direction: TemporalDirection,
  quantity: QuantityRequest
): Promise<DirectAssistantAnswer | null> {
  const posts = isAllQuantity(quantity)
    ? await getBlogPosts(25, 0)
    : direction === "latest"
      ? await getLatestBlogPosts(getRequestedCount(quantity))
      : await getOldestBlogPosts(getRequestedCount(quantity));
  const citations = posts.map((post) =>
    createBlogCitation({
      direction,
      slug: post.slug.current,
      title: post.title
    })
  );
  const post = posts.at(0);

  if (!post || citations.length === 0) {
    return null;
  }

  if (isMultiItemQuantity(quantity)) {
    const answer = formatNumberedList(
      posts.map(
        (entry) =>
          `"${entry.title}" (${formatDate(entry.publishedAt)}) - /blog/${entry.slug.current}`
      )
    );

    return createDirectAnswer(answer, citations);
  }

  const [citation] = citations;
  const answer =
    direction === "latest"
      ? `The latest blog post is "${post.title}", published on ${formatDate(post.publishedAt)}. You can read it at ${citation.url}.`
      : `The oldest blog post is "${post.title}", published on ${formatDate(post.publishedAt)}. You can read it at ${citation.url}.`;

  return createDirectAnswer(answer, [citation]);
}

async function answerExperienceBoundaryQuery(
  direction: TemporalDirection,
  quantity: QuantityRequest
): Promise<DirectAssistantAnswer | null> {
  const experiences = [...(await getExperience())].sort((left, right) => left.order - right.order);
  const selectedExperiences = selectEntriesByDirection(experiences, direction, quantity);
  const experience = selectedExperiences.at(0);

  if (!experience) {
    return null;
  }

  const citations = selectedExperiences.map((entry) =>
    createExperienceCitation({
      company: entry.company,
      direction,
      location: entry.location,
      range: entry.range,
      title: entry.title
    })
  );

  if (isMultiItemQuantity(quantity)) {
    const answer = formatNumberedList(
      selectedExperiences.map(
        (entry) => `${entry.title} at ${entry.company} (${entry.range}, ${entry.location})`
      )
    );

    return createDirectAnswer(answer, citations);
  }

  const answer =
    direction === "latest"
      ? `The most recent experience entry is ${experience.title} at ${experience.company} (${experience.range}, ${experience.location}).`
      : `The oldest experience entry is ${experience.title} at ${experience.company} (${experience.range}, ${experience.location}).`;

  return createDirectAnswer(answer, citations.slice(0, 1));
}

async function answerProjectBoundaryQuery(
  direction: TemporalDirection,
  quantity: QuantityRequest
): Promise<DirectAssistantAnswer | null> {
  const projects = [...(await getProjects())].sort((left, right) => right.order - left.order);
  const selectedProjects = selectEntriesByDirection(projects, direction, quantity);
  const project = selectedProjects.at(0);

  if (!project) {
    return null;
  }

  const citations = selectedProjects.map((entry) =>
    createProjectCitation({
      description: entry.info,
      direction,
      title: entry.name
    })
  );

  if (isMultiItemQuantity(quantity)) {
    const answer = formatNumberedList(
      selectedProjects.map((entry) => `"${entry.name}" - ${entry.info}`)
    );

    return createDirectAnswer(answer, citations);
  }

  const answer =
    direction === "latest"
      ? `The most recent project entry is ${project.name}. ${project.info}`
      : `The oldest project entry is ${project.name}. ${project.info}`;

  return createDirectAnswer(answer, citations.slice(0, 1));
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
  const quantity = detectQuantityRequest(input.query);

  if (quantity?.kind === "all") {
    switch (input.classification.intent) {
      case "BLOG_QUERY":
        return await answerBlogBoundaryQuery("latest", quantity);
      case "EXPERIENCE_QUERY":
        return await answerExperienceBoundaryQuery("latest", quantity);
      case "PROJECT_QUERY":
        return await answerProjectBoundaryQuery("latest", quantity);
      default:
        return null;
    }
  }

  if (!direction) {
    return null;
  }

  switch (input.classification.intent) {
    case "BLOG_QUERY":
      return await answerBlogBoundaryQuery(direction, quantity);
    case "EXPERIENCE_QUERY":
      return await answerExperienceBoundaryQuery(direction, quantity);
    case "PROJECT_QUERY":
      return await answerProjectBoundaryQuery(direction, quantity);
    default:
      return null;
  }
}
