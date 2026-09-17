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
  ExternalLink 
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

  const enabledSocials = socials.filter((s) => s.enabled && s.url.trim() !== '');

  const renderSocialIcon = (iconType: string) => {
    switch (iconType) {
      case 'telegram':
        return <Send className="w-3.5 h-3.5 text-sky-500" />;
      case 'vk':
        return <Globe className="w-3.5 h-3.5 text-blue-600" />;
      case 'youtube':
        return <Video className="w-3.5 h-3.5 text-red-500" />;
      case 'vc':
        return <FileText className="w-3.5 h-3.5 text-emerald-600" />;
      case 'habr':
        return <MessageSquare className="w-3.5 h-3.5 text-cyan-600" />;
      case 'whatsapp':
        return <MessageSquare className="w-3.5 h-3.5 text-emerald-500" />;
      default:
        return <ExternalLink className="w-3.5 h-3.5 text-slate-400" />;
    }
  };

  return (
    <footer className="w-full bg-white text-slate-600 border-t border-slate-200/80 py-10 text-xs">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-12 mb-8">
          {/* Колонка 1: Бренд, миссия и Соцсети */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Logo size={28} className="shrink-0" />
              <span className="font-bold text-base text-slate-900 tracking-tight">Cransys</span>
              <span className="text-[10px] font-semibold bg-blue-50 text-blue-700 border border-blue-100 px-1.5 py-0.5 rounded">
                Direct 2026
              </span>
            </div>
            <p className="text-slate-500 text-xs leading-relaxed max-w-sm">
              Независимый автоматизированный аудит рекламных кампаний в Яндекс.Директ. Поиск скрытых сливов бюджета в РСЯ, нецелевых поисковых запросов и мобильных аномалий.
            </p>
            <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-500 pt-1">
              <span className="inline-flex items-center gap-1">
                <Shield className="w-3.5 h-3.5 text-emerald-600" />
                152-ФЗ РФ
              </span>
              <span className="inline-flex items-center gap-1">
                <Lock className="w-3.5 h-3.5 text-blue-600" />
                TLS 1.3 Encryption
              </span>
              <span className="inline-flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                Zero Retention
              </span>
            </div>

            {/* Блок Социальных сетей */}
            {enabledSocials.length > 0 && (
              <div className="pt-2">
                <span className="text-[11px] font-semibold text-slate-700 block mb-2">
                  Мы в сообществах и медиа:
                </span>
                <div className="flex flex-wrap items-center gap-2">
                  {enabledSocials.map((soc) => (
                    <a
                      key={soc.id}
                      href={soc.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-slate-200 bg-slate-50/80 hover:bg-blue-50 hover:border-blue-200 text-slate-700 hover:text-blue-700 text-[11px] font-medium transition-all shadow-2xs"
                      title={soc.description || soc.name}
                    >
                      {renderSocialIcon(soc.icon)}
                      <span>{soc.name}</span>
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Колонка 2: Навигация */}
          <div className="md:pl-6">
            <h4 className="font-bold text-slate-900 mb-3 text-xs tracking-wider uppercase">
              Навигация
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link href="/" className="hover:text-blue-600 transition-colors">
                  Главная и ДЕМО-аудит
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
                  Панель администратора
                </Link>
              </li>
            </ul>
          </div>

          {/* Колонка 3: Правовой блок и контакты */}
          <div>
            <h4 className="font-bold text-slate-900 mb-3 text-xs tracking-wider uppercase">
              Правовая информация
            </h4>
            <ul className="space-y-2 text-xs mb-4">
              <li>
                <Link
                  href="/legal/privacy"
                  className="hover:text-blue-600 transition-colors flex items-center gap-1.5 text-slate-600"
                >
                  <Shield className="w-3.5 h-3.5 text-slate-400" />
                  <span>Политика конфиденциальности</span>
                </Link>
              </li>
              <li>
                <Link
                  href="/legal/terms"
                  className="hover:text-blue-600 transition-colors flex items-center gap-1.5 text-slate-600"
                >
                  <FileText className="w-3.5 h-3.5 text-slate-400" />
                  <span>Пользовательское соглашение</span>
                </Link>
              </li>
              <li>
                <Link
                  href="/legal/consent"
                  className="hover:text-blue-600 transition-colors flex items-center gap-1.5 text-slate-600"
                >
                  <Scale className="w-3.5 h-3.5 text-slate-400" />
                  <span>Согласие на обработку данных (152-ФЗ)</span>
                </Link>
              </li>
            </ul>

            <div className="pt-3 border-t border-slate-100">
              <span className="text-[11px] text-slate-400 block mb-1">Служба поддержки:</span>
              <a
                href={`mailto:${supportEmail}`}
                className="text-slate-700 font-semibold hover:text-blue-600 transition-colors inline-flex items-center gap-1.5 font-mono text-xs"
              >
                <Mail className="w-3.5 h-3.5 text-blue-600" />
                <span>{supportEmail}</span>
              </a>
            </div>
          </div>
        </div>

        {/* Нижняя строчка копирайта */}
        <div className="pt-6 border-t border-slate-200/80 flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] text-slate-400">
          <p>© 2026 Cransys Analytics. Все права защищены.</p>
          <p>Независимый аудит Яндекс.Директ в строгом соответствии с 152-ФЗ РФ.</p>
        </div>
      </div>
    </footer>
  );
}
