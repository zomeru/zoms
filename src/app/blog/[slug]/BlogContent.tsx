import React from 'react';
import DOMPurify from 'dompurify';

interface BlogContentProps {
  body: string;
}

const BlogContent: React.FC<BlogContentProps> = ({ body }) => {
  const sanitizedBody = DOMPurify.sanitize(body);

  return (
    <article
      className='prose prose-invert max-w-none markdown-content'
      dangerouslySetInnerHTML={{ __html: sanitizedBody }}
    />
  );
};

export default BlogContent;
