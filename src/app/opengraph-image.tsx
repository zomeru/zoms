import { staticOgImages } from '@/configs/seo';
import { createOgImage, ogImageSize } from '@/lib/ogImage';

export const alt = 'Portfolio Open Graph image';
export const size = ogImageSize;
export const contentType = 'image/png';

export default function OpenGraphImage() {
  return createOgImage({
    ...staticOgImages.home,
    footerKey: 'site',
    footerValue: staticOgImages.home.footerLabel
  });
}
