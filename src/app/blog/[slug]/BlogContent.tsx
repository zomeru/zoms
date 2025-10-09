import React from 'react';
import ReactMarkdown from 'react-markdown';
import rehypeAutolinkHeadings from 'rehype-autolink-headings';
import rehypeExternalLinks from 'rehype-external-links';
import rehypePrettyCode from 'rehype-pretty-code';
import rehypeSlug from 'rehype-slug';
import remarkBreaks from 'remark-breaks';
import remarkGfm from 'remark-gfm';

interface BlogContentProps {
  body: string;
}

const BlogContent: React.FC<BlogContentProps> = ({ body }) => {
  return (
    <article className='prose prose-invert max-w-none'>
      <ReactMarkdown
        remarkPlugins={[
          remarkGfm, // GitHub-flavored markdown (tables, task lists, strikethrough)
          remarkBreaks // Convert line breaks to <br>
        ]}
        rehypePlugins={[
          rehypeSlug, // Add IDs to headings
          [
            rehypeAutolinkHeadings,
            {
              behavior: 'wrap',
              properties: {
                className: ['heading-link']
              }
            }
          ], // Add links to headings
          [
            rehypePrettyCode,
            {
              theme: 'github-dark',
              keepBackground: true,
              defaultLang: 'plaintext'
            }
          ], // Syntax highlighting with shiki
          [
            rehypeExternalLinks,
            {
              target: '_blank',
              rel: ['noopener', 'noreferrer']
            }
          ] // Add target and rel to external links
        ]}
      >
        {body}
      </ReactMarkdown>
    </article>
  );
};

export default BlogContent;
