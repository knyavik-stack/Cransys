import { IAuditRule, AuditInputData, RuleResult } from '../types';

export class Rule04ZeroConversionCampaigns implements IAuditRule {
  readonly id = 'RULE_04_ZERO_CONVERSION_CAMPAIGNS';
  readonly name = 'Кампании с расходом > 3000 ₽ и 0 конверсий';

  execute(data: AuditInputData): RuleResult {
    const zeroConvCampaigns = data.campaigns.filter((c) => c.spendRub >= 3000 && c.conversions === 0);
    const flagged = zeroConvCampaigns.length > 0;
    const totalZeroSpend = zeroConvCampaigns.reduce((acc, c) => acc + c.spendRub, 0);

    return {
      ruleId: this.id,
      severity: flagged ? 'CRITICAL' : 'INFO',
      title: 'Нулевая отдача активных рекламных кампаний',
      fact: flagged
        ? `Обнаружено ${zeroConvCampaigns.length} кампаний со 100% сливом бюджета: потрачено ${totalZeroSpend.toLocaleString(
            'ru-RU'
          )} ₽ без единого обращения.`
        : 'Все кампании с расходом более 3 000 ₽ принесли хотя бы 1 конверсию.',
      flagged,
      estimatedLossRub: Math.round(totalZeroSpend),
      recommendation:
        'Приостановите неэффективные кампании немедленно. Проверьте релевантность посадочных страниц и чистоту поисковых запросов в отчете «Поисковые запросы».',
      isLockedInExpress: false,
    };
  }
}
