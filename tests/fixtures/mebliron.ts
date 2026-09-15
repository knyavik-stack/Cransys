import { AuditInputData } from '@/lib/audit/types';

/**
 * Эталонная выгрузка рекламного кабинета мебели «Меблирон» (Февраль - Июль 2026)
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
};
