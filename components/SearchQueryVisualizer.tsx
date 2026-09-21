'use client';

import React, { useState } from 'react';
import { SearchQueryAiReport } from '@/lib/ai/search-query-analyst';
import {
  Search,
  Copy,
  Check,
  Filter,
  Flame,
  ChevronDown,
  ChevronUp,
  Tag,
} from 'lucide-react';

interface SearchQueryVisualizerProps {
  analysis?: SearchQueryAiReport;
}

export function SearchQueryVisualizer({ analysis }: SearchQueryVisualizerProps) {
  const [copied, setCopied] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string>('ALL');
  const [searchFilter, setSearchFilter] = useState<string>('');
  const [expandedCluster, setExpandedCluster] = useState<string | null>(null);

  if (!analysis) return null;

  const handleCopyMinusWords = () => {
    if (analysis.commanderReadyString) {
      navigator.clipboard.writeText(analysis.commanderReadyString);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const categories = [
    { id: 'ALL', label: 'Все кластеры' },
    { id: 'INFORMATION_DIY', label: 'Информационка и DIY' },
    { id: 'WRONG_GEO', label: 'Чужая геолокация' },
    { id: 'FREE_CHEAP', label: '«Бесплатно / даром»' },
    { id: 'JOB_STUDY', label: 'Вакансии и учеба' },
    { id: 'COMPETITOR_IRRELEVANT', label: 'Нецелевые бренды' },
    { id: 'OTHER_JUNK', label: 'Прочий мусор' },
  ];

  const filteredClusters = analysis.clusters.filter((c) => {
    const matchesCategory = activeCategory === 'ALL' || c.category === activeCategory;
    const matchesSearch =
      searchFilter.trim() === '' ||
      c.categoryTitleRu.toLowerCase().includes(searchFilter.toLowerCase()) ||
      c.examples.some((ex) => ex.toLowerCase().includes(searchFilter.toLowerCase())) ||
      c.suggestedMinusWords.some((w) => w.toLowerCase().includes(searchFilter.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-7 shadow-xs space-y-6 print:border-slate-300 print:break-inside-avoid">
      {/* Шапка блока */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-slate-100">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-50 border border-red-100 text-red-700 text-xs font-bold mb-2">
            <Filter className="w-3.5 h-3.5 shrink-0" />
            <span>AI-Семантический анализ поисковых запросов</span>
          </div>
          <h3 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">
            Где именно сливаются деньги на нецелевых фразах?
          </h3>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-2xl leading-relaxed">
            Нейросеть сгруппировала мусорные поисковые фразы, рассчитала точный ущерб и сгенерировала готовый список минус-слов для Директ Коммандера.
          </p>
        </div>

        {/* Кнопка быстрого копирования для Коммандера */}
        <button
          type="button"
          id="copy-minus-words-btn"
          onClick={handleCopyMinusWords}
          className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs sm:text-sm font-semibold shadow-xs transition-all shrink-0 print:hidden"
        >
          {copied ? (
            <>
              <Check className="w-4 h-4 text-emerald-400 shrink-0" />
              <span className="font-bold">Минус-слова скопированы!</span>
            </>
          ) : (
            <>
              <Copy className="w-4 h-4 shrink-0 text-blue-400" />
              <span>Скопировать для Коммандера ({analysis.allMinusWords.length})</span>
            </>
          )}
        </button>
      </div>

      {/* Метрики слива семантики */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
        <div className="p-4 rounded-xl bg-red-50/80 border border-red-200">
          <span className="text-xs font-semibold text-red-700 uppercase tracking-wider block mb-1">
            Слито на мусорных фразах
          </span>
          <div className="text-2xl font-mono font-extrabold text-red-600">
            {analysis.junkSpendRub.toLocaleString('ru-RU')} ₽
          </div>
          <span className="text-[11px] text-red-600 font-medium mt-1 block">
            {analysis.junkSharePercent}% от проанализированного бюджета
          </span>
        </div>

        <div className="p-4 rounded-xl bg-amber-50/80 border border-amber-200">
          <span className="text-xs font-semibold text-amber-800 uppercase tracking-wider block mb-1">
            Нецелевых запросов
          </span>
          <div className="text-2xl font-mono font-extrabold text-amber-800">
            {analysis.junkQueriesCount} шт.
          </div>
          <span className="text-[11px] text-amber-700 font-medium mt-1 block">
            из {analysis.totalAnalyzedQueries} проверенных поисковых фраз
          </span>
        </div>

        <div className="p-4 rounded-xl bg-blue-50/80 border border-blue-200">
          <span className="text-xs font-semibold text-blue-800 uppercase tracking-wider block mb-1">
            Готово к минусации
          </span>
          <div className="text-2xl font-mono font-extrabold text-blue-600">
            {analysis.allMinusWords.length} слов
          </div>
          <span className="text-[11px] text-blue-700 font-medium mt-1 block">
            Формат: с префиксами для Яндекс.Директ
          </span>
        </div>
      </div>

      {/* Фильтры и поиск по кластерам */}
      <div className="space-y-3 print:hidden">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full">
            {categories.map((cat) => {
              const count =
                cat.id === 'ALL'
                  ? analysis.clusters.length
                  : analysis.clusters.filter((c) => c.category === cat.id).length;
              if (count === 0 && cat.id !== 'ALL') return null;

              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setActiveCategory(cat.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
                    activeCategory === cat.id
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900'
                  }`}
                >
                  {cat.label} ({count})
                </button>
              );
            })}
          </div>

          <div className="relative shrink-0 w-full sm:w-64">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Поиск по фразам и словам..."
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Раскрывающиеся списки кластеров мусора */}
      <div className="space-y-3">
        <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
          Выявленные кластеры нецелевого трафика ({filteredClusters.length}):
        </h4>

        {filteredClusters.length === 0 ? (
          <div className="p-6 text-center text-xs text-slate-500 bg-slate-50 rounded-xl border border-slate-200">
            Кластеры по заданному фильтру не найдены.
          </div>
        ) : (
          filteredClusters.map((cluster) => {
            const isExpanded = expandedCluster === cluster.categoryTitleRu;

            return (
              <div
                key={cluster.categoryTitleRu}
                className="rounded-xl border border-slate-200 bg-slate-50/60 overflow-hidden transition-all hover:border-slate-300"
              >
                <div
                  onClick={() => setExpandedCluster(isExpanded ? null : cluster.categoryTitleRu)}
                  className="p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 cursor-pointer select-none bg-white hover:bg-slate-50/80 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-red-100 text-red-600 flex items-center justify-center shrink-0">
                      <Flame className="w-4 h-4" />
                    </div>
                    <div>
                      <h5 className="text-sm font-bold text-slate-900">{cluster.categoryTitleRu}</h5>
                      <p className="text-xs text-slate-500">
                        {cluster.queriesCount} запросов • {cluster.suggestedMinusWords.length} рекомендуемых минус-слов
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
                    <div className="text-right">
                      <span className="font-mono text-xs font-bold text-red-600 block">
                        -{cluster.wastedRub.toLocaleString('ru-RU')} ₽
                      </span>
                      <span className="text-[10px] text-slate-400">
                        потери на кластере
                      </span>
                    </div>

                    <div className="text-slate-400 p-1">
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </div>
                  </div>
                </div>

                {/* Раскрытый контент */}
                {isExpanded && (
                  <div className="p-4 border-t border-slate-200/70 bg-slate-50 space-y-3 animate-fadeIn">
                    <div>
                      <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider block mb-1.5">
                        Примеры мусорных поисковых запросов пользователей:
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {cluster.examples.map((ex, i) => (
                          <span
                            key={i}
                            className="px-2.5 py-1 rounded-md bg-white border border-slate-200 text-xs text-slate-700 font-mono"
                          >
                            «{ex}»
                          </span>
                        ))}
                      </div>
                    </div>

                    <div>
                      <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider block mb-1.5">
                        Рекомендуемые минус-слова к добавлению:
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {cluster.suggestedMinusWords.map((word, i) => (
                          <span
                            key={i}
                            className="px-2 py-0.5 rounded-md bg-red-100 text-red-700 text-xs font-mono font-semibold border border-red-200"
                          >
                            -{word}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Командная строка для экспорта */}
      <div className="p-4 rounded-xl bg-slate-900 text-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="space-y-0.5">
          <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
            <Tag className="w-3.5 h-3.5 text-blue-400" />
            <span>Готовая строка минус-слов:</span>
          </span>
          <p className="text-[11px] text-slate-400 font-mono truncate max-w-xl">
            {analysis.commanderReadyString || 'Список подготовлен к экспорту'}
          </p>
        </div>

        <button
          type="button"
          onClick={handleCopyMinusWords}
          className="px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-xs font-bold text-white transition-all shrink-0"
        >
          {copied ? 'Скопировано!' : 'Копировать строку'}
        </button>
      </div>
    </div>
  );
}
