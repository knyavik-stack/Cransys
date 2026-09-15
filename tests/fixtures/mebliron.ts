import { AuditInputData } from '@/lib/audit/types';

/**
 * Демонстрационная выгрузка рекламного кабинета (Производство корпусной мебели)
 * Характеристики:
 * - 98.9% бюджета слито в РСЯ
 * - Кампания поиска принесла 1 конверсию при мизерном бюджете
 * - Сети сожгли бюджет без результата
 */
export const mockMeblironData: AuditInputData = {
  totalSpendRub: 15045.5,
  totalConversions: 1,
  currency: 'RUB',
  period: {
    from: '2026-02-01',
    to: '2026-07-31',
  },
  campaigns: [
    {
      id: 'camp-101',
      name: 'РСЯ_Мебель_На_Заказ_Широкая',
      type: 'RSYA',
      strategy: 'Максимум кликов',
      spendRub: 14880.0,
      clicks: 482,
      impressions: 48920,
      conversions: 0,
      desktopSpendRub: 4200.0,
      desktopConversions: 0,
      mobileSpendRub: 10680.0,
      mobileConversions: 0,
    },
    {
      id: 'camp-102',
      name: 'Поиск_Кухни_Горячие_Москва',
      type: 'SEARCH',
      strategy: 'Оптимизация кликов',
      spendRub: 165.5,
      clicks: 12,
      impressions: 340,
      conversions: 1,
      desktopSpendRub: 120.0,
      desktopConversions: 1,
      mobileSpendRub: 45.5,
      mobileConversions: 0,
    },
  ],
  searchQueries: [
    { query: 'кухня своими руками чертежи и схемы', clicks: 38, impressions: 520, spendRub: 1420, conversions: 0 },
    { query: 'шкаф купе фото дизайн в прихожую', clicks: 42, impressions: 840, spendRub: 1650, conversions: 0 },
    { query: 'купить кухню на заказ москва недорого', clicks: 12, impressions: 340, spendRub: 165.5, conversions: 1 },
    { query: 'мебель бесплатно забрать самовывоз авито', clicks: 29, impressions: 610, spendRub: 980, conversions: 0 },
    { query: 'скачать проект кухни в pro100 торрент', clicks: 18, impressions: 390, spendRub: 740, conversions: 0 },
    { query: 'работа сборщик мебели вакансии зарплата', clicks: 22, impressions: 480, spendRub: 890, conversions: 0 },
    { query: 'мебель на заказ спб каталог цены', clicks: 15, impressions: 290, spendRub: 620, conversions: 0 },
  ],
};


