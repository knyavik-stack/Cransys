'use client';

import React from 'react';
import Link from 'next/link';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Shield, ArrowLeft, Cookie, CheckCircle2, Lock, Settings, Info } from 'lucide-react';

export default function CookiesPolicyPage() {
  const handleOpenCookieSettings = () => {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('open-cookie-settings'));
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
      <Header />

      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <div className="mb-6 flex items-center justify-between">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-700 bg-blue-50 px-3 py-1.5 rounded-lg border border-blue-100 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Вернуться на главную</span>
          </Link>

          <button
            onClick={handleOpenCookieSettings}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-700 hover:text-blue-600 bg-white hover:bg-slate-100 px-3.5 py-1.5 rounded-lg border border-slate-200 shadow-2xs transition-all cursor-pointer"
          >
            <Settings className="w-3.5 h-3.5 text-blue-600" />
            <span>Настроить файлы cookie</span>
          </button>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 sm:p-10 space-y-6">
          <div className="border-b border-slate-200 pb-5">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 border border-blue-100 text-blue-700 text-xs font-semibold mb-3">
              <Cookie className="w-3.5 h-3.5 text-blue-600" />
              <span>152-ФЗ РФ & Требования Роскомнадзора</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
              Политика использования файлов cookie
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Действующая редакция от 17 сентября 2026 года для сервиса Cransys Analytics
            </p>
          </div>

          <div className="prose prose-slate max-w-none text-xs sm:text-sm leading-relaxed text-slate-700 space-y-4">
            <div className="p-4 rounded-xl bg-blue-50/70 border border-blue-100 flex items-start gap-3 text-slate-700">
              <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
              <div className="text-xs leading-relaxed">
                Сервис <strong>Cransys Analytics</strong> уважает право пользователей на конфиденциальность и обрабатывает данные в строгом соответствии с Федеральным законом РФ № 152-ФЗ «О персональных данных». Вы можете в любой момент изменить или отозвать согласие на использование необязательных cookie.
              </div>
            </div>

            <h2 className="text-base font-bold text-slate-900">1. Что такое файлы cookie?</h2>
            <p>
              Файлы cookie (куки) — это небольшие текстовые фрагменты данных, сохраняемые браузером на вашем устройстве (компьютере, смартфоне или планшете) при посещении веб-сайта. Cookie позволяют платформе запоминать ваши предпочтения (язык, сессию входа, параметры аудита) и обеспечивать корректную, быструю и безопасную работу сервиса.
            </p>

            <h2 className="text-base font-bold text-slate-900 pt-2">2. Категории файлов cookie, используемых в Cransys</h2>
            <p>
              Мы классифицируем используемые файлы cookie на три строго разграниченные категории:
            </p>

            {/* Карточка 1: Обязательные */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-blue-600" />
                  <span>2.1. Строго необходимые (технические и сессионные)</span>
                </span>
                <span className="text-[10px] font-bold bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">
                  Всегда активны
                </span>
              </div>
              <p className="text-xs text-slate-600">
                Критически важны для функционирования платформы. Обеспечивают безопасную авторизацию, проверку CSRF-токенов, сохранение статуса тарифного плана и фиксацию самого факта вашего согласия на использование cookie. Не содержат персональной идентифицирующей информации третьих лиц.
              </p>
            </div>

            {/* Карточка 2: Аналитические */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>2.2. Аналитические и статистические cookie</span>
                </span>
                <span className="text-[10px] font-semibold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">
                  По выбору пользователя
                </span>
              </div>
              <p className="text-xs text-slate-600">
                Позволяют собирать обезличенную информацию о том, как пользователи взаимодействуют с функционалом аудита (счетчики <strong>Яндекс.Метрики</strong> и Google Analytics, карта кликов, вебвизор). Данные собираются в агрегированном виде без привязки к ФИО или паспортным данным и служат исключительно для оптимизации интерфейса и скорости обработки отчетов.
              </p>
            </div>

            {/* Карточка 3: Маркетинговые */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                  <Shield className="w-3.5 h-3.5 text-amber-600" />
                  <span>2.3. Маркетинговые и рекламные cookie</span>
                </span>
                <span className="text-[10px] font-semibold bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full">
                  По выбору пользователя
                </span>
              </div>
              <p className="text-xs text-slate-600">
                Используются для оценки эффективности рекламных каналов и показа релевантной информации о тарифах сервиса (например, пиксели VK Реклама, myTarget). Загружаются только в случае явного согласия пользователя.
              </p>
            </div>

            <h2 className="text-base font-bold text-slate-900 pt-2">3. Сроки хранения и безопасность</h2>
            <p>
              3.1. Сессионные cookie удаляются автоматически при закрытии вкладки или завершении рабочей сессии.
            </p>
            <p>
              3.2. Постоянные cookie хранятся на устройстве пользователя в течение установленного срока (по умолчанию 365 дней) либо до момента их ручной очистки в браузере.
            </p>
            <p>
              3.3. В соответствии с принципом <strong>Zero Data Retention</strong>, выгружаемые пользователями файлы кампаний Яндекс.Директ (CSV/XLSX) обрабатываются на лету и никогда не записываются в cookies.
            </p>

            <h2 className="text-base font-bold text-slate-900 pt-2">4. Как управлять файлами cookie?</h2>
            <p>
              Вы можете в любой момент изменить параметры согласия прямо на нашем сайте, нажав на кнопку управления:
            </p>

            <div className="pt-1 pb-2">
              <button
                type="button"
                onClick={handleOpenCookieSettings}
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-600/20 transition-all flex items-center gap-2 cursor-pointer"
              >
                <Settings className="w-4 h-4" />
                <span>Открыть панель настройки файлов cookie</span>
              </button>
            </div>

            <p>
              Также вы можете заблокировать или очистить cookies в настройках вашего веб-браузера:
            </p>
            <ul className="list-disc list-inside space-y-1.5 pl-2 text-slate-600">
              <li><strong>Яндекс.Браузер:</strong> Настройки → Сайты → Расширенные настройки сайтов → Cookie-файлы.</li>
              <li><strong>Google Chrome:</strong> Настройки → Конфиденциальность и безопасность → Сторонние файлы cookie.</li>
              <li><strong>Safari (iOS / macOS):</strong> Настройки → Safari → Конфиденциальность → Блокировать все cookie.</li>
              <li><strong>Mozilla Firefox:</strong> Настройки → Приватность и защита → Куки и данные сайтов.</li>
            </ul>

            <h2 className="text-base font-bold text-slate-900 pt-2">5. Контакты службы защиты данных</h2>
            <p>
              По вопросам соблюдения законодательства о персональных данных и работе файлов cookie вы можете направить обращение по адресу: <strong className="text-blue-700 font-mono">cransys@yandex.ru</strong>.
            </p>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
