'use client';

import React, { useState } from 'react';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { DropZone } from '@/components/DropZone';
import { AuditResults } from '@/components/AuditResults';
import { AuditReportData } from '@/lib/audit/types';
import {
  Shield,
  Zap,
  TrendingDown,
  Target,
  HelpCircle,
  Check,
  ArrowRight,
  KeyRound,
  Building2,
  Sparkles,
  Eye,
  CheckCircle2,
  Lock,
  Layers,
  Search,
  FileCheck2,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { PricingModal } from '@/components/PricingModal';
import { TIER_LIST, UserTier } from '@/lib/billing/tiers';
import { mockDemoAuditData } from '@/tests/fixtures/demo';
import { defaultAuditEngine } from '@/lib/audit/engine';
import { useUser } from '@/lib/auth/user-context';
import { FaqSection } from '@/components/FaqSection';

export default function HomePage() {
  const { user } = useUser();
  const [activeReport, setActiveReport] = useState<AuditReportData | null>(null);
  const [sourceName, setSourceName] = useState<string>('');
  const [isPricingModalOpen, setIsPricingModalOpen] = useState(false);
  const [selectedPricingTier, setSelectedPricingTier] = useState<UserTier | undefined>();
  const [isDemoLoading, setIsDemoLoading] = useState(false);
  const [expandedTiers, setExpandedTiers] = useState<Record<string, boolean>>({});

  const toggleTierExpand = (tierId: string) => {
    setExpandedTiers((prev) => ({
      ...prev,
      [tierId]: !prev[tierId],
    }));
  };

  const handleAuditComplete = (report: AuditReportData, fileName: string) => {
    setActiveReport(report);
    setSourceName(fileName);
  };

  const handleReset = () => {
    setActiveReport(null);
    setSourceName('');
  };

  const handleOpenPricingForTier = (tier: UserTier) => {
    setSelectedPricingTier(tier);
    setIsPricingModalOpen(true);
  };

  const handleRunDemoAudit = async () => {
    setIsDemoLoading(true);
    const demoFileName = 'demo_campaign_audit.xlsx (Эталонный аудит - Тариф PRO)';
    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'x-is-demo': 'true',
      };
      if (user) {
        headers['x-user-id'] = user.id;
        headers['x-user-email'] = user.email;
      }

      const response = await fetch('/api/audit', {
        method: 'POST',
        headers,
        body: JSON.stringify({ ...mockDemoAuditData, isDemo: true }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.report) {
          // ДЕМО НЕ списывает лимиты и НЕ сохраняется в историю
          setActiveReport(data.report);
          setSourceName(demoFileName);
          window.scrollTo({ top: 0, behavior: 'smooth' });
          return;
        }
      }

      // Fallback
      const report = await defaultAuditEngine.runAudit(mockDemoAuditData);
      report.campaigns = mockDemoAuditData.campaigns;
      setActiveReport(report);
      setSourceName(demoFileName);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch {
      const report = await defaultAuditEngine.runAudit(mockDemoAuditData);
      report.campaigns = mockDemoAuditData.campaigns;
      setActiveReport(report);
      setSourceName(demoFileName);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      setIsDemoLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 print:bg-white print:p-0">
      <div className="print:hidden">
        <Header />
      </div>

      <main className="flex-1 print:p-0">
        {/* Hero Section */}
        <section id="audit-section" className="pt-8 sm:pt-14 pb-10 px-4 sm:px-6 lg:px-8 print:p-0">
          {!activeReport && (
            <div className="max-w-4xl mx-auto text-center mb-8">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-100 text-blue-700 text-xs font-semibold mb-4">
                <Zap className="w-3.5 h-3.5" />
                <span>Независимый аудит Яндекс Директ Analytics</span>
              </div>

              <h1 className="text-3xl sm:text-5xl font-extrabold text-slate-900 tracking-tight leading-tight sm:leading-tight mb-4">
                Аудит рекламы Яндекс Директ и раскрутка сайта{' '}
                <span className="text-blue-600">за 2 минуты</span>
              </h1>

              <p className="text-sm sm:text-base text-slate-600 max-w-2xl mx-auto leading-relaxed">
                Эффективная реклама сайта и SEO продвижение: независимый анализ выгрузки или прямое подключение по API. Выявите скрытые сливы в РСЯ, нецелевые поисковые запросы, переплату за мобильный трафик и ошибки автостратегий.
              </p>
            </div>
          )}

          {/* Интерактивная зона: либо Drop-Zone, либо Результаты аудита */}
          {!activeReport ? (
            <DropZone onAuditComplete={handleAuditComplete} />
          ) : (
            <AuditResults
              report={activeReport}
              sourceName={sourceName}
              onReset={handleReset}
            />
          )}
        </section>

        {/* Секция: Что проверяет независимый движок Cransys */}
        {!activeReport && (
          <>
            <section className="py-12 border-t border-slate-200 bg-white px-4 sm:px-6 lg:px-8">
              <div className="max-w-6xl mx-auto">
                {/* Заголовок и главное преимущество */}
                <div className="text-center max-w-3xl mx-auto mb-10">
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px] font-semibold mb-2">
                    <Shield className="w-3.5 h-3.5 text-emerald-600" />
                    <span>100% независимый алгоритм без конфликта интересов</span>
                  </div>
                  <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mb-3">
                    Что проверяет независимый движок Cransys
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                    Рекламным системам выгодно советовать «повышать бюджет» и «включать автотаргетинг». Алгоритм <strong className="text-slate-900">Cransys защищает ваш бюджет</strong>: находит мусорный трафик, рассчитывает сумму неэффективного расхода и формирует готовое ТЗ для исправления.
                  </p>
                </div>

                {/* 4 компактных вектора проверки: иконка ПЕРЕД названием секции */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
                  <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 hover:border-slate-300 transition-colors">
                    <div className="flex items-center gap-2.5 mb-2.5">
                      <div className="w-8 h-8 rounded-xl bg-red-100 text-red-600 flex items-center justify-center font-bold shrink-0">
                        <TrendingDown className="w-4 h-4" />
                      </div>
                      <h3 className="font-bold text-slate-900 text-sm leading-snug">Сливы в сетях (РСЯ)</h3>
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      Поиск мусорных сайтов-ловушек, кликбейтных приложений и мобильных игр, съедающих до 95% бюджета без заявок.
                    </p>
                  </div>

                  <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 hover:border-slate-300 transition-colors">
                    <div className="flex items-center gap-2.5 mb-2.5">
                      <div className="w-8 h-8 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold shrink-0">
                        <Search className="w-4 h-4" />
                      </div>
                      <h3 className="font-bold text-slate-900 text-sm leading-snug">Нецелевая семантика</h3>
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      Выявление информационных фраз, автотаргетинга и генерация готового списка минус-слов для копирования в 1 клик.
                    </p>
                  </div>

                  <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 hover:border-slate-300 transition-colors">
                    <div className="flex items-center gap-2.5 mb-2.5">
                      <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center font-bold shrink-0">
                        <Target className="w-4 h-4" />
                      </div>
                      <h3 className="font-bold text-slate-900 text-sm leading-snug">Переплата за мобильные</h3>
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      Сравнение стоимости лида (CPA) на смартфонах и ПК. Расчет точной корректировки ставок для остановки сливов.
                    </p>
                  </div>

                  <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 hover:border-slate-300 transition-colors">
                    <div className="flex items-center gap-2.5 mb-2.5">
                      <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center font-bold shrink-0">
                        <Layers className="w-4 h-4" />
                      </div>
                      <h3 className="font-bold text-slate-900 text-sm leading-snug">Слепые автостратегии</h3>
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      Диагностика обучения робота Директа на мусорных или микро-целях без учета реальных продаж и ROI.
                    </p>
                  </div>
                </div>

                {/* Интерактивный блок призыва (CTA): Демо без регистрации -> Выбор платного тарифа */}
                <div className="p-6 sm:p-8 rounded-2xl bg-gradient-to-br from-blue-50/80 via-white to-indigo-50/50 text-slate-900 shadow-xs border border-blue-200/80 flex flex-col md:flex-row items-center justify-between gap-6">
                  <div className="space-y-2 text-center md:text-left">
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-100/70 text-blue-800 border border-blue-200 text-[11px] font-semibold">
                      <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                      <span>Мгновенный тест возможностей</span>
                    </div>
                    <h3 className="text-lg sm:text-xl font-extrabold tracking-tight text-slate-900">
                      Оцените глубину аудита на эталонном отчете
                    </h3>
                    <p className="text-xs sm:text-sm text-slate-600 max-w-xl leading-relaxed">
                      Попробуйте аудит прямо сейчас без регистрации и ввода карт. После ознакомления с демо вы сможете зарегистрироваться и подключить свой рекламный кабинет.
                    </p>
                  </div>

                  <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto shrink-0">
                    <button
                      type="button"
                      onClick={handleRunDemoAudit}
                      disabled={isDemoLoading}
                      className="w-full sm:w-auto px-5 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs transition-all shadow-xs flex items-center justify-center gap-2"
                    >
                      <Eye className="w-4 h-4" />
                      <span>{isDemoLoading ? 'Запуск анализа...' : 'Посмотреть ДЕМО-отчет (тариф PRO)'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleOpenPricingForTier('PRO')}
                      className="w-full sm:w-auto px-4 py-3 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 font-semibold text-xs transition-colors flex items-center justify-center gap-1.5 shadow-xs"
                    >
                      <span>Выбрать тариф и подключить</span>
                      <ArrowRight className="w-3.5 h-3.5 text-slate-500" />
                    </button>
                  </div>
                </div>

                {/* FAQ / 152-ФЗ Блок */}
                <div className="mt-8 p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-slate-600">
                  <div className="flex items-center gap-2.5">
                    <Shield className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>
                      <strong className="text-slate-900">100% безопасность по 152-ФЗ РФ:</strong> выгрузка статистики Директа обезличена и не содержит персональных данных клиентов.
                    </span>
                  </div>
                </div>
              </div>
            </section>

            {/* Секция тарифов на главной */}
            <section id="pricing-section" className="pt-10 pb-8 bg-slate-50 border-t border-slate-200/80 px-4 sm:px-6 lg:px-8">
              <div className="max-w-6xl mx-auto">
                <div className="text-center max-w-2xl mx-auto mb-8">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 border border-blue-100 text-blue-700 text-xs font-semibold mb-2">
                    <Zap className="w-3.5 h-3.5 text-blue-600" />
                    <span>Прозрачная тарифная сетка Cransys Analytics</span>
                  </div>
                  <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
                    Тарифы для бизнеса, специалистов и агентств
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-500 mt-1">
                    Прямое подключение по API Яндекс.Директ (OAuth) включено в тарифы от <strong className="text-slate-800">PRO</strong> и выше
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3.5 items-stretch">
                  {TIER_LIST.map((plan) => {
                    const isExpanded = Boolean(expandedTiers[plan.id]);
                    const visibleFeatures = isExpanded ? plan.features : plan.features.slice(0, 4);
                    const hasMoreFeatures = plan.features.length > 4;

                    return (
                      <div
                        key={plan.id}
                        className={`rounded-2xl p-4 bg-white border flex flex-col justify-between transition-all relative h-full ${
                          plan.popular
                            ? 'border-blue-600 shadow-md ring-2 ring-blue-600/10'
                            : plan.isEnterprise
                            ? 'border-purple-300 bg-purple-50/10'
                            : 'border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        {plan.popular && (
                          <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-2.5 py-0.5 rounded-full bg-blue-600 text-white text-[9px] font-bold uppercase tracking-wider shadow-xs whitespace-nowrap">
                            Хит продаж
                          </span>
                        )}
                        {plan.isEnterprise && (
                          <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-2.5 py-0.5 rounded-full bg-purple-700 text-white text-[9px] font-bold uppercase tracking-wider shadow-xs whitespace-nowrap">
                            Enterprise
                          </span>
                        )}

                        <div className="flex-1 flex flex-col">
                          <div className="flex items-center justify-between mb-1">
                            <h3 className="font-bold text-slate-900 text-sm">{plan.name}</h3>
                          </div>

                          <p className="text-[11px] text-slate-500 mb-2.5 leading-tight">
                            {plan.description}
                          </p>

                          <div className="mb-2.5">
                            <span className="text-xl sm:text-2xl font-extrabold font-mono text-slate-900 leading-none">
                              {plan.priceFormatted}
                            </span>
                            <span className="text-[10px] text-slate-400 block mt-1">{plan.period}</span>
                          </div>

                          {/* Беджи API и White-label */}
                          <div className="mb-3 flex flex-col justify-start gap-1">
                            {plan.hasDirectApi ? (
                              <div className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 text-[10px] font-semibold border border-emerald-100 w-full truncate">
                                <KeyRound className="w-3 h-3 text-emerald-600 shrink-0" />
                                <span className="truncate">Direct API включено</span>
                              </div>
                            ) : (
                              <div className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-slate-100 text-slate-400 text-[10px] font-medium w-full truncate">
                                <KeyRound className="w-3 h-3 text-slate-400 shrink-0" />
                                <span className="truncate">Без API (файл)</span>
                              </div>
                            )}

                            {plan.hasWhiteLabel && (
                              <div className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-purple-50 text-purple-700 text-[10px] font-semibold border border-purple-100 w-full truncate">
                                <Building2 className="w-3 h-3 text-purple-600 shrink-0" />
                                <span className="truncate">White-label брендинг</span>
                              </div>
                            )}
                          </div>

                          {/* Список фичей с аккордеоном */}
                          <div className="space-y-1.5 pt-3 border-t border-slate-100 flex-1">
                            {visibleFeatures.map((feat, idx) => (
                              <div key={idx} className="flex items-start gap-1.5 text-[11px] text-slate-700 leading-tight">
                                <Check className="w-3 h-3 text-blue-600 shrink-0 mt-0.5" />
                                <span>{feat}</span>
                              </div>
                            ))}
                          </div>

                          {hasMoreFeatures && (
                            <div className="mt-2 flex items-center">
                              <button
                                type="button"
                                onClick={() => toggleTierExpand(plan.id)}
                                className="inline-flex items-center gap-1 text-[10px] font-semibold text-blue-600 hover:text-blue-700 hover:underline cursor-pointer"
                              >
                                <span>
                                  {isExpanded
                                    ? 'Скрыть подробности ▲'
                                    : `Все возможности (${plan.features.length}) ▼`}
                                </span>
                              </button>
                            </div>
                          )}
                        </div>

                        <div className="mt-4 pt-3 border-t border-slate-100">
                          <button
                            type="button"
                            onClick={() => handleOpenPricingForTier(plan.id)}
                            className={`w-full py-2 px-2.5 rounded-xl text-[11px] font-semibold flex items-center justify-center gap-1 transition-all ${
                              plan.popular
                                ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-xs cursor-pointer'
                                : plan.isEnterprise
                                ? 'bg-purple-700 hover:bg-purple-800 text-white cursor-pointer'
                                : 'bg-slate-900 hover:bg-slate-800 text-white cursor-pointer'
                            }`}
                          >
                            <span>{plan.cta}</span>
                            <ArrowRight className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </section>

            {/* База знаний / FAQ для On-Page SEO */}
            <FaqSection />
          </>
        )}
      </main>

      <div className="print:hidden">
        <Footer />
      </div>

      <PricingModal
        isOpen={isPricingModalOpen}
        onClose={() => setIsPricingModalOpen(false)}
        selectedTier={selectedPricingTier}
      />
    </div>
  );
}

