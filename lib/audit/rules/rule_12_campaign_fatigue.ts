import { IAuditRule, AuditInputData, RuleResult } from '../types';

export class Rule12CampaignFatigue implements IAuditRule {
  readonly id = 'RULE_12_CAMPAIGN_FATIGUE';
  readonly name = 'Затухание автостратегии и застой кампаний';

  execute(data: AuditInputData): RuleResult {
    // Находим кампании, которые остановились или перестали давать результат
    const fatiguedCampaigns = data.campaigns.filter((c) => {
      const isStopped = c.strategy.toLowerCase().includes('автостратегия') || c.strategy.toLowerCase().includes('кликов');
      return isStopped && c.conversions <= 5 && c.spendRub > 5000 && c.clicks > 1500;
    });

    const flagged = fatiguedCampaigns.length > 0;
    const loss = flagged
      ? Math.round(fatiguedCampaigns.reduce((sum, c) => sum + c.spendRub * 0.25, 0))
      : 0;

    return {
      ruleId: this.id,
      severity: flagged ? 'WARNING' : 'INFO',
      title: 'Затухание автостратегии («переобучение в тупик»)',
      fact: flagged
        ? `В ${fatiguedCampaigns.length} кампаниях объем кликов превышает 1 500, но темп поступления конверсий угас. Автостратегия Директа оптимизирует показы под дешевые просмотры, а не под покупателей с деньгами.`
        : 'Динамика обучения автостратегий стабильна.',
      flagged,
      estimatedLossRub: loss,
      recommendation:
        'Перезапустите обучение стратегии: смените ключевую цель на «Заявка / Заказ», увеличьте недельную цель по конверсиям или переведите на ручное управление ставками с удержанием в спецразмещении Поиска.',
      isLockedInExpress: false,
    };
  }
}
