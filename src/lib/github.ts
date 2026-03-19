/* eslint-disable no-await-in-loop -- Required for sequential API requests with rate limiting */
/**
 * GitHub Stats Utility
 *
 * Fetches and computes lifetime coding statistics from GitHub.
 * Uses repository additions from contributor stats as the primary metric.
 *
 * Note: GitHub does not provide a perfect "total lines of code" metric.
 * This implementation uses "total additions" across repositories as an
 * estimate of lifetime coding activity.
 */

import log from './logger';

export interface GitHubStats {
  totalAdditions: number;
  totalRepositories: number;
  lastUpdated: string;
}

interface GitHubRepository {
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

interface GitHubContributorStats {
  author: {
    login: string;
    id: number;
  };
  total: number;
  weeks: Array<{
    w: number;
    a: number; // additions
    d: number; // deletions
    c: number; // commits
  }>;
}

const GITHUB_API_BASE = 'https://api.github.com';
const CACHE_DURATION_MS = 24 * 60 * 60 * 1000; // 24 hours
const REQUEST_TIMEOUT_MS = 15000; // 15 seconds
const MAX_RETRIES = 2;
const RETRY_DELAY_MS = 1000; // 1 second
// GitHub returns 202 while computing contributor stats; retry up to this many times
const STATS_202_RETRIES = 3;
const STATS_202_DELAY_MS = 3000; // 3 seconds

// In-memory cache (for server-side caching between requests)
interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

const statsCache = new Map<string, CacheEntry<GitHubStats>>();

/**
 * Create headers for GitHub API requests
 */
function createHeaders(): HeadersInit {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    'User-Agent': 'zoms-portfolio-app'
  };

  const token = process.env.GITHUB_TOKEN;
  if (token) {
    headers.Authorization = `token ${token}`;
  }

  return headers;
}

/**
 * Fetch with timeout
 */
async function fetchWithTimeout(
  url: string,
  options: RequestInit = {},
  timeoutMs: number = REQUEST_TIMEOUT_MS
): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal
    });
    return response;
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * Delay helper for retry logic
 */
