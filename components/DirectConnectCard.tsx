'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  KeyRound,
  CheckCircle2,
  Lock,
  ExternalLink,
  RefreshCw,
  AlertCircle,
  Trash2,
  Layers,
  ChevronDown,
  Building2,
  CheckSquare,
  Square,
  Play,
  Sparkles,
  Info,
  SlidersHorizontal,
  PlusCircle,
  Calendar,
  Clock,
  Filter,
  Users,
  HelpCircle,
} from 'lucide-react';
import { useUser } from '@/lib/auth/user-context';
import { getTierConfig } from '@/lib/billing/tiers';
import { AuditReportData } from '@/lib/audit/types';
import { DirectClientAccount } from '@/app/api/direct/accounts/route';
import { DirectCampaignItem } from '@/app/api/direct/campaigns/route';

interface DirectConnectCardProps {
  onAuditStarted?: () => void;
  onAuditComplete?: (report: AuditReportData, fileName: string) => void;
  onOpenPricing?: () => void;
}

interface DirectConnectionItem {
  id: string;
  login: string;
  connectedAt: string;
  lastSyncAt?: string;
  status: string;
}

type CampaignFilterType = 'ALL' | 'ACTIVE' | 'STOPPED' | 'ARCHIVED';

export function DirectConnectCard({
  onAuditStarted,
  onAuditComplete,
  onOpenPricing,
}: DirectConnectCardProps) {
  const { user } = useUser();
  const [isConnected, setIsConnected] = useState(false);
  const [login, setLogin] = useState<string>('');
  const [connections, setConnections] = useState<DirectConnectionItem[]>([]);
  const [activeConnectionId, setActiveConnectionId] = useState<string>('');

  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isRunningAudit, setIsRunningAudit] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [isTokenExpired, setIsTokenExpired] = useState(false);

  // Кабинеты субклиентов агентства
  const [accounts, setAccounts] = useState<DirectClientAccount[]>([]);
  const [selectedAccount, setSelectedAccount] = useState<string>('');
  const [isAgency, setIsAgency] = useState(false);

  // Кампании
  const [campaigns, setCampaigns] = useState<DirectCampaignItem[]>([]);
  const [isLoadingCampaigns, setIsLoadingCampaigns] = useState(false);
  const [selectedCampaignIds, setSelectedCampaignIds] = useState<string[]>([]);
  const [notice, setNotice] = useState<string | null>(null);
  const [campaignFilter, setCampaignFilter] = useState<CampaignFilterType>('ALL');

  // Период анализа
  const [periodDays, setPeriodDays] = useState<number>(90);
  const [isCustomPeriod, setIsCustomPeriod] = useState(false);
  const [customDateFrom, setCustomDateFrom] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() - 90);
    return d.toISOString().split('T')[0];
  });
  const [customDateTo, setCustomDateTo] = useState<string>(() => {
    return new Date().toISOString().split('T')[0];
  });
  const [showPeriodInfo, setShowPeriodInfo] = useState(false);

  const tierConfig = getTierConfig(user?.tier);
  const hasAccess = tierConfig.hasDirectApi;
  const maxAccounts = tierConfig.maxConnectedAccounts || (hasAccess ? 1 : 0);
  const isCorpOrMax = tierConfig.hasMultiAccounts || user?.tier === 'CORP' || user?.tier === 'MAX';

  // 1. Проверка статуса подключения и загрузка списка подключенных аккаунтов
  const fetchStatus = useCallback(
    async (showRefreshIndicator = false, targetConnId?: string) => {
      if (showRefreshIndicator) setIsRefreshing(true);
      setErrorMsg('');
      try {
        const headers: Record<string, string> = {};
        if (user) {
          headers['x-user-id'] = user.id;
          headers['x-user-email'] = user.email;
        }

        const url = targetConnId
          ? `/api/direct/status?connectionId=${encodeURIComponent(targetConnId)}`
          : '/api/direct/status';

        const res = await fetch(url, { headers });
        if (res.ok) {
          const data = await res.json();
          const connected = Boolean(data.connected);
          setIsConnected(connected);

          if (Array.isArray(data.connections)) {
            setConnections(data.connections);
          }

          if (data.connectionId) {
            setActiveConnectionId(data.connectionId);
          } else if (data.connections?.length > 0) {
            setActiveConnectionId(data.connections[0].id);
          }

          if (data.login) {
            setLogin(data.login);
            setSelectedAccount(data.login);
          }
          return { connected, login: data.login, connectionId: data.connectionId };
        }
        return { connected: false };
      } catch (e) {
        console.warn('Error fetching Direct status:', e);
        return { connected: false };
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [user]
  );

  // 2. Загрузка субклиентов агентства
  const fetchAccounts = useCallback(async () => {
    try {
      const headers: Record<string, string> = {};
      if (user) headers['x-user-id'] = user.id;

      const res = await fetch('/api/direct/accounts', { headers });
      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.accounts)) {
          setAccounts(data.accounts);
          setIsAgency(Boolean(data.isAgency));
          if (!selectedAccount && data.accounts.length > 0) {
            setSelectedAccount(data.accounts[0].login);
          }
        }
      }
    } catch (e) {
      console.warn('Error loading Direct accounts:', e);
    }
  }, [user, selectedAccount]);

  // 3. Загрузка кампаний для выбранного кабинета и периода
  const fetchCampaigns = useCallback(
    async (accountLogin?: string, connId?: string) => {
      const targetLogin = accountLogin || selectedAccount || login;
      const targetConnId = connId || activeConnectionId;
      if (!targetLogin && !targetConnId) return;

      setIsLoadingCampaigns(true);
      setNotice(null);
      setIsTokenExpired(false);
      try {
        const headers: Record<string, string> = {};
        if (user) headers['x-user-id'] = user.id;

        const params = new URLSearchParams();
        if (targetLogin) params.set('clientLogin', targetLogin);
        if (targetConnId) params.set('connectionId', targetConnId);
        params.set('periodDays', String(periodDays));

        const res = await fetch(`/api/direct/campaigns?${params.toString()}`, { headers });
        if (res.ok) {
          const data = await res.json();
          if (data.isTokenExpired) {
            setIsTokenExpired(true);
          }
          if (data.success && Array.isArray(data.campaigns)) {
            setCampaigns(data.campaigns);
            // По умолчанию выбираем все кампании
            setSelectedCampaignIds(data.campaigns.map((c: DirectCampaignItem) => c.id));
            if (data.notice) {
              setNotice(data.notice);
            }
          }
        }
      } catch (e) {
        console.warn('Error loading campaigns:', e);
      } finally {
        setIsLoadingCampaigns(false);
      }
    },
    [user, selectedAccount, login, activeConnectionId, periodDays]
  );

  // Первичная загрузка
  useEffect(() => {
    let isMounted = true;

    const loadInitialData = async () => {
      try {
        const statusRes = await fetchStatus();
        if (!isMounted) return;

        if (statusRes.connected) {
          fetchAccounts();
          fetchCampaigns(statusRes.login, statusRes.connectionId);
        }
      } catch (e) {
        console.warn('Error loading initial Direct status:', e);
      }
    };

    loadInitialData();

    return () => {
      isMounted = false;
    };
  }, [fetchStatus, fetchAccounts, fetchCampaigns]);

  // Слушатель postMessage от всплывающего окна авторизации Яндекс OAuth
  useEffect(() => {
    const handleAuthMessage = (event: MessageEvent) => {
      if (event.data?.type === 'YANDEX_DIRECT_CONNECTED') {
        if (event.data.success) {
          setIsConnected(true);
          setIsTokenExpired(false);
          const newLogin = event.data.login;
          if (newLogin) {
            setLogin(newLogin);
            setSelectedAccount(newLogin);
          }
          setSuccessMsg(`Аккаунт ${newLogin || ''} успешно подключен к Cransys!`);
          setTimeout(() => setSuccessMsg(''), 5000);

          fetchStatus(true).then((status) => {
            fetchAccounts();
            fetchCampaigns(newLogin, status.connectionId);
          });
        } else if (event.data.error) {
          setErrorMsg(`Ошибка авторизации: ${event.data.error}`);
        }
      }
    };

    window.addEventListener('message', handleAuthMessage);
    return () => {
      window.removeEventListener('message', handleAuthMessage);
    };
  }, [fetchStatus, fetchAccounts, fetchCampaigns]);

  // Запуск окна авторизации Яндекса
  const handleOpenOAuth = () => {
    setErrorMsg('');
    const targetUserId = user?.id || 'current_user';
    const authUrl = `/api/direct/auth?popup=1&userId=${encodeURIComponent(targetUserId)}`;

    const width = 640;
    const height = 750;
    const left = window.screenX + (window.outerWidth - width) / 2;
    const top = window.screenY + (window.outerHeight - height) / 2;

    const popup = window.open(
      authUrl,
      'yandex_direct_oauth',
      `width=${width},height=${height},left=${left},top=${top},status=no,resizable=yes`
    );

    if (popup) {
      const timer = setInterval(() => {
        if (popup.closed) {
          clearInterval(timer);
          fetchStatus().then((status) => {
            if (status.connected) {
              fetchAccounts();
              fetchCampaigns(status.login, status.connectionId);
            }
          });
        }
      }, 1500);
    } else {
      window.location.href = `/api/direct/auth?userId=${encodeURIComponent(targetUserId)}`;
    }
  };

  // Переключение активного подключенного аккаунта
  const handleSelectConnection = (conn: DirectConnectionItem) => {
    setActiveConnectionId(conn.id);
    setLogin(conn.login);
    setSelectedAccount(conn.login);
    fetchCampaigns(conn.login, conn.id);
  };

  // Отключение конкретного кабинета (для тарифа CORP и всех остальных)
  const handleDisconnectAccount = async (targetConnId: string, targetLogin: string) => {
    if (!confirm(`Отключить кабинет «${targetLogin}» от Cransys?`)) return;

    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (user) headers['x-user-id'] = user.id;

      const res = await fetch(
        `/api/direct/status?connectionId=${encodeURIComponent(targetConnId)}`,
        {
          method: 'DELETE',
          headers,
          body: JSON.stringify({ connectionId: targetConnId, login: targetLogin }),
        }
      );

      if (res.ok) {
        const data = await res.json();
        const updatedConnections = connections.filter((c) => c.id !== targetConnId);
        setConnections(updatedConnections);

        if (updatedConnections.length > 0) {
          // Переключаемся на следующий активный кабинет
          const next = updatedConnections[0];
          setActiveConnectionId(next.id);
          setLogin(next.login);
          setSelectedAccount(next.login);
          fetchCampaigns(next.login, next.id);
          setSuccessMsg(`Кабинет ${targetLogin} отключен. Активен: ${next.login}`);
        } else {
          // Все аккаунты отключены
          setIsConnected(false);
          setLogin('');
          setActiveConnectionId('');
          setCampaigns([]);
          setAccounts([]);
          setSelectedCampaignIds([]);
          setSuccessMsg('Интеграция с Яндекс.Директ успешно отключена.');
        }
        setTimeout(() => setSuccessMsg(''), 4000);
      }
    } catch (e) {
      console.warn('Error disconnecting Direct account:', e);
      setErrorMsg('Не удалось отключить кабинет. Попробуйте снова.');
    }
  };

  // Отключение всех кабинетов сразу
  const handleDisconnectAll = async () => {
    if (!confirm('Отключить все подключенные кабинеты Яндекс.Директ от Cransys?')) return;
    try {
      const headers: Record<string, string> = {};
      if (user) headers['x-user-id'] = user.id;

      await fetch('/api/direct/status', { method: 'DELETE', headers });
      setIsConnected(false);
      setLogin('');
      setActiveConnectionId('');
      setConnections([]);
      setCampaigns([]);
      setAccounts([]);
      setSelectedCampaignIds([]);
      setSuccessMsg('Все кабинеты Яндекс.Директ отключены.');
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (e) {
      console.warn('Error disconnecting all:', e);
    }
  };

  // Фильтрация кампаний по статусу (Все, Активные, Остановленные, Архив)
  const filteredCampaigns = useMemo(() => {
    switch (campaignFilter) {
      case 'ACTIVE':
        return campaigns.filter((c) => !c.isStopped);
      case 'STOPPED':
        return campaigns.filter((c) => c.isStopped && c.state !== 'ARCHIVED');
      case 'ARCHIVED':
        return campaigns.filter((c) => c.state === 'ARCHIVED');
      case 'ALL':
      default:
        return campaigns;
    }
  }, [campaigns, campaignFilter]);

  const activeCount = useMemo(() => campaigns.filter((c) => !c.isStopped).length, [campaigns]);
  const stoppedCount = useMemo(
    () => campaigns.filter((c) => c.isStopped && c.state !== 'ARCHIVED').length,
    [campaigns]
  );
  const archivedCount = useMemo(() => campaigns.filter((c) => c.state === 'ARCHIVED').length, [campaigns]);

  // Переключение выбора кампании
  const toggleCampaign = (id: string) => {
    setSelectedCampaignIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const selectAllCampaigns = () => {
    setSelectedCampaignIds(campaigns.map((c) => c.id));
  };

  const selectActiveCampaigns = () => {
    setSelectedCampaignIds(campaigns.filter((c) => !c.isStopped).map((c) => c.id));
  };

  const selectStoppedCampaigns = () => {
    setSelectedCampaignIds(campaigns.filter((c) => c.isStopped).map((c) => c.id));
  };

  const deselectAllCampaigns = () => {
    setSelectedCampaignIds([]);
  };

  // Переключение периода анализа
  const handleSelectPeriodPreset = (days: number) => {
    setPeriodDays(days);
    setIsCustomPeriod(false);
    const d = new Date();
    d.setDate(d.getDate() - days);
    setCustomDateFrom(d.toISOString().split('T')[0]);
    setCustomDateTo(new Date().toISOString().split('T')[0]);
  };

  // Запуск аудита по выбранным кампаниям и выбранному периоду
  const handleRunAudit = async () => {
    if (isRunningAudit) return;
    if (selectedCampaignIds.length === 0) {
      setErrorMsg('Пожалуйста, выберите хотя бы одну кампанию для аудита');
      return;
    }

    setIsRunningAudit(true);
    setErrorMsg('');
    if (onAuditStarted) onAuditStarted();

    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (user) {
        headers['x-user-id'] = user.id;
        headers['x-user-email'] = user.email;
      }

      const payload = {
        campaignIds: selectedCampaignIds,
        accountLogin: selectedAccount || login,
        connectionId: activeConnectionId || undefined,
        periodDays,
        dateFrom: isCustomPeriod ? customDateFrom : undefined,
        dateTo: isCustomPeriod ? customDateTo : undefined,
      };

      const res = await fetch('/api/direct/run-audit', {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setErrorMsg(data.error || 'Ошибка при проведении аудита кампаний');
        return;
      }

      if (data.report && onAuditComplete) {
        const periodStr = isCustomPeriod
          ? `${customDateFrom} — ${customDateTo}`
          : `${periodDays} дн.`;
        const fileName = `Яндекс.Директ (${selectedAccount || login}) • ${data.campaignsAnalyzed || selectedCampaignIds.length} камп. [${periodStr}]`;
        onAuditComplete(data.report, fileName);
      }
    } catch (e) {
      setErrorMsg('Сетевая ошибка при запуске сканирования API');
    } finally {
      setIsRunningAudit(false);
    }
  };

  return (
    <div
      id="direct_connect_container"
      className={`rounded-2xl border transition-all ${
        hasAccess
          ? 'bg-gradient-to-br from-white via-slate-50/50 to-blue-50/30 border-blue-200/80 shadow-xs'
          : 'bg-white border-slate-200'
      }`}
    >
      {/* Шапка карточки */}
      <div className="p-5 sm:p-6 border-b border-slate-100 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <div
            className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${
              hasAccess
                ? isConnected
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-blue-600 text-white shadow-xs'
                : 'bg-slate-200 text-slate-500'
            }`}
          >
            <KeyRound className="w-5 h-5" />
          </div>

          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-sm sm:text-base font-bold text-slate-900">
                Прямое подключение к Яндекс.Директ (OAuth API v5)
              </h3>

              {hasAccess ? (
                isConnected ? (
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    Подключено {connections.length > 1 ? `(${connections.length} каб.)` : login}
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                    Готово к подключению
                  </span>
                )
              ) : (
                <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                  <Lock className="w-3 h-3 text-slate-500" />
                  Доступно от тарифа PRO
                </span>
              )}

              {isCorpOrMax && (
                <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                  <Users className="w-3 h-3 text-indigo-600" />
                  Мульти-кабинеты: до {maxAccounts}
                </span>
              )}
            </div>

            <p className="text-xs text-slate-600 mt-1 max-w-2xl leading-relaxed">
              {hasAccess
                ? isConnected
                  ? `Авторизовано через Яндекс ID. Доступно сканирование активных и остановленных кампаний, аудит настроек, минус-фраз и выбор произвольного периода анализа.`
                  : 'Подключите ваш аккаунт Яндекс.Директ через безопасный протокол Яндекс ID. Мы запрашиваем только права на чтение структуры кампаний и статистики.'
                : 'Прямое подключение к API Яндекс.Директ доступно на тарифах PRO, MAX и Corporate. Позволяет аудировать любые кампании в один клик без ручного скачивания файлов.'}
            </p>

            {successMsg && (
              <div className="mt-2 text-xs text-emerald-700 font-semibold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>{successMsg}</span>
              </div>
            )}

            {errorMsg && (
              <div className="mt-2 text-xs text-red-600 flex items-center gap-1 font-semibold">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {isTokenExpired && (
              <div className="mt-2 p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>Срок авторизации Яндекс ID истек или токен был отозван. Требуется обновить подключение.</span>
                </div>
                <button
                  type="button"
                  onClick={handleOpenOAuth}
                  className="px-3 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-bold text-xs shrink-0 cursor-pointer"
                >
                  Обновить токен
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Главная кнопка подключения / действий */}
        <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
          {hasAccess ? (
            isConnected ? (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  id="direct_refresh_btn"
                  onClick={() => {
                    fetchStatus(true);
                    fetchCampaigns();
                  }}
                  disabled={isRefreshing}
                  title="Обновить список кампаний"
                  className="p-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 text-xs font-semibold transition-colors flex items-center gap-1 cursor-pointer disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
                  <span className="hidden sm:inline">Обновить</span>
                </button>

                {/* Добавить еще кабинет (для CORP и MAX) */}
                {isCorpOrMax && connections.length < maxAccounts && (
                  <button
                    type="button"
                    id="direct_add_account_btn"
                    onClick={handleOpenOAuth}
                    title="Подключить еще один аккаунт Яндекс"
                    className="px-3 py-2 rounded-xl bg-blue-50 border border-blue-200 hover:bg-blue-100 text-blue-700 text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer"
                  >
                    <PlusCircle className="w-3.5 h-3.5 text-blue-600" />
                    <span>+ Кабинет</span>
                  </button>
                )}

                {/* Если 1 кабинет или пользователь хочет отключить */}
                {connections.length <= 1 ? (
                  <button
                    type="button"
                    id="direct_disconnect_single_btn"
                    onClick={() => handleDisconnectAccount(activeConnectionId, login)}
                    title="Отключить аккаунт"
                    className="p-2 rounded-xl bg-white border border-slate-200 hover:bg-red-50 hover:border-red-200 hover:text-red-600 text-slate-400 transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                ) : (
                  <button
                    type="button"
                    id="direct_disconnect_all_btn"
                    onClick={handleDisconnectAll}
                    title="Отключить все кабинеты"
                    className="px-2.5 py-2 rounded-xl bg-white border border-slate-200 hover:bg-red-50 hover:border-red-200 hover:text-red-600 text-slate-500 text-xs font-semibold transition-colors cursor-pointer"
                  >
                    Отключить все
                  </button>
                )}
              </div>
            ) : (
              <button
                type="button"
                id="direct_connect_main_btn"
                onClick={handleOpenOAuth}
                className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all flex items-center gap-1.5 shadow-xs cursor-pointer"
              >
                <span>Подключить Яндекс.Директ</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </button>
            )
          ) : (
            <button
              type="button"
              id="direct_pricing_btn"
              onClick={onOpenPricing}
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold transition-all shadow-xs cursor-pointer"
            >
              Подключить Direct API в PRO
            </button>
          )}
        </div>
      </div>

      {/* ДЕТАЛИЗАЦИЯ КАБИНЕТОВ, ПЕРИОДА И КАМПАНИЙ (КОГДА ПОДКЛЮЧЕНО) */}
      {hasAccess && isConnected && (
        <div className="p-5 sm:p-6 space-y-4">
          {/* 1. ПАНЕЛЬ МУЛЬТИ-АККАУНТОВ (ДЛЯ ТАРИФОВ CORP / MAX ИЛИ ПРИ НЕСКОЛЬКИХ КАБИНЕТАХ) */}
          <div className="bg-white p-3.5 rounded-xl border border-slate-200 space-y-2.5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Building2 className="w-4 h-4 text-blue-600 shrink-0" />
                <span className="text-xs font-bold text-slate-800">
                  Подключенные аккаунты Яндекс.Директ
                </span>
                <span className="text-[11px] text-slate-500">
                  ({connections.length} {connections.length === 1 ? 'кабинет' : 'кабинета'} из {maxAccounts})
                </span>
              </div>

              {isCorpOrMax && (
                <button
                  type="button"
                  id="direct_add_more_account_btn"
                  onClick={handleOpenOAuth}
                  className="text-xs text-blue-600 hover:text-blue-700 font-semibold flex items-center gap-1 cursor-pointer self-start sm:self-auto"
                >
                  <PlusCircle className="w-3.5 h-3.5" />
                  <span>Подключить еще один логин</span>
                </button>
              )}
            </div>

            {/* Карточки/чипсы подключенных аккаунтов */}
            <div className="flex flex-wrap items-center gap-2">
              {connections.map((conn) => {
                const isActive = conn.id === activeConnectionId || conn.login === selectedAccount;
                return (
                  <div
                    key={conn.id}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs transition-all ${
                      isActive
                        ? 'bg-blue-50 border-blue-300 text-blue-900 font-bold shadow-2xs'
                        : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100 cursor-pointer font-medium'
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => handleSelectConnection(conn)}
                      className="cursor-pointer flex items-center gap-1.5 text-left"
                    >
                      <span className={`w-2 h-2 rounded-full ${isActive ? 'bg-blue-600' : 'bg-slate-400'}`} />
                      <span>{conn.login}</span>
                      {isActive && <span className="text-[10px] text-blue-600 font-normal">(выбран)</span>}
                    </button>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDisconnectAccount(conn.id, conn.login);
                      }}
                      title={`Отключить кабинет ${conn.login}`}
                      className="text-slate-400 hover:text-red-600 p-0.5 rounded-sm transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                );
              })}

              {!isCorpOrMax && connections.length === 1 && (
                <span className="text-[11px] text-slate-400 italic">
                  Тариф PRO включает 1 активный кабинет. В тарифе CORP доступно до 50 кабинетов.
                </span>
              )}
            </div>

            {/* Субклиенты агентства (если текущий логин — агентский) */}
            {isAgency && accounts.length > 1 && (
              <div className="pt-2 border-t border-slate-100 flex items-center gap-2">
                <span className="text-xs text-slate-600 font-medium">Субклиент агентства:</span>
                <select
                  id="direct_subclient_select"
                  value={selectedAccount}
                  onChange={(e) => {
                    setSelectedAccount(e.target.value);
                    fetchCampaigns(e.target.value, activeConnectionId);
                  }}
                  className="px-2.5 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 cursor-pointer"
                >
                  {accounts.map((acc) => (
                    <option key={acc.login} value={acc.login}>
                      {acc.name || acc.login} ({acc.login})
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* 2. БЛОК ВЫБОРА ПЕРИОДА АНАЛИЗА (ОТВЕТ НА ВОПРОС ПОЛЬЗОВАТЕЛЯ) */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-emerald-600 shrink-0" />
                <span className="text-xs font-bold text-slate-900">
                  Период сбора данных для аудита:
                </span>
                <span className="text-xs font-mono font-bold text-emerald-700 px-2 py-0.5 bg-emerald-50 rounded-md border border-emerald-200">
                  {isCustomPeriod ? `${customDateFrom} — ${customDateTo}` : `${periodDays} дней`}
                </span>
              </div>

              <button
                type="button"
                id="direct_period_help_btn"
                onClick={() => setShowPeriodInfo((prev) => !prev)}
                className="text-[11px] text-slate-500 hover:text-slate-800 flex items-center gap-1 cursor-pointer"
              >
                <HelpCircle className="w-3.5 h-3.5 text-slate-400" />
                <span>Как работает период?</span>
              </button>
            </div>

            {/* Быстрые кнопки выбора периодов */}
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                id="direct_period_30_btn"
                onClick={() => handleSelectPeriodPreset(30)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  !isCustomPeriod && periodDays === 30
                    ? 'bg-emerald-600 text-white shadow-2xs'
                    : 'bg-slate-50 text-slate-700 border border-slate-200 hover:bg-slate-100'
                }`}
              >
                30 дней (Текущий месяц)
              </button>

              <button
                type="button"
                id="direct_period_90_btn"
                onClick={() => handleSelectPeriodPreset(90)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  !isCustomPeriod && periodDays === 90
                    ? 'bg-emerald-600 text-white shadow-2xs'
                    : 'bg-slate-50 text-slate-700 border border-slate-200 hover:bg-slate-100'
                }`}
              >
                90 дней (Квартал • Рекомендуется)
              </button>

              <button
                type="button"
                id="direct_period_180_btn"
                onClick={() => handleSelectPeriodPreset(180)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  !isCustomPeriod && periodDays === 180
                    ? 'bg-emerald-600 text-white shadow-2xs'
                    : 'bg-slate-50 text-slate-700 border border-slate-200 hover:bg-slate-100'
                }`}
              >
                180 дней (Полгода • Для остановленных)
              </button>

              <button
                type="button"
                id="direct_period_365_btn"
                onClick={() => handleSelectPeriodPreset(365)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  !isCustomPeriod && periodDays === 365
                    ? 'bg-emerald-600 text-white shadow-2xs'
                    : 'bg-slate-50 text-slate-700 border border-slate-200 hover:bg-slate-100'
                }`}
              >
                365 дней (1 год)
              </button>

              <button
                type="button"
                id="direct_period_custom_btn"
                onClick={() => setIsCustomPeriod(true)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  isCustomPeriod
                    ? 'bg-emerald-600 text-white shadow-2xs'
                    : 'bg-slate-50 text-slate-700 border border-slate-200 hover:bg-slate-100'
                }`}
              >
                Свой интервал дат
              </button>
            </div>

            {/* Выбор произвольного диапазона дат */}
            {isCustomPeriod && (
              <div className="flex flex-wrap items-center gap-3 pt-2">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs text-slate-500">С даты:</span>
                  <input
                    type="date"
                    id="direct_date_from_input"
                    value={customDateFrom}
                    onChange={(e) => setCustomDateFrom(e.target.value)}
                    className="px-2.5 py-1 text-xs border border-slate-200 rounded-lg bg-slate-50 font-mono"
                  />
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs text-slate-500">По дату:</span>
                  <input
                    type="date"
                    id="direct_date_to_input"
                    value={customDateTo}
                    onChange={(e) => setCustomDateTo(e.target.value)}
                    className="px-2.5 py-1 text-xs border border-slate-200 rounded-lg bg-slate-50 font-mono"
                  />
                </div>
              </div>
            )}

            {/* Информационная подсказка о периоде */}
            {showPeriodInfo && (
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 space-y-1.5 leading-relaxed">
                <div className="font-bold text-slate-800 flex items-center gap-1.5">
                  <Info className="w-3.5 h-3.5 text-blue-600" />
                  <span>Зачем нужен период анализа?</span>
                </div>
                <p>
                  Период определяет глубину выборки статистики (клики, показы, конверсии, отказы и расходы) из API Яндекс.Директ.
                </p>
                <p>
                  • <strong>Для активных кампаний:</strong> обычно достаточно 30–90 дней для выявления свежих перерасходов и мусорных площадок.
                </p>
                <p>
                  • <strong>Для остановленных или сезонных кампаний:</strong> рекомендуется выбирать 90 или 180 дней, чтобы захватить исторический отрезок, когда кампания активно приводила трафик, и оценить настройки перед новым запуском.
                </p>
              </div>
            )}
          </div>

          {/* Уведомление от API (если есть) */}
          {notice && (
            <div className="p-3 rounded-xl bg-blue-50/80 border border-blue-200/80 flex items-start gap-2.5 text-xs text-blue-900">
              <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
              <div className="leading-relaxed">{notice}</div>
            </div>
          )}

          {/* 3. СПИСОК ВСЕХ КАМПАНИЙ (АКТИВНЫЕ И ОСТАНОВЛЕННЫЕ) */}
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            {/* Верхняя планка с фильтрами и кнопками выбора */}
            <div className="p-3.5 bg-slate-50/70 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
              {/* Вкладки фильтров статусов */}
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  id="direct_filter_all_btn"
                  onClick={() => setCampaignFilter('ALL')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                    campaignFilter === 'ALL'
                      ? 'bg-blue-600 text-white'
                      : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  Все ({campaigns.length})
                </button>

                <button
                  type="button"
                  id="direct_filter_active_btn"
                  onClick={() => setCampaignFilter('ACTIVE')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1 ${
                    campaignFilter === 'ACTIVE'
                      ? 'bg-emerald-600 text-white'
                      : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  <span>Идут показы ({activeCount})</span>
                </button>

                <button
                  type="button"
                  id="direct_filter_stopped_btn"
                  onClick={() => setCampaignFilter('STOPPED')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1 ${
                    campaignFilter === 'STOPPED'
                      ? 'bg-amber-600 text-white'
                      : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                  <span>Остановлены ({stoppedCount})</span>
                </button>

                {archivedCount > 0 && (
                  <button
                    type="button"
                    id="direct_filter_archived_btn"
                    onClick={() => setCampaignFilter('ARCHIVED')}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                      campaignFilter === 'ARCHIVED'
                        ? 'bg-slate-700 text-white'
                        : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    Архив ({archivedCount})
                  </button>
                )}
              </div>

              {/* Действия быстрого выбора */}
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <button
                  type="button"
                  id="direct_select_all_btn"
                  onClick={selectAllCampaigns}
                  className="text-blue-600 hover:text-blue-700 font-semibold cursor-pointer"
                >
                  Все
                </button>
                <span className="text-slate-300">•</span>
                <button
                  type="button"
                  id="direct_select_active_btn"
                  onClick={selectActiveCampaigns}
                  className="text-emerald-700 hover:text-emerald-800 font-semibold cursor-pointer"
                >
                  Только активные
                </button>
                <span className="text-slate-300">•</span>
                <button
                  type="button"
                  id="direct_select_stopped_btn"
                  onClick={selectStoppedCampaigns}
                  className="text-amber-700 hover:text-amber-800 font-semibold cursor-pointer"
                >
                  Только остановленные
                </button>
                <span className="text-slate-300">•</span>
                <button
                  type="button"
                  id="direct_deselect_all_btn"
                  onClick={deselectAllCampaigns}
                  className="text-slate-500 hover:text-slate-700 font-semibold cursor-pointer"
                >
                  Снять выбор
                </button>
              </div>
            </div>

            {isLoadingCampaigns ? (
              <div className="py-10 text-center text-xs text-slate-400 flex flex-col items-center justify-center gap-2">
                <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                <span>Синхронизация кампаний с Яндекс.Директ API...</span>
              </div>
            ) : filteredCampaigns.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400">
                Кампании в данной категории не найдены.
              </div>
            ) : (
              <div className="divide-y divide-slate-100 max-h-72 overflow-y-auto">
                {filteredCampaigns.map((camp) => {
                  const isChecked = selectedCampaignIds.includes(camp.id);
                  const isRunning = camp.state === 'ON';

                  return (
                    <div
                      key={camp.id}
                      onClick={() => toggleCampaign(camp.id)}
                      className={`p-3 sm:px-4 flex items-center justify-between gap-3 hover:bg-slate-50/80 cursor-pointer transition-colors ${
                        isChecked ? 'bg-blue-50/30' : ''
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <button
                          type="button"
                          className="shrink-0 text-slate-400 hover:text-blue-600 transition-colors"
                        >
                          {isChecked ? (
                            <CheckSquare className="w-4 h-4 text-blue-600" />
                          ) : (
                            <Square className="w-4 h-4 text-slate-300" />
                          )}
                        </button>

                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-xs font-semibold text-slate-900 truncate">
                              {camp.name}
                            </span>
                            {camp.isDemo && (
                              <span className="text-[10px] px-1.5 py-0.2 rounded-md bg-slate-100 text-slate-600 border border-slate-200 shrink-0 font-medium">
                                Демо-снимок
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-0.5 flex-wrap">
                            <span className="font-mono text-[10px] text-slate-400">ID: {camp.id}</span>
                            <span>•</span>
                            <span>{camp.typeLabel}</span>
                            {camp.isStopped && (
                              <>
                                <span>•</span>
                                <span className="text-amber-700 font-medium">
                                  Готова к аудиту настроек и минус-фраз
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 shrink-0">
                        {camp.clicks !== undefined && (
                          <div className="text-right hidden sm:block">
                            <span className="text-[11px] font-mono font-bold text-slate-700 block">
                              {camp.clicks.toLocaleString('ru-RU')} кл.
                            </span>
                            <span className="text-[10px] text-slate-400">
                              {camp.impressions?.toLocaleString('ru-RU')} пок.
                            </span>
                          </div>
                        )}

                        <span
                          className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${
                            isRunning
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : camp.state === 'SUSPENDED'
                              ? 'bg-amber-50 text-amber-700 border-amber-200'
                              : 'bg-slate-100 text-slate-600 border-slate-200'
                          }`}
                        >
                          {camp.stateLabel || (isRunning ? 'Идут показы' : 'Остановлена')}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* 4. ПАНЕЛЬ ЗАПУСКА АНАЛИЗА */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
            <div className="text-xs text-slate-600">
              Выбрано для аудита:{' '}
              <span className="font-bold text-slate-900">{selectedCampaignIds.length}</span> из{' '}
              {campaigns.length} камп. • Период:{' '}
              <span className="font-bold text-emerald-700">
                {isCustomPeriod ? `${customDateFrom} — ${customDateTo}` : `${periodDays} дн.`}
              </span>
            </div>

            <button
              type="button"
              id="direct_run_audit_btn"
              onClick={handleRunAudit}
              disabled={isRunningAudit || selectedCampaignIds.length === 0}
              className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-sm shadow-emerald-600/20 disabled:opacity-50 cursor-pointer"
            >
              <Play className={`w-3.5 h-3.5 fill-current ${isRunningAudit ? 'animate-spin' : ''}`} />
              <span>
                {isRunningAudit
                  ? 'Выполняется аудит через API...'
                  : `Запустить аудит (${selectedCampaignIds.length} ${
                      selectedCampaignIds.length === 1 ? 'кампания' : 'кампаний'
                    })`}
              </span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
