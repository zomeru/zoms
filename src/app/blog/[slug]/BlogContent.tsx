import React from 'react';
import DOMPurify from 'dompurify';
import { JSDOM } from 'jsdom';

interface BlogContentProps {
  body: string;
}

const window = new JSDOM('').window;
const purify = DOMPurify(window);

const BlogContent: React.FC<BlogContentProps> = ({ body }) => {
  const sanitizedBody = purify.sanitize(body);

  return (
    <article
      className='prose prose-invert max-w-none markdown-content'
      dangerouslySetInnerHTML={{ __html: sanitizedBody }}
    />
  );
};

export default BlogContent;
