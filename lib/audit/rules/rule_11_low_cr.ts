import { IAuditRule, AuditInputData, RuleResult } from '../types';

export class Rule11LowConversionRate implements IAuditRule {
  readonly id = 'RULE_11_LOW_CONVERSION_RATE';
  readonly name = 'Критически низкая конверсия посадочной страницы (CR)';

  execute(data: AuditInputData): RuleResult {
    const totalClicks = data.campaigns.reduce((s, c) => s + (c.clicks || 0), 0);
    const totalConv =
      data.totalConversions !== undefined
        ? data.totalConversions
        : data.campaigns.reduce((s, c) => s + (c.conversions || 0), 0);
    const totalSpend = data.totalSpendRub || 0;

    const cr = totalClicks > 0 ? (totalConv / totalClicks) * 100 : 0;
    const avgCpa = totalConv > 0 ? totalSpend / totalConv : totalSpend;

    // Флаг срабатывает, если переходов много (> 400 кликов), а конверсия меньше 0.35%
    const isCriticalLowCr = totalClicks >= 400 && cr < 0.35 && totalSpend >= 4000;
    const benchmarkCr = 1.5; // Нормальная конверсия адаптивного сайта в услугах (1.5%)
    const expectedLeadsAtBenchmark = Math.round(totalClicks * (benchmarkCr / 100));
    const lostLeadsCount = Math.max(0, expectedLeadsAtBenchmark - totalConv);

    // Оценка переплаты: разница между фактическим CPA и рыночной нормой (1 500 ₽)
    const benchmarkCpa = 1500;
    const overpaidLoss = totalConv > 0 && avgCpa > benchmarkCpa
      ? Math.round((avgCpa - benchmarkCpa) * totalConv)
      : isCriticalLowCr
      ? Math.round(totalSpend * 0.6)
      : 0;

    return {
      ruleId: this.id,
      severity: isCriticalLowCr ? 'CRITICAL' : 'INFO',
      title: 'Критически низкая конверсия сайта (CR < 0.35%)',
      fact: isCriticalLowCr
        ? `Из ${totalClicks.toLocaleString('ru-RU')} привлеченных посетителей заявку оставили всего ${totalConv} чел. (конверсия сайта CR = ${cr.toFixed(2)}%). 99.9% рекламного трафика уходит без целевого действия. При нормальной конверсии (1.5%) вы бы получили ~${expectedLeadsAtBenchmark} заявок вместо ${totalConv}.`
        : `Коэффициент конверсии сайта находится в рабочей норме (CR = ${cr.toFixed(2)}%).`,
      flagged: isCriticalLowCr,
      estimatedLossRub: overpaidLoss,
      recommendation:
        'Проведите аудит мобильной посадочной страницы: добавьте кнопку быстрой связи в WhatsApp/Telegram в 1 клик, форму расчета стоимости в первый экран, фото реальных работ и отзывы клиентов. Текущий сайт теряет 99% платного трафика.',
      isLockedInExpress: false,
    };
  }
}
