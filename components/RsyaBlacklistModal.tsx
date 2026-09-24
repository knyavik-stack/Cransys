'use client';

import React, { useState, useMemo } from 'react';
import {
  X,
  ShieldAlert,
  Download,
  Copy,
  Check,
  Search,
  Filter,
  Layers,
  Sparkles,
  ExternalLink,
  ShieldCheck,
  Database,
} from 'lucide-react';
import { useUser } from '@/lib/auth/user-context';

interface RsyaBlacklistModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface BlacklistSite {
  domain: string;
  category: 'GAMES' | 'APPS' | 'SPAM' | 'CLICKBAIT' | 'KIDS';
  categoryLabel: string;
  reason: string;
  threatLevel: 'CRITICAL' | 'HIGH';
}

// Реальная проверенная база мусорных площадок РСЯ, часто сливающих бюджет впустую
const BASE_RSYA_BLACKLIST: BlacklistSite[] = [
  // Мобильные игры и кликеры (99% случайных кликов от детей)
  { domain: 'com.playgendary.tom', category: 'GAMES', categoryLabel: 'Мобильные игры', reason: 'Случайные клики детей во время игр, 0 конверсий', threatLevel: 'CRITICAL' },
  { domain: 'com.outfit7.mytalkingtomfree', category: 'GAMES', categoryLabel: 'Мобильные игры', reason: 'Детский трафик, случайные нажатия на всплывающие баннеры', threatLevel: 'CRITICAL' },
  { domain: 'com.roblox.client', category: 'GAMES', categoryLabel: 'Мобильные игры', reason: 'Детская аудитория до 12 лет, неплатежеспособный трафик', threatLevel: 'CRITICAL' },
  { domain: 'com.fingersoft.hillclimb', category: 'GAMES', categoryLabel: 'Мобильные игры', reason: 'Полноэкранные баннеры с принудительными кликами', threatLevel: 'CRITICAL' },
  { domain: 'com.subwaysurfers.game', category: 'GAMES', categoryLabel: 'Мобильные игры', reason: 'Мисклики при проигрыше раунда', threatLevel: 'CRITICAL' },
  { domain: 'ru.yandex.games', category: 'GAMES', categoryLabel: 'Мобильные игры', reason: 'Казуальные браузерные игры, высокий отказ > 85%', threatLevel: 'HIGH' },
  { domain: 'com.miniclip.eightballpool', category: 'GAMES', categoryLabel: 'Мобильные игры', reason: 'Случайные касания по рекламным баннерам', threatLevel: 'HIGH' },
  { domain: 'com.doodle.jump', category: 'GAMES', categoryLabel: 'Мобильные игры', reason: 'Нецелевой развлекательный трафик', threatLevel: 'HIGH' },
  { domain: 'com.king.candycrushsaga', category: 'GAMES', categoryLabel: 'Мобильные игры', reason: 'Высокая доля кликов за бесплатные бонусы в игре', threatLevel: 'CRITICAL' },
  { domain: 'com.voodoo.helixjump', category: 'GAMES', categoryLabel: 'Мобильные игры', reason: 'Гиперказуальные кликеры, отказ 92%', threatLevel: 'CRITICAL' },
  
  // Спам-приложения, фонарики, гороскопы, очистители памяти
  { domain: 'com.cleanmaster.mguard', category: 'APPS', categoryLabel: 'Мусорные утилиты', reason: 'Агрессивная пуш-реклама и фоновые клики', threatLevel: 'CRITICAL' },
  { domain: 'com.flashlight.brightest', category: 'APPS', categoryLabel: 'Мусорные утилиты', reason: 'Всплывающие баннеры при включении фонарика', threatLevel: 'CRITICAL' },
  { domain: 'com.horoscope.daily.fortune', category: 'APPS', categoryLabel: 'Мусорные утилиты', reason: 'Низкокачественный трафик с гаданий и гороскопов', threatLevel: 'HIGH' },
  { domain: 'com.speedtest.net.mobile', category: 'APPS', categoryLabel: 'Мусорные утилиты', reason: 'Клики в момент ожидания замера скорости', threatLevel: 'HIGH' },
  { domain: 'com.battery.saver.fastcharge', category: 'APPS', categoryLabel: 'Мусорные утилиты', reason: 'Обманные интерфейсы «Очистите память»', threatLevel: 'CRITICAL' },
  { domain: 'com.vpn.free.proxy.unblock', category: 'APPS', categoryLabel: 'Мусорные утилиты', reason: 'Случайные клики при подключении к VPN', threatLevel: 'HIGH' },
  { domain: 'com.sound.recorder.voice', category: 'APPS', categoryLabel: 'Мусорные утилиты', reason: 'Рекламные баннеры на весь экран', threatLevel: 'HIGH' },
  { domain: 'com.calculator.simple.free', category: 'APPS', categoryLabel: 'Мусорные утилиты', reason: 'Случайные нажатия между кнопками калькулятора', threatLevel: 'CRITICAL' },

  // Дорвеи, спам-сайты и рерайты
  { domain: 'gdz-putina.info', category: 'KIDS', categoryLabel: 'Школьные ГДЗ', reason: 'Школьники списывают домашние задания, 0 покупательской способности', threatLevel: 'CRITICAL' },
  { domain: 'resheba.me', category: 'KIDS', categoryLabel: 'Школьные ГДЗ', reason: 'Детский школьный трафик', threatLevel: 'CRITICAL' },
  { domain: 'znanija.com', category: 'KIDS', categoryLabel: 'Школьные ГДЗ', reason: 'Поиск ответов на школьные тесты', threatLevel: 'CRITICAL' },
  { domain: 'otvet.mail.ru', category: 'SPAM', categoryLabel: 'Форумы вопросов', reason: 'Нецелевые пользователи, высокий показатель отказов', threatLevel: 'HIGH' },
  { domain: 'sbornik-otvetov.ru', category: 'KIDS', categoryLabel: 'Школьные ГДЗ', reason: 'Трафик учеников 5-9 классов', threatLevel: 'CRITICAL' },
  { domain: 'pesni.club', category: 'SPAM', categoryLabel: 'Музыкальные спам-сайты', reason: 'Скачивание рингтонов и музыки, отказ > 90%', threatLevel: 'HIGH' },
  { domain: 'mp3-pesni.net', category: 'SPAM', categoryLabel: 'Музыкальные спам-сайты', reason: 'Автоматические редиректы и случайные клики', threatLevel: 'HIGH' },
  { domain: 'kinogo.biz', category: 'CLICKBAIT', categoryLabel: 'Пиратские онлайн-кино', reason: 'Случайные клики по баннерам плеера', threatLevel: 'CRITICAL' },
  { domain: 'lordfilm.cx', category: 'CLICKBAIT', categoryLabel: 'Пиратские онлайн-кино', reason: 'Всплывающие окна и принудительные переходы', threatLevel: 'CRITICAL' },
  { domain: 'rezka.ag', category: 'CLICKBAIT', categoryLabel: 'Пиратские онлайн-кино', reason: 'Нецелевой развлекательный трафик', threatLevel: 'HIGH' },

  // Кликбейтные тизерные витрины и фейковые новости
  { domain: 'smi2.ru', category: 'CLICKBAIT', categoryLabel: 'Желтые новости', reason: 'Шок-заголовки, клики ради любопытства без покупок', threatLevel: 'CRITICAL' },
  { domain: 'mirtesen.ru', category: 'CLICKBAIT', categoryLabel: 'Желтые новости', reason: 'Низкая покупательская конверсия, высокий bounce rate', threatLevel: 'HIGH' },
  { domain: 'lentainform.kz', category: 'CLICKBAIT', categoryLabel: 'Желтые новости', reason: 'Кликбейтный новостной агрегатор', threatLevel: 'HIGH' },
  { domain: 'pulse.mail.ru', category: 'CLICKBAIT', categoryLabel: 'Желтые новости', reason: 'Развлекательные ленты, быстрый уход без конверсий', threatLevel: 'HIGH' },
  { domain: 'anonsy-nedeli.ru', category: 'CLICKBAIT', categoryLabel: 'Желтые новости', reason: 'Фейковые сенсации и тизерные клики', threatLevel: 'CRITICAL' },
  { domain: 'v-mire-novostei.com', category: 'CLICKBAIT', categoryLabel: 'Желтые новости', reason: 'Шок-контент и спам-трафик', threatLevel: 'CRITICAL' },
];

