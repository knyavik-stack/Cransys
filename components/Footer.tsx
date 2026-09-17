'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Shield, 
  Lock, 
  CheckCircle2, 
  Mail, 
  FileText, 
  Scale, 
  Send, 
  Video, 
  MessageSquare, 
  Globe, 
  ExternalLink,
  Cookie,
  Settings
} from 'lucide-react';
import { Logo } from '@/components/Logo';
import { DEFAULT_SITE_SETTINGS, SocialLinkItem } from '@/lib/settings/types';

export function Footer() {
  const [socials, setSocials] = useState<SocialLinkItem[]>(DEFAULT_SITE_SETTINGS.socials);
  const [supportEmail, setSupportEmail] = useState(DEFAULT_SITE_SETTINGS.supportEmail);

  useEffect(() => {
    let isCancelled = false;
    fetch('/api/settings')
      .then((res) => res.json())
      .then((data) => {
        if (!isCancelled && data.success && data.settings) {
          if (Array.isArray(data.settings.socials)) {
            setSocials(data.settings.socials);
          }
          if (data.settings.supportEmail) {
            setSupportEmail(data.settings.supportEmail);
          }
        }
      })
      .catch((e) => {
        console.warn('Could not load dynamic footer settings, using defaults', e);
      });

    return () => {
      isCancelled = true;
    };
  }, []);

  const handleOpenCookieSettings = () => {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('open-cookie-settings'));
    }
  };

  const enabledSocials = socials.filter((s) => s.enabled && s.url.trim() !== '');

  const renderSocialIcon = (iconType: string) => {
    switch (iconType) {
      case 'telegram':
        return <Send className="w-3.5 h-3.5 text-sky-500 shrink-0" />;
      case 'vk':
        return <Globe className="w-3.5 h-3.5 text-blue-600 shrink-0" />;
      case 'youtube':
        return <Video className="w-3.5 h-3.5 text-red-500 shrink-0" />;
      case 'vc':
        return <FileText className="w-3.5 h-3.5 text-emerald-600 shrink-0" />;
      case 'habr':
        return <MessageSquare className="w-3.5 h-3.5 text-cyan-600 shrink-0" />;
      case 'whatsapp':
        return <MessageSquare className="w-3.5 h-3.5 text-emerald-500 shrink-0" />;
      default:
        return <ExternalLink className="w-3.5 h-3.5 text-slate-400 shrink-0" />;
    }
  };

  return (
    <footer className="w-full bg-white text-slate-600 border-t border-slate-200/80 py-10 text-xs">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-8 lg:gap-8 mb-8">
          
          {/* Колонка 1: Бренд и миссия (5 из 12 колонок) */}
          <div className="lg:col-span-5 space-y-3 pr-0 lg:pr-4">
            <div className="flex items-center gap-2.5">
              <Logo size={32} className="shrink-0" />
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-base text-[#003882] tracking-[0.14em] uppercase">CRANSYS</span>
                <span className="text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-100 px-1.5 py-0.5 rounded">
                  DIRECT
                </span>
              </div>
            </div>
            <p className="text-slate-500 text-xs leading-relaxed max-w-sm">
              Независимый автоматизированный аудит рекламных кампаний в Яндекс.Директ. Поиск скрытых сливов бюджета в РСЯ, нецелевых запросов и мобильных аномалий.
            </p>
            <div className="flex flex-col gap-1.5 text-[11px] text-slate-500 pt-1">
              <span className="inline-flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                152-ФЗ РФ (Обезличенные данные)
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                TLS 1.3 шифрование
              </span>
              <span className="inline-flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                Zero Data Retention
              </span>
            </div>
          </div>

          {/* Колонка 2: Навигация (2 из 12 колонок) */}
          <div className="lg:col-span-2">
            <h4 className="font-bold text-slate-900 mb-3 text-xs tracking-wider uppercase">
              Навигация
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link href="/" className="hover:text-blue-600 transition-colors">
                  Главная и ДЕМО
                </Link>
              </li>
              <li>
                <Link href="/dashboard" className="hover:text-blue-600 transition-colors">
                  Личный кабинет
                </Link>
              </li>
              <li>
                <Link href="/sign-in" className="hover:text-blue-600 transition-colors">
                  Вход в систему
                </Link>
              </li>
              <li>
                <Link href="/sign-up" className="hover:text-blue-600 transition-colors">
                  Регистрация
                </Link>
              </li>
              <li>
                <Link href="/admin" className="text-slate-400 hover:text-slate-700 transition-colors">
                  Панель Admin
                </Link>
              </li>
            </ul>
          </div>

          {/* Колонка 3: Мы в сообществах и медиа (2 из 12 колонок) */}
          <div className="lg:col-span-2">
            <h4 className="font-bold text-slate-900 mb-3 text-xs tracking-wider uppercase">
              Сообщества
            </h4>
            {enabledSocials.length > 0 ? (
              <ul className="space-y-2 text-xs">
                {enabledSocials.map((soc) => (
                  <li key={soc.id}>
                    <a
                      href={soc.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 text-slate-600 hover:text-blue-600 transition-colors group"
                      title={soc.description || soc.name}
                    >
                      {renderSocialIcon(soc.icon)}
                      <span className="font-medium group-hover:underline">{soc.name}</span>
                    </a>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-slate-400 text-xs">Ссылки на каналы настраиваются в панели администратора.</p>
            )}
          </div>

          {/* Колонка 4: Правовая информация, cookie и поддержка (3 из 12 колонок) */}
          <div className="lg:col-span-3">
            <h4 className="font-bold text-slate-900 mb-3 text-xs tracking-wider uppercase">
              Правовая информация
            </h4>
            <ul className="space-y-2 text-xs mb-3">
              <li>
                <Link
                  href="/legal/privacy"
                  className="hover:text-blue-600 transition-colors flex items-center gap-1.5 text-slate-600"
                >
                  <Shield className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span>Политика конфиденциальности</span>
                </Link>
              </li>
              <li>
                <Link
                  href="/legal/terms"
                  className="hover:text-blue-600 transition-colors flex items-center gap-1.5 text-slate-600"
                >
                  <FileText className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span>Пользовательское соглашение</span>
                </Link>
              </li>
              <li>
                <Link
                  href="/legal/consent"
                  className="hover:text-blue-600 transition-colors flex items-center gap-1.5 text-slate-600"
                >
                  <Scale className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span>Согласие на обработку (152-ФЗ)</span>
                </Link>
              </li>
              <li>
                <Link
                  href="/legal/cookies"
                  className="hover:text-blue-600 transition-colors flex items-center gap-1.5 text-slate-600"
                >
                  <Cookie className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span>Политика файлов cookie</span>
                </Link>
              </li>
              <li>
                <button
                  type="button"
                  onClick={handleOpenCookieSettings}
                  className="hover:text-blue-600 text-slate-500 transition-colors flex items-center gap-1.5 text-xs text-left cursor-pointer pt-0.5"
                >
                  <Settings className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                  <span className="underline decoration-slate-300 underline-offset-2">Настройки cookie</span>
                </button>
              </li>
            </ul>

            <div className="pt-2.5 border-t border-slate-100">
              <span className="text-[11px] text-slate-400 block mb-0.5">Служба поддержки:</span>
              <a
                href={`mailto:${supportEmail}`}
                className="text-slate-700 font-semibold hover:text-blue-600 transition-colors inline-flex items-center gap-1.5 font-mono text-xs"
              >
                <Mail className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                <span>{supportEmail}</span>
              </a>
            </div>
          </div>

        </div>

        {/* Нижняя строчка копирайта */}
        <div className="pt-6 border-t border-slate-200/80 flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] text-slate-400">
          <p>© 2026 CRANSYS Analytics. Все права защищены.</p>
          <p>Независимый аудит Яндекс.Директ в строгом соответствии с 152-ФЗ РФ.</p>
        </div>
      </div>
    </footer>
  );
}
