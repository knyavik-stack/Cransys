'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Shield,
  Users,
  CreditCard,
  BarChart3,
  TrendingUp,
  Settings,
  RefreshCw,
  Search,
  CheckCircle2,
  AlertCircle,
  Eye,
  Sliders,
  UserCheck,
  Zap,
  Activity,
  ArrowUpRight,
  Sparkles,
  Lock,
  LogOut,
  ChevronRight,
  DollarSign,
  PieChart as PieChartIcon,
  HelpCircle,
  Clock,
  Filter,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Legend,
} from 'recharts';
import { useUser, UserProfile } from '@/lib/auth/user-context';
import { TIER_LIST, UserTier, getTierConfig } from '@/lib/billing/tiers';

// Начальные демонстрационные пользователи в системе
interface AdminUserRecord {
  id: string;
  email: string;
  name: string;
  tier: UserTier;
  reportsUsed: number;
  reportsLimit: number;
  role: string;
  createdAt: string;
  lastActive: string;
  revenue: number;
  agencyName?: string;
}

const INITIAL_USERS: AdminUserRecord[] = [
  {
    id: 'usr_001',
    email: 'alex.director@avto-podbor.ru',
    name: 'Александр (Автоподбор РФ)',
    tier: 'PRO',
    reportsUsed: 4,
    reportsLimit: 10,
    role: 'USER',
    createdAt: '2026-09-02',
    lastActive: '2026-09-15',
    revenue: 4990,
  },
  {
    id: 'usr_002',
    email: 'agency.lead@digital-scale.pro',
    name: 'Максим (Digital Scale Agency)',
    tier: 'MAX',
    reportsUsed: 18,
    reportsLimit: 30,
    role: 'USER',
    createdAt: '2026-08-28',
    lastActive: '2026-09-14',
    revenue: 9900,
    agencyName: 'Digital Scale Agency',
  },
  {
    id: 'usr_003',
    email: 'ceo@holding-group.ru',
    name: 'Елена (Холдинг Групп)',
    tier: 'CORP',
    reportsUsed: 84,
    reportsLimit: 500,
    role: 'USER',
    createdAt: '2026-09-01',
    lastActive: '2026-09-15',
    revenue: 29900,
    agencyName: 'Holding Group Media',
  },
  {
    id: 'usr_004',
    email: 'ivan.stroy@mebel-dom.ru',
    name: 'Иван Сергеев',
    tier: 'EXPRESS_PACK',
    reportsUsed: 3,
    reportsLimit: 3,
    role: 'USER',
    createdAt: '2026-09-10',
    lastActive: '2026-09-12',
    revenue: 399,
  },
  {
    id: 'usr_005',
    email: 'marketing@beauty-clinics.spb.ru',
    name: 'Клиника Красоты СПб',
    tier: 'PRO',
    reportsUsed: 7,
    reportsLimit: 10,
    role: 'USER',
    createdAt: '2026-09-08',
    lastActive: '2026-09-15',
    revenue: 4990,
  },
];

const GUEST_ANALYTICS_DATA = [
  { day: '09.09', demoAudits: 42, signUps: 8, purchases: 3 },
  { day: '10.09', demoAudits: 58, signUps: 12, purchases: 5 },
  { day: '11.09', demoAudits: 65, signUps: 15, purchases: 7 },
  { day: '12.09', demoAudits: 89, signUps: 21, purchases: 9 },
  { day: '13.09', demoAudits: 110, signUps: 28, purchases: 14 },
  { day: '14.09', demoAudits: 134, signUps: 36, purchases: 18 },
  { day: '15.09', demoAudits: 156, signUps: 41, purchases: 22 },
];

const DROP_OFF_REASONS = [
  { reason: 'Посмотрели Демо, но нет файла для выгрузки', percent: 38, count: 245, color: '#3B82F6' },
  { reason: 'Требуется согласование оплаты с бухгалтерией/руководством', percent: 27, count: 174, color: '#8B5CF6' },
  { reason: 'Ищут бесплатное решение без ограничений', percent: 18, count: 116, color: '#F59E0B' },
  { reason: 'Хотят прямое API без загрузки файла', percent: 12, count: 77, color: '#10B981' },
  { reason: 'Другие причины', percent: 5, count: 32, color: '#64748B' },
];

