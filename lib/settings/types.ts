export interface SocialLinkItem {
  id: string;
  name: string;
  url: string;
  enabled: boolean;
  icon: 'telegram' | 'vk' | 'youtube' | 'vc' | 'habr' | 'whatsapp' | 'mail';
  description?: string;
}

export interface SeoSettings {
  mainTitle: string;
  mainDescription: string;
  keywords: string;
  ogTitle: string;
  ogDescription: string;
  ogImageUrl: string;
  robotsIndexing: 'all' | 'noindex, nofollow';
}

export interface WebmasterSettings {
  yandexVerificationCode: string;
  googleVerificationCode: string;
}

export interface AnalyticsSettings {
  yandexMetrikaId: string;
  yandexMetrikaWebvisor: boolean;
  googleAnalyticsId: string;
}

export interface CustomScriptSettings {
  headScript: string;
  bodyScript: string;
}

export interface CookieBannerSettings {
  enabled: boolean;
  title: string;
  description: string;
  policyUrl: string;
  policyLinkText?: string;
  autoBlockScripts: boolean;
  showDeclineButton: boolean;
  showRejectAll?: boolean;
  defaultAnalytics: boolean;
  defaultMarketing: boolean;
  cookieExpirationDays: number;
  consentExpiryDays?: number;
}

export interface CookiePreferences {
  necessary: boolean;
  analytics: boolean;
  marketing: boolean;
  timestamp: string;
  version: string;
}

export interface CookieConsentRecord {
  id: string;
  timestamp: string;
  choice: 'all' | 'necessary' | 'custom';
  action?: 'accept_all' | 'reject_all' | 'custom';
  preferences: {
    necessary: boolean;
    analytics: boolean;
    marketing: boolean;
  };
  userAgent?: string;
  ipMasked?: string;
}

export interface CookieConsentStats {
  totalPrompts: number;
  acceptedAll: number;
  acceptedNecessary: number;
  acceptedCustom: number;
  lastUpdated: string;
}

export interface SiteSettings {
  supportEmail: string;
  companyName: string;
  socials: SocialLinkItem[];
  seo: SeoSettings;
  webmasters: WebmasterSettings;
  analytics: AnalyticsSettings;
  customScripts: CustomScriptSettings;
  cookieBanner: CookieBannerSettings;
  bannerAnnouncement?: {
    enabled: boolean;
    text: string;
    link?: string;
  };
}

export const DEFAULT_SITE_SETTINGS: SiteSettings = {
  supportEmail: 'cransys@yandex.ru',
  companyName: 'Cransys Analytics',
  cookieBanner: {
    enabled: true,
    title: 'Управление файлами cookie и конфиденциальность',
    description: 'Мы используем обязательные технические файлы cookie для корректной работы сервиса, а также аналитические cookie (Яндекс.Метрика) для анализа использования и оптимизации алгоритмов аудита в соответствии с 152-ФЗ РФ.',
    policyUrl: '/legal/cookies',
    policyLinkText: 'Политикой использования файлов cookie',
    autoBlockScripts: true,
    showDeclineButton: true,
    showRejectAll: true,
    defaultAnalytics: true,
    defaultMarketing: false,
    cookieExpirationDays: 365,
    consentExpiryDays: 365,
  },
  seo: {
    mainTitle: 'Cransys — Автоматизированный аудит Яндекс.Директ',
    mainDescription: 'Независимый автоматизированный аудит рекламных кампаний Яндекс.Директ. Поиск скрытых сливов бюджета в РСЯ, нецелевых запросов и мобильных аномалий за 2 минуты.',
    keywords: 'аудит яндекс директ, проверка рекламы яндекс директ, слив бюджета рся, минус слова директ, анализ поисковых запросов яндекс, аудит контекстной рекламы онлайн, оптимизация директ 2026, cransys, 152-фз аудит директ',
    ogTitle: 'Cransys — Автоматизированный аудит Яндекс.Директ',
    ogDescription: 'Независимый аудит рекламных кампаний в Яндекс.Директ: выявление сливов в РСЯ, нецелевых фраз и мобильных аномалий за 2 минуты.',
    ogImageUrl: '',
    robotsIndexing: 'all',
  },
  webmasters: {
    yandexVerificationCode: '',
    googleVerificationCode: '',
  },
  analytics: {
    yandexMetrikaId: '',
    yandexMetrikaWebvisor: true,
    googleAnalyticsId: '',
  },
  customScripts: {
    headScript: '',
    bodyScript: '',
  },
  socials: [
    {
      id: 'telegram',
      name: 'Telegram',
      url: 'https://t.me/cransys_official',
      enabled: true,
      icon: 'telegram',
      description: 'Канал с обновлениями баз РСЯ и кейсами',
    },
    {
      id: 'vk',
      name: 'ВКонтакте',
      url: 'https://vk.com/cransys',
      enabled: true,
      icon: 'vk',
      description: 'Официальное сообщество Cransys',
    },
    {
      id: 'youtube',
      name: 'YouTube',
      url: 'https://youtube.com/@cransys',
      enabled: true,
      icon: 'youtube',
      description: 'Видеоразборы и обучающие аудиты',
    },
    {
      id: 'vc',
      name: 'VC.ru',
      url: 'https://vc.ru/u/cransys',
      enabled: true,
      icon: 'vc',
      description: 'Статьи и исследования сливов бюджета',
    },
    {
      id: 'habr',
      name: 'Хабр',
      url: 'https://habr.com/ru/users/cransys',
      enabled: false,
      icon: 'habr',
      description: 'Технические алгоритмы аудита',
    },
    {
      id: 'whatsapp',
      name: 'WhatsApp',
      url: 'https://wa.me/79990000000',
      enabled: false,
      icon: 'whatsapp',
      description: 'Прямая связь с поддержкой',
    },
  ],
};
