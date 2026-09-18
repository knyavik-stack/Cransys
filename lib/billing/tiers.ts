export type UserTier = 'EXPRESS_SINGLE' | 'EXPRESS_PACK' | 'PRO' | 'MAX' | 'CORP';

export interface TierDefinition {
  id: UserTier;
  name: string;
  badge: string;
  price: number;
  priceFormatted: string;
  period: string;
  reportsLimit: number;
  description: string;
  popular?: boolean;
  isEnterprise?: boolean;
  hasDirectApi: boolean;
  hasAiInsights: boolean;
  hasSearchQueryClustering: boolean;
  hasRsyaBlacklist: boolean;
  hasWhiteLabel: boolean;
  hasCorpAutomation: boolean;
  maxConnectedAccounts: number;
  hasMultiAccounts: boolean;
  features: string[];
  cta: string;
}

export const TIER_CONFIGS: Record<UserTier, TierDefinition> = {
  EXPRESS_SINGLE: {
    id: 'EXPRESS_SINGLE',
    name: 'Экспресс',
    badge: 'Разовый',
    price: 399,
    priceFormatted: '399 ₽',
    period: 'разовый аудит',
    reportsLimit: 1,
    description: 'Быстрый независимый срез для одной кампании',
    popular: false,
    hasDirectApi: false,
    hasAiInsights: false,
    hasSearchQueryClustering: false,
    hasRsyaBlacklist: false,
    hasWhiteLabel: false,
    hasCorpAutomation: false,
    maxConnectedAccounts: 0,
    hasMultiAccounts: false,
    features: [
      '1 полный аудит по файлу (.xlsx / .csv)',
      'Проверка по 6 базовым правилам сливов',
      'Оценка перекоса в РСЯ (мусорные площадки)',
      'Анализ переплаты за мобильный трафик vs ПК',
      'Расчет неэффективно потраченного бюджета (₽)',
      'Готовое ТЗ для директолога в PDF',
    ],
    cta: 'Выбрать Экспресс',
  },
  EXPRESS_PACK: {
    id: 'EXPRESS_PACK',
    name: 'Экспресс Пакет',
    badge: 'Пакет 3 шт',
    price: 990,
    priceFormatted: '990 ₽',
    period: 'пакет из 3 аудитов',
    reportsLimit: 3,
    description: 'Для сравнения нескольких кампаний и среза До/После',
    popular: false,
    hasDirectApi: false,
    hasAiInsights: false,
    hasSearchQueryClustering: false,
    hasRsyaBlacklist: false,
    hasWhiteLabel: false,
    hasCorpAutomation: false,
    maxConnectedAccounts: 0,
    hasMultiAccounts: false,
    features: [
      '3 полных аудита в пакете (всего 330 ₽ за отчет)',
      'Сравнение показателей кампаний «До» и «После» правок',
      'Пакетный анализ до 3 рекламных кампаний',
      'Выявление мусорных сайтов и приложений в сетях',
      'Анализ нецелевых поисковых запросов и автотаргетинга',
      'Сохранение истории проверок в защищенном облаке',
      'Экспорт готового чек-листа исправлений',
    ],
    cta: 'Выбрать Пакет (990 ₽)',
  },
  PRO: {
    id: 'PRO',
    name: 'PRO',
    badge: 'Популярный',
    price: 2990,
    priceFormatted: '2 990 ₽',
    period: 'в месяц',
    reportsLimit: 10,
    description: 'Для предпринимателей, маркетологов и контекстологов',
    popular: true,
    hasDirectApi: true,
    hasAiInsights: true,
    hasSearchQueryClustering: true,
    hasRsyaBlacklist: false,
    hasWhiteLabel: false,
    hasCorpAutomation: false,
    maxConnectedAccounts: 1,
    hasMultiAccounts: false,
    features: [
      '10 полных проверок в месяц с автообновлением',
      'Прямое подключение по API Яндекс.Директ (OAuth)',
      '1 активный рекламный кабинет Яндекс.Директ',
      'Глубокий AI-анализ аномалий на базе Gemini Pro',
      'Автоматическая кластеризация поисковых запросов',
      'Генератор готовых списков минус-слов в 1 клик',
      'Диагностика обучения автостратегий и микро-целей',
      'Интерактивный симулятор окупаемости и экономии',
      'Динамика Индекса Здоровья в личном кабинете',
    ],
    cta: 'Подключить PRO',
  },
  MAX: {
    id: 'MAX',
    name: 'MAX White-label',
    badge: 'Для агентств',
    price: 6990,
    priceFormatted: '6 990 ₽',
    period: 'в месяц',
    reportsLimit: 30,
    description: 'Для агентств, таргетологов и независимых аудиторов',
    popular: false,
    hasDirectApi: true,
    hasAiInsights: true,
    hasSearchQueryClustering: true,
    hasRsyaBlacklist: true,
    hasWhiteLabel: true,
    hasCorpAutomation: false,
    maxConnectedAccounts: 5,
    hasMultiAccounts: true,
    features: [
      '30 проверок в месяц для клиентских проектов',
      'Все возможности тарифа PRO + прямое Direct API',
      'Мульти-аккаунты: подключение до 5 кабинетов Яндекс',
      'Полный White-label: ваш логотип, контакты и сайт в отчете',
      'Генерация брендированных коммерческих предложений (КП)',
      'Эксклюзивный AI-блеклист 10 000+ мусорных площадок РСЯ',
      'Приоритетная скорость анализа в выделенной очереди',
      'Расширенный экспорт отчетов в Excel, PDF и Word',
      'Реестр всех проектов клиентов в едином кабинете',
    ],
    cta: 'Подключить MAX',
  },
  CORP: {
    id: 'CORP',
    name: 'Corporate',
    badge: 'Enterprise',
    price: 29900,
    priceFormatted: '29 900 ₽',
    period: 'в месяц',
    reportsLimit: 500,
    description: 'Для крупных агентств, холдингов и e-commerce сетей',
    popular: false,
    isEnterprise: true,
    hasDirectApi: true,
    hasAiInsights: true,
    hasSearchQueryClustering: true,
    hasRsyaBlacklist: true,
    hasWhiteLabel: true,
    hasCorpAutomation: true,
    maxConnectedAccounts: 50,
    hasMultiAccounts: true,
    features: [
      '500 аудитов в месяц (всего 60 ₽ за проверку)',
      'Корпоративный мульти-аккаунт: подключение до 50 кабинетов',
      'Пакетный фоновый аудит 50+ аккаунтов через Direct API',
      'Круглосуточный 24/7 мониторинг сливов и аномалий',
      'Мгновенные алерты в Telegram при резком росте CPA',
      'Авто-экспорт минус-слов в Директ Коммандер и API',
      'Мульти-пользовательский командный доступ (RBAC)',
      'Кастомные правила проверки под специфику ниши',
      'Персональный аккаунт-менеджер и SLA поддержки 1 час',
    ],
    cta: 'Оформить Corporate',
  },
};

