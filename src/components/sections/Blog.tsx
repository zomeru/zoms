import Link from 'next/link';
import type React from 'react';

import BlogDeleteMenu from '@/components/blog/BlogDeleteMenu';
import { TechBadge, TerminalCard } from '@/components/ui';
import { MAX_PORTFOLIO_BLOG_POSTS } from '@/constants';
import { getLatestBlogPosts } from '@/lib/blog';
import { formatDate } from '@/lib/utils';

const Blog: React.FC = async (): Promise<React.JSX.Element> => {
  const posts = await getLatestBlogPosts(MAX_PORTFOLIO_BLOG_POSTS);

  return (
    <section id="blog" className="py-20">
      <h2 className="section-title">Blog</h2>

      {posts.length === 0 ? (
        <TerminalCard title="no-posts.ts" className="text-text-muted">
          <span className="text-terminal-yellow">console</span>
          <span className="text-text-secondary">.log(</span>
          <span className="text-terminal-purple">"No posts yet. Check back soon!"</span>
          <span className="text-text-secondary">)</span>
        </TerminalCard>
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {posts.map(({ _id, title, slug, summary, publishedAt, tags }) => {
            const date = formatDate(publishedAt);

            return (
              <TerminalCard
                key={_id}
                title={`${slug.current}.md`}
                showHeader={true}
                className="group h-full transition-colors hover:border-primary/30"
              >
                <div className="flex h-full gap-3">
                  <Link href={`/blog/${slug.current}`} className="block min-w-0 flex-1">
                    <div className="flex flex-col gap-2">
                      <div className="flex items-center gap-3 font-mono text-text-muted text-xs">
                        <span>{date}</span>
                      </div>
                      <h3 className="font-medium text-primary transition-colors group-hover:text-primary-hover">
                        {title}
                      </h3>
                      <p className="line-clamp-2 text-sm text-text-secondary">{summary}</p>
                      {tags && tags.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-2">
                          {tags.slice(0, 3).map((tag) => (
                            <TechBadge key={tag}>{tag}</TechBadge>
                          ))}
                        </div>
                      )}
                    </div>
                  </Link>
                  <BlogDeleteMenu slug={slug.current} title={title} />
                </div>
              </TerminalCard>
            );
          })}
        </div>
      )}

      <div className="mt-8">
        <Link
          href="/blog"
          className="inline-flex items-center gap-2 font-mono text-primary text-sm hover:underline"
        >
          <span className="text-terminal-green">cd</span>
          <span className="text-text-secondary">..</span>
          <span className="text-terminal-blue">→</span>
          <span>/blog</span>
        </Link>
      </div>
    </section>
  );
};

export default Blog;
