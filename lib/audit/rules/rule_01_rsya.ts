import { IAuditRule, AuditInputData, RuleResult } from '../types';

export class Rule01RsyaOverspend implements IAuditRule {
  readonly id = 'RULE_01_RSYA_OVERSPEND';
  readonly name = 'Перекос бюджета в сети (РСЯ)';

  execute(data: AuditInputData): RuleResult {
    const rsyaCampaigns = data.campaigns.filter((c) => c.type === 'RSYA');
    const rsyaSpend = rsyaCampaigns.reduce((sum, c) => sum + c.spendRub, 0);
    const rsyaConversions = rsyaCampaigns.reduce((sum, c) => sum + c.conversions, 0);

    const rsyaSharePercent = data.totalSpendRub > 0 ? (rsyaSpend / data.totalSpendRub) * 100 : 0;
    const isOverspent = rsyaSharePercent > 80 && (rsyaConversions === 0 || rsyaConversions < 2);

    const estimatedLoss = isOverspent ? Math.round(rsyaSpend * 0.95) : 0;

    return {
      ruleId: this.id,
      severity: isOverspent ? 'CRITICAL' : 'INFO',
      title: 'Слив бюджета в сетях (РСЯ)',
      fact: `${rsyaSharePercent.toFixed(1)}% бюджета (${rsyaSpend.toLocaleString('ru-RU')} ₽) уходит в РСЯ при ${rsyaConversions} подтвержденных конверсиях.`,
      flagged: isOverspent,
      estimatedLossRub: estimatedLoss,
      recommendation:
        'Отключите автотаргетинг в сетях или разделите поисковый и сетевой бюджет. В микробизнесе РСЯ без жестких минус-площадок приводит к выгоранию бюджета.',
      isLockedInExpress: false, // Доступно в бесплатном экспресс-аудите
    };
  }
}
