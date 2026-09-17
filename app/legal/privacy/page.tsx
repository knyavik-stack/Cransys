'use client';

import React from 'react';
import Link from 'next/link';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Shield, ArrowLeft, Lock, CheckCircle2 } from 'lucide-react';

export default function PrivacyPage() {
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
              <Shield className="w-3.5 h-3.5 text-blue-600" />
              <span>152-ФЗ РФ «О персональных данных»</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
              Политика конфиденциальности и обработки данных
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Действующая редакция от 16 сентября 2026 года для сервиса Cransys Analytics
            </p>
          </div>

          <div className="prose prose-slate max-w-none text-xs sm:text-sm leading-relaxed text-slate-700 space-y-4">
            <h2 className="text-base font-bold text-slate-900">1. Общие положения</h2>
            <p>
              1.1. Настоящая Политика конфиденциальности определяет порядок обработки и защиты персональной информации пользователей сервиса Cransys (далее — «Оператор»), зарегистрированных на сайте и использующих функционал автоматизированного аудита рекламных кампаний Яндекс.Директ.
            </p>
            <p>
              1.2. Оператор ставит важнейшей целью и условием осуществления своей деятельности соблюдение прав и свобод человека и гражданина при обработке его персональных данных, в том числе защиты прав на неприкосновенность частной жизни, личную и семейную тайну в соответствии с Федеральным законом РФ № 152-ФЗ «О персональных данных».
            </p>

            <h2 className="text-base font-bold text-slate-900 pt-2">2. Состав обрабатываемых данных</h2>
            <p>
              Оператор обрабатывает минимально необходимый объем данных для обеспечения функционирования сервиса:
            </p>
            <ul className="list-disc list-inside space-y-1.5 pl-2 text-slate-600">
              <li><strong>Адрес электронной почты (E-mail):</strong> используется для идентификации, авторизации и отправки одноразовых кодов верификации;</li>
              <li><strong>Имя пользователя / Название агентства:</strong> используется для персонализации дашборда и генерации White-label PDF-отчетов;</li>
              <li><strong>Обезличенные отчеты статистики Яндекс.Директ (CSV/XLSX/API):</strong> агрегированные данные о кликах, расходах, показах, ключевых фразах и площадках РСЯ.</li>
            </ul>

            <h2 className="text-base font-bold text-slate-900 pt-2">3. Принцип Zero-Retention и безопасность</h2>
            <p>
              3.1. Загружаемые файлы статистики Яндекс.Директ не содержат персональных данных конечных клиентов или покупателей Пользователя.
            </p>
            <p>
              3.2. Передача данных осуществляется исключительно по зашифрованным протоколам TLS 1.3 с использованием алгоритмов шифрования AES-256.
            </p>
            <p>
              3.3. Серверные мощности и базы данных размещены в соответствии с требованиями законодательства РФ.
            </p>

            <h2 className="text-base font-bold text-slate-900 pt-2">4. Права субъекта данных</h2>
            <p>
              Пользователь имеет право запросить информацию о своих персональных данных, их уточнение, блокирование или уничтожение, направив запрос на электронный адрес службы поддержки: <strong className="text-blue-700 font-mono">cransys@yandex.ru</strong>.
            </p>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
