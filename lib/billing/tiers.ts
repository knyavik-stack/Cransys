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
  features: string[];
  cta: string;
}

export const TIER_CONFIGS: Record<UserTier, TierDefinition> = {
  EXPRESS_SINGLE: {
    id: 'EXPRESS_SINGLE',
    name: 'Экспресс (1 аудит)',
    badge: 'Разовый',
    price: 399,
    priceFormatted: '399 ₽',
    period: 'разовый отчет',
    reportsLimit: 1,
    description: 'Быстрый независимый срез для одной кампании',
    popular: false,
    hasDirectApi: false,
    hasAiInsights: false,
    hasSearchQueryClustering: false,
    hasRsyaBlacklist: false,
    hasWhiteLabel: false,
    hasCorpAutomation: false,
    features: [
      '1 полный отчет по выгрузке',
      'Проверка по 6 базовым правилам сливов',
      'Оценка мобильного и РСЯ перекоса',
      'Расчет переплаты за клики без конверсий',
      'Базовый PDF-отчет и ТЗ подрядчику',
    ],
    cta: 'Купить 1 аудит за 399 ₽',
  },
  EXPRESS_PACK: {
    id: 'EXPRESS_PACK',
    name: 'Экспресс Пакет (3 аудита)',
    badge: 'Пакет 3 шт',
    price: 990,
    priceFormatted: '990 ₽',
    period: 'пакет из 3 отчетов',
    reportsLimit: 3,
    description: 'Для сравнения нескольких кампаний или среза до/после',
    popular: false,
    hasDirectApi: false,
    hasAiInsights: false,
    hasSearchQueryClustering: false,
    hasRsyaBlacklist: false,
    hasWhiteLabel: false,
    hasCorpAutomation: false,
    features: [
      '3 полных аудита в пакете (330 ₽/отчет)',
      'Сравнение динамики до и после правок',
      'Проверка по 6 критическим правилам',
      'Оценка мобильного перекоса и РСЯ',
      'История проверок в защищенном облаке',
      'Экспорт ТЗ подрядчику в 1 клик',
    ],
    cta: 'Выбрать Экспресс (3 отчета)',
  },
  PRO: {
    id: 'PRO',
    name: 'PRO (10 отчетов)',
    badge: 'Популярный',
    price: 2990,
    priceFormatted: '2 990 ₽',
    period: 'в месяц (10 отчетов)',
    reportsLimit: 10,
    description: 'Для предпринимателей, маркетологов и контекстологов',
    popular: true,
    hasDirectApi: true,
    hasAiInsights: true,
    hasSearchQueryClustering: true,
    hasRsyaBlacklist: false,
    hasWhiteLabel: false,
    hasCorpAutomation: false,
    features: [
      '10 аудитов в месяц включено',
      'Прямое подключение по API Яндекс.Директ (OAuth)',
      'Глубокий AI-анализ на базе Gemini',
      'Кластеризация поисковых фраз и авто-минус-слова',
      'Интерактивный симулятор окупаемости',
      'История аудитов и динамика здоровья',
    ],
    cta: 'Подключить PRO (2 990 ₽)',
  },
  MAX: {
    id: 'MAX',
    name: 'MAX / White-label (30 отчетов)',
    badge: 'Для агентств',
    price: 6990,
    priceFormatted: '6 990 ₽',
    period: 'в месяц (30 отчетов)',
    reportsLimit: 30,
    description: 'Для агентств, таргетологов и независимых аудиторов',
    popular: false,
    hasDirectApi: true,
    hasAiInsights: true,
    hasSearchQueryClustering: true,
    hasRsyaBlacklist: true,
    hasWhiteLabel: true,
    hasCorpAutomation: false,
    features: [
      '30 аудитов в месяц включено',
      'Все возможности тарифа PRO + Direct API',
      'White-label: ваш логотип, телефон и сайт в PDF',
      'Готовые брендированные КП для ваших клиентов',
      'AI-блеклист паразитных площадок и игр в РСЯ',
      'Командный доступ и приоритетная очередь',
    ],
    cta: 'Активировать MAX (6 990 ₽)',
  },
  CORP: {
    id: 'CORP',
    name: 'Corporate (500 отчетов)',
    badge: 'Enterprise',
    price: 29900,
    priceFormatted: '29 900 ₽',
    period: 'в месяц (500 отчетов)',
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
    features: [
      '500 аудитов в месяц включено (всего 60 ₽/отчет)',
      'Пакетный фоновый аудит 50+ аккаунтов через Direct API',
      'Автоматизация аналитики и умная авто-группировка',
      '24/7 мониторинг аномалий и сливов с Telegram-алертами',
      'Авто-экспорт минус-слов прямо в Директ Коммандер/API',
      'Мульти-аккаунты для команды и клиентов (RBAC)',
      'Выделенный инженер поддержки и SLA 99.9%',
    ],
    cta: 'Оформить Corporate (29 900 ₽)',
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
