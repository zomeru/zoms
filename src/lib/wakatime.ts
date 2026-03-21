/**
 * WakaTime Stats Utility
 *
 * Fetches coding time and language breakdown from the WakaTime API.
 * Requires WAKATIME_API_KEY env var. Returns null gracefully if not configured.
 */

import log from './logger';

const SELECTED_LANGUAGES = [
  'TypeScript',
  'JavaScript',
  'Python',
  'Bash',
  'Markdown',
  'Vue.js',
  'CSS',
  'HMTL',
  'Svelte',
  'YAML',
  'JSX',
  'SQL',
  'Docker'
];

export interface WakaTimeLanguage {
  name: string;
  percent: number;
  totalSeconds: number;
  hours: number;
}

export interface WakaTimeStats {
  totalSeconds: number;
  totalHours: number;
  humanReadableTotal: string;
  languages: WakaTimeLanguage[];
  lastUpdated: string;
}

const WAKATIME_API_BASE = 'https://wakatime.com/api/v1';
const CACHE_DURATION_MS = 24 * 60 * 60 * 1000; // 24 hours
const REQUEST_TIMEOUT_MS = 15000;

interface CacheEntry {
  data: WakaTimeStats;
  timestamp: number;
}

const cache = new Map<string, CacheEntry>();

interface WakaTimeApiLanguage {
  name: string;
  total_seconds: number;
  percent: number;
}

interface WakaTimeApiResponse {
  data: {
    total_seconds: number;
    human_readable_total: string;
    languages: WakaTimeApiLanguage[];
  };
}

export async function getWakaTimeStats(): Promise<WakaTimeStats | null> {
  const apiKey = process.env.WAKATIME_API_KEY;

  if (!apiKey) {
    log.debug('WAKATIME_API_KEY not set — skipping WakaTime stats');
    return null;
  }

  const cached = cache.get('wakatime-stats');
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION_MS) {
    log.debug('Returning cached WakaTime stats');
    return cached.data;
  }

  log.info('Fetching WakaTime all-time stats');

  const controller = new AbortController();
  const timeoutId = setTimeout(() => {
    controller.abort();
  }, REQUEST_TIMEOUT_MS);

  try {
    const encoded = Buffer.from(`${apiKey}:`).toString('base64');

    const response = await fetch(`${WAKATIME_API_BASE}/users/current/stats/all_time`, {
      headers: {
        Authorization: `Basic ${encoded}`,
        'User-Agent': 'zoms-portfolio-app'
      },
      signal: controller.signal
    });

    if (!response.ok) {
      throw new Error(`WakaTime API error: ${response.status} ${response.statusText}`);
    }

    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment -- WakaTime API response
    const result = await response.json();
    // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- shape validated below
    const { data } = result as WakaTimeApiResponse;

    const stats: WakaTimeStats = {
      totalSeconds: data.total_seconds,
      totalHours: Math.round(data.total_seconds / 3600),
      humanReadableTotal: data.human_readable_total,
      languages: data.languages
        .filter((l) => {
          if (SELECTED_LANGUAGES.includes(l.name)) {
            return true;
          }
          // Include "Other" category if it has significant time (>=5% or >=10 hours)
          if (l.name === 'Other') {
            const percent = (l.total_seconds / data.total_seconds) * 100;
            const hours = l.total_seconds / 3600;
            return percent >= 5 || hours >= 10;
          }
          return false;
        })
        .map((l) => ({
          name: l.name,
          percent: Math.round(l.percent),
          totalSeconds: l.total_seconds,
          hours: Math.round(l.total_seconds / 3600)
        })),
      lastUpdated: new Date().toISOString()
    };

    cache.set('wakatime-stats', { data: stats, timestamp: Date.now() });
    log.info(
      `WakaTime stats: ${stats.totalHours.toLocaleString()} hrs, top: ${stats.languages[0]?.name ?? 'none'}`
    );

    return stats;
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    log.error('Failed to fetch WakaTime stats', { error: msg });
    return null;
  } finally {
    clearTimeout(timeoutId);
  }
}
