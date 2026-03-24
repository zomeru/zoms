import { getSanityClient } from './sanity';

export interface BlogPost {
  _id: string;
  title: string;
  slug: {
    current: string;
  };
  summary: string;
  publishedAt: string;
  modifiedAt?: string;
  body: string;
  tags?: string[];
  source?: string;
  generated?: boolean;
  readTime?: number;
}

export interface BlogPostListItem {
  _id: string;
  title: string;
  slug: {
    current: string;
  };
  summary: string;
  publishedAt: string;
  tags?: string[];
  generated?: boolean;
  readTime?: number;
}

export interface BlogPostSeo {
  _id: string;
  title: string;
  slug: {
    current: string;
  };
  summary: string;
  publishedAt: string;
  modifiedAt?: string;
  tags?: string[];
}

/**
 * Fetch blog posts with pagination
 * @param limit - Number of posts to fetch (default: 25)
 * @param offset - Number of posts to skip (default: 0)
 * @returns Array of blog posts
 */
export async function getBlogPosts(limit = 25, offset = 0): Promise<BlogPostListItem[]> {
  try {
    const posts = await getSanityClient().fetch<BlogPostListItem[]>(
      `*[_type == "blogPost"] | order(publishedAt desc) [$offset...$end] {
        _id,
        title,
        slug,
        summary,
        publishedAt,
        tags,
        generated,
        readTime
      }`,
      { offset, end: offset + limit },
      {
        // Revalidate every 60 seconds
        next: { revalidate: 60 }
      }
    );

    return posts;
  } catch (error) {
    // Log error in development
    if (process.env.NODE_ENV === 'development') {
      // eslint-disable-next-line no-console -- Allow console in development for debugging
      console.error('Error fetching blog posts from Sanity:', error);
    }
    return [];
  }
}

/**
 * Fetch a single blog post by slug
 * @param slug - The slug of the blog post
 * @returns The blog post or null if not found
 */
export async function getBlogPostBySlug(slug: string): Promise<BlogPost | null> {
  try {
    const post = await getSanityClient().fetch<BlogPost | null>(
      `*[_type == "blogPost" && slug.current == $slug][0] {
        _id,
        title,
        slug,
        summary,
        publishedAt,
        modifiedAt,
        body,
        tags,
        source,
        generated,
        readTime
      }`,
      { slug },
      {
        // Revalidate every 60 seconds
        next: { revalidate: 60 }
      }
    );

    return post;
  } catch (error) {
    // Log error in development
    if (process.env.NODE_ENV === 'development') {
      // eslint-disable-next-line no-console -- Allow console in development for debugging
      console.error('Error fetching blog post from Sanity:', error);
    }
    return null;
  }
}

/**
 * Fetch a single blog post with only the fields needed for metadata and OG image generation.
 * @param slug - The slug of the blog post
 * @returns Lightweight blog post metadata or null if not found
 */
export async function getBlogPostSeoBySlug(slug: string): Promise<BlogPostSeo | null> {
  try {
    const post = await getSanityClient().fetch<BlogPostSeo | null>(
      `*[_type == "blogPost" && slug.current == $slug][0] {
        _id,
        title,
        slug,
        summary,
        publishedAt,
        modifiedAt,
        tags
      }`,
      { slug },
      {
        next: { revalidate: 60 }
      }
    );

    return post;
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      // eslint-disable-next-line no-console -- Allow console in development for debugging
      console.error('Error fetching blog post SEO data from Sanity:', error);
    }
    return null;
  }
}

/**
 * Fetch blog posts in a deterministic published-date order.
 */
async function getBoundaryBlogPosts(
  limit = 1,
  direction: 'asc' | 'desc' = 'desc'
): Promise<BlogPostListItem[]> {
  try {
    return await getSanityClient().fetch<BlogPostListItem[]>(
      `*[_type == "blogPost"] | order(publishedAt ${direction}) [0...$limit] {
        _id,
        title,
        slug,
        summary,
        publishedAt,
        tags,
        generated,
        readTime
      }`,
      { limit },
      {
        next: { revalidate: 60 }
      }
    );
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      // eslint-disable-next-line no-console -- Allow console in development for debugging
      console.error('Error fetching boundary blog posts from Sanity:', error);
    }
    return [];
  }
}

/**
 * Get the latest blog posts for the home page
 * @param limit - Number of posts to fetch (default: 3)
 * @returns Array of blog posts
 */
export async function getLatestBlogPosts(limit = 3): Promise<BlogPostListItem[]> {
  return await getBoundaryBlogPosts(limit, 'desc');
}

export async function getOldestBlogPosts(limit = 1): Promise<BlogPostListItem[]> {
  return await getBoundaryBlogPosts(limit, 'asc');
}

export interface BlogPostSitemapItem {
  slug: string;
  publishedAt: string;
  modifiedAt?: string;
}

/**
 * Fetch all published blog post slugs and dates for sitemap generation.
 * Intentionally minimal — only requests fields needed by the sitemap.
 */
export async function getBlogPostsForSitemap(): Promise<BlogPostSitemapItem[]> {
  try {
    const posts = await getSanityClient().fetch<BlogPostSitemapItem[]>(
      `*[_type == "blogPost"] | order(publishedAt desc) {
        "slug": slug.current,
        publishedAt,
        modifiedAt
      }`,
      {},
      { next: { revalidate: 3600 } }
    );

    return posts;
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      // eslint-disable-next-line no-console -- Allow console in development for debugging
      console.error('Error fetching blog posts for sitemap:', error);
    }
    return [];
  }
}

/**
 * Get total count of blog posts
 * @returns Total number of blog posts
 */
export async function getBlogPostCount(): Promise<number> {
  try {
    const count = await getSanityClient().fetch<number>(
      `count(*[_type == "blogPost"])`,
      {},
      {
        // Revalidate every 60 seconds
        next: { revalidate: 60 }
      }
    );

    return count;
  } catch (error) {
    // Log error in development
    if (process.env.NODE_ENV === 'development') {
      // eslint-disable-next-line no-console -- Allow console in development for debugging
      console.error('Error fetching blog post count from Sanity:', error);
    }
    return 0;
  }
}
