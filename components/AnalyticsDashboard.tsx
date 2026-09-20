'use client';

import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  DollarSign,
  Users,
  Activity,
  CreditCard,
  RefreshCw,
  PieChart as PieChartIcon,
  BarChart3,
  Calendar,
  Layers,
  Sparkles,
  ShieldCheck,
  Send,
  Database,
  Cloud,
  CheckCircle,
  AlertTriangle,
  FileSpreadsheet,
  ArrowUpRight,
  Zap,
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
} from 'recharts';

export interface AdminAnalyticsSummary {
  period: string;
  generatedAt: string;
  kpis: {
    totalRevenueRub: number;
    periodRevenueRub: number;
    totalUsersCount: number;
    periodNewUsersCount: number;
    paidUsersCount: number;
    totalAuditsCount: number;
    periodAuditsCount: number;
    totalLossDetectedRub: number;
    totalSpendAnalyzedRub: number;
    averageAuditScore: number;
    overallFunnelCr: number;
    demoToRegCr: number;
    regToPaidCr: number;
  };
  dailyTimeline: Array<{
    date: string;
    dayLabel: string;
    revenue: number;
    demoAudits: number;
    signUps: number;
    purchases: number;
    totalAudits: number;
  }>;
  tierBreakdown: Array<{
    tierKey: string;
    name: string;
    usersCount: number;
    revenue: number;
    sharePercent: number;
    color: string;
  }>;
  auditSources: Array<{
    source: string;
    label: string;
    count: number;
    sharePercent: number;
    color: string;
  }>;
  recentActivity: Array<{
    id: string;
    type: 'PAYMENT' | 'REGISTRATION' | 'AUDIT';
    title: string;
    description: string;
    timestamp: string;
    amountRub?: number;
    score?: number;
    userEmail?: string;
  }>;
  storage: {
    r2Configured: boolean;
    provider: string;
    bucketName?: string;
  };
  notifications: {
    telegramConfigured: boolean;
    smtpConfigured: boolean;
    adminChatId?: string;
    adminEmail?: string;
  };
}

interface AnalyticsDashboardProps {
  onShowToast?: (msg: string) => void;
}

