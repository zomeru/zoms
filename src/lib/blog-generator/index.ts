import log from '../logger';
import { geminiGenerateBlogContent, type GeneratedBlogPost } from './gemini-generator';
import { openrouterGenerateBlogContent } from './openrouter-generator';

export async function generateBlogContent(): Promise<GeneratedBlogPost> {
  const provider = process.env.BLOG_GENERATION_PROVIDER ?? 'gemini';

  log.info('Starting blog content generation with provider', { provider });

  if (provider === 'openrouter') {
    return await openrouterGenerateBlogContent();
  }

  return await geminiGenerateBlogContent();
}
