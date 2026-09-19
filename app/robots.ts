import { MetadataRoute } from 'next';
import { getSiteSettings } from '@/lib/db/site-settings-store';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://cransys.ru';
  const settings = getSiteSettings();
  const isNoIndex = settings?.seo?.robotsIndexing === 'noindex, nofollow';

  if (isNoIndex) {
    return {
      rules: [
        {
          userAgent: '*',
          disallow: '/',
        },
      ],
      sitemap: `${baseUrl}/sitemap.xml`,
      host: baseUrl,
    };
  }

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
          '/legal/cookies',
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
          '/dashboard',
          '/sign-in',
          '/sign-up',
          '/forgot-password',
          '/legal/*',
        ],
        disallow: [
          '/admin',
          '/admin/*',
          '/api/*',
          '/_next/*',
        ],
      },
      {
        userAgent: 'Googlebot',
        allow: [
          '/',
          '/dashboard',
          '/sign-in',
          '/sign-up',
          '/forgot-password',
          '/legal/*',
        ],
        disallow: [
          '/admin',
          '/admin/*',
          '/api/*',
          '/_next/*',
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
    host: baseUrl,
  };
}
