import React from 'react';
import Link from 'next/link';
import { ArrowLeft, Shield } from 'lucide-react';

export default function SignInPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4 py-12">
      <div className="max-w-md w-full bg-white rounded-2xl border border-slate-200 p-8 shadow-sm text-center">
        <div className="w-12 h-12 rounded-xl bg-blue-600 text-white font-bold text-2xl flex items-center justify-center mx-auto mb-4">
          C
        </div>
        <h2 className="text-2xl font-bold text-slate-900 mb-2">Вход в Cransys</h2>
        <p className="text-sm text-slate-500 mb-6">
          Авторизуйтесь через Clerk для сохранения истории аудитов и скачивания PDF-отчетов
        </p>

        <div className="p-4 rounded-xl bg-blue-50 border border-blue-100 text-xs text-blue-800 text-left mb-6 flex items-start gap-2.5">
          <Shield className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
          <span>
            Clerk Auth подключен. В предпросмотре доступен бесплатный экспресс-аудит без обязательной регистрации.
          </span>
        </div>

        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm font-semibold text-blue-600 hover:text-blue-700"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Вернуться к экспресс-аудиту</span>
        </Link>
      </div>
    </div>
  );
}
