'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Cookie, Shield, Check, X, Settings, Lock, CheckCircle2 } from 'lucide-react';
import { CookiePreferences, SiteSettings, DEFAULT_SITE_SETTINGS } from '@/lib/settings/types';
import { COOKIE_STORAGE_KEY, notifyConsentChanged } from '@/lib/consent-client';

export function CookieConsentBanner() {
  const [isVisible, setIsVisible] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [settings, setSettings] = useState<SiteSettings>(DEFAULT_SITE_SETTINGS);
  
  // Локальные настройки категорий в модалке (ленивая инициализация из localStorage)
  const [analyticsAllowed, setAnalyticsAllowed] = useState<boolean>(() => {
    if (typeof window === 'undefined') return true;
    try {
      const saved = localStorage.getItem(COOKIE_STORAGE_KEY);
      if (saved) return JSON.parse(saved).analytics ?? true;
    } catch {}
    return true;
  });

  const [marketingAllowed, setMarketingAllowed] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    try {
      const saved = localStorage.getItem(COOKIE_STORAGE_KEY);
      if (saved) return JSON.parse(saved).marketing ?? false;
    } catch {}
    return false;
  });

  useEffect(() => {
    // Загружаем настройки сайта
    fetch('/api/settings')
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.settings) {
          setSettings(data.settings);
        }
      })
      .catch(() => {});

    // Проверяем, давал ли пользователь согласие ранее
    try {
      const saved = localStorage.getItem(COOKIE_STORAGE_KEY);
      if (!saved) {
        // Если согласия нет - показываем баннер через небольшую задержку
        const timer = setTimeout(() => {
          setIsVisible(true);
        }, 1200);
        return () => clearTimeout(timer);
      }
    } catch {
      const timer = setTimeout(() => {
        setIsVisible(true);
      }, 1200);
      return () => clearTimeout(timer);
    }
  }, []);

  // Слушаем глобальное событие открытия настроек cookie (из Футера или страницы Политики)
  useEffect(() => {
    const handleOpenModal = () => {
      try {
        const saved = localStorage.getItem(COOKIE_STORAGE_KEY);
        if (saved) {
          const parsed: CookiePreferences = JSON.parse(saved);
          setAnalyticsAllowed(parsed.analytics ?? true);
          setMarketingAllowed(parsed.marketing ?? false);
        }
      } catch {}
      setIsModalOpen(true);
    };

    window.addEventListener('open-cookie-settings', handleOpenModal);
    return () => {
      window.removeEventListener('open-cookie-settings', handleOpenModal);
    };
  }, []);

  const saveConsent = async (choice: 'all' | 'necessary' | 'custom', prefs: { analytics: boolean; marketing: boolean }) => {
    const consent: CookiePreferences = {
      necessary: true,
      analytics: prefs.analytics,
      marketing: prefs.marketing,
      timestamp: new Date().toISOString(),
      version: '2026.1',
    };

    try {
      localStorage.setItem(COOKIE_STORAGE_KEY, JSON.stringify(consent));
      
      // Устанавливаем cookie на срок из настроек (или 365 дней)
      const days = settings.cookieBanner?.consentExpiryDays || 365;
      const maxAge = days * 24 * 60 * 60;
      document.cookie = `${COOKIE_STORAGE_KEY}=${encodeURIComponent(JSON.stringify(consent))}; path=/; max-age=${maxAge}; SameSite=Lax`;

      // Оповещаем слушателей и провайдеры
      notifyConsentChanged(consent);

      // Отправляем обезличенную статистику согласий
      fetch('/api/legal/cookie-consent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          choice,
          preferences: consent,
        }),
      }).catch(() => {});
    } catch {}

    setIsVisible(false);
    setIsModalOpen(false);
  };

  const handleAcceptAll = () => {
    setAnalyticsAllowed(true);
    setMarketingAllowed(true);
    saveConsent('all', { analytics: true, marketing: true });
  };

  const handleAcceptNecessaryOnly = () => {
    setAnalyticsAllowed(false);
    setMarketingAllowed(false);
    saveConsent('necessary', { analytics: false, marketing: false });
  };

  const handleSaveCustom = () => {
    saveConsent('custom', { analytics: analyticsAllowed, marketing: marketingAllowed });
  };

  // Если баннер отключен в админке
  if (settings.cookieBanner && !settings.cookieBanner.enabled && !isModalOpen) {
    return null;
  }

  const bannerConfig = settings.cookieBanner || DEFAULT_SITE_SETTINGS.cookieBanner;

  return (
    <>
      {/* 1. ПЛАВАЮЩИЙ БАННЕР ВНИЗУ ЭКРАНА */}
      {isVisible && !isModalOpen && (
        <div
          id="cookie-consent-banner"
          className="fixed bottom-3 sm:bottom-5 left-3 sm:left-5 right-3 sm:right-5 max-w-4xl mx-auto z-50 animate-fadeIn"
        >
          <div className="bg-slate-900/95 backdrop-blur-md text-white p-4 sm:p-5 rounded-2xl border border-slate-700/80 shadow-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            
            <div className="flex items-start gap-3.5 flex-1 pr-2">
              <div className="p-2.5 rounded-xl bg-blue-600/20 text-blue-400 shrink-0 border border-blue-500/30">
                <Cookie className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h4 className="text-xs sm:text-sm font-bold text-white tracking-wide">
                    {bannerConfig.title || 'Файлы cookie и конфиденциальность'}
                  </h4>
                  <span className="text-[10px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-full">
                    152-ФЗ РФ
                  </span>
                </div>
                <p className="text-[11px] sm:text-xs text-slate-300 leading-relaxed max-w-2xl">
                  {bannerConfig.description || DEFAULT_SITE_SETTINGS.cookieBanner.description}{' '}
                  <Link
                    href={bannerConfig.policyUrl || '/legal/cookies'}
                    className="text-blue-400 hover:text-blue-300 underline font-medium"
                  >
                    Подробнее в Политике cookie
                  </Link>.
                </p>
              </div>
            </div>

            {/* Кнопки действий */}
            <div className="flex flex-wrap items-center gap-2 w-full md:w-auto shrink-0 justify-end pt-2 md:pt-0 border-t md:border-t-0 border-slate-800">
              <button
                type="button"
                onClick={() => setIsModalOpen(true)}
                className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold border border-slate-700 transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <Settings className="w-3.5 h-3.5" />
                <span>Настроить</span>
              </button>

              {bannerConfig.showDeclineButton && (
                <button
                  type="button"
                  onClick={handleAcceptNecessaryOnly}
                  className="px-3.5 py-2 rounded-xl bg-slate-800/80 hover:bg-slate-800 text-slate-300 hover:text-white text-xs font-semibold border border-slate-700 transition-all cursor-pointer"
                >
                  Только необходимые
                </button>
              )}

              <button
                type="button"
                onClick={handleAcceptAll}
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-lg shadow-blue-600/30 transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Принять все</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. ДЕТАЛЬНОЕ МОДАЛЬНОЕ ОКНО НАСТРОЙКИ COOKIE */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs animate-fadeIn">
          <div className="bg-slate-900 border border-slate-800 text-white w-full max-w-xl rounded-2xl shadow-2xl p-6 space-y-5 max-h-[90vh] overflow-y-auto">
            
            {/* Заголовок модалки */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-blue-600/20 text-blue-400 border border-blue-500/30">
                  <Cookie className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Центр управления файлами cookie</h3>
                  <p className="text-[11px] text-slate-400">Настройка согласий в соответствии с 152-ФЗ РФ</p>
                </div>
              </div>

              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Описание */}
            <p className="text-xs text-slate-300 leading-relaxed">
              Мы уважаем вашу конфиденциальность. Вы можете выбрать, какие типы файлов cookie разрешить платформе использовать во время вашей работы.
            </p>

            {/* Список категорий */}
            <div className="space-y-3">
              {/* Категория 1: Обязательные технические */}
              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Lock className="w-3.5 h-3.5 text-blue-400" />
                    <span className="text-xs font-bold text-white">Обязательные технические cookie</span>
                  </div>
                  <span className="text-[10px] font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30 px-2 py-0.5 rounded-full">
                    Всегда активны
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Необходимы для авторизации, защиты от CSRF-атак, сохранения текущего состояния сессии и фиксации настроек конфиденциальности. Не собирают личные данные третьих лиц.
                </p>
              </div>

              {/* Категория 2: Аналитические */}
              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-xs font-bold text-white">Аналитические cookie (Яндекс.Метрика, GA4)</span>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={analyticsAllowed}
                      onChange={(e) => setAnalyticsAllowed(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-slate-800 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Помогают нам собирать обезличенную статистику использования сервиса, оценивать удобство интерфейса и скорость работы отчетов аудита.
                </p>
              </div>

              {/* Категория 3: Маркетинговые */}
              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Shield className="w-3.5 h-3.5 text-amber-400" />
                    <span className="text-xs font-bold text-white">Маркетинговые пиксели и трекеры</span>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={marketingAllowed}
                      onChange={(e) => setMarketingAllowed(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-slate-800 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Используются для оценки эффективности рекламных объявлений и показа релевантной информации о тарифах сервиса.
                </p>
              </div>
            </div>

            {/* Подвал модалки с кнопками */}
            <div className="pt-3 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
              <Link
                href="/legal/cookies"
                onClick={() => setIsModalOpen(false)}
                className="text-[11px] text-blue-400 hover:underline"
              >
                Читать полную Политику файлов cookie
              </Link>

              <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                <button
                  type="button"
                  onClick={handleAcceptNecessaryOnly}
                  className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold cursor-pointer transition-colors"
                >
                  Отклонить необязательные
                </button>

                <button
                  type="button"
                  onClick={handleSaveCustom}
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-lg shadow-blue-600/30 cursor-pointer transition-all"
                >
                  Сохранить мой выбор
                </button>
              </div>
            </div>

          </div>
        </div>
      )}
    </>
  );
}
