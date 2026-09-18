'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Sparkles,
  Zap,
  LayoutDashboard,
  LogIn,
  LogOut,
  Shield,
  FileSpreadsheet,
  User,
} from 'lucide-react';
import { useUser } from '@/lib/auth/user-context';
import { PricingModal } from '@/components/PricingModal';

export function MobileBottomNav() {
  const pathname = usePathname();
  const { user, isAdmin, logout } = useUser();
  const [isPricingModalOpen, setIsPricingModalOpen] = useState(false);

  // Скрываем нижнюю панель при печати
  return (
    <>
      <nav
        aria-label="Мобильная навигация"
        className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200/90 shadow-[0_-4px_25px_rgba(0,0,0,0.07)] md:hidden print:hidden"
        style={{ paddingBottom: 'max(0.5rem, env(safe-area-inset-bottom))' }}
      >
        <div className="grid grid-cols-4 items-center h-14 px-2 max-w-md mx-auto">
          {/* 1. Аудит / Главная */}
          <Link
            href="/"
            className={`flex flex-col items-center justify-center py-1 rounded-xl transition-all ${
              pathname === '/'
                ? 'text-blue-600 font-bold'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Sparkles className={`w-5 h-5 ${pathname === '/' ? 'text-blue-600' : 'text-slate-400'}`} />
            <span className="text-[10px] mt-0.5">Аудит</span>
          </Link>

          {/* 2. Тарифы */}
          <button
            type="button"
            onClick={() => setIsPricingModalOpen(true)}
            className="flex flex-col items-center justify-center py-1 rounded-xl text-slate-500 hover:text-blue-600 transition-all cursor-pointer"
          >
            <Zap className="w-5 h-5 text-amber-500" />
            <span className="text-[10px] mt-0.5">Тарифы</span>
          </button>

          {/* 3. Кабинет / Админка */}
          {isAdmin ? (
            <Link
              href="/admin"
              className={`flex flex-col items-center justify-center py-1 rounded-xl transition-all ${
                pathname.startsWith('/admin')
                  ? 'text-blue-600 font-bold'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <Shield className={`w-5 h-5 ${pathname.startsWith('/admin') ? 'text-blue-600' : 'text-slate-400'}`} />
              <span className="text-[10px] mt-0.5">Админка</span>
            </Link>
          ) : (
            <Link
              href="/dashboard"
              className={`flex flex-col items-center justify-center py-1 rounded-xl transition-all ${
                pathname.startsWith('/dashboard')
                  ? 'text-blue-600 font-bold'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <LayoutDashboard
                className={`w-5 h-5 ${pathname.startsWith('/dashboard') ? 'text-blue-600' : 'text-slate-400'}`}
              />
              <span className="text-[10px] mt-0.5">Кабинет</span>
            </Link>
          )}

          {/* 4. Профиль / Войти / Выйти */}
          {user ? (
            <button
              type="button"
              onClick={() => {
                if (window.confirm('Вы действительно хотите выйти из учетной записи?')) {
                  logout();
                }
              }}
              title="Выйти из аккаунта"
              className="flex flex-col items-center justify-center py-1 rounded-xl text-slate-500 hover:text-red-600 transition-all cursor-pointer"
            >
              <LogOut className="w-5 h-5 text-slate-400 hover:text-red-500" />
              <span className="text-[10px] mt-0.5 truncate max-w-[60px]">Выйти</span>
            </button>
          ) : (
            <Link
              href="/sign-in"
              className={`flex flex-col items-center justify-center py-1 rounded-xl transition-all ${
                pathname === '/sign-in'
                  ? 'text-blue-600 font-bold'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <LogIn className={`w-5 h-5 ${pathname === '/sign-in' ? 'text-blue-600' : 'text-slate-400'}`} />
              <span className="text-[10px] mt-0.5">Войти</span>
            </Link>
          )}
        </div>
      </nav>

      {/* Модальное окно тарифов, вызываемое из мобильной навигации */}
      <PricingModal
        isOpen={isPricingModalOpen}
        onClose={() => setIsPricingModalOpen(false)}
      />
    </>
  );
}