async function delay(ms: number): Promise<void> {
  // eslint-disable-next-line promise/avoid-new -- Intentional: delay wrapper
  return await new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

/**
 * Handle rate limit warnings from GitHub API response
 */
function handleRateLimitWarning(response: Response): void {
  if (response.status === 403 && response.headers.get('X-RateLimit-Remaining') === '0') {
    const resetTime = response.headers.get('X-RateLimit-Reset');
    if (resetTime) {
      const resetTimestamp = parseInt(resetTime, 10) * 1000;
      const waitTime = resetTimestamp - Date.now();
      log.warn(`GitHub rate limit exceeded. Reset in ${Math.round(waitTime / 1000 / 60)} minutes`);
    }
  }
}

/**
 * Fetch with retry logic for rate limit handling
 */
async function fetchWithRetry(
  url: string,
  options: RequestInit = {},
  retries: number = MAX_RETRIES
): Promise<Response> {
  let lastError: Error | null = null;
  let attempt = 0;

  while (attempt <= retries) {
    try {
      const response = await fetchWithTimeout(url, options);

      handleRateLimitWarning(response);

      if (!response.ok) {
        throw new Error(`GitHub API error: ${response.status} ${response.statusText}`);
      }

      return response;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error('Unknown error');

      if (attempt < retries) {
        const currentAttempt = attempt;
        attempt += 1;
        log.warn(
          `GitHub API request failed, retrying in ${RETRY_DELAY_MS}ms... (attempt ${currentAttempt + 1}/${retries})`
        );
        await delay(RETRY_DELAY_MS * (currentAttempt + 1));
      } else {
        attempt += 1;
      }
    }
  }

  throw lastError ?? new Error('GitHub API request failed after all retries');
}

/**
 * Fetch all repositories for a user (handles pagination)
 */
async function fetchAllRepositories(username: string): Promise<GitHubRepository[]> {
  const repositories: GitHubRepository[] = [];
  let page = 1;
  const perPage = 100; // Max allowed by GitHub API
  let hasMore = true;

  while (hasMore) {
    const url = `${GITHUB_API_BASE}/users/${username}/repos?per_page=${perPage}&page=${page}&type=owner`;
    const response = await fetchWithRetry(url, { headers: createHeaders() });
    // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- GitHub API response type
    const repos = (await response.json()) as GitHubRepository[];

    if (repos.length === 0) {
      hasMore = false;
    } else {
      repositories.push(...repos);
      page += 1;
      // GitHub returns less than perPage when we've reached the end
      hasMore = repos.length === perPage;
    }
  }

  return repositories;
}

/**
 * Fetch contributor stats for a repository.
 * GitHub returns 202 while computing stats — retry with a delay until data is ready.
 */
async function fetchContributorStats(
  username: string,
  repoName: string
): Promise<GitHubContributorStats[]> {
  const url = `${GITHUB_API_BASE}/repos/${username}/${repoName}/stats/contributors`;

  // eslint-disable-next-line no-plusplus -- Required for retry loop
  for (let attempt = 0; attempt <= STATS_202_RETRIES; attempt++) {
    const response = await fetchWithTimeout(url, { headers: createHeaders() });

    if (response.status === 202) {
      if (attempt < STATS_202_RETRIES) {
        log.debug(
          `Stats computing for ${repoName}, retrying in ${STATS_202_DELAY_MS / 1000}s... (${attempt + 1}/${STATS_202_RETRIES})`
        );
        await delay(STATS_202_DELAY_MS);
        continue;
      }
      log.debug(
        `Stats still not ready for ${repoName} after ${STATS_202_RETRIES} retries, skipping`
      );
      return [];
    }

    if (!response.ok) {
      throw new Error(`GitHub API error: ${response.status} ${response.statusText}`);
    }

    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment -- GitHub API response
    const data = await response.json();

    if (!Array.isArray(data)) {
      log.debug(`No contributor stats available for ${repoName} (received non-array response)`);
      return [];
    }

    // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- Verified as array above
    return data as GitHubContributorStats[];
  }

  return [];
}

/**
 * Calculate total additions for a user from contributor stats
 */
function calculateUserAdditions(stats: GitHubContributorStats[], userId: number): number {
  let totalAdditions = 0;

  for (const contributor of stats) {
    if (contributor.author.id === userId) {
      for (const week of contributor.weeks) {
        totalAdditions += week.a;
      }
    }
  }

  return totalAdditions;
}

/**
 * Check if cached data is still valid
 */
function isCacheValid<T>(cacheEntry: CacheEntry<T>): boolean {
  return Date.now() - cacheEntry.timestamp < CACHE_DURATION_MS;
}

/**
 * Process a single repository and return its additions
 */
async function processRepository(
  username: string,
  repoName: string,
  userId: number
): Promise<{ additions: number; success: boolean }> {
  try {
    const stats = await fetchContributorStats(username, repoName);

    // Empty stats array is valid (repo with no commits), not an error
    if (stats.length === 0) {
      log.debug(`No contributor data for ${repoName} (empty or private repo)`);
      return { additions: 0, success: true };
    }

    const additions = calculateUserAdditions(stats, userId);
    return { additions, success: true };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
    log.warn(`Failed to fetch stats for ${repoName}`, { error: errorMsg });
    return { additions: 0, success: false };
  }
}

/**
 * Fetch GitHub stats from cache or API
 */
export async function getGitHubStats(username: string): Promise<GitHubStats> {
  const cacheKey = `github-stats-${username}`;

  // Check cache first
  const cached = statsCache.get(cacheKey);
  if (cached && isCacheValid(cached)) {
    log.debug('Returning cached GitHub stats');
    return cached.data;
  }

  try {
    log.info(`Fetching GitHub stats for user: ${username}`);

    // Fetch all repositories
    const repositories = await fetchAllRepositories(username);
    const ownedRepos = repositories.filter((repo) => !repo.fork);

    log.debug(`Found ${ownedRepos.length} owned repositories`);

    // Get user ID from first repository
    const userId = repositories[0]?.owner.id;

    if (!userId) {
      throw new Error('Could not determine user ID');
    }

    // Process repositories with rate limiting
    let totalAdditions = 0;
    let processedRepos = 0;

    for (const repo of ownedRepos) {
      const result = await processRepository(username, repo.name, userId);
      totalAdditions += result.additions;
      processedRepos += 1;

      // Log progress every 5 repos
      if (processedRepos % 5 === 0) {
        log.debug(`Processed ${processedRepos}/${ownedRepos.length} repositories`);
      }

      // Small delay to avoid rate limiting (only between successful requests)
      if (result.success) {
        await delay(100);
      }
    }

    const stats: GitHubStats = {
      totalAdditions,
      totalRepositories: ownedRepos.length,
      lastUpdated: new Date().toISOString()
    };

    // Cache the result
    statsCache.set(cacheKey, {
      data: stats,
      timestamp: Date.now()
    });

    log.info(
      `Successfully computed GitHub stats: ${totalAdditions.toLocaleString()} additions across ${ownedRepos.length} repositories`
    );

    return stats;
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
    log.error('Failed to fetch GitHub stats', { error: errorMsg });
    throw error;
  }
}

/**
 * Clear the GitHub stats cache
 * Useful for manual cache invalidation
 */
export function clearGitHubStatsCache(username?: string): void {
  if (username) {
    const cacheKey = `github-stats-${username}`;
    statsCache.delete(cacheKey);
    log.debug(`Cleared GitHub stats cache for ${username}`);
  } else {
    statsCache.clear();
    log.debug('Cleared all GitHub stats cache');
  }
}

/**
 * Get cache info for debugging
 */
export function getCacheInfo(): { size: number; entries: Array<{ key: string; age: string }> } {
  const now = Date.now();
  const entries = Array.from(statsCache.entries()).map(([key, entry]) => ({
    key,
    age: formatDuration(now - entry.timestamp)
  }));

  return {
    size: statsCache.size,
    entries
  };
}

function formatDuration(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);

  if (hours > 0) return `${hours}h ${minutes % 60}m`;
  if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
  return `${seconds}s`;
}

