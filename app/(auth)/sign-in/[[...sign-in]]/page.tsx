'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Shield, Mail, Sparkles, CheckCircle2, Lock } from 'lucide-react';
import { useUser } from '@/lib/auth/user-context';
import { UserTier } from '@/lib/billing/tiers';

export default function SignInPage() {
  const router = useRouter();
  const { user, login, loginTestAccount, logout } = useUser();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setIsSubmitting(true);

    setTimeout(() => {
      login(email);
      setSuccessMsg('Успешный вход! Перенаправляем в кабинет...');
      setTimeout(() => {
        router.push('/dashboard');
      }, 700);
    }, 400);
  };

  const handleTestAccountLogin = (tier: UserTier) => {
    loginTestAccount(tier);
    setSuccessMsg(`Вход выполнен в тестовый аккаунт (Тариф ${tier})...`);
    setTimeout(() => {
      router.push('/dashboard');
    }, 500);
  };

  if (user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4 py-12">
        <div className="max-w-md w-full bg-white rounded-2xl border border-slate-200 p-8 shadow-sm text-center">
          <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 mb-1">Вы уже авторизованы</h2>
          <p className="text-sm font-medium text-slate-700 mb-1">{user.name}</p>
          <p className="text-xs text-slate-500 mb-6">{user.email}</p>

          <div className="flex flex-col gap-3">
            <Link
              href="/dashboard"
              className="w-full py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold transition-colors shadow-xs"
            >
              Перейти в Личный кабинет
            </Link>
            <button
              onClick={logout}
              className="w-full py-2 px-4 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 text-xs font-medium transition-colors"
            >
              Выйти из аккаунта
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4 py-12">
      <div className="max-w-md w-full bg-white rounded-2xl border border-slate-200 p-8 shadow-sm">
        <div className="text-center mb-6">
          <div className="w-12 h-12 rounded-xl bg-blue-600 text-white font-bold text-2xl flex items-center justify-center mx-auto mb-3 shadow-xs">
            C
          </div>
          <h2 className="text-2xl font-bold text-slate-900">Вход в Cransys</h2>
          <p className="text-xs text-slate-500 mt-1">
            Для сохранения истории аудитов и привязки кабинетов Яндекс.Директ
          </p>
        </div>

        {successMsg && (
          <div className="mb-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Электронная почта
            </label>
            <div className="relative">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="director@company.ru"
                className="w-full pl-9 pr-3 py-2 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Пароль
            </label>
            <div className="relative">
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-9 pr-3 py-2 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm transition-colors shadow-xs"
          >
            {isSubmitting ? 'Входим...' : 'Войти по Email'}
          </button>
        </form>

        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-200" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-white px-2 text-slate-400 font-medium">или быстрый доступ</span>
          </div>
        </div>

        <div className="space-y-2 mb-6">
          <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider text-center mb-2">
            Быстрый вход для тестирования тарифов:
          </p>
          <div className="grid grid-cols-4 gap-1.5">
            <button
              type="button"
              onClick={() => handleTestAccountLogin('EXPRESS_PACK')}
              className="py-1.5 px-2 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-800 font-semibold text-[11px] transition-colors text-center"
            >
              Экспресс
            </button>
            <button
              type="button"
              onClick={() => handleTestAccountLogin('PRO')}
              className="py-1.5 px-2 rounded-xl bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-800 font-semibold text-[11px] transition-colors text-center"
            >
              PRO
            </button>
            <button
              type="button"
              onClick={() => handleTestAccountLogin('MAX')}
              className="py-1.5 px-2 rounded-xl bg-purple-50 hover:bg-purple-100 border border-purple-200 text-purple-800 font-semibold text-[11px] transition-colors text-center"
            >
              MAX
            </button>
            <button
              type="button"
              onClick={() => handleTestAccountLogin('CORP')}
              className="py-1.5 px-2 rounded-xl bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 text-indigo-800 font-semibold text-[11px] transition-colors text-center"
            >
              Corp
            </button>
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-blue-50/70 border border-blue-100 text-[11px] text-blue-900 flex items-start gap-2.5 mb-6">
          <Shield className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
          <span>
            Полная совместимость с Clerk Auth и Neon PostgreSQL. Все данные сохраняются защищенно в облаке.
          </span>
        </div>

        <div className="text-center">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Вернуться на главную</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
