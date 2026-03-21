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

import log from '../logger';
import { formatIsoDate } from '../utils';
import {
  calculateLongestStreak,
  createGitHubHeaders,
  dedupeContributionDays,
  delay,
  fetchGitHubGraphQL,
  fetchWithRetry,
  fetchWithTimeout,
  formatDuration,
  isCacheValid,
  isGraphQLContributions,
  isGraphQLCreatedAtData,
  isGraphQLDevStatsData,
  parseContributorStatsResponse,
  parseRepositoriesResponse,
  type CacheEntry,
  type GitHubContributorStats,
  type GitHubRepository,
  type GraphQLContributionDay,
  type GraphQLRequestVariables
} from './helper';

export interface GitHubStats {
  totalAdditions: number;
  totalRepositories: number;
  lastUpdated: string;
}

export interface GitHubDevStats {
  totalCommits: number;
  totalPRs: number;
  totalRepos: number;
  totalContributions: number;
  longestStreak: number;
  username: string;
  lastUpdated: string;
}

const GITHUB_API_BASE = 'https://api.github.com';
const GITHUB_GRAPHQL_URL = 'https://api.github.com/graphql';
const STATS_202_RETRIES = 3;
const STATS_202_DELAY_MS = 3000;

const statsCache = new Map<string, CacheEntry<GitHubStats>>();
const devStatsCache = new Map<string, CacheEntry<GitHubDevStats>>();
const creationYearCache = new Map<string, number>();

async function fetchGraphQL<T>(
  query: string,
  isData: (candidate: unknown) => candidate is T,
  variables: GraphQLRequestVariables = {}
): Promise<T> {
  return await fetchGitHubGraphQL(GITHUB_GRAPHQL_URL, query, isData, variables);
}

async function fetchAllRepositories(username: string): Promise<GitHubRepository[]> {
  const repositories: GitHubRepository[] = [];
  let page = 1;
  const perPage = 100;
  let hasMore = true;

  while (hasMore) {
    const url = `${GITHUB_API_BASE}/users/${username}/repos?per_page=${perPage}&page=${page}&type=owner`;
    const response = await fetchWithRetry(url, { headers: createGitHubHeaders() });
    const raw: unknown = await response.json();
    const repos = parseRepositoriesResponse(raw);

    if (repos.length === 0) {
      hasMore = false;
      continue;
    }

    repositories.push(...repos);
    page += 1;
    hasMore = repos.length === perPage;
  }

  return repositories;
}

async function fetchContributorStats(
  username: string,
  repoName: string
): Promise<GitHubContributorStats[]> {
  const url = `${GITHUB_API_BASE}/repos/${username}/${repoName}/stats/contributors`;

  for (let attempt = 0; attempt <= STATS_202_RETRIES; attempt += 1) {
    const response = await fetchWithTimeout(url, { headers: createGitHubHeaders() });

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

    const raw: unknown = await response.json();
    const stats = parseContributorStatsResponse(raw);

    if (stats.length === 0) {
      log.debug(`No contributor stats available for ${repoName} (empty or invalid response)`);
    }

    return stats;
  }

  return [];
}

function calculateUserAdditions(stats: GitHubContributorStats[], userId: number): number {
  let totalAdditions = 0;

  for (const contributor of stats) {
    if (contributor.author.id !== userId) {
      continue;
    }

    for (const week of contributor.weeks) {
      totalAdditions += week.a;
    }
  }

  return totalAdditions;
}

