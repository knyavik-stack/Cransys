'use client';

import React, { useState } from 'react';
import { SearchQueryAiReport } from '@/lib/ai/search-query-analyst';
import { Search, Copy, Check, Filter, AlertOctagon, Flame, ArrowRight } from 'lucide-react';

interface SearchQueryVisualizerProps {
  analysis?: SearchQueryAiReport;
}

export function SearchQueryVisualizer({ analysis }: SearchQueryVisualizerProps) {
  const [copied, setCopied] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string>('ALL');

  if (!analysis) return null;

  const handleCopyMinusWords = () => {
    if (analysis.commanderReadyString) {
      navigator.clipboard.writeText(analysis.commanderReadyString);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const filteredClusters =
    activeCategory === 'ALL'
      ? analysis.clusters
      : analysis.clusters.filter((c) => c.category === activeCategory);

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-6 lg:p-8 shadow-xs space-y-6">
      {/* Заголовок блока */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-red-50 border border-red-100 text-red-700 text-xs font-semibold mb-2">
            <Filter className="w-3.5 h-3.5 shrink-0" />
            <span>AI-Анализ поисковых запросов</span>
          </div>
          <h3 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">
            Где сливаются деньги на нецелевых запросах?
          </h3>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Gemini выделил мусорные фразы, кластеризовал сливы и сформировал готовый список минус-слов
          </p>
        </div>

        {/* Кнопка копирования минус-слов */}
        <button
          type="button"
          id="copy-minus-words-btn"
          onClick={handleCopyMinusWords}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs sm:text-sm font-semibold shadow-xs transition-all shrink-0"
        >
          {copied ? (
            <>
              <Check className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Скопировано в буфер</span>
            </>
          ) : (
            <>
              <Copy className="w-4 h-4 shrink-0" />
              <span>Скопировать минус-слова ({analysis.allMinusWords.length})</span>
            </>
          )}
        </button>
      </div>

      {/* Метрики слива семантики */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        <div className="p-4 rounded-xl bg-red-50/70 border border-red-200/80">
          <span className="text-xs font-semibold text-red-700 uppercase tracking-wider block mb-1">
            Слито на мусорных фразах
          </span>
          <div className="text-2xl font-mono font-extrabold text-red-600">
            {analysis.junkSpendRub.toLocaleString('ru-RU')} ₽
          </div>
          <span className="text-[11px] text-red-500 font-medium mt-1 block">
            {analysis.junkSharePercent}% от проанализированного расхода
          </span>
        </div>

        <div className="p-4 rounded-xl bg-amber-50/70 border border-amber-200/80">
          <span className="text-xs font-semibold text-amber-800 uppercase tracking-wider block mb-1">
            Нецелевых запросов
          </span>
          <div className="text-2xl font-mono font-extrabold text-amber-700">
            {analysis.junkQueriesCount} шт.
          </div>
          <span className="text-[11px] text-amber-600 font-medium mt-1 block">
            из {analysis.totalAnalyzedQueries} проверенных запросов
          </span>
        </div>

        <div className="p-4 rounded-xl bg-blue-50/70 border border-blue-200/80">
          <span className="text-xs font-semibold text-blue-800 uppercase tracking-wider block mb-1">
            Готово к минусации
          </span>
          <div className="text-2xl font-mono font-extrabold text-blue-600">
            {analysis.allMinusWords.length} слов
          </div>
          <span className="text-[11px] text-blue-500 font-medium mt-1 block">
            для вставки в Директ Коммандер
          </span>
        </div>
      </div>

      {/* Резюме AI */}
      <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs sm:text-sm text-slate-700 leading-relaxed">
        <strong className="text-slate-900 font-semibold block mb-1">Вывод по качеству трафика:</strong>
        {analysis.summaryInsight}
      </div>

      {/* Кластеры мусорных запросов */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-bold text-slate-900">Кластеры нецелевого трафика</h4>
          <span className="text-xs text-slate-400">Нажмите на кластер для деталей</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredClusters.map((cluster, idx) => (
            <div
              key={idx}
              className="p-4 rounded-xl border border-slate-200 bg-white hover:border-slate-300 transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div>
                    <span className="text-[10px] font-bold tracking-wider uppercase px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                      {cluster.category}
                    </span>
                    <h5 className="font-bold text-slate-900 text-sm mt-1.5">{cluster.categoryTitleRu}</h5>
                  </div>
                  <span className="font-mono text-xs font-bold text-red-600 bg-red-50 px-2 py-1 rounded">
                    ~{cluster.wastedRub.toLocaleString('ru-RU')} ₽
                  </span>
                </div>

                {/* Примеры запросов */}
                <div className="mt-3">
                  <span className="text-[11px] font-medium text-slate-400 block mb-1.5">
                    Примеры сливающих запросов:
                  </span>
                  <div className="space-y-1">
                    {cluster.examples.map((ex, i) => (
                      <div
                        key={i}
                        className="text-xs font-mono text-slate-600 bg-slate-50 px-2.5 py-1 rounded border border-slate-100 truncate"
                      >
                        «{ex}»
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Предлагаемые минус-слова */}
              {cluster.suggestedMinusWords && cluster.suggestedMinusWords.length > 0 && (
                <div className="mt-4 pt-3 border-t border-slate-100">
                  <span className="text-[11px] font-semibold text-blue-700 block mb-1">
                    Минус-слова кластера:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {cluster.suggestedMinusWords.map((mw, mIdx) => (
                      <span
                        key={mIdx}
                        className="text-[11px] font-mono px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-100"
                      >
                        -{mw}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Быстрый бокс для копирования готовой строки */}
      <div className="p-4 rounded-xl bg-slate-900 text-white text-xs">
        <div className="flex items-center justify-between mb-2">
          <span className="text-slate-400 font-mono text-[11px] uppercase">
            Строка для Яндекс.Директ (быстрая минусация кампании):
          </span>
          <button
            type="button"
            onClick={handleCopyMinusWords}
            className="text-xs text-blue-400 hover:text-blue-300 font-medium underline flex items-center gap-1"
          >
            <Copy className="w-3 h-3" />
            <span>Копировать</span>
          </button>
        </div>
        <div className="font-mono text-slate-200 bg-slate-950 p-3 rounded-lg border border-slate-800 break-words leading-relaxed select-all">
          {analysis.commanderReadyString || analysis.allMinusWords.join(' ')}
        </div>
      </div>
    </div>
  );
}
