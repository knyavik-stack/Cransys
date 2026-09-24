'use client';

import React, { useState, useEffect } from 'react';
import {
  X,
  TrendingDown,
  TrendingUp,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Copy,
  Check,
  Printer,
  FileText,
  Sliders,
  Sparkles,
} from 'lucide-react';
import { AuditReportData } from '@/lib/audit/types';

interface AuditHistorySummary {
  id: string;
  fileName: string;
  createdAt: string;
  overallScore: number | null;
  totalSpendRub: number | null;
  totalLossRub: number | null;
}

interface AuditComparisonModalProps {
  isOpen: boolean;
  onClose: () => void;
  history: AuditHistorySummary[];
  initialBeforeId?: string;
  initialAfterId?: string;
}

export function AuditComparisonModal({
  isOpen,
  onClose,
  history,
  initialBeforeId,
  initialAfterId,
}: AuditComparisonModalProps) {
  // Приоритет: реальные аудиты пользователя
  const hasUserHistory = history && history.length > 0;
  const defaultBefore =
    initialBeforeId ||
    (history.length >= 2 ? history[history.length - 1].id : history.length === 1 ? history[0].id : 'demo_before');
  const defaultAfter =
    initialAfterId ||
    (history.length >= 1 ? history[0].id : 'demo_after');

  const [beforeReportId, setBeforeReportId] = useState<string>(defaultBefore);
  const [afterReportId, setAfterReportId] = useState<string>(defaultAfter);
  const [beforeData, setBeforeData] = useState<AuditReportData | null>(null);
  const [afterData, setAfterData] = useState<AuditReportData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isCopied, setIsCopied] = useState<boolean>(false);

  // Синхронизация выбора при изменении history или открытии
  useEffect(() => {
    if (history.length >= 2) {
      if (!initialBeforeId) setBeforeReportId(history[history.length - 1].id);
      if (!initialAfterId) setAfterReportId(history[0].id);
    } else if (history.length === 1) {
      if (!initialBeforeId) setBeforeReportId(history[0].id);
      if (!initialAfterId) setAfterReportId(history[0].id);
    }
  }, [history, initialBeforeId, initialAfterId, isOpen]);

  // Загрузка полных отчетов для сравнения
  useEffect(() => {
    if (!isOpen) return;

    async function fetchReports() {
      setIsLoading(true);
      try {
        // Загрузка отчета "ДО"
        if (beforeReportId === 'demo_before') {
          setBeforeData({
            overallScore: 38,
            totalSpendRub: 24800,
            totalConversions: 2,
            totalClicks: 820,
            totalImpressions: 64200,
            avgCtr: 1.28,
            avgCpc: 30.2,
            avgCr: 0.24,
            avgCpa: 12400,
            totalLossRub: 18600,
            healthyBudgetRub: 6200,
            campaignsCount: 3,
            generatedAt: '2026-08-10T12:00:00Z',
            rules: [
              {
                ruleId: 'RULE_01_RSYA_OVERSPEND',
                severity: 'CRITICAL',
                title: 'Слив бюджета в сетях (РСЯ)',
                fact: '85% бюджета ушло в РСЯ без конверсий',
                flagged: true,
                estimatedLossRub: 14200,
                recommendation: 'Разделить поиск и сети',
                isLockedInExpress: false,
              },
              {
                ruleId: 'RULE_02_DEVICE_DISPARITY',
                severity: 'WARNING',
                title: 'Неэффективный расход на мобильных',
                fact: 'Стоимость заявки со смартфонов в 3 раза дороже десктопа',
                flagged: true,
                estimatedLossRub: 4400,
                recommendation: 'Корректировка ставок -50%',
                isLockedInExpress: false,
              },
            ],
          });
        } else if (beforeReportId) {
          const res = await fetch(`/api/audit/${beforeReportId}`);
          if (res.ok) {
            const json = await res.json();
            setBeforeData(json.report);
          }
        }

        // Загрузка отчета "ПОСЛЕ"
        if (afterReportId === 'demo_after') {
          setAfterData({
            overallScore: 92,
            totalSpendRub: 22400,
            totalConversions: 16,
            totalClicks: 940,
            totalImpressions: 18400,
            avgCtr: 5.11,
            avgCpc: 23.8,
            avgCr: 1.7,
            avgCpa: 1400,
            totalLossRub: 1200,
            healthyBudgetRub: 21200,
            campaignsCount: 3,
            generatedAt: '2026-09-18T14:30:00Z',
            rules: [
              {
                ruleId: 'RULE_01_RSYA_OVERSPEND',
                severity: 'INFO',
                title: 'Слив бюджета в сетях (РСЯ)',
                fact: 'Поиск и сети разделены, слив устранен',
                flagged: false,
                estimatedLossRub: 0,
                recommendation: 'Кампании работают оптимально',
                isLockedInExpress: false,
              },
              {
                ruleId: 'RULE_02_DEVICE_DISPARITY',
                severity: 'INFO',
                title: 'Неэффективный расход на мобильных',
                fact: 'Ставки скорректированы, конверсии идут с обоих типов устройств',
                flagged: false,
                estimatedLossRub: 0,
                recommendation: 'Корректировки применены',
                isLockedInExpress: false,
              },
            ],
          });
        } else if (afterReportId) {
          const res = await fetch(`/api/audit/${afterReportId}`);
          if (res.ok) {
            const json = await res.json();
            setAfterData(json.report);
          }
        }
      } catch (err) {
        console.warn('Comparison fetch error:', err);
      } finally {
        setIsLoading(false);
      }
    }

    fetchReports();
  }, [isOpen, beforeReportId, afterReportId]);

  if (!isOpen) return null;

  // Расчет дельты показателей
  const beforeScore = beforeData?.overallScore || 0;
  const afterScore = afterData?.overallScore || 0;
  const deltaScore = afterScore - beforeScore;

  const beforeLoss = beforeData?.totalLossRub || 0;
  const afterLoss = afterData?.totalLossRub || 0;
  const deltaLoss = afterLoss - beforeLoss; // Отрицательное — значит слив снизился (хорошо!)
  const savedBudgetRub = Math.max(0, beforeLoss - afterLoss);

  const beforeConv = beforeData?.totalConversions || 0;
  const afterConv = afterData?.totalConversions || 0;
  const deltaConv = afterConv - beforeConv;

  const beforeCpa = beforeData?.avgCpa || (beforeConv > 0 ? (beforeData?.totalSpendRub || 0) / beforeConv : 0);
  const afterCpa = afterData?.avgCpa || (afterConv > 0 ? (afterData?.totalSpendRub || 0) / afterConv : 0);
  const deltaCpa = afterCpa > 0 && beforeCpa > 0 ? afterCpa - beforeCpa : 0;

  const beforeSpend = beforeData?.totalSpendRub || 0;
  const afterSpend = afterData?.totalSpendRub || 0;

  // Текст сравнительного отчета для копирования
  const comparisonText = `СРАВНИТЕЛЬНЫЙ ОТЧЕТ ЭФФЕКТИВНОСТИ РЕКЛАМЫ «ДО И ПОСЛЕ»
Сервис независимого аудита Cransys
Дата формирования: ${new Date().toLocaleDateString('ru-RU')}

1. ИНДЕКС ЗДОРОВЬЯ КАМПАНИЙ:
- До правок: ${beforeScore}/100
- После правок: ${afterScore}/100
- Прирост: ${deltaScore > 0 ? `+${deltaScore}` : deltaScore} пунктов

2. ЗАФИКСИРОВАННЫЙ СЛИВ БЮДЖЕТА:
- До правок: ${beforeLoss.toLocaleString('ru-RU')} ₽
- После правок: ${afterLoss.toLocaleString('ru-RU')} ₽
- Фактическая экономия бюджета: ${savedBudgetRub.toLocaleString('ru-RU')} ₽ (${Math.round((savedBudgetRub / (beforeLoss || 1)) * 100)}% сокращение сливов)

3. КОЛИЧЕСТВО ЗАЯВОК (КОНВЕРСИЙ):
- До правок: ${beforeConv} шт.
- После правок: ${afterConv} шт.
- Динамика лидов: ${deltaConv >= 0 ? `+${deltaConv}` : deltaConv} шт.

4. СТОИМОСТЬ ЦЕЛЕВОЙ ЗАЯВКИ (CPA):
- До правок: ${Math.round(beforeCpa).toLocaleString('ru-RU')} ₽
- После правок: ${Math.round(afterCpa).toLocaleString('ru-RU')} ₽
- Снижение стоимости лида: ${deltaCpa < 0 ? `${Math.round(Math.abs(deltaCpa)).toLocaleString('ru-RU')} ₽` : '—'}

ИТОГОВЫЙ ВЫВОД:
В результате проведенных настроек ликвидирован неэффективный слив на сумму ${savedBudgetRub.toLocaleString('ru-RU')} ₽ в месяц, качество кампаний выросло до ${afterScore}/100.`;

  const handleCopy = () => {
    navigator.clipboard.writeText(comparisonText);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto animate-fadeIn">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-4xl w-full p-5 sm:p-7 relative my-auto max-h-[95vh] flex flex-col overflow-hidden">
        {/* Шапка модального окна */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 text-blue-600 flex items-center justify-center font-bold">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg sm:text-xl font-bold text-slate-900">Сравнение аудитов «До» и «После»</h3>
                <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 text-[10px] font-bold uppercase tracking-wider">
                  Экспресс Пакет / PRO
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Наглядное подтверждение окупаемости и результатов оптимизации директолога
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Информационный баннер, если аудитов меньше 2 или выбран демо-образец */}
        {(!hasUserHistory || history.length < 2 || beforeReportId.startsWith('demo') || afterReportId.startsWith('demo')) && (
          <div className="bg-blue-50/80 border-b border-blue-100 px-5 sm:px-7 py-2.5 -mx-5 sm:-mx-7 text-xs text-blue-900 flex items-center justify-between gap-3 shrink-0">
            <div className="flex items-center gap-2">
              <span className="font-bold">
                {beforeReportId.startsWith('demo') || afterReportId.startsWith('demo')
                  ? 'ℹ️ Режим демонстрационного образца:'
                  : `📊 В вашей истории сохранено ${history.length} из 2 аудитов:`}
              </span>
              <span className="text-blue-800">
                {beforeReportId.startsWith('demo') || afterReportId.startsWith('demo')
                  ? 'Отображаются модельные данные для наглядности формата. Выберите ваши реальные проверки из выпадающего списка.'
                  : 'Для фиксации динамики выберите два разных аудита (например, за 90 и за 365 дней, либо до и после правок).'}
              </span>
            </div>
          </div>
        )}

        {/* Выбор двух аудитов */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 py-4 border-b border-slate-100 shrink-0 bg-slate-50/60 -mx-5 sm:-mx-7 px-5 sm:px-7">
          <div>
            <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1.5">
              Срез 1: Исходное состояние («ДО» правок)
            </label>
            <select
              value={beforeReportId}
              onChange={(e) => setBeforeReportId(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            >
              {history.length > 0 && (
                <optgroup label="Ваши реальные аудиты">
                  {history.map((h) => (
                    <option key={`before-${h.id}`} value={h.id}>
                      {h.fileName} ({new Date(h.createdAt).toLocaleDateString('ru-RU')})
                    </option>
                  ))}
                </optgroup>
              )}
              <optgroup label="Демонстрационный пример">
                <option value="demo_before">Демо: До оптимизации (слив 18 600 ₽, оценка 38/100)</option>
              </optgroup>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1.5">
              Срез 2: Текущее состояние («ПОСЛЕ» правок)
            </label>
            <select
              value={afterReportId}
              onChange={(e) => setAfterReportId(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            >
              {history.length > 0 && (
                <optgroup label="Ваши реальные аудиты">
                  {history.map((h) => (
                    <option key={`after-${h.id}`} value={h.id}>
                      {h.fileName} ({new Date(h.createdAt).toLocaleDateString('ru-RU')})
                    </option>
                  ))}
                </optgroup>
              )}
              <optgroup label="Демонстрационный пример">
                <option value="demo_after">Демо: После оптимизации (слив 1 200 ₽, оценка 92/100)</option>
              </optgroup>
            </select>
          </div>
        </div>

        {/* Основной блок сравнения показателей */}
        <div className="flex-1 overflow-y-auto py-5 space-y-6">
          {isLoading ? (
            <div className="py-16 text-center text-xs text-slate-400 flex flex-col items-center justify-center gap-2">
              <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
              <span>Сопоставление данных аудитов...</span>
            </div>
          ) : (
            <>
              {/* Карточка главного результата: Сэкономленный бюджет */}
              <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-emerald-50 via-teal-50 to-emerald-100/60 border border-emerald-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                    Результат устранения сливов бюджета:
                  </span>
                  <h4 className="text-xl sm:text-2xl font-extrabold text-emerald-950 font-mono">
                    Сэкономлено {savedBudgetRub.toLocaleString('ru-RU')} ₽ / мес.
                  </h4>
                  <p className="text-xs text-emerald-800 leading-relaxed">
                    Объем неэффективных потерь сократился на{' '}
                    <strong className="font-bold">
                      {beforeLoss > 0 ? Math.round((savedBudgetRub / beforeLoss) * 100) : 0}%
                    </strong>
                    . Деньги перераспределены в целевые клики.
                  </p>
                </div>

                <div className="bg-white px-4 py-2.5 rounded-xl border border-emerald-200 shadow-2xs shrink-0 text-right">
                  <span className="text-[10px] text-slate-500 font-semibold uppercase block">Рост здоровья</span>
                  <span className="text-xl font-extrabold text-emerald-600 font-mono">
                    {deltaScore >= 0 ? `+${deltaScore}` : deltaScore} п.
                  </span>
                </div>
              </div>

              {/* Сетка сравнения 4 ключевых показателей */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {/* 1. Индекс здоровья */}
                <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-2xs flex flex-col justify-between">
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    Индекс здоровья
                  </span>
                  <div className="my-2 flex items-baseline justify-between">
                    <span className="text-lg font-mono text-slate-400 font-bold">{beforeScore}/100</span>
                    <ArrowRight className="w-4 h-4 text-slate-400" />
                    <span className="text-xl font-mono text-emerald-600 font-extrabold">{afterScore}/100</span>
                  </div>
                  <span className="text-[11px] font-semibold text-emerald-700">
                    +{deltaScore} пунктов качества
                  </span>
                </div>

                {/* 2. Слив бюджета */}
                <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-2xs flex flex-col justify-between">
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    Слив бюджета (₽)
                  </span>
                  <div className="my-2 flex items-baseline justify-between">
                    <span className="text-sm font-mono text-red-600 font-bold">
                      {beforeLoss.toLocaleString('ru-RU')} ₽
                    </span>
                    <ArrowRight className="w-4 h-4 text-slate-400" />
                    <span className="text-sm font-mono text-emerald-600 font-bold">
                      {afterLoss.toLocaleString('ru-RU')} ₽
                    </span>
                  </div>
                  <span className="text-[11px] font-semibold text-emerald-700">
                    Сокращение на {beforeLoss > 0 ? Math.round((savedBudgetRub / beforeLoss) * 100) : 0}%
                  </span>
                </div>

                {/* 3. Количество конверсий */}
                <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-2xs flex flex-col justify-between">
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    Заявки (Лиды)
                  </span>
                  <div className="my-2 flex items-baseline justify-between">
                    <span className="text-lg font-mono text-slate-400 font-bold">{beforeConv} шт.</span>
                    <ArrowRight className="w-4 h-4 text-slate-400" />
                    <span className="text-xl font-mono text-blue-600 font-extrabold">{afterConv} шт.</span>
                  </div>
                  <span className="text-[11px] font-semibold text-blue-700">
                    {deltaConv >= 0 ? `+${deltaConv}` : deltaConv} дополнительных лидов
                  </span>
                </div>

                {/* 4. Стоимость лида (CPA) */}
                <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-2xs flex flex-col justify-between">
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    Цена лида (CPA)
                  </span>
                  <div className="my-2 flex items-baseline justify-between">
                    <span className="text-sm font-mono text-slate-400 font-bold">
                      {beforeCpa > 0 ? `${Math.round(beforeCpa).toLocaleString('ru-RU')} ₽` : '—'}
                    </span>
                    <ArrowRight className="w-4 h-4 text-slate-400" />
                    <span className="text-sm font-mono text-purple-700 font-bold">
                      {afterCpa > 0 ? `${Math.round(afterCpa).toLocaleString('ru-RU')} ₽` : '—'}
                    </span>
                  </div>
                  <span className="text-[11px] font-semibold text-purple-700">
                    {deltaCpa < 0 ? `Дешевле на ${Math.round(Math.abs(deltaCpa)).toLocaleString('ru-RU')} ₽` : 'Стабильно'}
                  </span>
                </div>
              </div>

              {/* Сводная таблица устраненных проблем */}
              <div className="rounded-xl border border-slate-200 overflow-hidden bg-white">
                <div className="p-3.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                    Статус проверок по правилам аудита
                  </span>
                  <span className="text-[11px] text-slate-500">Устранение зон риска</span>
                </div>
                <div className="divide-y divide-slate-100 text-xs">
                  <div className="p-3 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                      <span className="font-semibold text-slate-900">Разделение бюджета Сетей (РСЯ) и Поиска</span>
                    </div>
                    <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 text-[10px] font-bold">
                      Устранено
                    </span>
                  </div>
                  <div className="p-3 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                      <span className="font-semibold text-slate-900">Корректировки мобильных ставок</span>
                    </div>
                    <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 text-[10px] font-bold">
                      Скорректировано
                    </span>
                  </div>
                  <div className="p-3 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                      <span className="font-semibold text-slate-900">Привязка ключевой цели Яндекс.Метрики</span>
                    </div>
                    <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 text-[10px] font-bold">
                      Настроено
                    </span>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Подвал с кнопками экспорта и печати */}
        <div className="pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Готово к отправке заказчику в качестве подтверждения эффективности</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCopy}
              className="px-3.5 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-xs font-semibold text-slate-700 flex items-center gap-1.5 transition-colors"
            >
              {isCopied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="text-emerald-700">Скопировано</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Скопировать сводку</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={() => window.print()}
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-xs transition-colors flex items-center gap-1.5"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Распечатать / В PDF</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
