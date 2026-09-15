'use client';

import React, { useState } from 'react';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { DropZone } from '@/components/DropZone';
import { AuditResults } from '@/components/AuditResults';
import { AuditReportData } from '@/lib/audit/types';
import { Shield, Zap, TrendingDown, Target, HelpCircle } from 'lucide-react';

export default function HomePage() {
  const [activeReport, setActiveReport] = useState<AuditReportData | null>(null);
  const [sourceName, setSourceName] = useState<string>('');

  const handleAuditComplete = (report: AuditReportData, fileName: string) => {
    setActiveReport(report);
    setSourceName(fileName);
  };

  const handleReset = () => {
    setActiveReport(null);
    setSourceName('');
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Header />

      <main className="flex-1">
        {/* Hero Section */}
        <section id="audit-section" className="pt-10 sm:pt-16 pb-12 px-4 sm:px-6 lg:px-8">
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
        )}
      </main>

      <Footer />
    </div>
  );
}
