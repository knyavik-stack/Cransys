'use client';

import React, { useState, useEffect, useCallback } from 'react';
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

export function DirectConnectCard({
  onAuditStarted,
  onAuditComplete,
  onOpenPricing,
}: DirectConnectCardProps) {
  const { user } = useUser();
  const [isConnected, setIsConnected] = useState(false);
  const [login, setLogin] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isRunningAudit, setIsRunningAudit] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Кабинеты и субклиенты
  const [accounts, setAccounts] = useState<DirectClientAccount[]>([]);
  const [selectedAccount, setSelectedAccount] = useState<string>('');
  const [isAgency, setIsAgency] = useState(false);

  // Кампании
  const [campaigns, setCampaigns] = useState<DirectCampaignItem[]>([]);
  const [isLoadingCampaigns, setIsLoadingCampaigns] = useState(false);
  const [selectedCampaignIds, setSelectedCampaignIds] = useState<string[]>([]);
  const [notice, setNotice] = useState<string | null>(null);

  const hasAccess = getTierConfig(user?.tier).hasDirectApi;

  // 1. Проверка статуса подключения
  const fetchStatus = useCallback(async (showRefreshIndicator = false) => {
    if (showRefreshIndicator) setIsRefreshing(true);
    setErrorMsg('');
    try {
      const headers: Record<string, string> = {};
      if (user) {
        headers['x-user-id'] = user.id;
        headers['x-user-email'] = user.email;
      }

      const res = await fetch('/api/direct/status', { headers });
      if (res.ok) {
        const data = await res.json();
        const connected = Boolean(data.connected);
        setIsConnected(connected);
        if (data.login) {
          setLogin(data.login);
          setSelectedAccount(data.login);
        }
        return connected;
      }
      return false;
    } catch (e) {
      console.warn('Error fetching Direct status:', e);
      return false;
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [user]);

  // 2. Загрузка кабинетов
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

  // 3. Загрузка кампаний для выбранного кабинета
  const fetchCampaigns = useCallback(async (accountLogin?: string) => {
    const targetLogin = accountLogin || selectedAccount || login;
    if (!targetLogin) return;

    setIsLoadingCampaigns(true);
    setNotice(null);
    try {
      const headers: Record<string, string> = {};
      if (user) headers['x-user-id'] = user.id;

      const res = await fetch(
        `/api/direct/campaigns?clientLogin=${encodeURIComponent(targetLogin)}`,
        { headers }
      );
      if (res.ok) {
        const data = await res.json();
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
  }, [user, selectedAccount, login]);

  // Первичная загрузка
  useEffect(() => {
    let isMounted = true;

    const loadInitialData = async () => {
      try {
        const headers: Record<string, string> = {};
        if (user) {
          headers['x-user-id'] = user.id;
          headers['x-user-email'] = user.email;
        }

        const res = await fetch('/api/direct/status', { headers });
        if (!isMounted) return;

        if (res.ok) {
          const data = await res.json();
          const connected = Boolean(data.connected);
          setIsConnected(connected);
          if (data.login) {
            setLogin(data.login);
            setSelectedAccount(data.login);
          }
          if (connected) {
            fetchAccounts();
            fetchCampaigns(data.login);
          }
        }
      } catch (e) {
        console.warn('Error loading initial Direct status:', e);
      } finally {
        if (isMounted) {
          setIsLoading(false);
          setIsRefreshing(false);
        }
      }
    };

    loadInitialData();

    return () => {
      isMounted = false;
    };
  }, [user, fetchAccounts, fetchCampaigns]);

  // Слушатель postMessage от всплывающего окна авторизации Яндекс OAuth
  useEffect(() => {
    const handleAuthMessage = (event: MessageEvent) => {
      if (event.data?.type === 'YANDEX_DIRECT_CONNECTED') {
        if (event.data.success) {
          setIsConnected(true);
          if (event.data.login) {
            setLogin(event.data.login);
            setSelectedAccount(event.data.login);
          }
          setSuccessMsg(`Аккаунт ${event.data.login || ''} успешно авторизован!`);
          setTimeout(() => setSuccessMsg(''), 4000);
          fetchStatus(true).then(() => {
            fetchAccounts();
            fetchCampaigns(event.data.login);
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

    // Fallback polling если браузер блокирует postMessage
    if (popup) {
      const timer = setInterval(() => {
        if (popup.closed) {
          clearInterval(timer);
          fetchStatus().then((connected) => {
            if (connected) {
              fetchAccounts();
              fetchCampaigns();
            }
          });
        }
      }, 1500);
    } else {
      // Если попап заблокирован — обычный переход
      window.location.href = `/api/direct/auth?userId=${encodeURIComponent(targetUserId)}`;
    }
  };

  // Переключение выбора кампании
  const toggleCampaign = (id: string) => {
    setSelectedCampaignIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const selectAllCampaigns = () => {
    setSelectedCampaignIds(campaigns.map((c) => c.id));
  };

  const deselectAllCampaigns = () => {
    setSelectedCampaignIds([]);
  };

  // Запуск аудита по выбранным кампаниям
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

      const res = await fetch('/api/direct/run-audit', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          campaignIds: selectedCampaignIds,
          accountLogin: selectedAccount || login,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setErrorMsg(data.error || 'Ошибка при проведении аудита кампаний');
        return;
      }

      if (data.report && onAuditComplete) {
        onAuditComplete(data.report, data.fileName || 'Яндекс.Директ API');
      }
    } catch (e) {
      setErrorMsg('Сетевая ошибка при запуске сканирования API');
    } finally {
      setIsRunningAudit(false);
    }
  };

  // Отключение
  const handleDisconnect = async () => {
    if (!confirm('Отключить интеграцию с Яндекс.Директ?')) return;
    try {
      const headers: Record<string, string> = {};
      if (user) headers['x-user-id'] = user.id;
      await fetch('/api/direct/status', { method: 'DELETE', headers });
      setIsConnected(false);
      setLogin('');
      setCampaigns([]);
      setAccounts([]);
      setSelectedCampaignIds([]);
    } catch (e) {
      console.warn('Error disconnecting:', e);
    }
  };

  return (
    <div
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
                Прямое подключение к Яндекс.Директ по OAuth
              </h3>

              {hasAccess ? (
                isConnected ? (
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    Подключено: {login}
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
            </div>

            <p className="text-xs text-slate-600 mt-1 max-w-2xl leading-relaxed">
              {hasAccess
                ? isConnected
                  ? `Кабинет авторизован. Доступно прямое сканирование кампаний через API Яндекс.Директ v5 без ручной выгрузки XLS/CSV файлов.`
                  : 'Подключите ваш аккаунт Яндекс.Директ через безопасную авторизацию Яндекс ID. Мы запрашиваем только права на чтение структуры и статистики.'
                : 'Прямое подключение к API Яндекс.Директ доступно на тарифах PRO (10 отчетов), MAX (30 отчетов) и Corporate. Избавьтесь от ручной рутины скачивания файлов.'}
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

        {/* Главная кнопка подключения / действий */}
        <div className="flex items-center gap-2.5 shrink-0 self-end md:self-center">
          {hasAccess ? (
            isConnected ? (
              <div className="flex items-center gap-2">
                <button
                  type="button"
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

                <button
                  type="button"
                  onClick={handleDisconnect}
                  title="Отключить аккаунт"
                  className="p-2 rounded-xl bg-white border border-slate-200 hover:bg-red-50 hover:border-red-200 hover:text-red-600 text-slate-400 transition-colors cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                type="button"
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
              onClick={onOpenPricing}
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold transition-all shadow-xs cursor-pointer"
            >
              Подключить Direct API в PRO
            </button>
          )}
        </div>
      </div>

      {/* ДЕТАЛИЗАЦИЯ КАБИНЕТОВ И КАМПАНИЙ (КОГДА ПОДКЛЮЧЕНО) */}
      {hasAccess && isConnected && (
        <div className="p-5 sm:p-6 space-y-4">
          {/* Панель выбора кабинета (если аккаунт агентский или содержит несколько субклиентов) */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3.5 rounded-xl border border-slate-200">
            <div className="flex items-center gap-2.5">
              <Building2 className="w-4 h-4 text-blue-600 shrink-0" />
              <div>
                <span className="text-xs font-bold text-slate-800 block">
                  {isAgency ? 'Клиентский кабинет агентства:' : 'Рекламный кабинет:'}
                </span>
                <span className="text-[11px] text-slate-500">
                  {accounts.length > 1
                    ? `Найдено ${accounts.length} подключенных кабинетов`
                    : `Прямой рекламодатель: ${login} (1 активный кабинет)`}
                </span>
              </div>
            </div>

            {accounts.length > 1 ? (
              <div className="relative">
                <select
                  value={selectedAccount}
                  onChange={(e) => {
                    setSelectedAccount(e.target.value);
                    fetchCampaigns(e.target.value);
                  }}
                  className="px-3 py-1.5 pr-8 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500 cursor-pointer"
                >
                  {accounts.map((acc) => (
                    <option key={acc.login} value={acc.login}>
                      {acc.name || acc.login} ({acc.login})
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <span className="text-xs font-mono font-bold text-slate-700 px-2.5 py-1 bg-slate-100 rounded-lg border border-slate-200">
                {login}
              </span>
            )}
          </div>

          {/* Информационное уведомление (если кампании демонстрационные или свежий аккаунт) */}
          {notice && (
            <div className="p-3 rounded-xl bg-blue-50/80 border border-blue-200/80 flex items-start gap-2.5 text-xs text-blue-900">
              <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
              <div className="leading-relaxed">{notice}</div>
            </div>
          )}

          {/* Список кампаний с чекбоксами */}
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <div className="p-3.5 bg-slate-50/70 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <SlidersHorizontal className="w-4 h-4 text-slate-600" />
                <span className="text-xs font-bold text-slate-800">
                  Кампании для аудита ({selectedCampaignIds.length} из {campaigns.length})
                </span>
              </div>

              <div className="flex items-center gap-2 text-xs">
                <button
                  type="button"
                  onClick={selectAllCampaigns}
                  className="text-blue-600 hover:text-blue-700 font-semibold hover:underline cursor-pointer"
                >
                  Выбрать все
                </button>
                <span className="text-slate-300">•</span>
                <button
                  type="button"
                  onClick={deselectAllCampaigns}
                  className="text-slate-500 hover:text-slate-700 font-semibold hover:underline cursor-pointer"
                >
                  Снять выбор
                </button>
              </div>
            </div>

            {isLoadingCampaigns ? (
              <div className="py-8 text-center text-xs text-slate-400 flex flex-col items-center justify-center gap-2">
                <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                <span>Загрузка списка кампаний через Яндекс.Директ API...</span>
              </div>
            ) : campaigns.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400">
                Кампании не найдены в данном кабинете.
              </div>
            ) : (
              <div className="divide-y divide-slate-100 max-h-64 overflow-y-auto">
                {campaigns.map((camp) => {
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
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-semibold text-slate-900 truncate">
                              {camp.name}
                            </span>
                            {camp.isDemo && (
                              <span className="text-[10px] px-1.5 py-0.2 rounded-md bg-amber-50 text-amber-700 border border-amber-200 shrink-0 font-medium">
                                Демо-снимок
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-0.5">
                            <span className="font-mono text-[10px] text-slate-400">ID: {camp.id}</span>
                            <span>•</span>
                            <span>{camp.typeLabel}</span>
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
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                            isRunning
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : 'bg-slate-100 text-slate-600 border-slate-200'
                          }`}
                        >
                          {isRunning ? 'Идут показы' : 'Остановлена'}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Панель запуска анализа */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
            <div className="text-xs text-slate-500">
              Выбрано для экспресс-аудита:{' '}
              <span className="font-bold text-slate-800">{selectedCampaignIds.length}</span> из{' '}
              {campaigns.length}
            </div>

            <button
              type="button"
              onClick={handleRunAudit}
              disabled={isRunningAudit || selectedCampaignIds.length === 0}
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-sm shadow-emerald-600/20 disabled:opacity-50 cursor-pointer"
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
