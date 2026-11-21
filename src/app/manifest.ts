import { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'VerseFinder - Bible Verse Identifier',
    short_name: 'VerseFinder',
    description: 'Discover Bible verses through voice recognition - like Shazam for scripture.',
    start_url: '/',
    display: 'standalone',
    background_color: '#0B1120',
    theme_color: '#3b82f6',
    orientation: 'portrait',
    icons: [
      {
        src: '/icon.svg',
        sizes: 'any',
        type: 'image/svg+xml',
      },
    ],
  };
}

