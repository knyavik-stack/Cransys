import React from 'react';
import Link from 'next/link';
import { ArrowLeft, Sparkles } from 'lucide-react';

export default function SignUpPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4 py-12">
      <div className="max-w-md w-full bg-white rounded-2xl border border-slate-200 p-8 shadow-sm text-center">
        <div className="w-12 h-12 rounded-xl bg-blue-600 text-white font-bold text-2xl flex items-center justify-center mx-auto mb-4">
          C
        </div>
        <h2 className="text-2xl font-bold text-slate-900 mb-2">Регистрация в Cransys</h2>
        <p className="text-sm text-slate-500 mb-6">
          Создайте аккаунт для получения 10 000 бесплатных сессий аудита ежемесячно
        </p>

        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 text-left mb-6 flex items-start gap-2.5">
          <Sparkles className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
          <span>
            При регистрации вам станет доступен Личный кабинет и экспорт отчетов в Cloudflare R2.
          </span>
        </div>

        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm font-semibold text-blue-600 hover:text-blue-700"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Вернуться на главную</span>
        </Link>
      </div>
    </div>
  );
}
