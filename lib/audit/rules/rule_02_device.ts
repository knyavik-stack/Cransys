import { IAuditRule, AuditInputData, RuleResult } from '../types';

export class Rule02DeviceDisparity implements IAuditRule {
  readonly id = 'RULE_02_DEVICE_DISPARITY';
  readonly name = 'Диспропорция эффективности устройств';

  execute(data: AuditInputData): RuleResult {
    let mobileSpend = 0;
    let mobileConv = 0;
    let desktopSpend = 0;
    let desktopConv = 0;

    for (const camp of data.campaigns) {
      mobileSpend += camp.mobileSpendRub || 0;
      mobileConv += camp.mobileConversions || 0;
      desktopSpend += camp.desktopSpendRub || 0;
      desktopConv += camp.desktopConversions || 0;
    }

    const mobileCpa = mobileConv > 0 ? mobileSpend / mobileConv : mobileSpend;
    const desktopCpa = desktopConv > 0 ? desktopSpend / desktopConv : desktopSpend;

    const isMobileDraining = mobileSpend > 2000 && mobileConv === 0 && desktopConv > 0;
    const isDisparity = isMobileDraining || (mobileSpend > 3000 && desktopConv > 0 && mobileCpa > desktopCpa * 2.5);

    let loss = 0;
    if (isMobileDraining) {
      loss = Math.round(mobileSpend);
    } else if (isDisparity) {
      loss = Math.round(mobileSpend * 0.6);
    }

    return {
      ruleId: this.id,
      severity: isDisparity ? 'WARNING' : 'INFO',
      title: 'Неэффективный расход на мобильных устройствах',
      fact: isMobileDraining
        ? `На мобильный трафик израсходовано ${mobileSpend.toLocaleString('ru-RU')} ₽ при 0 конверсиях, тогда как десктоп приносит заявки.`
        : isDisparity
        ? `Стоимость заявки с мобильных (${Math.round(mobileCpa).toLocaleString('ru-RU')} ₽) более чем в 2.5 раза выше десктопа (${Math.round(desktopCpa).toLocaleString('ru-RU')} ₽).`
        : 'Расход между смартфонами и компьютерами распределен равномерно.',
      flagged: isDisparity,
      estimatedLossRub: loss,
      recommendation:
        'Установите корректировку ставок -50% или -100% на мобильные устройства в кампаниях с низкой конверсией адаптивной посадочной страницы.',
      isLockedInExpress: true, // Доступно в тарифе Pro
    };
  }
}
