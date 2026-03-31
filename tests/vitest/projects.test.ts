import { beforeEach, describe, expect, it, vi } from 'vitest';

const fetch = vi.fn();

vi.mock('@/lib/sanity', () => ({
  getSanityClient: () => ({
    fetch
  })
}));

describe('project source loading', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
  });

  it('returns only Sanity project entries when Sanity returns data', async () => {
    fetch.mockResolvedValueOnce([
      {
        alt: 'Sanity project screenshot',
        demoUrl: 'https://example.com/demo',
        githubUrl: 'https://example.com/repo',
        image: 'sanity-project.jpg',
        info: 'Project content from Sanity.',
        name: 'Sanity Project',
        order: 0,
        techs: ['Next.js', 'Sanity']
      }
    ]);

    const { getProjects } = await import('@/lib/projects');
    const results = await getProjects();

    expect(results).toHaveLength(1);
    expect(results[0]).toMatchObject({
      info: 'Project content from Sanity.',
      name: 'Sanity Project'
    });
  });

  it('returns fallback project entries when Sanity returns no rows', async () => {
    fetch.mockResolvedValueOnce([]);

    const { getProjects } = await import('@/lib/projects');
    const results = await getProjects();

    expect(results.length).toBeGreaterThan(1);
    expect(results[0]?.name).toBe('Rezumer AI');
    expect(results[0]?.order).toBeGreaterThan(results[1]?.order ?? -1);
  });

  it('returns fallback project entries when the Sanity fetch fails', async () => {
    fetch.mockRejectedValueOnce(new Error('Sanity unavailable'));

    const { getProjects } = await import('@/lib/projects');
    const results = await getProjects();

    expect(results.length).toBeGreaterThan(1);
    expect(results.some((item) => item.name === 'Zomink')).toBe(true);
  });
});
