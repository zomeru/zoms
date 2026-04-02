import log from "../logger";

const CACHE_DURATION_MS = 24 * 60 * 60 * 1000; // 24 hours
const REQUEST_TIMEOUT_MS = 15000; // 15 seconds
const MAX_RETRIES = 2;
const RETRY_DELAY_MS = 1000; // 1 second
const GITHUB_REVALIDATE_SECONDS = CACHE_DURATION_MS / 1000;

interface NextFetchOptions extends RequestInit {
  next?: {
    revalidate?: number;
    tags?: string[];
  };
}

export interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

export interface GitHubRepository {
  id: number;
  name: string;
  full_name: string;
  owner: {
    login: string;
    id: number;
  };
  fork: boolean;
  size: number;
  language: string | null;
}

export interface GitHubContributorStats {
  author: {
    login: string;
    id: number;
  };
  total: number;
  weeks: Array<{
    w: number;
    a: number;
    d: number;
    c: number;
  }>;
}

export interface GraphQLContributionDay {
  date: string;
  contributionCount: number;
}

interface GraphQLContributionWeek {
  contributionDays: GraphQLContributionDay[];
}

interface GraphQLContributionCalendar {
  totalContributions: number;
  weeks: GraphQLContributionWeek[];
}

export interface GraphQLContributions {
  totalCommitContributions: number;
  contributionCalendar: GraphQLContributionCalendar;
}

export type GraphQLDevStatsUser = Record<string, unknown> & {
  repositories: { totalCount: number };
  pullRequests: { totalCount: number };
};

export interface GraphQLDevStatsData {
  user: GraphQLDevStatsUser;
}

export interface GraphQLCreatedAtData {
  user: { createdAt: string };
}

interface GraphQLError {
  message: string;
}

interface GraphQLResponse<T> {
  data?: T;
  errors?: GraphQLError[];
}

export interface GraphQLRequestVariables {
  username?: string;
}

export function createGitHubHeaders(): HeadersInit {
  const headers: HeadersInit = {
    "Content-Type": "application/json",
    "User-Agent": "zoms-portfolio-app"
  };

  const token = process.env.GITHUB_TOKEN;
  if (token) {
    headers.Authorization = `token ${token}`;
  }

  return headers;
}

export async function fetchWithTimeout(
  url: string,
  options: NextFetchOptions = {},
  timeoutMs: number = REQUEST_TIMEOUT_MS
): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  const nextOptions = {
    revalidate: GITHUB_REVALIDATE_SECONDS,
    tags: ["github-stats"],
    ...options.next
  };

  try {
    return await fetch(url, {
      ...options,
      next: nextOptions,
      signal: controller.signal
    });
  } finally {
    clearTimeout(timeoutId);
  }
}

export async function delay(ms: number): Promise<void> {
  return await new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

export function handleRateLimitWarning(response: Response): void {
  if (response.status === 403 && response.headers.get("X-RateLimit-Remaining") === "0") {
    const resetTime = response.headers.get("X-RateLimit-Reset");
    if (resetTime) {
      const resetTimestamp = Number.parseInt(resetTime, 10) * 1000;
      const waitTime = resetTimestamp - Date.now();
      log.warn(`GitHub rate limit exceeded. Reset in ${Math.round(waitTime / 1000 / 60)} minutes`);
    }
  }
}

export async function fetchWithRetry(
  url: string,
  options: NextFetchOptions = {},
  retries: number = MAX_RETRIES
): Promise<Response> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= retries; attempt += 1) {
    try {
      const response = await fetchWithTimeout(url, options);

      handleRateLimitWarning(response);

      if (!response.ok) {
        throw new Error(`GitHub API error: ${response.status} ${response.statusText}`);
      }

      return response;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error("Unknown error");

      if (attempt < retries) {
        log.warn(
          `GitHub API request failed, retrying in ${RETRY_DELAY_MS}ms... (attempt ${attempt + 1}/${retries})`
        );
        await delay(RETRY_DELAY_MS * (attempt + 1));
      }
    }
  }

  throw lastError ?? new Error("GitHub API request failed after all retries");
}

export function isCacheValid<T>(cacheEntry: CacheEntry<T>): boolean {
  return Date.now() - cacheEntry.timestamp < CACHE_DURATION_MS;
}

export function getDiffInDays(dateA: string | Date, dateB: string | Date): number {
  const a = new Date(dateA);
  const b = new Date(dateB);

  const utcA = Date.UTC(a.getUTCFullYear(), a.getUTCMonth(), a.getUTCDate());
  const utcB = Date.UTC(b.getUTCFullYear(), b.getUTCMonth(), b.getUTCDate());

  return Math.round((utcB - utcA) / (1000 * 60 * 60 * 24));
}

export interface ContributionDay {
  date: string;
  contributionCount: number;
}

export function dedupeContributionDays<T extends ContributionDay>(days: T[]): T[] {
  const byDate = new Map<string, T>();

  for (const day of days) {
    const existing = byDate.get(day.date);
    if (!existing || day.contributionCount > existing.contributionCount) {
      byDate.set(day.date, day);
    }
  }

  return [...byDate.values()];
}

export function calculateLongestStreak(days: ContributionDay[]): number {
  const sortedDays = [...days].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  let longest = 0;
  let current = 0;
  let previousContributedDate: string | null = null;

  for (const day of sortedDays) {
    if (day.contributionCount <= 0) {
      continue;
    }

    if (previousContributedDate === null) {
      current = 1;
      longest = 1;
      previousContributedDate = day.date;
      continue;
    }

    const diffInDays = getDiffInDays(previousContributedDate, day.date);

    if (diffInDays === 1) {
      current += 1;
    } else if (diffInDays > 1) {
      current = 1;
    }

    longest = Math.max(longest, current);
    previousContributedDate = day.date;
  }

  return longest;
}

