export interface SocialLinkItem {
  id: string;
  name: string;
  url: string;
  enabled: boolean;
  icon: 'telegram' | 'vk' | 'youtube' | 'vc' | 'habr' | 'whatsapp' | 'mail';
  description?: string;
}

export interface SiteSettings {
  supportEmail: string;
  companyName: string;
  socials: SocialLinkItem[];
  bannerAnnouncement?: {
    enabled: boolean;
    text: string;
    link?: string;
  };
}

export const DEFAULT_SITE_SETTINGS: SiteSettings = {
  supportEmail: 'cransys@yandex.ru',
  companyName: 'Cransys Analytics',
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
