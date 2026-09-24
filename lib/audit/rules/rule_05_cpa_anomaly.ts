import { IAuditRule, AuditInputData, RuleResult } from '../types';

export class Rule05CpaAnomaly implements IAuditRule {
  readonly id = 'RULE_05_CPA_ANOMALY';
  readonly name = 'Аномально дорогая цена конверсии (CPA)';

  execute(data: AuditInputData): RuleResult {
    const campaignsWithConv = data.campaigns.filter((c) => c.conversions > 0 && c.spendRub > 2000);
    if (campaignsWithConv.length === 0) {
      return {
        ruleId: this.id,
        severity: 'INFO',
        title: 'Анализ стоимости целевого действия (CPA)',
        fact: 'В выборке нет кампаний с подтвержденными конверсиями для расчета средней цены лида.',
        flagged: false,
        estimatedLossRub: 0,
        recommendation: 'Настройте цели в Яндекс.Метрике и свяжите счетчик с Директом для контроля стоимости заявок.',
        isLockedInExpress: false,
      };
    }

    const totalSpendWithConv = campaignsWithConv.reduce((sum, c) => sum + c.spendRub, 0);
    const totalConv = campaignsWithConv.reduce((sum, c) => sum + c.conversions, 0);
    const totalClicks = campaignsWithConv.reduce((sum, c) => sum + (c.clicks || 0), 0);
    const avgCpa = totalSpendWithConv / totalConv;
    const avgCr = totalClicks > 0 ? (totalConv / totalClicks) * 100 : 0;

    // 1. Для аккаунтов с 1 кампанией: оцениваем абсолютную норму CPA и микро-конверсию
    if (campaignsWithConv.length === 1) {
      const single = campaignsWithConv[0];
      const isSingleExpensive = single.spendRub >= 5000 && avgCpa > 3200 && avgCr < 0.35;

      if (isSingleExpensive) {
        const benchmarkCpa = 1500; // Оптимальная рыночная стоимость конверсии в услугах
        const overpaid = Math.max(0, Math.round((avgCpa - benchmarkCpa) * single.conversions));

        return {
          ruleId: this.id,
          severity: 'WARNING',
          title: 'Аномально высокая стоимость заявки (CPA) при низкой конверсии сайта',
          fact: `Средняя цена заявки составляет ${Math.round(avgCpa).toLocaleString('ru-RU')} ₽ при критически низком коэффициенте конверсии (CR = ${avgCr.toFixed(2)}%: всего ${single.conversions} лидов с ${single.clicks.toLocaleString('ru-RU')} кликов).`,
          flagged: true,
          estimatedLossRub: overpaid,
          recommendation:
            'Установите предельную цену конверсии (CPA) в настройках автостратегии (не выше 1 500–2 000 ₽) и проведите аудит юзабилити мобильной посадочной страницы (95% посетителей уходят без заявки).',
          isLockedInExpress: false,
        };
      }
    }

    // 2. Для аккаунтов с несколькими кампаниями: кампании, где CPA в 2.2+ раза дороже среднего по аккаунту
    const expensiveCampaigns = campaignsWithConv.filter((c) => {
      const cpa = c.spendRub / c.conversions;
      return cpa > avgCpa * 2.2 && c.spendRub > 3000;
    });

    const flagged = expensiveCampaigns.length > 0;
    let overpaidSum = 0;
    for (const c of expensiveCampaigns) {
      const actualCpa = c.spendRub / c.conversions;
      const excessPerLead = actualCpa - avgCpa;
      overpaidSum += Math.round(excessPerLead * c.conversions);
    }

    return {
      ruleId: this.id,
      severity: flagged ? 'WARNING' : 'INFO',
      title: 'Аномально дорогие лиды в отдельных кампаниях',
      fact: flagged
        ? `В ${expensiveCampaigns.length} кампаниях средняя стоимость лида составляет ${Math.round(
            expensiveCampaigns.reduce((s, c) => s + c.spendRub, 0) /
              expensiveCampaigns.reduce((s, c) => s + c.conversions, 0)
          ).toLocaleString('ru-RU')} ₽ при норме по кабинету ${Math.round(avgCpa).toLocaleString('ru-RU')} ₽.`
        : `Стоимость лидов во всех работающих кампаниях находится в пределах рыночной нормы (в среднем ${Math.round(
            avgCpa
          ).toLocaleString('ru-RU')} ₽).`,
      flagged,
      estimatedLossRub: overpaidSum,
      recommendation:
        'Ограничьте предельную ставку или переведите дорогие кампании на целевой CPA с фиксацией цены конверсии в параметрах стратегии.',
      isLockedInExpress: false,
    };
  }
}
