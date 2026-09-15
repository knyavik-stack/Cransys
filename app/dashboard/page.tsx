'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  FileSpreadsheet,
  PlusCircle,
  Flame,
  ShieldCheck,
  TrendingDown,
  Clock,
  ArrowUpRight,
  Sparkles,
} from 'lucide-react';

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
  const [history, setHistory] = useState<AuditHistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadHistory() {
      try {
        const res = await fetch('/api/audit/history');
        const data = await res.json();
        if (data.reports && data.reports.length > 0) {
          setHistory(data.reports);
        } else {
          // Если БД еще пустая, показываем эталонную историю
          setHistory([
            {
              id: 'demo-1',
              fileName: 'mebliron_feb_jul_2026.xlsx',
              createdAt: new Date().toISOString(),
              status: 'COMPLETED',
              tier: 'EXPRESS',
              totalSpendRub: 15050,
              totalLossRub: 14880,
              overallScore: 55,
            },
          ]);
        }
      } catch {
        setHistory([]);
      } finally {
        setIsLoading(false);
      }
    }

    loadHistory();
  }, []);

  const totalLossPrevented = history.reduce((sum, item) => sum + (item.totalLossRub || 0), 0);

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Верхняя навигация */}
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold text-sm">
              C
            </div>
            <span className="font-extrabold text-slate-900 tracking-tight text-lg">Cransys</span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 font-semibold border border-blue-100">
              Кабинет
            </span>
          </Link>

          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs transition-colors shadow-xs"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Новый аудит</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Основной контент */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 mb-1">История аудитов Яндекс.Директ</h1>
          <p className="text-sm text-slate-500">
            Сохраненные отчеты, динамика индекса здоровья кабинетов и зафиксированные сливы
          </p>
        </div>

        {/* Сводные карточки */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Всего проверок
            </span>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-3xl font-extrabold font-mono text-slate-900">
                {history.length}
              </span>
              <span className="text-xs text-slate-500">файлов</span>
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-red-600 uppercase tracking-wider">
                Обнаружено сливов
              </span>
              <Flame className="w-4 h-4 text-red-500" />
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-3xl font-extrabold font-mono text-red-600">
                {totalLossPrevented.toLocaleString('ru-RU')} ₽
              </span>
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-emerald-700 uppercase tracking-wider">
                Безопасность данных
              </span>
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-base font-bold text-slate-900">Neon PostgreSQL</span>
              <span className="text-xs text-emerald-600 font-semibold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
                Защищено
              </span>
            </div>
          </div>
        </div>

        {/* Список аудитов */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900">Выполненные аудиты</h2>
            <span className="text-xs text-slate-500 font-mono">
              Обновлено: {new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>

          {isLoading ? (
            <div className="p-12 text-center text-slate-400">
              <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
              <span className="text-xs">Загрузка истории...</span>
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

                    <Link
                      href="/"
                      className="px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-white text-slate-700 text-xs font-semibold transition-colors"
                    >
                      Открыть
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
