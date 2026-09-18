'use client';

import React, { useState } from 'react';
import { HelpCircle, ChevronDown, ShieldCheck, Zap, Lock, FileSpreadsheet, Bot } from 'lucide-react';

interface FaqItem {
  id: string;
  question: string;
  answer: string;
  icon: React.ReactNode;
}

const FAQ_DATA: FaqItem[] = [
  {
    id: 'faq-seo-promotion',
    question: 'Как аудит помогает в раскрутке сайта и SEO-продвижении?',
    answer:
      'Аудит Яндекс Директ выявляет реальные поисковые запросы целевой аудитории с наивысшей конверсией. Вы получаете готовое семантическое ядро и списки минус-слов, которые усиливают SEO продвижение сайта, снижают стоимость привлечения клиента и повышают позиции в органической выдаче Яндекса.',
    icon: <Bot className="w-4 h-4 text-purple-600" />,
  },
  {
    id: 'faq-152-fz',
    question: 'Безопасен ли независимый аудит по 152-ФЗ РФ?',
    answer:
      'Да, на 100%. При загрузке отчета из Директа или через API передаются исключительно обезличенные статистические агрегаты: название кампании, клики, показы, расход и конверсии. Персональные данные ваших клиентов (ФИО, телефоны, email) не запрашиваются и не хранятся на серверах Cransys.',
    icon: <ShieldCheck className="w-4 h-4 text-emerald-600" />,
  },
  {
    id: 'faq-speed',
    question: 'Сколько времени занимает проверка и оптимизация рекламы сайта?',
    answer:
      'Анализ выгрузки рекламы занимает от 30 секунд до 2 минут. Прямое сканирование через API Яндекс Директ выполняется в фоновом режиме за 1–2 минуты, после чего система формирует готовое ТЗ для директолога с точными рекомендациями по раскрутке сайта.',
    icon: <Zap className="w-4 h-4 text-blue-600" />,
  },
  {
    id: 'faq-diff-direct',
    question: 'Чем Cransys отличается от стандартных рекомендаций Яндекс Директа?',
    answer:
      'Рекламным системам выгодно увеличивать охват и расход бюджета, предлагая автотаргетинг и автоматические ставки. Независимый алгоритм Cransys работает строго в интересах владельца бизнеса: выявляет скрытые сливы в РСЯ (мусорные мобильные приложения, сайты-кликеры), нецелевые фразы на поиске и аномальные ставки на мобильных устройствах.',
    icon: <Bot className="w-4 h-4 text-blue-600" />,
  },
  {
    id: 'faq-api-access',
    question: 'Как работает подключение по API Яндекс Директ?',
    answer:
      'Подключение происходит через официальный защищенный протокол Яндекс OAuth. Мы запрашиваем минимальные права доступа («Только чтение статистики кампаний»), что гарантирует полную сохранность ваших настроек и баланса.',
    icon: <Lock className="w-4 h-4 text-blue-600" />,
  },
  {
    id: 'faq-excel-format',
    question: 'Какие форматы отчетов поддерживает сервис?',
    answer:
      'Вы можете загрузить стандартный Мастер отчетов Яндекс Директ в формате .XLSX, .XLS или .CSV с детализацией по условиям показа, поисковым запросам или площадкам РСЯ. Сервис автоматически распознает столбцы и структуру данных.',
    icon: <FileSpreadsheet className="w-4 h-4 text-emerald-600" />,
  },
];

export function FaqSection() {
  const [openItems, setOpenItems] = useState<Record<string, boolean>>({
    'faq-152-fz': true, // первый открыт по умолчанию
  });

  const toggleItem = (id: string) => {
    setOpenItems((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  return (
    <section id="faq-section" className="py-12 bg-white border-t border-slate-200 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 border border-blue-100 text-blue-700 text-xs font-semibold mb-2">
            <HelpCircle className="w-3.5 h-3.5 text-blue-600" />
            <span>База знаний и частые вопросы</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            Часто задаваемые вопросы о Cransys Direct
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Всё, что нужно знать о безопасности данных, алгоритмах проверки и форматах отчетов
          </p>
        </div>

        <div className="space-y-3">
          {FAQ_DATA.map((item) => {
            const isOpen = !!openItems[item.id];
            return (
              <div
                key={item.id}
                className={`rounded-2xl border transition-all ${
                  isOpen
                    ? 'border-blue-200 bg-blue-50/20 shadow-xs'
                    : 'border-slate-200 bg-white hover:border-slate-300'
                }`}
              >
                <button
                  type="button"
                  onClick={() => toggleItem(item.id)}
                  className="w-full p-4 sm:p-5 flex items-center justify-between gap-3 text-left cursor-pointer"
                  aria-expanded={isOpen}
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-slate-100 shrink-0">
                      {item.icon}
                    </div>
                    <span className="text-sm sm:text-base font-bold text-slate-900">
                      {item.question}
                    </span>
                  </div>
                  <ChevronDown
                    className={`w-5 h-5 text-slate-400 shrink-0 transition-transform duration-200 ${
                      isOpen ? 'rotate-180 text-blue-600' : ''
                    }`}
                  />
                </button>

                {isOpen && (
                  <div className="px-4 sm:px-5 pb-5 pt-1 text-xs sm:text-sm text-slate-600 leading-relaxed border-t border-slate-100">
                    {item.answer}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
