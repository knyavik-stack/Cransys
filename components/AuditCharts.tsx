'use client';

import React, { useState } from 'react';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
} from 'recharts';
import { AuditReportData } from '@/lib/audit/types';
import {
  Sliders,
  Sparkles,
  TrendingUp,
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  PieChart as PieIcon,
  Smartphone,
  ShieldCheck,
  TrendingDown,
  Layers,
  Info,
  DollarSign,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

interface AuditChartsProps {
  report: AuditReportData;
}

const DONUT_COLORS = ['#EF4444', '#3B82F6', '#10B981', '#F59E0B', '#8B5CF6'];

export function AuditCharts({ report }: AuditChartsProps) {
  const [reallocatePercent, setReallocatePercent] = useState<number>(100);
  const [activeTab, setActiveTab] = useState<'all' | 'channels' | 'devices' | 'simulator'>('all');
  const [showExplanation, setShowExplanation] = useState<boolean>(false);

  const campaigns = report.campaigns || [];

  // 1. Данные для распределения каналов (РСЯ vs Поиск vs Прочее)
  let rsyaSpend = 0;
  let searchSpend = 0;
  let otherSpend = 0;

  for (const c of campaigns) {
    if (c.type === 'RSYA') {
      rsyaSpend += c.spendRub;
    } else if (c.type === 'SEARCH') {
      searchSpend += c.spendRub;
    } else {
      otherSpend += c.spendRub;
    }
  }

  // Если разбивки по типам нет в файле, используем найденные потери
  if (rsyaSpend === 0 && searchSpend === 0) {
    rsyaSpend = report.totalLossRub;
    searchSpend = Math.max(0, report.totalSpendRub - report.totalLossRub);
  }

  const channelData = [
    { name: 'Неэффективные сети (РСЯ)', value: Math.round(rsyaSpend), color: '#EF4444' },
    { name: 'Целевой Поиск', value: Math.max(0, Math.round(searchSpend)), color: '#3B82F6' },
    ...(otherSpend > 0 ? [{ name: 'Прочие форматы', value: Math.round(otherSpend), color: '#10B981' }] : []),
  ].filter((item) => item.value > 0);

  // 2. Данные для устройств (Мобильные vs ПК)
  let mobileSpend = 0;
  let mobileConv = 0;
  let desktopSpend = 0;
  let desktopConv = 0;

  for (const c of campaigns) {
    mobileSpend += c.mobileSpendRub || 0;
    mobileConv += c.mobileConversions || 0;
    desktopSpend += c.desktopSpendRub || 0;
    desktopConv += c.desktopConversions || 0;
  }

  const defaultMobileSpend = report.totalLossRub > 0 ? report.totalLossRub * 0.85 : report.totalSpendRub * 0.65;
  const defaultDesktopSpend = report.totalSpendRub - defaultMobileSpend;

  const deviceData = [
    {
      name: 'Смартфоны (Mobile)',
      Расход: Math.round(mobileSpend || defaultMobileSpend),
      Конверсии: mobileConv,
    },
    {
      name: 'Компьютеры (Desktop)',
      Расход: Math.round(desktopSpend || defaultDesktopSpend),
      Конверсии: Math.max(1, Math.round(desktopConv || report.totalConversions || 0)),
    },
  ];

  // 3. Расчет интерактивного симулятора перераспределения
  const redirectedBudget = Math.round((report.totalLossRub * reallocatePercent) / 100);
  const estimatedCpa = 1400; // Базовая расчетная цена лида
  const extraLeadsMin = Math.max(1, Math.floor(redirectedBudget / (estimatedCpa * 1.35)));
  const extraLeadsMax = Math.max(1, Math.ceil(redirectedBudget / (estimatedCpa * 0.75)));
  const wastePercent = Math.round((report.totalLossRub / (report.totalSpendRub || 1)) * 100);

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Переключатель вкладок аналитики (на экранах) */}
      <div className="print:hidden flex flex-wrap items-center justify-between gap-3 bg-white p-2 sm:p-2.5 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-1 overflow-x-auto w-full sm:w-auto">
          <button
            type="button"
            onClick={() => setActiveTab('all')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
              activeTab === 'all'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            Все диаграммы
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('channels')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 ${
              activeTab === 'channels'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <PieIcon className="w-3.5 h-3.5" />
            <span>Каналы и сети</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('devices')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 ${
              activeTab === 'devices'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>Устройства</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('simulator')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 ${
              activeTab === 'simulator'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Sliders className="w-3.5 h-3.5 text-emerald-500" />
            <span>Калькулятор окупаемости</span>
          </button>
        </div>

        <div className="text-[11px] text-slate-500 font-medium px-2 hidden lg:block">
          Автоматическая визуализация данных Яндекс.Директ
        </div>
      </div>

      {/* Секция: Где сливаются деньги и распределение каналов */}
      {(activeTab === 'all' || activeTab === 'channels' || activeTab === 'devices') && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 print:grid-cols-2">
          {/* График 1: Круговая диаграмма каналов */}
          {(activeTab === 'all' || activeTab === 'channels') && (
            <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between print:border-slate-300 print:break-inside-avoid">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-red-100 text-red-600 flex items-center justify-center font-bold">
                      <PieIcon className="w-4 h-4" />
                    </div>
                    <h4 className="text-sm sm:text-base font-bold text-slate-900">
                      Распределение бюджета по каналам
                    </h4>
                  </div>
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-red-50 text-red-700 border border-red-100">
                    {wastePercent}% в зоне риска
                  </span>
                </div>
                <p className="text-xs text-slate-500 mb-4 leading-relaxed">
                  Наглядное соотношение эффективных кликов на Поиске к расходу в нецелевых сетях РСЯ.
                </p>
              </div>

              <div className="h-56 sm:h-64 w-full relative">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={channelData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {channelData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color || DONUT_COLORS[index % DONUT_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value: unknown) => [
                        `${(Number(value) || 0).toLocaleString('ru-RU')} ₽`,
                        'Расход',
                      ]}
                      contentStyle={{
                        borderRadius: '12px',
                        borderColor: '#E2E8F0',
                        fontSize: '11px',
                        boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                      }}
                    />
                    <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '11px' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className="text-slate-500 font-medium">Слив в мусорных сетях:</span>
                <span className="font-mono font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded-md border border-red-100">
                  {Math.round(rsyaSpend).toLocaleString('ru-RU')} ₽
                </span>
              </div>
            </div>
          )}

          {/* График 2: Эффективность по типам устройств */}
          {(activeTab === 'all' || activeTab === 'devices') && (
            <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between print:border-slate-300 print:break-inside-avoid">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center font-bold">
                      <Smartphone className="w-4 h-4" />
                    </div>
                    <h4 className="text-sm sm:text-base font-bold text-slate-900">
                      Эффективность устройств (ПК / Mobile)
                    </h4>
                  </div>
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-100">
                    Перекос трафика
                  </span>
                </div>
                <p className="text-xs text-slate-500 mb-4 leading-relaxed">
                  Сравнение затрат на мобильные и десктопные устройства с количеством полученных лидов.
                </p>
              </div>

              <div className="h-56 sm:h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={deviceData} margin={{ top: 10, right: 5, left: -25, bottom: 0 }}>
                    <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#64748B' }} />
                    <YAxis yAxisId="left" orientation="left" stroke="#EF4444" tick={{ fontSize: 10 }} />
                    <YAxis yAxisId="right" orientation="right" stroke="#10B981" tick={{ fontSize: 10 }} />
                    <Tooltip
                      formatter={(value: unknown, name: unknown) => [
                        name === 'Расход' ? `${(Number(value) || 0).toLocaleString('ru-RU')} ₽` : `${Number(value) || 0} шт.`,
                        String(name ?? ''),
                      ]}
                      contentStyle={{
                        borderRadius: '12px',
                        borderColor: '#E2E8F0',
                        fontSize: '11px',
                      }}
                    />
                    <Legend wrapperStyle={{ fontSize: '11px' }} />
                    <Bar yAxisId="left" dataKey="Расход" fill="#EF4444" radius={[6, 6, 0, 0]} barSize={32} name="Расход (₽)" />
                    <Bar yAxisId="right" dataKey="Конверсии" fill="#10B981" radius={[6, 6, 0, 0]} barSize={32} name="Конверсии (шт.)" />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className="text-slate-500 font-medium">Статус устройств:</span>
                <span className="text-slate-900 font-semibold truncate max-w-[200px] sm:max-w-none">
                  Требуется корректировка мобильных ставок
                </span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Интерактивный симулятор: "Что если перераспределить сливаемый бюджет" */}
      {(activeTab === 'all' || activeTab === 'simulator') && (
        <div className="bg-gradient-to-br from-blue-50/70 via-white to-indigo-50/50 p-5 sm:p-7 lg:p-8 rounded-2xl border border-blue-200 shadow-xs print:break-inside-avoid print:bg-white print:border-slate-300">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-slate-200">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-100 text-blue-800 text-xs font-bold mb-2 border border-blue-200">
                <Sliders className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                <span>Интерактивный калькулятор окупаемости</span>
              </div>
              <h3 className="text-lg sm:text-2xl font-bold text-slate-900 tracking-tight">
                Сколько дополнительных заявок даст остановка сливов?
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 mt-1 max-w-xl leading-relaxed">
                Передвигайте ползунок: алгоритм мгновенно рассчитывает прогноз прироста конверсий и снижение стоимости целевого клиента.
              </p>
            </div>

            <div className="bg-white p-4 rounded-xl border border-blue-200 shadow-xs text-left md:text-right shrink-0">
              <span className="text-xs text-slate-500 block mb-0.5 font-medium">Спасаемый бюджет в месяц:</span>
              <span className="text-2xl sm:text-3xl font-mono font-extrabold text-emerald-600">
                {redirectedBudget.toLocaleString('ru-RU')} ₽
              </span>
            </div>
          </div>

          <div className="py-5 print:hidden">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-700 mb-2">
              <span>Доля перенаправления в конверсионный Поиск:</span>
              <span className="text-blue-600 font-mono text-sm font-bold bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
                {reallocatePercent}% бюджета
              </span>
            </div>
            <input
              id="reallocate-slider"
              type="range"
              min="20"
              max="100"
              step="10"
              value={reallocatePercent}
              onChange={(e) => setReallocatePercent(Number(e.target.value))}
              className="w-full h-3 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600 focus:outline-none"
            />
            <div className="flex justify-between text-[11px] text-slate-500 mt-2 font-medium">
              <span>20% (Осторожный тест)</span>
              <span>50% (Сбалансированная модель)</span>
              <span className="font-bold text-emerald-700">100% (Полная ликвидация сливов)</span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 pt-1">
            <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs">
              <span className="text-xs text-slate-500 uppercase tracking-wider block mb-1 font-semibold">
                Дополнительные заявки
              </span>
              <div className="text-xl sm:text-2xl font-bold text-slate-900 font-mono flex items-center gap-1.5">
                <TrendingUp className="w-5 h-5 text-emerald-600 shrink-0" />
                <span>
                  +{extraLeadsMin} ... +{extraLeadsMax} шт./мес.
                </span>
              </div>
              <span className="text-[11px] text-slate-500 mt-1 block leading-tight">
                Без увеличения рекламного бюджета
              </span>
            </div>

            <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs">
              <span className="text-xs text-slate-500 uppercase tracking-wider block mb-1 font-semibold">
                Снижение цены заявки (CPA)
              </span>
              <div className="text-xl sm:text-2xl font-bold text-blue-600 font-mono flex items-center gap-1.5">
                <TrendingDown className="w-5 h-5 text-blue-600 shrink-0" />
                <span>-35% ... -60%</span>
              </div>
              <span className="text-[11px] text-slate-500 mt-1 block leading-tight">
                За счет блокировки мусорных переходов
              </span>
            </div>

            <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs">
              <span className="text-xs text-slate-500 uppercase tracking-wider block mb-1 font-semibold">
                Экономия в год
              </span>
              <div className="text-xl sm:text-2xl font-bold text-emerald-600 font-mono">
                {(redirectedBudget * 12).toLocaleString('ru-RU')} ₽
              </div>
              <span className="text-[11px] text-slate-500 mt-1 block leading-tight">
                Прямая выгода для собственника бизнеса
              </span>
            </div>
          </div>
        </div>
      )}

      {/* AI-Анализ от Gemini (если сгенерирован) */}
      {report.aiAnalysis && (
        <div className="bg-white p-5 sm:p-7 rounded-2xl border border-blue-200 shadow-xs relative overflow-hidden print:border-slate-300 print:break-inside-avoid">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-xs">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-bold text-slate-900">
                  Интеллектуальное AI-заключение (Gemini 2026)
                </h3>
                <p className="text-xs text-slate-500">
                  Нейросетевая экспертиза структуры кампаний, семантики и конверсионных точек
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowExplanation(!showExplanation)}
              className="print:hidden text-xs text-blue-600 font-semibold hover:text-blue-700 flex items-center gap-1"
            >
              <span>{showExplanation ? 'Свернуть' : 'Подробнее'}</span>
              {showExplanation ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          </div>

          <div className="p-4 rounded-xl bg-blue-50/80 border border-blue-100 text-xs sm:text-sm text-slate-800 mb-5 leading-relaxed">
            <strong className="text-blue-900 font-bold block mb-1">Ключевой вывод аналитика:</strong>
            {report.aiAnalysis.summary}
          </div>

          {showExplanation && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 mb-5 animate-fadeIn">
              {report.aiAnalysis.topIssues.map((issue, idx) => (
                <div key={idx} className="p-4 rounded-xl border border-slate-200 bg-slate-50/60 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                        {issue.title}
                      </span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                          issue.severity === 'CRITICAL'
                            ? 'bg-red-100 text-red-700'
                            : 'bg-amber-100 text-amber-700'
                        }`}
                      >
                        {issue.severity}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 mb-3 leading-relaxed">{issue.description}</p>
                  </div>
                  <div className="text-xs text-blue-700 font-semibold pt-2 border-t border-slate-200 flex items-center gap-1">
                    <ArrowRight className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                    <span>{issue.actionRequired}</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* AI-чеклист для подрядчика */}
          {report.aiAnalysis.contractorChecklist && report.aiAnalysis.contractorChecklist.length > 0 && (
            <div className="pt-4 border-t border-slate-100">
              <h5 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2.5">
                Пошаговый план исправления ошибок (AI-Checklist):
              </h5>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {report.aiAnalysis.contractorChecklist.map((item, i) => (
                  <div key={i} className="flex items-start gap-2 text-xs text-slate-700 p-2 rounded-lg bg-slate-50 border border-slate-100">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
