'use client';

import React from 'react';
import Link from 'next/link';
import { Shield, Lock, CheckCircle2, Mail, FileText, Scale } from 'lucide-react';
import { Logo } from '@/components/Logo';

export function Footer() {
  return (
    <footer className="w-full bg-white text-slate-600 border-t border-slate-200/80 py-10 text-xs">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-12 mb-8">
          {/* Колонка 1: Бренд и миссия */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Logo size={28} className="shrink-0" />
              <span className="font-bold text-base text-slate-900 tracking-tight">Cransys</span>
              <span className="text-[10px] font-semibold bg-blue-50 text-blue-700 border border-blue-100 px-1.5 py-0.5 rounded">
                Direct 2026
              </span>
            </div>
            <p className="text-slate-500 text-xs leading-relaxed max-w-sm">
              Независимый автоматизированный аудит рекламных кампаний в Яндекс.Директ. Поиск скрытых сливов бюджета в РСЯ, нецелевых поисковых запросов и мобильных аномалий.
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

          {/* Колонка 2: Навигация */}
          <div className="md:pl-6">
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

          {/* Колонка 3: Правовой блок и контакты */}
          <div>
            <h4 className="font-bold text-slate-900 mb-3 text-xs tracking-wider uppercase">
              Правовая информация
            </h4>
            <ul className="space-y-2 text-xs mb-4">
              <li>
                <Link
                  href="/legal/privacy"
                  className="hover:text-blue-600 transition-colors flex items-center gap-1.5 text-slate-600"
                >
                  <Shield className="w-3.5 h-3.5 text-slate-400" />
                  <span>Политика конфиденциальности</span>
                </Link>
              </li>
              <li>
                <Link
                  href="/legal/terms"
                  className="hover:text-blue-600 transition-colors flex items-center gap-1.5 text-slate-600"
                >
                  <FileText className="w-3.5 h-3.5 text-slate-400" />
                  <span>Пользовательское соглашение</span>
                </Link>
              </li>
              <li>
                <Link
                  href="/legal/consent"
                  className="hover:text-blue-600 transition-colors flex items-center gap-1.5 text-slate-600"
                >
                  <Scale className="w-3.5 h-3.5 text-slate-400" />
                  <span>Согласие на обработку данных (152-ФЗ)</span>
                </Link>
              </li>
            </ul>

            <div className="pt-3 border-t border-slate-100">
              <span className="text-[11px] text-slate-400 block mb-1">Служба поддержки:</span>
              <a
                href="mailto:cransys@yandex.ru"
                className="text-slate-700 font-semibold hover:text-blue-600 transition-colors inline-flex items-center gap-1.5 font-mono text-xs"
              >
                <Mail className="w-3.5 h-3.5 text-blue-600" />
                <span>cransys@yandex.ru</span>
              </a>
            </div>
          </div>
        </div>

        {/* Нижняя строчка копирайта */}
        <div className="pt-6 border-t border-slate-200/80 flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] text-slate-400">
          <p>© 2026 Cransys Analytics. Все права защищены.</p>
          <p>Независимый аудит Яндекс.Директ в строгом соответствии с 152-ФЗ РФ.</p>
        </div>
      </div>
    </footer>
  );
}
