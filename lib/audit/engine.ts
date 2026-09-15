import { IAuditRule, AuditInputData, AuditReportData, RuleResult } from './types';
import { Rule01RsyaOverspend } from './rules/rule_01_rsya';
import { Rule02DeviceDisparity } from './rules/rule_02_device';
import { Rule03StrategyNoGoals } from './rules/rule_03_strategy';
import { Rule04ZeroConversionCampaigns } from './rules/rule_04_zero_conv';

export class AuditEngine {
  private rules: IAuditRule[];

  constructor(customRules?: IAuditRule[]) {
    this.rules = customRules || [
      new Rule01RsyaOverspend(),
      new Rule02DeviceDisparity(),
      new Rule03StrategyNoGoals(),
      new Rule04ZeroConversionCampaigns(),
    ];
  }

  public async runAudit(data: AuditInputData): Promise<AuditReportData> {
    const results: RuleResult[] = [];

    for (const rule of this.rules) {
      const res = await rule.execute(data);
      results.push(res);
    }

    // Расчет суммарных потерь (без двойного счета)
    const totalLossRub = results
      .filter((r) => r.flagged)
      .reduce((sum, r) => sum + r.estimatedLossRub, 0);

    // Ограничение: потери не могут превышать 100% расхода
    const boundedLossRub = Math.min(data.totalSpendRub, totalLossRub);
    const healthyBudgetRub = Math.max(0, data.totalSpendRub - boundedLossRub);

    // Health Score (0..100)
    let score = 100;
    for (const r of results) {
      if (r.flagged) {
        if (r.severity === 'CRITICAL') score -= 30;
        else if (r.severity === 'WARNING') score -= 15;
      }
    }
    score = Math.max(5, Math.min(100, score));

    return {
      overallScore: score,
      totalSpendRub: data.totalSpendRub,
      totalLossRub: boundedLossRub,
      healthyBudgetRub,
      rules: results,
      campaignsCount: data.campaigns.length,
      generatedAt: new Date().toISOString(),
    };
  }
}

export const defaultAuditEngine = new AuditEngine();
