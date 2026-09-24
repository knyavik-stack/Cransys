import { IAuditRule, AuditInputData, RuleResult } from '../types';

export class Rule08HighCpcAnomaly implements IAuditRule {
  readonly id = 'RULE_08_HIGH_CPC_ANOMALY';
  readonly name = 'Аномально высокая стоимость клика (CPC)';

  execute(data: AuditInputData): RuleResult {
    const campaignsWithClicks = data.campaigns.filter((c) => c.clicks >= 10 && c.spendRub > 1000);
    if (campaignsWithClicks.length === 0) {
      return {
        ruleId: this.id,
        severity: 'INFO',
        title: 'Анализ стоимости клика (CPC)',
        fact: 'Недостаточно кликов для расчета средней рыночной ставки CPC.',
        flagged: false,
        estimatedLossRub: 0,
        recommendation: 'Контролируйте максимальную цену клика в параметрах автостратегий.',
        isLockedInExpress: false,
      };
    }

    const totalClicks = campaignsWithClicks.reduce((sum, c) => sum + c.clicks, 0);
    const totalSpend = campaignsWithClicks.reduce((sum, c) => sum + c.spendRub, 0);
    const avgCpc = totalClicks > 0 ? totalSpend / totalClicks : 0;

    // Кампании, где CPC в 2.5+ раза выше среднего по аккаунту при нулевом или низком CR
    const overpaidCampaigns = campaignsWithClicks.filter((c) => {
      const cpc = c.spendRub / c.clicks;
      const cr = c.clicks > 0 ? (c.conversions / c.clicks) * 100 : 0;
      return cpc > avgCpc * 2.3 && cr < 1.0 && c.spendRub > 2000;
    });

    const flagged = overpaidCampaigns.length > 0;
    let overpaidSum = 0;

    for (const c of overpaidCampaigns) {
      const cpc = c.spendRub / c.clicks;
      const excessPerClick = cpc - avgCpc * 1.5;
      overpaidSum += Math.max(0, Math.round(excessPerClick * c.clicks));
    }

    return {
      ruleId: this.id,
      severity: flagged ? 'WARNING' : 'INFO',
      title: 'Переплата за клики в перегретых аукционах',
      fact: flagged
        ? `В ${overpaidCampaigns.length} кампаниях средняя цена клика достигает ${Math.round(
            overpaidCampaigns.reduce((s, c) => s + c.spendRub, 0) /
              overpaidCampaigns.reduce((s, c) => s + c.clicks, 0)
          ).toLocaleString('ru-RU')} ₽ (в ${(
            overpaidCampaigns.reduce((s, c) => s + c.spendRub, 0) /
            overpaidCampaigns.reduce((s, c) => s + c.clicks, 0) /
            (avgCpc || 1)
          ).toFixed(1)}x раз выше нормы ${Math.round(avgCpc).toLocaleString('ru-RU')} ₽) без роста конверсий.`
        : `Средняя цена клика (${Math.round(avgCpc).toLocaleString('ru-RU')} ₽) сбалансирована по всем кампаниям.`,
      flagged,
      estimatedLossRub: overpaidSum,
      recommendation:
        'Установите ограничение максимальной ставки за клик в параметрах стратегии и используйте кросс-минусовку ключевых фраз, чтобы не разогревать аукцион на широких запросах.',
      isLockedInExpress: false,
    };
  }
}
