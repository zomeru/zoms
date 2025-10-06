import React from 'react';
import Link from 'next/link';

import { MAX_PORTFOLIO_BLOG_POSTS } from '@/constants';
import { getLatestBlogPosts } from '@/lib/blog';
import { formatDate } from '@/lib/utils';

const Blog = async (): Promise<React.JSX.Element> => {
  const posts = await getLatestBlogPosts(MAX_PORTFOLIO_BLOG_POSTS);

  return (
    <section id='blog' className='mb-24 sm:mb-32'>
      <h2 className='section-title'>Blog</h2>
      {posts.length === 0 ? (
        <p className='text-textSecondary text-sm mb-10'>No blog posts yet. Check back soon!</p>
      ) : (
        <ol className='group/list space-y-6 mb-10'>
          {posts.map(({ _id, title, slug, summary, publishedAt, generated }) => {
            const date = formatDate(publishedAt);

            return (
              <li
                key={_id}
                className='group lg:group-hover/list:opacity-50 lg:hover:!opacity-100 transition-all duration-300 ease-in-out hover:after:bg-[#ad5aff0a] after:content-[""] relative after:absolute after:w-full after:h-full after:top-0 after:left-0 after:transform after:scale-105 after:rounded-lg after:transition-colors after:duration-300 after:ease-in-out after:drop-shadow-md hover:after:shadow-[inset_0_1px_0_0_rgba(148,163,184,0.1)] after:pointer-events-none'
              >
                <div className='grid grid-cols-8'>
                  <div className='col-span-8 sm:col-span-2 text-textSecondary text-sm mb-1 sm:mb-0'>
                    {date}
                  </div>
                  <div className='ml-0 sm:ml-4 col-span-8 sm:col-span-6'>
                    <Link
                      href={`/blog/${slug.current}`}
                      className='group-hover:text-primary hover:text-primary transition-colors relative z-10 hover:underline'
                    >
                      <h3 className='text-base transition-colors font-medium'>{title}</h3>
                    </Link>
                    <p className='text-sm text-textSecondary mt-2'>{summary}</p>
                  </div>
                </div>
              </li>
            );
          })}
        </ol>
      )}
      <Link href='/blog' className='link-primary'>
        Go to blog page
      </Link>
    </section>
  );
};

export default Blog;
