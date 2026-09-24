'use client';

import React, { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
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
  Shield,
  ShieldAlert,
  Sliders,
} from 'lucide-react';
import { AuditReportData } from '@/lib/audit/types';
import { AuditResults } from '@/components/AuditResults';
import { useUser } from '@/lib/auth/user-context';
import { PricingModal } from '@/components/PricingModal';
import { WhiteLabelSettingsModal } from '@/components/WhiteLabelSettingsModal';
import { AuditComparisonModal } from '@/components/AuditComparisonModal';
import { RsyaBlacklistModal } from '@/components/RsyaBlacklistModal';
import { Footer } from '@/components/Footer';
import { Header } from '@/components/Header';
import { DirectConnectCard } from '@/components/DirectConnectCard';
import { UserTier } from '@/lib/billing/tiers';
import { useTiers } from '@/lib/billing/use-tiers';
import { Logo } from '@/components/Logo';

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
  const router = useRouter();
  const { user, isLoading: isAuthLoading, isTester, isAdmin, setTier, logout } = useUser();
  const { getTier } = useTiers();
  const [history, setHistory] = useState<AuditHistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Редирект неавторизованных пользователей на страницу входа
  useEffect(() => {
    if (!isAuthLoading && !user) {
      router.replace('/sign-in?redirect=/dashboard');
    }
  }, [user, isAuthLoading, router]);

  // Модальные окна
  const [isPricingModalOpen, setIsPricingModalOpen] = useState(false);
  const [isWhiteLabelModalOpen, setIsWhiteLabelModalOpen] = useState(false);
  const [isComparisonModalOpen, setIsComparisonModalOpen] = useState(false);
  const [isBlacklistModalOpen, setIsBlacklistModalOpen] = useState(false);

  // Для просмотра конкретного аудита из истории
  const [selectedReport, setSelectedReport] = useState<AuditReportData | null>(null);
  const [selectedFileName, setSelectedFileName] = useState<string>('');
  const [loadingReportId, setLoadingReportId] = useState<string | null>(null);

  const isTesterAccount = isTester || user?.role === 'TESTER_ADMIN' || user?.email === 'test-owner@cransys-audit.ru';

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

  const totalLossPrevented = history.reduce((sum, item) => sum + (item.totalLossRub || 0), 0);

  const dynamicsData = useMemo(() => {
    if (history.length < 2) return [];
    return [...history]
      .reverse()
      .map((item, idx) => ({
        index: idx + 1,
        date: new Date(item.createdAt).toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit' }),
        score: item.overallScore || 0,
        lossRub: item.totalLossRub || 0,
        fileName: item.fileName,
      }));
  }, [history]);

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

  // Если администратор зашел в личный кабинет пользователя
  if (user?.role === 'ADMIN') {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4 text-white">
        <div className="max-w-md w-full bg-slate-800 border border-slate-700 rounded-2xl p-8 shadow-2xl text-center">
          <div className="w-14 h-14 rounded-2xl bg-blue-600/20 border border-blue-500/40 text-blue-400 flex items-center justify-center mx-auto mb-4">
            <Shield className="w-7 h-7" />
          </div>
          <h1 className="text-xl font-bold mb-2">Вы авторизованы как Администратор</h1>
          <p className="text-xs text-slate-400 mb-6 leading-relaxed">
            Главному администратору не требуется клиентский личный кабинет. Все функции управления платформой, пользователями и тарифами находятся в Центре Управления.
          </p>
          <div className="space-y-3">
            <Link
              href="/admin"
              className="block w-full py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm transition-colors shadow-lg shadow-blue-600/30"
            >
              Перейти в Панель администратора
            </Link>
            <button
              onClick={logout}
              className="block w-full py-2 px-4 rounded-xl border border-slate-700 hover:bg-slate-700 text-slate-400 text-xs font-semibold transition-colors"
            >
              Выйти из аккаунта
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (isAuthLoading || !user) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col">
        <Header />
        <div className="flex-1 flex flex-col items-center justify-center p-6">
          <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mb-4" />
          <p className="text-sm font-semibold text-slate-700">Проверка авторизации...</p>
          <p className="text-xs text-slate-400 mt-1">Перенаправление на страницу входа...</p>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Верхняя навигация */}
      <Header />

      {/* Основной контент */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-6 pb-24 md:pb-8 space-y-6">
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
                    {getTier(user?.tier).name}
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-slate-500">
                  Сохраненные отчеты, динамика индекса здоровья и остаток лимита проверок ({user?.reportsUsed || 0} из {user?.reportsLimit || 1})
                </p>
              </div>

              {/* Управление тарифом и брендингом */}
              {user && (
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsComparisonModalOpen(true)}
                    className="px-3 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 text-xs font-semibold transition-colors flex items-center gap-1.5"
                  >
                    <Sliders className="w-3.5 h-3.5 text-blue-600" />
                    <span>Сравнить «До / После»</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsBlacklistModalOpen(true)}
                    className="px-3 py-1.5 rounded-xl bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 text-xs font-semibold transition-colors flex items-center gap-1.5"
                  >
                    <ShieldAlert className="w-3.5 h-3.5 text-red-600" />
                    <span>AI-Блеклист РСЯ</span>
                  </button>

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
                    <span>{user.hasPaid ? 'Сменить тариф' : 'Оформить тариф'}</span>
                  </button>
                </div>
              )}
            </div>

            {/* Тестовый переключатель всех 5 тарифов (ТОЛЬКО для тестового суперюзера) */}
            {isTesterAccount && (
              <div className="p-4 rounded-2xl bg-amber-500/10 border-2 border-amber-300 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <Crown className="w-5 h-5 text-amber-600 shrink-0" />
                  <div>
                    <span className="text-xs font-bold text-amber-900 block">
                      Режим тестирования тарифов (Суперюзер / 0 ₽ Sandbox):
                    </span>
                    <span className="text-[11px] text-amber-700">
                      Переключайте уровни для мгновенной проверки UI, лимитов и API без оплаты
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
                    const isActive = user?.tier === t.id;
                    return (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => setTier(t.id, true)}
                        className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all ${
                          isActive
                            ? 'bg-amber-800 text-white shadow-xs'
                            : 'bg-white text-slate-700 hover:bg-amber-100 border border-amber-300'
                        }`}
                      >
                        {t.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Интерактивная карточка подключения к Яндекс.Директ */}
            <DirectConnectCard
              onAuditComplete={(report, fileName) => {
                setSelectedReport(report);
                setSelectedFileName(fileName);
              }}
              onOpenPricing={() => setIsPricingModalOpen(true)}
            />

            {/* Карточки метрик */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
                <div className="flex items-center justify-between text-slate-500 mb-2">
                  <span className="text-xs font-medium uppercase tracking-wider">Всего проверок</span>
                  <FileSpreadsheet className="w-4 h-4 text-blue-600" />
                </div>
                <div className="text-2xl font-extrabold text-slate-900 font-mono">
                  {history.length > 0 ? history.length : user?.reportsUsed || 0}
                </div>
                <div className="text-xs text-slate-400 mt-1">
                  Лимит тарифа: {user?.reportsLimit || 1} шт.
                </div>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
                <div className="flex items-center justify-between text-slate-500 mb-2">
                  <span className="text-xs font-medium uppercase tracking-wider">Обнаружено потерь</span>
                  <Flame className="w-4 h-4 text-red-500" />
                </div>
                <div className="text-2xl font-extrabold text-red-600 font-mono">
                  {totalLossPrevented.toLocaleString('ru-RU')} ₽
                </div>
                <div className="text-xs text-slate-400 mt-1">По всем загруженным отчетам</div>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
                <div className="flex items-center justify-between text-slate-500 mb-2">
                  <span className="text-xs font-medium uppercase tracking-wider">Остаток проверок</span>
                  <Sparkles className="w-4 h-4 text-emerald-600" />
                </div>
                <div className="text-2xl font-extrabold text-emerald-600 font-mono">
                  {Math.max(0, (user?.reportsLimit || 1) - (user?.reportsUsed || 0))} шт.
                </div>
                <div className="text-xs text-slate-400 mt-1">
                  Использовано {user?.reportsUsed || 0} из {user?.reportsLimit || 1} шт.
                </div>
              </div>
            </div>

            {/* График динамики Индекса Здоровья (если есть от 2 проверок) */}
            {dynamicsData.length >= 2 && (
              <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                      <Sparkles className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-sm sm:text-base font-bold text-slate-900">
                        Динамика качества кампаний (Health Score)
                      </h4>
                      <p className="text-xs text-slate-500">
                        Изменение показателей по мере внедрения оптимизаций директолога
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setIsComparisonModalOpen(true)}
                    className="self-start sm:self-auto text-xs font-bold text-blue-600 hover:text-blue-700 bg-blue-50 px-3 py-1.5 rounded-xl border border-blue-100 transition-colors flex items-center gap-1"
                  >
                    <Sliders className="w-3.5 h-3.5" />
                    <span>Сравнить срезы «До / После»</span>
                  </button>
                </div>

                <div className="h-48 sm:h-56 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={dynamicsData} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
                      <defs>
                        <linearGradient id="scoreGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10B981" stopOpacity={0.4} />
                          <stop offset="95%" stopColor="#10B981" stopOpacity={0.0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                      <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                      <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
                      <Tooltip
                        formatter={(val: any) => [`${val}/100`, 'Индекс здоровья']}
                        contentStyle={{ backgroundColor: '#fff', borderRadius: '12px', border: '1px solid #E2E8F0', fontSize: '12px' }}
                      />
                      <Area
                        type="monotone"
                        dataKey="score"
                        stroke="#10B981"
                        strokeWidth={3}
                        fillOpacity={1}
                        fill="url(#scoreGradient)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            {/* Таблица истории проверок */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
              <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-slate-900">История аудитов</h3>
                  <p className="text-xs text-slate-400">Нажмите на отчет, чтобы открыть детализацию</p>
                </div>
                <span className="text-xs text-slate-500">{history.length} записей</span>
              </div>

              {isLoading ? (
                <div className="py-12 text-center text-slate-400 text-xs flex flex-col items-center justify-center gap-2">
                  <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                  <span>Загрузка истории аудитов...</span>
                </div>
              ) : history.length === 0 ? (
                <div className="py-12 text-center text-slate-400 text-xs space-y-3">
                  <FileSpreadsheet className="w-8 h-8 mx-auto text-slate-300" />
                  <p>В вашем аккаунте пока нет сохраненных проверок.</p>
                  <Link
                    href="/"
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-blue-600 text-white font-semibold text-xs hover:bg-blue-700 transition-colors shadow-xs"
                  >
                    Запустить первую проверку
                  </Link>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-slate-600">
                    <thead className="bg-slate-50 text-slate-700 uppercase font-semibold border-b border-slate-200/80">
                      <tr>
                        <th className="py-3 px-4">Файл кампании</th>
                        <th className="py-3 px-4">Дата проверки</th>
                        <th className="py-3 px-4">Индекс здоровья</th>
                        <th className="py-3 px-4">Слив бюджета</th>
                        <th className="py-3 px-4 text-right">Действие</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {history.map((item) => (
                        <tr
                          key={item.id}
                          onClick={() => handleOpenReport(item)}
                          className="hover:bg-slate-50/80 cursor-pointer transition-colors"
                        >
                          <td className="py-3.5 px-4 font-semibold text-slate-900">
                            <div className="flex items-center gap-2">
                              <FileSpreadsheet className="w-4 h-4 text-blue-600 shrink-0" />
                              <span className="max-w-[200px] sm:max-w-xs truncate">{item.fileName}</span>
                            </div>
                          </td>
                          <td className="py-3.5 px-4 text-slate-500 font-mono">
                            {new Date(item.createdAt).toLocaleDateString('ru-RU', {
                              day: '2-digit',
                              month: '2-digit',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </td>
                          <td className="py-3.5 px-4 font-mono font-bold">
                            {item.overallScore !== null ? (
                              <span
                                className={`px-2 py-0.5 rounded text-[11px] ${
                                  item.overallScore < 50
                                    ? 'bg-red-50 text-red-700'
                                    : item.overallScore < 80
                                    ? 'bg-amber-50 text-amber-700'
                                    : 'bg-emerald-50 text-emerald-700'
                                }`}
                              >
                                {item.overallScore}/100
                              </span>
                            ) : (
                              '—'
                            )}
                          </td>
                          <td className="py-3.5 px-4 font-mono font-bold text-red-600">
                            {item.totalLossRub !== null ? `${item.totalLossRub.toLocaleString('ru-RU')} ₽` : '—'}
                          </td>
                          <td className="py-3.5 px-4 text-right">
                            <button
                              disabled={loadingReportId === item.id}
                              className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-700 font-semibold"
                            >
                              {loadingReportId === item.id ? (
                                <div className="w-3.5 h-3.5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                              ) : (
                                <>
                                  <span>Открыть</span>
                                  <ArrowUpRight className="w-3.5 h-3.5" />
                                </>
                              )}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
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

      {/* Модальное окно сравнения аудитов До и После */}
      <AuditComparisonModal
        isOpen={isComparisonModalOpen}
        onClose={() => setIsComparisonModalOpen(false)}
        history={history}
      />

      {/* Модальное окно AI-блеклиста РСЯ */}
      <RsyaBlacklistModal
        isOpen={isBlacklistModalOpen}
        onClose={() => setIsBlacklistModalOpen(false)}
      />

      <Footer />
    </div>
  );
}
