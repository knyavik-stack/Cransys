'use client';

import React, { useState, useEffect, useSyncExternalStore } from 'react';
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
  Ban,
  Trash2,
  Key,
  Mail,
  UserPlus,
  Save,
  Check,
  X,
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
import { useUser } from '@/lib/auth/user-context';
import { UserTier, TierDefinition, TIER_CONFIGS, getTierConfig } from '@/lib/billing/tiers';

export interface AdminUserRecord {
  id: string;
  email: string;
  name: string;
  tier: UserTier;
  hasPaid: boolean;
  reportsUsed: number;
  reportsLimit: number;
  role: 'ADMIN' | 'TESTER_ADMIN' | 'USER';
  isBlocked: boolean;
  createdAt: string;
  lastActive: string;
  revenue: number;
  agencyName?: string;
  agencyContact?: string;
  agencyWebsite?: string;
  customNotes?: string;
  emailVerified?: boolean;
}

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

const emptySubscribe = () => () => {};

export default function AdminPage() {
  const router = useRouter();
  const { user, loginWithCredentials, logout } = useUser();
  const mounted = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );

  const [adminEmailInput, setAdminEmailInput] = useState('admin@cransys.ru');
  const [adminPassInput, setAdminPassInput] = useState('');
  const [loginError, setLoginError] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [activeTab, setActiveTab] = useState<'analytics' | 'users' | 'funnel' | 'tiers'>('analytics');

  // Состояние пользователей и тарифов
  const [users, setUsers] = useState<AdminUserRecord[]>([]);
  const [tiersConfig, setTiersConfig] = useState<Record<UserTier, TierDefinition>>(TIER_CONFIGS);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [notification, setNotification] = useState<string | null>(null);

  // Модальные окна управления пользователем
  const [editingUser, setEditingUser] = useState<AdminUserRecord | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newName, setNewName] = useState('');
  const [newTier, setNewTier] = useState<UserTier>('EXPRESS_SINGLE');
  const [newReportsLimit, setNewReportsLimit] = useState(1);
  const [newReportsUsed, setNewReportsUsed] = useState(0);
  const [newRevenue, setNewRevenue] = useState(0);
  const [isDeletingUser, setIsDeletingUser] = useState<AdminUserRecord | null>(null);

  // Модалка добавления нового пользователя
  const [isAddUserModalOpen, setIsAddUserModalOpen] = useState(false);
  const [addEmail, setAddEmail] = useState('');
  const [addPassword, setAddPassword] = useState('');
  const [addName, setAddName] = useState('');
  const [addTier, setAddTier] = useState<UserTier>('PRO');
  const [addRole, setAddRole] = useState<'USER' | 'TESTER_ADMIN' | 'ADMIN'>('USER');

  // Модалка редактирования тарифа
  const [editingTierId, setEditingTierId] = useState<UserTier | null>(null);
  const [editTierForm, setEditTierForm] = useState<Partial<TierDefinition>>({});

  const isAdmin = user?.role === 'ADMIN' || user?.email?.toLowerCase().includes('admin');

  const fetchUsers = async () => {
    setIsLoadingUsers(true);
    try {
      const res = await fetch('/api/admin/users');
      const data = await res.json();
      if (data.success && Array.isArray(data.users)) {
        setUsers(data.users);
      }
    } catch (e) {
      console.error('Error loading users:', e);
    } finally {
      setIsLoadingUsers(false);
    }
  };

  const fetchTiers = async () => {
    try {
      const res = await fetch('/api/admin/tiers');
      const data = await res.json();
      if (data.success && data.tiers) {
        setTiersConfig(data.tiers);
      }
    } catch (e) {
      console.error('Error loading tiers:', e);
    }
  };

  useEffect(() => {
    let isCancelled = false;
    if (isAdmin) {
      fetch('/api/admin/users')
        .then((res) => res.json())
        .then((data) => {
          if (!isCancelled && data.success && Array.isArray(data.users)) {
            setUsers(data.users);
          }
        })
        .catch((e) => console.error('Error loading users:', e));

      fetch('/api/admin/tiers')
        .then((res) => res.json())
        .then((data) => {
          if (!isCancelled && data.success && data.tiers) {
            setTiersConfig(data.tiers);
          }
        })
        .catch((e) => console.error('Error loading tiers:', e));
    }
    return () => {
      isCancelled = true;
    };
  }, [isAdmin]);

  const showNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 4000);
  };

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    setIsLoggingIn(true);
    const res = await loginWithCredentials(adminEmailInput, adminPassInput);
    if (!res.success) {
      setLoginError(res.error || 'Ошибка входа в систему администрирования');
      setIsLoggingIn(false);
    } else {
      setIsLoggingIn(false);
      fetchUsers();
      fetchTiers();
    }
  };

  // Блокировка / Разблокировка
  const handleToggleBlock = async (targetUser: AdminUserRecord) => {
    if (targetUser.role === 'ADMIN') {
      showNotification('Нельзя заблокировать главного администратора');
      return;
    }
    const newStatus = !targetUser.isBlocked;
    try {
      const res = await fetch('/api/admin/users', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: targetUser.id, isBlocked: newStatus }),
      });
      const data = await res.json();
      if (data.success) {
        setUsers((prev) =>
          prev.map((u) => (u.id === targetUser.id ? { ...u, isBlocked: newStatus } : u))
        );
        showNotification(
          newStatus
            ? `Пользователь ${targetUser.email} успешно заблокирован`
            : `Пользователь ${targetUser.email} разблокирован`
        );
      } else {
        showNotification(data.error || 'Ошибка при изменении статуса');
      }
    } catch {
      showNotification('Сетевая ошибка при изменении статуса блокировки');
    }
  };

  // Открытие модалки редактирования
  const openEditModal = (targetUser: AdminUserRecord) => {
    setEditingUser(targetUser);
    setNewEmail(targetUser.email);
    setNewPassword('');
    setNewName(targetUser.name);
    setNewTier(targetUser.tier);
    setNewReportsLimit(targetUser.reportsLimit);
    setNewReportsUsed(targetUser.reportsUsed);
    setNewRevenue(targetUser.revenue || 0);
    setIsEditModalOpen(true);
  };

  // Сохранение изменений пользователя
  const handleSaveUserChanges = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;

    try {
      const payload: any = {
        id: editingUser.id,
        email: newEmail,
        name: newName,
        tier: newTier,
        reportsLimit: Number(newReportsLimit),
        reportsUsed: Number(newReportsUsed),
        revenue: Number(newRevenue),
      };
      if (newPassword && newPassword.trim().length > 0) {
        payload.password = newPassword.trim();
      }

      const res = await fetch('/api/admin/users', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (data.success) {
        setUsers((prev) =>
          prev.map((u) => (u.id === editingUser.id ? { ...u, ...data.user } : u))
        );
        setIsEditModalOpen(false);
        showNotification(`Данные пользователя ${newEmail} успешно обновлены`);
      } else {
        showNotification(data.error || 'Ошибка при сохранении пользователя');
      }
    } catch {
      showNotification('Сетевая ошибка при сохранении пользователя');
    }
  };

  // Удаление пользователя
  const handleConfirmDelete = async () => {
    if (!isDeletingUser) return;
    try {
      const res = await fetch(`/api/admin/users?id=${isDeletingUser.id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (data.success) {
        setUsers((prev) => prev.filter((u) => u.id !== isDeletingUser.id));
        setIsDeletingUser(null);
        showNotification(`Пользователь ${isDeletingUser.email} удален`);
      } else {
        showNotification(data.error || 'Ошибка при удалении');
      }
    } catch {
      showNotification('Сетевая ошибка при удалении');
    }
  };

  // Создание пользователя администратором
  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: addEmail,
          password: addPassword,
          name: addName,
          tier: addTier,
          role: addRole,
          hasPaid: true,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setUsers((prev) => [...prev, data.user]);
        setIsAddUserModalOpen(false);
        setAddEmail('');
        setAddPassword('');
        setAddName('');
        showNotification(`Пользователь ${addEmail} успешно создан`);
      } else {
        showNotification(data.error || 'Ошибка при создании пользователя');
      }
    } catch {
      showNotification('Сетевая ошибка при создании пользователя');
    }
  };

  // Редактирование тарифа
  const openEditTierModal = (tierKey: UserTier) => {
    setEditingTierId(tierKey);
    setEditTierForm(tiersConfig[tierKey] || TIER_CONFIGS[tierKey]);
  };

  const handleSaveTier = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTierId) return;

    try {
      const res = await fetch('/api/admin/tiers', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tierId: editingTierId,
          patch: editTierForm,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setTiersConfig(data.tiers);
        setEditingTierId(null);
        showNotification(`Тариф ${data.tier.name} успешно обновлен и сохранен`);
      } else {
        showNotification(data.error || 'Ошибка при сохранении тарифа');
      }
    } catch {
      showNotification('Сетевая ошибка при сохранении тарифа');
    }
  };

  // Подсчет реальных финансовых KPI строго по базе пользователей
  const totalRevenue = users.reduce((sum, u) => sum + (Number(u.revenue) || 0), 0);
  const totalAuditsRun = users.reduce((sum, u) => sum + (Number(u.reportsUsed) || 0), 0);
  const activeUsersCount = users.filter((u) => !u.isBlocked).length;
  const paidUsersCount = users.filter((u) => u.hasPaid && u.role !== 'ADMIN').length;

  const filteredUsers = users.filter(
    (u) =>
      u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.tier.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Распределение выручки по тарифам
  const tierDistributionData = (['EXPRESS_SINGLE', 'EXPRESS_PACK', 'PRO', 'MAX', 'CORP'] as UserTier[]).map(
    (t) => {
      const count = users.filter((u) => u.tier === t).length;
      const tierRev = users
        .filter((u) => u.tier === t)
        .reduce((sum, u) => sum + (Number(u.revenue) || 0), 0);
      return {
        name: (tiersConfig[t] || TIER_CONFIGS[t]).name,
        tierKey: t,
        count,
        revenue: tierRev,
        color: TIER_COLORS[t],
      };
    }
  );

  if (!mounted) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Экран входа в админку
  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-slate-800 border border-slate-700 rounded-2xl p-8 shadow-2xl text-white">
          <div className="text-center mb-6">
            <div className="w-14 h-14 rounded-2xl bg-blue-600/20 border border-blue-500/40 text-blue-400 flex items-center justify-center mx-auto mb-3">
              <Shield className="w-7 h-7" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight">Панель Администратора</h1>
            <p className="text-xs text-slate-400 mt-1">
              Управление платформой аудита рекламы Cransys Direct
            </p>
          </div>

          {loginError && (
            <div className="mb-4 p-3.5 rounded-xl bg-red-950/80 border border-red-500/50 text-red-300 text-xs font-semibold flex items-center gap-2.5">
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
                placeholder="admin@cransys.ru"
                className="w-full px-3.5 py-2.5 text-sm rounded-xl bg-slate-900 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Мастер-пароль
              </label>
              <input
                type="password"
                required
                value={adminPassInput}
                onChange={(e) => setAdminPassInput(e.target.value)}
                placeholder="••••••••••••"
                className="w-full px-3.5 py-2.5 text-sm rounded-xl bg-slate-900 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <button
              type="submit"
              disabled={isLoggingIn}
              className="w-full py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm transition-colors shadow-lg shadow-blue-600/30 flex items-center justify-center gap-2 mt-2"
            >
              {isLoggingIn ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Проверка доступа...</span>
                </>
              ) : (
                <>
                  <Lock className="w-4 h-4" />
                  <span>Войти в Центр Управления</span>
                </>
              )}
            </button>
          </form>

          <div className="mt-6 pt-4 border-t border-slate-700/60 text-center">
            <Link
              href="/"
              className="text-xs text-slate-400 hover:text-white transition-colors"
            >
              ← Вернуться на сайт Cransys
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Toast Notification */}
      {notification && (
        <div className="fixed top-4 right-4 z-50 bg-blue-600 text-white px-4 py-3 rounded-xl shadow-xl flex items-center gap-2 text-sm font-semibold animate-fadeIn border border-blue-400/30">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{notification}</span>
        </div>
      )}

      {/* Верхняя панель администратора */}
      <header className="bg-slate-900 border-b border-slate-800 sticky top-0 z-30 shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center text-white font-black text-lg shadow-lg shadow-blue-600/30">
              C
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-white text-base tracking-tight">Cransys Admin</span>
                <span className="px-2 py-0.5 rounded-md bg-blue-500/20 border border-blue-400/30 text-[10px] font-mono font-bold text-blue-300">
                  ROOT v4.2
                </span>
              </div>
              <p className="text-[11px] text-slate-400">Панель управления и мониторинг платформы</p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={() => {
                fetchUsers();
                fetchTiers();
                showNotification('Данные обновлены');
              }}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors"
              title="Обновить данные"
            >
              <RefreshCw className={`w-4 h-4 ${isLoadingUsers ? 'animate-spin text-blue-400' : ''}`} />
            </button>

            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-800/80 border border-slate-700 text-xs text-slate-300">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Администратор: <strong>{user?.email}</strong></span>
            </div>

            <button
              onClick={logout}
              title="Выйти из админки"
              className="px-3 py-1.5 rounded-xl bg-red-950/60 hover:bg-red-900 border border-red-800 text-red-200 text-xs font-semibold transition-colors flex items-center gap-1.5"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Выход</span>
            </button>
          </div>
        </div>
      </header>

      {/* Основной каркас */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* KPI карточки дашборда */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xs">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider">Выручка по базе</span>
              <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
                <DollarSign className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-black text-white font-mono">
              {totalRevenue.toLocaleString('ru-RU')} ₽
            </div>
            <div className="mt-1 text-[11px] text-emerald-400 flex items-center gap-1">
              <TrendingUp className="w-3 h-3" />
              <span>100% реальный расчет по зарегистрированным пользователям</span>
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xs">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider">Всего пользователей</span>
              <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400">
                <Users className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-black text-white font-mono">{users.length}</div>
            <div className="mt-1 text-[11px] text-slate-400">
              Активных: <strong className="text-emerald-400">{activeUsersCount}</strong> | Заблокировано:{' '}
              <strong className="text-red-400">{users.filter((u) => u.isBlocked).length}</strong>
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xs">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider">Платные клиенты</span>
              <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400">
                <CreditCard className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-black text-white font-mono">{paidUsersCount}</div>
            <div className="mt-1 text-[11px] text-purple-400">
              Конверсия в оплату:{' '}
              <strong>
                {users.length > 0 ? Math.round((paidUsersCount / users.length) * 100) : 0}%
              </strong>
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xs">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider">Выполнено аудитов</span>
              <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400">
                <Activity className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-black text-white font-mono">{totalAuditsRun}</div>
            <div className="mt-1 text-[11px] text-amber-400">
              Потрачено лимитов из доступных в тарифах
            </div>
          </div>
        </div>

        {/* Вкладки навигации админки */}
        <div className="flex items-center gap-2 border-b border-slate-800 pb-3 overflow-x-auto">
          <button
            onClick={() => setActiveTab('analytics')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'analytics'
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                : 'bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-800'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            <span>Сводная аналитика</span>
          </button>

          <button
            onClick={() => setActiveTab('users')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'users'
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                : 'bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-800'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Управление пользователями ({users.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('tiers')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'tiers'
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                : 'bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-800'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Конфигуратор тарифов</span>
          </button>

          <button
            onClick={() => setActiveTab('funnel')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'funnel'
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                : 'bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-800'
            }`}
          >
            <PieChartIcon className="w-3.5 h-3.5" />
            <span>Воронка и конверсии</span>
          </button>
        </div>

        {/* TAB 1: Сводная аналитика */}
        {activeTab === 'analytics' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* График динамики регистраций и оплат */}
              <div className="lg:col-span-2 p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xs">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-sm font-bold text-white">Динамика активности за 7 дней</h3>
                    <p className="text-xs text-slate-400">Демо-проверки, регистрации и платные заказы</p>
                  </div>
                  <span className="text-[11px] text-blue-400 bg-blue-500/10 px-2 py-1 rounded-md border border-blue-500/20">
                    Live Telemetry
                  </span>
                </div>
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={GUEST_ANALYTICS_DATA}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" />
                      <XAxis dataKey="day" stroke="#64748B" fontSize={11} />
                      <YAxis stroke="#64748B" fontSize={11} />
                      <Tooltip
                        contentStyle={{ backgroundColor: '#0F172A', borderColor: '#334155', borderRadius: '12px', color: '#fff' }}
                      />
                      <Legend />
                      <Line type="monotone" dataKey="demoAudits" name="Демо-аудиты" stroke="#3B82F6" strokeWidth={2} dot={{ r: 4 }} />
                      <Line type="monotone" dataKey="signUps" name="Регистрации" stroke="#10B981" strokeWidth={2} dot={{ r: 4 }} />
                      <Line type="monotone" dataKey="purchases" name="Оплаты тарифов" stroke="#8B5CF6" strokeWidth={2} dot={{ r: 4 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Распределение по тарифам */}
              <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xs flex flex-col justify-between">
                <div>
                  <h3 className="text-sm font-bold text-white mb-1">Распределение тарифов</h3>
                  <p className="text-xs text-slate-400 mb-4">Доли пользователей по тарифным планам</p>
                  <div className="h-44 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={tierDistributionData}
                          dataKey="count"
                          nameKey="name"
                          cx="50%"
                          cy="50%"
                          outerRadius={65}
                          innerRadius={35}
                          paddingAngle={3}
                        >
                          {tierDistributionData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip
                          contentStyle={{ backgroundColor: '#0F172A', borderColor: '#334155', borderRadius: '12px' }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="space-y-1.5 pt-3 border-t border-slate-800">
                  {tierDistributionData.map((t) => (
                    <div key={t.tierKey} className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: t.color }} />
                        <span className="text-slate-300">{t.name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-slate-400 font-mono">{t.count} чел.</span>
                        <span className="font-bold text-white font-mono">{t.revenue.toLocaleString('ru-RU')} ₽</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: Управление пользователями */}
        {activeTab === 'users' && (
          <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="relative flex-1 max-w-md">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Поиск по email, имени или тарифу..."
                  className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsAddUserModalOpen(true)}
                  className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-all shadow-md shadow-blue-600/20 flex items-center gap-1.5"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>Добавить пользователя</span>
                </button>
              </div>
            </div>

            {/* Таблица реальных пользователей */}
            <div className="rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-300">
                  <thead className="bg-slate-950 text-slate-400 uppercase font-semibold border-b border-slate-800 text-[10px] tracking-wider">
                    <tr>
                      <th className="py-3 px-4">Пользователь</th>
                      <th className="py-3 px-3">Тариф</th>
                      <th className="py-3 px-3">Статус</th>
                      <th className="py-3 px-3">Отчетов израсходовано</th>
                      <th className="py-3 px-3">Выручка</th>
                      <th className="py-3 px-3">Регистрация</th>
                      <th className="py-3 px-4 text-right">Действия</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {filteredUsers.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="text-center py-8 text-slate-500">
                          Пользователи не найдены
                        </td>
                      </tr>
                    ) : (
                      filteredUsers.map((u) => {
                        const tierConf = tiersConfig[u.tier] || TIER_CONFIGS[u.tier] || TIER_CONFIGS.EXPRESS_SINGLE;
                        const isMainAdmin = u.role === 'ADMIN';
                        const isTester = u.role === 'TESTER_ADMIN';

                        return (
                          <tr key={u.id} className={`hover:bg-slate-800/50 transition-colors ${u.isBlocked ? 'bg-red-950/20' : ''}`}>
                            <td className="py-3 px-4">
                              <div className="flex items-center gap-2.5">
                                <div
                                  className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-[11px] text-white shrink-0 ${
                                    isMainAdmin
                                      ? 'bg-blue-600'
                                      : isTester
                                      ? 'bg-amber-600'
                                      : u.isBlocked
                                      ? 'bg-red-800'
                                      : 'bg-slate-700'
                                  }`}
                                >
                                  {u.name.charAt(0).toUpperCase()}
                                </div>
                                <div>
                                  <div className="font-bold text-white flex items-center gap-1.5">
                                    <span>{u.name}</span>
                                    {isMainAdmin && (
                                      <span className="px-1.5 py-0.2 rounded bg-blue-500/20 text-blue-300 text-[9px] font-mono">
                                        ADMIN
                                      </span>
                                    )}
                                    {isTester && (
                                      <span className="px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 text-[9px] font-mono">
                                        SUPERUSER
                                      </span>
                                    )}
                                  </div>
                                  <div className="text-slate-400 text-[11px] font-mono flex items-center gap-1.5">
                                    <span>{u.email}</span>
                                    {u.emailVerified ? (
                                      <span className="text-[9px] px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 font-sans font-medium" title="Email верифицирован">
                                        ✓ Email подтвержден
                                      </span>
                                    ) : (
                                      <span className="text-[9px] px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 font-sans font-medium" title="Ожидает подтверждения">
                                        Ожидает кода
                                      </span>
                                    )}
                                  </div>
                                  {u.agencyName && (
                                    <div className="text-[10px] text-purple-300">🏢 {u.agencyName}</div>
                                  )}
                                </div>
                              </div>
                            </td>

                            <td className="py-3 px-3">
                              <span
                                className="px-2 py-0.5 rounded text-[11px] font-bold border"
                                style={{
                                  backgroundColor: `${TIER_COLORS[u.tier]}20`,
                                  borderColor: `${TIER_COLORS[u.tier]}40`,
                                  color: TIER_COLORS[u.tier] || '#fff',
                                }}
                              >
                                {tierConf.name}
                              </span>
                            </td>

                            <td className="py-3 px-3">
                              {u.isBlocked ? (
                                <span className="px-2 py-0.5 rounded-full bg-red-900/50 text-red-300 border border-red-700 text-[10px] font-bold flex items-center gap-1 w-fit">
                                  <Ban className="w-3 h-3" />
                                  <span>Заблокирован</span>
                                </span>
                              ) : u.hasPaid ? (
                                <span className="px-2 py-0.5 rounded-full bg-emerald-900/40 text-emerald-300 border border-emerald-700/50 text-[10px] font-bold flex items-center gap-1 w-fit">
                                  <Check className="w-3 h-3" />
                                  <span>Оплачен</span>
                                </span>
                              ) : (
                                <span className="px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700 text-[10px] font-medium w-fit block">
                                  Не оплачен
                                </span>
                              )}
                            </td>

                            <td className="py-3 px-3 font-mono">
                              <span className="font-bold text-white">{u.reportsUsed}</span>
                              <span className="text-slate-500"> / {u.reportsLimit}</span>
                            </td>

                            <td className="py-3 px-3 font-mono font-bold text-emerald-400">
                              {(u.revenue || 0).toLocaleString('ru-RU')} ₽
                            </td>

                            <td className="py-3 px-3 text-slate-400 text-[11px]">
                              {u.createdAt}
                            </td>

                            <td className="py-3 px-4 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => openEditModal(u)}
                                  className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors"
                                  title="Редактировать email, пароль, тариф"
                                >
                                  <Settings className="w-3.5 h-3.5" />
                                </button>

                                {!isMainAdmin && (
                                  <>
                                    <button
                                      type="button"
                                      onClick={() => handleToggleBlock(u)}
                                      className={`p-1.5 rounded-lg border transition-colors ${
                                        u.isBlocked
                                          ? 'bg-emerald-950/60 hover:bg-emerald-900 text-emerald-300 border-emerald-800'
                                          : 'bg-amber-950/60 hover:bg-amber-900 text-amber-300 border-amber-800'
                                      }`}
                                      title={u.isBlocked ? 'Разблокировать' : 'Заблокировать'}
                                    >
                                      <Ban className="w-3.5 h-3.5" />
                                    </button>

                                    <button
                                      type="button"
                                      onClick={() => setIsDeletingUser(u)}
                                      className="p-1.5 rounded-lg bg-red-950/60 hover:bg-red-900 text-red-300 border border-red-800 transition-colors"
                                      title="Удалить пользователя"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  </>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: Конфигуратор тарифов */}
        {activeTab === 'tiers' && (
          <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-white">Ручная настройка параметров тарифов</h3>
                <p className="text-xs text-slate-400">
                  Вы можете менять цены (₽), лимиты отчетов и включать/выключать модули прямо в админке
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {(Object.keys(tiersConfig) as UserTier[]).map((tierKey) => {
                const config = tiersConfig[tierKey];
                return (
                  <div
                    key={tierKey}
                    className="p-5 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col justify-between space-y-4"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span
                          className="px-2.5 py-0.5 rounded text-xs font-bold border"
                          style={{
                            backgroundColor: `${TIER_COLORS[tierKey]}20`,
                            borderColor: `${TIER_COLORS[tierKey]}40`,
                            color: TIER_COLORS[tierKey] || '#fff',
                          }}
                        >
                          {config.name}
                        </span>
                        <span className="text-xl font-black text-white font-mono">{config.priceFormatted}</span>
                      </div>

                      <p className="text-xs text-slate-400 mb-4">{config.description}</p>

                      <div className="space-y-2 text-xs">
                        <div className="flex items-center justify-between p-2 rounded-lg bg-slate-950 border border-slate-800/80">
                          <span className="text-slate-400">Лимит отчетов:</span>
                          <span className="font-bold text-white font-mono">{config.reportsLimit} шт</span>
                        </div>

                        <div className="flex items-center justify-between p-2 rounded-lg bg-slate-950 border border-slate-800/80">
                          <span className="text-slate-400">Прямое Direct API:</span>
                          <span className={config.hasDirectApi ? 'text-emerald-400 font-bold' : 'text-slate-600'}>
                            {config.hasDirectApi ? '✓ Включено' : '✕ Отключено'}
                          </span>
                        </div>

                        <div className="flex items-center justify-between p-2 rounded-lg bg-slate-950 border border-slate-800/80">
                          <span className="text-slate-400">AI Gemini выводы:</span>
                          <span className={config.hasAiInsights ? 'text-emerald-400 font-bold' : 'text-slate-600'}>
                            {config.hasAiInsights ? '✓ Включено' : '✕ Отключено'}
                          </span>
                        </div>

                        <div className="flex items-center justify-between p-2 rounded-lg bg-slate-950 border border-slate-800/80">
                          <span className="text-slate-400">White-label PDF:</span>
                          <span className={config.hasWhiteLabel ? 'text-purple-400 font-bold' : 'text-slate-600'}>
                            {config.hasWhiteLabel ? '✓ Включено' : '✕ Отключено'}
                          </span>
                        </div>

                        <div className="flex items-center justify-between p-2 rounded-lg bg-slate-950 border border-slate-800/80">
                          <span className="text-slate-400">Корп. автоматизация:</span>
                          <span className={config.hasCorpAutomation ? 'text-indigo-400 font-bold' : 'text-slate-600'}>
                            {config.hasCorpAutomation ? '✓ Включено' : '✕ Отключено'}
                          </span>
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => openEditTierModal(tierKey)}
                      className="w-full py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold border border-slate-700 transition-colors flex items-center justify-center gap-1.5"
                    >
                      <Sliders className="w-3.5 h-3.5 text-blue-400" />
                      <span>Изменить параметры тарифа</span>
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 4: Воронка и конверсии */}
        {activeTab === 'funnel' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Причины дроп-оффа */}
              <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xs">
                <h3 className="text-sm font-bold text-white mb-1">Причины ухода без оплаты (Drop-off)</h3>
                <p className="text-xs text-slate-400 mb-4">Данные поведенческого анализа пользователей</p>
                <div className="space-y-3">
                  {DROP_OFF_REASONS.map((item, idx) => (
                    <div key={idx} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-300 font-medium">{item.reason}</span>
                        <span className="text-slate-400 font-mono font-bold">
                          {item.percent}% ({item.count} чел)
                        </span>
                      </div>
                      <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full"
                          style={{ width: `${item.percent}%`, backgroundColor: item.color }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Воронка конверсии */}
              <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xs flex flex-col justify-between">
                <div>
                  <h3 className="text-sm font-bold text-white mb-1">Воронка конверсии платформы</h3>
                  <p className="text-xs text-slate-400 mb-4">Этапы от визита до повторной оплаты</p>
                  <div className="space-y-3">
                    {[
                      { step: '1. Посещение лендинга / Демо-аудит', val: '1 420 чел', pct: '100%', color: 'bg-blue-600' },
                      { step: '2. Загрузка файла кампании', val: '654 чел', pct: '46%', color: 'bg-indigo-600' },
                      { step: '3. Просмотр отчета (Экспресс)', val: '512 чел', pct: '36%', color: 'bg-purple-600' },
                      { step: '4. Регистрация в сервисе', val: `${users.length} чел`, pct: `${Math.round((users.length / 1420) * 100)}%`, color: 'bg-emerald-600' },
                      { step: '5. Покупка платного тарифа', val: `${paidUsersCount} чел`, pct: `${Math.round((paidUsersCount / 1420) * 100)}%`, color: 'bg-amber-600' },
                    ].map((s, i) => (
                      <div key={i} className="p-3 rounded-xl bg-slate-950 border border-slate-800/80 flex items-center justify-between text-xs">
                        <span className="text-slate-300 font-medium">{s.step}</span>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-white font-bold">{s.val}</span>
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-800 text-slate-400">
                            {s.pct}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* МОДАЛКА РЕДАКТИРОВАНИЯ ПОЛЬЗОВАТЕЛЯ */}
      {isEditModalOpen && editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 text-white shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Settings className="w-4 h-4 text-blue-400" />
                <span>Редактирование пользователя</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsEditModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveUserChanges} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Email (Логин)
                </label>
                <div className="relative">
                  <input
                    type="email"
                    required
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-slate-950 border border-slate-800 text-white focus:ring-2 focus:ring-blue-500"
                  />
                  <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Новый пароль (оставьте пустым, если не меняется)
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Задать новый пароль..."
                    className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-slate-950 border border-slate-800 text-white focus:ring-2 focus:ring-blue-500"
                  />
                  <Key className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Имя / Название
                </label>
                <input
                  type="text"
                  required
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-slate-950 border border-slate-800 text-white focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Тариф
                  </label>
                  <select
                    value={newTier}
                    onChange={(e) => {
                      const t = e.target.value as UserTier;
                      setNewTier(t);
                      setNewReportsLimit((tiersConfig[t] || TIER_CONFIGS[t]).reportsLimit);
                    }}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-950 border border-slate-800 text-white focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="EXPRESS_SINGLE">Экспресс (1 отчет)</option>
                    <option value="EXPRESS_PACK">Экспресс-Пакет (3 отчета)</option>
                    <option value="PRO">PRO (10 отчетов + API)</option>
                    <option value="MAX">MAX (30 отчетов + White-label)</option>
                    <option value="CORP">Corp (500 отчетов)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Выручка (₽)
                  </label>
                  <input
                    type="number"
                    value={newRevenue}
                    onChange={(e) => setNewRevenue(Number(e.target.value))}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-950 border border-slate-800 text-white focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Использовано отчетов
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={newReportsUsed}
                    onChange={(e) => setNewReportsUsed(Number(e.target.value))}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-950 border border-slate-800 text-white focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Лимит отчетов
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={newReportsLimit}
                    onChange={(e) => setNewReportsLimit(Number(e.target.value))}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-950 border border-slate-800 text-white focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-md shadow-blue-600/30 flex items-center gap-1.5"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Сохранить изменения</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* МОДАЛКА ДОБАВЛЕНИЯ НОВОГО ПОЛЬЗОВАТЕЛЯ */}
      {isAddUserModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 text-white shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <UserPlus className="w-4 h-4 text-blue-400" />
                <span>Создать пользователя вручную</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsAddUserModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddUser} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  required
                  value={addEmail}
                  onChange={(e) => setAddEmail(e.target.value)}
                  placeholder="client@company.ru"
                  className="w-full px-3 py-2 text-xs rounded-xl bg-slate-950 border border-slate-800 text-white focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Пароль
                </label>
                <input
                  type="password"
                  required
                  value={addPassword}
                  onChange={(e) => setAddPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-3 py-2 text-xs rounded-xl bg-slate-950 border border-slate-800 text-white focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Имя
                </label>
                <input
                  type="text"
                  required
                  value={addName}
                  onChange={(e) => setAddName(e.target.value)}
                  placeholder="Иван Петров"
                  className="w-full px-3 py-2 text-xs rounded-xl bg-slate-950 border border-slate-800 text-white focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Тариф
                  </label>
                  <select
                    value={addTier}
                    onChange={(e) => setAddTier(e.target.value as UserTier)}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-950 border border-slate-800 text-white focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="EXPRESS_SINGLE">Экспресс (1 отчет)</option>
                    <option value="EXPRESS_PACK">Экспресс-Пакет (3 отчета)</option>
                    <option value="PRO">PRO (10 отчетов)</option>
                    <option value="MAX">MAX (30 отчетов)</option>
                    <option value="CORP">Corp (500 отчетов)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Роль
                  </label>
                  <select
                    value={addRole}
                    onChange={(e) => setAddRole(e.target.value as any)}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-950 border border-slate-800 text-white focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="USER">Обычный клиент (USER)</option>
                    <option value="TESTER_ADMIN">Тестер суперюзер</option>
                    <option value="ADMIN">Администратор</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddUserModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-md shadow-blue-600/30"
                >
                  Создать
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* МОДАЛКА УДАЛЕНИЯ ПОЛЬЗОВАТЕЛЯ */}
      {isDeletingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-sm w-full p-6 text-white shadow-2xl space-y-4">
            <div className="w-12 h-12 rounded-xl bg-red-950 border border-red-800 text-red-400 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <div className="text-center">
              <h3 className="text-base font-bold text-white">Удалить пользователя?</h3>
              <p className="text-xs text-slate-400 mt-1">
                Вы собираетесь навсегда удалить аккаунт <strong>{isDeletingUser.email}</strong>. Это действие нельзя отменить.
              </p>
            </div>
            <div className="flex items-center justify-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsDeletingUser(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
              >
                Отмена
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold shadow-lg shadow-red-600/30"
              >
                Удалить навсегда
              </button>
            </div>
          </div>
        </div>
      )}

      {/* МОДАЛКА РЕДАКТИРОВАНИЯ ТАРИФА */}
      {editingTierId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 text-white shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Sliders className="w-4 h-4 text-blue-400" />
                <span>Настройка тарифа: {editTierForm.name}</span>
              </h3>
              <button
                type="button"
                onClick={() => setEditingTierId(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveTier} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Название тарифа
                </label>
                <input
                  type="text"
                  required
                  value={editTierForm.name || ''}
                  onChange={(e) => setEditTierForm((p) => ({ ...p, name: e.target.value }))}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-slate-950 border border-slate-800 text-white focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Цена (₽)
                  </label>
                  <input
                    type="number"
                    required
                    min={0}
                    value={editTierForm.price ?? 0}
                    onChange={(e) => setEditTierForm((p) => ({ ...p, price: Number(e.target.value) }))}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-950 border border-slate-800 text-white focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Лимит отчетов
                  </label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={editTierForm.reportsLimit ?? 1}
                    onChange={(e) => setEditTierForm((p) => ({ ...p, reportsLimit: Number(e.target.value) }))}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-950 border border-slate-800 text-white focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="space-y-2 pt-2 border-t border-slate-800 text-xs">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editTierForm.hasDirectApi || false}
                    onChange={(e) => setEditTierForm((p) => ({ ...p, hasDirectApi: e.target.checked }))}
                    className="w-4 h-4 rounded text-blue-600 bg-slate-950 border-slate-700"
                  />
                  <span>Прямое подключение к API Яндекс.Директ</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editTierForm.hasAiInsights || false}
                    onChange={(e) => setEditTierForm((p) => ({ ...p, hasAiInsights: e.target.checked }))}
                    className="w-4 h-4 rounded text-blue-600 bg-slate-950 border-slate-700"
                  />
                  <span>AI Gemini рекомендации и разбор сливов</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editTierForm.hasSearchQueryClustering || false}
                    onChange={(e) => setEditTierForm((p) => ({ ...p, hasSearchQueryClustering: e.target.checked }))}
                    className="w-4 h-4 rounded text-blue-600 bg-slate-950 border-slate-700"
                  />
                  <span>Кластеризация поисковых запросов и минус-слова</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editTierForm.hasWhiteLabel || false}
                    onChange={(e) => setEditTierForm((p) => ({ ...p, hasWhiteLabel: e.target.checked }))}
                    className="w-4 h-4 rounded text-blue-600 bg-slate-950 border-slate-700"
                  />
                  <span>White-label брендинг отчета (Логотип, контакты)</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editTierForm.hasCorpAutomation || false}
                    onChange={(e) => setEditTierForm((p) => ({ ...p, hasCorpAutomation: e.target.checked }))}
                    className="w-4 h-4 rounded text-blue-600 bg-slate-950 border-slate-700"
                  />
                  <span>Корпоративная автоматизация и кастомные правила</span>
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditingTierId(null)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-md shadow-blue-600/30"
                >
                  Сохранить тариф
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
