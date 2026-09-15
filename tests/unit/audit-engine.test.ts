import { defaultAuditEngine } from '../../lib/audit/engine';
import { mockMeblironData } from '../fixtures/mebliron';

export async function runVerificationTest() {
  console.log('--- ЗАПУСК ТЕСТИРОВАНИЯ ДВИЖКА АУДИТА НА КЕЙСЕ МЕБЛИРОН ---');

  const report = await defaultAuditEngine.runAudit(mockMeblironData);

  console.log(`Общий расход: ${report.totalSpendRub} ₽`);
  console.log(`Обнаруженный слив: ${report.totalLossRub} ₽`);
  console.log(`Индекс здоровья: ${report.overallScore}/100`);

  const rsyaRule = report.rules.find((r) => r.ruleId === 'RULE_01_RSYA_OVERSPEND');
  if (!rsyaRule || !rsyaRule.flagged) {
    throw new Error('ТЕСТ ПРОВАЛЕН: Правило RULE_01_RSYA_OVERSPEND не сработало на сливе РСЯ!');
  }

  if (report.totalLossRub < 13000) {
    throw new Error(`ТЕСТ ПРОВАЛЕН: Сумма слива ${report.totalLossRub} ₽ ниже ожидаемой (~14 000+ ₽)`);
  }

  console.log('✅ ВСЕ ТЕСТЫ ДВИЖКА АУДИТА УСПЕШНО ПРОЙДЕНЫ!');
  return true;
}
