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
  ClipboardList,
} from 'lucide-react';
import { ContractorTaskModal } from './ContractorTaskModal';
import { AuditCharts } from './AuditCharts';
import { SearchQueryVisualizer } from './SearchQueryVisualizer';

interface AuditResultsProps {

  report: AuditReportData;
  sourceName: string;
  onReset: () => void;
}

export function AuditResults({ report, sourceName, onReset }: AuditResultsProps) {
  const [selectedTier, setSelectedTier] = useState<'EXPRESS' | 'PRO' | 'MAX'>('EXPRESS');
  const [isPdfGenerating, setIsPdfGenerating] = useState(false);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);

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
    <div className="w-full max-w-5xl mx-auto space-y-6 sm:space-y-8 animate-fadeIn">
      {/* Верхняя плашка сводки */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-6 lg:p-8 shadow-xs">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-5 border-b border-slate-100">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-1.5">
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-md bg-slate-100 text-slate-700 truncate max-w-[250px] sm:max-w-none">
                {sourceName}
              </span>
              <span className="text-[11px] text-slate-400">
                {new Date(report.generatedAt).toLocaleDateString('ru-RU')}
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">Результаты аудита кампаний</h2>
          </div>

          <button
            type="button"
            id="reset-audit-btn"
            onClick={onReset}
            className="print:hidden inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors shrink-0"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Другой отчет</span>
          </button>
        </div>

        {/* Главные метрики */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-5 pt-5">
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80">
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wider block">
              Индекс здоровья
            </span>
            <div className="mt-1.5 flex items-baseline gap-2">
              <span
                className={`text-2xl sm:text-3xl font-extrabold font-mono ${
                  report.overallScore < 50
                    ? 'text-red-600'
                    : report.overallScore < 80
                    ? 'text-amber-600'
                    : 'text-emerald-600'
                }`}
              >
                {report.overallScore}/100
              </span>
              <span className="text-[11px] text-slate-500">
                {report.overallScore < 50 ? 'Критический слив' : 'Требует внимания'}
              </span>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-red-50 border border-red-200/80">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-red-700 uppercase tracking-wider block">
                Слив бюджета
              </span>
              <Flame className="w-4 h-4 text-red-500" />
            </div>
            <div className="mt-1.5 flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-extrabold font-mono text-red-600">
                {report.totalLossRub.toLocaleString('ru-RU')} ₽
              </span>
              <span className="text-[11px] text-red-500 font-medium">
                ({Math.round((report.totalLossRub / (report.totalSpendRub || 1)) * 100)}%)
              </span>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-blue-50 border border-blue-200/80">
            <span className="text-xs font-medium text-blue-700 uppercase tracking-wider block">
              Расход за период
            </span>
            <div className="mt-1.5 flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-extrabold font-mono text-slate-900">
                {report.totalSpendRub.toLocaleString('ru-RU')} ₽
              </span>
              <span className="text-[11px] text-slate-500">{report.campaignsCount} камп.</span>
            </div>
          </div>
        </div>
      </div>

      {/* Интерактивные графики и симулятор окупаемости */}
      <AuditCharts report={report} />

      {/* AI-Анализ поисковых запросов и минус-слова (Шаг 6) */}
      {report.searchQueryAnalysis && (
        <SearchQueryVisualizer analysis={report.searchQueryAnalysis} />
      )}

      {/* Тарифная плашка переключения */}

      <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-6 shadow-xs">
        <div className="print:hidden flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-5">
          <div>
            <h3 className="text-base sm:text-lg font-bold text-slate-900">Уровень детализации отчета</h3>
            <p className="text-xs text-slate-500">
              Выберите тариф для разблокировки точных рекомендаций и ТЗ
            </p>
          </div>

          <div className="grid grid-cols-3 w-full sm:w-auto p-1 bg-slate-100 rounded-xl border border-slate-200 gap-0.5">
            <button
              type="button"
              onClick={() => setSelectedTier('EXPRESS')}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all text-center ${
                selectedTier === 'EXPRESS'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Экспресс (0 ₽)
            </button>
            <button
              type="button"
              onClick={() => setSelectedTier('PRO')}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all text-center ${
                selectedTier === 'PRO'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Pro (399 ₽)
            </button>
            <button
              type="button"
              onClick={() => setSelectedTier('MAX')}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all text-center ${
                selectedTier === 'MAX'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              MAX (999 ₽)
            </button>
          </div>
        </div>

        {/* Карточки правил «Факт -> Флаг -> Сумма потерь» */}
        <div className="space-y-3.5">
          <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-red-600 shrink-0" />
            <span>Обнаруженные проблемы и точки слива</span>
          </h4>

          {flaggedRules.map((rule: RuleResult) => {
            const isLocked = selectedTier === 'EXPRESS' && rule.isLockedInExpress;

            return (
              <div
                key={rule.ruleId}
                className={`p-4 sm:p-5 rounded-xl border transition-all ${
                  rule.severity === 'CRITICAL'
                    ? 'bg-red-50/40 border-red-200'
                    : 'bg-amber-50/40 border-amber-200'
                }`}
              >
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 mb-2.5">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span
                      className={`text-[11px] font-bold px-2 py-0.5 rounded ${
                        rule.severity === 'CRITICAL'
                          ? 'bg-red-100 text-red-700'
                          : 'bg-amber-100 text-amber-700'
                      }`}
                    >
                      {rule.severity === 'CRITICAL' ? 'Критично' : 'Предупреждение'}
                    </span>
                    <h5 className="font-bold text-slate-900 text-sm sm:text-base">{rule.title}</h5>
                  </div>

                  <div className="font-mono text-xs sm:text-sm font-bold text-red-600 bg-red-100/80 px-2.5 py-1 rounded-md shrink-0 self-start sm:self-auto">
                    Потеря: ~{rule.estimatedLossRub.toLocaleString('ru-RU')} ₽
                  </div>
                </div>

                <div className="text-xs sm:text-sm text-slate-700 mb-3 leading-relaxed">
                  <strong className="text-slate-900 font-semibold">Факт аудита:</strong> {rule.fact}
                </div>

                {isLocked ? (
                  <div className="p-3 rounded-lg bg-white/90 border border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs text-slate-500">
                    <div className="flex items-center gap-2">
                      <Lock className="w-4 h-4 text-slate-400 shrink-0" />
                      <span>Рекомендация и пошаговый план доступны в тарифе Pro</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSelectedTier('PRO')}
                      className="font-semibold text-blue-600 hover:text-blue-700 underline shrink-0"
                    >
                      Разблокировать (399 ₽)
                    </button>
                  </div>
                ) : (
                  <div className="p-3.5 rounded-lg bg-white border border-slate-200 text-xs text-slate-700 leading-relaxed">
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
            <div className="pt-3">
              <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2 mb-2.5">
                <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Проверенные параметры в норме</span>
              </h4>
              <div className="space-y-2">
                {passedRules.map((rule) => (
                  <div
                    key={rule.ruleId}
                    className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-600 flex items-center justify-between gap-2"
                  >
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />
                      <span className="font-medium text-slate-800">{rule.title}</span>
                    </div>
                    <span className="text-slate-500 font-mono text-[11px] shrink-0">0 ₽ потерь</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Действия и генерация отчетов */}
        <div className="print:hidden mt-6 pt-5 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-xs text-slate-500 text-center sm:text-left">
            {selectedTier === 'EXPRESS' ? (
              <span>В экспресс-отчете показаны первичные факты сливов.</span>
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

          <div className="flex flex-col sm:flex-row items-center gap-2.5 w-full sm:w-auto">
            <button
              type="button"
              id="open-task-btn"
              onClick={() => setIsTaskModalOpen(true)}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-800 font-semibold text-xs sm:text-sm transition-all"
            >
              <ClipboardList className="w-4 h-4 text-blue-600 shrink-0" />
              <span>Сформировать ТЗ подрядчику</span>
            </button>

            <button
              type="button"
              id="download-report-btn"
              onClick={handleDownloadReport}
              disabled={isPdfGenerating}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs sm:text-sm shadow-xs transition-all"
            >
              {isPdfGenerating ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin shrink-0" />
                  <span>Формируем отчет...</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4 shrink-0" />
                  <span>
                    {selectedTier === 'EXPRESS' ? 'Распечатать / В PDF' : 'Скачать PDF-отчет'}
                  </span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>


      {/* Модальное окно ТЗ подрядчику */}
      <ContractorTaskModal
        report={report}
        sourceName={sourceName}
        isOpen={isTaskModalOpen}
        onClose={() => setIsTaskModalOpen(false)}
      />
    </div>
  );
}
