"use client";

import Link from "next/link";
import { Fragment, useCallback, useEffect, useRef, useState } from "react";

import BlogDeleteMenu from "@/components/blog/BlogDeleteMenu";
import { AdBanner, TechBadge } from "@/components/ui";
import { BLOG_POSTS_PAGE_SIZE } from "@/constants";
import type { BlogPostListItem } from "@/lib/blog";
import { formatDate } from "@/lib/utils";

interface BlogListClientProps {
  initialPosts: BlogPostListItem[];
  initialTotal: number;
}

const AD_SLOT = process.env.NEXT_PUBLIC_ADSENSE_SLOT_BLOG_LIST ?? "";

const BlogListClient = ({ initialPosts, initialTotal }: BlogListClientProps) => {
  const [posts, setPosts] = useState<BlogPostListItem[]>(initialPosts);
  const [offset, setOffset] = useState<number>(initialPosts.length);
  const [total, setTotal] = useState<number>(initialTotal);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const loadMoreRef = useRef<HTMLDivElement>(null);
  const isLoadingRef = useRef<boolean>(false);

  const hasMore = offset < total;

  const loadMore = useCallback(async (): Promise<void> => {
    if (isLoadingRef.current || !hasMore) return;

    isLoadingRef.current = true;
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/blog?limit=${BLOG_POSTS_PAGE_SIZE}&offset=${offset}`);

      if (!response.ok) {
        throw new Error("Failed to fetch blog posts");
      }

      const data = (await response.json()) as {
        posts: BlogPostListItem[];
        pagination: { limit: number; offset: number; total: number; hasMore: boolean };
      };

      setPosts((prevPosts) => [...prevPosts, ...data.posts]);
      setOffset((prevOffset) => prevOffset + data.posts.length);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
      isLoadingRef.current = false;
    }
  }, [hasMore, offset]);

  useEffect(() => {
    if (!hasMore || loading) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !isLoadingRef.current) {
          void loadMore();
        }
      },
      {
        rootMargin: "100px"
      }
    );

    const currentRef = loadMoreRef.current;
    if (currentRef) {
      observer.observe(currentRef);
    }

    return () => {
      if (currentRef) {
        observer.unobserve(currentRef);
      }
    };
  }, [hasMore, loading, loadMore]);

  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
      {error && (
        <div className="col-span-full rounded-lg border border-terminal-red/30 bg-terminal-red/10 p-4">
          <p className="font-mono text-sm text-terminal-red">Error: {error}</p>
        </div>
      )}

      {posts.map((post, index) => {
        const date = formatDate(post.publishedAt);
        const showAd = index === 0 || index % 12 === 0;

        return (
          <Fragment key={post._id}>
            {showAd && (
              <div className="col-span-full">
                <AdBanner slot={AD_SLOT} />
              </div>
            )}
            <article className="group flex h-full gap-3 rounded-lg border border-code-border bg-code-bg p-5 transition-all duration-300 hover:border-primary/30">
              <Link href={`/blog/${post.slug.current}`} className="block min-w-0 flex-1">
                <div className="flex flex-col gap-3">
                  <div className="flex flex-wrap items-center gap-3 font-mono text-text-muted text-xs">
                    <span>{date}</span>
                    {post.readTime && (
                      <>
                        <span className="text-text-muted">|</span>
                        <span>{post.readTime} min read</span>
                      </>
                    )}
                  </div>
                  <h2 className="font-medium text-lg text-primary transition-colors group-hover:text-primary-hover">
                    {post.title}
                  </h2>
                  <p className="line-clamp-2 text-sm text-text-secondary">{post.summary}</p>
                  {post.tags && post.tags.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {post.tags.map((tag) => (
                        <TechBadge key={tag}>{tag}</TechBadge>
                      ))}
                    </div>
                  )}
                </div>
              </Link>
              <BlogDeleteMenu
                slug={post.slug.current}
                title={post.title}
                refreshOnDelete={false}
                onDeleted={() => {
                  setPosts((currentPosts) =>
                    currentPosts.filter((candidate) => candidate.slug.current !== post.slug.current)
                  );
                  setOffset((currentOffset) => Math.max(currentOffset - 1, 0));
                  setTotal((currentTotal) => Math.max(currentTotal - 1, 0));
                }}
              />
            </article>
          </Fragment>
        );
      })}

      {hasMore && (
        <div ref={loadMoreRef} className="col-span-full flex justify-center py-8">
          {loading ? (
            <div className="flex items-center gap-2 font-mono text-sm text-text-muted">
              <span className="size-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              <span>Loading...</span>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => {
                void loadMore();
              }}
              className="rounded-lg bg-primary px-6 py-3 font-mono text-background text-sm transition-all hover:bg-primary-hover"
            >
              Load More Posts
            </button>
          )}
        </div>
      )}

      <div className="col-span-full pt-8 text-center font-mono text-sm text-text-muted">
        Showing <span className="text-terminal-blue">{posts.length}</span> of{" "}
        <span className="text-terminal-blue">{total}</span> posts
      </div>
    </div>
  );
};

export default BlogListClient;
