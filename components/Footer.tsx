import React from 'react';
import Link from 'next/link';
import { Shield, Lock, CheckCircle2 } from 'lucide-react';

export function Footer() {
  return (
    <footer className="w-full bg-white text-slate-600 mt-12 py-10 text-xs border-t border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-8 mb-8">
          {/* Бренд и описание */}
          <div className="lg:col-span-2 space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold text-sm shadow-xs">
                C
              </div>
              <span className="font-bold text-base text-slate-900 tracking-tight">Cransys</span>
              <span className="text-[10px] font-semibold bg-blue-50 text-blue-700 border border-blue-100 px-1.5 py-0.5 rounded">
                Direct Engine 2026
              </span>
            </div>
            <p className="text-slate-500 text-xs leading-relaxed max-w-sm">
              Независимый автоматизированный аудит рекламы в Яндекс.Директ. Поиск скрытых сливов бюджета в сетях РСЯ, нецелевого поискового трафика и мобильных аномалий.
            </p>
            <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-500 pt-1">
              <span className="inline-flex items-center gap-1">
                <Shield className="w-3.5 h-3.5 text-emerald-600" />
                152-ФЗ РФ
              </span>
              <span className="inline-flex items-center gap-1">
                <Lock className="w-3.5 h-3.5 text-blue-600" />
                Zero-Retention Data
              </span>
              <span className="inline-flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                TLS 1.3 Encryption
              </span>
            </div>
          </div>

          {/* Быстрые ссылки */}
          <div>
            <h4 className="font-bold text-slate-900 mb-3 text-xs tracking-wider uppercase">Навигация</h4>
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
                  Вход в аккаунт
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

          {/* Тарифная линейка */}
          <div>
            <h4 className="font-bold text-slate-900 mb-3 text-xs tracking-wider uppercase">Тарифные планы</h4>
            <ul className="space-y-1.5 text-xs text-slate-500">
              <li className="flex items-center justify-between">
                <span>Экспресс (разовый)</span>
                <span className="text-slate-800 font-semibold font-mono">399 ₽</span>
              </li>
              <li className="flex items-center justify-between">
                <span>Экспресс-пакет (3 шт)</span>
                <span className="text-slate-800 font-semibold font-mono">990 ₽</span>
              </li>
              <li className="flex items-center justify-between text-blue-700 font-semibold">
                <span>PRO (API + AI)</span>
                <span className="font-mono">2 990 ₽/мес</span>
              </li>
              <li className="flex items-center justify-between">
                <span>MAX White-label</span>
                <span className="text-slate-800 font-semibold font-mono">6 990 ₽/мес</span>
              </li>
            </ul>
          </div>

          {/* Безопасность и регламент */}
          <div>
            <h4 className="font-bold text-slate-900 mb-3 text-xs tracking-wider uppercase">Конфиденциальность</h4>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              Отчеты статистики Яндекс.Директ не содержат персональных данных ваших клиентов или коммерческой тайны. Обработка ведется на защищенных серверах по стандартам РФ.
            </p>
          </div>
        </div>

        <div className="pt-6 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-slate-500">
          <p>© 2026 Cransys Analytics. Все права защищены.</p>
          <div className="flex items-center gap-4">
            <span className="hover:text-slate-800 cursor-pointer">Политика конфиденциальности</span>
            <span className="hover:text-slate-800 cursor-pointer">Пользовательское соглашение</span>
            <span className="hover:text-slate-800 cursor-pointer">152-ФЗ Согласие</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
