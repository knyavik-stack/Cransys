import { IAuditRule, AuditInputData, RuleResult } from '../types';

export class Rule03StrategyNoGoals implements IAuditRule {
  readonly id = 'RULE_03_CLICK_STRATEGY_NO_GOALS';
  readonly name = 'Автостратегия кликов без оптимизации конверсий';

  execute(data: AuditInputData): RuleResult {
    const dangerousCampaigns = data.campaigns.filter((c) => {
      const s = c.strategy.toLowerCase();
      return (
        (s.includes('клик') || s.includes('ручн') || s.includes('максимум кликов')) &&
        c.conversions === 0 &&
        c.spendRub > 2500
      );
    });

    const flagged = dangerousCampaigns.length > 0;
    const loss = dangerousCampaigns.reduce((acc, c) => acc + Math.round(c.spendRub * 0.5), 0);

    return {
      ruleId: this.id,
      severity: flagged ? 'WARNING' : 'INFO',
      title: 'Трафик на клики без ориентира на цели Метрики',
      fact: flagged
        ? `В ${dangerousCampaigns.length} кампаниях включена закупка кликов вместо целевых конверсий при расходе ${dangerousCampaigns
            .reduce((s, c) => s + c.spendRub, 0)
            .toLocaleString('ru-RU')} ₽.`
        : 'Стратегии ориентированы на достижение целевых действий или конверсий.',
      flagged,
      estimatedLossRub: loss,
      recommendation:
        'Переведите кампании на стратегию «Оптимизация конверсий» с ограничением недельного бюджета и оплатой за подтвержденные лиды/цели.',
      isLockedInExpress: false,
    };
  }
}
