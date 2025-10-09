import React from 'react';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { coldarkDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import remarkGfm from 'remark-gfm';

interface BlogContentProps {
  body: string;
}

const BlogContent: React.FC<BlogContentProps> = ({ body }) => {
  return (
    <article className='prose prose-invert max-w-none markdown-content'>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          // Headings with auto-linking
          h1: ({ children, ...props }) => (
            <h1 className='text-3xl md:text-4xl font-bold mb-4 mt-8 text-textPrimary' {...props}>
              {children}
            </h1>
          ),
          h2: ({ children, ...props }) => (
            <h2 className='text-2xl md:text-3xl font-bold mb-4 mt-8 text-textPrimary' {...props}>
              {children}
            </h2>
          ),
          h3: ({ children, ...props }) => (
            <h3 className='text-xl md:text-2xl font-bold mb-3 mt-6 text-textPrimary' {...props}>
              {children}
            </h3>
          ),
          h4: ({ children, ...props }) => (
            <h4 className='text-lg md:text-xl font-bold mb-3 mt-6 text-textPrimary' {...props}>
              {children}
            </h4>
          ),
          // Paragraphs
          p: ({ children, ...props }) => (
            <p className='mb-4 text-textSecondary leading-relaxed' {...props}>
              {children}
            </p>
          ),
          // Links
          a: ({ href, children, ...props }) => (
            <a
              href={href}
              target='_blank'
              rel='noopener noreferrer'
              className='text-textPrimary hover:underline transition-all duration-200'
              {...props}
            >
              {children}
            </a>
          ),
          // Inline code
          // eslint-disable-next-line @typescript-eslint/no-explicit-any -- react-markdown types are complex
          code: ({ className, children, ...props }: any) => {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-argument -- className may be undefined
            const match = /language-(\w+)/.exec(className ?? '');
            const language = match ? match[1] : '';
            const isInline = !className;

            if (!isInline && language) {
              return (
                <div className='my-6 rounded-lg overflow-hidden border border-textSecondary border-opacity-20'>
                  <SyntaxHighlighter
                    language={language}
                    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-type-assertion -- Style type mismatch
                    style={coldarkDark as any}
                    customStyle={{
                      margin: 0,
                      padding: '1rem',
                      background: '#1a1a1a',
                      fontSize: '0.875rem'
                    }}
                    showLineNumbers
                    {...props}
                  >
                    {String(children).replace(/\n$/, '')}
                  </SyntaxHighlighter>
                </div>
              );
            }

            return (
              <code
                className='px-1.5 py-0.5 rounded bg-[#ad5aff1f] text-textSecondary font-mono text-sm'
                {...props}
              >
                {children}
              </code>
            );
          },
          // Blockquotes
          blockquote: ({ children, ...props }) => (
            <blockquote
              className='border-l-4 border-primary pl-4 italic my-6 text-textSecondary'
              {...props}
            >
              {children}
            </blockquote>
          ),
          // Lists
          ul: ({ children, ...props }) => (
            <ul className='list-disc list-outside mb-4 space-y-2 pl-6' {...props}>
              {children}
            </ul>
          ),
          ol: ({ children, ...props }) => (
            <ol className='list-decimal list-outside mb-4 space-y-2 pl-6' {...props}>
              {children}
            </ol>
          ),
          li: ({ children, ...props }) => (
            <li className='text-textSecondary' {...props}>
              {children}
            </li>
          ),
          // Strong and emphasis
          strong: ({ children, ...props }) => (
            <strong className='font-semibold text-textPrimary' {...props}>
              {children}
            </strong>
          ),
          em: ({ children, ...props }) => (
            <em className='italic' {...props}>
              {children}
            </em>
          ),
          // Tables (GFM)
          table: ({ children, ...props }) => (
            <div className='my-6 overflow-x-auto'>
              <table className='min-w-full border-collapse' {...props}>
                {children}
              </table>
            </div>
          ),
          thead: ({ children, ...props }) => (
            <thead className='bg-backgroundSecondary' {...props}>
              {children}
            </thead>
          ),
          tbody: ({ children, ...props }) => <tbody {...props}>{children}</tbody>,
          tr: ({ children, ...props }) => (
            <tr className='border-b border-textSecondary border-opacity-20' {...props}>
              {children}
            </tr>
          ),
          th: ({ children, ...props }) => (
            <th className='px-4 py-2 text-left text-sm font-semibold text-textPrimary' {...props}>
              {children}
            </th>
          ),
          td: ({ children, ...props }) => (
            <td className='px-4 py-2 text-sm text-textSecondary' {...props}>
              {children}
            </td>
          )
        }}
      >
        {body}
      </ReactMarkdown>
    </article>
  );
};

export default BlogContent;
