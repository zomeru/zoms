import { getBlogPostSeoBySlug } from '@/lib/blog';
import { createOgImage, ogImageSize } from '@/lib/ogImage';

export const alt = 'Blog post Open Graph image';
export const size = ogImageSize;
export const contentType = 'image/png';

interface BlogPostOgImageProps {
  params: Promise<{
    slug: string;
  }>;
}

export default async function BlogPostOgImage({ params }: BlogPostOgImageProps) {
  const { slug } = await params;
  const post = await getBlogPostSeoBySlug(slug);

  return createOgImage({
    eyebrow: 'Blog',
    title: post?.title ?? 'Blog Post',
    description: post?.summary ?? 'Read the latest article from Zomer Gregorio.',
    footerLabel: '',
    tags: post?.tags,
    showAuthorName: false
  });
}
