'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Shield, Lock, CheckCircle2, Mail, ExternalLink, HelpCircle, FileText, Scale } from 'lucide-react';
import { LegalModal, LegalDocType } from '@/components/LegalModal';

export function Footer() {
  const [legalDoc, setLegalDoc] = useState<LegalDocType | null>(null);

  return (
    <>
      <footer className="w-full bg-white text-slate-600 mt-16 py-12 text-xs border-t border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12 mb-10">
            {/* Колонка 1: Бренд и миссия */}
            <div className="space-y-3 sm:col-span-2 lg:col-span-1">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold text-sm shadow-xs">
                  C
                </div>
                <span className="font-bold text-base text-slate-900 tracking-tight">Cransys</span>
                <span className="text-[10px] font-semibold bg-blue-50 text-blue-700 border border-blue-100 px-1.5 py-0.5 rounded">
                  Direct 2026
                </span>
              </div>
              <p className="text-slate-500 text-xs leading-relaxed">
                Независимый автоматизированный аудит рекламы в Яндекс.Директ. Поиск скрытых сливов бюджета в РСЯ, нецелевых поисковых запросов и мобильных аномалий.
              </p>
              <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-500 pt-1">
                <span className="inline-flex items-center gap-1">
                  <Shield className="w-3.5 h-3.5 text-emerald-600" />
                  152-ФЗ РФ
                </span>
                <span className="inline-flex items-center gap-1">
                  <Lock className="w-3.5 h-3.5 text-blue-600" />
                  TLS 1.3 Encryption
                </span>
                <span className="inline-flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  Zero Retention
                </span>
              </div>
            </div>

            {/* Колонка 2: Модули аудита */}
            <div>
              <h4 className="font-bold text-slate-900 mb-3 text-xs tracking-wider uppercase">
                Возможности
              </h4>
              <ul className="space-y-2 text-xs">
                <li>
                  <Link href="/#audit-section" className="hover:text-blue-600 transition-colors">
                    Проверка 6 зон сливов
                  </Link>
                </li>
                <li>
                  <Link href="/#audit-section" className="hover:text-blue-600 transition-colors">
                    Поисковые фразы и минус-слова
                  </Link>
                </li>
                <li>
                  <Link href="/#audit-section" className="hover:text-blue-600 transition-colors">
                    AI-блеклист площадок РСЯ
                  </Link>
                </li>
                <li>
                  <Link href="/#audit-section" className="hover:text-blue-600 transition-colors">
                    White-label PDF-отчеты
                  </Link>
                </li>
                <li>
                  <Link href="/#audit-section" className="hover:text-blue-600 transition-colors">
                    Прямой API Яндекс.Директ v5
                  </Link>
                </li>
              </ul>
            </div>

            {/* Колонка 3: Сервис и навигация */}
            <div>
              <h4 className="font-bold text-slate-900 mb-3 text-xs tracking-wider uppercase">
                Навигация
              </h4>
              <ul className="space-y-2 text-xs">
                <li>
                  <Link href="/" className="hover:text-blue-600 transition-colors">
                    Главная и ДЕМО-аудит
                  </Link>
                </li>
                <li>
                  <Link href="/dashboard" className="hover:text-blue-600 transition-colors">
                    Личный кабинет
                  </Link>
                </li>
                <li>
                  <Link href="/sign-in" className="hover:text-blue-600 transition-colors">
                    Вход в систему
                  </Link>
                </li>
                <li>
                  <Link href="/sign-up" className="hover:text-blue-600 transition-colors">
                    Регистрация
                  </Link>
                </li>
                <li>
                  <Link href="/admin" className="text-slate-400 hover:text-slate-700 transition-colors">
                    Панель администратора
                  </Link>
                </li>
              </ul>
            </div>

            {/* Колонка 4: Правовая информация и поддержка */}
            <div>
              <h4 className="font-bold text-slate-900 mb-3 text-xs tracking-wider uppercase">
                Правовой блок и связь
              </h4>
              <ul className="space-y-2 text-xs mb-3">
                <li>
                  <button
                    type="button"
                    onClick={() => setLegalDoc('privacy')}
                    className="hover:text-blue-600 transition-colors text-left flex items-center gap-1"
                  >
                    <Shield className="w-3 h-3 text-slate-400" />
                    <span>Политика конфиденциальности</span>
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => setLegalDoc('terms')}
                    className="hover:text-blue-600 transition-colors text-left flex items-center gap-1"
                  >
                    <FileText className="w-3 h-3 text-slate-400" />
                    <span>Пользовательское соглашение</span>
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => setLegalDoc('consent')}
                    className="hover:text-blue-600 transition-colors text-left flex items-center gap-1"
                  >
                    <Lock className="w-3 h-3 text-slate-400" />
                    <span>152-ФЗ Согласие</span>
                  </button>
                </li>
              </ul>

              <div className="pt-2 border-t border-slate-100">
                <span className="text-[11px] text-slate-400 block mb-1">Служба поддержки:</span>
                <a
                  href="mailto:cransys@yandex.ru"
                  className="text-slate-700 font-semibold hover:text-blue-600 transition-colors flex items-center gap-1 font-mono text-[11px]"
                >
                  <Mail className="w-3 h-3 text-blue-600" />
                  <span>cransys@yandex.ru</span>
                </a>
              </div>
            </div>
          </div>

          {/* Нижняя строчка копирайта и ссылок */}
          <div className="pt-6 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-slate-500">
            <p>© 2026 Cransys Analytics. Все права защищены. Обработка данных по 152-ФЗ РФ.</p>
            <div className="flex flex-wrap items-center gap-4">
              <Link href="/legal/privacy" className="hover:text-slate-800 transition-colors">
                Политика конфиденциальности
              </Link>
              <Link href="/legal/terms" className="hover:text-slate-800 transition-colors">
                Пользовательское соглашение
              </Link>
              <Link href="/legal/consent" className="hover:text-slate-800 transition-colors">
                152-ФЗ Согласие
              </Link>
            </div>
          </div>
        </div>
      </footer>

      {/* Модальное окно документов */}
      <LegalModal
        isOpen={Boolean(legalDoc)}
        onClose={() => setLegalDoc(null)}
        initialDoc={legalDoc || 'privacy'}
      />
    </>
  );
}
