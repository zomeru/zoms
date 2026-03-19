import React from 'react';
import Link from 'next/link';

import { TechBadge, TerminalCard } from '@/components/ui';
import { MAX_PORTFOLIO_BLOG_POSTS } from '@/constants';
import { getLatestBlogPosts } from '@/lib/blog';
import { formatDate } from '@/lib/utils';

const Blog: React.FC = async (): Promise<React.JSX.Element> => {
  const posts = await getLatestBlogPosts(MAX_PORTFOLIO_BLOG_POSTS);

  return (
    <section id='blog' className='py-20'>
      <h2 className='section-title'>Blog</h2>

      {posts.length === 0 ? (
        <TerminalCard title='no-posts.ts' className='text-muted'>
          <span className='text-terminal-yellow'>console</span>
          <span className='text-text-secondary'>.log(</span>
          <span className='text-terminal-purple'>"No posts yet. Check back soon!"</span>
          <span className='text-text-secondary'>)</span>
        </TerminalCard>
      ) : (
        <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
          {posts.map(({ _id, title, slug, summary, publishedAt, tags }) => {
            const date = formatDate(publishedAt);

            return (
              <Link key={_id} href={`/blog/${slug.current}`} className='block h-full'>
                <TerminalCard
                  title={`${slug.current}.md`}
                  showHeader={true}
                  className='hover:border-primary/30 transition-colors cursor-pointer group h-full'
                >
                  <div className='flex flex-col gap-2'>
                    <div className='flex items-center gap-3 text-xs text-muted font-mono'>
                      <span>{date}</span>
                    </div>
                    <h3 className='font-medium text-primary group-hover:text-primary-hover transition-colors'>
                      {title}
                    </h3>
                    <p className='text-text-secondary text-sm line-clamp-2'>{summary}</p>
                    {tags && tags.length > 0 && (
                      <div className='flex flex-wrap gap-2 mt-2'>
                        {tags.slice(0, 3).map((tag) => (
                          <TechBadge key={tag}>{tag}</TechBadge>
                        ))}
                      </div>
                    )}
                  </div>
                </TerminalCard>
              </Link>
            );
          })}
        </div>
      )}

      <div className='mt-8'>
        <Link
          href='/blog'
          className='inline-flex items-center gap-2 text-primary hover:underline font-mono text-sm'
        >
          <span className='text-terminal-green'>cd</span>
          <span className='text-text-secondary'>..</span>
          <span className='text-terminal-blue'>→</span>
          <span>/blog</span>
        </Link>
      </div>
    </section>
  );
};

export default Blog;
