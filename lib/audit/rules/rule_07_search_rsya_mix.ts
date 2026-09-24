import { IAuditRule, AuditInputData, RuleResult } from '../types';

export class Rule07SearchRsyaMix implements IAuditRule {
  readonly id = 'RULE_07_SEARCH_RSYA_MIX';
  readonly name = 'Смешанные показы «Поиск + РСЯ» в одной кампании';

  execute(data: AuditInputData): RuleResult {
    // Выявляем кампании, где в названии или типе смешаны Поиск и Сети, либо гибридные кампании без разделения
    const mixedCampaigns = data.campaigns.filter((c) => {
      const name = c.name.toLowerCase();
      const hasBoth =
        (name.includes('поиск') && (name.includes('рся') || name.includes('сеть'))) ||
        name.includes('поиск+рся') ||
        name.includes('поиск + рся') ||
        name.includes('все площадки');
      return hasBoth && c.spendRub > 1500;
    });

    const flagged = mixedCampaigns.length > 0;
    const totalSpend = mixedCampaigns.reduce((sum, c) => sum + c.spendRub, 0);
    // При смешивании средний слив оценивается в 30-35% из-за размытия ставок и автостратегий
    const loss = Math.round(totalSpend * 0.3);

    return {
      ruleId: this.id,
      severity: flagged ? 'CRITICAL' : 'INFO',
      title: 'Смешивание трафика Поиска и РСЯ в одной кампании',
      fact: flagged
        ? `В ${mixedCampaigns.length} кампаниях Поиск и Сети запущены совместно (расход: ${totalSpend.toLocaleString(
            'ru-RU'
          )} ₽). Сетевые показы обрушивают поисковый CTR и искажают обучение автостратегий.`
        : 'Поисковые и сетевые кампании разделены корректно.',
      flagged,
      estimatedLossRub: loss,
      recommendation:
        'Разделите кампании: создайте отдельные рекламные кампании исключительно для Поиска (с точечными фразами в кавычках) и отдельно для РСЯ с графическими баннерами.',
      isLockedInExpress: false,
    };
  }
}
