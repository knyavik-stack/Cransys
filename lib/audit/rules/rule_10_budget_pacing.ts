import { IAuditRule, AuditInputData, RuleResult } from '../types';

export class Rule10BudgetPacingDrain implements IAuditRule {
  readonly id = 'RULE_10_BUDGET_PACING_DRAIN';
  readonly name = 'Утечка бюджета на кампаниях без дневных ограничений';

  execute(data: AuditInputData): RuleResult {
    // Кампании со слишком высоким расходом относительно общего пула без конверсий
    const totalSpend = data.totalSpendRub || 1;
    const dominantZeroCampaigns = data.campaigns.filter((c) => {
      const share = (c.spendRub / totalSpend) * 100;
      return share > 40 && c.conversions === 0 && c.spendRub > 3000;
    });

    const flagged = dominantZeroCampaigns.length > 0;
    const loss = dominantZeroCampaigns.reduce((sum, c) => sum + Math.round(c.spendRub * 0.6), 0);

    return {
      ruleId: this.id,
      severity: flagged ? 'CRITICAL' : 'INFO',
      title: 'Монополизация и сжигание бюджета одной кампанией',
      fact: flagged
        ? `Кампания «${dominantZeroCampaigns[0].name}» поглотила более 40% всего рекламного бюджета (${dominantZeroCampaigns[0].spendRub.toLocaleString(
            'ru-RU'
          )} ₽) при 0 конверсий, лишив финансирования другие направления.`
        : 'Бюджет распределен сбалансированно, нет аномальной монополизации неэффективными кампаниями.',
      flagged,
      estimatedLossRub: loss,
      recommendation:
        'Установите жесткий дневной лимит бюджета на кампанию и распределите средства в пользу кампаний с подтвержденными целевыми действиями.',
      isLockedInExpress: false,
    };
  }
}
