'use client';

import React, { useState, useEffect, useSyncExternalStore } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Logo } from '@/components/Logo';
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
  Share2,
  Send,
  Globe,
  Video,
  MessageSquare,
  ExternalLink,
  FileText,
  Plus,
  Cookie,
  Database,
  Server,
  Cpu,
  CheckCircle,
  MousePointerClick,
  Layers,
  Percent,
  Compass,
  Bell,
  Receipt,
  Copy,
  EyeOff,
  Smartphone,
  CheckSquare,
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
import { DEFAULT_SITE_SETTINGS, SiteSettings, SocialLinkItem, CookieConsentStats, CookieConsentRecord } from '@/lib/settings/types';
import { FunnelStatsResponse } from '@/lib/telemetry/types';
import { AnalyticsDashboard } from '@/components/AnalyticsDashboard';

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

const TIER_COLORS: Record<UserTier, string> = {
  EXPRESS_SINGLE: '#94A3B8',
  EXPRESS_PACK: '#64748B',
  PRO: '#2563EB',
  MAX: '#9333EA',
  CORP: '#4F46E5',
};

function formatDateTime(dateStr?: string | null): string {
  if (!dateStr) return '—';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return dateStr;
  }
}

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
  const [activeTab, setActiveTab] = useState<'analytics' | 'users' | 'funnel' | 'tiers' | 'yookassa' | 'notifications' | 'settings' | 'seo' | 'privacy' | 'system'>('analytics');

  // Состояние пользователей, тарифов и настроек сайта
  const [users, setUsers] = useState<AdminUserRecord[]>([]);
  const [tiersConfig, setTiersConfig] = useState<Record<UserTier, TierDefinition>>(TIER_CONFIGS);
  const [siteSettings, setSiteSettings] = useState<SiteSettings>(DEFAULT_SITE_SETTINGS);
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [notification, setNotification] = useState<string | null>(null);

  // Статус секретов и подключений
  const [systemStatus, setSystemStatus] = useState<any>(null);
  const [isLoadingSystemStatus, setIsLoadingSystemStatus] = useState(false);

  // 152-ФЗ Cookie согласия и аналитика
  const [cookieStats, setCookieStats] = useState<CookieConsentStats>({
    totalPrompts: 0,
    acceptedAll: 0,
    acceptedNecessary: 0,
    acceptedCustom: 0,
    lastUpdated: '',
  });
  const [cookieLogs, setCookieLogs] = useState<CookieConsentRecord[]>([]);
  const [isLoadingCookieData, setIsLoadingCookieData] = useState(false);

  // Продуктовая телеметрия и сквозная воронка конверсий
  const [funnelPeriod, setFunnelPeriod] = useState<'today' | '7d' | '30d' | '90d' | 'all'>('7d');
  const [funnelStats, setFunnelStats] = useState<FunnelStatsResponse | null>(null);
  const [isLoadingFunnel, setIsLoadingFunnel] = useState(false);

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

  // Состояния для тестирования и отображения секретов ЮKassa & Оповещений
  const [isTestingYookassa, setIsTestingYookassa] = useState(false);
  const [yookassaTestResult, setYookassaTestResult] = useState<{ success: boolean; message?: string; error?: string; accountId?: string; testMode?: boolean; status?: string } | null>(null);
  const [showYooSecret, setShowYooSecret] = useState(false);

  const [isTestingTg, setIsTestingTg] = useState(false);
  const [tgTestResult, setTgTestResult] = useState<{ success: boolean; message?: string; error?: string } | null>(null);
  const [showTgToken, setShowTgToken] = useState(false);

  const [isTestingEmail, setIsTestingEmail] = useState(false);
  const [emailTestResult, setEmailTestResult] = useState<{ success: boolean; message?: string; error?: string } | null>(null);
  const [showSmtpPass, setShowSmtpPass] = useState(false);

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

  const fetchSettings = async () => {
    try {
      const res = await fetch('/api/settings');
      const data = await res.json();
      if (data.success && data.settings) {
        setSiteSettings(data.settings);
      }
    } catch (e) {
      console.error('Error loading site settings:', e);
    }
  };

  const fetchSystemStatus = async () => {
    setIsLoadingSystemStatus(true);
    try {
      const res = await fetch('/api/admin/system-status');
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setSystemStatus(data);
        }
      }
    } catch (e) {
      console.error('Error loading system status:', e);
    } finally {
      setIsLoadingSystemStatus(false);
    }
  };

  const fetchCookieConsents = async () => {
    setIsLoadingCookieData(true);
    try {
      const res = await fetch('/api/legal/cookie-consent');
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          if (data.stats) setCookieStats(data.stats);
          if (Array.isArray(data.recentLogs)) setCookieLogs(data.recentLogs);
        }
      }
    } catch (e) {
      console.error('Error loading cookie consent stats:', e);
    } finally {
      setIsLoadingCookieData(false);
    }
  };

  const fetchFunnelStats = async (period: 'today' | '7d' | '30d' | '90d' | 'all' = funnelPeriod) => {
    setIsLoadingFunnel(true);
    try {
      const res = await fetch(`/api/admin/funnel?period=${period}`);
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.stats) {
          setFunnelStats(data.stats);
        }
      }
    } catch (e) {
      console.error('Error loading funnel stats:', e);
    } finally {
      setIsLoadingFunnel(false);
    }
  };

  const handleClearFunnelStats = async () => {
    if (!confirm('Вы уверены, что хотите очистить все данные телеметрии и воронки? Тестовые события будут удалены, начнется учет с чистого листа.')) {
      return;
    }
    setIsLoadingFunnel(true);
    try {
      const res = await fetch('/api/admin/funnel', { method: 'DELETE' });
      if (res.ok) {
        const data = await res.json();
        if (data.stats) {
          setFunnelStats(data.stats);
        }
      }
    } catch (e) {
      console.error('Error clearing funnel stats:', e);
    } finally {
      setIsLoadingFunnel(false);
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

      fetch('/api/settings')
        .then((res) => res.json())
        .then((data) => {
          if (!isCancelled && data.success && data.settings) {
            setSiteSettings(data.settings);
          }
        })
        .catch((e) => console.error('Error loading settings:', e));

      fetch('/api/legal/cookie-consent')
        .then((res) => res.json())
        .then((data) => {
          if (!isCancelled && data.success) {
            if (data.stats) setCookieStats(data.stats);
            if (Array.isArray(data.recentLogs)) setCookieLogs(data.recentLogs);
          }
        })
        .catch((e) => console.error('Error loading cookie consents:', e));

      fetch(`/api/admin/funnel?period=${funnelPeriod}`)
        .then((res) => res.json())
        .then((data) => {
          if (!isCancelled && data.success && data.stats) {
            setFunnelStats(data.stats);
          }
        })
        .catch((e) => console.error('Error loading funnel stats:', e));
    }
    return () => {
      isCancelled = true;
    };
  }, [isAdmin, funnelPeriod]);

  const handleSaveSettings = async (customMessage?: string | React.MouseEvent) => {
    setIsSavingSettings(true);
    const msg = typeof customMessage === 'string' ? customMessage : 'Настройки успешно сохранены!';
    try {
      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ settings: siteSettings }),
      });
      const data = await res.json();
      if (data.success && data.settings) {
        setSiteSettings(data.settings);
        showNotification(msg);
      } else {
        showNotification(data.error || 'Ошибка при сохранении настроек');
      }
    } catch {
      showNotification('Сетевая ошибка при сохранении настроек');
    } finally {
      setIsSavingSettings(false);
    }
  };

  const handleSaveYookassa = () => handleSaveSettings('Настройки ЮKassa успешно сохранены в базе данных!');
  const handleSaveNotifications = () => handleSaveSettings('Настройки оповещений (Telegram / SMTP) успешно сохранены!');

  const handleTestYookassa = async () => {
    setIsTestingYookassa(true);
    setYookassaTestResult(null);
    try {
      const res = await fetch('/api/admin/yookassa/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          shopId: siteSettings.yookassa?.shopId,
          secretKey: siteSettings.yookassa?.secretKey,
        }),
      });
      const data = await res.json();
      setYookassaTestResult(data);
      if (data.success) {
        showNotification('Успешное соединение с ЮKassa API!');
      } else {
        showNotification(data.error || 'Ошибка проверки ЮKassa');
      }
    } catch (e: any) {
      setYookassaTestResult({ success: false, error: e?.message || 'Сбой сети при запросе к ЮKassa' });
      showNotification('Сбой сети при обращении к ЮKassa');
    } finally {
      setIsTestingYookassa(false);
    }
  };

  const handleTestTelegram = async () => {
    setIsTestingTg(true);
    setTgTestResult(null);
    try {
      const res = await fetch('/api/admin/notifications/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          channel: 'telegram',
          telegram: siteSettings.notifications?.telegram,
        }),
      });
      const data = await res.json();
      if (data.telegram?.success) {
        setTgTestResult({ success: true, message: 'Тестовое сообщение успешно доставлено в Telegram!' });
        showNotification('Тестовое сообщение отправлено в Telegram!');
      } else {
        setTgTestResult({ success: false, error: data.telegram?.error || 'Не удалось отправить сообщение в Telegram' });
        showNotification(data.telegram?.error || 'Ошибка отправки в Telegram');
      }
    } catch (e: any) {
      setTgTestResult({ success: false, error: e?.message || 'Сбой сети при отправке в Telegram' });
      showNotification('Сетевая ошибка при отправке в Telegram');
    } finally {
      setIsTestingTg(false);
    }
  };

  const handleTestEmail = async () => {
    setIsTestingEmail(true);
    setEmailTestResult(null);
    try {
      const res = await fetch('/api/admin/notifications/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          channel: 'email',
          email: siteSettings.notifications?.email,
        }),
      });
      const data = await res.json();
      if (data.email?.success) {
        setEmailTestResult({ success: true, message: 'Тестовое письмо успешно отправлено на указанный почтовый ящик!' });
        showNotification('Тестовое письмо успешно отправлено!');
      } else {
        setEmailTestResult({ success: false, error: data.email?.error || 'Не удалось отправить тестовое письмо' });
        showNotification(data.email?.error || 'Ошибка отправки email');
      }
    } catch (e: any) {
      setEmailTestResult({ success: false, error: e?.message || 'Сбой сети при отправке email' });
      showNotification('Сетевая ошибка при отправке email');
    } finally {
      setIsTestingEmail(false);
    }
  };

  const handleSocialChange = (id: string, field: keyof SocialLinkItem, value: any) => {
    setSiteSettings((prev) => ({
      ...prev,
      socials: prev.socials.map((item) =>
        item.id === id ? { ...item, [field]: value } : item
      ),
    }));
  };

  const handleAddSocialItem = () => {
    const newId = `custom_${Date.now()}`;
    const newItem: SocialLinkItem = {
      id: newId,
      name: 'Новая соцсеть',
      url: 'https://',
      enabled: true,
      icon: 'mail',
      description: 'Канал связи',
    };
    setSiteSettings((prev) => ({
      ...prev,
      socials: [...prev.socials, newItem],
    }));
  };

  const handleDeleteSocialItem = (id: string) => {
    setSiteSettings((prev) => ({
      ...prev,
      socials: prev.socials.filter((s) => s.id !== id),
    }));
  };

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
    const existing = tiersConfig[tierKey] || TIER_CONFIGS[tierKey];
    setEditTierForm({
      ...existing,
      features: Array.isArray(existing.features) ? [...existing.features] : [],
    });
  };

  const handleSaveTier = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTierId) return;

    try {
      const priceNum = Number(editTierForm.price) || 0;
      const formattedPrice = `${priceNum.toLocaleString('ru-RU')} ₽`;
      const cleanFeatures = (editTierForm.features || []).map((f) => f.trim()).filter(Boolean);

      const patchPayload = {
        ...editTierForm,
        price: priceNum,
        priceFormatted: formattedPrice,
        features: cleanFeatures,
      };

      const res = await fetch('/api/admin/tiers', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tierId: editingTierId,
          patch: patchPayload,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setTiersConfig(data.tiers);
        setEditingTierId(null);
        showNotification(`Тариф ${data.tier?.name || editTierForm.name} успешно сохранен и обновлен на сайте!`);
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
            <Logo size={36} className="shrink-0" />
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-white text-base tracking-[0.14em] uppercase">CRANSYS ADMIN</span>
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
        <div className="grid grid-cols-2 sm:grid-cols-5 lg:grid-cols-10 gap-2 border-b border-slate-800 pb-4">
          <button
            onClick={() => setActiveTab('analytics')}
            className={`px-3 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 text-center ${
              activeTab === 'analytics'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                : 'bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-800'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">Аналитика</span>
          </button>

          <button
            onClick={() => setActiveTab('users')}
            className={`px-3 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 text-center ${
              activeTab === 'users'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                : 'bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-800'
            }`}
          >
            <Users className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">База ({users.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('tiers')}
            className={`px-3 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 text-center ${
              activeTab === 'tiers'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                : 'bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-800'
            }`}
          >
            <Sliders className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">Тарифы</span>
          </button>

          <button
            onClick={() => setActiveTab('yookassa')}
            className={`px-3 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 text-center ${
              activeTab === 'yookassa'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                : 'bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-800'
            }`}
          >
            <CreditCard className="w-3.5 h-3.5 shrink-0 text-emerald-400" />
            <span className="truncate">ЮKassa</span>
          </button>

          <button
            onClick={() => setActiveTab('notifications')}
            className={`px-3 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 text-center ${
              activeTab === 'notifications'
                ? 'bg-sky-600 text-white shadow-md shadow-sky-600/30'
                : 'bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-800'
            }`}
          >
            <Bell className="w-3.5 h-3.5 shrink-0 text-sky-400" />
            <span className="truncate">Оповещения</span>
          </button>

          <button
            onClick={() => setActiveTab('funnel')}
            className={`px-3 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 text-center ${
              activeTab === 'funnel'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                : 'bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-800'
            }`}
          >
            <PieChartIcon className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">Воронка</span>
          </button>

          <button
            onClick={() => setActiveTab('settings')}
            className={`px-3 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 text-center ${
              activeTab === 'settings'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                : 'bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-800'
            }`}
          >
            <Share2 className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">Контакты</span>
          </button>

          <button
            onClick={() => setActiveTab('seo')}
            className={`px-3 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 text-center ${
              activeTab === 'seo'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                : 'bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-800'
            }`}
          >
            <Globe className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">SEO</span>
          </button>

          <button
            onClick={() => {
              setActiveTab('privacy');
              fetchCookieConsents();
            }}
            className={`px-3 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 text-center ${
              activeTab === 'privacy'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                : 'bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-800'
            }`}
          >
            <Cookie className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">152-ФЗ</span>
          </button>

          <button
            onClick={() => {
              setActiveTab('system');
              fetchSystemStatus();
            }}
            className={`px-3 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 text-center ${
              activeTab === 'system'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                : 'bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-800'
            }`}
          >
            <Server className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">Секреты</span>
          </button>
        </div>

        {/* TAB 1: Сводная аналитика для Собственника и Администратора (AdminLTE style + Live Data) */}
        {activeTab === 'analytics' && (
          <AnalyticsDashboard onShowToast={(msg: string) => showNotification(msg)} />
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
                      <th className="py-3 px-3">Отчетов</th>
                      <th className="py-3 px-3">Выручка</th>
                      <th className="py-3 px-3">Регистрация</th>
                      <th className="py-3 px-3">Последний вход</th>
                      <th className="py-3 px-4 text-right">Действия</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {filteredUsers.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="text-center py-8 text-slate-500">
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

                            <td className="py-3 px-3 text-slate-300 text-[11px] font-mono whitespace-nowrap">
                              {formatDateTime(u.createdAt)}
                            </td>

                            <td className="py-3 px-3 text-slate-400 text-[11px] font-mono whitespace-nowrap">
                              {u.lastActive ? formatDateTime(u.lastActive) : '—'}
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
            <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Sliders className="w-5 h-5 text-blue-400" />
                  <span>Управление тарифами, ценами и возможностями</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Любые изменения цен, бейджей, лимитов отчетов и пунктов возможностей сразу же синхронизируются с базой данных, обновляются на сайте и применяются при формировании платежей в ЮKassa.
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-xl">
                  {Object.keys(tiersConfig).length} активных тарифов
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {(Object.keys(tiersConfig) as UserTier[]).map((tierKey) => {
                const config = tiersConfig[tierKey];
                return (
                  <div
                    key={tierKey}
                    className={`p-5 rounded-2xl bg-slate-900 border flex flex-col justify-between space-y-4 transition-all ${
                      config.popular ? 'border-amber-500/40 shadow-lg shadow-amber-500/5' : 'border-slate-800'
                    }`}
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
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
                            {config.badge && (
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                                {config.badge}
                              </span>
                            )}
                            {config.popular && (
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30">
                                ★ Хит
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-slate-400 mt-1">
                            {config.period || 'разовый аудит'}
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="text-xl font-black text-white font-mono">{config.priceFormatted}</span>
                          <div className="text-[10px] text-slate-500">{(config.price || 0).toLocaleString('ru-RU')} ₽</div>
                        </div>
                      </div>

                      <p className="text-xs text-slate-400 mb-3 line-clamp-2">{config.description}</p>

                      {/* Список ключевых возможностей тарифа на сайте */}
                      <div className="p-3 rounded-xl bg-slate-950 border border-slate-800/80 mb-3 space-y-1.5">
                        <div className="text-[11px] font-bold text-slate-300 flex items-center justify-between">
                          <span>Возможности на карточке:</span>
                          <span className="text-slate-500 font-mono text-[10px]">{config.features?.length || 0} пунктов</span>
                        </div>
                        <ul className="space-y-1 text-[11px] text-slate-400 max-h-28 overflow-y-auto pr-1">
                          {(config.features || []).map((f, i) => (
                            <li key={i} className="flex items-start gap-1.5">
                              <span className="text-emerald-400 font-bold shrink-0 leading-tight">✓</span>
                              <span className="leading-tight text-slate-300">{f}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      {/* Технические параметры */}
                      <div className="space-y-1.5 text-xs">
                        <div className="flex items-center justify-between p-2 rounded-lg bg-slate-950/80 border border-slate-800/60">
                          <span className="text-slate-400">Лимит отчетов:</span>
                          <span className="font-bold text-white font-mono">{config.reportsLimit} шт</span>
                        </div>

                        <div className="flex items-center justify-between p-2 rounded-lg bg-slate-950/80 border border-slate-800/60">
                          <span className="text-slate-400">Direct API:</span>
                          <span className={config.hasDirectApi ? 'text-emerald-400 font-bold' : 'text-slate-600'}>
                            {config.hasDirectApi ? '✓ Включено' : '✕ Отключено'}
                          </span>
                        </div>

                        <div className="flex items-center justify-between p-2 rounded-lg bg-slate-950/80 border border-slate-800/60">
                          <span className="text-slate-400">AI Gemini выводы:</span>
                          <span className={config.hasAiInsights ? 'text-emerald-400 font-bold' : 'text-slate-600'}>
                            {config.hasAiInsights ? '✓ Включено' : '✕ Отключено'}
                          </span>
                        </div>

                        <div className="flex items-center justify-between p-2 rounded-lg bg-slate-950/80 border border-slate-800/60">
                          <span className="text-slate-400">Минус-слова / Поиск:</span>
                          <span className={config.hasSearchQueryClustering ? 'text-emerald-400 font-bold' : 'text-slate-600'}>
                            {config.hasSearchQueryClustering ? '✓ Включено' : '✕ Отключено'}
                          </span>
                        </div>

                        <div className="flex items-center justify-between p-2 rounded-lg bg-slate-950/80 border border-slate-800/60">
                          <span className="text-slate-400">White-label PDF:</span>
                          <span className={config.hasWhiteLabel ? 'text-purple-400 font-bold' : 'text-slate-600'}>
                            {config.hasWhiteLabel ? '✓ Включено' : '✕ Отключено'}
                          </span>
                        </div>

                        <div className="flex items-center justify-between p-2 rounded-lg bg-slate-950/80 border border-slate-800/60">
                          <span className="text-slate-400">База мусорных РСЯ:</span>
                          <span className={config.hasRsyaBlacklist ? 'text-emerald-400 font-bold' : 'text-slate-600'}>
                            {config.hasRsyaBlacklist ? '✓ 10 000+ площадок' : '✕ Отключено'}
                          </span>
                        </div>

                        <div className="flex items-center justify-between p-2 rounded-lg bg-slate-950/80 border border-slate-800/60">
                          <span className="text-slate-400">Корп. автоматизация:</span>
                          <span className={config.hasCorpAutomation ? 'text-emerald-400 font-bold' : 'text-slate-600'}>
                            {config.hasCorpAutomation ? '✓ Включено' : '✕ Отключено'}
                          </span>
                        </div>

                        <div className="flex items-center justify-between p-2 rounded-lg bg-slate-950/80 border border-slate-800/60">
                          <span className="text-slate-400">Мульти-аккаунты:</span>
                          <span className={config.hasMultiAccounts ? 'text-emerald-400 font-bold' : 'text-slate-600'}>
                            {config.hasMultiAccounts ? `✓ До ${config.maxConnectedAccounts || 5} шт.` : '✕ 1 аккаунт'}
                          </span>
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => openEditTierModal(tierKey)}
                      className="w-full py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold border border-slate-700 transition-colors flex items-center justify-center gap-1.5"
                    >
                      <Sliders className="w-3.5 h-3.5 text-blue-400" />
                      <span>Настроить тариф и возможности</span>
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB: Управление подключением ЮKassa & 54-ФЗ Онлайн-чеками */}
        {activeTab === 'yookassa' && (
          <div className="space-y-6">
            {/* Сводный статус платежной системы */}
            <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <CreditCard className="w-5 h-5 text-emerald-400" />
                    <span>Полное управление подключением ЮKassa и онлайн-чеками 54-ФЗ</span>
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">
                    Интеграция с официальным API ЮKassa. Все платежи по тарифам рассчитываются динамически с фискализацией по 54-ФЗ.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {siteSettings.yookassa?.enabled && siteSettings.yookassa?.shopId && siteSettings.yookassa?.secretKey ? (
                    <span className="px-3 py-1.5 rounded-xl bg-emerald-950 border border-emerald-500/30 text-emerald-300 text-xs font-bold flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      {siteSettings.yookassa.isTestMode ? 'Тестовый режим (Sandbox)' : 'Боевой шлюз активен'}
                    </span>
                  ) : (
                    <span className="px-3 py-1.5 rounded-xl bg-amber-950 border border-amber-500/30 text-amber-300 text-xs font-bold flex items-center gap-1.5">
                      <AlertCircle className="w-4 h-4 text-amber-400" />
                      Требуется настройка ключей
                    </span>
                  )}
                </div>
              </div>

              {/* Результат живого теста подключения */}
              {yookassaTestResult && (
                <div
                  className={`p-4 rounded-xl border flex items-start gap-3 ${
                    yookassaTestResult.success
                      ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-200'
                      : 'bg-red-950/60 border-red-500/40 text-red-200'
                  }`}
                >
                  {yookassaTestResult.success ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                  ) : (
                    <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                  )}
                  <div className="text-xs space-y-1">
                    <div className="font-bold">
                      {yookassaTestResult.success ? 'Успешное подключение к ЮKassa API!' : 'Ошибка подключения к ЮKassa API'}
                    </div>
                    <div>{yookassaTestResult.message || yookassaTestResult.error}</div>
                    {yookassaTestResult.accountId && (
                      <div className="font-mono text-[11px] opacity-80">
                        Shop ID магазина: {yookassaTestResult.accountId} | Режим: {yookassaTestResult.testMode ? 'Тестовый' : 'Боевой'}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Форма реквизитов подключения */}
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 rounded-xl bg-slate-950 border border-slate-800">
                  <div>
                    <span className="text-sm font-bold text-white">Прием платежей через ЮKassa</span>
                    <p className="text-xs text-slate-400">Включает кнопку оплаты тарифов на сайте через официальный шлюз ЮKassa</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={siteSettings.yookassa?.enabled ?? true}
                      onChange={(e) =>
                        setSiteSettings((prev) => ({
                          ...prev,
                          yookassa: { ...prev.yookassa, enabled: e.target.checked },
                        }))
                      }
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-800 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                  </label>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Идентификатор магазина (Shop ID)
                    </label>
                    <input
                      type="text"
                      value={siteSettings.yookassa?.shopId || ''}
                      onChange={(e) =>
                        setSiteSettings((prev) => ({
                          ...prev,
                          yookassa: { ...prev.yookassa, shopId: e.target.value.trim() },
                        }))
                      }
                      placeholder="Например: 123456"
                      className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-slate-950 border border-slate-800 text-white font-mono focus:ring-2 focus:ring-emerald-500"
                    />
                    <span className="text-[11px] text-slate-500 mt-1 block">Указан в личном кабинете ЮKassa в разделе «Интеграция → Ключи API»</span>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Секретный ключ API (Secret Key)
                    </label>
                    <div className="relative">
                      <input
                        type={showYooSecret ? 'text' : 'password'}
                        value={siteSettings.yookassa?.secretKey || ''}
                        onChange={(e) =>
                          setSiteSettings((prev) => ({
                            ...prev,
                            yookassa: { ...prev.yookassa, secretKey: e.target.value.trim() },
                          }))
                        }
                        placeholder="test_... или live_..."
                        className="w-full px-3.5 py-2.5 pr-10 text-xs rounded-xl bg-slate-950 border border-slate-800 text-white font-mono focus:ring-2 focus:ring-emerald-500"
                      />
                      <button
                        type="button"
                        onClick={() => setShowYooSecret(!showYooSecret)}
                        className="absolute right-3 top-2.5 text-slate-400 hover:text-white"
                      >
                        {showYooSecret ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    <span className="text-[11px] text-slate-500 mt-1 block">
                      {siteSettings.yookassa?.secretKey ? 'Ключ задан и защищен' : 'Не задан. Без ключа платежи не создаются.'}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                  <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-950 border border-slate-800">
                    <div>
                      <span className="text-xs font-bold text-white">Тестовый режим (Sandbox)</span>
                      <p className="text-[11px] text-slate-400">Использовать тестовые карты ЮKassa без реального списания средств</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={siteSettings.yookassa?.isTestMode ?? false}
                        onChange={(e) =>
                          setSiteSettings((prev) => ({
                            ...prev,
                            yookassa: { ...prev.yookassa, isTestMode: e.target.checked },
                          }))
                        }
                        className="sr-only peer"
                      />
                      <div className="w-10 h-5 bg-slate-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:bg-amber-600 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-950 border border-slate-800">
                    <div>
                      <span className="text-xs font-bold text-white">Авто-списание (Capture)</span>
                      <p className="text-[11px] text-slate-400">Мгновенное зачисление средств без ручного двухстадийного подтверждения</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={siteSettings.yookassa?.autoCapture ?? true}
                        onChange={(e) =>
                          setSiteSettings((prev) => ({
                            ...prev,
                            yookassa: { ...prev.yookassa, autoCapture: e.target.checked },
                          }))
                        }
                        className="sr-only peer"
                      />
                      <div className="w-10 h-5 bg-slate-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:bg-emerald-600 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all"></div>
                    </label>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Шаблон назначения платежа
                  </label>
                  <input
                    type="text"
                    value={siteSettings.yookassa?.descriptionTemplate || 'Оплата тарифа {tierName} на платформе Cransys'}
                    onChange={(e) =>
                      setSiteSettings((prev) => ({
                        ...prev,
                        yookassa: { ...prev.yookassa, descriptionTemplate: e.target.value },
                      }))
                    }
                    className="w-full px-3.5 py-2 text-xs rounded-xl bg-slate-950 border border-slate-800 text-white focus:ring-2 focus:ring-emerald-500"
                  />
                  <span className="text-[11px] text-slate-500 mt-1 block">
                    Доступные переменные: <code className="text-emerald-400">{'{tierName}'}</code>, <code className="text-emerald-400">{'{userEmail}'}</code>
                  </span>
                </div>
              </div>

              {/* Блок фискализации по 54-ФЗ */}
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3 pt-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Receipt className="w-4 h-4 text-emerald-400" />
                    <div>
                      <span className="text-xs font-bold text-white">Фискализация и онлайн-чеки по 54-ФЗ</span>
                      <p className="text-[11px] text-slate-400">Формирование чека с признаком расчета и отправка в ОФД через ЮKassa</p>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={siteSettings.yookassa?.receiptEnabled ?? true}
                      onChange={(e) =>
                        setSiteSettings((prev) => ({
                          ...prev,
                          yookassa: { ...prev.yookassa, receiptEnabled: e.target.checked },
                        }))
                      }
                      className="sr-only peer"
                    />
                    <div className="w-10 h-5 bg-slate-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:bg-emerald-600 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all"></div>
                  </label>
                </div>

                {siteSettings.yookassa?.receiptEnabled && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">
                        Система налогообложения (СНО)
                      </label>
                      <select
                        value={siteSettings.yookassa?.taxSystemCode ?? 2}
                        onChange={(e) =>
                          setSiteSettings((prev) => ({
                            ...prev,
                            yookassa: { ...prev.yookassa, taxSystemCode: Number(e.target.value) },
                          }))
                        }
                        className="w-full px-3 py-2 text-xs rounded-xl bg-slate-900 border border-slate-800 text-white focus:ring-2 focus:ring-emerald-500"
                      >
                        <option value={1}>1 — Общая (ОСН)</option>
                        <option value={2}>2 — Упрощенная доход (УСН Доходы 6%)</option>
                        <option value={3}>3 — Упрощенная доход минус расход (УСН 15%)</option>
                        <option value={4}>4 — ЕНВД</option>
                        <option value={5}>5 — Единый сельскохозяйственный налог (ЕСХН)</option>
                        <option value={6}>6 — Патентная система (ПСН)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">
                        Ставка НДС цифровых услуг
                      </label>
                      <select
                        value={siteSettings.yookassa?.vatCode ?? 1}
                        onChange={(e) =>
                          setSiteSettings((prev) => ({
                            ...prev,
                            yookassa: { ...prev.yookassa, vatCode: Number(e.target.value) },
                          }))
                        }
                        className="w-full px-3 py-2 text-xs rounded-xl bg-slate-900 border border-slate-800 text-white focus:ring-2 focus:ring-emerald-500"
                      >
                        <option value={1}>1 — Без НДС (типично для УСН)</option>
                        <option value={2}>2 — НДС по ставке 0%</option>
                        <option value={3}>3 — НДС по ставке 10%</option>
                        <option value={4}>4 — НДС по ставке 20%</option>
                      </select>
                    </div>
                  </div>
                )}
              </div>

              {/* Webhook URL подсказка */}
              <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="text-xs font-bold text-white flex items-center gap-1.5">
                    <Globe className="w-3.5 h-3.5 text-blue-400" />
                    <span>Webhook URL для личного кабинета ЮKassa:</span>
                  </div>
                  <div className="font-mono text-[11px] text-blue-300 mt-1 select-all break-all">
                    {typeof window !== 'undefined' ? `${window.location.origin}/api/billing/webhook` : '/api/billing/webhook'}
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    События в ЮKassa: <code className="text-slate-400">payment.succeeded</code>, <code className="text-slate-400">payment.canceled</code>
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const url = `${window.location.origin}/api/billing/webhook`;
                    navigator.clipboard.writeText(url);
                    showNotification('Webhook URL скопирован в буфер обмена');
                  }}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 shrink-0 self-start sm:self-center transition-colors"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>Копировать URL</span>
                </button>
              </div>

              {/* Кнопки действий ЮKassa */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={handleTestYookassa}
                  disabled={isTestingYookassa}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-slate-700 transition-colors flex items-center gap-2"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isTestingYookassa ? 'animate-spin text-emerald-400' : ''}`} />
                  <span>{isTestingYookassa ? 'Проверка соединения...' : 'Проверить подключение к ЮKassa API'}</span>
                </button>

                <button
                  type="button"
                  onClick={handleSaveYookassa}
                  disabled={isSavingSettings}
                  className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md shadow-emerald-600/30 transition-all flex items-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  <span>{isSavingSettings ? 'Сохранение...' : 'Сохранить настройки ЮKassa'}</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* TAB: Управление оповещениями (Telegram & SMTP Email) */}
        {activeTab === 'notifications' && (
          <div className="space-y-6">
            {/* Telegram Bot Настройки */}
            <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <Send className="w-5 h-5 text-sky-400" />
                    <span>Мгновенные оповещения в Telegram</span>
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">
                    Бот отправляет уведомления администратору о новых оплатах, регистрациях и проведенных аудитах рекламы.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {siteSettings.notifications?.telegram?.enabled && siteSettings.notifications?.telegram?.botToken && siteSettings.notifications?.telegram?.chatId ? (
                    <span className="px-3 py-1.5 rounded-xl bg-sky-950 border border-sky-500/30 text-sky-300 text-xs font-bold flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-sky-400" />
                      Telegram активен
                    </span>
                  ) : (
                    <span className="px-3 py-1.5 rounded-xl bg-slate-800 text-slate-400 text-xs font-bold">
                      Не настроен
                    </span>
                  )}
                </div>
              </div>

              {/* Результат теста Telegram */}
              {tgTestResult && (
                <div
                  className={`p-4 rounded-xl border flex items-start gap-3 ${
                    tgTestResult.success
                      ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-200'
                      : 'bg-red-950/60 border-red-500/40 text-red-200'
                  }`}
                >
                  {tgTestResult.success ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                  ) : (
                    <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                  )}
                  <div className="text-xs">
                    <div className="font-bold">{tgTestResult.success ? 'Успешно отправлено!' : 'Ошибка отправки в Telegram'}</div>
                    <div>{tgTestResult.message || tgTestResult.error}</div>
                  </div>
                </div>
              )}

              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 rounded-xl bg-slate-950 border border-slate-800">
                  <div>
                    <span className="text-sm font-bold text-white">Включить уведомления в Telegram</span>
                    <p className="text-xs text-slate-400">Отправка сообщений через официальный Telegram Bot API</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={siteSettings.notifications?.telegram?.enabled ?? false}
                      onChange={(e) =>
                        setSiteSettings((prev) => ({
                          ...prev,
                          notifications: {
                            ...prev.notifications,
                            telegram: { ...prev.notifications?.telegram, enabled: e.target.checked },
                          },
                        }))
                      }
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-800 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-sky-600"></div>
                  </label>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Telegram Bot Token
                    </label>
                    <div className="relative">
                      <input
                        type={showTgToken ? 'text' : 'password'}
                        value={siteSettings.notifications?.telegram?.botToken || ''}
                        onChange={(e) =>
                          setSiteSettings((prev) => ({
                            ...prev,
                            notifications: {
                              ...prev.notifications,
                              telegram: { ...prev.notifications?.telegram, botToken: e.target.value.trim() },
                            },
                          }))
                        }
                        placeholder="123456789:ABCdefGHIjklMNOpqrs..."
                        className="w-full px-3.5 py-2.5 pr-10 text-xs rounded-xl bg-slate-950 border border-slate-800 text-white font-mono focus:ring-2 focus:ring-sky-500"
                      />
                      <button
                        type="button"
                        onClick={() => setShowTgToken(!showTgToken)}
                        className="absolute right-3 top-2.5 text-slate-400 hover:text-white"
                      >
                        {showTgToken ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    <span className="text-[11px] text-slate-500 mt-1 block">Получите у @BotFather в Telegram</span>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Telegram Chat ID (Получатель)
                    </label>
                    <input
                      type="text"
                      value={siteSettings.notifications?.telegram?.chatId || ''}
                      onChange={(e) =>
                        setSiteSettings((prev) => ({
                          ...prev,
                          notifications: {
                            ...prev.notifications,
                            telegram: { ...prev.notifications?.telegram, chatId: e.target.value.trim() },
                          },
                        }))
                      }
                      placeholder="Например: 123456789 или -100123456789"
                      className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-slate-950 border border-slate-800 text-white font-mono focus:ring-2 focus:ring-sky-500"
                    />
                    <span className="text-[11px] text-slate-500 mt-1 block">Ваш ID (узнайте у @userinfobot) или ID рабочей группы</span>
                  </div>
                </div>

                {/* Чекбоксы событий Telegram */}
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2.5">
                  <div className="text-xs font-bold text-white mb-2">Оповещать в Telegram при следующих событиях:</div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    <label className="flex items-center gap-2 cursor-pointer p-2 rounded-lg bg-slate-900 border border-slate-800">
                      <input
                        type="checkbox"
                        checked={siteSettings.notifications?.telegram?.notifyOnPayment ?? true}
                        onChange={(e) =>
                          setSiteSettings((prev) => ({
                            ...prev,
                            notifications: {
                              ...prev.notifications,
                              telegram: { ...prev.notifications?.telegram, notifyOnPayment: e.target.checked },
                            },
                          }))
                        }
                        className="w-4 h-4 rounded text-sky-600 bg-slate-950 border-slate-700"
                      />
                      <span>💰 Оплата тарифа (сумма, тариф, пользователь)</span>
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer p-2 rounded-lg bg-slate-900 border border-slate-800">
                      <input
                        type="checkbox"
                        checked={siteSettings.notifications?.telegram?.notifyOnRegistration ?? true}
                        onChange={(e) =>
                          setSiteSettings((prev) => ({
                            ...prev,
                            notifications: {
                              ...prev.notifications,
                              telegram: { ...prev.notifications?.telegram, notifyOnRegistration: e.target.checked },
                            },
                          }))
                        }
                        className="w-4 h-4 rounded text-sky-600 bg-slate-950 border-slate-700"
                      />
                      <span>👤 Новая регистрация пользователя</span>
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer p-2 rounded-lg bg-slate-900 border border-slate-800">
                      <input
                        type="checkbox"
                        checked={siteSettings.notifications?.telegram?.notifyOnAudit ?? false}
                        onChange={(e) =>
                          setSiteSettings((prev) => ({
                            ...prev,
                            notifications: {
                              ...prev.notifications,
                              telegram: { ...prev.notifications?.telegram, notifyOnAudit: e.target.checked },
                            },
                          }))
                        }
                        className="w-4 h-4 rounded text-sky-600 bg-slate-950 border-slate-700"
                      />
                      <span>📊 Завершение аудита рекламных кампаний</span>
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer p-2 rounded-lg bg-slate-900 border border-slate-800">
                      <input
                        type="checkbox"
                        checked={siteSettings.notifications?.telegram?.notifyOnSystemError ?? true}
                        onChange={(e) =>
                          setSiteSettings((prev) => ({
                            ...prev,
                            notifications: {
                              ...prev.notifications,
                              telegram: { ...prev.notifications?.telegram, notifyOnSystemError: e.target.checked },
                            },
                          }))
                        }
                        className="w-4 h-4 rounded text-sky-600 bg-slate-950 border-slate-700"
                      />
                      <span>🚨 Критические системные сбои и ошибки</span>
                    </label>
                  </div>
                </div>

                <div className="flex items-center justify-start pt-1">
                  <button
                    type="button"
                    onClick={handleTestTelegram}
                    disabled={isTestingTg}
                    className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-sky-400 text-xs font-bold border border-slate-700 transition-colors flex items-center gap-2"
                  >
                    <Send className={`w-3.5 h-3.5 ${isTestingTg ? 'animate-pulse' : ''}`} />
                    <span>{isTestingTg ? 'Отправка...' : 'Отправить тестовое сообщение в Telegram'}</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Email (SMTP) Настройки */}
            <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <Mail className="w-5 h-5 text-blue-400" />
                    <span>Оповещения администратора по Email (SMTP)</span>
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">
                    Отправка отчетов и сводок на административную почту через корпоративный SMTP сервер.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {siteSettings.notifications?.email?.enabled && siteSettings.notifications?.email?.alertEmail ? (
                    <span className="px-3 py-1.5 rounded-xl bg-blue-950 border border-blue-500/30 text-blue-300 text-xs font-bold flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-blue-400" />
                      Email активен
                    </span>
                  ) : (
                    <span className="px-3 py-1.5 rounded-xl bg-slate-800 text-slate-400 text-xs font-bold">
                      Не настроен
                    </span>
                  )}
                </div>
              </div>

              {/* Результат теста Email */}
              {emailTestResult && (
                <div
                  className={`p-4 rounded-xl border flex items-start gap-3 ${
                    emailTestResult.success
                      ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-200'
                      : 'bg-red-950/60 border-red-500/40 text-red-200'
                  }`}
                >
                  {emailTestResult.success ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                  ) : (
                    <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                  )}
                  <div className="text-xs">
                    <div className="font-bold">{emailTestResult.success ? 'Письмо отправлено!' : 'Ошибка отправки Email'}</div>
                    <div>{emailTestResult.message || emailTestResult.error}</div>
                  </div>
                </div>
              )}

              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 rounded-xl bg-slate-950 border border-slate-800">
                  <div>
                    <span className="text-sm font-bold text-white">Включить Email-уведомления</span>
                    <p className="text-xs text-slate-400">Отправка системных уведомлений на почту администратора</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={siteSettings.notifications?.email?.enabled ?? false}
                      onChange={(e) =>
                        setSiteSettings((prev) => ({
                          ...prev,
                          notifications: {
                            ...prev.notifications,
                            email: { ...prev.notifications?.email, enabled: e.target.checked },
                          },
                        }))
                      }
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-800 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Email получателя уведомлений
                    </label>
                    <input
                      type="email"
                      value={siteSettings.notifications?.email?.alertEmail || ''}
                      onChange={(e) =>
                        setSiteSettings((prev) => ({
                          ...prev,
                          notifications: {
                            ...prev.notifications,
                            email: { ...prev.notifications?.email, alertEmail: e.target.value.trim() },
                          },
                        }))
                      }
                      placeholder="admin@cransys.ru"
                      className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-slate-950 border border-slate-800 text-white focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      SMTP Сервер (Host)
                    </label>
                    <input
                      type="text"
                      value={siteSettings.notifications?.email?.smtpHost || ''}
                      onChange={(e) =>
                        setSiteSettings((prev) => ({
                          ...prev,
                          notifications: {
                            ...prev.notifications,
                            email: { ...prev.notifications?.email, smtpHost: e.target.value.trim() },
                          },
                        }))
                      }
                      placeholder="smtp.yandex.ru или smtp.mail.ru"
                      className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-slate-950 border border-slate-800 text-white font-mono focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      SMTP Порт
                    </label>
                    <input
                      type="number"
                      value={siteSettings.notifications?.email?.smtpPort || 465}
                      onChange={(e) =>
                        setSiteSettings((prev) => ({
                          ...prev,
                          notifications: {
                            ...prev.notifications,
                            email: { ...prev.notifications?.email, smtpPort: Number(e.target.value) },
                          },
                        }))
                      }
                      placeholder="465 (SSL) или 587 (TLS)"
                      className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-slate-950 border border-slate-800 text-white font-mono focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      SMTP Логин / Пользователь
                    </label>
                    <input
                      type="text"
                      value={siteSettings.notifications?.email?.smtpUser || ''}
                      onChange={(e) =>
                        setSiteSettings((prev) => ({
                          ...prev,
                          notifications: {
                            ...prev.notifications,
                            email: { ...prev.notifications?.email, smtpUser: e.target.value.trim() },
                          },
                        }))
                      }
                      placeholder="robot@cransys.ru"
                      className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-slate-950 border border-slate-800 text-white font-mono focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      SMTP Пароль приложения
                    </label>
                    <div className="relative">
                      <input
                        type={showSmtpPass ? 'text' : 'password'}
                        value={siteSettings.notifications?.email?.smtpPass || ''}
                        onChange={(e) =>
                          setSiteSettings((prev) => ({
                            ...prev,
                            notifications: {
                              ...prev.notifications,
                              email: { ...prev.notifications?.email, smtpPass: e.target.value.trim() },
                            },
                          }))
                        }
                        placeholder="••••••••"
                        className="w-full px-3.5 py-2.5 pr-10 text-xs rounded-xl bg-slate-950 border border-slate-800 text-white font-mono focus:ring-2 focus:ring-blue-500"
                      />
                      <button
                        type="button"
                        onClick={() => setShowSmtpPass(!showSmtpPass)}
                        className="absolute right-3 top-2.5 text-slate-400 hover:text-white"
                      >
                        {showSmtpPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Имя и адрес отправителя
                    </label>
                    <input
                      type="text"
                      value={siteSettings.notifications?.email?.smtpFrom || ''}
                      onChange={(e) =>
                        setSiteSettings((prev) => ({
                          ...prev,
                          notifications: {
                            ...prev.notifications,
                            email: { ...prev.notifications?.email, smtpFrom: e.target.value },
                          },
                        }))
                      }
                      placeholder="«Cransys Платформа» <no-reply@cransys.ru>"
                      className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-slate-950 border border-slate-800 text-white focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-start pt-1">
                  <button
                    type="button"
                    onClick={handleTestEmail}
                    disabled={isTestingEmail}
                    className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-blue-400 text-xs font-bold border border-slate-700 transition-colors flex items-center gap-2"
                  >
                    <Mail className={`w-3.5 h-3.5 ${isTestingEmail ? 'animate-pulse' : ''}`} />
                    <span>{isTestingEmail ? 'Отправка...' : 'Отправить тестовое письмо'}</span>
                  </button>
                </div>
              </div>

              {/* Сохранение всех оповещений */}
              <div className="flex items-center justify-end pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={handleSaveNotifications}
                  disabled={isSavingSettings}
                  className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-md shadow-blue-600/30 transition-all flex items-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  <span>{isSavingSettings ? 'Сохранение...' : 'Сохранить настройки оповещений'}</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: Воронка и конверсии (Сквозная продуктовая телеметрия) */}
        {activeTab === 'funnel' && (
          <div className="space-y-6">
            {/* Панель управления и выбора периода */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xs">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Layers className="w-5 h-5 text-blue-400" />
                  <span>Сквозная продуктовая воронка и поведенческая телеметрия</span>
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Анализ пути посетителя: от визита лендинга и Демо-аудита до регистрации и оплаты тарифов (152-ФЗ compliant).
                </p>
              </div>

              <div className="flex items-center gap-2">
                <div className="inline-flex rounded-xl bg-slate-950 p-1 border border-slate-800">
                  {(
                    [
                      { id: 'today', label: 'Сегодня' },
                      { id: '7d', label: '7 дней' },
                      { id: '30d', label: '30 дней' },
                      { id: 'all', label: 'Все время' },
                    ] as const
                  ).map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => {
                        setFunnelPeriod(p.id);
                        fetchFunnelStats(p.id);
                      }}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                        funnelPeriod === p.id
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
                  onClick={() => fetchFunnelStats(funnelPeriod)}
                  disabled={isLoadingFunnel}
                  className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors"
                  title="Обновить аналитику воронки"
                >
                  <RefreshCw className={`w-4 h-4 ${isLoadingFunnel ? 'animate-spin text-blue-400' : ''}`} />
                </button>

                <button
                  type="button"
                  onClick={handleClearFunnelStats}
                  disabled={isLoadingFunnel}
                  className="px-3 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/20 text-xs font-semibold transition-colors flex items-center gap-1.5"
                  title="Очистить тестовые данные воронки"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Очистить тестовые</span>
                </button>
              </div>
            </div>

            {/* Главные KPI карточки воронки */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xs flex items-center justify-between">
                <div>
                  <div className="text-xs text-slate-400 font-medium">Всего посетителей</div>
                  <div className="text-2xl font-black text-white mt-1">
                    {funnelStats ? funnelStats.totalVisitors.toLocaleString('ru-RU') : '—'}
                  </div>
                  <div className="text-[11px] text-blue-400 font-semibold mt-1">
                    Охват за период ({funnelPeriod})
                  </div>
                </div>
                <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
                  <Compass className="w-6 h-6" />
                </div>
              </div>

              <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xs flex items-center justify-between">
                <div>
                  <div className="text-xs text-slate-400 font-medium">Запусков аудита</div>
                  <div className="text-2xl font-black text-indigo-400 mt-1">
                    {funnelStats?.steps?.[1] ? funnelStats.steps[1].count.toLocaleString('ru-RU') : '—'}
                  </div>
                  <div className="text-[11px] text-slate-400 font-semibold mt-1">
                    {funnelStats?.steps?.[1] ? `CR: ${funnelStats.steps[1].conversionFromFirst}% от входа` : '—'}
                  </div>
                </div>
                <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                  <Activity className="w-6 h-6" />
                </div>
              </div>

              <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xs flex items-center justify-between">
                <div>
                  <div className="text-xs text-slate-400 font-medium">Регистраций (152-ФЗ)</div>
                  <div className="text-2xl font-black text-emerald-400 mt-1">
                    {funnelStats?.steps?.[3] ? funnelStats.steps[3].count.toLocaleString('ru-RU') : '—'}
                  </div>
                  <div className="text-[11px] text-emerald-400/80 font-semibold mt-1">
                    {funnelStats?.steps?.[3] ? `CR: ${funnelStats.steps[3].conversionFromFirst}% от входа` : '—'}
                  </div>
                </div>
                <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                  <UserCheck className="w-6 h-6" />
                </div>
              </div>

              <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xs flex items-center justify-between">
                <div>
                  <div className="text-xs text-slate-400 font-medium">Сквозная конверсия (В оплату)</div>
                  <div className="text-2xl font-black text-amber-400 mt-1">
                    {funnelStats ? `${funnelStats.conversionRateOverall}%` : '—'}
                  </div>
                  <div className="text-[11px] text-amber-400/80 font-semibold mt-1">
                    {funnelStats?.steps?.[4] ? `${funnelStats.steps[4].count} успешных оплат` : '—'}
                  </div>
                </div>
                <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                  <Percent className="w-6 h-6" />
                </div>
              </div>
            </div>

            {/* Визуальная шаговая воронка конверсий */}
            <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-white">Поэтапная визуализация воронки платформы</h4>
                  <p className="text-xs text-slate-400 mt-0.5">Конверсия каждого шага и процент отвала пользователей</p>
                </div>
                <span className="text-xs font-mono font-bold text-blue-400 bg-blue-500/10 px-2.5 py-1 rounded-lg border border-blue-500/20">
                  5 ключевых микро-конверсий
                </span>
              </div>

              <div className="space-y-3 pt-2">
                {funnelStats?.steps?.map((step, idx) => {
                  const maxCount = Math.max(...(funnelStats.steps?.map((s) => s.count) || [100]));
                  const barWidth = Math.max(12, Math.round((step.count / maxCount) * 100));

                  return (
                    <div
                      key={step.stepId}
                      className="p-4 rounded-xl bg-slate-950 border border-slate-800/80 hover:border-slate-700 transition-colors"
                    >
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 mb-2">
                        <div className="flex items-center gap-2">
                          <span
                            className="w-2.5 h-2.5 rounded-full"
                            style={{ backgroundColor: step.color }}
                          />
                          <span className="text-xs sm:text-sm font-bold text-white">{step.title}</span>
                          <span className="text-[11px] text-slate-400 hidden sm:inline">
                            — {step.description}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 self-end md:self-auto">
                          <span className="font-mono text-xs sm:text-sm font-bold text-white">
                            {step.count.toLocaleString('ru-RU')} чел.
                          </span>
                          <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-blue-500/20 text-blue-400 border border-blue-500/30">
                            {step.conversionFromFirst}% от старта
                          </span>
                          {idx > 0 && (
                            <span className="text-[11px] font-semibold text-slate-400">
                              (Шаг: {step.conversionFromPrev}%)
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Прогресс-бар шага */}
                      <div className="w-full h-3 bg-slate-900 rounded-full overflow-hidden flex items-center">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{
                            width: `${barWidth}%`,
                            backgroundColor: step.color,
                          }}
                        />
                      </div>

                      {/* Данные дроп-оффа с предыдущего шага */}
                      {idx > 0 && step.dropOffCount > 0 && (
                        <div className="flex items-center justify-between text-[11px] text-slate-500 mt-2 pt-1 border-t border-slate-900">
                          <span>Ушли с этого шага:</span>
                          <span className="text-red-400/90 font-medium">
                            -{step.dropOffCount} чел. (-{step.dropOffPercent}%)
                          </span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 2 Колонки: Динамика по дням и Анализ источников трафика */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Источники трафика (UTM-метки) */}
              <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xs flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      <Globe className="w-4 h-4 text-emerald-400" />
                      <span>Источники трафика и конверсия каналов</span>
                    </h3>
                    <span className="text-[10px] text-slate-400 uppercase font-mono">UTM Tracking</span>
                  </div>
                  <p className="text-xs text-slate-400 mb-4">
                    Эффективность рекламных каналов, органики и прямых заходов
                  </p>

                  <div className="space-y-2.5">
                    {funnelStats?.utmSources && funnelStats.utmSources.length > 0 ? (
                      funnelStats.utmSources.slice(0, 6).map((src, i) => (
                        <div
                          key={i}
                          className="p-3 rounded-xl bg-slate-950 border border-slate-800/80 flex items-center justify-between text-xs"
                        >
                          <div className="space-y-0.5">
                            <div className="font-semibold text-slate-200">{src.source}</div>
                            <div className="text-[11px] text-slate-500">
                              {src.visitors} визитов • {src.audits} аудитов • {src.signups} рег.
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-bold text-emerald-400 font-mono">
                              {src.payments} оплат
                            </div>
                            <div className="text-[10px] text-slate-400">
                              CR: <span className="text-slate-200 font-bold">{src.conversionRate}%</span>
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="p-6 text-center text-xs text-slate-500">
                        Нет данных об источниках за выбранный период
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Причины дроп-оффа (Drop-off Analysis) */}
              <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xs flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-purple-400" />
                      <span>Причины ухода без оплаты (Drop-off)</span>
                    </h3>
                    <span className="text-[10px] text-slate-400 uppercase font-mono">AI Behavioral</span>
                  </div>
                  <p className="text-xs text-slate-400 mb-4">
                    Данные поведенческого анализа и глубинных интервью пользователей
                  </p>

                  <div className="space-y-3">
                    {funnelStats?.dropOffAnalysis?.map((item, idx) => (
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
              </div>
            </div>

            {/* График динамики конверсий по дням */}
            {funnelStats?.dailyDynamics && funnelStats.dailyDynamics.length > 0 && (
              <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xs">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-sm font-bold text-white">Динамика событий воронки по дням</h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Соотношение просмотров, запусков аудитов, регистраций и покупок
                    </p>
                  </div>
                  <div className="flex items-center gap-4 text-xs">
                    <span className="flex items-center gap-1.5 text-blue-400 font-semibold">
                      <span className="w-2.5 h-2.5 rounded-full bg-blue-500 inline-block" /> Визиты
                    </span>
                    <span className="flex items-center gap-1.5 text-indigo-400 font-semibold">
                      <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 inline-block" /> Аудиты
                    </span>
                    <span className="flex items-center gap-1.5 text-emerald-400 font-semibold">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" /> Регистрации
                    </span>
                    <span className="flex items-center gap-1.5 text-amber-400 font-semibold">
                      <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block" /> Оплаты
                    </span>
                  </div>
                </div>

                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={funnelStats.dailyDynamics} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" vertical={false} />
                      <XAxis dataKey="label" stroke="#64748B" fontSize={11} tickLine={false} />
                      <YAxis stroke="#64748B" fontSize={11} tickLine={false} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#0F172A',
                          borderColor: '#334155',
                          borderRadius: '12px',
                          color: '#F8FAFC',
                          fontSize: '12px',
                        }}
                      />
                      <Bar dataKey="visits" name="Визиты" fill="#3B82F6" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="audits" name="Аудиты" fill="#6366F1" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="signups" name="Регистрации" fill="#10B981" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="payments" name="Оплаты" fill="#F59E0B" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 5: Соцсети и контактные данные платформы */}
        {activeTab === 'settings' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xs">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Share2 className="w-5 h-5 text-blue-400" />
                  <span>Управление ссылками на соцсети и контактами</span>
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Настройте каналы коммуникации, сообщества и ссылки, отображаемые в подвале (Footer) на всех страницах сервиса.
                </p>
              </div>

              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={handleAddSocialItem}
                  className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 border border-slate-700 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5 text-blue-400" />
                  <span>Добавить канал</span>
                </button>

                <button
                  type="button"
                  onClick={handleSaveSettings}
                  disabled={isSavingSettings}
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-xs font-bold shadow-lg shadow-blue-600/30 flex items-center gap-1.5 transition-all"
                >
                  <Save className={`w-3.5 h-3.5 ${isSavingSettings ? 'animate-spin' : ''}`} />
                  <span>{isSavingSettings ? 'Сохранение...' : 'Сохранить настройки'}</span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Список социальных сетей */}
              <div className="lg:col-span-2 space-y-4">
                <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xs space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                    <h4 className="text-sm font-bold text-white">Список социальных сетей и сообществ</h4>
                    <span className="text-[11px] text-slate-400">
                      Активно: {siteSettings.socials.filter((s) => s.enabled).length} из {siteSettings.socials.length}
                    </span>
                  </div>

                  <div className="space-y-3">
                    {siteSettings.socials.map((soc) => (
                      <div
                        key={soc.id}
                        className={`p-4 rounded-xl border transition-all ${
                          soc.enabled
                            ? 'bg-slate-950/90 border-slate-700/80'
                            : 'bg-slate-950/40 border-slate-800/40 opacity-70'
                        }`}
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
                          <div className="flex items-center gap-2.5">
                            <label className="relative flex items-center cursor-pointer">
                              <input
                                type="checkbox"
                                checked={soc.enabled}
                                onChange={(e) =>
                                  handleSocialChange(soc.id, 'enabled', e.target.checked)
                                }
                                className="w-4 h-4 rounded text-blue-600 bg-slate-900 border-slate-700 focus:ring-blue-500 cursor-pointer"
                              />
                            </label>

                            <div className="flex items-center gap-2">
                              {soc.icon === 'telegram' && <Send className="w-4 h-4 text-sky-400" />}
                              {soc.icon === 'vk' && <Globe className="w-4 h-4 text-blue-400" />}
                              {soc.icon === 'youtube' && <Video className="w-4 h-4 text-red-400" />}
                              {soc.icon === 'vc' && <FileText className="w-4 h-4 text-emerald-400" />}
                              {soc.icon === 'habr' && <MessageSquare className="w-4 h-4 text-cyan-400" />}
                              {soc.icon === 'whatsapp' && <MessageSquare className="w-4 h-4 text-emerald-400" />}
                              {soc.icon === 'mail' && <Mail className="w-4 h-4 text-purple-400" />}
                              <input
                                type="text"
                                value={soc.name}
                                onChange={(e) => handleSocialChange(soc.id, 'name', e.target.value)}
                                className="bg-transparent font-bold text-white text-xs border-b border-transparent hover:border-slate-600 focus:border-blue-500 focus:outline-none px-1 py-0.5"
                              />
                            </div>
                          </div>

                          <div className="flex items-center gap-2 self-end sm:self-auto">
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                                soc.enabled
                                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                  : 'bg-slate-800 text-slate-500'
                              }`}
                            >
                              {soc.enabled ? 'Отображается' : 'Скрыто'}
                            </span>

                            {soc.url.startsWith('http') && (
                              <a
                                href={soc.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-1 rounded-lg text-slate-400 hover:text-blue-400 hover:bg-slate-800 transition-colors"
                                title="Проверить ссылку в новом окне"
                              >
                                <ExternalLink className="w-3.5 h-3.5" />
                              </a>
                            )}

                            {soc.id.startsWith('custom_') && (
                              <button
                                type="button"
                                onClick={() => handleDeleteSocialItem(soc.id)}
                                className="p-1 rounded-lg text-red-400 hover:bg-red-950/50 transition-colors"
                                title="Удалить"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
                          <div>
                            <label className="block text-[10px] font-semibold text-slate-400 mb-1">
                              URL-адрес / Ссылка:
                            </label>
                            <input
                              type="text"
                              value={soc.url}
                              onChange={(e) => handleSocialChange(soc.id, 'url', e.target.value)}
                              placeholder="https://..."
                              className="w-full px-3 py-1.5 text-xs rounded-lg bg-slate-900 border border-slate-800 text-white placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono"
                            />
                          </div>

                          <div>
                            <label className="block text-[10px] font-semibold text-slate-400 mb-1">
                              Описание / Всплывающая подсказка:
                            </label>
                            <input
                              type="text"
                              value={soc.description || ''}
                              onChange={(e) =>
                                handleSocialChange(soc.id, 'description', e.target.value)
                              }
                              placeholder="Канал с разборами..."
                              className="w-full px-3 py-1.5 text-xs rounded-lg bg-slate-900 border border-slate-800 text-slate-300 placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-blue-500"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Правая колонка: Основные контакты и Live Preview */}
              <div className="space-y-6">
                <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xs space-y-4">
                  <h4 className="text-sm font-bold text-white pb-3 border-b border-slate-800">
                    Контакты службы поддержки
                  </h4>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      Email службы поддержки
                    </label>
                    <div className="relative">
                      <input
                        type="email"
                        value={siteSettings.supportEmail}
                        onChange={(e) =>
                          setSiteSettings((p) => ({ ...p, supportEmail: e.target.value }))
                        }
                        placeholder="cransys@yandex.ru"
                        className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-slate-950 border border-slate-800 text-white font-mono focus:ring-2 focus:ring-blue-500"
                      />
                      <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                    </div>
                    <p className="text-[10px] text-slate-500 mt-1">
                      Отображается в подвале, юридических страницах и уведомлениях.
                    </p>
                  </div>
                </div>

                {/* Предпросмотр (Live Preview) в подвале */}
                <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xs space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                    <h4 className="text-sm font-bold text-white flex items-center gap-1.5">
                      <Eye className="w-4 h-4 text-emerald-400" />
                      <span>Предпросмотр в футере</span>
                    </h4>
                    <span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                      Live Preview
                    </span>
                  </div>

                  <div className="p-4 rounded-xl bg-white text-slate-800 border border-slate-200 text-xs space-y-3">
                    <div className="text-[11px] font-bold text-slate-900">
                      Мы в сообществах и медиа:
                    </div>

                    <div className="flex flex-wrap items-center gap-1.5">
                      {siteSettings.socials.filter((s) => s.enabled && s.url.trim() !== '').length === 0 ? (
                        <span className="text-slate-400 text-[11px] italic">
                          Все ссылки скрыты или выключены
                        </span>
                      ) : (
                        siteSettings.socials
                          .filter((s) => s.enabled && s.url.trim() !== '')
                          .map((soc) => (
                            <span
                              key={soc.id}
                              className="inline-flex items-center gap-1 px-2 py-1 rounded-md border border-slate-200 bg-slate-50 text-[11px] font-medium text-slate-700 shadow-2xs"
                            >
                              {soc.icon === 'telegram' && <Send className="w-3 h-3 text-sky-500" />}
                              {soc.icon === 'vk' && <Globe className="w-3 h-3 text-blue-600" />}
                              {soc.icon === 'youtube' && <Video className="w-3 h-3 text-red-500" />}
                              {soc.icon === 'vc' && <FileText className="w-3 h-3 text-emerald-600" />}
                              {soc.icon === 'habr' && <MessageSquare className="w-3 h-3 text-cyan-600" />}
                              {soc.icon === 'whatsapp' && <MessageSquare className="w-3 h-3 text-emerald-500" />}
                              {soc.icon === 'mail' && <Mail className="w-3 h-3 text-purple-600" />}
                              <span>{soc.name}</span>
                            </span>
                          ))
                      )}
                    </div>

                    <div className="pt-2 border-t border-slate-100 flex items-center gap-1 text-[11px] text-slate-500">
                      <Mail className="w-3 h-3 text-blue-600" />
                      <span className="font-mono text-slate-700 font-semibold">
                        {siteSettings.supportEmail || 'cransys@yandex.ru'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 6: SEO, Аналитика и Вебмастера */}
        {activeTab === 'seo' && (
          <div className="space-y-6 animate-fadeIn">
            {/* Панель быстрых ссылок и инструментов SEO */}
            <div className="p-4 rounded-2xl bg-gradient-to-r from-blue-950/40 via-slate-900 to-indigo-950/40 border border-blue-800/30 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-blue-500/20 text-blue-400">
                  <Globe className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <span>SEO & Webmaster Center</span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                      cransys.ru
                    </span>
                  </h3>
                  <p className="text-xs text-slate-400">
                    Управление индексацией, поисковыми сниппетами, счетчиками и верификацией
                  </p>
                </div>
              </div>

              {/* Быстрые действия */}
              <div className="flex items-center gap-2">
                <a
                  href="/robots.txt"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-colors border border-slate-700"
                >
                  <span>robots.txt</span>
                  <ExternalLink className="w-3 h-3 text-slate-400" />
                </a>
                <a
                  href="/sitemap.xml"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-colors border border-slate-700"
                >
                  <span>sitemap.xml</span>
                  <ExternalLink className="w-3 h-3 text-slate-400" />
                </a>
                <a
                  href="https://webmaster.yandex.ru/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 text-xs font-semibold flex items-center gap-1.5 transition-colors border border-amber-500/30"
                >
                  <span>Яндекс.Вебмастер</span>
                  <ExternalLink className="w-3 h-3 text-amber-400" />
                </a>
                <a
                  href="https://search.google.com/search-console"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1.5 rounded-xl bg-blue-500/10 hover:bg-blue-500/20 text-blue-300 text-xs font-semibold flex items-center gap-1.5 transition-colors border border-blue-500/30"
                >
                  <span>Search Console</span>
                  <ExternalLink className="w-3 h-3 text-blue-400" />
                </a>
              </div>
            </div>

            {/* Статус-карточки интеграций */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Яндекс.Метрика статус */}
              <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-xs">
                <div className="flex items-center justify-between text-slate-400 mb-2">
                  <span className="text-xs font-semibold uppercase tracking-wider">Яндекс.Метрика</span>
                  <div className={`p-1.5 rounded-lg ${siteSettings.analytics?.yandexMetrikaId ? 'bg-emerald-500/10 text-emerald-400' : 'bg-slate-800 text-slate-500'}`}>
                    <Activity className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-lg font-bold font-mono text-white truncate">
                  {siteSettings.analytics?.yandexMetrikaId ? siteSettings.analytics.yandexMetrikaId : 'Не подключено'}
                </div>
                <div className="mt-1 text-[11px] flex items-center gap-1">
                  {siteSettings.analytics?.yandexMetrikaId ? (
                    <span className="text-emerald-400 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" />
                      <span>Активен {siteSettings.analytics.yandexMetrikaWebvisor ? '+ Вебвизор' : ''}</span>
                    </span>
                  ) : (
                    <span className="text-slate-500">Счетчик не задан</span>
                  )}
                </div>
              </div>

              {/* Google Analytics статус */}
              <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-xs">
                <div className="flex items-center justify-between text-slate-400 mb-2">
                  <span className="text-xs font-semibold uppercase tracking-wider">Google Analytics 4</span>
                  <div className={`p-1.5 rounded-lg ${siteSettings.analytics?.googleAnalyticsId ? 'bg-blue-500/10 text-blue-400' : 'bg-slate-800 text-slate-500'}`}>
                    <BarChart3 className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-lg font-bold font-mono text-white truncate">
                  {siteSettings.analytics?.googleAnalyticsId ? siteSettings.analytics.googleAnalyticsId : 'Не подключено'}
                </div>
                <div className="mt-1 text-[11px] flex items-center gap-1">
                  {siteSettings.analytics?.googleAnalyticsId ? (
                    <span className="text-blue-400 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" />
                      <span>gtag.js активен</span>
                    </span>
                  ) : (
                    <span className="text-slate-500">Поток GA4 не задан</span>
                  )}
                </div>
              </div>

              {/* Яндекс.Вебмастер статус */}
              <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-xs">
                <div className="flex items-center justify-between text-slate-400 mb-2">
                  <span className="text-xs font-semibold uppercase tracking-wider">Яндекс.Вебмастер</span>
                  <div className={`p-1.5 rounded-lg ${siteSettings.webmasters?.yandexVerificationCode ? 'bg-amber-500/10 text-amber-400' : 'bg-slate-800 text-slate-500'}`}>
                    <Search className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-lg font-bold font-mono text-white truncate">
                  {siteSettings.webmasters?.yandexVerificationCode ? 'Верифицирован' : 'Не подтвержден'}
                </div>
                <div className="mt-1 text-[11px] flex items-center gap-1">
                  {siteSettings.webmasters?.yandexVerificationCode ? (
                    <span className="text-amber-400 font-mono text-[10px] truncate">
                      tag: {siteSettings.webmasters.yandexVerificationCode.substring(0, 12)}...
                    </span>
                  ) : (
                    <span className="text-slate-500">Ожидает код подтверждения</span>
                  )}
                </div>
              </div>

              {/* Google Search Console статус */}
              <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-xs">
                <div className="flex items-center justify-between text-slate-400 mb-2">
                  <span className="text-xs font-semibold uppercase tracking-wider">Search Console</span>
                  <div className={`p-1.5 rounded-lg ${siteSettings.webmasters?.googleVerificationCode ? 'bg-emerald-500/10 text-emerald-400' : 'bg-slate-800 text-slate-500'}`}>
                    <Globe className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-lg font-bold font-mono text-white truncate">
                  {siteSettings.webmasters?.googleVerificationCode ? 'Верифицирован' : 'Не подтвержден'}
                </div>
                <div className="mt-1 text-[11px] flex items-center gap-1">
                  {siteSettings.webmasters?.googleVerificationCode ? (
                    <span className="text-emerald-400 font-mono text-[10px] truncate">
                      code: {siteSettings.webmasters.googleVerificationCode.substring(0, 12)}...
                    </span>
                  ) : (
                    <span className="text-slate-500">Ожидает код Google</span>
                  )}
                </div>
              </div>
            </div>

            {/* Основные блоки настроек */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* БЛОК 1: Системы веб-аналитики */}
              <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xs space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                  <div className="flex items-center gap-2">
                    <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400">
                      <BarChart3 className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-white">Системы аналитики</h4>
                      <p className="text-[11px] text-slate-400">Яндекс.Метрика и Google Analytics 4</p>
                    </div>
                  </div>
                </div>

                {/* Яндекс Метрика */}
                <div className="space-y-2">
                  <label className="block text-xs font-semibold text-slate-300">
                    Номер счетчика Яндекс.Метрики
                  </label>
                  <input
                    type="text"
                    value={siteSettings.analytics?.yandexMetrikaId || ''}
                    onChange={(e) =>
                      setSiteSettings((prev) => ({
                        ...prev,
                        analytics: {
                          ...prev.analytics,
                          yandexMetrikaId: e.target.value.trim(),
                        },
                      }))
                    }
                    placeholder="Например: 98765432"
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-950 border border-slate-800 text-white font-mono focus:ring-2 focus:ring-blue-500"
                  />
                  <p className="text-[10px] text-slate-500">
                    Автоматически подключает официальный скрипт Метрики на всех страницах сервиса.
                  </p>
                </div>

                {/* Вебвизор чекбокс */}
                <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 flex items-center justify-between">
                  <div>
                    <div className="text-xs font-semibold text-slate-200">
                      Вебвизор, карта кликов и точный показатель отказов
                    </div>
                    <div className="text-[10px] text-slate-500">
                      Запись действий пользователей для анализа конверсий
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={siteSettings.analytics?.yandexMetrikaWebvisor ?? true}
                    onChange={(e) =>
                      setSiteSettings((prev) => ({
                        ...prev,
                        analytics: {
                          ...prev.analytics,
                          yandexMetrikaWebvisor: e.target.checked,
                        },
                      }))
                    }
                    className="w-4 h-4 rounded text-blue-600 bg-slate-900 border-slate-700 focus:ring-blue-500 cursor-pointer"
                  />
                </div>

                {/* Google Analytics 4 */}
                <div className="space-y-2 pt-2 border-t border-slate-800">
                  <label className="block text-xs font-semibold text-slate-300">
                    Идентификатор потока Google Analytics 4 (Measurement ID)
                  </label>
                  <input
                    type="text"
                    value={siteSettings.analytics?.googleAnalyticsId || ''}
                    onChange={(e) =>
                      setSiteSettings((prev) => ({
                        ...prev,
                        analytics: {
                          ...prev.analytics,
                          googleAnalyticsId: e.target.value.trim(),
                        },
                      }))
                    }
                    placeholder="G-XXXXXXXXXX"
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-950 border border-slate-800 text-white font-mono focus:ring-2 focus:ring-blue-500"
                  />
                  <p className="text-[10px] text-slate-500">
                    Идентификатор потока данных из панели Google Analytics 4.
                  </p>
                </div>
              </div>

              {/* БЛОК 2: Панели вебмастеров */}
              <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xs space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                  <div className="flex items-center gap-2">
                    <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400">
                      <Search className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-white">Панели вебмастеров</h4>
                      <p className="text-[11px] text-slate-400">Подтверждение прав в поисковиках</p>
                    </div>
                  </div>
                </div>

                {/* Яндекс.Вебмастер */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-semibold text-slate-300">
                      Код верификации Яндекс.Вебмастер
                    </label>
                    <a
                      href="https://webmaster.yandex.ru/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[10px] text-blue-400 hover:underline flex items-center gap-1"
                    >
                      <span>Открыть Вебмастер</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                  <input
                    type="text"
                    value={siteSettings.webmasters?.yandexVerificationCode || ''}
                    onChange={(e) =>
                      setSiteSettings((prev) => ({
                        ...prev,
                        webmasters: {
                          ...prev.webmasters,
                          yandexVerificationCode: e.target.value.trim(),
                        },
                      }))
                    }
                    placeholder="Например: a1b2c3d4e5f6g7h8"
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-950 border border-slate-800 text-white font-mono focus:ring-2 focus:ring-blue-500"
                  />
                  <p className="text-[10px] text-slate-500">
                    Укажите значение атрибута content из метатега <code>&lt;meta name=&quot;yandex-verification&quot; content=&quot;...&quot; /&gt;</code>
                  </p>
                </div>

                {/* Google Search Console */}
                <div className="space-y-2 pt-2 border-t border-slate-800">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-semibold text-slate-300">
                      Код верификации Google Search Console
                    </label>
                    <a
                      href="https://search.google.com/search-console"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[10px] text-blue-400 hover:underline flex items-center gap-1"
                    >
                      <span>Search Console</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                  <input
                    type="text"
                    value={siteSettings.webmasters?.googleVerificationCode || ''}
                    onChange={(e) =>
                      setSiteSettings((prev) => ({
                        ...prev,
                        webmasters: {
                          ...prev.webmasters,
                          googleVerificationCode: e.target.value.trim(),
                        },
                      }))
                    }
                    placeholder="Например: dX5v4B9x1Z8qL..."
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-950 border border-slate-800 text-white font-mono focus:ring-2 focus:ring-blue-500"
                  />
                  <p className="text-[10px] text-slate-500">
                    Укажите значение content из метатега <code>&lt;meta name=&quot;google-site-verification&quot; content=&quot;...&quot; /&gt;</code>
                  </p>
                </div>
              </div>
            </div>

            {/* БЛОК 3: Внутренняя оптимизация On-Page SEO и Метатеги */}
            <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
                    <Globe className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white">Внутренняя оптимизация (On-Page SEO и метатеги)</h4>
                    <p className="text-[11px] text-slate-400">Настройка заголовков, описания для сниппетов в Яндексе и Google</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Meta Title */}
                <div className="space-y-1.5 md:col-span-2">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-semibold text-slate-300">
                      Главный заголовок сайта (Meta Title)
                    </label>
                    <span className="text-[10px] text-slate-500">
                      Символов: {(siteSettings.seo?.mainTitle || '').length} / реком. 50–65
                    </span>
                  </div>
                  <input
                    type="text"
                    value={siteSettings.seo?.mainTitle || ''}
                    onChange={(e) =>
                      setSiteSettings((prev) => ({
                        ...prev,
                        seo: {
                          ...prev.seo,
                          mainTitle: e.target.value,
                        },
                      }))
                    }
                    placeholder="Cransys — Автоматизированный аудит Яндекс.Директ"
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-950 border border-slate-800 text-white focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* Meta Description */}
                <div className="space-y-1.5 md:col-span-2">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-semibold text-slate-300">
                      Мета-описание для поисковых сниппетов (Meta Description)
                    </label>
                    <span className="text-[10px] text-slate-500">
                      Символов: {(siteSettings.seo?.mainDescription || '').length} / реком. 120–160
                    </span>
                  </div>
                  <textarea
                    rows={2}
                    value={siteSettings.seo?.mainDescription || ''}
                    onChange={(e) =>
                      setSiteSettings((prev) => ({
                        ...prev,
                        seo: {
                          ...prev.seo,
                          mainDescription: e.target.value,
                        },
                      }))
                    }
                    placeholder="Независимый автоматизированный аудит рекламных кампаний Яндекс.Директ..."
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-950 border border-slate-800 text-white focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* Keywords */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-slate-300">
                    Ключевые слова (Keywords, через запятую)
                  </label>
                  <input
                    type="text"
                    value={siteSettings.seo?.keywords || ''}
                    onChange={(e) =>
                      setSiteSettings((prev) => ({
                        ...prev,
                        seo: {
                          ...prev.seo,
                          keywords: e.target.value,
                        },
                      }))
                    }
                    placeholder="аудит яндекс директ, слив бюджета рся, минус слова..."
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-950 border border-slate-800 text-white focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* Robots indexing */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-slate-300">
                    Индексация роботами (Robots Meta Tag)
                  </label>
                  <select
                    value={siteSettings.seo?.robotsIndexing || 'all'}
                    onChange={(e) =>
                      setSiteSettings((prev) => ({
                        ...prev,
                        seo: {
                          ...prev.seo,
                          robotsIndexing: e.target.value as 'all' | 'noindex, nofollow',
                        },
                      }))
                    }
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-950 border border-slate-800 text-white focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="all">Разрешить индексацию (index, follow) — для продакшена</option>
                    <option value="noindex, nofollow">Запретить индексацию (noindex, nofollow) — техработы</option>
                  </select>
                </div>
              </div>

              {/* Живой предпросмотр сниппета в поиске Яндекса */}
              <div className="pt-3 border-t border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                    <Eye className="w-3.5 h-3.5 text-blue-400" />
                    <span>Живой предпросмотр сниппета в поиске (Яндекс / Google)</span>
                  </span>
                  <span className="text-[10px] text-emerald-400 font-semibold">
                    Live Preview (cransys.ru)
                  </span>
                </div>

                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 font-sans space-y-1.5 shadow-inner">
                  {/* URL и Фавикон */}
                  <div className="flex items-center gap-2 text-xs text-slate-400">
                    <div className="w-4 h-4 rounded bg-blue-600 flex items-center justify-center text-[10px] font-black text-white">
                      C
                    </div>
                    <span className="text-emerald-400 font-medium">https://cransys.ru</span>
                    <span className="text-slate-600">›</span>
                    <span className="text-slate-400">аудит</span>
                  </div>

                  {/* Заголовок сниппета */}
                  <div className="text-base font-medium text-blue-400 hover:underline cursor-pointer leading-snug">
                    {siteSettings.seo?.mainTitle || 'Cransys Analytics — Аудит Яндекс Директ, реклама сайта и раскрутка'}
                  </div>

                  {/* Описание сниппета */}
                  <p className="text-xs text-slate-300 leading-relaxed line-clamp-2">
                    {siteSettings.seo?.mainDescription || 'Независимый аудит рекламы Яндекс Директ и сайтов за 2 минуты. Поиск скрытых сливов бюджета в РСЯ, нецелевых поисковых запросов и мобильных аномалий.'}
                  </p>

                  {/* Быстрые ссылки сниппета (SiteLinks) */}
                  <div className="pt-2 flex flex-wrap items-center gap-3 text-[11px] text-blue-400">
                    <span className="hover:underline cursor-pointer">Аудит кампаний</span>
                    <span className="text-slate-700">•</span>
                    <span className="hover:underline cursor-pointer">Тарифы и цены</span>
                    <span className="text-slate-700">•</span>
                    <span className="hover:underline cursor-pointer">База РСЯ</span>
                    <span className="text-slate-700">•</span>
                    <span className="hover:underline cursor-pointer">152-ФЗ РФ</span>
                  </div>
                </div>
              </div>
            </div>

            {/* БЛОК 4: Пользовательские скрипты и пиксели */}
            <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400">
                    <FileText className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white">Пользовательские скрипты, пиксели и виджеты</h4>
                    <p className="text-[11px] text-slate-400">Вставка дополнительных тегов (VK Реклама, чаты, трекеры)</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Head Script */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-slate-300">
                    Дополнительный скрипт в <code>&lt;head&gt;</code> (например, Пиксель ВК / Top.Mail)
                  </label>
                  <textarea
                    rows={4}
                    value={siteSettings.customScripts?.headScript || ''}
                    onChange={(e) =>
                      setSiteSettings((prev) => ({
                        ...prev,
                        customScripts: {
                          ...prev.customScripts,
                          headScript: e.target.value,
                        },
                      }))
                    }
                    placeholder="<!-- Вставьте JS или HTML код тега -->"
                    className="w-full p-3 text-xs rounded-xl bg-slate-950 border border-slate-800 text-emerald-400 font-mono focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* Body Script */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-slate-300">
                    Дополнительный скрипт перед закрывающим <code>&lt;/body&gt;</code> (виджеты чатов)
                  </label>
                  <textarea
                    rows={4}
                    value={siteSettings.customScripts?.bodyScript || ''}
                    onChange={(e) =>
                      setSiteSettings((prev) => ({
                        ...prev,
                        customScripts: {
                          ...prev.customScripts,
                          bodyScript: e.target.value,
                        },
                      }))
                    }
                    placeholder="<!-- Вставьте код онлайн-виджета -->"
                    className="w-full p-3 text-xs rounded-xl bg-slate-950 border border-slate-800 text-emerald-400 font-mono focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* Фиксированная кнопка сохранения */}
            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Все изменения применяются мгновенно ко всем пользователям платформы</span>
              </div>

              <button
                type="button"
                onClick={handleSaveSettings}
                disabled={isSavingSettings}
                className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:bg-blue-800 text-white text-xs font-bold shadow-lg shadow-blue-600/30 flex items-center gap-2 cursor-pointer transition-all"
              >
                {isSavingSettings ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Сохранение параметров...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>Сохранить настройки SEO и Аналитики</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* TAB 7: 152-ФЗ и Управление Cookie */}
        {activeTab === 'privacy' && (
          <div className="space-y-6">
            {/* Карточки аналитики согласий */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xs">
                <div className="flex items-center justify-between text-slate-400 mb-2">
                  <span className="text-xs font-semibold uppercase tracking-wider">Всего запросов</span>
                  <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400">
                    <Cookie className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-2xl font-black text-white font-mono">{cookieStats.totalPrompts}</div>
                <div className="mt-1 text-[11px] text-slate-400">
                  Фиксаций согласия в соответствии с 152-ФЗ
                </div>
              </div>

              <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xs">
                <div className="flex items-center justify-between text-slate-400 mb-2">
                  <span className="text-xs font-semibold uppercase tracking-wider">Принято полностью</span>
                  <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-2xl font-black text-emerald-400 font-mono">
                  {cookieStats.acceptedAll}{' '}
                  <span className="text-sm font-normal text-slate-400">
                    ({cookieStats.totalPrompts > 0 ? Math.round((cookieStats.acceptedAll / cookieStats.totalPrompts) * 100) : 0}%)
                  </span>
                </div>
                <div className="mt-1 text-[11px] text-emerald-400">
                  Разрешена полная аналитика и метрики
                </div>
              </div>

              <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xs">
                <div className="flex items-center justify-between text-slate-400 mb-2">
                  <span className="text-xs font-semibold uppercase tracking-wider">Только технические</span>
                  <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400">
                    <Shield className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-2xl font-black text-amber-400 font-mono">
                  {cookieStats.acceptedNecessary}{' '}
                  <span className="text-sm font-normal text-slate-400">
                    ({cookieStats.totalPrompts > 0 ? Math.round((cookieStats.acceptedNecessary / cookieStats.totalPrompts) * 100) : 0}%)
                  </span>
                </div>
                <div className="mt-1 text-[11px] text-slate-400">
                  Отказ от трекеров и маркетинга
                </div>
              </div>

              <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xs">
                <div className="flex items-center justify-between text-slate-400 mb-2">
                  <span className="text-xs font-semibold uppercase tracking-wider">Выборочно</span>
                  <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400">
                    <Sliders className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-2xl font-black text-purple-400 font-mono">
                  {cookieStats.acceptedCustom}{' '}
                  <span className="text-sm font-normal text-slate-400">
                    ({cookieStats.totalPrompts > 0 ? Math.round((cookieStats.acceptedCustom / cookieStats.totalPrompts) * 100) : 0}%)
                  </span>
                </div>
                <div className="mt-1 text-[11px] text-slate-400">
                  Настроено индивидуально
                </div>
              </div>
            </div>

            {/* БЛОК НАСТРОЕК БАННЕРА И ПРАВОВЫХ НОРМ 152-ФЗ */}
            <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xs space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-400">
                    <Shield className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white">Параметры Cookie-баннера и политики конфиденциальности</h3>
                    <p className="text-xs text-slate-400">
                      Соответствие Федеральному закону РФ № 152-ФЗ «О персональных данных» и требованиям Роскомнадзора
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      if (typeof window !== 'undefined') {
                        localStorage.removeItem('cransys_cookie_consent_v1');
                        showNotification('Локальное согласие сброшено! Перезагрузите страницу для теста баннера.');
                      }
                    }}
                    className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold border border-slate-700 transition-colors flex items-center gap-1.5"
                  >
                    <RefreshCw className="w-3.5 h-3.5 text-blue-400" />
                    <span>Сбросить тест баннера</span>
                  </button>

                  <a
                    href="/legal/cookies"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold border border-slate-700 transition-colors flex items-center gap-1.5"
                  >
                    <ExternalLink className="w-3.5 h-3.5 text-blue-400" />
                    <span>Страница политики</span>
                  </a>
                </div>
              </div>

              {/* Тумблеры управления */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                  <div className="space-y-0.5 pr-2">
                    <span className="text-xs font-bold text-white block">Отображать Cookie-баннер</span>
                    <span className="text-[11px] text-slate-400 block">Показ плашки при первом посещении</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={siteSettings.cookieBanner?.enabled ?? true}
                    onChange={(e) =>
                      setSiteSettings((prev) => ({
                        ...prev,
                        cookieBanner: {
                          ...(prev.cookieBanner || DEFAULT_SITE_SETTINGS.cookieBanner),
                          enabled: e.target.checked,
                        },
                      }))
                    }
                    className="w-5 h-5 rounded text-blue-600 bg-slate-900 border-slate-700 focus:ring-blue-500 cursor-pointer"
                  />
                </div>

                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                  <div className="space-y-0.5 pr-2">
                    <span className="text-xs font-bold text-white block">Блокировать скрипты до согласия</span>
                    <span className="text-[11px] text-slate-400 block">Строгий режим 152-ФЗ (Prior Consent)</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={siteSettings.cookieBanner?.autoBlockScripts ?? true}
                    onChange={(e) =>
                      setSiteSettings((prev) => ({
                        ...prev,
                        cookieBanner: {
                          ...(prev.cookieBanner || DEFAULT_SITE_SETTINGS.cookieBanner),
                          autoBlockScripts: e.target.checked,
                        },
                      }))
                    }
                    className="w-5 h-5 rounded text-blue-600 bg-slate-900 border-slate-700 focus:ring-blue-500 cursor-pointer"
                  />
                </div>

                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                  <div className="space-y-0.5 pr-2">
                    <span className="text-xs font-bold text-white block">Кнопка «Только необходимые»</span>
                    <span className="text-[11px] text-slate-400 block">Быстрый отказ от аналитики в баннере</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={siteSettings.cookieBanner?.showRejectAll ?? siteSettings.cookieBanner?.showDeclineButton ?? true}
                    onChange={(e) =>
                      setSiteSettings((prev) => ({
                        ...prev,
                        cookieBanner: {
                          ...(prev.cookieBanner || DEFAULT_SITE_SETTINGS.cookieBanner),
                          showRejectAll: e.target.checked,
                          showDeclineButton: e.target.checked,
                        },
                      }))
                    }
                    className="w-5 h-5 rounded text-blue-600 bg-slate-900 border-slate-700 focus:ring-blue-500 cursor-pointer"
                  />
                </div>
              </div>

              {/* Тексты баннера */}
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Заголовок баннера
                    </label>
                    <input
                      type="text"
                      value={siteSettings.cookieBanner?.title || ''}
                      onChange={(e) =>
                        setSiteSettings((prev) => ({
                          ...prev,
                          cookieBanner: {
                            ...(prev.cookieBanner || DEFAULT_SITE_SETTINGS.cookieBanner),
                            title: e.target.value,
                          },
                        }))
                      }
                      placeholder="Файлы cookie и конфиденциальность"
                      className="w-full px-3 py-2 text-xs rounded-xl bg-slate-950 border border-slate-800 text-white focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Срок действия согласия (дней)
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={730}
                      value={siteSettings.cookieBanner?.consentExpiryDays ?? siteSettings.cookieBanner?.cookieExpirationDays ?? 365}
                      onChange={(e) =>
                        setSiteSettings((prev) => ({
                          ...prev,
                          cookieBanner: {
                            ...(prev.cookieBanner || DEFAULT_SITE_SETTINGS.cookieBanner),
                            consentExpiryDays: Number(e.target.value) || 365,
                            cookieExpirationDays: Number(e.target.value) || 365,
                          },
                        }))
                      }
                      className="w-full px-3 py-2 text-xs rounded-xl bg-slate-950 border border-slate-800 text-white focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Основной текст уведомления
                  </label>
                  <textarea
                    rows={3}
                    value={siteSettings.cookieBanner?.description || ''}
                    onChange={(e) =>
                      setSiteSettings((prev) => ({
                        ...prev,
                        cookieBanner: {
                          ...(prev.cookieBanner || DEFAULT_SITE_SETTINGS.cookieBanner),
                          description: e.target.value,
                        },
                      }))
                    }
                    placeholder="Мы используем файлы cookie и схожие технологии..."
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-950 border border-slate-800 text-white focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Текст ссылки на Политику файлов cookie
                    </label>
                    <input
                      type="text"
                      value={siteSettings.cookieBanner?.policyLinkText || ''}
                      onChange={(e) =>
                        setSiteSettings((prev) => ({
                          ...prev,
                          cookieBanner: {
                            ...(prev.cookieBanner || DEFAULT_SITE_SETTINGS.cookieBanner),
                            policyLinkText: e.target.value,
                          },
                        }))
                      }
                      placeholder="Политикой использования файлов cookie"
                      className="w-full px-3 py-2 text-xs rounded-xl bg-slate-950 border border-slate-800 text-white focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      URL страницы политики
                    </label>
                    <input
                      type="text"
                      value={siteSettings.cookieBanner?.policyUrl || ''}
                      onChange={(e) =>
                        setSiteSettings((prev) => ({
                          ...prev,
                          cookieBanner: {
                            ...(prev.cookieBanner || DEFAULT_SITE_SETTINGS.cookieBanner),
                            policyUrl: e.target.value,
                          },
                        }))
                      }
                      placeholder="/legal/cookies"
                      className="w-full px-3 py-2 text-xs rounded-xl bg-slate-950 border border-slate-800 text-white font-mono focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* ЖУРНАЛ АУДИТА СОГЛАСИЙ (152-ФЗ) */}
            <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
                    <FileText className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white">Журнал фиксации согласий (Audit Trail 152-ФЗ)</h4>
                    <p className="text-[11px] text-slate-400">
                      Анонимизированная фиксация волеизъявления пользователей для проверок регулятора
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={fetchCookieConsents}
                  disabled={isLoadingCookieData}
                  className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold border border-slate-700 transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isLoadingCookieData ? 'animate-spin text-blue-400' : ''}`} />
                  <span>Обновить журнал</span>
                </button>
              </div>

              {cookieLogs.length === 0 ? (
                <div className="p-8 rounded-xl bg-slate-950/60 border border-slate-800/80 text-center text-slate-400 text-xs">
                  Журнал согласий пока пуст. При первом посещении сайта посетители получат баннер, и их решения появятся здесь.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-800 text-slate-400 text-[11px] uppercase tracking-wider">
                        <th className="pb-2.5 font-semibold">Дата и время</th>
                        <th className="pb-2.5 font-semibold">Решение</th>
                        <th className="pb-2.5 font-semibold">Категории</th>
                        <th className="pb-2.5 font-semibold">Анонимный IP</th>
                        <th className="pb-2.5 font-semibold">Браузер / Устройство</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                      {cookieLogs.map((log) => (
                        <tr key={log.id} className="hover:bg-slate-800/30 transition-colors">
                          <td className="py-2.5 font-mono text-slate-300 text-[11px]">
                            {log.timestamp ? new Date(log.timestamp).toLocaleString('ru-RU') : '—'}
                          </td>
                          <td className="py-2.5">
                            {(log.choice === 'all' || log.action === 'accept_all') && (
                              <span className="px-2 py-0.5 rounded-md bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-bold">
                                Все файлы
                              </span>
                            )}
                            {(log.choice === 'necessary' || log.action === 'reject_all') && (
                              <span className="px-2 py-0.5 rounded-md bg-amber-500/10 border border-amber-500/20 text-amber-400 text-[10px] font-bold">
                                Только технические
                              </span>
                            )}
                            {(log.choice === 'custom' || log.action === 'custom') && (
                              <span className="px-2 py-0.5 rounded-md bg-purple-500/10 border border-purple-500/20 text-purple-400 text-[10px] font-bold">
                                Выборочно
                              </span>
                            )}
                          </td>
                          <td className="py-2.5">
                            <div className="flex items-center gap-1">
                              <span className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 text-[10px]">
                                Необх. ✓
                              </span>
                              {log.preferences.analytics ? (
                                <span className="px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-300 text-[10px]">
                                  Аналитика ✓
                                </span>
                              ) : (
                                <span className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-500 text-[10px]">
                                  Аналитика ✕
                                </span>
                              )}
                              {log.preferences.marketing ? (
                                <span className="px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-300 text-[10px]">
                                  Маркетинг ✓
                                </span>
                              ) : (
                                <span className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-500 text-[10px]">
                                  Маркетинг ✕
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="py-2.5 font-mono text-slate-400 text-[11px]">
                            {log.ipMasked || '127.0.0.xxx'}
                          </td>
                          <td className="py-2.5 text-slate-400 text-[11px] max-w-xs truncate" title={log.userAgent}>
                            {log.userAgent || 'Web Browser'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Фиксированная кнопка сохранения */}
            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Настройки 152-ФЗ вступают в силу немедленно на всем сайте</span>
              </div>

              <button
                type="button"
                onClick={handleSaveSettings}
                disabled={isSavingSettings}
                className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:bg-blue-800 text-white text-xs font-bold shadow-lg shadow-blue-600/30 flex items-center gap-2 cursor-pointer transition-all"
              >
                {isSavingSettings ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Сохранение настроек...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>Сохранить параметры 152-ФЗ и Cookie</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* TAB 8: Секреты, Окружение и API Сервисы */}
        {activeTab === 'system' && (
          <div className="space-y-6">
            <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <Server className="w-5 h-5 text-blue-400" />
                    <span>Статус секретов окружения и подключенных сервисов</span>
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">
                    Динамический мониторинг наличия ключей API и подключения к Neon Serverless PostgreSQL
                  </p>
                </div>
                <button
                  type="button"
                  onClick={fetchSystemStatus}
                  disabled={isLoadingSystemStatus}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-2 border border-slate-700 transition-colors"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isLoadingSystemStatus ? 'animate-spin text-blue-400' : ''}`} />
                  <span>Проверить сейчас</span>
                </button>
              </div>

              {/* База данных статус */}
              <div className="p-5 rounded-xl bg-slate-950/80 border border-slate-800">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2.5">
                    <Database className="w-5 h-5 text-emerald-400" />
                    <span className="text-sm font-bold text-white">База Данных: Neon Serverless PostgreSQL</span>
                  </div>
                  {systemStatus?.database?.connected ? (
                    <span className="px-2.5 py-1 rounded-full bg-emerald-950/80 border border-emerald-500/30 text-emerald-300 text-xs font-semibold flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      Подключена ({systemStatus.database.latencyMs} мс)
                    </span>
                  ) : (
                    <span className="px-2.5 py-1 rounded-full bg-amber-950/80 border border-amber-500/30 text-amber-300 text-xs font-semibold flex items-center gap-1.5">
                      <AlertCircle className="w-3.5 h-3.5 text-amber-400" />
                      Локальный режим (резервный кэш)
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Все пользователи, тарифы, контакты и отчеты синхронизируются с облачной базой данных. В случае отсутствия переменной <code className="text-blue-300 bg-slate-900 px-1.5 py-0.5 rounded font-mono">DATABASE_URL</code> система прозрачно использует локальное хранилище без сбоев.
                </p>
              </div>

              {/* Таблица секретов окружения */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                  Конфигурация переменных окружения (Secrets)
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {[
                    { key: 'ADMIN_EMAIL', label: 'Email Главного Администратора', group: 'Администрирование' },
                    { key: 'ADMIN_PASSWORD', label: 'Мастер-пароль Администратора', group: 'Администрирование' },
                    { key: 'TEST_USER_EMAIL', label: 'Email Тестового аккаунта', group: 'Тестирование' },
                    { key: 'TEST_USER_PASSWORD', label: 'Пароль Тестового аккаунта', group: 'Тестирование' },
                    { key: 'YANDEX_CLIENT_ID', label: 'Yandex OAuth Client ID', group: 'Яндекс.Директ API' },
                    { key: 'YANDEX_CLIENT_SECRET', label: 'Yandex OAuth Client Secret', group: 'Яндекс.Директ API' },
                    { key: 'YANDEX_REDIRECT_URI', label: 'Yandex OAuth Redirect URI', group: 'Яндекс.Директ API' },
                    { key: 'DATABASE_URL', label: 'Строка подключения PostgreSQL', group: 'База Данных' },
                    { key: 'SMTP_HOST', label: 'SMTP Сервер (Хост)', group: 'Почтовый шлюз' },
                    { key: 'SMTP_USER', label: 'SMTP Логин / Email', group: 'Почтовый шлюз' },
                    { key: 'SMTP_PASS', label: 'SMTP Пароль приложения', group: 'Почтовый шлюз' },
                    { key: 'YOOKASSA_SHOP_ID', label: 'ЮKassa Shop ID', group: 'Платежный шлюз' },
                    { key: 'YOOKASSA_SECRET_KEY', label: 'ЮKassa Secret Key', group: 'Платежный шлюз' },
                  ].map((item) => {
                    const isConfigured = Boolean(systemStatus?.secrets?.[item.key]);
                    return (
                      <div
                        key={item.key}
                        className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/80 flex items-center justify-between"
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs font-bold text-slate-200">{item.key}</span>
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400">
                              {item.group}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-400 mt-0.5">{item.label}</p>
                        </div>
                        <div>
                          {isConfigured ? (
                            <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 text-[11px] font-semibold flex items-center gap-1">
                              <Check className="w-3 h-3 text-emerald-400" />
                              Задан
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-400 text-[11px] font-semibold flex items-center gap-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-slate-500" />
                              По умолчанию
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Подсказка по безопасности */}
              <div className="p-4 rounded-xl bg-blue-950/30 border border-blue-800/40 text-xs text-blue-200/90 leading-relaxed flex items-start gap-3">
                <Shield className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-white block mb-0.5">Безопасность учетных данных:</strong>
                  Пароли и ключи доступа никогда не сохраняются в открытом виде в JSON-файлах репозитория. Все секреты считываются исключительно из переменных окружения (Secrets) и защищены от утечек при экспорте кода.
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
              <div className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800 text-[11px] grid grid-cols-2 gap-2 text-slate-400">
                <div>
                  <span className="text-slate-500 block text-[10px]">Регистрация:</span>
                  <span className="font-mono text-slate-200 font-semibold">{formatDateTime(editingUser.createdAt)}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px]">Последний вход:</span>
                  <span className="font-mono text-slate-200 font-semibold">{editingUser.lastActive ? formatDateTime(editingUser.lastActive) : 'Еще не входил'}</span>
                </div>
              </div>

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

      {/* МОДАЛКА РЕДАКТИРОВАНИЯ ТАРИФА (ПОЛНОЕ УПРАВЛЕНИЕ ВОЗМОЖНОСТЯМИ И ЦЕНАМИ) */}
      {editingTierId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 text-white shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Sliders className="w-5 h-5 text-blue-400" />
                  <span>Редактирование тарифа: {editTierForm.name}</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Все изменения тарифа (цена, бейдж, возможности и лимиты) сразу же отобразятся на лендинге сайта и при оформлении оплаты через ЮKassa.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setEditingTierId(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveTier} className="space-y-4">
              {/* Секция 1: Основные параметры тарифа */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
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

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Бейдж на карточке (например: «Хит продаж» или «Выбор агентств»)
                  </label>
                  <input
                    type="text"
                    value={editTierForm.badge || ''}
                    onChange={(e) => setEditTierForm((p) => ({ ...p, badge: e.target.value }))}
                    placeholder="Хит продаж / Выбор агентств / Корпоративный"
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-950 border border-slate-800 text-white focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Стоимость тарифа (₽)
                  </label>
                  <input
                    type="number"
                    required
                    min={0}
                    value={editTierForm.price ?? 0}
                    onChange={(e) => setEditTierForm((p) => ({ ...p, price: Number(e.target.value) }))}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-950 border border-slate-800 text-white font-mono focus:ring-2 focus:ring-blue-500"
                  />
                  <span className="text-[11px] text-slate-400 mt-1 block">
                    По этой цене будет создаваться платеж в ЮKassa: {Number(editTierForm.price || 0).toLocaleString('ru-RU')} ₽
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Описание периода (под ценой)
                  </label>
                  <input
                    type="text"
                    value={editTierForm.period || ''}
                    onChange={(e) => setEditTierForm((p) => ({ ...p, period: e.target.value }))}
                    placeholder="разовый аудит / пакет из 3 аудитов / в месяц"
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-950 border border-slate-800 text-white focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Лимит отчетов (шт)
                  </label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={editTierForm.reportsLimit ?? 1}
                    onChange={(e) => setEditTierForm((p) => ({ ...p, reportsLimit: Number(e.target.value) }))}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-950 border border-slate-800 text-white font-mono focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Текст на кнопке действия (CTA)
                  </label>
                  <input
                    type="text"
                    value={editTierForm.cta || ''}
                    onChange={(e) => setEditTierForm((p) => ({ ...p, cta: e.target.value }))}
                    placeholder="Выбрать Экспресс / Подключить PRO"
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-950 border border-slate-800 text-white focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Краткое описание тарифа
                </label>
                <textarea
                  rows={2}
                  value={editTierForm.description || ''}
                  onChange={(e) => setEditTierForm((p) => ({ ...p, description: e.target.value }))}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-slate-950 border border-slate-800 text-white focus:ring-2 focus:ring-blue-500 resize-none"
                />
              </div>

              {/* Маркетинговые флаги */}
              <div className="flex flex-wrap gap-4 p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editTierForm.popular || false}
                    onChange={(e) => setEditTierForm((p) => ({ ...p, popular: e.target.checked }))}
                    className="w-4 h-4 rounded text-blue-600 bg-slate-900 border-slate-700"
                  />
                  <span className="font-semibold text-amber-400">★ Выделять как популярный (Popular / Хит)</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editTierForm.isEnterprise || false}
                    onChange={(e) => setEditTierForm((p) => ({ ...p, isEnterprise: e.target.checked }))}
                    className="w-4 h-4 rounded text-blue-600 bg-slate-900 border-slate-700"
                  />
                  <span className="font-semibold text-indigo-400">🏢 Корпоративный тариф (Enterprise)</span>
                </label>
              </div>

              {/* Секция 2: Редактор пунктов возможностей на сайте (Features List) */}
              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2.5">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-xs font-bold text-white flex items-center gap-1.5">
                      <CheckSquare className="w-4 h-4 text-emerald-400" />
                      <span>Пункты возможностей на карточке тарифа ({editTierForm.features?.length || 0})</span>
                    </label>
                    <p className="text-[11px] text-slate-400">
                      Именно эти пункты выводятся маркерами «✓» в блоке тарифов на главной странице и в модалке оплаты.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setEditTierForm((p) => ({
                        ...p,
                        features: [...(p.features || []), ''],
                      }));
                    }}
                    className="px-2.5 py-1 rounded-lg bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 border border-blue-500/30 text-xs font-semibold flex items-center gap-1 transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Добавить пункт</span>
                  </button>
                </div>

                <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
                  {(editTierForm.features || []).map((feature, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <span className="text-xs text-slate-500 font-mono w-5 shrink-0 text-right">{idx + 1}.</span>
                      <input
                        type="text"
                        value={feature}
                        onChange={(e) => {
                          const next = [...(editTierForm.features || [])];
                          next[idx] = e.target.value;
                          setEditTierForm((p) => ({ ...p, features: next }));
                        }}
                        placeholder="Например: Аудит по файлу (.xlsx / .csv)"
                        className="flex-1 px-3 py-1.5 text-xs rounded-lg bg-slate-900 border border-slate-800 text-white focus:ring-2 focus:ring-blue-500"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const next = [...(editTierForm.features || [])];
                          next.splice(idx, 1);
                          setEditTierForm((p) => ({ ...p, features: next }));
                        }}
                        className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-slate-800 rounded-lg transition-colors"
                        title="Удалить этот пункт"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                  {(!editTierForm.features || editTierForm.features.length === 0) && (
                    <div className="text-xs text-slate-500 italic py-2 text-center">
                      Список возможностей пуст. Нажмите «Добавить пункт», чтобы указать преимущества тарифа.
                    </div>
                  )}
                </div>
              </div>

              {/* Секция 3: Технические модули платформы */}
              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                <div className="text-xs font-bold text-white mb-1.5">
                  Технические модули и системные доступы:
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  <label className="flex items-center gap-2 cursor-pointer p-2 rounded-lg bg-slate-900/60 border border-slate-800/80">
                    <input
                      type="checkbox"
                      checked={editTierForm.hasDirectApi || false}
                      onChange={(e) => setEditTierForm((p) => ({ ...p, hasDirectApi: e.target.checked }))}
                      className="w-4 h-4 rounded text-blue-600 bg-slate-950 border-slate-700"
                    />
                    <span>Прямое API Яндекс.Директ</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer p-2 rounded-lg bg-slate-900/60 border border-slate-800/80">
                    <input
                      type="checkbox"
                      checked={editTierForm.hasAiInsights || false}
                      onChange={(e) => setEditTierForm((p) => ({ ...p, hasAiInsights: e.target.checked }))}
                      className="w-4 h-4 rounded text-blue-600 bg-slate-950 border-slate-700"
                    />
                    <span>AI Gemini аналитика сливов</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer p-2 rounded-lg bg-slate-900/60 border border-slate-800/80">
                    <input
                      type="checkbox"
                      checked={editTierForm.hasSearchQueryClustering || false}
                      onChange={(e) => setEditTierForm((p) => ({ ...p, hasSearchQueryClustering: e.target.checked }))}
                      className="w-4 h-4 rounded text-blue-600 bg-slate-950 border-slate-700"
                    />
                    <span>Кластеризация поисковых запросов</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer p-2 rounded-lg bg-slate-900/60 border border-slate-800/80">
                    <input
                      type="checkbox"
                      checked={editTierForm.hasRsyaBlacklist || false}
                      onChange={(e) => setEditTierForm((p) => ({ ...p, hasRsyaBlacklist: e.target.checked }))}
                      className="w-4 h-4 rounded text-blue-600 bg-slate-950 border-slate-700"
                    />
                    <span>База 10 000+ мусорных РСЯ</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer p-2 rounded-lg bg-slate-900/60 border border-slate-800/80">
                    <input
                      type="checkbox"
                      checked={editTierForm.hasWhiteLabel || false}
                      onChange={(e) => setEditTierForm((p) => ({ ...p, hasWhiteLabel: e.target.checked }))}
                      className="w-4 h-4 rounded text-blue-600 bg-slate-950 border-slate-700"
                    />
                    <span>White-label брендирование PDF</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer p-2 rounded-lg bg-slate-900/60 border border-slate-800/80">
                    <input
                      type="checkbox"
                      checked={editTierForm.hasCorpAutomation || false}
                      onChange={(e) => setEditTierForm((p) => ({ ...p, hasCorpAutomation: e.target.checked }))}
                      className="w-4 h-4 rounded text-blue-600 bg-slate-950 border-slate-700"
                    />
                    <span>Корпоративные правила и автоматизация</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer p-2 rounded-lg bg-slate-900/60 border border-slate-800/80">
                    <input
                      type="checkbox"
                      checked={editTierForm.hasMultiAccounts || false}
                      onChange={(e) => setEditTierForm((p) => ({ ...p, hasMultiAccounts: e.target.checked }))}
                      className="w-4 h-4 rounded text-blue-600 bg-slate-950 border-slate-700"
                    />
                    <span>Мульти-аккаунты и несколько клиентов</span>
                  </label>

                  <div className="p-2 rounded-lg bg-slate-900/60 border border-slate-800/80 flex items-center justify-between">
                    <span>Подключаемых аккаунтов:</span>
                    <input
                      type="number"
                      min={1}
                      value={editTierForm.maxConnectedAccounts ?? 1}
                      onChange={(e) => setEditTierForm((p) => ({ ...p, maxConnectedAccounts: Number(e.target.value) }))}
                      className="w-16 px-2 py-1 text-xs rounded bg-slate-950 border border-slate-800 text-white font-mono text-center"
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditingTierId(null)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors"
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-md shadow-blue-600/30 transition-all flex items-center gap-1.5"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Сохранить тариф</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