export const TIER_LIST: TierDefinition[] = Object.values(TIER_CONFIGS);

export function getTierConfig(tier: string | null | undefined): TierDefinition {
  if (!tier) return TIER_CONFIGS.EXPRESS_SINGLE;
  if (tier in TIER_CONFIGS) {
    return TIER_CONFIGS[tier as UserTier];
  }
  // Обратная совместимость
  if (tier === 'EXPRESS') return TIER_CONFIGS.EXPRESS_PACK;
  return TIER_CONFIGS.PRO;
}

export function isFeatureAllowed(
  tier: string | null | undefined,
  feature:
    | 'directApi'
    | 'aiInsights'
    | 'searchClustering'
    | 'rsyaBlacklist'
    | 'whiteLabel'
    | 'corpAutomation'
): boolean {
  const config = getTierConfig(tier);
  switch (feature) {
    case 'directApi':
      return config.hasDirectApi;
    case 'aiInsights':
      return config.hasAiInsights;
    case 'searchClustering':
      return config.hasSearchQueryClustering;
    case 'rsyaBlacklist':
      return config.hasRsyaBlacklist;
    case 'whiteLabel':
      return config.hasWhiteLabel;
    case 'corpAutomation':
      return config.hasCorpAutomation;
    default:
      return false;
  }
}
