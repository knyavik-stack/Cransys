'use client';

import React from 'react';
import Link from 'next/link';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Lock, ArrowLeft, CheckCircle2 } from 'lucide-react';

export default function ConsentPage() {
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
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-100 text-emerald-700 text-xs font-semibold mb-3">
              <Lock className="w-3.5 h-3.5 text-emerald-600" />
              <span>Федеральный закон РФ № 152-ФЗ</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
              Согласие на обработку персональных данных
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Действует для всех пользователей онлайн-платформы Cransys Direct Analytics
            </p>
          </div>

          <div className="prose prose-slate max-w-none text-xs sm:text-sm leading-relaxed text-slate-700 space-y-4">
            <p>
              Настоящим в соответствии с Федеральным законом № 152-ФЗ «О персональных данных» от 27.07.2006 года свободно, своей волей и в своем интересе выражаю безусловное согласие на обработку моих персональных данных сервисом <strong>Cransys Direct Analytics</strong>.
            </p>

            <div className="space-y-3 pt-2">
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                <h3 className="font-bold text-slate-900 text-sm mb-1 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>1. Перечень персональных данных</span>
                </h3>
                <p className="text-xs text-slate-600">
                  Фамилия, имя, адрес электронной почты (e-mail), номер телефона (при указании), технические данные (IP-адрес, cookie-файлы, тип устройства и браузера), обезличенная маркетинговая статистика рекламных кампаний.
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                <h3 className="font-bold text-slate-900 text-sm mb-1 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>2. Цели обработки</span>
                </h3>
                <p className="text-xs text-slate-600">
                  Регистрация и авторизация на платформе, отправка одноразовых кодов безопасности, формирование аудиторских отчетов и рекомендаций, исполнение договоров по тарифам, направление сервисных и технико-аналитических уведомлений.
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                <h3 className="font-bold text-slate-900 text-sm mb-1 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>3. Перечень действий с персональными данными</span>
                </h3>
                <p className="text-xs text-slate-600">
                  Сбор, запись, систематизация, накопление, хранение, уточнение (обновление, изменение), извлечение, использование, передача (без права распространения), обезличивание, блокирование, удаление, уничтожение с использованием средств автоматизации.
                </p>
              </div>
            </div>

            <p className="pt-2 text-slate-600">
              Согласие действует бессрочно с момента предоставления данных при регистрации или заполнении форм на сайте и может быть отозвано в любой момент путем направления письменного уведомления на адрес электронной почты: <strong className="text-blue-700 font-mono">cransys@yandex.ru</strong>.
            </p>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
