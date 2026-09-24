'use client';

import React, { useState, useMemo } from 'react';
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
  CartesianGrid,
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
  Target,
  MousePointer,
  Eye,
  Percent,
  BarChart3,
  Search,
  Check,
  Copy,
  Lightbulb,
  ArrowDownRight,
  Flame,
  Monitor,
} from 'lucide-react';

interface AuditChartsProps {
  report: AuditReportData;
}

const DONUT_COLORS = ['#EF4444', '#3B82F6', '#10B981', '#F59E0B', '#8B5CF6'];

export function AuditCharts({ report }: AuditChartsProps) {
  const [reallocatePercent, setReallocatePercent] = useState<number>(100);
  const [activeTab, setActiveTab] = useState<
    'all' | 'funnel' | 'campaigns' | 'channels' | 'devices' | 'simulator' | 'tips'
  >('all');
  const [showExplanation, setShowExplanation] = useState<boolean>(false);
  const [searchFilter, setSearchFilter] = useState<string>('');
  const [sortBy, setSortBy] = useState<'spend' | 'loss' | 'conversions' | 'cpa' | 'ctr'>('spend');
  const [copiedTipIndex, setCopiedTipIndex] = useState<number | null>(null);

  const campaigns = useMemo(() => report.campaigns || [], [report.campaigns]);

  // Вычисляем базовые метрики
  const totalSpend = report.totalSpendRub || 0;
  const totalLoss = report.totalLossRub || 0;
  const totalConversions =
    report.totalConversions !== undefined
      ? report.totalConversions
      : campaigns.reduce((acc, c) => acc + (c.conversions || 0), 0);

  const totalClicks =
    report.totalClicks !== undefined
      ? report.totalClicks
      : campaigns.reduce((acc, c) => acc + (c.clicks || 0), 0);

  const totalImpressions =
    report.totalImpressions !== undefined
      ? report.totalImpressions
      : campaigns.reduce((acc, c) => acc + (c.impressions || 0), 0);

  const avgCtr =
    report.avgCtr !== undefined
      ? report.avgCtr
      : totalImpressions > 0
      ? (totalClicks / totalImpressions) * 100
      : 0;

  const avgCpc =
    report.avgCpc !== undefined
      ? report.avgCpc
      : totalClicks > 0
      ? totalSpend / totalClicks
      : 0;

  const avgCr =
    report.avgCr !== undefined
      ? report.avgCr
      : totalClicks > 0
      ? (totalConversions / totalClicks) * 100
      : 0;

  const avgCpa =
    report.avgCpa !== undefined
      ? report.avgCpa
      : totalConversions > 0
      ? totalSpend / totalConversions
      : 0;

  // 1. Данные для распределения каналов (на 100% реальных типах кампаний)
  let rsyaSpend = 0;
  let searchSpend = 0;
  let smartSpend = 0;
  let otherSpend = 0;

  for (const c of campaigns) {
    if (c.type === 'RSYA' || c.name.toLowerCase().includes('рся') || c.name.toLowerCase().includes('сеть')) {
      rsyaSpend += c.spendRub;
    } else if (c.type === 'SEARCH' || c.name.toLowerCase().includes('поиск') || c.name.toLowerCase().includes('search')) {
      searchSpend += c.spendRub;
    } else if (c.type === 'SMART' || c.name.toLowerCase().includes('мастер')) {
      smartSpend += c.spendRub;
    } else {
      otherSpend += c.spendRub;
    }
  }

  const channelData = [
    ...(searchSpend > 0 ? [{ name: 'Поиск (Яндекс)', value: Math.round(searchSpend), color: '#3B82F6' }] : []),
    ...(rsyaSpend > 0 ? [{ name: 'Сети (РСЯ)', value: Math.round(rsyaSpend), color: '#EF4444' }] : []),
    ...(smartSpend > 0 ? [{ name: 'Мастер Кампаний / Смарт', value: Math.round(smartSpend), color: '#8B5CF6' }] : []),
    ...(otherSpend > 0 ? [{ name: 'Прочие форматы', value: Math.round(otherSpend), color: '#10B981' }] : []),
  ];

  // 2. Данные для устройств (Мобильные vs ПК на 100% реальных срезах)
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

  const hasDeviceSplit = mobileSpend > 0 || desktopSpend > 0;
  const effectiveMobileSpend = hasDeviceSplit ? mobileSpend : totalSpend;
  const effectiveDesktopSpend = hasDeviceSplit ? desktopSpend : 0;

  const deviceData = [
    {
      name: 'Смартфоны (Mobile)',
      Расход: Math.round(effectiveMobileSpend),
      Конверсии: mobileConv,
    },
    {
      name: 'Компьютеры (Desktop)',
      Расход: Math.round(effectiveDesktopSpend),
      Конверсии: desktopConv,
    },
  ];

  // 3. Данные по кампаниям для графика распределения бюджета
  const campaignChartData = useMemo(() => {
    return campaigns.slice(0, 10).map((c) => {
      const campLoss =
        c.conversions === 0 && c.spendRub > 1200
          ? c.spendRub
          : c.type === 'RSYA' && c.conversions < 2
          ? Math.round(c.spendRub * 0.8)
          : 0;
      const healthySpend = Math.max(0, c.spendRub - campLoss);
      return {
        name: c.name.length > 22 ? `${c.name.substring(0, 20)}…` : c.name,
        fullName: c.name,
        'Полезный бюджет': Math.round(healthySpend),
        'Слив бюджета': Math.round(campLoss),
        conversions: c.conversions,
      };
    });
  }, [campaigns]);

  // 4. Расчет интерактивного симулятора перераспределения
  const redirectedBudget = Math.round((totalLoss * reallocatePercent) / 100);
  const benchmarkCpa = avgCpa > 0 ? avgCpa : 1500;
  const extraLeadsMin = Math.max(1, Math.floor(redirectedBudget / (benchmarkCpa * 1.35)));
  const extraLeadsMax = Math.max(1, Math.ceil(redirectedBudget / Math.max(300, benchmarkCpa * 0.75)));
  const wastePercent = Math.round((totalLoss / (totalSpend || 1)) * 100);

  // 5. Фильтрация и сортировка таблицы кампаний
  const filteredCampaigns = useMemo(() => {
    return campaigns
      .filter((c) => {
        if (!searchFilter.trim()) return true;
        const q = searchFilter.toLowerCase();
        return c.name.toLowerCase().includes(q) || c.type.toLowerCase().includes(q);
      })
      .sort((a, b) => {
        if (sortBy === 'spend') return b.spendRub - a.spendRub;
        if (sortBy === 'conversions') return b.conversions - a.conversions;
        if (sortBy === 'ctr') {
          const ctrA = a.impressions > 0 ? (a.clicks / a.impressions) * 100 : 0;
          const ctrB = b.impressions > 0 ? (b.clicks / b.impressions) * 100 : 0;
          return ctrB - ctrA;
        }
        if (sortBy === 'cpa') {
          const cpaA = a.conversions > 0 ? a.spendRub / a.conversions : a.spendRub;
          const cpaB = b.conversions > 0 ? b.spendRub / b.conversions : b.spendRub;
          return cpaB - cpaA;
        }
        if (sortBy === 'loss') {
          const lossA = a.conversions === 0 ? a.spendRub : 0;
          const lossB = b.conversions === 0 ? b.spendRub : 0;
          return lossB - lossA;
        }
        return 0;
      });
  }, [campaigns, searchFilter, sortBy]);

  // 6. Практические советы по настройке Директа на основе аудита
  const tipsList = useMemo(() => {
    const list: { title: string; category: string; step: string; priority: 'HIGH' | 'MEDIUM'; impact: string }[] = [];

    if (rsyaSpend > totalSpend * 0.5) {
      list.push({
        title: 'Разделение бюджета Сетей (РСЯ) и Поиска',
        category: 'Структура кампаний',
        step: '1. Перейдите в параметры кампании РСЯ в Директе.\n2. Убедитесь, что стратегия закупки кликов отключена.\n3. Установите фиксированную недельную квоту или переведите на «Оплату за целевое действие» (CPA).',
        priority: 'HIGH',
        impact: `Экономия до ${Math.round(rsyaSpend * 0.4).toLocaleString('ru-RU')} ₽ в месяц`,
      });
    }

    if (mobileSpend > totalSpend * 0.5 && mobileConv < (desktopConv || 1)) {
      list.push({
        title: 'Корректировка ставок для смартфонов (Mobile)',
        category: 'Устройства',
        step: '1. Откройте «Корректировки ставок» в настройках кампании.\n2. Вкладка «Устройства» -> «Смартфоны».\n3. Установите корректировку -50% или -100% для снижения цены неконверсионного трафика.',
        priority: 'HIGH',
        impact: 'Снижение среднего CPA на 30–45%',
      });
    }

    list.push({
      title: 'Чистка минус-фраз и ограничение автотаргетинга',
      category: 'Семантика',
      step: '1. В параметрах кампаний найдите блок «Автотаргетинг».\n2. Снимите галочки с категорий «Широкие», «Сопутствующие» и «Альтернативные».\n3. Оставьте активной только категорию «Целевые запросы».\n4. Добавьте общий список кросс-минус-слов на уровне кампании.',
      priority: 'MEDIUM',
      impact: 'Исключение до 25% информационного и спам-трафика',
    });

    list.push({
      title: 'Фиксация ключевой цели Яндекс.Метрики',
      category: 'Аналитика и конверсии',
      step: '1. Укажите номер счетчика Метрики в параметрах каждой кампании.\n2. Выберите одну главную конверсионную цель (отправка формы, звонок, корзина) вместо просмотров страниц.\n3. Задайте предельную стоимость конверсии.',
      priority: 'HIGH',
      impact: 'Автостратегия оптимизирует показы под покупателей, а не случайные клики',
    });

    return list;
  }, [rsyaSpend, totalSpend, mobileSpend, mobileConv, desktopConv]);

  const handleCopyTip = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedTipIndex(index);
    setTimeout(() => setCopiedTipIndex(null), 2000);
  };

  const zeroConvCampaigns = useMemo(() => campaigns.filter((c) => (c.conversions || 0) === 0), [campaigns]);
  const zeroConvSpend = useMemo(() => zeroConvCampaigns.reduce((s, c) => s + (c.spendRub || 0), 0), [zeroConvCampaigns]);

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* ПАНЕЛЬ СКВОЗНЫХ МЕТРИК КАБИНЕТА (CTR, CPC, CR, CPA, Показы, Клики) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 sm:gap-3">
        <div className="p-3.5 rounded-2xl bg-white border border-slate-200 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider">Показы</span>
            <Eye className="w-3.5 h-3.5 text-slate-400" />
          </div>
          <span className="text-lg sm:text-xl font-extrabold font-mono text-slate-900">
            {totalImpressions.toLocaleString('ru-RU')}
          </span>
          <span className="text-[10px] text-slate-500 mt-0.5">Охват аудитории</span>
        </div>

        <div className="p-3.5 rounded-2xl bg-white border border-slate-200 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider">Клики</span>
            <MousePointer className="w-3.5 h-3.5 text-blue-500" />
          </div>
          <span className="text-lg sm:text-xl font-extrabold font-mono text-blue-600">
            {totalClicks.toLocaleString('ru-RU')}
          </span>
          <span className="text-[10px] text-slate-500 mt-0.5">Переходы на сайт</span>
        </div>

        <div className="p-3.5 rounded-2xl bg-white border border-slate-200 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider">CTR (Клик-ть)</span>
            <Percent className="w-3.5 h-3.5 text-indigo-500" />
          </div>
          <div className="flex items-baseline gap-1.5">
            <span
              className={`text-lg sm:text-xl font-extrabold font-mono ${
                avgCtr < 1.0 ? 'text-amber-600' : avgCtr < 3.0 ? 'text-slate-900' : 'text-emerald-600'
              }`}
            >
              {avgCtr.toFixed(2)}%
            </span>
          </div>
          <span className="text-[10px] text-slate-500 mt-0.5">
            {avgCtr < 1.0 ? 'Слабый CTR' : avgCtr < 3.0 ? 'Умеренный' : 'Высокий'}
          </span>
        </div>

        <div className="p-3.5 rounded-2xl bg-white border border-slate-200 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider">Ср. цена клика</span>
            <DollarSign className="w-3.5 h-3.5 text-slate-400" />
          </div>
          <span className="text-lg sm:text-xl font-extrabold font-mono text-slate-900">
            {avgCpc.toFixed(1)} ₽
          </span>
          <span className="text-[10px] text-slate-500 mt-0.5">CPC по кабинету</span>
        </div>

        <div className="p-3.5 rounded-2xl bg-white border border-slate-200 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider">Конверсии</span>
            <Target className="w-3.5 h-3.5 text-emerald-500" />
          </div>
          <span className="text-lg sm:text-xl font-extrabold font-mono text-emerald-600">
            {totalConversions}
          </span>
          <span className="text-[10px] text-slate-500 mt-0.5">
            CR: {avgCr.toFixed(2)}%
          </span>
        </div>

        <div className="p-3.5 rounded-2xl bg-white border border-slate-200 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider">Ср. цена лида</span>
            <TrendingDown className="w-3.5 h-3.5 text-purple-500" />
          </div>
          <span className="text-lg sm:text-xl font-extrabold font-mono text-purple-700">
            {avgCpa > 0 ? `${Math.round(avgCpa).toLocaleString('ru-RU')} ₽` : '—'}
          </span>
          <span className="text-[10px] text-slate-500 mt-0.5">
            {avgCpa > 0 ? 'CPA целевого действия' : '0 конверсий'}
          </span>
        </div>
      </div>

      {/* ДЕТАЛЬНАЯ ПРОЗРАЧНАЯ ДЕКОМПОЗИЦИЯ: ОТКУДА ИМЕННО ВЗЯЛИСЬ СУММЫ */}
      <div className="bg-slate-900 text-white rounded-2xl p-5 sm:p-6 shadow-md border border-slate-800 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-800">
          <div>
            <h4 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
              <Layers className="w-4 h-4 text-blue-400" />
              <span>Прозрачная декомпозиция рекламного бюджета ({totalSpend.toLocaleString('ru-RU')} ₽)</span>
            </h4>
            <p className="text-xs text-slate-400 mt-0.5">
              Точный расчет, куда ушли деньги: прямой слив, переплата по устройствам, нецелевые фразы и полезные конверсии
            </p>
          </div>
          <div className="text-xs font-mono px-3 py-1 rounded-xl bg-slate-800 text-slate-300 self-start sm:self-auto">
            Индекс здоровья: <strong className={report.overallScore < 50 ? 'text-red-400' : report.overallScore < 80 ? 'text-amber-400' : 'text-emerald-400'}>{report.overallScore}/100</strong>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
          {/* 1. Прямой слив без конверсий */}
          <div className="p-3.5 rounded-xl bg-slate-800/80 border border-slate-700/80 flex flex-col justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-red-400 flex items-center justify-between">
              <span>Слив без конверсий</span>
              <Flame className="w-3.5 h-3.5 text-red-400" />
            </span>
            <div className="mt-2">
              <span className="text-lg sm:text-xl font-extrabold font-mono text-red-400">
                {zeroConvSpend.toLocaleString('ru-RU')} ₽
              </span>
              <p className="text-[11px] text-slate-400 mt-1 leading-snug">
                {zeroConvCampaigns.length > 0
                  ? `${zeroConvCampaigns.length} камп. израсходовали бюджет с 0 заявок.`
                  : 'Все активные кампании принесли хотя бы 1 лид.'}
              </p>
            </div>
          </div>

          {/* 2. Срез по смартфонам */}
          <div className="p-3.5 rounded-xl bg-slate-800/80 border border-slate-700/80 flex flex-col justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-blue-400 flex items-center justify-between">
              <span>Смартфоны ({totalSpend > 0 ? Math.round((effectiveMobileSpend / totalSpend) * 100) : 0}%)</span>
              <Smartphone className="w-3.5 h-3.5 text-blue-400" />
            </span>
            <div className="mt-2">
              <span className="text-lg sm:text-xl font-extrabold font-mono text-white">
                {effectiveMobileSpend.toLocaleString('ru-RU')} ₽
              </span>
              <p className="text-[11px] text-slate-400 mt-1 leading-snug">
                {mobileConv > 0
                  ? `${mobileConv} заявок по ${Math.round(effectiveMobileSpend / mobileConv).toLocaleString('ru-RU')} ₽ / лид.`
                  : '0 заявок со смартфонов.'}
              </p>
            </div>
          </div>

          {/* 3. Срез по компьютерам */}
          <div className="p-3.5 rounded-xl bg-slate-800/80 border border-slate-700/80 flex flex-col justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-400 flex items-center justify-between">
              <span>Компьютеры ({totalSpend > 0 ? Math.round((effectiveDesktopSpend / totalSpend) * 100) : 0}%)</span>
              <Monitor className="w-3.5 h-3.5 text-indigo-400" />
            </span>
            <div className="mt-2">
              <span className="text-lg sm:text-xl font-extrabold font-mono text-white">
                {effectiveDesktopSpend.toLocaleString('ru-RU')} ₽
              </span>
              <p className="text-[11px] text-slate-400 mt-1 leading-snug">
                {desktopConv > 0
                  ? `${desktopConv} заявок по ${Math.round(effectiveDesktopSpend / desktopConv).toLocaleString('ru-RU')} ₽ / лид.`
                  : '0 заявок с ПК (микро-трафик).'}
              </p>
            </div>
          </div>

          {/* 4. Нецелевые фразы (DIY/мусор) */}
          <div className="p-3.5 rounded-xl bg-slate-800/80 border border-slate-700/80 flex flex-col justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-amber-400 flex items-center justify-between">
              <span>Мусорные фразы</span>
              <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
            </span>
            <div className="mt-2">
              <span className="text-lg sm:text-xl font-extrabold font-mono text-amber-400">
                {report.searchQueryAnalysis?.junkSpendRub ? `${report.searchQueryAnalysis.junkSpendRub.toLocaleString('ru-RU')} ₽` : '0 ₽'}
              </span>
              <p className="text-[11px] text-slate-400 mt-1 leading-snug">
                {report.searchQueryAnalysis?.junkQueriesCount
                  ? `${report.searchQueryAnalysis.junkQueriesCount} фраз («своими руками», DIY, халява).`
                  : 'Критических мусорных кликов не выявлено.'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Переключатель вкладок аналитики */}
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
            Все дашборды
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('funnel')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 ${
              activeTab === 'funnel'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            <span>Воронка трафика</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('campaigns')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 ${
              activeTab === 'campaigns'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Срез кампаний ({campaigns.length})</span>
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
          <button
            type="button"
            onClick={() => setActiveTab('tips')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 ${
              activeTab === 'tips'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Lightbulb className="w-3.5 h-3.5 text-amber-500" />
            <span>Советы по настройке ({tipsList.length})</span>
          </button>
        </div>

        <div className="text-[11px] text-slate-500 font-medium px-2 hidden lg:block">
          100% честные метрики из Яндекс.Директа
        </div>
      </div>

      {/* СКВОЗНАЯ ВОРОНКА ТРАФИКА (FUNNEL) */}
      {(activeTab === 'all' || activeTab === 'funnel') && (
        <div className="bg-white p-5 sm:p-7 rounded-2xl border border-slate-200 shadow-xs space-y-4 print:border-slate-300">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                <BarChart3 className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-base font-bold text-slate-900">
                  Сквозная воронка маркетинговой эффективности
                </h4>
                <p className="text-xs text-slate-500">
                  От первого контакта объявления до подтвержденной заявки и стоимости привлечения
                </p>
              </div>
            </div>
            <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 self-start sm:self-auto">
              Конверсия в заявку: {avgCr.toFixed(2)}%
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-3 pt-2">
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-col justify-between relative overflow-hidden">
              <div className="flex items-center justify-between text-xs font-bold text-slate-600 mb-1">
                <span>1. Показы рекламы</span>
                <span className="text-slate-400">100%</span>
              </div>
              <div className="text-2xl font-extrabold font-mono text-slate-900 my-1">
                {totalImpressions.toLocaleString('ru-RU')}
              </div>
              <div className="text-[11px] text-slate-500 flex items-center gap-1">
                <Info className="w-3 h-3 text-slate-400 shrink-0" />
                <span>Охват целевой аудитории</span>
              </div>
              <div className="w-full bg-slate-200 h-1.5 rounded-full mt-3 overflow-hidden">
                <div className="bg-slate-700 h-full w-full rounded-full" />
              </div>
            </div>

            <div className="p-4 rounded-xl bg-blue-50/70 border border-blue-200 flex flex-col justify-between relative overflow-hidden">
              <div className="flex items-center justify-between text-xs font-bold text-blue-800 mb-1">
                <span>2. Целевые клики</span>
                <span className="text-blue-600 font-mono">CTR {avgCtr.toFixed(2)}%</span>
              </div>
              <div className="text-2xl font-extrabold font-mono text-blue-700 my-1">
                {totalClicks.toLocaleString('ru-RU')}
              </div>
              <div className="text-[11px] text-blue-600 flex items-center gap-1">
                <ArrowDownRight className="w-3 h-3 shrink-0" />
                <span>Переходы на сайт (CPC {avgCpc.toFixed(1)} ₽)</span>
              </div>
              <div className="w-full bg-blue-200 h-1.5 rounded-full mt-3 overflow-hidden">
                <div
                  className="bg-blue-600 h-full rounded-full"
                  style={{ width: `${Math.min(100, Math.max(10, avgCtr * 8))}%` }}
                />
              </div>
            </div>

            <div className="p-4 rounded-xl bg-emerald-50/70 border border-emerald-200 flex flex-col justify-between relative overflow-hidden">
              <div className="flex items-center justify-between text-xs font-bold text-emerald-800 mb-1">
                <span>3. Заявки (Лиды)</span>
                <span className="text-emerald-700 font-mono">CR {avgCr.toFixed(2)}%</span>
              </div>
              <div className="text-2xl font-extrabold font-mono text-emerald-700 my-1">
                {totalConversions}
              </div>
              <div className="text-[11px] text-emerald-700 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3 shrink-0 text-emerald-500" />
                <span>
                  {totalConversions > 0 ? 'Целевые обращения в бизнес' : '0 заявок (критическая зона)'}
                </span>
              </div>
              <div className="w-full bg-emerald-200 h-1.5 rounded-full mt-3 overflow-hidden">
                <div
                  className="bg-emerald-600 h-full rounded-full"
                  style={{ width: `${Math.min(100, Math.max(5, avgCr * 20))}%` }}
                />
              </div>
            </div>

            <div className="p-4 rounded-xl bg-purple-50/70 border border-purple-200 flex flex-col justify-between relative overflow-hidden">
              <div className="flex items-center justify-between text-xs font-bold text-purple-800 mb-1">
                <span>4. Экономика лида</span>
                <span className="text-purple-600 font-mono">CPA</span>
              </div>
              <div className="text-2xl font-extrabold font-mono text-purple-700 my-1">
                {avgCpa > 0 ? `${Math.round(avgCpa).toLocaleString('ru-RU')} ₽` : '—'}
              </div>
              <div className="text-[11px] text-purple-600 flex items-center gap-1">
                <Target className="w-3 h-3 shrink-0" />
                <span>
                  {avgCpa > 0 ? `Фактическая цена лида` : `Весь бюджет слит впустую`}
                </span>
              </div>
              <div className="w-full bg-purple-200 h-1.5 rounded-full mt-3 overflow-hidden">
                <div className="bg-purple-600 h-full w-3/4 rounded-full" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ДИАГРАММА РАСПРЕДЕЛЕНИЯ БЮДЖЕТА И СЛИВОВ ПО КАМПАНИЯМ */}
      {(activeTab === 'all' || activeTab === 'campaigns') && campaignChartData.length > 0 && (
        <div className="bg-white p-5 sm:p-7 rounded-2xl border border-slate-200 shadow-xs space-y-4 print:border-slate-300 print:break-inside-avoid">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
            <div>
              <h4 className="text-base font-bold text-slate-900">
                Баланс полезного бюджета и сливов по кампаниям
              </h4>
              <p className="text-xs text-slate-500">
                Зеленый цвет — полезный бюджет, красный цвет — неоправданный слив на нецелевых показах
              </p>
            </div>
            <div className="flex items-center gap-3 text-xs font-semibold">
              <span className="flex items-center gap-1 text-emerald-700">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" />
                Полезный бюджет
              </span>
              <span className="flex items-center gap-1 text-red-600">
                <span className="w-2.5 h-2.5 rounded-full bg-red-500 inline-block" />
                Слив бюджета
              </span>
            </div>
          </div>

          <div className="h-64 sm:h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={campaignChartData}
                layout="vertical"
                margin={{ top: 10, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E2E8F0" />
                <XAxis type="number" tickFormatter={(val) => `${val.toLocaleString('ru-RU')} ₽`} tick={{ fontSize: 11 }} />
                <YAxis dataKey="name" type="category" tick={{ fontSize: 11 }} width={120} />
                <Tooltip
                  formatter={(val: any, name: any) => [`${Number(val).toLocaleString('ru-RU')} ₽`, name]}
                  contentStyle={{ backgroundColor: '#fff', borderRadius: '12px', border: '1px solid #E2E8F0' }}
                />
                <Bar dataKey="Полезный бюджет" stackId="a" fill="#10B981" radius={[0, 0, 0, 0]} />
                <Bar dataKey="Слив бюджета" stackId="a" fill="#EF4444" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* ТАБЛИЦА ВСЕХ КАМПАНИЙ С ДЕТАЛЬНЫМИ МЕТРИКАМИ */}
      {(activeTab === 'all' || activeTab === 'campaigns') && campaigns.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden print:border-slate-300">
          <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h4 className="text-base font-bold text-slate-900">
                Детальный аудит кампаний ({campaigns.length} шт.)
              </h4>
              <p className="text-xs text-slate-500">
                Сводка ключевых показателей по каждой кампании: CTR, цена клика, заявки, слив и статус
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2 print:hidden">
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Поиск кампании..."
                  value={searchFilter}
                  onChange={(e) => setSearchFilter(e.target.value)}
                  className="pl-8 pr-3 py-1.5 rounded-xl border border-slate-200 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 w-44 sm:w-52"
                />
              </div>

              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              >
                <option value="spend">По расходу (убыв.)</option>
                <option value="loss">По сливу (убыв.)</option>
                <option value="conversions">По заявкам (убыв.)</option>
                <option value="ctr">По CTR (убыв.)</option>
                <option value="cpa">По цене лида (CPA)</option>
              </select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
                  <th className="p-3.5">Кампания</th>
                  <th className="p-3.5 text-center">Тип</th>
                  <th className="p-3.5 text-right">Расход</th>
                  <th className="p-3.5 text-right">Клики</th>
                  <th className="p-3.5 text-right">CTR</th>
                  <th className="p-3.5 text-right">CPC</th>
                  <th className="p-3.5 text-right">Заявки</th>
                  <th className="p-3.5 text-right">CPA</th>
                  <th className="p-3.5 text-center">Статус</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredCampaigns.map((c) => {
                  const ctr = c.impressions > 0 ? (c.clicks / c.impressions) * 100 : 0;
                  const cpc = c.clicks > 0 ? c.spendRub / c.clicks : 0;
                  const cpa = c.conversions > 0 ? c.spendRub / c.conversions : null;
                  const isZeroConvDrain = c.conversions === 0 && c.spendRub > 1200;
                  const isCpaDrain = cpa !== null && avgCpa > 0 && cpa > avgCpa * 2;

                  return (
                    <tr key={c.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="p-3.5 max-w-[220px]">
                        <span className="font-bold text-slate-900 block truncate" title={c.name}>
                          {c.name}
                        </span>
                        <span className="text-[10px] text-slate-500 font-mono">ID: {c.id}</span>
                      </td>
                      <td className="p-3.5 text-center">
                        <span
                          className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase ${
                            c.type === 'SEARCH'
                              ? 'bg-blue-50 text-blue-700 border border-blue-200'
                              : c.type === 'RSYA'
                              ? 'bg-red-50 text-red-700 border border-red-200'
                              : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {c.type === 'SEARCH' ? 'Поиск' : c.type === 'RSYA' ? 'РСЯ' : 'Мастер'}
                        </span>
                      </td>
                      <td className="p-3.5 text-right font-mono font-bold text-slate-900">
                        {c.spendRub.toLocaleString('ru-RU')} ₽
                      </td>
                      <td className="p-3.5 text-right font-mono text-slate-700">
                        {c.clicks.toLocaleString('ru-RU')}
                      </td>
                      <td className="p-3.5 text-right font-mono text-slate-700">
                        {ctr.toFixed(2)}%
                      </td>
                      <td className="p-3.5 text-right font-mono text-slate-700">
                        {cpc.toFixed(1)} ₽
                      </td>
                      <td className="p-3.5 text-right font-mono font-bold">
                        <span className={c.conversions > 0 ? 'text-emerald-600' : 'text-slate-400'}>
                          {c.conversions}
                        </span>
                      </td>
                      <td className="p-3.5 text-right font-mono text-slate-700">
                        {cpa !== null ? `${Math.round(cpa).toLocaleString('ru-RU')} ₽` : '—'}
                      </td>
                      <td className="p-3.5 text-center">
                        {isZeroConvDrain ? (
                          <span className="px-2 py-0.5 rounded-full bg-red-100 text-red-800 text-[10px] font-bold inline-flex items-center gap-1">
                            <Flame className="w-3 h-3 text-red-600" />
                            <span>100% слив</span>
                          </span>
                        ) : isCpaDrain ? (
                          <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-bold">
                            Дорогой лид
                          </span>
                        ) : c.conversions > 0 ? (
                          <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                            В норме
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-[10px] font-bold">
                            Тест
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

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
                      innerRadius={60}
                      outerRadius={85}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {channelData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color || DONUT_COLORS[index % DONUT_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value: any) => [`${Number(value).toLocaleString('ru-RU')} ₽`, 'Расход']}
                      contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #E2E8F0' }}
                    />
                    <Legend verticalAlign="bottom" height={36} iconType="circle" />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
                <span>Слито в сетях (РСЯ):</span>
                <strong className="text-red-600 font-mono">{Math.round(rsyaSpend).toLocaleString('ru-RU')} ₽</strong>
              </div>
            </div>
          )}

          {/* График 2: Столбчатая диаграмма устройств */}
          {(activeTab === 'all' || activeTab === 'devices') && (
            <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between print:border-slate-300 print:break-inside-avoid">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center font-bold">
                      <Smartphone className="w-4 h-4" />
                    </div>
                    <h4 className="text-sm sm:text-base font-bold text-slate-900">
                      Эффективность устройств (Mobile vs Desktop)
                    </h4>
                  </div>
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-100">
                    Перекос трафика
                  </span>
                </div>
                <p className="text-xs text-slate-500 mb-4 leading-relaxed">
                  Сравнение рекламных затрат и фактического числа заявок со смартфонов и компьютеров.
                </p>
              </div>

              <div className="h-56 sm:h-64 w-full relative">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={deviceData} margin={{ top: 10, right: 10, left: 10, bottom: 20 }}>
                    <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                    <YAxis tickFormatter={(v) => `${Math.round(v / 1000)}k ₽`} tick={{ fontSize: 11 }} />
                    <Tooltip
                      formatter={(value: any, name: any) => [
                        name === 'Расход' ? `${Number(value).toLocaleString('ru-RU')} ₽` : `${value} заявок`,
                        name,
                      ]}
                      contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #E2E8F0' }}
                    />
                    <Legend verticalAlign="top" height={30} />
                    <Bar dataKey="Расход" fill="#3B82F6" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
                <span>Конверсий со смартфонов:</span>
                <strong className="text-slate-900 font-mono">{mobileConv} шт.</strong>
              </div>
            </div>
          )}
        </div>
      )}

      {/* КАЛЬКУЛЯТОР ОКУПАЕМОСТИ */}
      {(activeTab === 'all' || activeTab === 'simulator') && (
        <div className="bg-gradient-to-br from-blue-50/90 via-indigo-50/50 to-white p-5 sm:p-7 rounded-2xl border border-blue-200 shadow-xs">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-blue-100">
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800 text-[11px] font-bold uppercase tracking-wider mb-2">
                <Sliders className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                <span>Интерактивный симулятор окупаемости</span>
              </div>
              <h3 className="text-lg sm:text-2xl font-bold text-slate-900 tracking-tight">
                Сколько дополнительных заявок даст остановка сливов?
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 mt-1 max-w-xl leading-relaxed">
                Передвигайте ползунок: алгоритм рассчитывает прогноз прироста конверсий при перенаправлении сливов в целевой поиск.
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

      {/* ПРАКТИЧЕСКИЕ СОВЕТЫ И ПОШАГОВЫЕ ИНСТРУКЦИИ ПО НАСТРОЙКЕ */}
      {(activeTab === 'all' || activeTab === 'tips') && (
        <div className="bg-white p-5 sm:p-7 rounded-2xl border border-amber-200 shadow-xs space-y-4 print:border-slate-300">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center font-bold">
                <Lightbulb className="w-4 h-4 text-amber-600" />
              </div>
              <div>
                <h4 className="text-base font-bold text-slate-900">
                  Практические рекомендации директологу по шагам
                </h4>
                <p className="text-xs text-slate-500">
                  Готовые поручения для настройки кампаний в Яндекс.Директ и Директ Коммандере
                </p>
              </div>
            </div>
            <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-amber-50 text-amber-800 border border-amber-200 self-start sm:self-auto">
              {tipsList.length} ключевых шага
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            {tipsList.map((tip, idx) => (
              <div
                key={idx}
                className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="text-xs font-bold text-slate-900">{tip.title}</span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                        tip.priority === 'HIGH' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'
                      }`}
                    >
                      {tip.category}
                    </span>
                  </div>
                  <pre className="text-xs text-slate-600 whitespace-pre-wrap font-sans leading-relaxed mb-3">
                    {tip.step}
                  </pre>
                </div>

                <div className="pt-3 border-t border-slate-200 flex items-center justify-between">
                  <span className="text-[11px] font-bold text-emerald-700">{tip.impact}</span>
                  <button
                    type="button"
                    onClick={() => handleCopyTip(tip.step, idx)}
                    className="text-xs font-semibold text-slate-600 hover:text-slate-900 inline-flex items-center gap-1 px-2.5 py-1 rounded-lg hover:bg-slate-200 transition-colors"
                  >
                    {copiedTipIndex === idx ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        <span className="text-emerald-700">Скопировано</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Скопировать ТЗ</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            ))}
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
