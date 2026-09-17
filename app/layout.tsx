import type { Metadata, Viewport } from 'next';
import './globals.css';
import { UserProvider } from '@/lib/auth/user-context';

const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://cransys.ru';

export const viewport: Viewport = {
  themeColor: '#003882',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
};

export const metadata: Metadata = {
  metadataBase: new URL(baseUrl),
  title: {
    default: 'Cransys — Автоматизированный аудит Яндекс.Директ',
    template: '%s | Cransys Analytics',
  },
  description:
    'Независимый автоматизированный аудит рекламных кампаний Яндекс.Директ. Поиск скрытых сливов бюджета в РСЯ, нецелевых запросов и мобильных аномалий за 2 минуты.',
  applicationName: 'Cransys Analytics',
  authors: [{ name: 'Cransys Direct Engineering Team', url: baseUrl }],
  creator: 'Cransys Analytics',
  publisher: 'Cransys Analytics',
  keywords: [
    'аудит яндекс директ',
    'проверка рекламы яндекс директ',
    'слив бюджета рся',
    'минус слова директ',
    'анализ поисковых запросов яндекс',
    'аудит контекстной рекламы онлайн',
    'оптимизация директ 2026',
    'cransys',
    '152-фз аудит директ',
  ],
  alternates: {
    canonical: '/',
  },
  icons: {
    icon: [
      { url: '/favicon.svg', type: 'image/svg+xml' },
      { url: '/icon.svg', type: 'image/svg+xml' },
    ],
    apple: [
      { url: '/favicon.svg', sizes: '180x180', type: 'image/svg+xml' },
    ],
    shortcut: ['/favicon.svg'],
  },
  manifest: '/manifest.webmanifest',
  openGraph: {
    title: 'Cransys — Автоматизированный аудит Яндекс.Директ',
    description:
      'Независимый аудит рекламных кампаний в Яндекс.Директ: выявление сливов в РСЯ, нецелевых фраз и мобильных аномалий за 2 минуты.',
    url: baseUrl,
    siteName: 'Cransys Analytics',
    locale: 'ru_RU',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Cransys — Автоматизированный аудит Яндекс.Директ',
    description:
      'Независимый аудит рекламных кампаний в Яндекс.Директ: выявление сливов в РСЯ, нецелевых фраз и мобильных аномалий за 2 минуты.',
    creator: '@cransys',
  },
  robots: {
    index: true,
    follow: true,
    nocache: false,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'Organization',
      '@id': `${baseUrl}/#organization`,
      name: 'Cransys Analytics',
      url: baseUrl,
      logo: `${baseUrl}/favicon.svg`,
      email: 'cransys@yandex.ru',
      description: 'Сервис независимого автоматизированного аудита и анализа контекстной рекламы Яндекс.Директ',
    },
    {
      '@type': 'WebApplication',
      '@id': `${baseUrl}/#webapp`,
      name: 'Cransys — Аудит Яндекс.Директ',
      url: baseUrl,
      applicationCategory: 'BusinessApplication',
      operatingSystem: 'All',
      inLanguage: 'ru-RU',
      description: 'Автоматизированный поиск неэффективных площадок РСЯ, нецелевых поисковых запросов и аномалий в Яндекс.Директ',
      offers: {
        '@type': 'AggregateOffer',
        priceCurrency: 'RUB',
        lowPrice: '0',
        highPrice: '14900',
        offerCount: '5',
      },
      publisher: {
        '@id': `${baseUrl}/#organization`,
      },
    },
    {
      '@type': 'BreadcrumbList',
      itemListElement: [
        {
          '@type': 'ListItem',
          position: 1,
          name: 'Главная',
          item: baseUrl,
        },
        {
          '@type': 'ListItem',
          position: 2,
          name: 'Личный кабинет',
          item: `${baseUrl}/dashboard`,
        },
      ],
    },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body
        suppressHydrationWarning
        className="bg-slate-50 text-slate-900 antialiased selection:bg-blue-100 selection:text-blue-900"
      >
        <UserProvider>{children}</UserProvider>
      </body>
    </html>
  );
}
