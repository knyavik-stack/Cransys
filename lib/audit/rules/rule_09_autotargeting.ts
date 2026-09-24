import { IAuditRule, AuditInputData, RuleResult } from '../types';

export class Rule09AutotargetingDrain implements IAuditRule {
  readonly id = 'RULE_09_AUTOTARGETING_DRAIN';
  readonly name = 'Слив бюджета на неконтролируемом автотаргетинге';

  execute(data: AuditInputData): RuleResult {
    // В кампаниях с названиями Мастер Кампаний / Товарная / Автотаргетинг или поисковых без жестких минус-слов
    const autoTargetingCampaigns = data.campaigns.filter((c) => {
      const name = c.name.toLowerCase();
      const isAuto =
        name.includes('автотаргетинг') ||
        name.includes('мастер') ||
        name.includes('мк') ||
        name.includes('товарн');
      return isAuto && c.conversions === 0 && c.spendRub > 2500;
    });

    const flagged = autoTargetingCampaigns.length > 0;
    const totalSpend = autoTargetingCampaigns.reduce((sum, c) => sum + c.spendRub, 0);
    const loss = Math.round(totalSpend * 0.75);

    return {
      ruleId: this.id,
      severity: flagged ? 'CRITICAL' : 'INFO',
      title: 'Слив бюджета алгоритмом Автотаргетинга',
      fact: flagged
        ? `В ${autoTargetingCampaigns.length} кампаниях включен широкий автотаргетинг без конверсий: потрачено ${totalSpend.toLocaleString(
            'ru-RU'
          )} ₽ на околоцелевые и околоинформационные запросы.`
        : 'Автотаргетинг работает в допустимых рамках либо ограничен минус-словами.',
      flagged,
      estimatedLossRub: loss,
      recommendation:
        'В настройках автотаргетинга оставьте только «Целевые запросы». Отключите «Широкие», «Сопутствующие» и «Альтернативные» категории, которые сжигают бюджет на информационных кликах.',
      isLockedInExpress: false,
    };
  }
}
