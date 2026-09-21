'use client';

import React, { useState } from 'react';
import { AuditReportData, RuleResult } from '@/lib/audit/types';
import { useUser } from '@/lib/auth/user-context';
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
  Building2,
  Settings,
  CreditCard,
  Crown,
  Check,
  Zap,
} from 'lucide-react';
import { ContractorTaskModal } from './ContractorTaskModal';
import { AuditCharts } from './AuditCharts';
import { SearchQueryVisualizer } from './SearchQueryVisualizer';
import { PricingModal } from './PricingModal';
import { WhiteLabelSettingsModal } from './WhiteLabelSettingsModal';
import { UserTier, getTierConfig, isFeatureAllowed } from '@/lib/billing/tiers';

interface AuditResultsProps {
  report: AuditReportData;
  sourceName: string;
  onReset: () => void;
}

export function AuditResults({ report, sourceName, onReset }: AuditResultsProps) {
  const { user, isAllowed, isTester, setTier } = useUser();
  const [isPdfGenerating, setIsPdfGenerating] = useState(false);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [isPricingModalOpen, setIsPricingModalOpen] = useState(false);
  const [isWhiteLabelModalOpen, setIsWhiteLabelModalOpen] = useState(false);

  const isDemoReport = Boolean(
    report.isDemo ||
    sourceName.includes('demo_') ||
    sourceName.includes('Демо')
  );

  const isTesterAccount = isTester || user?.role === 'TESTER_ADMIN' || user?.email === 'test-owner@cransys-audit.ru';
  // Демо-отчет никогда не заблюрен ни для зарегистрированных, ни для незарегистрированных пользователей
  const isPaidUser = isDemoReport || isTesterAccount || Boolean(user?.hasPaid);

  const tierConfig = getTierConfig(user?.tier);
  const hasWhiteLabel = isPaidUser && (isAllowed('whiteLabel') || user?.tier === 'MAX' || user?.tier === 'CORP');
  const isExpressTier = !isDemoReport && (!user?.tier || user?.tier === 'EXPRESS_SINGLE' || user?.tier === 'EXPRESS_PACK');

  const flaggedRules = report.rules.filter((r) => r.flagged);
  const passedRules = report.rules.filter((r) => !r.flagged);

  const handleDownloadReport = () => {
    if (!isPaidUser) {
      setIsPricingModalOpen(true);
      return;
    }
    setIsPdfGenerating(true);
    setTimeout(() => {
      setIsPdfGenerating(false);
      window.print();
    }, 500);
  };

  const handleOpenContractorTask = () => {
    if (!isPaidUser) {
      setIsPricingModalOpen(true);
      return;
    }
    setIsTaskModalOpen(true);
  };

  return (
    <div className="w-full max-w-5xl mx-auto space-y-6 sm:space-y-8 animate-fadeIn">
      {/* Суперюзер: Sandbox-панель тестирования тарифов (ТОЛЬКО для тестового аккаунта) */}
      {isTesterAccount && (
        <div className="p-4 sm:p-5 rounded-2xl bg-amber-500/10 border-2 border-amber-400 text-amber-950 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-xs">
              <Crown className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-sm font-bold text-amber-900">
                  Тестовый суперюзер (Собственник): Быстрый выбор тарифа
                </h4>
                <span className="px-2 py-0.5 rounded-full bg-amber-200 text-amber-800 text-[10px] font-bold uppercase tracking-wider">
                  0 ₽ / Sandbox
                </span>
              </div>
              <p className="text-xs text-amber-800">
                Переключайте уровень тарифа в один клик для проверки всех функций отчета и брендинга
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-1.5 w-full sm:w-auto">
            {(
              [
                { id: 'EXPRESS_SINGLE' as UserTier, label: 'Экспресс (1)' },
                { id: 'EXPRESS_PACK' as UserTier, label: 'Пакет (3)' },
                { id: 'PRO' as UserTier, label: 'PRO (10+API)' },
                { id: 'MAX' as UserTier, label: 'MAX (30+WL)' },
                { id: 'CORP' as UserTier, label: 'Corp (500)' },
              ] as const
            ).map((t) => {
              const active = user?.tier === t.id;
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setTier(t.id, true)}
                  className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all ${
                    active
                      ? 'bg-amber-800 text-white shadow-xs'
                      : 'bg-white text-slate-800 hover:bg-amber-100 border border-amber-300'
                  }`}
                >
                  {t.label}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* White-label шапка агентства (Тариф MAX/Corp / Брендинг) */}
      {hasWhiteLabel && (user?.agencyName || user?.name) ? (
        <div className="bg-gradient-to-r from-purple-900 to-indigo-950 text-white rounded-2xl p-5 sm:p-6 shadow-md border border-purple-800/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-purple-500/30 border border-purple-400/40 text-[10px] font-bold uppercase tracking-wider text-purple-200">
                White-label Аудит
              </span>
              <span className="text-xs text-purple-300">Коммерческий отчет для клиента</span>
            </div>
            <h3 className="text-lg sm:text-xl font-bold text-white tracking-tight">
              {user?.agencyName || 'Ваше Агентство / Эксперт по рекламе'}
            </h3>
            <div className="flex flex-wrap items-center gap-3 text-xs text-purple-200 pt-1">
              {user?.agencyContact && <span>📞 {user.agencyContact}</span>}
              {user?.agencyWebsite && <span>🌐 {user.agencyWebsite}</span>}
              {!user?.agencyContact && !user?.agencyWebsite && (
                <span>Контакты не указаны (нажмите «Настроить брендинг»)</span>
              )}
            </div>
            {user?.customNotes && (
              <p className="text-xs text-purple-100 bg-white/10 p-2.5 rounded-xl mt-2 border border-white/10 max-w-2xl leading-relaxed">
                💬 <strong>Комментарий специалиста:</strong> {user.customNotes}
              </p>
            )}
          </div>

          <button
            type="button"
            onClick={() => setIsWhiteLabelModalOpen(true)}
            className="print:hidden px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-xs font-semibold text-white transition-all flex items-center gap-1.5 shrink-0"
          >
            <Settings className="w-3.5 h-3.5 text-purple-300" />
            <span>Настроить брендинг</span>
          </button>
        </div>
      ) : isPaidUser && (user?.tier === 'MAX' || user?.tier === 'CORP') ? (
        <div className="print:hidden bg-gradient-to-r from-purple-900/90 to-indigo-900 text-white rounded-2xl p-4 sm:p-5 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border border-purple-700">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-purple-500/20 border border-purple-400/30 flex items-center justify-center text-purple-300 shrink-0">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs sm:text-sm font-bold text-white">White-label включен в ваш тариф {tierConfig.name}</h4>
              <p className="text-[11px] sm:text-xs text-purple-200">
                Добавьте название агентства, телефон и логотип для оформления коммерческих PDF-отчетов
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setIsWhiteLabelModalOpen(true)}
            className="px-3.5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold shadow-xs transition-all shrink-0 flex items-center gap-1.5"
          >
            <Settings className="w-3.5 h-3.5" />
            <span>Настроить брендинг</span>
          </button>
        </div>
      ) : null}

      {/* Верхняя плашка сводки с поверхностными цифрами */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-6 lg:p-8 shadow-xs">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-5 border-b border-slate-100">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-1.5">
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-md bg-slate-100 text-slate-700 truncate max-w-[250px] sm:max-w-none">
                {sourceName}
              </span>
              {isDemoReport && (
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 border border-emerald-200">
                  Демонстрационный отчет (Без списания тарифа)
                </span>
              )}
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

        {/* Главные поверхностные метрики (доступны всем) */}
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

      {/* БЛОК ДЛЯ НЕОПЛАЧЕННЫХ ПОЛЬЗОВАТЕЛЕЙ: Заблюренный тизер с призывом оплатить тариф */}
      {!isPaidUser ? (
        <div className="relative rounded-2xl overflow-hidden border-2 border-blue-200 bg-white shadow-sm p-6 sm:p-8 space-y-6">
          {/* Плашка с предложением оформить тариф */}
          <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white p-6 sm:p-8 rounded-2xl shadow-lg border border-blue-700 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="space-y-2 max-w-xl">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/20 border border-blue-400/40 text-blue-300 text-xs font-bold">
                <Lock className="w-3.5 h-3.5" />
                <span>Полный отчет заблокирован</span>
              </div>
              <h3 className="text-xl sm:text-2xl font-bold tracking-tight">
                Обнаружено сливов на {report.totalLossRub.toLocaleString('ru-RU')} ₽
              </h3>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                Вы видите только поверхностные цифры. Чтобы открыть пошаговые рекомендации по остановке сливов, список мусорных площадок РСЯ, список минус-слов, сформировать ТЗ подрядчику и скачать отчет в PDF — выберите подходящий тариф.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setIsPricingModalOpen(true)}
              className="px-6 py-3.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-bold shadow-lg shadow-blue-600/30 transition-all flex items-center gap-2 shrink-0 self-start md:self-auto animate-pulse"
            >
              <CreditCard className="w-4 h-4" />
              <span>Разблокировать полный отчет</span>
            </button>
          </div>

          {/* Заблюренный предпросмотр детальных графиков и правил */}
          <div className="relative select-none pointer-events-none filter blur-sm opacity-60 space-y-6">
            <AuditCharts report={report} />
            <div className="space-y-3">
              {flaggedRules.slice(0, 3).map((rule, idx) => (
                <div key={idx} className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="font-bold text-slate-900 text-sm">{rule.title}</div>
                  <div className="text-xs text-slate-600 mt-1">
                    Детализация слива и пошаговый алгоритм устранения ошибки в Директе...
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <>
          {/* Полная детализация для ОПЛАЧЕННЫХ пользователей */}
          {/* Интерактивные графики и симулятор окупаемости */}
          <AuditCharts report={report} />

          {/* AI-Анализ поисковых запросов и минус-слова (PRO / MAX / CORP) */}
          {report.searchQueryAnalysis && (
            <SearchQueryVisualizer analysis={report.searchQueryAnalysis} />
          )}

          {/* Карточки правил аудита «Факт -> Флаг -> Сумма потерь» */}
          <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-6 shadow-xs space-y-4">
            <div className="print:hidden flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-base sm:text-lg font-bold text-slate-900">Детализация проверок и сливов</h3>
                <p className="text-xs text-slate-500">
                  Текущий тариф: <strong className="text-blue-600 font-semibold">{tierConfig.name} ({tierConfig.priceFormatted})</strong>
                </p>
              </div>

              {!isTesterAccount && (
                <button
                  type="button"
                  onClick={() => setIsPricingModalOpen(true)}
                  className="px-3.5 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-semibold border border-blue-200 transition-all flex items-center gap-1.5"
                >
                  <CreditCard className="w-3.5 h-3.5" />
                  <span>Тарифы и лимиты</span>
                </button>
              )}
            </div>

            <div className="space-y-3.5">
              <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-red-600 shrink-0" />
                <span>Обнаруженные проблемы и точки слива бюджета</span>
              </h4>

              {flaggedRules.map((rule: RuleResult) => {
                const isLocked = isExpressTier && rule.isLockedInExpress;

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
                          <span>Рекомендация и пошаговый план доступны в тарифе PRO / MAX / Corp</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => setIsPricingModalOpen(true)}
                          className="font-semibold text-blue-600 hover:text-blue-700 underline shrink-0"
                        >
                          Разблокировать в PRO
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

            {/* Действия и выгрузка отчетов */}
            <div className="print:hidden mt-6 pt-5 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="text-xs text-slate-500 text-center sm:text-left">
                {isDemoReport ? (
                  <span className="text-emerald-700 font-medium">
                    Демонстрационный режим: отображены все разделы аналитики, рекомендации и визуализации.
                  </span>
                ) : isExpressTier ? (
                  <span>В экспресс-отчете показаны первичные факты сливов.</span>
                ) : tierConfig.id === 'PRO' ? (
                  <span className="text-blue-600 font-medium">
                    Включены все правила аудита, AI-анализ запросов и детализация настроек Директа.
                  </span>
                ) : (
                  <span className="text-purple-700 font-medium">
                    Тариф {tierConfig.name} включает White-label брендинг отчета, PDF для руководства и ТЗ подрядчику.
                  </span>
                )}
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-2.5 w-full sm:w-auto">
                <button
                  type="button"
                  id="open-task-btn"
                  onClick={handleOpenContractorTask}
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
                        {hasWhiteLabel ? 'Скачать White-label PDF' : 'Распечатать / В PDF'}
                      </span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Модальное окно ТЗ подрядчику */}
      <ContractorTaskModal
        report={report}
        sourceName={sourceName}
        isOpen={isTaskModalOpen}
        onClose={() => setIsTaskModalOpen(false)}
      />

      {/* Модальное окно выбора тарифов и оплаты */}
      <PricingModal
        isOpen={isPricingModalOpen}
        onClose={() => setIsPricingModalOpen(false)}
      />

      {/* Модальное окно настройки брендинга White-label */}
      <WhiteLabelSettingsModal
        isOpen={isWhiteLabelModalOpen}
        onClose={() => setIsWhiteLabelModalOpen(false)}
      />
    </div>
  );
}