export function formatDuration(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);

  if (hours > 0) {
    return `${hours}h ${minutes % 60}m`;
  }

  if (minutes > 0) {
    return `${minutes}m ${seconds % 60}s`;
  }

  return `${seconds}s`;
}

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isGitHubRepository(value: unknown): value is GitHubRepository {
  if (!isRecord(value) || !isGitHubRepositoryOwner(value.owner)) {
    return false;
  }

  return (
    typeof value.id === "number" &&
    typeof value.name === "string" &&
    typeof value.full_name === "string" &&
    typeof value.owner.login === "string" &&
    typeof value.owner.id === "number" &&
    typeof value.fork === "boolean" &&
    typeof value.size === "number" &&
    (typeof value.language === "string" || value.language === null)
  );
}

function isGitHubRepositoryOwner(value: unknown): value is GitHubRepository["owner"] {
  return isRecord(value) && typeof value.login === "string" && typeof value.id === "number";
}

function isGitHubContributorWeek(value: unknown): value is GitHubContributorStats["weeks"][number] {
  return (
    isRecord(value) &&
    typeof value.w === "number" &&
    typeof value.a === "number" &&
    typeof value.d === "number" &&
    typeof value.c === "number"
  );
}

function isGitHubContributorStats(value: unknown): value is GitHubContributorStats {
  return (
    isRecord(value) &&
    isRecord(value.author) &&
    typeof value.author.login === "string" &&
    typeof value.author.id === "number" &&
    typeof value.total === "number" &&
    Array.isArray(value.weeks) &&
    value.weeks.every(isGitHubContributorWeek)
  );
}

function isGraphQLError(value: unknown): value is GraphQLError {
  return isRecord(value) && typeof value.message === "string";
}

function isGraphQLContributionDay(value: unknown): value is GraphQLContributionDay {
  return (
    isRecord(value) && typeof value.date === "string" && typeof value.contributionCount === "number"
  );
}

function isGraphQLContributionWeek(value: unknown): value is GraphQLContributionWeek {
  return (
    isRecord(value) &&
    Array.isArray(value.contributionDays) &&
    value.contributionDays.every(isGraphQLContributionDay)
  );
}

function isGraphQLContributionCalendar(value: unknown): value is GraphQLContributionCalendar {
  return (
    isRecord(value) &&
    typeof value.totalContributions === "number" &&
    Array.isArray(value.weeks) &&
    value.weeks.every(isGraphQLContributionWeek)
  );
}

export function isGraphQLContributions(value: unknown): value is GraphQLContributions {
  return (
    isRecord(value) &&
    typeof value.totalCommitContributions === "number" &&
    isGraphQLContributionCalendar(value.contributionCalendar)
  );
}

export function isGraphQLDevStatsData(value: unknown): value is GraphQLDevStatsData {
  return (
    isRecord(value) &&
    isRecord(value.user) &&
    isRecord(value.user.repositories) &&
    typeof value.user.repositories.totalCount === "number" &&
    isRecord(value.user.pullRequests) &&
    typeof value.user.pullRequests.totalCount === "number"
  );
}

export function isGraphQLCreatedAtData(value: unknown): value is GraphQLCreatedAtData {
  return isRecord(value) && isRecord(value.user) && typeof value.user.createdAt === "string";
}

function isGraphQLResponse<T>(
  value: unknown,
  isData: (candidate: unknown) => candidate is T
): value is GraphQLResponse<T> {
  if (!isRecord(value)) {
    return false;
  }

  const dataIsValid =
    !Object.hasOwn(value, "data") || value.data === undefined || isData(value.data);
  const errorsAreValid =
    !Object.hasOwn(value, "errors") ||
    value.errors === undefined ||
    (Array.isArray(value.errors) && value.errors.every(isGraphQLError));

  return dataIsValid && errorsAreValid;
}

export function parseRepositoriesResponse(value: unknown): GitHubRepository[] {
  if (!Array.isArray(value) || !value.every(isGitHubRepository)) {
    throw new Error("Unexpected repositories response from GitHub API");
  }

  return value;
}

export function parseContributorStatsResponse(value: unknown): GitHubContributorStats[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter(isGitHubContributorStats);
}

export async function fetchGitHubGraphQL<T>(
  url: string,
  query: string,
  isData: (candidate: unknown) => candidate is T,
  variables: GraphQLRequestVariables = {}
): Promise<T> {
  const token = process.env.GITHUB_TOKEN;
  if (!token) {
    throw new Error("GITHUB_TOKEN is required for GitHub GraphQL API");
  }

  const response = await fetchWithTimeout(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `bearer ${token}`,
      "User-Agent": "zoms-portfolio-app"
    },
    body: JSON.stringify({ query, variables })
  });

  handleRateLimitWarning(response);

  if (!response.ok) {
    throw new Error(`GitHub GraphQL error: ${response.status} ${response.statusText}`);
  }

  const raw: unknown = await response.json();

  if (!isGraphQLResponse(raw, isData)) {
    throw new Error("Unexpected response from GitHub GraphQL");
  }

  if (raw.errors?.length) {
    throw new Error(`GraphQL errors: ${raw.errors.map((error) => error.message).join(", ")}`);
  }

  if (!raw.data) {
    throw new Error("No data returned from GitHub GraphQL");
  }

  return raw.data;
}
