import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://cransys.ru';

  return {
    rules: [
      {
        userAgent: '*',
        allow: [
          '/',
          '/dashboard',
          '/sign-in',
          '/sign-up',
          '/forgot-password',
          '/legal/privacy',
          '/legal/terms',
          '/legal/consent',
        ],
        disallow: [
          '/admin',
          '/admin/*',
          '/api/*',
          '/_next/*',
        ],
      },
      {
        userAgent: 'Yandex',
        allow: [
          '/',
          '/legal/*',
        ],
        disallow: [
          '/admin',
          '/api/*',
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
    host: baseUrl,
  };
}
