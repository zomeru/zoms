import type { MetadataRoute } from 'next';

import { description } from '@/configs';
import { TITLE } from '@/constants';

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: '/',
    name: TITLE,
    short_name: 'zoms',
    description,
    icons: [
      {
        src: '/icon-192.png',
        sizes: '192x192',
        type: 'image/png'
      },
      {
        src: '/icon-512.png',
        sizes: '512x512',
        type: 'image/png'
      },
      {
        src: '/icon-maskable-192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'maskable'
      },
      {
        src: '/icon-maskable-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable'
      }
    ],
    screenshots: [
      {
        src: '/screenshots/home-desktop.png',
        sizes: '1440x900',
        type: 'image/png',
        form_factor: 'wide',
        label: 'Home page on desktop'
      },
      {
        src: '/screenshots/home-mobile.png',
        sizes: '390x844',
        type: 'image/png',
        form_factor: 'narrow',
        label: 'Home page on mobile'
      }
    ],
    theme_color: '#3b82f6',
    background_color: '#0a0a0f',
    display: 'standalone',
    orientation: 'portrait',
    start_url: '/'
  };
}
