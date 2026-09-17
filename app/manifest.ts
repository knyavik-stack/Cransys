import { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Cransys — Автоматизированный аудит Яндекс.Директ',
    short_name: 'Cransys',
    description: 'Независимый автоматизированный аудит рекламных кампаний в Яндекс.Директ. Поиск скрытых сливов бюджета.',
    start_url: '/',
    display: 'standalone',
    background_color: '#f8fafc',
    theme_color: '#003882',
    icons: [
      {
        src: '/favicon.svg',
        sizes: 'any',
        type: 'image/svg+xml',
      },
      {
        src: '/icon.svg',
        sizes: '512x512',
        type: 'image/svg+xml',
      },
    ],
  };
}
