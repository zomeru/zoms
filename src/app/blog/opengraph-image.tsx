import { staticOgImages } from '@/configs/seo';
import { createOgImage, ogImageSize } from '@/lib/ogImage';

export const alt = 'Blog index Open Graph image';
export const size = ogImageSize;
export const contentType = 'image/png';

export default function OpenGraphImage() {
  return createOgImage({
    ...staticOgImages.blog,
    footerKey: 'site',
    footerValue: staticOgImages.blog.footerLabel
  });
}
