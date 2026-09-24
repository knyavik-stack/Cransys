import { IAuditRule, AuditInputData, AuditReportData, RuleResult } from './types';
import { Rule01RsyaOverspend } from './rules/rule_01_rsya';
import { Rule02DeviceDisparity } from './rules/rule_02_device';
import { Rule03StrategyNoGoals } from './rules/rule_03_strategy';
import { Rule04ZeroConversionCampaigns } from './rules/rule_04_zero_conv';
import { Rule05CpaAnomaly } from './rules/rule_05_cpa_anomaly';
import { Rule06LowCtrWaste } from './rules/rule_06_low_ctr_waste';
import { Rule07SearchRsyaMix } from './rules/rule_07_search_rsya_mix';
import { Rule08HighCpcAnomaly } from './rules/rule_08_high_cpc';
import { Rule09AutotargetingDrain } from './rules/rule_09_autotargeting';
import { Rule10BudgetPacingDrain } from './rules/rule_10_budget_pacing';

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
      new Rule07SearchRsyaMix(),
      new Rule08HighCpcAnomaly(),
      new Rule09AutotargetingDrain(),
      new Rule10BudgetPacingDrain(),
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

    const totalClicks = data.campaigns.reduce((s, c) => s + (c.clicks || 0), 0);
    const totalImpressions = data.campaigns.reduce((s, c) => s + (c.impressions || 0), 0);
    const totalConversions =
      data.totalConversions !== undefined
        ? data.totalConversions
        : data.campaigns.reduce((s, c) => s + (c.conversions || 0), 0);

    const avgCtr = totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0;
    const avgCpc = totalClicks > 0 ? data.totalSpendRub / totalClicks : 0;
    const avgCr = totalClicks > 0 ? (totalConversions / totalClicks) * 100 : 0;
    const avgCpa = totalConversions > 0 ? data.totalSpendRub / totalConversions : 0;

    return {
      overallScore: score,
      totalSpendRub: data.totalSpendRub,
      totalConversions,
      totalClicks,
      totalImpressions,
      avgCtr: Math.round(avgCtr * 100) / 100,
      avgCpc: Math.round(avgCpc * 100) / 100,
      avgCr: Math.round(avgCr * 100) / 100,
      avgCpa: Math.round(avgCpa),
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
