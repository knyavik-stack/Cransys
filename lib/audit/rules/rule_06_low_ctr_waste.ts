import { IAuditRule, AuditInputData, RuleResult } from '../types';

export class Rule06LowCtrWaste implements IAuditRule {
  readonly id = 'RULE_06_LOW_CTR_WASTE';
  readonly name = 'Нецелевые показы и слив на «мусорных» запросах';

  execute(data: AuditInputData): RuleResult {
    // Кампании с низким CTR (< 0.8%), высоким расходом и низкой отдачей
    const lowCtrCampaigns = data.campaigns.filter((c) => {
      if (c.impressions < 300 || c.clicks === 0) return false;
      const ctr = (c.clicks / c.impressions) * 100;
      return ctr < 0.6 && c.spendRub > 1500 && c.conversions === 0;
    });

    const flagged = lowCtrCampaigns.length > 0;
    const totalWasted = lowCtrCampaigns.reduce((sum, c) => sum + c.spendRub, 0);

    return {
      ruleId: this.id,
      severity: flagged ? 'WARNING' : 'INFO',
      title: 'Нецелевой мусорный трафик с кликабельностью ниже 0.6%',
      fact: flagged
        ? `В ${lowCtrCampaigns.length} кампаниях зафиксирован микро-CTR при ${lowCtrCampaigns
            .reduce((s, c) => s + c.impressions, 0)
            .toLocaleString('ru-RU')} показах. Слито ${Math.round(totalWasted).toLocaleString(
            'ru-RU'
          )} ₽ без конверсий.`
        : 'Кликабельность (CTR) объявлений соответствует среднерыночным бенчмаркам.',
      flagged,
      estimatedLossRub: Math.round(totalWasted * 0.8),
      recommendation:
        'Проведите чистку кросс-минус-слов, отключите мусорный автотаргетинг и запретите показы на непрофильных площадках.',
      isLockedInExpress: false,
    };
  }
}
