'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  FileSpreadsheet,
  PlusCircle,
  Flame,
  ShieldCheck,
  Clock,
  ArrowUpRight,
  Sparkles,
  ArrowLeft,
  User,
  LogOut,
  LogIn,
} from 'lucide-react';
import { AuditReportData } from '@/lib/audit/types';
import { AuditResults } from '@/components/AuditResults';
import { useUser } from '@/lib/auth/user-context';
import { Crown } from 'lucide-react';

interface AuditHistoryItem {
  id: string;
  fileName: string;
  createdAt: string;
  status: string;
  tier: string | null;
  totalSpendRub: number | null;
  totalLossRub: number | null;
  overallScore: number | null;
}

export default function DashboardPage() {
  const { user, loginTestAccount, setTier, logout } = useUser();
  const [history, setHistory] = useState<AuditHistoryItem[]>([]);

  const [isLoading, setIsLoading] = useState(true);

  // Для просмотра конкретного аудита из истории
  const [selectedReport, setSelectedReport] = useState<AuditReportData | null>(null);
  const [selectedFileName, setSelectedFileName] = useState<string>('');
  const [loadingReportId, setLoadingReportId] = useState<string | null>(null);

  useEffect(() => {
    async function loadHistory() {
      if (!user) {
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      try {
        const headers: Record<string, string> = {
          'x-user-id': user.id,
          'x-user-email': user.email,
        };
        const res = await fetch('/api/audit/history', { headers });
        const data = await res.json();
        if (data.reports && data.reports.length > 0) {
          setHistory(data.reports);
        } else {
          setHistory([]);
        }
      } catch {
        setHistory([]);
      } finally {
        setIsLoading(false);
      }
    }

    loadHistory();
  }, [user]);

  const handleOpenReport = async (item: AuditHistoryItem) => {
    setLoadingReportId(item.id);
    try {
      const res = await fetch(`/api/audit/${item.id}`);
      if (res.ok) {
        const data = await res.json();
        if (data.report) {
          setSelectedReport(data.report);
          setSelectedFileName(data.fileName || item.fileName);
          return;
        }
      }
    } catch {
      // Fallback
    } finally {
      setLoadingReportId(null);
    }
  };

  const totalLossPrevented = history.reduce((sum, item) => sum + (item.totalLossRub || 0), 0);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Верхняя навигация */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold text-sm">
                C
              </div>
              <span className="font-extrabold text-slate-900 tracking-tight text-lg">Cransys</span>
            </Link>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 font-semibold border border-blue-100">
              Личный кабинет
            </span>
          </div>

          <div className="flex items-center gap-3">
            {user ? (
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-2 px-2.5 py-1 rounded-lg bg-slate-100 border border-slate-200 text-xs text-slate-700">
                  <div className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px] font-bold">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                  <span className="font-medium max-w-[110px] sm:max-w-[160px] truncate">{user.name}</span>
                </div>
                <button
                  onClick={logout}
                  title="Выйти"
                  className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-500 hover:text-slate-800 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => loginTestAccount('MAX')}
                  className="text-xs font-semibold px-2.5 py-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 transition-colors flex items-center gap-1.5"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                  <span className="hidden sm:inline">Тестовый профиль</span>
                  <span className="sm:hidden">Тест</span>
                </button>
                <Link
                  href="/sign-in"
                  className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 transition-colors flex items-center gap-1"
                >
                  <LogIn className="w-3.5 h-3.5" />
                  <span>Войти</span>
                </Link>
              </div>
            )}

            <Link
              href="/"
              className="inline-flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs transition-colors shadow-xs"
            >
              <PlusCircle className="w-4 h-4" />
              <span className="hidden sm:inline">Новый аудит</span>
              <span className="sm:hidden">Аудит</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Основной контент */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-6 space-y-6">
        {selectedReport ? (
          <div>
            <div className="mb-4 flex items-center justify-between">
              <button
                onClick={() => setSelectedReport(null)}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-xs transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Вернуться к списку проверок</span>
              </button>
              <span className="text-xs text-slate-500 truncate max-w-[200px] sm:max-w-none">
                Отчет: <span className="font-semibold text-slate-800">{selectedFileName}</span>
              </span>
            </div>

            <AuditResults
              report={selectedReport}
              sourceName={selectedFileName}
              onReset={() => setSelectedReport(null)}
            />
          </div>
        ) : (
          <>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs">
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">Реестр проверок Яндекс.Директ</h1>
                <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                  Сохраненные отчеты, динамика индекса здоровья и зафиксированные сливы
                </p>
              </div>

              {/* Переключатель тарифа для тестирования */}
              {user && (
                <div className="flex items-center gap-2 bg-slate-50 p-1.5 rounded-xl border border-slate-200 self-start sm:self-auto">
                  <span className="text-[11px] font-semibold text-slate-600 flex items-center gap-1 pl-1">
                    <Crown className="w-3.5 h-3.5 text-amber-600" />
                    <span>Тариф:</span>
                  </span>
                  <div className="grid grid-cols-3 gap-1">
                    {(['EXPRESS', 'PRO', 'MAX'] as const).map((t) => {
                      const isActive = user.tier === t;
                      return (
                        <button
                          key={t}
                          type="button"
                          onClick={() => setTier(t)}
                          className={`px-2 py-0.5 text-[11px] font-bold rounded-md transition-all ${
                            isActive
                              ? 'bg-blue-600 text-white shadow-xs'
                              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                          }`}
                        >
                          {t === 'EXPRESS' ? 'Экспресс' : t === 'PRO' ? 'Pro' : 'MAX'}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Сводные карточки */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200 shadow-xs">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Всего проверок
                </span>
                <div className="mt-2 flex items-baseline gap-2">
                  <span className="text-2xl sm:text-3xl font-extrabold font-mono text-slate-900">
                    {history.length}
                  </span>
                  <span className="text-xs text-slate-500">выгрузок</span>
                </div>
              </div>

              <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200 shadow-xs">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-red-600 uppercase tracking-wider">
                    Обнаружено сливов
                  </span>
                  <Flame className="w-4 h-4 text-red-500" />
                </div>
                <div className="mt-2 flex items-baseline gap-2">
                  <span className="text-2xl sm:text-3xl font-extrabold font-mono text-red-600">
                    {totalLossPrevented.toLocaleString('ru-RU')} ₽
                  </span>
                </div>
              </div>

              <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200 shadow-xs">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-emerald-700 uppercase tracking-wider">
                    Хранилище аудитов
                  </span>
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                </div>
                <div className="mt-2 flex items-baseline gap-2">
                  <span className="text-sm sm:text-base font-bold text-slate-900">Защищенное облако</span>
                  <span className="text-xs text-emerald-600 font-semibold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
                    Изолировано
                  </span>
                </div>
              </div>
            </div>


            {/* Список аудитов */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
              <div className="p-5 border-b border-slate-100 flex items-center justify-between">
                <h2 className="text-base font-bold text-slate-900">Сохраненные выгрузки</h2>
                <span className="text-xs text-slate-500 font-mono">
                  Обновлено: {new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>

              {isLoading ? (
                <div className="p-12 text-center text-slate-400">
                  <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                  <span className="text-xs">Загрузка истории из базы...</span>
                </div>
              ) : history.length === 0 ? (
                <div className="p-12 text-center text-slate-500 space-y-3">
                  <FileSpreadsheet className="w-10 h-10 text-slate-300 mx-auto" />
                  <p className="text-sm font-medium">История проверок пока пуста</p>
                  <Link
                    href="/"
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-700"
                  >
                    <span>Загрузить первый отчет</span>
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {history.map((item) => (
                    <div
                      key={item.id}
                      className="p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 hover:bg-slate-50/70 transition-colors"
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 shrink-0">
                          <FileSpreadsheet className="w-5 h-5" />
                        </div>
                        <div>
                          <h3 className="font-bold text-slate-900 text-sm">{item.fileName}</h3>
                          <div className="flex items-center gap-3 text-xs text-slate-500 mt-1">
                            <span className="flex items-center gap-1">
                              <Clock className="w-3.5 h-3.5 text-slate-400" />
                              {new Date(item.createdAt).toLocaleDateString('ru-RU')}
                            </span>
                            <span>•</span>
                            <span className="font-semibold text-slate-700">
                              Расход: {item.totalSpendRub?.toLocaleString('ru-RU')} ₽
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end">
                        <div className="text-right">
                          <div className="text-xs text-slate-500 font-medium">Слив бюджета</div>
                          <div className="font-mono font-bold text-red-600 text-sm">
                            {item.totalLossRub?.toLocaleString('ru-RU')} ₽
                          </div>
                        </div>

                        <div className="text-right">
                          <div className="text-xs text-slate-500 font-medium">Здоровье</div>
                          <div
                            className={`font-mono font-bold text-sm ${
                              (item.overallScore || 0) < 60 ? 'text-amber-600' : 'text-emerald-600'
                            }`}
                          >
                            {item.overallScore || 0}/100
                          </div>
                        </div>

                        <button
                          onClick={() => handleOpenReport(item)}
                          disabled={loadingReportId === item.id}
                          className="px-3.5 py-1.5 rounded-lg border border-slate-200 hover:bg-white text-slate-700 text-xs font-semibold transition-colors shadow-2xs hover:border-blue-300"
                        >
                          {loadingReportId === item.id ? 'Загрузка...' : 'Открыть'}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </main>
    </div>
  );
}
