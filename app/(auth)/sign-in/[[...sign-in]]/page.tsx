'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, Shield, Mail, Lock, CheckCircle2, AlertCircle } from 'lucide-react';
import { useUser } from '@/lib/auth/user-context';
import { Footer } from '@/components/Footer';
import { Logo } from '@/components/Logo';

export default function SignInPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTarget = searchParams.get('redirect') || '/dashboard';
  const { user, loginWithCredentials, logout } = useUser();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setIsSubmitting(true);
    setErrorMsg('');

    const res = await loginWithCredentials(email, password);
    if (res.success) {
      setSuccessMsg('Успешная авторизация! Перенаправляем...');
      setTimeout(() => {
        if (email.trim().toLowerCase() === (process.env.ADMIN_EMAIL || 'admin@cransys.ru').toLowerCase()) {
          router.push('/admin');
        } else {
          router.push(redirectTarget);
        }
      }, 500);
    } else {
      setErrorMsg(res.error || 'Ошибка входа. Проверьте введенные данные.');
      setIsSubmitting(false);
    }
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
            {user.role === 'ADMIN' ? (
              <Link
                href="/admin"
                className="w-full py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold transition-colors shadow-xs"
              >
                Перейти в Панель администратора
              </Link>
            ) : (
              <Link
                href="/dashboard"
                className="w-full py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold transition-colors shadow-xs"
              >
                Перейти в Личный кабинет
              </Link>
            )}
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
    <div className="min-h-screen flex flex-col justify-between bg-slate-50">
      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="max-w-md w-full bg-white rounded-2xl border border-slate-200 p-8 shadow-xs">
          <div className="text-center mb-6">
            <div className="flex justify-center mx-auto mb-3">
              <Logo size={48} />
            </div>
            <div className="flex items-center justify-center gap-2 mb-1">
              <h2 className="text-2xl font-bold text-slate-900">Вход в</h2>
              <span className="font-extrabold text-2xl text-[#003882] tracking-[0.14em] uppercase">CRANSYS</span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Для доступа к истории проверок и функциям тарифа
            </p>
          </div>

          {errorMsg && (
            <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

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
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold text-slate-700">
                  Пароль
                </label>
                <Link
                  href="/forgot-password"
                  className="text-[11px] text-blue-600 hover:text-blue-700 font-medium hover:underline"
                >
                  Забыли пароль?
                </Link>
              </div>
              <div className="relative">
                <input
                  type="password"
                  required
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
              className="w-full py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm transition-colors shadow-xs mt-2"
            >
              {isSubmitting ? 'Проверка данных...' : 'Войти в аккаунт'}
            </button>
          </form>

          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-[11px] text-slate-600 flex items-start gap-2.5 my-6">
            <Shield className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <span>
              Безопасная сквозная авторизация. Ваши данные защищены по стандарту 152-ФЗ РФ.
            </span>
          </div>

          <div className="text-center space-y-2">
            <p className="text-xs text-slate-500">
              Нет аккаунта?{' '}
              <Link href="/sign-up" className="text-blue-600 font-semibold hover:underline">
                Зарегистрироваться
              </Link>
            </p>
            <div>
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
      </div>

      <Footer />
    </div>
  );
}
