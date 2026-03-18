import { transformerCopyButton } from '@rehype-pretty/transformers';
import rehypeExternalLinks from 'rehype-external-links';
import rehypePrettyCode from 'rehype-pretty-code';
import rehypeRaw from 'rehype-raw';
import rehypeSanitize from 'rehype-sanitize';
import rehypeSlug from 'rehype-slug';
import rehypeStringify from 'rehype-stringify';
import remarkBreaks from 'remark-breaks';
import remarkGfm from 'remark-gfm';
import remarkParse from 'remark-parse';
import remarkRehype from 'remark-rehype';
import { unified } from 'unified';

const processor = unified()
  .use(remarkParse)
  .use(remarkGfm)
  .use(remarkBreaks)
  .use(remarkRehype, { allowDangerousHtml: true })
  .use(rehypeRaw)
  .use(rehypeSanitize)
  .use(rehypeSlug)
  .use(rehypePrettyCode, {
    theme: 'github-dark-dimmed',
    bypassInlineCode: true,
    keepBackground: false,
    // keepBackground: true,
    // defaultLang: 'plaintext',
    transformers: [
      transformerCopyButton({
        visibility: 'always',
        feedbackDuration: 3_000
      })
    ]
  })
  .use(rehypeExternalLinks, {
    target: '_blank',
    rel: ['noopener', 'noreferrer']
  })
  .use(rehypeStringify)
  .freeze();

export async function processMarkdown(markdown: string) {
  const file = await processor.process(markdown);
  return String(file);
}
