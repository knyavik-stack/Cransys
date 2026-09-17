import type { Metadata, Viewport } from 'next';
import './globals.css';
import { UserProvider } from '@/lib/auth/user-context';
import { AnalyticsProvider } from '@/components/AnalyticsProvider';
import { CookieConsentBanner } from '@/components/CookieConsentBanner';

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
      '@type': 'FAQPage',
      '@id': `${baseUrl}/#faq`,
      mainEntity: [
        {
          '@type': 'Question',
          name: 'Безопасен ли независимый аудит по 152-ФЗ РФ?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Да, на 100%. При загрузке отчета из Директа или через API передаются исключительно обезличенные статистические агрегаты: название кампании, клики, показы, расход и конверсии. Персональные данные ваших клиентов (ФИО, телефоны, email) не запрашиваются и не хранятся на серверах Cransys.',
          },
        },
        {
          '@type': 'Question',
          name: 'Сколько времени занимает проверка рекламных кампаний?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Анализ загруженного файла выгрузки занимает от 30 секунд до 2 минут. Прямое сканирование через API Яндекс.Директ выполняется в фоновом режиме за 1–2 минуты.',
          },
        },
        {
          '@type': 'Question',
          name: 'Чем Cransys отличается от стандартных рекомендаций Яндекс.Директа?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Директу выгодно увеличивать охват и расход бюджета, предлагая автотаргетинг и повышение ставок. Независимый алгоритм Cransys работает в интересах рекламодателя: находит неэффективные площадки РСЯ, нецелевой информационный трафик и мобильные аномалии, формируя четкое ТЗ на отключение сливов.',
          },
        },
        {
          '@type': 'Question',
          name: 'Как подключить рекламный кабинет Яндекс.Директ по API?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'В личном кабинете Cransys перейдите во вкладку подключения и нажмите "Авторизовать Яндекс ID". Мы запрашиваем только права на чтение статистики без возможности изменения настроек ваших кампаний.',
          },
        },
        {
          '@type': 'Question',
          name: 'Что входит в готовое ТЗ для подрядчика или директолога?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Готовый коммерческий PDF-отчет содержит список неэффективных площадок для добавления в запрещенные, список минус-фраз для поисковых кампаний, рекомендации по мобильным корректировкам и расчет сэкономленного бюджета.',
          },
        },
      ],
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
        <AnalyticsProvider />
        <CookieConsentBanner />
        <UserProvider>{children}</UserProvider>
      </body>
    </html>
  );
}
