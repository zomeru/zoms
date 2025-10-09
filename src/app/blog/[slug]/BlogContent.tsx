import React from 'react';
import DOMPurify from 'dompurify';
import { JSDOM } from 'jsdom';

interface BlogContentProps {
  body: string;
}

// Singleton pattern for DOMPurify
let purifySingleton: ReturnType<typeof DOMPurify> | null = null;
function getPurify() {
  if (!purifySingleton) {
    const window = new JSDOM('').window;
    purifySingleton = DOMPurify(window);
  }
  return purifySingleton;
}

const BlogContent: React.FC<BlogContentProps> = ({ body }) => {
  const purify = getPurify();
  const sanitizedBody = purify.sanitize(body);

  return (
    <article
      className='prose prose-invert max-w-none markdown-content'
      dangerouslySetInnerHTML={{ __html: sanitizedBody }}
    />
  );
};

export default BlogContent;
