import React from 'react';
import { Shield, Lock, Server } from 'lucide-react';

export function Footer() {
  return (
    <footer className="w-full bg-white border-t border-slate-200 mt-20 py-12 text-slate-500 text-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          <div className="md:col-span-2">
            <div className="flex items-center gap-2 mb-3">
              <span className="font-bold text-lg text-slate-900">Cransys</span>
              <span className="text-xs bg-slate-100 text-slate-700 px-2 py-0.5 rounded">2026</span>
            </div>
            <p className="text-slate-600 max-w-md text-sm leading-relaxed mb-4">
              Независимый автоматизированный аудит рекламных кампаний Яндекс.Директ. Быстрый поиск скрытых сливов бюджета в сетях РСЯ, нецелевого мобильного трафика и автостратегий без конверсий.
            </p>
            <div className="flex items-center gap-4 text-xs text-slate-500">
              <div className="flex items-center gap-1">
                <Shield className="w-3.5 h-3.5 text-blue-600" />
                <span>152-ФЗ РФ Compliant</span>
              </div>
              <div className="flex items-center gap-1">
                <Lock className="w-3.5 h-3.5 text-emerald-600" />
                <span>Zero-Retention Policy</span>
              </div>
              <div className="flex items-center gap-1">
                <Server className="w-3.5 h-3.5 text-slate-600" />
                <span>Neon + R2 Zero-Egress</span>
              </div>
            </div>
          </div>

          <div>
            <h4 className="font-semibold text-slate-900 mb-3 text-xs tracking-wider uppercase">Тарифы</h4>
            <ul className="space-y-2 text-sm">
              <li className="text-slate-600">Экспресс — 0 ₽ (Мгновенный флаг сливов)</li>
              <li className="text-slate-600">Pro — 399 ₽ (Полная детализация правил)</li>
              <li className="text-slate-600">MAX — 999 ₽ (Готовый PDF + ТЗ для подрядчика)</li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-slate-900 mb-3 text-xs tracking-wider uppercase">Безопасность</h4>
            <p className="text-xs text-slate-500 leading-relaxed">
              Мы не запрашиваем логины и пароли от аккаунтов Яндекс. Вы загружаете стандартный обезличенный отчет статистики (XLSX/CSV), где нет персональных данных клиентов.
            </p>
          </div>
        </div>

        <div className="pt-6 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400">
          <p>© 2026 Cransys (knyavik-stack/cransys). Все права защищены.</p>
          <div className="flex items-center gap-4">
            <span>Политика конфиденциальности</span>
            <span>Пользовательское соглашение</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
