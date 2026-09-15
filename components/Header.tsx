'use client';

import React from 'react';
import { ShieldCheck, Activity } from 'lucide-react';

export function Header() {
  return (
    <header className="w-full bg-white/95 backdrop-blur-sm border-b border-slate-200 sticky top-0 z-30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold text-lg shadow-sm shadow-blue-500/20">
            C
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-xl text-slate-900 tracking-tight">Cransys</span>
              <span className="text-[11px] font-semibold tracking-wide uppercase px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-100">
                v2 • Direct
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 sm:gap-6">
          <div className="hidden md:flex items-center gap-2 text-xs text-slate-500 bg-slate-50 px-3 py-1.5 rounded-md border border-slate-200/80">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>152-ФЗ: Технические обезличенные данные</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              id="auth-login-button"
              type="button"
              onClick={() => {
                window.location.href = '#audit-section';
              }}
              className="text-sm font-medium text-slate-700 hover:text-slate-900 px-3 py-1.5 rounded-lg hover:bg-slate-100 transition-colors"
            >
              Начать проверку
            </button>
            <a
              id="header-cta-button"
              href="#audit-section"
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg shadow-sm transition-all"
            >
              <Activity className="w-4 h-4" />
              <span>Экспресс-аудит</span>
            </a>
          </div>
        </div>
      </div>
    </header>
  );
}
