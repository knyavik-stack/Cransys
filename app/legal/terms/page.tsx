'use client';

import React from 'react';
import Link from 'next/link';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { FileText, ArrowLeft, CheckCircle2 } from 'lucide-react';

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
      <Header />

      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <div className="mb-6">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-700 bg-blue-50 px-3 py-1.5 rounded-lg border border-blue-100 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Вернуться на главную</span>
          </Link>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 sm:p-10 space-y-6">
          <div className="border-b border-slate-200 pb-5">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 border border-blue-100 text-blue-700 text-xs font-semibold mb-3">
              <FileText className="w-3.5 h-3.5 text-blue-600" />
              <span>Публичная оферта</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
              Пользовательское соглашение
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Условия использования сервиса независимого аудита рекламы Cransys Direct Analytics
            </p>
          </div>

          <div className="prose prose-slate max-w-none text-xs sm:text-sm leading-relaxed text-slate-700 space-y-4">
            <h2 className="text-base font-bold text-slate-900">1. Предмет соглашения</h2>
            <p>
              1.1. Сервис Cransys предоставляет Пользователю программное обеспечение для автоматизированного анализа эффективности рекламных кампаний в Яндекс.Директ, выявления сливов бюджета, формирования рекомендаций по минус-фразам и генерации коммерческих PDF-отчетов.
            </p>
            <p>
              1.2. Безусловным принятием (акцептом) условий настоящего Соглашения считается регистрация на сайте или загрузка рекламной выгрузки для проведения аудита.
            </p>

            <h2 className="text-base font-bold text-slate-900 pt-2">2. Тарифные планы и порядок оплаты</h2>
            <p>
              2.1. Доступ к базовому ДЕМО-аудиту предоставляется бесплатно с демонстрацией ключевых зон сливов бюджета.
            </p>
            <p>
              2.2. Полные детальные отчеты, экспорт White-label PDF, доступ к AI-аналитике Gemini и прямое подключение по API Яндекс.Директ предоставляются на условиях платных тарифов («Экспресс», «Экспресс Пакет», «PRO», «MAX», «Corporate»).
            </p>
            <p>
              2.3. Оплата производится банковскими картами через сертифицированный платежный шлюз ЮKassa.
            </p>

            <h2 className="text-base font-bold text-slate-900 pt-2">3. Независимый статус и ограничение ответственности</h2>
            <p>
              3.1. Cransys является независимым аналитическим инструментом и не является аффилированным лицом ООО «ЯНДЕКС».
            </p>
            <p>
              3.2. Алгоритмические выводы сервиса формируются на основе математических моделей и эвристик эффективности рекламы. Окончательные решения об изменении настроек в рекламном кабинете принимает Пользователь.
            </p>

            <h2 className="text-base font-bold text-slate-900 pt-2">4. Контактная информация</h2>
            <p>
              Официальный адрес для обращений Пользователей: <strong className="text-blue-700 font-mono">cransys@yandex.ru</strong>.
            </p>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
