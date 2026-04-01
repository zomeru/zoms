import React from 'react';

interface BlogContentProps {
  body: string;
}

const BlogContent: React.FC<BlogContentProps> = ({ body }) => {
  return (
    <article
      className='markdown-content prose max-w-none'
      dangerouslySetInnerHTML={{ __html: body }}
    />
  );
};

export default BlogContent;