// ============================================================================
// GitHub Developer Stats — GraphQL-based (commits, PRs, repos)
// Single request per year range; far fewer API calls than per-repo stats.
// ============================================================================

export interface GitHubDevStats {
  totalCommits: number;
  totalPRs: number;
  totalRepos: number;
  username: string;
  lastUpdated: string;
}

const GITHUB_GRAPHQL_URL = 'https://api.github.com/graphql';

const devStatsCache = new Map<string, CacheEntry<GitHubDevStats>>();

// In-process cache for account creation year (stable for the lifetime of the process)
const creationYearCache = new Map<string, number>();

interface GraphQLContributions {
  totalCommitContributions: number;
}

interface GraphQLDevStatsData {
  user: Record<string, unknown> & {
    repositories: { totalCount: number };
    pullRequests: { totalCount: number };
  };
}

interface GraphQLCreatedAtData {
  user: { createdAt: string };
}

async function fetchGraphQL(query: string): Promise<GraphQLDevStatsData> {
  const token = process.env.GITHUB_TOKEN;
  if (!token) {
    throw new Error('GITHUB_TOKEN is required for GitHub GraphQL API');
  }

  const response = await fetchWithTimeout(GITHUB_GRAPHQL_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `bearer ${token}`,
      'User-Agent': 'zoms-portfolio-app'
    },
    body: JSON.stringify({ query })
  });

  if (!response.ok) {
    throw new Error(`GitHub GraphQL error: ${response.status} ${response.statusText}`);
  }

  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment -- GraphQL response
  const result = await response.json();
  // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- shape validated below
  const typed = result as { data?: GraphQLDevStatsData; errors?: Array<{ message: string }> };

  if (typed.errors?.length) {
    throw new Error(`GraphQL errors: ${typed.errors.map((e) => e.message).join(', ')}`);
  }
  if (!typed.data) {
    throw new Error('No data returned from GitHub GraphQL');
  }

  return typed.data;
}

/**
 * Fetch the year the user created their GitHub account.
 * Result is cached in-process (stable for server lifetime).
 */
async function getAccountStartYear(username: string): Promise<number> {
  const cached = creationYearCache.get(username);
  if (cached !== undefined) return cached;

  // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- shape validated in fetchGraphQL
  const data = (await fetchGraphQL(
    `query { user(login: "${username}") { createdAt } }`
  )) as unknown as GraphQLCreatedAtData;

  const year = new Date(data.user.createdAt).getFullYear();
  creationYearCache.set(username, year);
  log.debug(`GitHub account creation year for ${username}: ${year}`);
  return year;
}

/**
 * Fetch developer stats (commits, PRs, repos) using the GitHub GraphQL API.
 * Queries contributions from account creation year to now — no hardcoded start year.
 */
export async function getGitHubDevStats(username: string): Promise<GitHubDevStats> {
  const cacheKey = `github-dev-stats-${username}`;
  const cached = devStatsCache.get(cacheKey);
  if (cached && isCacheValid(cached)) {
    log.debug('Returning cached GitHub dev stats');
    return cached.data;
  }

  log.info(`Fetching GitHub dev stats for user: ${username}`);

  // Step 1: get account creation year (tiny cached query)
  const startYear = await getAccountStartYear(username);
  const currentYear = new Date().getFullYear();

  // Step 2: build one GraphQL query with per-year contribution aliases
  const yearAliases: string[] = [];
  for (let year = startYear; year <= currentYear; year += 1) {
    const from = `${year}-01-01T00:00:00Z`;
    const to = year === currentYear ? new Date().toISOString() : `${year + 1}-01-01T00:00:00Z`;
    yearAliases.push(
      `        y${year}: contributionsCollection(from: "${from}", to: "${to}") { totalCommitContributions }`
    );
  }

  const query = `
    query {
      user(login: "${username}") {
        repositories(ownerAffiliations: OWNER, isFork: false, first: 1) {
          totalCount
        }
        pullRequests {
          totalCount
        }
${yearAliases.join('\n')}
      }
    }
  `;

  const data = await fetchGraphQL(query);
  const user = data.user;

  let totalCommits = 0;
  for (let year = startYear; year <= currentYear; year += 1) {
    const yearRaw = user[`y${year}`];
    if (yearRaw !== null && typeof yearRaw === 'object' && 'totalCommitContributions' in yearRaw) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- shape checked above
      totalCommits += (yearRaw as GraphQLContributions).totalCommitContributions;
    }
  }

  const stats: GitHubDevStats = {
    totalCommits,
    totalPRs: user.pullRequests.totalCount,
    totalRepos: user.repositories.totalCount,
    username,
    lastUpdated: new Date().toISOString()
  };

  devStatsCache.set(cacheKey, { data: stats, timestamp: Date.now() });

  log.info(
    `GitHub dev stats: ${totalCommits.toLocaleString()} commits, ${stats.totalPRs} PRs, ${stats.totalRepos} repos`
  );

  return stats;
}