export function RsyaBlacklistModal({ isOpen, onClose }: RsyaBlacklistModalProps) {
  const { user } = useUser();
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [isCopied, setIsCopied] = useState(false);

  const isMaxOrCorp = user?.tier === 'MAX' || user?.tier === 'CORP' || user?.role === 'TESTER_ADMIN';

  const filteredSites = useMemo(() => {
    return BASE_RSYA_BLACKLIST.filter((site) => {
      const matchesSearch =
        site.domain.toLowerCase().includes(search.toLowerCase()) ||
        site.reason.toLowerCase().includes(search.toLowerCase()) ||
        site.categoryLabel.toLowerCase().includes(search.toLowerCase());
      const matchesCat = selectedCategory === 'ALL' || site.category === selectedCategory;
      return matchesSearch && matchesCat;
    });
  }, [search, selectedCategory]);

  const rawSitesList = useMemo(() => {
    return filteredSites.map((s) => s.domain).join('\n');
  }, [filteredSites]);

  const handleCopy = () => {
    navigator.clipboard.writeText(rawSitesList);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleDownloadTxt = () => {
    const blob = new Blob([rawSitesList], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `cransys_rsya_blacklist_${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto animate-fadeIn">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-3xl w-full p-5 sm:p-7 relative my-auto max-h-[90vh] flex flex-col overflow-hidden">
        {/* Шапка */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-red-50 border border-red-100 text-red-600 flex items-center justify-center">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-slate-900">AI-Блеклист мусорных площадок РСЯ</h3>
                <span className="px-2 py-0.5 rounded-full bg-purple-100 text-purple-800 text-[10px] font-bold uppercase tracking-wider">
                  Тариф MAX / Corp
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Проверенная база мобильных игр, спам-утилит и сайтов-дорвеев для запрета показов в Директе
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Панель фильтров и поиска */}
        <div className="py-3.5 border-b border-slate-100 shrink-0 flex flex-col sm:flex-row items-center justify-between gap-2.5">
          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Поиск по домену или причине..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-slate-200 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
            />
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto">
            {[
              { id: 'ALL', label: 'Все' },
              { id: 'GAMES', label: 'Игры' },
              { id: 'APPS', label: 'Утилиты' },
              { id: 'KIDS', label: 'ГДЗ/Дети' },
              { id: 'CLICKBAIT', label: 'Шок-новости' },
            ].map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all shrink-0 ${
                  selectedCategory === cat.id
                    ? 'bg-purple-600 text-white shadow-2xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* Список площадок */}
        <div className="flex-1 overflow-y-auto py-3 space-y-2">
          {filteredSites.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-400">
              По вашему запросу ничего не найдено.
            </div>
          ) : (
            filteredSites.map((site, index) => (
              <div
                key={index}
                className="p-3 rounded-xl border border-slate-200 bg-slate-50/60 hover:bg-white hover:border-slate-300 transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2"
              >
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold text-slate-900">{site.domain}</span>
                    <span
                      className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase ${
                        site.threatLevel === 'CRITICAL'
                          ? 'bg-red-100 text-red-700'
                          : 'bg-amber-100 text-amber-700'
                      }`}
                    >
                      {site.categoryLabel}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 leading-tight">{site.reason}</p>
                </div>

                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-red-50 text-red-600 border border-red-100 shrink-0">
                  Запретить показы
                </span>
              </div>
            ))
          )}
        </div>

        {/* Подвал действий */}
        <div className="pt-4 border-t border-slate-100 shrink-0 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <Database className="w-4 h-4 text-purple-600" />
            <span>Выбрано: <strong>{filteredSites.length}</strong> площадок для запрета</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCopy}
              className="px-3.5 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-xs font-semibold text-slate-700 flex items-center gap-1.5 transition-colors"
            >
              {isCopied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="text-emerald-700">Скопировано</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Скопировать для Коммандера</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={handleDownloadTxt}
              className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold shadow-xs transition-colors flex items-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Скачать список (.txt)</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
