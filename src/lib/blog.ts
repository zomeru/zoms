import { client } from './sanity';

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

/**
 * Fetch blog posts with pagination
 * @param limit - Number of posts to fetch (default: 25)
 * @param offset - Number of posts to skip (default: 0)
 * @returns Array of blog posts
 */
export async function getBlogPosts(limit = 25, offset = 0): Promise<BlogPostListItem[]> {
  try {
    const posts = await client.fetch<BlogPostListItem[]>(
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
    const post = await client.fetch<BlogPost | null>(
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
 * Get the latest blog posts for the home page
 * @param limit - Number of posts to fetch (default: 3)
 * @returns Array of blog posts
 */
export async function getLatestBlogPosts(limit = 3): Promise<BlogPostListItem[]> {
  return await getBlogPosts(limit, 0);
}

/**
 * Get total count of blog posts
 * @returns Total number of blog posts
 */
export async function getBlogPostCount(): Promise<number> {
  try {
    const count = await client.fetch<number>(
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
