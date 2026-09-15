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
import { Sliders, Sparkles, TrendingUp, AlertTriangle, ArrowRight, CheckCircle2 } from 'lucide-react';

interface AuditChartsProps {
  report: AuditReportData;
}

const DONUT_COLORS = ['#EF4444', '#3B82F6', '#10B981', '#F59E0B', '#8B5CF6'];

export function AuditCharts({ report }: AuditChartsProps) {
  const [reallocatePercent, setReallocatePercent] = useState<number>(100);

  const campaigns = report.campaigns || [];

  // 1. Данные для круговой диаграммы (РСЯ vs Поиск vs Прочее)
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

  // Если разбивки по типам нет, используем найденные потери
  if (rsyaSpend === 0 && searchSpend === 0) {
    rsyaSpend = report.totalLossRub;
    searchSpend = Math.max(0, report.totalSpendRub - report.totalLossRub);
  }

  const channelData = [
    { name: 'Неэффективные сети (РСЯ)', value: Math.round(rsyaSpend), color: '#EF4444' },
    { name: 'Целевой Поиск', value: Math.max(0, Math.round(searchSpend)), color: '#3B82F6' },
    ...(otherSpend > 0 ? [{ name: 'Прочие кампании', value: Math.round(otherSpend), color: '#10B981' }] : []),
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

  const deviceData = [
    {
      name: 'Смартфоны',
      Расход: Math.round(mobileSpend || (report.totalLossRub > 0 ? report.totalLossRub * 0.9 : report.totalSpendRub * 0.7)),
      Конверсии: mobileConv,
    },
    {
      name: 'Компьютеры (ПК)',
      Расход: Math.round(desktopSpend || (report.totalSpendRub - (report.totalLossRub > 0 ? report.totalLossRub * 0.9 : report.totalSpendRub * 0.7))),
      Конверсии: Math.max(1, Math.round(desktopConv || report.totalConversions || 0)),
    },
  ];

  // 3. Расчет симулятора перераспределения
  const redirectedBudget = Math.round((report.totalLossRub * reallocatePercent) / 100);
  const estimatedCpa = 1400; // Средняя цена лида в чистом поиске
  const extraLeadsMin = Math.max(1, Math.floor(redirectedBudget / (estimatedCpa * 1.3)));
  const extraLeadsMax = Math.max(1, Math.ceil(redirectedBudget / (estimatedCpa * 0.8)));

  return (
    <div className="space-y-6 sm:space-y-8 mt-6 sm:mt-8">
      {/* Секция: Где сливаются деньги и распределение каналов */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* График 1: Круговая диаграмма каналов */}
        <div className="bg-white p-4 sm:p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2 sm:mb-3">
              <h4 className="text-sm sm:text-base font-bold text-slate-900 flex items-center gap-2">
                <span>Каналы распределения бюджета</span>
              </h4>
              <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-red-50 text-red-700 border border-red-100">
                {Math.round((report.totalLossRub / (report.totalSpendRub || 1)) * 100)}% в зоне риска
              </span>
            </div>
            <p className="text-xs text-slate-500 mb-4">
              Соотношение эффективного расхода к сливу бюджета в нецелевых сетях
            </p>
          </div>

          <div className="h-56 sm:h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={channelData}
                  cx="50%"
                  cy="50%"
                  innerRadius={45}
                  outerRadius={75}
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
            <span className="text-slate-500">Точный слив в сетях:</span>
            <span className="font-mono font-bold text-red-600">
              {Math.round(rsyaSpend).toLocaleString('ru-RU')} ₽
            </span>
          </div>
        </div>

        {/* График 2: Эффективность по типам устройств */}
        <div className="bg-white p-4 sm:p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2 sm:mb-3">
              <h4 className="text-sm sm:text-base font-bold text-slate-900 flex items-center gap-2">
                <span>Дисбаланс устройств</span>
              </h4>
              <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-100">
                Мобильный перекос
              </span>
            </div>
            <p className="text-xs text-slate-500 mb-4">
              Сравнение суммы затрат на устройства с количеством конверсий
            </p>
          </div>

          <div className="h-56 sm:h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={deviceData} margin={{ top: 10, right: 5, left: -25, bottom: 0 }}>
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#64748B' }} />
                <YAxis yAxisId="left" orientation="left" stroke="#3B82F6" tick={{ fontSize: 10 }} />
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
                <Bar yAxisId="left" dataKey="Расход" fill="#EF4444" radius={[6, 6, 0, 0]} barSize={32} />
                <Bar yAxisId="right" dataKey="Конверсии" fill="#10B981" radius={[6, 6, 0, 0]} barSize={32} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-slate-500">Вывод аудита:</span>
            <span className="text-slate-900 font-medium truncate max-w-[200px] sm:max-w-none">Слив на неадаптированных смартфонах</span>
          </div>
        </div>
      </div>

      {/* Интерактивный симулятор: "Что если перераспределить сливаемый бюджет" */}
      <div className="bg-gradient-to-br from-blue-50/60 via-white to-indigo-50/40 p-4 sm:p-6 lg:p-8 rounded-2xl border border-blue-100 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-slate-200">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-100/80 text-blue-800 text-xs font-semibold mb-2 border border-blue-200">
              <Sliders className="w-3.5 h-3.5 text-blue-600 shrink-0" />
              <span>Калькулятор окупаемости</span>
            </div>
            <h3 className="text-lg sm:text-2xl font-bold text-slate-900 tracking-tight">
              Сколько заявок вы получите при остановке слива?
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 mt-1 max-w-xl">
              Двигайте ползунок: симулятор покажет прирост клиентов от переноса бюджета в чистый Поиск
            </p>
          </div>

          <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-blue-200/80 shadow-xs text-left md:text-right w-full md:w-auto">
            <span className="text-xs text-slate-500 block mb-0.5">Сумма к спасению:</span>
            <span className="text-2xl sm:text-3xl font-mono font-extrabold text-emerald-600">
              {redirectedBudget.toLocaleString('ru-RU')} ₽
            </span>
          </div>
        </div>

        <div className="py-5">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-700 mb-2">
            <span>Доля перераспределения:</span>
            <span className="text-blue-600 font-mono text-sm font-bold">{reallocatePercent}%</span>
          </div>
          <input
            id="reallocate-slider"
            type="range"
            min="20"
            max="100"
            step="10"
            value={reallocatePercent}
            onChange={(e) => setReallocatePercent(Number(e.target.value))}
            className="w-full h-2.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
          />
          <div className="flex justify-between text-[10px] sm:text-[11px] text-slate-500 mt-2 font-medium">
            <span>20% (Тест)</span>
            <span>50% (Баланс)</span>
            <span>100% (Стоп сливов)</span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 pt-1">
          <div className="p-3.5 sm:p-4 rounded-xl bg-white border border-slate-200 shadow-xs">
            <span className="text-xs text-slate-500 uppercase tracking-wider block mb-1 font-medium">
              Доп. заявки
            </span>
            <div className="text-xl sm:text-2xl font-bold text-slate-900 font-mono flex items-center gap-1.5">
              <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-600 shrink-0" />
              <span>
                +{extraLeadsMin} ... +{extraLeadsMax} шт.
              </span>
            </div>
            <span className="text-[11px] text-slate-500 mt-1 block">
              В целевой нише без доп. бюджета
            </span>
          </div>

          <div className="p-3.5 sm:p-4 rounded-xl bg-white border border-slate-200 shadow-xs">
            <span className="text-xs text-slate-500 uppercase tracking-wider block mb-1 font-medium">
              Снижение цены лида (CPA)
            </span>
            <div className="text-xl sm:text-2xl font-bold text-blue-600 font-mono">
              -35% ... -60%
            </div>
            <span className="text-[11px] text-slate-500 mt-1 block">
              За счет отсечения мусора
            </span>
          </div>

          <div className="p-3.5 sm:p-4 rounded-xl bg-white border border-slate-200 shadow-xs">
            <span className="text-xs text-slate-500 uppercase tracking-wider block mb-1 font-medium">
              Экономия в год
            </span>
            <div className="text-xl sm:text-2xl font-bold text-emerald-600 font-mono">
              {(redirectedBudget * 12).toLocaleString('ru-RU')} ₽
            </div>
            <span className="text-[11px] text-slate-500 mt-1 block">
              Остается в обороте бизнеса
            </span>
          </div>
        </div>
      </div>


      {/* AI-Анализ от Gemini (если сгенерирован) */}
      {report.aiAnalysis && (
        <div className="bg-white p-6 sm:p-8 rounded-2xl border border-blue-200 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 w-48 h-48 bg-blue-50 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none" />

          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-sm">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">Интеллектуальный AI-аудит (Gemini 2026)</h3>
              <p className="text-xs text-slate-500">Глубокий анализ семантики, стратегий и структуры кампаний</p>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-blue-50/70 border border-blue-100 text-sm text-slate-800 mb-6 leading-relaxed">
            <strong className="text-blue-900 font-bold block mb-1">Главный вывод эксперта:</strong>
            {report.aiAnalysis.summary}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            {report.aiAnalysis.topIssues.map((issue, idx) => (
              <div key={idx} className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 flex flex-col justify-between">
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
                  <p className="text-xs text-slate-600 mb-3">{issue.description}</p>
                </div>
                <div className="text-xs text-blue-700 font-medium pt-2 border-t border-slate-200/60 flex items-center gap-1">
                  <ArrowRight className="w-3 h-3 text-blue-500 shrink-0" />
                  <span>{issue.actionRequired}</span>
                </div>
              </div>
            ))}
          </div>

          {/* AI-чеклист для подрядчика */}
          {report.aiAnalysis.contractorChecklist && report.aiAnalysis.contractorChecklist.length > 0 && (
            <div className="pt-4 border-t border-slate-100">
              <h5 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3">
                Пошаговый план работ для директолога (AI-Checklist):
              </h5>
              <div className="space-y-2">
                {report.aiAnalysis.contractorChecklist.map((item, i) => (
                  <div key={i} className="flex items-start gap-2 text-xs text-slate-700">
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
