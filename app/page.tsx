'use client';

import React, { useState } from 'react';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { DropZone } from '@/components/DropZone';
import { AuditResults } from '@/components/AuditResults';
import { AuditReportData } from '@/lib/audit/types';
import { Shield, Zap, TrendingDown, Target, HelpCircle, Check, ArrowRight, KeyRound, Building2, Sparkles } from 'lucide-react';
import { PricingModal } from '@/components/PricingModal';
import { TIER_LIST, UserTier } from '@/lib/billing/tiers';

export default function HomePage() {
  const [activeReport, setActiveReport] = useState<AuditReportData | null>(null);
  const [sourceName, setSourceName] = useState<string>('');
  const [isPricingModalOpen, setIsPricingModalOpen] = useState(false);
  const [selectedPricingTier, setSelectedPricingTier] = useState<UserTier | undefined>();

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

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 print:bg-white print:p-0">
      <div className="print:hidden">
        <Header />
      </div>

      <main className="flex-1 print:p-0">
        {/* Hero Section */}
        <section id="audit-section" className="pt-10 sm:pt-16 pb-12 px-4 sm:px-6 lg:px-8 print:p-0">
          {!activeReport && (
            <div className="max-w-4xl mx-auto text-center mb-10">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-100 text-blue-700 text-xs font-semibold mb-5">
                <Zap className="w-3.5 h-3.5" />
                <span>Движок аудита Яндекс.Директ 2026</span>
              </div>

              <h1 className="text-3xl sm:text-5xl font-extrabold text-slate-900 tracking-tight leading-tight sm:leading-tight mb-5">
                Аудит рекламы Яндекс.Директ{' '}
                <span className="text-blue-600">за 2 минуты</span>
              </h1>

              <p className="text-base sm:text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
                Бесплатный независимый экспресс-анализ выгрузки: узнайте, сколько бюджета сливается в сетях (РСЯ), на неэффективных смартфонах и в автостратегиях без конверсий.
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

        {/* Секция: Как это работает и 3 ключевые уязвимости */}
        {!activeReport && (
          <>
            <section className="py-12 border-t border-slate-200/80 bg-white px-4 sm:px-6 lg:px-8">
              <div className="max-w-6xl mx-auto">
                <div className="text-center max-w-2xl mx-auto mb-10">
                  <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mb-2">
                    Что проверяет независимый движок Cransys
                  </h2>
                  <p className="text-sm text-slate-500">
                    По статистике 7 из 10 микробизнесов переплачивают за мусорный трафик из-за скрытых настроек
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="p-6 rounded-xl bg-slate-50 border border-slate-200">
                    <div className="w-10 h-10 rounded-lg bg-red-100 text-red-600 flex items-center justify-center font-bold mb-4">
                      <TrendingDown className="w-5 h-5" />
                    </div>
                    <h3 className="font-bold text-slate-900 text-base mb-2">Сливы в сетях (РСЯ)</h3>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      Выявление кампаний, где до 98% бюджета уходит на мобильные приложения и игры в РСЯ без единой конверсии.
                    </p>
                  </div>

                  <div className="p-6 rounded-xl bg-slate-50 border border-slate-200">
                    <div className="w-10 h-10 rounded-lg bg-amber-100 text-amber-600 flex items-center justify-center font-bold mb-4">
                      <Target className="w-5 h-5" />
                    </div>
                    <h3 className="font-bold text-slate-900 text-base mb-2">Переплата за мобильные</h3>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      Расчет реальной стоимости лида (CPA) на смартфонах по сравнению с ПК и расчет экономии при корректировках.
                    </p>
                  </div>

                  <div className="p-6 rounded-xl bg-slate-50 border border-slate-200">
                    <div className="w-10 h-10 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center font-bold mb-4">
                      <Shield className="w-5 h-5" />
                    </div>
                    <h3 className="font-bold text-slate-900 text-base mb-2">Слепые автостратегии</h3>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      Определение стратегий закупки кликов без привязки к достижению целей Метрики и фиксация суммы риска.
                    </p>
                  </div>
                </div>

                {/* FAQ / 152-ФЗ Блок */}
                <div className="mt-12 p-6 rounded-2xl bg-blue-50/50 border border-blue-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <HelpCircle className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                    <div className="text-xs text-slate-600">
                      <strong className="text-slate-900 block mb-0.5">
                        Безопасно ли загружать выгрузку?
                      </strong>
                      Отчет Яндекс.Директа содержит лишь статистику расходов и кликов. В нем нет контактов ваших клиентов, телефонов или номеров счетов. Сервис работает строго по 152-ФЗ РФ.
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Секция тарифов на главной */}
            <section className="py-14 bg-slate-50 border-t border-slate-200/80 px-4 sm:px-6 lg:px-8">
              <div className="max-w-6xl mx-auto">
                <div className="text-center max-w-2xl mx-auto mb-10">
                  <span className="text-xs font-bold text-blue-600 uppercase tracking-wider block mb-1">
                    Прозрачная стоимость
                  </span>
                  <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
                    Тарифные планы Cransys
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-500 mt-1">
                    Прямое подключение по API Яндекс.Директ (OAuth) включено в тарифы от <strong className="text-slate-800">PRO</strong> и выше
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3.5">
                  {TIER_LIST.map((plan) => (
                    <div
                      key={plan.id}
                      className={`rounded-2xl p-4 bg-white border flex flex-col justify-between transition-all relative ${
                        plan.popular
                          ? 'border-blue-600 shadow-md ring-2 ring-blue-600/10'
                          : plan.isEnterprise
                          ? 'border-purple-300'
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

                      <div>
                        <h3 className="font-bold text-slate-900 text-sm mb-1">{plan.name}</h3>
                        
                        <div className="mb-2">
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700">
                            Лимит: {plan.reportsLimit} {plan.reportsLimit === 1 ? 'отчет' : plan.reportsLimit < 5 ? 'отчета' : 'отчетов'}
                          </span>
                        </div>

                        <p className="text-[11px] text-slate-500 mb-3 min-h-[32px] leading-snug">{plan.description}</p>

                        <div className="mb-3">
                          <span className="text-xl sm:text-2xl font-extrabold font-mono text-slate-900">
                            {plan.priceFormatted}
                          </span>
                          <span className="text-[10px] text-slate-400 block mt-0.5">{plan.period}</span>
                        </div>

                        {/* Беджи API и White-label */}
                        <div className="mb-3 space-y-1">
                          {plan.hasDirectApi ? (
                            <div className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 text-[10px] font-semibold border border-emerald-100 w-full">
                              <KeyRound className="w-3 h-3 text-emerald-600 shrink-0" />
                              <span>Direct API включено</span>
                            </div>
                          ) : (
                            <div className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-slate-100 text-slate-400 text-[10px] font-medium w-full">
                              <KeyRound className="w-3 h-3 text-slate-400 shrink-0" />
                              <span>Без API (файл)</span>
                            </div>
                          )}
                        </div>

                        <div className="space-y-1.5 pt-3 border-t border-slate-100">
                          {plan.features.slice(0, 4).map((feat, idx) => (
                            <div key={idx} className="flex items-start gap-1.5 text-[11px] text-slate-700 leading-tight">
                              <Check className="w-3 h-3 text-blue-600 shrink-0 mt-0.5" />
                              <span>{feat}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="mt-5 pt-3">
                        <button
                          type="button"
                          onClick={() => handleOpenPricingForTier(plan.id)}
                          className={`w-full py-2 px-2.5 rounded-xl text-[11px] font-semibold flex items-center justify-center gap-1 transition-all ${
                            plan.popular
                              ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-xs'
                              : plan.isEnterprise
                              ? 'bg-purple-700 hover:bg-purple-800 text-white'
                              : 'bg-slate-900 hover:bg-slate-800 text-white'
                          }`}
                        >
                          <span>{plan.cta}</span>
                          <ArrowRight className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </section>
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

