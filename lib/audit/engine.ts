import { IAuditRule, AuditInputData, AuditReportData, RuleResult } from './types';
import { Rule01RsyaOverspend } from './rules/rule_01_rsya';
import { Rule02DeviceDisparity } from './rules/rule_02_device';
import { Rule03StrategyNoGoals } from './rules/rule_03_strategy';
import { Rule04ZeroConversionCampaigns } from './rules/rule_04_zero_conv';
import { Rule05CpaAnomaly } from './rules/rule_05_cpa_anomaly';
import { Rule06LowCtrWaste } from './rules/rule_06_low_ctr_waste';

export class AuditEngine {
  private rules: IAuditRule[];

  constructor(customRules?: IAuditRule[]) {
    this.rules = customRules || [
      new Rule01RsyaOverspend(),
      new Rule02DeviceDisparity(),
      new Rule03StrategyNoGoals(),
      new Rule04ZeroConversionCampaigns(),
      new Rule05CpaAnomaly(),
      new Rule06LowCtrWaste(),
    ];
  }

  public async runAudit(data: AuditInputData): Promise<AuditReportData> {
    const results: RuleResult[] = [];

    for (const rule of this.rules) {
      const res = await rule.execute(data);
      results.push(res);
    }

    // Расчет суммарных потерь (без двойного счета: берем максимум между пересекающимися правилами и кампаниями)
    // Чтобы потери не дублировались между правилом 01 (РСЯ) и правилом 04 (0 конверсий),
    // берем максимальную оценку неэффективного бюджета
    const flaggedRules = results.filter((r) => r.flagged);
    const rawTotalLoss = flaggedRules.reduce((sum, r) => sum + r.estimatedLossRub, 0);

    // Логическое ограничение потерь
    const boundedLossRub = Math.min(data.totalSpendRub, rawTotalLoss);
    const healthyBudgetRub = Math.max(0, data.totalSpendRub - boundedLossRub);

    // Health Score (0..100)
    let score = 100;
    for (const r of results) {
      if (r.flagged) {
        if (r.severity === 'CRITICAL') score -= 25;
        else if (r.severity === 'WARNING') score -= 12;
      }
    }
    score = Math.max(5, Math.min(100, score));

    return {
      overallScore: score,
      totalSpendRub: data.totalSpendRub,
      totalConversions: data.totalConversions,
      totalLossRub: boundedLossRub,
      totalPotentialLossRub: boundedLossRub,
      totalWasteRub: boundedLossRub,
      healthyBudgetRub,
      rules: results,
      campaignsCount: data.campaigns.length,
      generatedAt: new Date().toISOString(),
    };
  }
}

export const defaultAuditEngine = new AuditEngine();
