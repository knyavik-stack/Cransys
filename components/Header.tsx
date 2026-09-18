'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  ShieldCheck,
  Activity,
  History,
  LogIn,
  LogOut,
  Sparkles,
  CreditCard,
  Shield,
  Menu,
  X,
  User,
  ChevronRight,
} from 'lucide-react';
import { useUser } from '@/lib/auth/user-context';
import { PricingModal } from '@/components/PricingModal';
import { getTierConfig } from '@/lib/billing/tiers';
import { Logo } from '@/components/Logo';

export function Header() {
  const { user, logout } = useUser();
  const [isPricingOpen, setIsPricingOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const tierConfig = getTierConfig(user?.tier);
  const isAdmin = user?.role === 'ADMIN';

  const closeMobileMenu = () => setIsMobileMenuOpen(false);

  return (
    <>
      <header className="w-full bg-white/95 backdrop-blur-sm border-b border-slate-200 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-14 sm:h-16 flex items-center justify-between gap-2">
          {/* Бренд и Логотип */}
          <Link
            href="/"
            onClick={closeMobileMenu}
            className="flex items-center gap-1.5 sm:gap-2.5 shrink-0 min-w-0"
          >
            <Logo size={32} className="shrink-0 sm:w-9 sm:h-9" />
            <div className="flex items-center gap-1 sm:gap-2">
              <span className="font-extrabold text-base sm:text-xl text-[#003882] tracking-[0.14em] uppercase">
                CRANSYS
              </span>
              <span className="text-[9px] sm:text-[11px] font-bold uppercase px-1.5 sm:px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-100">
                DIRECT
              </span>
            </div>
          </Link>

          {/* Десктопные элементы навигации */}
          <div className="hidden md:flex items-center gap-2 lg:gap-3">
            <div className="hidden lg:flex items-center gap-2 text-xs text-slate-500 bg-slate-50 px-2.5 py-1 rounded-md border border-slate-200">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>152-ФЗ: Обезличенные данные</span>
            </div>

            <button
              type="button"
              id="header-pricing-button"
              onClick={() => setIsPricingOpen(true)}
              className="inline-flex items-center gap-1 text-xs font-semibold text-slate-700 hover:text-blue-600 px-2.5 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors cursor-pointer"
              title="Официальная тарифная сетка Cransys"
            >
              <CreditCard className="w-3.5 h-3.5 text-blue-600" />
              <span>Тарифы</span>
            </button>

            {isAdmin ? (
              <Link
                id="header-admin-link"
                href="/admin"
                className="inline-flex items-center gap-1 text-xs font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg border border-blue-200 transition-colors"
              >
                <Shield className="w-3.5 h-3.5 text-blue-600" />
                <span>Панель Admin</span>
              </Link>
            ) : (
              <Link
                id="header-history-link"
                href="/dashboard"
                className="inline-flex items-center gap-1 text-xs font-semibold text-slate-700 hover:text-slate-900 px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors"
              >
                <History className="w-3.5 h-3.5 text-slate-500" />
                <span>Кабинет</span>
              </Link>
            )}

            {user ? (
              <div className="flex items-center gap-1.5">
                <div
                  onClick={() => {
                    if (!isAdmin) setIsPricingOpen(true);
                  }}
                  className="cursor-pointer flex items-center gap-1.5 px-2 py-1 rounded-lg bg-slate-100 border border-slate-200 text-xs hover:border-blue-300 transition-colors"
                  title={`Тариф: ${tierConfig.name}. Использовано ${user.reportsUsed} из ${user.reportsLimit} отчетов.`}
                >
                  <div className="w-4 h-4 rounded-full bg-blue-600 text-white flex items-center justify-center text-[9px] font-bold">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                  <span className="font-medium text-slate-800 max-w-[90px] truncate">
                    {user.name}
                  </span>
                  <span className="text-[10px] font-bold text-blue-700 bg-blue-50 px-1 py-0.5 rounded border border-blue-100">
                    {tierConfig.badge}
                  </span>
                </div>
                <button
                  onClick={logout}
                  title="Выйти из аккаунта"
                  className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-1.5">
                <Link
                  id="header-signin-link"
                  href="/sign-in"
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-700 hover:text-slate-900 px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors"
                >
                  <LogIn className="w-3.5 h-3.5 text-slate-500" />
                  <span>Вход</span>
                </Link>
              </div>
            )}

            <Link
              id="header-cta-button"
              href="/#audit-section"
              className="inline-flex items-center gap-1 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 px-3 py-1.5 rounded-lg shadow-xs transition-all shrink-0 cursor-pointer"
            >
              <Activity className="w-3.5 h-3.5" />
              <span>Аудит</span>
            </Link>
          </div>

          {/* Мобильная панель быстрых действий (< 768px) */}
          <div className="flex md:hidden items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={() => setIsPricingOpen(true)}
              className="px-2 py-1.5 rounded-lg border border-slate-200 bg-slate-50 text-slate-700 text-xs font-semibold flex items-center gap-1"
            >
              <CreditCard className="w-3.5 h-3.5 text-blue-600" />
              <span>Тарифы</span>
            </button>

            <Link
              href="/#audit-section"
              className="px-2.5 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-bold flex items-center gap-1 shadow-xs"
            >
              <Activity className="w-3.5 h-3.5" />
              <span>Аудит</span>
            </Link>

            <button
              type="button"
              id="mobile-menu-toggle-btn"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 transition-colors"
              aria-label={isMobileMenuOpen ? 'Закрыть меню' : 'Открыть меню'}
            >
              {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Раскрывающееся мобильное меню */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-slate-200 bg-white px-4 py-4 space-y-3 shadow-lg animate-fadeIn">
            {/* Статус пользователя */}
            {user ? (
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-900">{user.name}</div>
                    <div className="text-[10px] text-slate-500">{user.email}</div>
                  </div>
                </div>
                <span className="text-[10px] font-bold text-blue-700 bg-blue-100 px-2 py-0.5 rounded-md">
                  {tierConfig.badge}
                </span>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                <Link
                  href="/sign-in"
                  onClick={closeMobileMenu}
                  className="py-2.5 px-3 rounded-xl border border-slate-200 text-slate-800 text-xs font-bold text-center flex items-center justify-center gap-1.5 hover:bg-slate-50"
                >
                  <LogIn className="w-3.5 h-3.5 text-slate-500" />
                  <span>Войти</span>
                </Link>
                <Link
                  href="/sign-up"
                  onClick={closeMobileMenu}
                  className="py-2.5 px-3 rounded-xl bg-blue-600 text-white text-xs font-bold text-center flex items-center justify-center gap-1.5 hover:bg-blue-700 shadow-xs"
                >
                  <User className="w-3.5 h-3.5" />
                  <span>Регистрация</span>
                </Link>
              </div>
            )}

            {/* Навигационные ссылки */}
            <div className="space-y-1 pt-1">
              <button
                type="button"
                onClick={() => {
                  closeMobileMenu();
                  setIsPricingOpen(true);
                }}
                className="w-full p-2.5 rounded-xl hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center justify-between transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-2.5">
                  <CreditCard className="w-4 h-4 text-blue-600" />
                  <span>Официальные тарифы и цены</span>
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
              </button>

              {isAdmin ? (
                <Link
                  href="/admin"
                  onClick={closeMobileMenu}
                  className="p-2.5 rounded-xl bg-blue-50/80 text-blue-700 text-xs font-bold flex items-center justify-between"
                >
                  <div className="flex items-center gap-2.5">
                    <Shield className="w-4 h-4 text-blue-600" />
                    <span>Панель управления (Admin)</span>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 text-blue-600" />
                </Link>
              ) : (
                <Link
                  href="/dashboard"
                  onClick={closeMobileMenu}
                  className="p-2.5 rounded-xl hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center justify-between transition-colors"
                >
                  <div className="flex items-center gap-2.5">
                    <History className="w-4 h-4 text-slate-600" />
                    <span>Личный кабинет и история проверок</span>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                </Link>
              )}

              {user && (
                <button
                  type="button"
                  onClick={() => {
                    closeMobileMenu();
                    logout();
                  }}
                  className="w-full p-2.5 rounded-xl hover:bg-red-50 text-red-600 text-xs font-semibold flex items-center justify-between transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-2.5">
                    <LogOut className="w-4 h-4 text-red-500" />
                    <span>Выйти из аккаунта</span>
                  </div>
                </button>
              )}
            </div>

            {/* Безопасность 152-ФЗ плашка */}
            <div className="pt-2 border-t border-slate-100 flex items-center gap-2 text-[11px] text-slate-500">
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>152-ФЗ: Данные Директа полностью обезличены</span>
            </div>
          </div>
        )}
      </header>

      <PricingModal
        isOpen={isPricingOpen}
        onClose={() => setIsPricingOpen(false)}
      />
    </>
  );
}

