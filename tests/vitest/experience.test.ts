import { beforeEach, describe, expect, it, vi } from 'vitest';

const fetch = vi.fn();

vi.mock('@/lib/sanity', () => ({
  getSanityClient: () => ({
    fetch
  })
}));

describe('experience source loading', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('merges fallback experience entries when Sanity returns only a partial list', async () => {
    fetch.mockResolvedValueOnce([
      {
        company: 'Seansoft Corporation',
        duties: [],
        location: 'Makati City, Philippines (Remote)',
        order: 0,
        range: 'Jan. 2024 - Present',
        title: 'Software Engineer'
      },
      {
        company: 'Evelan GmbH',
        duties: [],
        location: 'Hamburg, Germany (Remote)',
        order: 1,
        range: 'Aug. 2023 - Dec. 2023',
        title: 'Full Stack Web Developer'
      },
      {
        company: 'Beyonder Inc.',
        duties: [],
        location: 'Makati City, Philippines (Remote)',
        order: 2,
        range: 'Feb. 2022 - Aug. 2023',
        title: 'Software Engineer'
      }
    ]);

    const { getExperience } = await import('@/lib/experience');
    const results = await getExperience();

    expect(results).toHaveLength(4);
    expect(results.map((item) => item.company)).toEqual([
      'Seansoft Corporation',
      'Evelan GmbH',
      'Beyonder Inc.',
      'Gig'
    ]);
  });
});
