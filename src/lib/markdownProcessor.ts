import rehypeAutolinkHeadings from 'rehype-autolink-headings';
import rehypeSlug from 'rehype-slug';
import rehypeStringify from 'rehype-stringify';
import remarkGfm from 'remark-gfm';
import remarkParse from 'remark-parse';
import remarkRehype from 'remark-rehype';
import { unified } from 'unified';

/**
 * Process markdown to HTML using unified.js pipeline
 * This replaces the complex custom markdown parser with a modern, standards-compliant solution
 * Note: Syntax highlighting is handled in the React component layer for better performance
 */
export async function processMarkdownToHtml(markdown: string): Promise<string> {
  const processor = unified()
    .use(remarkParse) // Parse markdown to AST
    .use(remarkGfm) // GitHub-flavored markdown (tables, task lists, strikethrough)
    .use(remarkRehype) // Convert markdown AST to HTML AST
    .use(rehypeSlug) // Add IDs to headings
    .use(rehypeAutolinkHeadings, {
      behavior: 'wrap',
      properties: {
        className: ['heading-link']
      }
    }) // Add links to headings
    .use(rehypeStringify); // Convert HTML AST to string

  const result = await processor.process(markdown);
  return String(result);
}

/**
 * Synchronous version for simpler use cases
 * Use this when you need immediate processing without async overhead
 */
export function processMarkdownToHtmlSync(markdown: string): string {
  const processor = unified()
    .use(remarkParse)
    .use(remarkGfm)
    .use(remarkRehype)
    .use(rehypeSlug)
    .use(rehypeAutolinkHeadings, {
      behavior: 'wrap',
      properties: {
        className: ['heading-link']
      }
    })
    .use(rehypeStringify);

  const result = processor.processSync(markdown);
  return String(result);
}
