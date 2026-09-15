'use client';

import React, { useState } from 'react';
import { Copy, Check, X, Printer, ShieldAlert, FileCheck } from 'lucide-react';
import { AuditReportData } from '@/lib/audit/types';

interface ContractorTaskModalProps {
  report: AuditReportData;
  sourceName: string;
  isOpen: boolean;
  onClose: () => void;
}

export function ContractorTaskModal({ report, sourceName, isOpen, onClose }: ContractorTaskModalProps) {
  const [isCopied, setIsCopied] = useState(false);

  if (!isOpen) return null;

  const flaggedRules = report.rules.filter((r) => r.flagged);

  const taskText = `ТЕХНИЧЕСКОЕ ЗАДАНИЕ НА ОПТИМИЗАЦИЮ РЕКЛАМНЫХ КАМПАНИЙ ЯНДЕКС.ДИРЕКТ
По результатам независимого аудита Cransys
Дата: ${new Date(report.generatedAt).toLocaleDateString('ru-RU')}
Объект аудита: ${sourceName}
Зафиксированный слив бюджета: ${report.totalLossRub.toLocaleString('ru-RU')} ₽ (из ${report.totalSpendRub.toLocaleString('ru-RU')} ₽)
Индекс здоровья кабинета: ${report.overallScore}/100

---
СПИСОК ВЫЯВЛЕННЫХ КРИТИЧЕСКИХ НАРУШЕНИЙ:
${flaggedRules
  .map(
    (rule, idx) => `
${idx + 1}. [${rule.title}]
- Зафиксированный факт: ${rule.fact}
- Финансовые потери: ~${rule.estimatedLossRub.toLocaleString('ru-RU')} ₽
- Требуемое действие: ${rule.recommendation}
`
  )
  .join('')}

---
ОБЯЗАТЕЛЬНЫЕ ТРЕБОВАНИЯ К ПОДРЯДЧИКУ В ТЕЧЕНИЕ 48 ЧАСОВ:
1. Разделить кампании на Поиске и в РСЯ в разные рекламные кампании (если они объединены).
2. Выгрузить статистику площадок в РСЯ и добавить в запрещенные показы площадки с нулевыми конверсиями и расходом выше CPL.
3. Проверить корректировки ставок по устройствам (ПК / Мобильные) на основе процента отказов и цены цели.
4. Предоставить письменный отчет об устранении указанных замечаний.

Сформировано в системе аудита рекламы Cransys.`;

  const handleCopy = () => {
    navigator.clipboard.writeText(taskText);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden">
        {/* Заголовок */}
        <div className="p-5 sm:p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center">
              <FileCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">Техническое задание для подрядчика</h3>
              <p className="text-xs text-slate-500">
                Официальные требования директологу на основе аудита сливов
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Тело задания */}
        <div className="p-6 overflow-y-auto space-y-4 font-mono text-xs leading-relaxed bg-slate-50 text-slate-800 border-b border-slate-100 whitespace-pre-wrap select-all">
          {taskText}
        </div>

        {/* Подвал действий */}
        <div className="p-4 sm:p-5 bg-white flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <ShieldAlert className="w-4 h-4 text-amber-600" />
            <span>Готово к отправке в Telegram / Email или приложению к акту</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-semibold transition-colors"
            >
              <Printer className="w-4 h-4" />
              <span>Печать</span>
            </button>

            <button
              type="button"
              onClick={handleCopy}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition-colors"
            >
              {isCopied ? (
                <>
                  <Check className="w-4 h-4 text-emerald-300" />
                  <span>Скопировано!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  <span>Скопировать ТЗ</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
