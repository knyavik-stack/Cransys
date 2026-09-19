import type { Metadata, Viewport } from 'next';
import './globals.css';
import { UserProvider } from '@/lib/auth/user-context';
import { AnalyticsProvider } from '@/components/AnalyticsProvider';
import { CookieConsentBanner } from '@/components/CookieConsentBanner';
import { MobileBottomNav } from '@/components/MobileBottomNav';
import { fetchSiteSettingsAsync } from '@/lib/db/site-settings-store';

const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://cransys.ru';

export const viewport: Viewport = {
  themeColor: '#003882',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
};

export async function generateMetadata(): Promise<Metadata> {
  const settings = await fetchSiteSettingsAsync();

  const title =
    settings.seo?.mainTitle ||
    'Cransys Analytics — Аудит Яндекс Директ, реклама сайта и раскрутка';
  const description =
    settings.seo?.mainDescription ||
    'Независимый аудит рекламы Яндекс Директ и сайтов за 2 минуты. Раскрутка, SEO продвижение, поиск скрытых сливов бюджета в РСЯ, нецелевых поисковых запросов и мобильных аномалий.';

  const keywords = settings.seo?.keywords
    ? settings.seo.keywords
        .split(',')
        .map((k) => k.trim())
        .filter(Boolean)
    : [
        'яндекс директ',
        'реклама сайта',
        'раскрутка сайта',
        'seo продвижение',
        'аудит яндекс директ',
        'проверка рекламы яндекс директ',
        'контекстная реклама',
        'настройка яндекс директ',
        'продвижение сайта',
        'слив бюджета рся',
        'минус слова директ',
        'анализ поисковых запросов яндекс',
        'аудит контекстной рекламы онлайн',
        'оптимизация директ analytics',
        'cransys',
        '152-фз аудит директ',
      ];

  const isNoIndex = settings.seo?.robotsIndexing === 'noindex, nofollow';

  const yandexVerif = settings.webmasters?.yandexVerificationCode?.trim();
  const googleVerif = settings.webmasters?.googleVerificationCode?.trim();

  return {
    metadataBase: new URL(baseUrl),
    title: {
      default: title,
      template: '%s | Cransys Analytics',
    },
    description,
    applicationName: 'Cransys Analytics',
    authors: [{ name: 'Cransys Direct Engineering Team', url: baseUrl }],
    creator: 'Cransys Analytics',
    publisher: 'Cransys Analytics',
    keywords,
    alternates: {
      canonical: baseUrl,
      languages: {
        'ru-RU': baseUrl,
      },
    },
    icons: {
      icon: [
        { url: '/favicon.svg', type: 'image/svg+xml' },
        { url: '/icon.svg', type: 'image/svg+xml' },
      ],
      apple: [{ url: '/favicon.svg', sizes: '180x180', type: 'image/svg+xml' }],
      shortcut: ['/favicon.svg'],
    },
    manifest: '/manifest.webmanifest',
    verification: {
      yandex: yandexVerif || undefined,
      google: googleVerif || undefined,
      other: {
        ...(yandexVerif ? { 'yandex-verification': yandexVerif } : {}),
        ...(googleVerif ? { 'google-site-verification': googleVerif } : {}),
      },
    },
    openGraph: {
      title: settings.seo?.ogTitle || title,
      description: settings.seo?.ogDescription || description,
      url: baseUrl,
      siteName: 'Cransys Analytics',
      locale: 'ru_RU',
      type: 'website',
      images: [
        {
          url: settings.seo?.ogImageUrl || `${baseUrl}/opengraph-image`,
          width: 1200,
          height: 630,
          alt: 'Cransys Analytics — Аудит Яндекс Директ и раскрутка сайта',
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: settings.seo?.ogTitle || title,
      description: settings.seo?.ogDescription || description,
      creator: '@cransys',
      images: [settings.seo?.ogImageUrl || `${baseUrl}/opengraph-image`],
    },
    robots: isNoIndex
      ? {
          index: false,
          follow: false,
        }
      : {
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
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const settings = await fetchSiteSettingsAsync();

  const socialUrls = (settings.socials || [])
    .filter((s) => s.enabled && s.url)
    .map((s) => s.url);

  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Organization',
        '@id': `${baseUrl}/#organization`,
        name: settings.companyName || 'Cransys Analytics',
        url: baseUrl,
        logo: `${baseUrl}/favicon.svg`,
        email: settings.supportEmail || 'cransys@yandex.ru',
        description: 'Сервис независимого автоматизированного аудита и анализа контекстной рекламы Яндекс.Директ',
        sameAs: socialUrls.length > 0 ? socialUrls : [
          'https://t.me/cransys_official',
          'https://vk.com/cransys',
          'https://vc.ru/u/cransys',
          'https://youtube.com/@cransys'
        ],
        contactPoint: [
          {
            '@type': 'ContactPoint',
            email: settings.supportEmail || 'cransys@yandex.ru',
            contactType: 'customer support',
            areaServed: 'RU',
            availableLanguage: ['Russian'],
          },
        ],
      },
      {
        '@type': 'WebSite',
        '@id': `${baseUrl}/#website`,
        name: 'Cransys Analytics',
        url: baseUrl,
        description: 'Независимый аудит рекламных кампаний Яндекс.Директ и продвижение сайтов',
        inLanguage: 'ru-RU',
        publisher: {
          '@id': `${baseUrl}/#organization`,
        },
      },
      {
        '@type': 'WebApplication',
        '@id': `${baseUrl}/#webapp`,
        name: 'Cransys — Аудит Яндекс.Директ',
        url: baseUrl,
        applicationCategory: 'BusinessApplication',
        operatingSystem: 'All',
        browserRequirements: 'Requires JavaScript and HTML5 support',
        inLanguage: 'ru-RU',
        description:
          'Автоматизированный поиск неэффективных площадок РСЯ, нецелевых поисковых запросов и аномалий в Яндекс.Директ',
        aggregateRating: {
          '@type': 'AggregateRating',
          ratingValue: '4.9',
          ratingCount: '184',
          bestRating: '5',
          worstRating: '1',
        },
        offers: {
          '@type': 'AggregateOffer',
          priceCurrency: 'RUB',
          lowPrice: '0',
          highPrice: '24900',
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
              text: 'Готовый коммерческий PDF/XLSX отчет содержит список неэффективных площадок для добавления в запрещенные, список минус-фраз для поисковых кампаний, рекомендации по мобильным корректировкам и расчет сэкономленного бюджета.',
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
        <UserProvider>
          {children}
          <MobileBottomNav />
        </UserProvider>
      </body>
    </html>
  );
}
