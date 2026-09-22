'use client';

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
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
  const [slotsInfo, setSlotsInfo] = useState<{
    maxSlots: number;
    usedSlots: number;
    usedLogins: string[];
    availableSlots: number;
  } | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isRunningAudit, setIsRunningAudit] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [isTokenExpired, setIsTokenExpired] = useState(false);
  const [isAppPendingApproval, setIsAppPendingApproval] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  // Кабинеты субклиентов агентства (если аккаунт агентский)
  const [accounts, setAccounts] = useState<DirectClientAccount[]>([]);
  const [selectedAccount, setSelectedAccount] = useState<string>('');
  const [isAgency, setIsAgency] = useState(false);

  // Кампании
  const [campaigns, setCampaigns] = useState<DirectCampaignItem[]>([]);
  const [isLoadingCampaigns, setIsLoadingCampaigns] = useState(false);
  const [selectedCampaignIds, setSelectedCampaignIds] = useState<string[]>([]);
  const [notice, setNotice] = useState<string | null>(null);
  const [campaignFilter, setCampaignFilter] = useState<CampaignFilterType>('ALL');

  // Refs для предотвращения циклического перезапуска useEffect при переключении табов
  const activeConnIdRef = useRef(activeConnectionId);
  useEffect(() => {
    activeConnIdRef.current = activeConnectionId;
  }, [activeConnectionId]);

  const selectedAccountRef = useRef(selectedAccount);
  useEffect(() => {
    selectedAccountRef.current = selectedAccount;
  }, [selectedAccount]);

  const loginRef = useRef(login);
  useEffect(() => {
    loginRef.current = login;
  }, [login]);

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

        const effectiveTargetId = targetConnId || activeConnIdRef.current;
        const url = effectiveTargetId
          ? `/api/direct/status?connectionId=${encodeURIComponent(effectiveTargetId)}`
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
          } else if (data.connections?.length > 0 && !activeConnIdRef.current) {
            setActiveConnectionId(data.connections[0].id);
          }

          if (data.login) {
            setLogin(data.login);
            setSelectedAccount(data.login);
          }

          if (data.slots) {
            setSlotsInfo(data.slots);
          }
          return { connected, login: data.login, connectionId: data.connectionId };
        }
        return { connected: false };
      } catch (e) {
        console.warn('Error fetching Direct status:', e);
        return { connected: false };
      } finally {
        setIsLoading(false);
        if (showRefreshIndicator) setIsRefreshing(false);
      }
    },
    [user]
  );

  // 2. Загрузка субклиентов агентства
  const fetchAccounts = useCallback(
    async (connId?: string, defaultLogin?: string) => {
      try {
        const headers: Record<string, string> = {};
        if (user) headers['x-user-id'] = user.id;

        const effectiveConnId = connId || activeConnIdRef.current;
        const url = effectiveConnId
          ? `/api/direct/accounts?connectionId=${encodeURIComponent(effectiveConnId)}`
          : '/api/direct/accounts';

        const res = await fetch(url, { headers });
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data.accounts)) {
            setAccounts(data.accounts);
            setIsAgency(Boolean(data.isAgency));
            if (data.accounts.length > 0) {
              setSelectedAccount(data.accounts[0].login);
            } else if (defaultLogin) {
              setSelectedAccount(defaultLogin);
            }
          }
        }
      } catch (e) {
        console.warn('Error fetching agency sub-accounts:', e);
      }
    },
    [user]
  );

  // 3. Загрузка реальных кампаний из Яндекс.Директ API
  const fetchCampaigns = useCallback(
    async (clientLogin?: string, connId?: string) => {
      setIsLoadingCampaigns(true);
      setNotice(null);
      setApiError(null);
      setIsTokenExpired(false);
      setIsAppPendingApproval(false);

      try {
        const headers: Record<string, string> = {};
        if (user) headers['x-user-id'] = user.id;

        const params = new URLSearchParams();
        const effectiveConnId = connId || activeConnIdRef.current;
        if (effectiveConnId) params.set('connectionId', effectiveConnId);

        // Используем переданный логин или актуальный из ref
        const targetLogin = clientLogin || selectedAccountRef.current || loginRef.current;
        if (targetLogin) params.set('clientLogin', targetLogin);

        const res = await fetch(`/api/direct/campaigns?${params.toString()}`, { headers });
        if (res.ok) {
          const data = await res.json();
          const items: DirectCampaignItem[] = Array.isArray(data.campaigns) ? data.campaigns : [];
          setCampaigns(items);

          if (data.notice) {
            setNotice(data.notice);
          }

          if (data.isTokenExpired) {
            setIsTokenExpired(true);
          }

          if (data.isApplicationNotApproved || data.errorCode === 58) {
            setIsAppPendingApproval(true);
          }

          if (data.apiError) {
            setApiError(data.apiError);
          }

          // По умолчанию выбираем все кампании
          setSelectedCampaignIds(items.map((c) => c.id));
        } else {
          setCampaigns([]);
          if (res.status === 401) {
            setIsTokenExpired(true);
          }
        }
      } catch (e) {
        console.warn('Error loading campaigns from Direct API:', e);
        setCampaigns([]);
      } finally {
        setIsLoadingCampaigns(false);
      }
    },
    [user]
  );

  // Инициализация строго один раз при монтировании или смене пользователя
  useEffect(() => {
    let isMounted = true;
    (async () => {
      const status = await fetchStatus();
      if (isMounted && status.connected) {
        await fetchAccounts(status.connectionId);
        await fetchCampaigns(status.login, status.connectionId);
      }
    })();
    return () => {
      isMounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]); // Стабильная зависимость: не пересоздается при кликах по вкладкам!

  // Слушатель сообщений от всплывающего окна OAuth Яндекс ID
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return;

      if (event.data?.type === 'YANDEX_AUTH_SUCCESS') {
        const newLogin = event.data?.login || 'аккаунт';
        setSuccessMsg(`Кабинет ${newLogin} успешно подключен!`);
        setIsTokenExpired(false);
        setApiError(null);
        setTimeout(() => setSuccessMsg(''), 5000);

        fetchStatus(true).then((st) => {
          if (st.connected) {
            fetchAccounts(st.connectionId);
            fetchCampaigns(st.login, st.connectionId);
          }
        });
      } else if (event.data?.type === 'YANDEX_AUTH_ERROR') {
        setErrorMsg(event.data?.error || 'Ошибка при авторизации через Яндекс ID');
        setTimeout(() => setErrorMsg(''), 5000);
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [fetchStatus, fetchAccounts, fetchCampaigns]);

  // Открытие OAuth авторизации Яндекс ID
  const handleOpenOAuth = () => {
    setErrorMsg('');
    setSuccessMsg('');

    if (!user) {
      setErrorMsg('Для подключения кабинета Яндекс.Директа необходимо войти в личный кабинет.');
      return;
    }

    const userId = user.id;
    const authUrl = `/api/direct/auth?userId=${encodeURIComponent(userId)}&popup=1`;

    const width = 650;
    const height = 750;
    const left = window.screenX + (window.outerWidth - width) / 2;
    const top = window.screenY + (window.outerHeight - height) / 2;

    const popup = window.open(
      authUrl,
      'YandexDirectAuth',
      `width=${width},height=${height},left=${left},top=${top},status=no,toolbar=no,menubar=no`
    );

    if (!popup || popup.closed || typeof popup.closed === 'undefined') {
      window.location.href = `/api/direct/auth?userId=${encodeURIComponent(userId)}&popup=0`;
    }
  };

  // Мгновенное отключение конкретного кабинета (без перезагрузки страницы)
  const handleDisconnectAccount = async (targetConnId: string, targetLogin: string) => {
    if (!confirm(`Отключить кабинет «${targetLogin}» от Cransys?`)) return;

    try {
      setIsLoading(true);
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (user) headers['x-user-id'] = user.id;

      const res = await fetch(
        `/api/direct/status?connectionId=${encodeURIComponent(targetConnId)}&login=${encodeURIComponent(targetLogin)}`,
        {
          method: 'DELETE',
          headers,
          body: JSON.stringify({ connectionId: targetConnId, login: targetLogin }),
        }
      );

      if (res.ok) {
        const data = await res.json();
        const remConnections: DirectConnectionItem[] = Array.isArray(data.remainingConnections)
          ? data.remainingConnections
          : connections.filter((c) => c.id !== targetConnId && c.login !== targetLogin);

        setConnections(remConnections);

        if (remConnections.length > 0) {
          const next = remConnections[0];
          setActiveConnectionId(next.id);
          setLogin(next.login);
          setSelectedAccount(next.login);
          fetchCampaigns(next.login, next.id);
          setSuccessMsg(`Кабинет ${targetLogin} отключен. Активен: ${next.login}`);
        } else {
          // Все кабинеты отключены — мгновенно переходим в состояние готовности к подключению
          setIsConnected(false);
          setLogin('');
          setActiveConnectionId('');
          setCampaigns([]);
          setAccounts([]);
          setSelectedCampaignIds([]);
          setNotice(null);
          setIsTokenExpired(false);
          setApiError(null);
          setSuccessMsg(`Кабинет ${targetLogin} успешно отключен.`);
        }
      } else {
        setErrorMsg('Ошибка при отключении кабинета на сервере.');
      }
    } catch (e) {
      console.warn('Error disconnecting Direct account:', e);
      setErrorMsg('Не удалось отключить кабинет. Попробуйте еще раз.');
    } finally {
      setIsLoading(false);
      setTimeout(() => {
        setSuccessMsg('');
        setErrorMsg('');
      }, 4000);
    }
  };

  // Переключение активной закладки (кабинета)
  const handleSelectConnection = async (conn: DirectConnectionItem) => {
    if (conn.id === activeConnectionId) return;
    setActiveConnectionId(conn.id);
    setLogin(conn.login);
    setSelectedAccount(conn.login);
    setCampaigns([]);
    setSelectedCampaignIds([]);
    setIsTokenExpired(false);
    setIsAppPendingApproval(false);
    setApiError(null);
    setNotice(null);

    // Сначала загружаем субклиенты (если агентство), затем кампании строго для выбранного кабинета
    await fetchAccounts(conn.id, conn.login);
    await fetchCampaigns(conn.login, conn.id);
  };

  // Выбор пресета периода
  const handleSelectPeriodPreset = (days: number) => {
    setPeriodDays(days);
    setIsCustomPeriod(false);
    const d = new Date();
    d.setDate(d.getDate() - days);
    setCustomDateFrom(d.toISOString().split('T')[0]);
    setCustomDateTo(new Date().toISOString().split('T')[0]);
  };

  // Фильтрация кампаний
  const filteredCampaigns = useMemo(() => {
    if (campaignFilter === 'ALL') return campaigns;
    if (campaignFilter === 'ACTIVE') return campaigns.filter((c) => !c.isStopped);
    if (campaignFilter === 'STOPPED') return campaigns.filter((c) => c.isStopped && c.state !== 'ARCHIVED');
    if (campaignFilter === 'ARCHIVED') return campaigns.filter((c) => c.state === 'ARCHIVED');
    return campaigns;
  }, [campaigns, campaignFilter]);

  const activeCount = useMemo(() => campaigns.filter((c) => !c.isStopped).length, [campaigns]);
  const stoppedCount = useMemo(
    () => campaigns.filter((c) => c.isStopped && c.state !== 'ARCHIVED').length,
    [campaigns]
  );
  const archivedCount = useMemo(() => campaigns.filter((c) => c.state === 'ARCHIVED').length, [campaigns]);

  // Управление чекбоксами кампаний
  const toggleCampaign = (id: string) => {
    setSelectedCampaignIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const selectAllCampaigns = () => {
    setSelectedCampaignIds(filteredCampaigns.map((c) => c.id));
  };

  const deselectAllCampaigns = () => {
    setSelectedCampaignIds([]);
  };

  const selectActiveCampaigns = () => {
    setSelectedCampaignIds(campaigns.filter((c) => !c.isStopped).map((c) => c.id));
  };

  const selectStoppedCampaigns = () => {
    setSelectedCampaignIds(campaigns.filter((c) => c.isStopped).map((c) => c.id));
  };

  // Запуск аудита выбранных кампаний через Direct API
  const handleRunAudit = async () => {
    if (selectedCampaignIds.length === 0) {
      setErrorMsg('Выберите хотя бы одну кампанию для анализа');
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

      const res = await fetch('/api/direct/run-audit', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          accountLogin: selectedAccount || login,
          connectionId: activeConnectionId,
          campaignIds: selectedCampaignIds,
          periodDays,
          dateFrom: isCustomPeriod ? customDateFrom : undefined,
          dateTo: isCustomPeriod ? customDateTo : undefined,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success && data.report) {
        if (onAuditComplete) {
          onAuditComplete(data.report, data.fileName || 'Аудит Яндекс.Директ (API)');
        }
      } else {
        setErrorMsg(data.error || 'Ошибка при проведении прямого аудита через API');
      }
    } catch (e: any) {
      console.error('Audit direct failed:', e);
      setErrorMsg('Не удалось связаться с сервером аудита');
    } finally {
      setIsRunningAudit(false);
    }
  };

  const activeConnection = connections.find((c) => c.id === activeConnectionId) || connections[0];

  return (
    <div
      id="yandex_direct_integration_card"
      className="bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden transition-all"
    >
      {/* 1. ВЕРХНЯЯ ШАПКА КАРТОЧКИ: БЕЗ ДУБЛИРОВАНИЯ КНОПОК И ШУМА */}
      <div className="p-5 sm:p-6 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-b from-slate-50/60 to-white">
        <div className="flex items-start gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-red-50 border border-red-200/80 flex items-center justify-center text-red-600 font-black text-lg shrink-0 shadow-2xs">
            Я
          </div>

          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-base font-bold text-slate-900 tracking-tight">
                Интеграция с Яндекс.Директ (OAuth API v5)
              </h3>

              {hasAccess ? (
                isConnected ? (
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    Подключено: {connections.length} {connections.length === 1 ? 'кабинет' : 'кабинета'}
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

              {slotsInfo && (
                <span
                  title={`Использовано слотов кабинетов в текущем месяце: ${slotsInfo.usedSlots} из ${slotsInfo.maxSlots}. Уникальные подключенные логины: ${slotsInfo.usedLogins.join(', ') || 'нет'}`}
                  className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                    slotsInfo.availableSlots > 0
                      ? 'bg-slate-50 text-slate-700 border-slate-200'
                      : 'bg-amber-50 text-amber-800 border-amber-300'
                  }`}
                >
                  <Building2 className="w-3 h-3 text-slate-500" />
                  <span>Слоты кабинетов: {slotsInfo.usedSlots}/{slotsInfo.maxSlots} в мес.</span>
                </span>
              )}
            </div>

            <p className="text-xs text-slate-600 mt-1 max-w-2xl leading-relaxed">
              {hasAccess
                ? isConnected
                  ? 'Авторизовано через Яндекс ID. Аудит работающих и остановленных кампаний, анализ структуры, минус-фраз и выбор произвольного периода.'
                  : 'Подключите ваш аккаунт Яндекс.Директ через безопасный протокол Яндекс ID для аудита в 1 клик без ручной выгрузки файлов.'
                : 'Прямое подключение к API Яндекс.Директ доступно на тарифах PRO, MAX и Corporate.'}
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
          </div>
        </div>

        {/* Правая часть шапки: только кнопка синхронизации (когда подключено) или кнопка подключения */}
        <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
          {hasAccess ? (
            isConnected ? (
              <button
                type="button"
                id="direct_refresh_btn"
                onClick={() => {
                  fetchStatus(true);
                  fetchCampaigns();
                }}
                disabled={isRefreshing || isLoadingCampaigns}
                title="Обновить статус и кампании"
                className="px-3 py-1.5 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50 shadow-2xs"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing || isLoadingCampaigns ? 'animate-spin' : ''}`} />
                <span>Обновить данные</span>
              </button>
            ) : (
              <button
                type="button"
                id="direct_connect_main_btn"
                onClick={handleOpenOAuth}
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all flex items-center gap-1.5 shadow-xs cursor-pointer"
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

      {/* 2. СОДЕРЖИМОЕ ПРИ ПОДКЛЮЧЕННЫХ АККАУНТАХ */}
      {hasAccess && isConnected && (
        <div className="p-5 sm:p-6 space-y-4">
          {/* ЗАКЛАДКИ (ТАБЫ) ДЛЯ КАЖДОГО ПОДКЛЮЧЕННОГО КАБИНЕТА */}
          <div className="border-b border-slate-200">
            <div className="flex items-center gap-1.5 overflow-x-auto pb-2 scrollbar-none">
              {connections.map((conn) => {
                const isActive = conn.id === activeConnectionId || (connections.length === 1 && !activeConnectionId);
                return (
                  <button
                    key={conn.id}
                    type="button"
                    onClick={() => handleSelectConnection(conn)}
                    className={`group px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer border shrink-0 ${
                      isActive
                        ? 'bg-blue-50 border-blue-200 text-blue-900 shadow-2xs'
                        : 'bg-white border-transparent text-slate-600 hover:bg-slate-100/70 hover:text-slate-900'
                    }`}
                  >
                    <Building2 className={`w-3.5 h-3.5 ${isActive ? 'text-blue-600' : 'text-slate-400'}`} />
                    <span>{conn.login}</span>
                    {isActive && (
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-600" />
                    )}
                  </button>
                );
              })}

              {/* Кнопка добавления следующего кабинета в табах */}
              {isCorpOrMax && (
                slotsInfo && slotsInfo.availableSlots <= 0 ? (
                  <button
                    type="button"
                    onClick={onOpenPricing}
                    title="Исчерпан лимит слотов кабинетов на этот месяц. Повысьте тариф для добавления новых кабинетов."
                    className="px-3 py-2 rounded-xl border border-dashed border-amber-300 bg-amber-50/50 text-amber-800 text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer shrink-0"
                  >
                    <Lock className="w-3.5 h-3.5 text-amber-600" />
                    <span>Слоты исчерпаны ({slotsInfo.usedSlots}/{slotsInfo.maxSlots})</span>
                  </button>
                ) : connections.length < maxAccounts ? (
                  <button
                    type="button"
                    id="direct_tab_add_account_btn"
                    onClick={handleOpenOAuth}
                    title="Подключить еще один кабинет Яндекс.Директ"
                    className="px-3 py-2 rounded-xl border border-dashed border-slate-300 hover:border-blue-300 hover:bg-blue-50/50 text-slate-600 hover:text-blue-700 text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer shrink-0"
                  >
                    <PlusCircle className="w-3.5 h-3.5 text-blue-600" />
                    <span>+ Подключить кабинет</span>
                  </button>
                ) : null
              )}
            </div>
          </div>

          {/* ПАНЕЛЬ УПРАВЛЕНИЯ ТЕКУЩИМ КАБИНЕТОМ (ОБНОВИТЬ ТОКЕН / ОТКЛЮЧИТЬ КАБИНЕТ) */}
          {activeConnection && (
            <div className="p-3 bg-slate-50/80 rounded-xl border border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-xs">
                <span className="text-slate-500">Активный кабинет:</span>
                <span className="font-bold text-slate-900 font-mono bg-white px-2 py-0.5 rounded-md border border-slate-200">
                  {activeConnection.login}
                </span>
                {activeConnection.connectedAt && (
                  <span className="text-[11px] text-slate-400 hidden md:inline">
                    • Подключен {new Date(activeConnection.connectedAt).toLocaleDateString('ru-RU')}
                  </span>
                )}
              </div>

              {/* Кнопки управления только для этого кабинета */}
              <div className="flex items-center gap-2 self-end sm:self-center">
                <button
                  type="button"
                  id="direct_reauth_token_btn"
                  onClick={handleOpenOAuth}
                  title="Обновить токен доступа Яндекс ID для этого кабинета"
                  className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-semibold transition-colors flex items-center gap-1 cursor-pointer"
                >
                  <KeyRound className="w-3 h-3 text-slate-500" />
                  <span>Обновить токен</span>
                </button>

                <button
                  type="button"
                  id="direct_disconnect_current_btn"
                  onClick={() => handleDisconnectAccount(activeConnection.id, activeConnection.login)}
                  title={`Отключить кабинет ${activeConnection.login}`}
                  className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 hover:bg-red-50 hover:border-red-200 hover:text-red-700 text-slate-500 text-xs font-semibold transition-colors flex items-center gap-1 cursor-pointer"
                >
                  <Trash2 className="w-3 h-3" />
                  <span>Отключить</span>
                </button>
              </div>
            </div>
          )}

          {/* ПРЕДУПРЕЖДЕНИЕ О СРОКЕ ТОКЕНА ИЛИ ОШИБКЕ АВТОРИЗАЦИИ (БЕЗ ДЕМО-ДАННЫХ!) */}
          {isTokenExpired && (
            <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 space-y-2">
              <div className="flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <div className="font-bold">
                    Требуется обновить токен доступа для кабинета «{activeConnection?.login || login}»
                  </div>
                  <p className="text-amber-800 leading-relaxed">
                    API Яндекс.Директ сообщает, что OAuth-токен недействителен (код 53). Убедитесь, что в приложении Яндекс OAuth активирован доступ к API Директа (<code className="font-mono bg-amber-100 px-1 py-0.5 rounded text-[11px]">direct:api</code>), затем нажмите «Обновить токен».
                  </p>
                </div>
              </div>
              <div className="pt-1 flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleOpenOAuth}
                  className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-bold text-xs shrink-0 cursor-pointer shadow-2xs"
                >
                  Обновить токен через Яндекс ID
                </button>
              </div>
            </div>
          )}

          {/* ПРЕДУПРЕЖДЕНИЕ О НЕОБХОДИМОСТИ ПОДТВЕРЖДЕНИЯ ЗАЯВКИ ПРИЛОЖЕНИЯ В ДИРЕКТЕ (КОД 58) */}
          {isAppPendingApproval && (
            <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-950 space-y-3">
              <div className="flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div className="space-y-1.5">
                  <div className="font-bold text-amber-900 text-[13px]">
                    Требуется подтвердить заявку на доступ к API Директа (код 58)
                  </div>
                  <p className="text-amber-800 leading-relaxed">
                    Программный доступ к вашему кабинету открыт, но для внешнего приложения требуется однократное подтверждение заявки в интерфейсе Яндекс.Директа.
                  </p>
                  <div className="bg-amber-100/70 p-3 rounded-lg border border-amber-200/80 space-y-1.5 text-[11px] text-amber-900">
                    <div className="font-semibold">Как подтвердить за 1 минуту:</div>
                    <ol className="list-decimal list-inside space-y-1">
                      <li>
                        Откройте страницу настроек API Директа:{' '}
                        <a
                          href="https://direct.yandex.ru/registered/main.pl?cmd=apiSettings"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-bold underline text-amber-950 hover:text-black inline-flex items-center gap-0.5"
                        >
                          direct.yandex.ru/registered/main.pl?cmd=apiSettings
                          <ExternalLink className="w-3 h-3 inline" />
                        </a>
                      </li>
                      <li>
                        В блоке «Заявки на доступ» или «Мои приложения» найдите приложение и нажмите <b>«Подтвердить»</b> (или отправьте заявку на доступ к API).
                      </li>
                      <li>
                        После подтверждения вернитесь сюда и нажмите кнопку <b>«Обновить данные»</b> ниже.
                      </li>
                    </ol>
                  </div>
                </div>
              </div>
              <div className="pt-1 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    fetchStatus(true);
                    fetchCampaigns();
                  }}
                  className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-bold text-xs shrink-0 cursor-pointer shadow-2xs flex items-center gap-1.5"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isLoadingCampaigns ? 'animate-spin' : ''}`} />
                  <span>Обновить данные после подтверждения</span>
                </button>
              </div>
            </div>
          )}

          {apiError && !isTokenExpired && !isAppPendingApproval && (
            <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-xs text-red-900 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold">Ответ API Яндекс.Директ: </span>
                <span>{apiError}</span>
              </div>
            </div>
          )}

          {/* ВЫБОР СУБКЛИЕНТА (ЕСЛИ АККАУНТ АГЕНТСТВА) */}
          {isAgency && accounts.length > 1 && (
            <div className="p-3 bg-white rounded-xl border border-slate-200 flex items-center gap-2.5">
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

          {/* ВЫБОР ПЕРИОДА АНАЛИЗА ДЛЯ АУДИТА */}
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
                Свой интервал...
              </button>
            </div>

            {/* Выбор произвольных дат */}
            {isCustomPeriod && (
              <div className="pt-2 flex flex-wrap items-center gap-3 text-xs">
                <div className="flex items-center gap-2">
                  <span className="text-slate-500 font-medium">От:</span>
                  <input
                    type="date"
                    id="direct_custom_date_from"
                    value={customDateFrom}
                    onChange={(e) => setCustomDateFrom(e.target.value)}
                    className="px-2.5 py-1 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 font-mono text-xs"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-slate-500 font-medium">До:</span>
                  <input
                    type="date"
                    id="direct_custom_date_to"
                    value={customDateTo}
                    onChange={(e) => setCustomDateTo(e.target.value)}
                    className="px-2.5 py-1 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 font-mono text-xs"
                  />
                </div>
              </div>
            )}

            {/* Подсказка по периоду */}
            {showPeriodInfo && (
              <div className="p-3 bg-emerald-50/70 border border-emerald-200/80 rounded-lg text-xs text-emerald-950 space-y-1">
                <div className="font-bold flex items-center gap-1 text-emerald-900">
                  <Clock className="w-3.5 h-3.5" />
                  <span>Зачем нужен выбор периода?</span>
                </div>
                <p className="text-[11px] leading-relaxed text-emerald-900/90">
                  Если показы в кампаниях были остановлены несколько недель или месяцев назад, стандартный 30-дневный срез покажет 0 кликов. Выбор периода 90, 180 или 365 дней подтягивает накопленную статистику того времени, когда кампании активно работали, что позволяет нашему движку проанализировать эффективность, конверсии, неэффективные площадки РСЯ и слить бюджет.
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

          {/* СПИСОК ВСЕХ КАМПАНИЙ (РЕАЛЬНЫЕ ДАННЫЕ ИЗ API ЯНДЕКС.ДИРЕКТ) */}
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
              {campaigns.length > 0 && (
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
              )}
            </div>

            {isLoadingCampaigns ? (
              <div className="py-12 text-center text-xs text-slate-400 flex flex-col items-center justify-center gap-2.5">
                <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                <span>Загрузка реальных кампаний из Яндекс.Директ API...</span>
              </div>
            ) : filteredCampaigns.length === 0 ? (
              <div className="py-10 px-4 text-center text-xs text-slate-500 space-y-1">
                <p className="font-semibold text-slate-700">
                  {campaigns.length === 0
                    ? `В кабинете «${activeConnection?.login || login}» не найдено кампаний.`
                    : 'Кампании по выбранному фильтру не найдены.'}
                </p>
                <p className="text-slate-400 text-[11px]">
                  {campaigns.length === 0 && !isTokenExpired
                    ? 'Создайте кампанию в Яндекс.Директ или подключите другой кабинет.'
                    : 'Измените фильтр или обновите данные.'}
                </p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100 max-h-80 overflow-y-auto">
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
                          </div>
                          <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-0.5 flex-wrap">
                            <span className="font-mono text-[10px] text-slate-400">ID: {camp.id}</span>
                            <span>•</span>
                            <span>{camp.typeLabel}</span>
                            {camp.statusClarification && (
                              <>
                                <span>•</span>
                                <span className="text-amber-800 bg-amber-50 px-1.5 py-0.2 rounded border border-amber-200/80 text-[10px]">
                                  {camp.statusClarification}
                                </span>
                              </>
                            )}
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

          {/* ПАНЕЛЬ ЗАПУСКА АНАЛИЗА */}
          {campaigns.length > 0 && (
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
          )}
        </div>
      )}
    </div>
  );
}
