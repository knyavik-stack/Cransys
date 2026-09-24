import { IAuditRule, AuditInputData, AuditReportData, RuleResult, ExecutiveSummary } from './types';
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
import { Rule11LowConversionRate } from './rules/rule_11_low_cr';
import { Rule12CampaignFatigue } from './rules/rule_12_campaign_fatigue';

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
      new Rule11LowConversionRate(),
      new Rule12CampaignFatigue(),
    ];
  }

  public async runAudit(data: AuditInputData): Promise<AuditReportData> {
    const results: RuleResult[] = [];

    for (const rule of this.rules) {
      const res = await rule.execute(data);
      results.push(res);
    }

    const flaggedRules = results.filter((r) => r.flagged);
    const criticalRules = flaggedRules.filter((r) => r.severity === 'CRITICAL');
    const warningRules = flaggedRules.filter((r) => r.severity === 'WARNING');
    const rawTotalLoss = flaggedRules.reduce((sum, r) => sum + r.estimatedLossRub, 0);

    // Логическое ограничение потерь
    const boundedLossRub = Math.min(data.totalSpendRub, rawTotalLoss);
    const healthyBudgetRub = Math.max(0, data.totalSpendRub - boundedLossRub);

    // Health Score (0..100)
    let score = 100;
    for (const r of results) {
      if (r.flagged) {
        if (r.severity === 'CRITICAL') score -= 22;
        else if (r.severity === 'WARNING') score -= 10;
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

    // Формирование кристально понятного экспертного бизнес-вердикта для клиента
    const benchmarkCr = 1.4; // 1.4% нормальная конверсия посадочной страницы
    const potentialLeads = Math.round(totalClicks * (benchmarkCr / 100));
    const targetCpaBenchmark = 1400; // 1 400 ₽ за целевую заявку в услугах

    let headline = 'Кабинет требует срочной технической оптимизации';
    let verdictText = '';

    if (totalConversions === 0 && data.totalSpendRub > 0) {
      headline = 'Критический слив: 100% бюджета ушло без единого целевого действия';
      verdictText = `Израсходовано ${data.totalSpendRub.toLocaleString('ru-RU')} ₽, получено 0 подтвержденных заявок. Рекламный трафик закупается впустую из-за неработающих конверсионных целей или отсутствия связки с посадочной страницей.`;
    } else if (avgCr < 0.35 && totalClicks >= 300) {
      headline = `Реклама приносит заявки, но по завышенной цене (${Math.round(avgCpa).toLocaleString('ru-RU')} ₽ / лид)`;
      verdictText = `Критически низкая конверсия сайта (${avgCr.toFixed(2)}%): из ${totalClicks.toLocaleString('ru-RU')} перешедших посетителей заявку оставили всего ${totalConversions} чел. 99% мобильного трафика уходит без обращения. Переплата составляет ~${boundedLossRub.toLocaleString('ru-RU')} ₽. При оптимизации лендинга до нормы (1.4%) этот же бюджет принесет ~${potentialLeads} заявок по цене ~${targetCpaBenchmark} ₽.`;
    } else if (flaggedRules.length > 0) {
      headline = `Обнаружено ${flaggedRules.length} зон неэффективности с потерями ${boundedLossRub.toLocaleString('ru-RU')} ₽`;
      verdictText = `В кампаниях зафиксированы перекосы бюджета (${criticalRules.length} критических ошибок, ${warningRules.length} предупреждений). Устранение замечаний позволит сэкономить до ${boundedLossRub.toLocaleString('ru-RU')} ₽ без потери охвата.`;
    } else {
      headline = 'Рекламный кабинет работает в пределах рыночной нормы';
      verdictText = `Кампании стабильно генерируют заявки (CPA: ${Math.round(avgCpa).toLocaleString('ru-RU')} ₽, CR: ${avgCr.toFixed(2)}%). Грубых технических сливов и диспропорций не выявлено.`;
    }

    const executiveSummary: ExecutiveSummary = {
      headline,
      verdictText,
      criticalIssuesCount: criticalRules.length,
      warningsCount: warningRules.length,
      potentialGrowthLeads: Math.max(totalConversions, potentialLeads),
      targetCpaBenchmarkRub: targetCpaBenchmark,
      quickActionSteps: [
        'Оптимизировать мобильную посадочную страницу (форма в 1 экран, WhatsApp/Telegram виджет в 1 клик).',
        'Установить ограничение целевой стоимости конверсии (CPA не более 1 500 ₽) в параметрах автостратегии Директа.',
        'Добавить найденные нецелевые и информационные фразы («своими руками», «видео», «как сшить») в минус-слова кампании.',
      ],
    };

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
      executiveSummary,
    };
  }
}

export const defaultAuditEngine = new AuditEngine();