const TIER_COLORS: Record<UserTier, string> = {
  EXPRESS_SINGLE: '#94A3B8',
  EXPRESS_PACK: '#64748B',
  PRO: '#2563EB',
  MAX: '#9333EA',
  CORP: '#4F46E5',
};

export default function AdminPage() {
  const router = useRouter();
  const { user, loginWithCredentials, logout } = useUser();

  const [adminEmailInput, setAdminEmailInput] = useState('admin@cransys.ru');
  const [adminPassInput, setAdminPassInput] = useState('');
  const [loginError, setLoginError] = useState('');
  const [activeTab, setActiveTab] = useState<'analytics' | 'users' | 'funnel' | 'tiers'>('analytics');

  // Состояние пользователей
  const [users, setUsers] = useState<AdminUserRecord[]>(INITIAL_USERS);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUser, setSelectedUser] = useState<AdminUserRecord | null>(null);
  const [notification, setNotification] = useState<string | null>(null);

  const isAdmin = user?.role === 'ADMIN' || user?.email?.toLowerCase().includes('admin');

  const showNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3500);
  };

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    const res = await loginWithCredentials(adminEmailInput, adminPassInput);
    if (!res.success) {
      setLoginError(res.error || 'Неверный логин или пароль администратора');
    } else {
      showNotification('Успешный вход в панель супер-администратора!');
    }
  };

  const handleUpdateUserTier = (userId: string, newTier: UserTier) => {
    const config = getTierConfig(newTier);
    setUsers((prev) =>
      prev.map((u) =>
        u.id === userId
          ? {
              ...u,
              tier: newTier,
              reportsLimit: config.reportsLimit,
              revenue: u.revenue + config.price,
            }
          : u
      )
    );
    showNotification(`Тариф пользователя обновлен на ${newTier}`);
    if (selectedUser?.id === userId) {
      setSelectedUser((prev) =>
        prev
          ? {
              ...prev,
              tier: newTier,
              reportsLimit: config.reportsLimit,
            }
          : null
      );
    }
  };

  const handleAdjustReportLimit = (userId: string, newUsed: number, newLimit?: number) => {
    setUsers((prev) =>
      prev.map((u) =>
        u.id === userId
          ? {
              ...u,
              reportsUsed: Math.max(0, newUsed),
              reportsLimit: newLimit !== undefined ? newLimit : u.reportsLimit,
            }
          : u
      )
    );
    showNotification('Лимиты и статистика отчетов успешно обновлены');
  };

  const filteredUsers = users.filter(
    (u) =>
      u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.tier.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalRevenue = users.reduce((acc, u) => acc + u.revenue, 0) + 148500;
  const totalAuditsRun = users.reduce((acc, u) => acc + u.reportsUsed, 0) + 654;
  const totalGuestDemoAudits = 874;

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-slate-800 rounded-2xl border border-slate-700 p-8 text-white shadow-xl">
          <div className="w-12 h-12 rounded-xl bg-blue-600/20 text-blue-400 border border-blue-500/30 flex items-center justify-center mx-auto mb-4">
            <Lock className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold text-center mb-1">Панель управления Cransys</h2>
          <p className="text-xs text-slate-400 text-center mb-6">
            Доступ только для администраторов платформы
          </p>

          {loginError && (
            <div className="mb-4 p-3 rounded-xl bg-red-900/40 border border-red-700 text-red-200 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
              <span>{loginError}</span>
            </div>
          )}

          <form onSubmit={handleAdminLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Email администратора
              </label>
              <input
                type="email"
                required
                value={adminEmailInput}
                onChange={(e) => setAdminEmailInput(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-xl bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Пароль администратора
              </label>
              <input
                type="password"
                required
                value={adminPassInput}
                onChange={(e) => setAdminPassInput(e.target.value)}
                placeholder="••••••••"
                className="w-full px-3 py-2 text-sm rounded-xl bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-blue-500"
              />
            </div>

            <button
              type="submit"
              className="w-full py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs transition-colors shadow-md mt-2"
            >
              Войти в админ-панель
            </button>
          </form>

          <div className="mt-6 pt-4 border-t border-slate-700/60 text-center">
            <Link href="/" className="text-xs text-slate-400 hover:text-slate-200">
              ← Вернуться на сайт
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col">
      {/* Top Header */}
      <header className="bg-slate-900 text-white border-b border-slate-800 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-blue-600 text-white font-extrabold text-base flex items-center justify-center shadow-xs">
              C
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm sm:text-base text-white">Cransys Admin</span>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-semibold border border-emerald-500/30">
                  SuperAdmin
                </span>
              </div>
              <p className="text-[10px] text-slate-400">Управление пользователями, тарифами и конверсиями</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/dashboard"
              className="text-xs text-slate-300 hover:text-white px-3 py-1.5 rounded-lg border border-slate-700 hover:bg-slate-800 transition-colors"
            >
              Кабинет пользователя
            </Link>
            <button
              onClick={logout}
              className="text-xs text-red-400 hover:text-red-300 p-1.5 rounded-lg hover:bg-slate-800 transition-colors"
              title="Выйти"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Уведомление */}
      {notification && (
        <div className="bg-emerald-600 text-white text-xs font-semibold py-2 px-4 text-center shadow-md animate-fadeIn">
          {notification}
        </div>
      )}

      {/* Main Admin Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Верхние KPI метрики */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-xs font-semibold uppercase">Выручка за месяц</span>
              <DollarSign className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="text-2xl font-extrabold text-slate-900 font-mono">
              {totalRevenue.toLocaleString('ru-RU')} ₽
            </div>
            <p className="text-[11px] text-emerald-600 font-medium mt-1 flex items-center gap-1">
              <TrendingUp className="w-3 h-3" /> +28.4% к прошлому периоду
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-xs font-semibold uppercase">Всего аудитов</span>
              <Activity className="w-4 h-4 text-blue-600" />
            </div>
            <div className="text-2xl font-extrabold text-slate-900 font-mono">
              {totalAuditsRun}
            </div>
            <p className="text-[11px] text-slate-500 font-medium mt-1">
              {totalGuestDemoAudits} запусков в Демо (гости)
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-xs font-semibold uppercase">Клиенты с подпиской</span>
              <Users className="w-4 h-4 text-purple-600" />
            </div>
            <div className="text-2xl font-extrabold text-slate-900 font-mono">
              {users.length + 18}
            </div>
            <p className="text-[11px] text-purple-600 font-medium mt-1">
              Конверсия Демо → Оплата: 8.2%
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-xs font-semibold uppercase">Тариф Corp / Agency</span>
              <Sparkles className="w-4 h-4 text-indigo-600" />
            </div>
            <div className="text-2xl font-extrabold text-slate-900 font-mono">4</div>
            <p className="text-[11px] text-indigo-600 font-medium mt-1">
              White-label & API интеграция
            </p>
          </div>
        </div>

        {/* Навигационные вкладки админки */}
        <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
          <button
            onClick={() => setActiveTab('analytics')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 ${
              activeTab === 'analytics'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-200'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            <span>Дашборд и Графики</span>
          </button>

          <button
            onClick={() => setActiveTab('users')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 ${
              activeTab === 'users'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-200'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Управление пользователями ({users.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('funnel')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 ${
              activeTab === 'funnel'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-200'
            }`}
          >
            <Filter className="w-4 h-4" />
            <span>Аналитика Гостей и Дроп-офф</span>
          </button>

          <button
            onClick={() => setActiveTab('tiers')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 ${
              activeTab === 'tiers'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-200'
            }`}
          >
            <CreditCard className="w-4 h-4" />
            <span>Сетка тарифов и Лимиты</span>
          </button>
        </div>

        {/* Вкладка 1: Дашборд и Графики */}
        {activeTab === 'analytics' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* График динамики аудитов и оплат */}
              <div className="lg:col-span-2 p-6 rounded-2xl bg-white border border-slate-200 shadow-xs">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm">
                      Динамика запусков Демо, Регистраций и Оплат
                    </h3>
                    <p className="text-xs text-slate-500">Последние 7 дней активности</p>
                  </div>
                  <span className="text-[11px] font-semibold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-100">
                    Live данные
                  </span>
                </div>

                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={GUEST_ANALYTICS_DATA} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                      <XAxis dataKey="day" stroke="#94A3B8" fontSize={11} />
                      <YAxis stroke="#94A3B8" fontSize={11} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#1E293B',
                          borderRadius: '12px',
                          color: '#fff',
                          fontSize: '12px',
                        }}
                      />
                      <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                      <Bar dataKey="demoAudits" fill="#3B82F6" name="Демо аудиты (гости)" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="signUps" fill="#8B5CF6" name="Регистрации" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="purchases" fill="#10B981" name="Оплаты тарифов" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Распределение тарифов */}
              <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs flex flex-col justify-between">
                <div>
                  <h3 className="font-bold text-slate-900 text-sm mb-1">
                    Структура выручки по тарифам
                  </h3>
                  <p className="text-xs text-slate-500 mb-4">Доля тарифов в общем объеме продаж</p>
                </div>

                <div className="space-y-3">
                  {TIER_LIST.map((t) => (
                    <div key={t.id} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-slate-800">{t.name}</span>
                        <span className="font-mono text-slate-600">{t.priceFormatted}</span>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                        <div
                          className="h-full rounded-full"
                          style={{
                            backgroundColor: TIER_COLORS[t.id],
                            width:
                              t.id === 'PRO'
                                ? '45%'
                                : t.id === 'MAX'
                                ? '28%'
                                : t.id === 'CORP'
                                ? '18%'
                                : '9%',
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 text-xs text-slate-500">
                  Самый высокий LTV показывает тариф <strong className="text-slate-800">MAX (9 900 ₽)</strong> с White-label функционалом.
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Вкладка 2: Управление пользователями */}
        {activeTab === 'users' && (
          <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="relative w-full sm:w-80">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Поиск по email, имени или тарифу..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-slate-300 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="text-xs text-slate-500">
                Найдено пользователей: <strong className="text-slate-900">{filteredUsers.length}</strong>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                      <th className="p-3.5">Пользователь</th>
                      <th className="p-3.5">Текущий тариф</th>
                      <th className="p-3.5">Расход лимитов</th>
                      <th className="p-3.5">Выручка (LTV)</th>
                      <th className="p-3.5">Активность</th>
                      <th className="p-3.5 text-right">Действия</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs">
                    {filteredUsers.map((u) => {
                      const tierDef = getTierConfig(u.tier);
                      const isLimitExceeded = u.reportsUsed >= u.reportsLimit;

                      return (
                        <tr key={u.id} className="hover:bg-slate-50/70 transition-colors">
                          <td className="p-3.5">
                            <div className="font-bold text-slate-900">{u.name}</div>
                            <div className="text-slate-500 text-[11px]">{u.email}</div>
                            {u.agencyName && (
                              <div className="text-[10px] text-purple-600 font-medium mt-0.5">
                                🏢 {u.agencyName}
                              </div>
                            )}
                          </td>
                          <td className="p-3.5">
                            <select
                              value={u.tier}
                              onChange={(e) => handleUpdateUserTier(u.id, e.target.value as UserTier)}
                              className="text-xs font-semibold px-2.5 py-1 rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                            >
                              <option value="EXPRESS_SINGLE">Экспресс Single (399 ₽)</option>
                              <option value="EXPRESS_PACK">Экспресс Pack (990 ₽)</option>
                              <option value="PRO">PRO (4 990 ₽)</option>
                              <option value="MAX">MAX (9 900 ₽)</option>
                              <option value="CORP">Corp (29 900 ₽)</option>
                            </select>
                          </td>
                          <td className="p-3.5">
                            <div className="flex items-center gap-2">
                              <span
                                className={`font-mono font-bold ${
                                  isLimitExceeded ? 'text-red-600' : 'text-slate-800'
                                }`}
                              >
                                {u.reportsUsed} / {u.reportsLimit}
                              </span>
                              <div className="w-16 bg-slate-200 rounded-full h-1.5 overflow-hidden">
                                <div
                                  className={`h-full rounded-full ${
                                    isLimitExceeded ? 'bg-red-500' : 'bg-blue-600'
                                  }`}
                                  style={{
                                    width: `${Math.min(100, (u.reportsUsed / u.reportsLimit) * 100)}%`,
                                  }}
                                />
                              </div>
                            </div>
                          </td>
                          <td className="p-3.5 font-mono font-bold text-slate-900">
                            {u.revenue.toLocaleString('ru-RU')} ₽
                          </td>
                          <td className="p-3.5 text-slate-500 text-[11px]">
                            <div>Рег: {u.createdAt}</div>
                            <div>Вход: {u.lastActive}</div>
                          </td>
                          <td className="p-3.5 text-right space-x-1.5">
                            <button
                              onClick={() => handleAdjustReportLimit(u.id, 0)}
                              className="text-[11px] font-semibold px-2 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
                              title="Сбросить счетчик использованных отчетов в 0"
                            >
                              Сброс в 0
                            </button>
                            <button
                              onClick={() =>
                                handleAdjustReportLimit(u.id, u.reportsUsed, u.reportsLimit + 10)
                              }
                              className="text-[11px] font-semibold px-2 py-1 rounded bg-blue-50 hover:bg-blue-100 text-blue-700 transition-colors"
                              title="Добавить +10 бонусных отчетов"
                            >
                              +10 бонусом
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Вкладка 3: Аналитика Гостей и Дроп-офф */}
        {activeTab === 'funnel' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Причины ухода без покупки */}
              <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs">
                <h3 className="font-bold text-slate-900 text-sm mb-1">
                  Анализ оттока неавторизованных пользователей (Drop-Off)
                </h3>
                <p className="text-xs text-slate-500 mb-6">
                  На основе поведения 649 гостей, запустивших Демо, но не оформивших подписку
                </p>

                <div className="space-y-4">
                  {DROP_OFF_REASONS.map((item, idx) => (
                    <div key={idx} className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-medium text-slate-800">{item.reason}</span>
                        <span className="font-bold text-slate-900 font-mono">
                          {item.percent}% ({item.count} чел.)
                        </span>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                        <div
                          className="h-full rounded-full"
                          style={{
                            backgroundColor: item.color,
                            width: `${item.percent}%`,
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Выводы и Рекомендации для роста конверсии */}
              <div className="p-6 rounded-2xl bg-gradient-to-br from-blue-900 to-indigo-950 text-white shadow-xs flex flex-col justify-between">
                <div>
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-500/30 text-blue-300 text-[11px] font-semibold mb-3 border border-blue-400/30">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Инсайты для продуктового роста</span>
                  </div>
                  <h3 className="text-base font-bold text-white mb-2">
                    Как удвоить конверсию из Демо в Платный тариф:
                  </h3>
                  <ul className="space-y-2 text-xs text-blue-100 leading-relaxed">
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                      <span>
                        <strong>Прямой Direct API коннектор:</strong> 12% пользователей уходят, потому что ленятся скачивать XLSX из Директа. OAuth в 1 клик снимет этот барьер.
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                      <span>
                        <strong>Оплата по счету для юрлиц:</strong> 27% агентств и компаний ждут счет с НДС/без НДС для оплаты от юридического лица.
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                      <span>
                        <strong>Экспресс-триггер за 399 ₽:</strong> Отчет на 3 проверки за 399 ₽ отлично конвертирует сомневающихся микробизнесов.
                      </span>
                    </li>
                  </ul>
                </div>

                <div className="mt-6 pt-4 border-t border-blue-800 text-[11px] text-blue-300">
                  Все данные логируются в фоновом режиме без замедления UI пользователя.
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Вкладка 4: Сетка тарифов и настройки */}
        {activeTab === 'tiers' && (
          <div className="space-y-6">
            <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs">
              <h3 className="font-bold text-slate-900 text-sm mb-1">
                Актуальная сетка тарифов платформы Cransys
              </h3>
              <p className="text-xs text-slate-500 mb-6">
                Конфигурация параметров, лимитов отчетов и доступов к API
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                {TIER_LIST.map((plan) => (
                  <div
                    key={plan.id}
                    className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <h4 className="font-bold text-slate-900 text-sm">{plan.name}</h4>
                        {plan.popular && (
                          <span className="px-1.5 py-0.5 rounded bg-blue-100 text-blue-800 text-[9px] font-bold">
                            ХИТ
                          </span>
                        )}
                      </div>
                      <div className="text-lg font-extrabold font-mono text-slate-900 mb-2">
                        {plan.priceFormatted}
                      </div>
                      <div className="text-[11px] text-slate-600 space-y-1 mb-3">
                        <div>Лимит: <strong>{plan.reportsLimit} отчетов</strong></div>
                        <div>API: <strong>{plan.hasDirectApi ? 'Включено' : 'Выключено'}</strong></div>
                        <div>AI: <strong>{plan.hasAiInsights ? 'Gemini 3.8' : 'Базовый'}</strong></div>
                        <div>WhiteLabel: <strong>{plan.hasWhiteLabel ? 'Да' : 'Нет'}</strong></div>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-slate-200">
                      <span className="text-[10px] text-slate-400 font-mono">ID: {plan.id}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
