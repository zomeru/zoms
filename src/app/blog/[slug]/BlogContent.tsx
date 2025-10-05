import React from 'react';
import {
  PortableText,
  type PortableTextComponents,
  type PortableTextMarkComponentProps
} from '@portabletext/react';
import type { PortableTextBlock } from '@portabletext/types';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';

interface LinkValue {
  _type: string;
  href?: string;
}

interface CodeBlock {
  _type: 'code';
  language?: string;
  code: string;
  filename?: string;
}

const blogPortableTextComponents: PortableTextComponents = {
  marks: {
    link: ({ value, children }: PortableTextMarkComponentProps<LinkValue>) => {
      const href = value?.href;
      return (
        <a
          href={href}
          target='_blank'
          rel='noopener noreferrer'
          className='text-primary hover:underline transition-colors'
        >
          {children}
        </a>
      );
    },
    strong: ({ children }) => (
      <strong className='font-semibold text-textPrimary'>{children}</strong>
    ),
    em: ({ children }) => <em className='italic'>{children}</em>,
    code: ({ children }) => (
      <code className='px-1.5 py-0.5 rounded bg-primary bg-opacity-10 text-primary font-mono text-sm'>
        {children}
      </code>
    )
  },
  block: {
    normal: ({ children }) => <p className='mb-4 text-textSecondary leading-relaxed'>{children}</p>,
    h1: ({ children }) => (
      <h1 className='text-3xl md:text-4xl font-bold mb-4 mt-8 text-textPrimary'>{children}</h1>
    ),
    h2: ({ children }) => (
      <h2 className='text-2xl md:text-3xl font-bold mb-4 mt-8 text-textPrimary'>{children}</h2>
    ),
    h3: ({ children }) => (
      <h3 className='text-xl md:text-2xl font-bold mb-3 mt-6 text-textPrimary'>{children}</h3>
    ),
    h4: ({ children }) => (
      <h4 className='text-lg md:text-xl font-bold mb-3 mt-6 text-textPrimary'>{children}</h4>
    ),
    blockquote: ({ children }) => (
      <blockquote className='border-l-4 border-primary pl-4 italic my-6 text-textSecondary'>
        {children}
      </blockquote>
    )
  },
  list: {
    bullet: ({ children }) => <ul className='list-disc list-inside mb-4 space-y-2'>{children}</ul>,
    number: ({ children }) => (
      <ol className='list-decimal list-inside mb-4 space-y-2'>{children}</ol>
    )
  },
  listItem: {
    bullet: ({ children }) => <li className='text-textSecondary ml-4'>{children}</li>,
    number: ({ children }) => <li className='text-textSecondary ml-4'>{children}</li>
  },
  types: {
    code: ({ value }: { value: CodeBlock }) => {
      const { language = 'javascript', code, filename } = value;
      return (
        <div className='my-6 rounded-lg overflow-hidden border border-textSecondary border-opacity-20'>
          {filename && (
            <div className='bg-backgroundSecondary px-4 py-2 text-sm text-textSecondary border-b border-textSecondary border-opacity-20'>
              {filename}
            </div>
          )}
          <SyntaxHighlighter
            language={language}
            style={vscDarkPlus}
            customStyle={{
              margin: 0,
              padding: '1rem',
              background: '#1a1a1a',
              fontSize: '0.875rem'
            }}
            showLineNumbers
          >
            {code}
          </SyntaxHighlighter>
        </div>
      );
    }
  }
};

interface BlogContentProps {
  body: PortableTextBlock[];
}

const BlogContent: React.FC<BlogContentProps> = ({ body }) => {
  return (
    <article className='prose prose-invert max-w-none'>
      <PortableText value={body} components={blogPortableTextComponents} />
    </article>
  );
};

export default BlogContent;
