import { IAuditRule, AuditInputData, RuleResult } from '../types';

export class Rule04ZeroConversionCampaigns implements IAuditRule {
  readonly id = 'RULE_04_ZERO_CONVERSION_CAMPAIGNS';
  readonly name = 'Кампании с расходом без единой конверсии';

  execute(data: AuditInputData): RuleResult {
    // Ловим кампании с расходом более 1200 руб. без единой конверсии
    const zeroConvCampaigns = data.campaigns.filter((c) => c.spendRub >= 1200 && c.conversions === 0);
    const flagged = zeroConvCampaigns.length > 0;
    const totalZeroSpend = zeroConvCampaigns.reduce((acc, c) => acc + c.spendRub, 0);

    return {
      ruleId: this.id,
      severity: flagged ? 'CRITICAL' : 'INFO',
      title: 'Нулевая отдача активных рекламных кампаний',
      fact: flagged
        ? `Обнаружено ${zeroConvCampaigns.length} кампаний со 100% сливом бюджета: потрачено ${Math.round(
            totalZeroSpend
          ).toLocaleString('ru-RU')} ₽ без единого целевого действия.`
        : 'В выборке нет кампаний со значительным расходом при полном отсутствии конверсий.',
      flagged,
      estimatedLossRub: Math.round(totalZeroSpend),
      recommendation:
        'Приостановите неэффективные кампании немедленно. Проверьте соответствие посадочных страниц и чистоту фраз в отчете «Поисковые запросы».',
      isLockedInExpress: false,
    };
  }
}
