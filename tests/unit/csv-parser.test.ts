import { parseDirectExcel } from '../../lib/parser/excel-parser';

export function testCsvParser() {
  console.log('--- ТЕСТИРОВАНИЕ CSV ПАРСЕРА С ТОЧКОЙ С ЗАПЯТОЙ (;) ---');

  const csvContent = `Кампания;Расход (руб.);Клики;Показы;Конверсии;Тип площадки
РСЯ_Кухни_На_Заказ;12500,50;420;85000;0;Сети
Поиск_Шкафы_Купе;8900,00;180;3200;6;Поиск
Тестовая_Кампания_Общая;4300,00;95;14000;0;Сети`;

  const encoder = new TextEncoder();
  const uint8 = encoder.encode(csvContent);

  const parsed = parseDirectExcel(uint8);

  if (parsed.campaigns.length !== 3) {
    throw new Error(`Ожидалось 3 кампании, получено: ${parsed.campaigns.length}`);
  }

  if (parsed.totalSpendRub < 25000) {
    throw new Error(`Суммарный расход не сошелся: ${parsed.totalSpendRub}`);
  }

  console.log('✅ ТЕСТ CSV ПАРСЕРА С ТОЧКОЙ С ЗАПЯТОЙ ПРОЙДЕН УСПЕШНО!');
  return true;
}
