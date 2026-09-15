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
  Crown,
  Building2,
  Settings,
  CreditCard,
  KeyRound,
  Lock,
  CheckCircle2,
  AlertTriangle,
  Zap,
} from 'lucide-react';
import { AuditReportData } from '@/lib/audit/types';
import { AuditResults } from '@/components/AuditResults';
import { useUser } from '@/lib/auth/user-context';
import { PricingModal } from '@/components/PricingModal';
import { WhiteLabelSettingsModal } from '@/components/WhiteLabelSettingsModal';
import { UserTier, TIER_CONFIGS, getTierConfig } from '@/lib/billing/tiers';

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

  // Модальные окна
  const [isPricingModalOpen, setIsPricingModalOpen] = useState(false);
  const [isWhiteLabelModalOpen, setIsWhiteLabelModalOpen] = useState(false);

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
                <Link
                  href="/sign-in"
                  className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 transition-colors flex items-center gap-1.5"
                >
                  <LogIn className="w-3.5 h-3.5" />
                  <span>Войти в аккаунт</span>
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
            {/* Шапка дашборда */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-xs">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">Реестр проверок Яндекс.Директ</h1>
                  <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-100">
                    {getTierConfig(user?.tier).name}
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-slate-500">
                  Сохраненные отчеты, динамика индекса здоровья и остаток лимита проверок
                </p>
              </div>

              {/* Управление тарифом и брендингом */}
              {user && (
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsWhiteLabelModalOpen(true)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-colors flex items-center gap-1.5 ${
                      user.tier === 'MAX' || user.tier === 'CORP'
                        ? 'bg-purple-50 hover:bg-purple-100 text-purple-700 border-purple-200'
                        : 'bg-slate-50 hover:bg-slate-100 text-slate-500 border-slate-200'
                    }`}
                  >
                    <Building2 className="w-3.5 h-3.5 text-purple-600" />
                    <span>White-label {user.tier === 'MAX' || user.tier === 'CORP' ? 'активен' : '(от MAX)'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsPricingModalOpen(true)}
                    className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition-colors flex items-center gap-1.5"
                  >
                    <CreditCard className="w-3.5 h-3.5" />
                    <span>Сменить тариф</span>
                  </button>
                </div>
              )}
            </div>

            {/* Тестовый переключатель всех 5 тарифов (для быстрой проверки) */}
            {user && (
              <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <Crown className="w-4 h-4 text-amber-600 shrink-0" />
                  <div>
                    <span className="text-xs font-bold text-amber-900 block">
                      Режим тестирования тарифов (Sandbox):
                    </span>
                    <span className="text-[11px] text-amber-700">
                      Переключайте уровни для мгновенной проверки ограничений UI и API
                    </span>
                  </div>
                </div>

                <div className="flex flex-wrap gap-1.5">
                  {(
                    [
                      { id: 'EXPRESS_SINGLE' as UserTier, label: 'Экспресс (1)', limit: '1 шт' },
                      { id: 'EXPRESS_PACK' as UserTier, label: 'Пакет (3)', limit: '3 шт' },
                      { id: 'PRO' as UserTier, label: 'PRO (10 + API)', limit: '10 шт' },
                      { id: 'MAX' as UserTier, label: 'MAX (30 + WL)', limit: '30 шт' },
                      { id: 'CORP' as UserTier, label: 'Corp (500)', limit: '500 шт' },
                    ] as const
                  ).map((t) => {
                    const isActive = user.tier === t.id;
                    return (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => setTier(t.id)}
                        className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all ${
                          isActive
                            ? 'bg-amber-800 text-white shadow-xs'
                            : 'bg-white text-slate-700 hover:bg-amber-100 border border-amber-200'
                        }`}
                      >
                        {t.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Direct API Card: Баннер статуса и Upsell */}
            <div
              className={`p-5 rounded-2xl border transition-all ${
                getTierConfig(user?.tier).hasDirectApi
                  ? 'bg-gradient-to-r from-emerald-50/80 to-blue-50/80 border-emerald-200'
                  : 'bg-gradient-to-r from-slate-50 to-blue-50/40 border-blue-200'
              }`}
            >
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="flex items-start gap-3.5">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                      getTierConfig(user?.tier).hasDirectApi
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'bg-slate-200 text-slate-500'
                    }`}
                  >
                    <KeyRound className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-bold text-slate-900">
                        Интеграция с API Яндекс.Директ (OAuth)
                      </h3>
                      {getTierConfig(user?.tier).hasDirectApi ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          Включено в ваш тариф ({user?.tier})
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-200 text-slate-700">
                          <Lock className="w-3 h-3 text-slate-500" />
                          Доступно от тарифа PRO
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-600 mt-1 max-w-2xl leading-relaxed">
                      {getTierConfig(user?.tier).hasDirectApi
                        ? 'Автоматическое бесшовное сканирование рекламных кампаний клиента в 1 клик через официальный Яндекс API без ручной выгрузки Excel/CSV.'
                        : 'Прямое подключение к аккаунту Яндекс.Директа по OAuth доступно на тарифах PRO (10 отчетов/мес), MAX (30 отчетов) и Corporate. Избавьтесь от ручной рутины скачивания файлов.'}
                    </p>
                  </div>
                </div>

                <div className="shrink-0 self-stretch sm:self-auto flex sm:block">
                  {getTierConfig(user?.tier).hasDirectApi ? (
                    <button
                      type="button"
                      onClick={() => alert('API Яндекс.Директа готово к авторизации. Шаг 8 подключения OAuth активен!')}
                      className="w-full sm:w-auto px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs transition-colors flex items-center justify-center gap-1.5"
                    >
                      <Zap className="w-3.5 h-3.5" />
                      <span>Подключить кабинет Директа</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setIsPricingModalOpen(true)}
                      className="w-full sm:w-auto px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition-colors flex items-center justify-center gap-1.5"
                    >
                      <CreditCard className="w-3.5 h-3.5" />
                      <span>Перейти на PRO за 2 990 ₽</span>
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Сводные карточки и расход лимитов */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Лимит отчетов */}
              <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200 shadow-xs">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Лимит отчетов
                  </span>
                  <span className="text-[11px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md">
                    {user ? `${user.reportsUsed} / ${user.reportsLimit}` : '0 / 1'}
                  </span>
                </div>
                <div className="mt-3">
                  <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                    <div
                      className={`h-2 rounded-full transition-all ${
                        user && user.reportsUsed >= user.reportsLimit ? 'bg-red-500' : 'bg-blue-600'
                      }`}
                      style={{
                        width: `${Math.min(100, ((user?.reportsUsed || 0) / (user?.reportsLimit || 1)) * 100)}%`,
                      }}
                    />
                  </div>
                  <div className="flex justify-between items-center text-[11px] text-slate-500 mt-2">
                    <span>
                      Осталось: <strong className="text-slate-900">{Math.max(0, (user?.reportsLimit || 1) - (user?.reportsUsed || 0))}</strong> отчетов
                    </span>
                    <button
                      onClick={() => setIsPricingModalOpen(true)}
                      className="text-blue-600 hover:text-blue-700 font-semibold"
                    >
                      Пополнить
                    </button>
                  </div>
                </div>
              </div>

              <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200 shadow-xs">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Всего проверок
                </span>
                <div className="mt-2 flex items-baseline gap-2">
                  <span className="text-2xl sm:text-3xl font-extrabold font-mono text-slate-900">
                    {history.length}
                  </span>
                  <span className="text-xs text-slate-500">выгрузок в базе</span>
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
                  <span className="text-sm sm:text-base font-bold text-slate-900">152-ФЗ Облако</span>
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

      {/* Модальное окно выбора тарифов и оплаты */}
      <PricingModal
        isOpen={isPricingModalOpen}
        onClose={() => setIsPricingModalOpen(false)}
      />

      {/* Модальное окно настройки брендинга White-label */}
      <WhiteLabelSettingsModal
        isOpen={isWhiteLabelModalOpen}
        onClose={() => setIsWhiteLabelModalOpen(false)}
      />
    </div>
  );
}
