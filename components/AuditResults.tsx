'use client';

import React, { useState } from 'react';
import { AuditReportData, RuleResult } from '@/lib/audit/types';
import {
  AlertTriangle,
  CheckCircle,
  Lock,
  Download,
  Flame,
  ArrowRight,
  ShieldAlert,
  Sparkles,
  FileText,
  RotateCcw,
} from 'lucide-react';

interface AuditResultsProps {
  report: AuditReportData;
  sourceName: string;
  onReset: () => void;
}

export function AuditResults({ report, sourceName, onReset }: AuditResultsProps) {
  const [selectedTier, setSelectedTier] = useState<'EXPRESS' | 'PRO' | 'MAX'>('EXPRESS');
  const [isPdfGenerating, setIsPdfGenerating] = useState(false);

  const flaggedRules = report.rules.filter((r) => r.flagged);
  const passedRules = report.rules.filter((r) => !r.flagged);

  const handleDownloadReport = () => {
    setIsPdfGenerating(true);
    setTimeout(() => {
      setIsPdfGenerating(false);
      // Генерация наглядного текстового/печатного отчета
      window.print();
    }, 600);
  };

  return (
    <div className="w-full max-w-5xl mx-auto space-y-8 animate-fadeIn">
      {/* Верхняя плашка сводки */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-sm">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700">
                Источник: {sourceName}
              </span>
              <span className="text-xs text-slate-400">
                {new Date(report.generatedAt).toLocaleDateString('ru-RU')}
              </span>
            </div>
            <h2 className="text-2xl font-bold text-slate-900">Результаты аудита кампаний</h2>
          </div>

          <button
            type="button"
            id="reset-audit-btn"
            onClick={onReset}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Проверить другой отчет</span>
          </button>
        </div>

        {/* Главные метрики */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-6">
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80">
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">
              Индекс здоровья кабинета
            </span>
            <div className="mt-2 flex items-baseline gap-2">
              <span
                className={`text-3xl font-extrabold font-mono ${
                  report.overallScore < 50
                    ? 'text-red-600'
                    : report.overallScore < 80
                    ? 'text-amber-600'
                    : 'text-emerald-600'
                }`}
              >
                {report.overallScore}/100
              </span>
              <span className="text-xs text-slate-500">
                {report.overallScore < 50 ? 'Критический слив' : 'Требует внимания'}
              </span>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-red-50 border border-red-200/80">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-red-700 uppercase tracking-wider">
                Выявленный слив бюджета
              </span>
              <Flame className="w-4 h-4 text-red-500" />
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-3xl font-extrabold font-mono text-red-600">
                {report.totalLossRub.toLocaleString('ru-RU')} ₽
              </span>
              <span className="text-xs text-red-500 font-medium">
                ({Math.round((report.totalLossRub / report.totalSpendRub) * 100)}% от расхода)
              </span>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-blue-50 border border-blue-200/80">
            <span className="text-xs font-medium text-blue-700 uppercase tracking-wider">
              Общий расход за период
            </span>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-3xl font-extrabold font-mono text-slate-900">
                {report.totalSpendRub.toLocaleString('ru-RU')} ₽
              </span>
              <span className="text-xs text-slate-500">{report.campaignsCount} кампаний</span>
            </div>
          </div>
        </div>
      </div>

      {/* Тарифная плашка переключения */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <div>
            <h3 className="text-lg font-bold text-slate-900">Уровень детализации отчета</h3>
            <p className="text-xs text-slate-500">
              Выберите тариф для разблокировки точных рекомендаций и готового ТЗ
            </p>
          </div>

          <div className="inline-flex p-1 bg-slate-100 rounded-xl border border-slate-200">
            <button
              type="button"
              onClick={() => setSelectedTier('EXPRESS')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                selectedTier === 'EXPRESS'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Экспресс (0 ₽)
            </button>
            <button
              type="button"
              onClick={() => setSelectedTier('PRO')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                selectedTier === 'PRO'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Pro (399 ₽)
            </button>
            <button
              type="button"
              onClick={() => setSelectedTier('MAX')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                selectedTier === 'MAX'
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              MAX (999 ₽)
            </button>
          </div>
        </div>

        {/* Карточки правил «Факт -> Флаг -> Сумма потерь» */}
        <div className="space-y-4">
          <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-red-600" />
            <span>Обнаруженные проблемы и точки слива</span>
          </h4>

          {flaggedRules.map((rule: RuleResult) => {
            const isLocked = selectedTier === 'EXPRESS' && rule.isLockedInExpress;

            return (
              <div
                key={rule.ruleId}
                className={`p-5 rounded-xl border transition-all ${
                  rule.severity === 'CRITICAL'
                    ? 'bg-red-50/40 border-red-200'
                    : 'bg-amber-50/40 border-amber-200'
                }`}
              >
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 mb-3">
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-xs font-bold px-2 py-0.5 rounded ${
                        rule.severity === 'CRITICAL'
                          ? 'bg-red-100 text-red-700'
                          : 'bg-amber-100 text-amber-700'
                      }`}
                    >
                      {rule.severity === 'CRITICAL' ? 'Критично' : 'Предупреждение'}
                    </span>
                    <h5 className="font-bold text-slate-900 text-base">{rule.title}</h5>
                  </div>

                  <div className="font-mono text-sm font-bold text-red-600 bg-red-100/70 px-2.5 py-1 rounded-md">
                    Потеря: ~{rule.estimatedLossRub.toLocaleString('ru-RU')} ₽
                  </div>
                </div>

                <div className="text-sm text-slate-700 mb-3 leading-relaxed">
                  <strong className="text-slate-900 font-semibold">Факт аудита:</strong> {rule.fact}
                </div>

                {isLocked ? (
                  <div className="p-3 rounded-lg bg-white/80 border border-slate-200 flex items-center justify-between text-xs text-slate-500">
                    <div className="flex items-center gap-2">
                      <Lock className="w-4 h-4 text-slate-400" />
                      <span>Рекомендация и пошаговый план исправления доступны в тарифе Pro</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSelectedTier('PRO')}
                      className="font-semibold text-blue-600 hover:text-blue-700 underline"
                    >
                      Разблокировать (399 ₽)
                    </button>
                  </div>
                ) : (
                  <div className="p-3.5 rounded-lg bg-white border border-slate-200 text-xs text-slate-700">
                    <strong className="text-blue-700 font-semibold block mb-1">
                      💡 Что сделать для остановки слива:
                    </strong>
                    {rule.recommendation}
                  </div>
                )}
              </div>
            );
          })}

          {passedRules.length > 0 && (
            <div className="pt-4">
              <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2 mb-3">
                <CheckCircle className="w-4 h-4 text-emerald-600" />
                <span>Проверенные параметры в норме</span>
              </h4>
              <div className="space-y-2">
                {passedRules.map((rule) => (
                  <div
                    key={rule.ruleId}
                    className="p-3.5 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-600 flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />
                      <span className="font-medium text-slate-800">{rule.title}</span>
                    </div>
                    <span className="text-slate-500 font-mono">0 ₽ потерь</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Действия и генерация отчетов */}
        <div className="mt-8 pt-6 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-xs text-slate-500">
            {selectedTier === 'EXPRESS' ? (
              <span>В экспресс-отчете показаны только первичные факты сливов.</span>
            ) : selectedTier === 'PRO' ? (
              <span className="text-blue-600 font-medium">
                Включены все 4 правила аудита с детализацией настроек Директа.
              </span>
            ) : (
              <span className="text-slate-900 font-medium">
                Тариф MAX включает PDF-отчет для руководства и техническое задание подрядчику.
              </span>
            )}
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button
              type="button"
              id="download-report-btn"
              onClick={handleDownloadReport}
              disabled={isPdfGenerating}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm shadow-sm transition-all"
            >
              {isPdfGenerating ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Формируем отчет...</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  <span>
                    {selectedTier === 'EXPRESS' ? 'Распечатать Экспресс-отчет' : 'Скачать PDF-отчет'}
                  </span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