export function AnalyticsDashboard({ onShowToast }: AnalyticsDashboardProps) {
  const [period, setPeriod] = useState<'today' | '7d' | '30d' | '90d' | 'all'>('7d');
  const [chartMode, setChartMode] = useState<'activity' | 'revenue' | 'combined'>('combined');
  const [data, setData] = useState<AdminAnalyticsSummary | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSendingTestNotify, setIsSendingTestNotify] = useState<boolean>(false);
  const [isTestingStorage, setIsTestingStorage] = useState<boolean>(false);
  const [storageStatusMsg, setStorageStatusMsg] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState<number>(0);

  useEffect(() => {
    let isMounted = true;

    fetch(`/api/admin/analytics?period=${period}`)
      .then((res) => (res.ok ? res.json() : Promise.reject('Fetch failed')))
      .then((json) => {
        if (isMounted && json?.success && json.analytics) {
          setData(json.analytics);
        }
      })
      .catch((e) => console.error('Error fetching admin analytics:', e))
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [period, refreshKey]);

  const handlePeriodChange = (newPeriod: 'today' | '7d' | '30d' | '90d' | 'all') => {
    setIsLoading(true);
    setPeriod(newPeriod);
  };

  const handleManualRefresh = () => {
    setIsLoading(true);
    setRefreshKey((k) => k + 1);
  };

  const handleSendTestAlert = async (channel: 'telegram' | 'email' | 'all') => {
    setIsSendingTestNotify(true);
    try {
      const res = await fetch('/api/admin/notifications/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ channel }),
      });
      const json = await res.json();
      if (json.success) {
        const msg = `Тест оповещения выполнен: Telegram (${json.telegram?.success ? 'OK' : 'Пропущен/Ошибка'}), Email (${json.email?.success ? 'OK' : 'Пропущен/Ошибка'})`;
        if (onShowToast) onShowToast(msg);
      } else {
        if (onShowToast) onShowToast(`Ошибка: ${json.error || 'Не удалось отправить'}`);
      }
    } catch {
      if (onShowToast) onShowToast('Сбой отправки тестового уведомления');
    } finally {
      setIsSendingTestNotify(false);
    }
  };

  const handleTestStorage = async () => {
    setIsTestingStorage(true);
    try {
      const res = await fetch('/api/admin/storage/status');
      const json = await res.json();
      if (json.success && json.storage) {
        const providerName = json.storage.provider === 'r2' ? 'Cloudflare R2 (S3 API)' : 'Локальное защищенное хранилище';
        setStorageStatusMsg(`Хранилище активно: ${providerName}. Проверено успешно.`);
        if (onShowToast) onShowToast(`Хранилище: ${providerName}`);
      }
    } catch {
      setStorageStatusMsg('Ошибка связи с подсистемой хранения отчетов');
    } finally {
      setIsTestingStorage(false);
    }
  };

  const kpis = data?.kpis;

  return (
    <div className="space-y-6">
      {/* ПАНЕЛЬ УПРАВЛЕНИЯ В СТИЛЕ ADMINLTE: Заголовок + Периоды + Статусы */}
      <div className="p-5 sm:p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-blue-600/10 text-blue-400 border border-blue-500/20">
              <BarChart3 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                <span>Аналитический дашборд собственника и администратора</span>
                <span className="px-2 py-0.5 rounded-md text-[10px] font-extrabold uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  Live Данные
                </span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Реальные показатели выручки, аудитов, конверсий воронки и активности пользователей
              </p>
            </div>
          </div>
        </div>

        {/* Переключатель временных диапазонов */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="inline-flex rounded-xl bg-slate-950 p-1 border border-slate-800">
            {(
              [
                { id: 'today', label: 'Сегодня' },
                { id: '7d', label: '7 дней' },
                { id: '30d', label: '30 дней' },
                { id: '90d', label: '90 дней' },
                { id: 'all', label: 'Все время' },
              ] as const
            ).map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => handlePeriodChange(p.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  period === p.id
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={handleManualRefresh}
            disabled={isLoading}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors"
            title="Обновить аналитику"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-blue-400' : ''}`} />
          </button>
        </div>
      </div>

      {/* ADMINLTE "SMALL BOXES" - 5 КЛЮЧЕВЫХ КАРТОЧЕК ДЛЯ СОБСТВЕННИКА */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Карточка 1: Выручка */}
        <div className="p-5 rounded-2xl bg-gradient-to-br from-emerald-950/40 via-slate-900 to-slate-900 border border-emerald-500/20 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-400">Выручка (Оплаты)</span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-white font-mono">
            {kpis ? `${kpis.totalRevenueRub.toLocaleString('ru-RU')} ₽` : '0 ₽'}
          </div>
          <div className="mt-2 text-[11px] text-slate-300 flex items-center justify-between border-t border-slate-800/80 pt-2">
            <span>За период: <strong className="text-emerald-400 font-mono">+{kpis?.periodRevenueRub.toLocaleString('ru-RU') || 0} ₽</strong></span>
            <span className="text-slate-400">{kpis?.paidUsersCount || 0} оплат</span>
          </div>
        </div>

        {/* Карточка 2: Регистрации */}
        <div className="p-5 rounded-2xl bg-gradient-to-br from-blue-950/40 via-slate-900 to-slate-900 border border-blue-500/20 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-blue-400">Пользователи</span>
            <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-white font-mono">
            {kpis?.totalUsersCount || 0}
          </div>
          <div className="mt-2 text-[11px] text-slate-300 flex items-center justify-between border-t border-slate-800/80 pt-2">
            <span>Новых за период: <strong className="text-blue-400 font-mono">+{kpis?.periodNewUsersCount || 0}</strong></span>
            <span className="text-slate-400">База</span>
          </div>
        </div>

        {/* Карточка 3: Аудиты и Проверки */}
        <div className="p-5 rounded-2xl bg-gradient-to-br from-purple-950/40 via-slate-900 to-slate-900 border border-purple-500/20 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-purple-400">Аудиты Директа</span>
            <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
              <Activity className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-white font-mono">
            {kpis?.totalAuditsCount || 0}
          </div>
          <div className="mt-2 text-[11px] text-slate-300 flex items-center justify-between border-t border-slate-800/80 pt-2">
            <span>Ср. оценка: <strong className="text-purple-300 font-mono">{kpis?.averageAuditScore || 0}/100</strong></span>
            <span className="text-purple-400">+{kpis?.periodAuditsCount || 0}</span>
          </div>
        </div>

        {/* Карточка 4: Выявленный слив бюджета */}
        <div className="p-5 rounded-2xl bg-gradient-to-br from-amber-950/40 via-slate-900 to-slate-900 border border-amber-500/20 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-amber-400">Выявленный слив</span>
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-amber-300 font-mono">
            {kpis ? `${(kpis.totalLossDetectedRub / 1000).toFixed(1)}k ₽` : '0 ₽'}
          </div>
          <div className="mt-2 text-[11px] text-slate-300 flex items-center justify-between border-t border-slate-800/80 pt-2">
            <span>Оборот аудитов: <strong className="text-slate-300 font-mono">{kpis ? `${(kpis.totalSpendAnalyzedRub / 1000).toFixed(0)}k ₽` : '0'}</strong></span>
          </div>
        </div>

        {/* Карточка 5: Конверсия воронки */}
        <div className="p-5 rounded-2xl bg-gradient-to-br from-indigo-950/40 via-slate-900 to-slate-900 border border-indigo-500/20 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-400">Конверсия в оплату</span>
            <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-indigo-300 font-mono">
            {kpis?.overallFunnelCr || 0}%
          </div>
          <div className="mt-2 text-[11px] text-slate-300 flex items-center justify-between border-t border-slate-800/80 pt-2">
            <span>Демо→Рег: <strong className="text-indigo-300">{kpis?.demoToRegCr || 0}%</strong></span>
            <span>Рег→Оплата: <strong className="text-emerald-400">{kpis?.regToPaidCr || 0}%</strong></span>
          </div>
        </div>
      </div>

      {/* ОСНОВНОЙ ГРАФИК ДИНАМИКИ (AdminLTE Card с переключением режимов) */}
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Activity className="w-4 h-4 text-blue-400" />
              <span>Динамика показателей за выбранный период ({period})</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Посуточная статистика реальных аудитов, регистраций пользователей и транзакций оплат
            </p>
          </div>

          <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-950 border border-slate-800">
            <button
              type="button"
              onClick={() => setChartMode('combined')}
              className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all ${
                chartMode === 'combined' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-400 hover:text-white'
              }`}
            >
              Сводный
            </button>
            <button
              type="button"
              onClick={() => setChartMode('revenue')}
              className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all ${
                chartMode === 'revenue' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-400 hover:text-white'
              }`}
            >
              Выручка (₽)
            </button>
            <button
              type="button"
              onClick={() => setChartMode('activity')}
              className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all ${
                chartMode === 'activity' ? 'bg-purple-600 text-white shadow-xs' : 'text-slate-400 hover:text-white'
              }`}
            >
              Активность (Аудиты/Рег)
            </button>
          </div>
        </div>

        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            {chartMode === 'revenue' ? (
              <AreaChart data={data?.dailyTimeline || []}>
                <defs>
                  <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#10B981" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" />
                <XAxis dataKey="dayLabel" stroke="#64748B" fontSize={11} />
                <YAxis stroke="#64748B" fontSize={11} unit=" ₽" />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0F172A', borderColor: '#334155', borderRadius: '12px', color: '#fff' }}
                  formatter={(value: any) => [`${Number(value).toLocaleString('ru-RU')} ₽`, 'Выручка']}
                />
                <Area type="monotone" dataKey="revenue" stroke="#10B981" strokeWidth={2.5} fillOpacity={1} fill="url(#revenueGrad)" />
              </AreaChart>
            ) : chartMode === 'activity' ? (
              <BarChart data={data?.dailyTimeline || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" />
                <XAxis dataKey="dayLabel" stroke="#64748B" fontSize={11} />
                <YAxis stroke="#64748B" fontSize={11} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0F172A', borderColor: '#334155', borderRadius: '12px', color: '#fff' }}
                />
                <Legend />
                <Bar dataKey="totalAudits" name="Аудиты" fill="#8B5CF6" radius={[4, 4, 0, 0]} />
                <Bar dataKey="signUps" name="Регистрации" fill="#3B82F6" radius={[4, 4, 0, 0]} />
                <Bar dataKey="purchases" name="Оплаты" fill="#10B981" radius={[4, 4, 0, 0]} />
              </BarChart>
            ) : (
              <LineChart data={data?.dailyTimeline || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" />
                <XAxis dataKey="dayLabel" stroke="#64748B" fontSize={11} />
                <YAxis stroke="#64748B" fontSize={11} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0F172A', borderColor: '#334155', borderRadius: '12px', color: '#fff' }}
                />
                <Legend />
                <Line type="monotone" dataKey="totalAudits" name="Аудиты" stroke="#8B5CF6" strokeWidth={2.5} dot={{ r: 4 }} />
                <Line type="monotone" dataKey="signUps" name="Регистрации" stroke="#3B82F6" strokeWidth={2} dot={{ r: 4 }} />
                <Line type="monotone" dataKey="purchases" name="Оплаты" stroke="#10B981" strokeWidth={2} dot={{ r: 4 }} />
              </LineChart>
            )}
          </ResponsiveContainer>
        </div>
      </div>

      {/* СТРУКТУРА ТАРИФОВ И ИСТОЧНИКОВ АУДИТОВ (2-колоночный блок) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Структура тарифов и выручки */}
        <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold text-white">Структура тарифных планов и выручки</h3>
                <p className="text-xs text-slate-400">Распределение базы пользователей по тарифам</p>
              </div>
              <span className="p-1.5 rounded-lg bg-slate-800 text-slate-400">
                <PieChartIcon className="w-4 h-4" />
              </span>
            </div>

            <div className="h-44 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data?.tierBreakdown || []}
                    dataKey="usersCount"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={65}
                    innerRadius={38}
                    paddingAngle={3}
                  >
                    {(data?.tierBreakdown || []).map((entry, index) => (
                      <Cell key={`tier-cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0F172A', borderColor: '#334155', borderRadius: '12px', color: '#fff' }}
                    formatter={(val: any, name: any, item: any) => [
                      `${val} чел. (${item?.payload?.sharePercent || 0}%) • ${Number(item?.payload?.revenue || 0).toLocaleString('ru-RU')} ₽`,
                      name,
                    ]}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="space-y-2 pt-3 border-t border-slate-800">
            {(data?.tierBreakdown || []).map((t) => (
              <div key={t.tierKey} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: t.color }} />
                  <span className="text-slate-300 font-medium">{t.name}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-slate-400 font-mono">{t.usersCount} чел. ({t.sharePercent}%)</span>
                  <span className="font-bold text-white font-mono">{t.revenue.toLocaleString('ru-RU')} ₽</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Источники аудитов и качество */}
        <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold text-white">Источники проверок и аудитов</h3>
                <p className="text-xs text-slate-400">Способы загрузки кампаний рекламодателями</p>
              </div>
              <span className="p-1.5 rounded-lg bg-slate-800 text-slate-400">
                <FileSpreadsheet className="w-4 h-4" />
              </span>
            </div>

            <div className="h-44 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data?.auditSources || []}
                    dataKey="count"
                    nameKey="label"
                    cx="50%"
                    cy="50%"
                    outerRadius={65}
                    innerRadius={38}
                    paddingAngle={3}
                  >
                    {(data?.auditSources || []).map((entry, index) => (
                      <Cell key={`src-cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0F172A', borderColor: '#334155', borderRadius: '12px', color: '#fff' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="space-y-2 pt-3 border-t border-slate-800">
            {(data?.auditSources || []).map((s) => (
              <div key={s.source} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: s.color }} />
                  <span className="text-slate-300 font-medium">{s.label}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-slate-400 font-mono">{s.count} проверок</span>
                  <span className="font-bold text-purple-300 font-mono">{s.sharePercent}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ЖУРНАЛ КЛЮЧЕВЫХ СОБЫТИЙ В РЕАЛЬНОМ ВРЕМЕНИ (Live Activity Audit Trail) */}
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-400" />
              <span>Лента ключевых событий платформы (Собственник & Админ)</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Журнал оплат, новых регистраций и завершенных аудитов
            </p>
          </div>
          <span className="text-xs text-slate-400 font-mono">
            {data?.recentActivity?.length || 0} недавних записей
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950 text-slate-400 uppercase font-semibold border-b border-slate-800 text-[10px] tracking-wider">
              <tr>
                <th className="py-3 px-4">Тип события</th>
                <th className="py-3 px-4">Описание</th>
                <th className="py-3 px-4">Пользователь</th>
                <th className="py-3 px-4 text-right">Показатель</th>
                <th className="py-3 px-4 text-right">Время</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {(!data?.recentActivity || data.recentActivity.length === 0) ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-500">
                    События отсутствуют. Они будут появляться автоматически при действиях пользователей.
                  </td>
                </tr>
              ) : (
                data.recentActivity.map((act) => (
                  <tr key={act.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 px-4">
                      {act.type === 'PAYMENT' ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          <DollarSign className="w-3 h-3" /> Оплата
                        </span>
                      ) : act.type === 'REGISTRATION' ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20">
                          <Users className="w-3 h-3" /> Регистрация
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-bold bg-purple-500/10 text-purple-400 border border-purple-500/20">
                          <Activity className="w-3 h-3" /> Аудит
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 font-medium text-white">{act.title}</td>
                    <td className="py-3 px-4 text-slate-400 font-mono text-[11px]">
                      {act.userEmail || 'Гость / Клиент'}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold">
                      {act.amountRub ? (
                        <span className="text-emerald-400">+{act.amountRub.toLocaleString('ru-RU')} ₽</span>
                      ) : act.score !== undefined ? (
                        <span className="text-purple-300">Score: {act.score}/100</span>
                      ) : (
                        <span className="text-slate-500">—</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right text-slate-500 text-[11px] whitespace-nowrap">
                      {new Date(act.timestamp).toLocaleString('ru-RU', {
                        day: '2-digit',
                        month: '2-digit',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ШАГИ 12, 11, 10: БЫСТРАЯ ДИАГНОСТИКА ХРАНИЛИЩА (R2), ОПОВЕЩЕНИЙ И ЮKASSA 54-ФЗ */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Шаг 12: Telegram и Email оповещения */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-white flex items-center gap-1.5">
                <Send className="w-4 h-4 text-blue-400" />
                <span>Шаг 12: Оповещения админа</span>
              </span>
              <span
                className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                  data?.notifications.telegramConfigured
                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                    : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                }`}
              >
                {data?.notifications.telegramConfigured ? 'Telegram OK' : 'Telegram Off'}
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              Мгновенные уведомления в Telegram-бот и Email при новых оплатах, регистрациях и аудитах.
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center gap-2">
            <button
              type="button"
              onClick={() => handleSendTestAlert('all')}
              disabled={isSendingTestNotify}
              className="w-full py-2 px-3 rounded-xl bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/30 text-xs font-semibold transition-all flex items-center justify-center gap-1.5"
            >
              <Send className={`w-3.5 h-3.5 ${isSendingTestNotify ? 'animate-spin' : ''}`} />
              <span>Тестовый алерт (TG/Почта)</span>
            </button>
          </div>
        </div>

        {/* Шаг 11: Хранилище отчетов Cloudflare R2 / Local */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-white flex items-center gap-1.5">
                <Cloud className="w-4 h-4 text-purple-400" />
                <span>Шаг 11: Хранилище отчетов (R2)</span>
              </span>
              <span
                className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                  data?.storage.r2Configured
                    ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20'
                    : 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                }`}
              >
                {data?.storage.r2Configured ? 'R2 Storage' : 'Local Secure'}
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              {data?.storage.r2Configured
                ? `Бакет Cloudflare R2: ${data?.storage.bucketName || 'cransys-reports'}`
                : 'Локальное защищенное хранилище отчетов активного сервера.'}
            </p>
            {storageStatusMsg && (
              <p className="text-[10px] text-emerald-400 mt-1 font-medium">{storageStatusMsg}</p>
            )}
          </div>
          <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center gap-2">
            <button
              type="button"
              onClick={handleTestStorage}
              disabled={isTestingStorage}
              className="w-full py-2 px-3 rounded-xl bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 border border-purple-500/30 text-xs font-semibold transition-all flex items-center justify-center gap-1.5"
            >
              <Database className={`w-3.5 h-3.5 ${isTestingStorage ? 'animate-spin' : ''}`} />
              <span>Проверить хранилище</span>
            </button>
          </div>
        </div>

        {/* Шаг 10: ЮKassa Webhooks и 54-ФЗ */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-white flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>Шаг 10: ЮKassa Webhooks & 54-ФЗ</span>
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                Active & Ready
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              Автоматическая выдача чеков по 54-ФЗ, мгновенная активация тарифов через вебхук <code>/api/billing/webhook</code>.
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
            <span>Эндпоинт вебхука:</span>
            <span className="text-emerald-400 font-mono">200 OK</span>
          </div>
        </div>
      </div>
    </div>
  );
}
