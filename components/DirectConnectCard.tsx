'use client';

import React, { useState, useEffect } from 'react';
import { KeyRound, CheckCircle2, Lock, ExternalLink, RefreshCw, AlertCircle, Trash2 } from 'lucide-react';
import { useUser } from '@/lib/auth/user-context';
import { getTierConfig } from '@/lib/billing/tiers';
import { AuditReportData } from '@/lib/audit/types';

interface DirectConnectCardProps {
  onAuditStarted?: () => void;
  onAuditComplete?: (report: AuditReportData, fileName: string) => void;
  onOpenPricing?: () => void;
}

export function DirectConnectCard({ onAuditStarted, onAuditComplete, onOpenPricing }: DirectConnectCardProps) {
  const { user } = useUser();
  const [isConnected, setIsConnected] = useState(false);
  const [login, setLogin] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [isRunningAudit, setIsRunningAudit] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const hasAccess = getTierConfig(user?.tier).hasDirectApi;

  useEffect(() => {
    let isMounted = true;

    async function fetchStatus() {
      try {
        const headers: Record<string, string> = {};
        if (user) {
          headers['x-user-id'] = user.id;
          headers['x-user-email'] = user.email;
        }

        const res = await fetch('/api/direct/status', { headers });
        if (res.ok && isMounted) {
          const data = await res.json();
          setIsConnected(Boolean(data.connected));
          if (data.login) setLogin(data.login);
        }
      } catch (e) {
        console.warn('Error fetching Direct status:', e);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    fetchStatus();

    return () => {
      isMounted = false;
    };
  }, [user]);

  // Запуск прямого сканирования
  const handleRunAudit = async () => {
    if (isRunningAudit) return;
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
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setErrorMsg(data.error || 'Ошибка при проведении прямого аудита');
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
    try {
      const headers: Record<string, string> = {};
      if (user) headers['x-user-id'] = user.id;
      await fetch('/api/direct/status', { method: 'DELETE', headers });
      setIsConnected(false);
      setLogin('');
    } catch (e) {
      console.warn('Error disconnecting:', e);
    }
  };

  return (
    <div
      className={`p-5 sm:p-6 rounded-2xl border transition-all ${
        hasAccess
          ? 'bg-gradient-to-r from-emerald-50/70 via-white to-blue-50/50 border-emerald-200'
          : 'bg-gradient-to-r from-slate-50 to-blue-50/30 border-slate-200'
      }`}
    >
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <div
            className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${
              hasAccess ? 'bg-emerald-600 text-white shadow-xs' : 'bg-slate-200 text-slate-500'
            }`}
          >
            <KeyRound className="w-5 h-5" />
          </div>

          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-sm font-bold text-slate-900">
                Прямое подключение к Яндекс.Директ по OAuth
              </h3>
              {hasAccess ? (
                isConnected ? (
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    Подключено: {login}
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
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

            <p className="text-xs text-slate-600 mt-1.5 max-w-2xl leading-relaxed">
              {hasAccess
                ? isConnected
                  ? `Кабинет авторизован. Вы можете запустить независимый экспресс-аудит кампаний прямо из Яндекс.Директа в 1 клик без ручной выгрузки файлов.`
                  : 'Подключите ваш аккаунт Яндекс.Директ через безопасную авторизацию Яндекс ID. Мы запрашиваем только права на чтение статистики без возможности изменения настроек.'
                : 'Прямое подключение к API Яндекс.Директ доступно на тарифах PRO (10 отчетов/мес), MAX (30 отчетов) и Corporate. Избавьтесь от ручной рутины скачивания файлов.'}
            </p>

            {errorMsg && (
              <div className="mt-2 text-xs text-red-600 flex items-center gap-1 font-semibold">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2.5 shrink-0 self-end md:self-center">
          {hasAccess ? (
            isConnected ? (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleRunAudit}
                  disabled={isRunningAudit}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all flex items-center gap-1.5 shadow-xs disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isRunningAudit ? 'animate-spin' : ''}`} />
                  <span>{isRunningAudit ? 'Сканирование API...' : 'Запустить аудит API'}</span>
                </button>

                <button
                  type="button"
                  onClick={handleDisconnect}
                  title="Отключить аккаунт"
                  className="p-2 rounded-xl bg-white border border-slate-200 hover:bg-red-50 hover:border-red-200 hover:text-red-600 text-slate-400 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <a
                href="/api/direct/auth"
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all flex items-center gap-1.5 shadow-xs"
              >
                <span>Подключить Яндекс.Директ</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            )
          ) : (
            <button
              type="button"
              onClick={onOpenPricing}
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold transition-all shadow-xs"
            >
              Подключить Direct API в PRO
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
