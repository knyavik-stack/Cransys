'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ShieldCheck, Activity, History, LogIn, LogOut, Sparkles, CreditCard, Shield } from 'lucide-react';
import { useUser } from '@/lib/auth/user-context';
import { PricingModal } from '@/components/PricingModal';
import { getTierConfig } from '@/lib/billing/tiers';

export function Header() {
  const { user, logout } = useUser();
  const [isPricingOpen, setIsPricingOpen] = useState(false);
  const tierConfig = getTierConfig(user?.tier);
  const isAdmin = user?.role === 'ADMIN';

  return (
    <>
      <header className="w-full bg-white/95 backdrop-blur-sm border-b border-slate-200 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-14 sm:h-16 flex items-center justify-between gap-2">
          <Link href="/" className="flex items-center gap-2 sm:gap-2.5 shrink-0">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold text-base sm:text-lg shadow-xs shadow-blue-500/20">
              C
            </div>
            <div>
              <div className="flex items-center gap-1.5 sm:gap-2">
                <span className="font-bold text-lg sm:text-xl text-slate-900 tracking-tight">Cransys</span>
                <span className="text-[10px] sm:text-[11px] font-semibold uppercase px-1.5 sm:px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-100">
                  Direct
                </span>
              </div>
            </div>
          </Link>

          <div className="flex items-center gap-1.5 sm:gap-3">
            <div className="hidden lg:flex items-center gap-2 text-xs text-slate-500 bg-slate-50 px-2.5 py-1 rounded-md border border-slate-200">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>152-ФЗ: Обезличенные данные</span>
            </div>

            <div className="flex items-center gap-1.5 sm:gap-2">
              <button
                type="button"
                id="header-pricing-button"
                onClick={() => setIsPricingOpen(true)}
                className="inline-flex items-center gap-1 text-xs font-semibold text-slate-700 hover:text-blue-600 px-2 sm:px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors"
                title="Официальная тарифная сетка Cransys"
              >
                <CreditCard className="w-3.5 h-3.5 text-blue-600" />
                <span>Тарифы</span>
              </button>

              {isAdmin ? (
                <Link
                  id="header-admin-link"
                  href="/admin"
                  className="inline-flex items-center gap-1 text-xs font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 px-2.5 sm:px-3 py-1.5 rounded-lg border border-blue-200 transition-colors"
                >
                  <Shield className="w-3.5 h-3.5 text-blue-600" />
                  <span>Панель Admin</span>
                </Link>
              ) : (
                <Link
                  id="header-history-link"
                  href="/dashboard"
                  className="inline-flex items-center gap-1 text-xs font-semibold text-slate-700 hover:text-slate-900 px-2.5 sm:px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors"
                >
                  <History className="w-3.5 h-3.5 text-slate-500" />
                  <span className="hidden sm:inline">Кабинет</span>
                </Link>
              )}

              {user ? (
                <div className="flex items-center gap-1.5">
                  <div
                    onClick={() => {
                      if (!isAdmin) setIsPricingOpen(true);
                    }}
                    className="cursor-pointer hidden md:flex items-center gap-1.5 px-2 py-1 rounded-lg bg-slate-100 border border-slate-200 text-xs hover:border-blue-300 transition-colors"
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
                    className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-500 hover:text-slate-800 transition-colors"
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

              <a
                id="header-cta-button"
                href="#audit-section"
                className="inline-flex items-center gap-1 text-xs sm:text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-lg shadow-xs transition-all shrink-0"
              >
                <Activity className="w-3.5 h-3.5" />
                <span>Аудит</span>
              </a>
            </div>
          </div>
        </div>
      </header>

      <PricingModal
        isOpen={isPricingOpen}
        onClose={() => setIsPricingOpen(false)}
      />
    </>
  );
}