async function processRepository(
  username: string,
  repoName: string,
  userId: number
): Promise<{ additions: number; success: boolean }> {
  try {
    const stats = await fetchContributorStats(username, repoName);

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

async function getAccountStartYear(username: string): Promise<number> {
  const cached = creationYearCache.get(username);
  if (cached !== undefined) {
    return cached;
  }

  const query = `
    query GetUserCreatedAt($username: String!) {
      user(login: $username) {
        createdAt
      }
    }
  `;

  const data = await fetchGraphQL(query, isGraphQLCreatedAtData, { username });
  const year = new Date(data.user.createdAt).getFullYear();

  creationYearCache.set(username, year);
  log.debug(`GitHub account creation year for ${username}: ${year}`);

  return year;
}

export async function getGitHubStats(username: string): Promise<GitHubStats> {
  const cacheKey = `github-stats-${username}`;
  const cached = statsCache.get(cacheKey);

  if (cached && isCacheValid(cached)) {
    log.debug('Returning cached GitHub stats');
    return cached.data;
  }

  try {
    log.info(`Fetching GitHub stats for user: ${username}`);

    const repositories = await fetchAllRepositories(username);
    const ownedRepos = repositories.filter((repo) => !repo.fork);

    log.debug(`Found ${ownedRepos.length} owned repositories`);

    const userId = repositories[0]?.owner.id;
    if (!userId) {
      throw new Error('Could not determine user ID');
    }

    let totalAdditions = 0;
    let processedRepos = 0;

    for (const repo of ownedRepos) {
      const result = await processRepository(username, repo.name, userId);
      totalAdditions += result.additions;
      processedRepos += 1;

      if (processedRepos % 5 === 0) {
        log.debug(`Processed ${processedRepos}/${ownedRepos.length} repositories`);
      }

      if (result.success) {
        await delay(100);
      }
    }

    const stats: GitHubStats = {
      totalAdditions,
      totalRepositories: ownedRepos.length,
      lastUpdated: new Date().toISOString()
    };

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

export async function getGitHubDevStats(username: string): Promise<GitHubDevStats> {
  const cacheKey = `github-dev-stats-${username}`;
  const cached = devStatsCache.get(cacheKey);

  if (cached && isCacheValid(cached)) {
    log.debug('Returning cached GitHub dev stats');
    return cached.data;
  }

  log.info(`Fetching GitHub dev stats for user: ${username}`);

  const startYear = await getAccountStartYear(username);
  const currentYear = new Date().getFullYear();

  const yearAliases: string[] = [];
  for (let year = startYear; year <= currentYear; year += 1) {
    const from = `${year}-01-01T00:00:00Z`;
    const to = year === currentYear ? new Date().toISOString() : `${year + 1}-01-01T00:00:00Z`;

    yearAliases.push(`
      y${year}: contributionsCollection(from: "${from}", to: "${to}") {
        totalCommitContributions
        contributionCalendar {
          totalContributions
          weeks {
            contributionDays {
              date
              contributionCount
            }
          }
        }
      }
    `);
  }

  const query = `
    query GetGitHubDevStats($username: String!) {
      user(login: $username) {
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

  const data = await fetchGraphQL(query, isGraphQLDevStatsData, { username });
  const { user } = data;

  let totalCommits = 0;
  let totalContributions = 0;
  const allDays: GraphQLContributionDay[] = [];

  for (let year = startYear; year <= currentYear; year += 1) {
    const contributions = user[`y${year}`];
    if (!isGraphQLContributions(contributions)) {
      continue;
    }

    totalCommits += contributions.totalCommitContributions;
    totalContributions += contributions.contributionCalendar.totalContributions;

    for (const week of contributions.contributionCalendar.weeks) {
      allDays.push(...week.contributionDays);
    }
  }

  const longestStreak = calculateLongestStreak(dedupeContributionDays(allDays));

  const stats: GitHubDevStats = {
    totalCommits,
    totalPRs: user.pullRequests.totalCount,
    totalRepos: user.repositories.totalCount,
    totalContributions,
    longestStreak,
    username,
    lastUpdated: formatIsoDate(new Date().toISOString())
  };

  devStatsCache.set(cacheKey, {
    data: stats,
    timestamp: Date.now()
  });

  log.info(
    `GitHub dev stats: ${totalCommits.toLocaleString()} commits, ${totalContributions.toLocaleString()} contributions, ${longestStreak} day streak, ${stats.totalPRs} PRs, ${stats.totalRepos} repos`
  );

  return stats;
}

export function clearGitHubStatsCache(username?: string): void {
  if (username) {
    statsCache.delete(`github-stats-${username}`);
    devStatsCache.delete(`github-dev-stats-${username}`);
    creationYearCache.delete(username);
    log.debug(`Cleared GitHub stats caches for ${username}`);
    return;
  }

  statsCache.clear();
  devStatsCache.clear();
  creationYearCache.clear();
  log.debug('Cleared all GitHub stats caches');
}

export function getCacheInfo(): {
  size: number;
  entries: Array<{ key: string; age: string }>;
} {
  const now = Date.now();

  const statsEntries = Array.from(statsCache.entries()).map(([key, entry]) => ({
    key,
    age: formatDuration(now - entry.timestamp)
  }));

  const devStatsEntries = Array.from(devStatsCache.entries()).map(([key, entry]) => ({
    key,
    age: formatDuration(now - entry.timestamp)
  }));

  return {
    size: statsCache.size + devStatsCache.size,
    entries: [...statsEntries, ...devStatsEntries]
  };
}
