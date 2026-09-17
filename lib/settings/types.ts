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

export interface SiteSettings {
  supportEmail: string;
  companyName: string;
  socials: SocialLinkItem[];
  seo: SeoSettings;
  webmasters: WebmasterSettings;
  analytics: AnalyticsSettings;
  customScripts: CustomScriptSettings;
  bannerAnnouncement?: {
    enabled: boolean;
    text: string;
    link?: string;
  };
}

export const DEFAULT_SITE_SETTINGS: SiteSettings = {
  supportEmail: 'cransys@yandex.ru',
  companyName: 'Cransys Analytics',
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
