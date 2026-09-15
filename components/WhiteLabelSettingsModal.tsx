'use client';

import React, { useState } from 'react';
import { useUser } from '@/lib/auth/user-context';
import { X, Building2, Phone, Globe, FileText, Check, Sparkles } from 'lucide-react';

interface WhiteLabelSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function WhiteLabelSettingsModal({ isOpen, onClose }: WhiteLabelSettingsModalProps) {
  const { user, updateProfile } = useUser();
  const [agencyName, setAgencyName] = useState(user?.agencyName || '');
  const [agencyContact, setAgencyContact] = useState(user?.agencyContact || '');
  const [agencyWebsite, setAgencyWebsite] = useState(user?.agencyWebsite || '');
  const [customNotes, setCustomNotes] = useState(user?.customNotes || '');
  const [saved, setSaved] = useState(false);

  if (!isOpen) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfile({
      agencyName,
      agencyContact,
      agencyWebsite,
      customNotes,
    });
    setSaved(true);
    setTimeout(() => {
      setSaved(false);
      onClose();
    }, 1000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto animate-fadeIn">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-lg w-full p-4 sm:p-6 relative my-auto">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2.5 mb-4">
          <div className="w-10 h-10 rounded-xl bg-purple-50 border border-purple-100 flex items-center justify-center text-purple-600">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900">White-label брендинг отчета</h3>
            <p className="text-xs text-slate-500">Укажите данные агентства для отображения в PDF-отчете</p>
          </div>
        </div>

        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Название агентства или имя эксперта:
            </label>
            <div className="relative">
              <input
                type="text"
                value={agencyName}
                onChange={(e) => setAgencyName(e.target.value)}
                placeholder="Например: Digital-агентство «ТрафикПро»"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Контакты (Telegram / Телефон):
              </label>
              <input
                type="text"
                value={agencyContact}
                onChange={(e) => setAgencyContact(e.target.value)}
                placeholder="@agency_lead или +7 999 000-00-00"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Сайт или портфолио:
              </label>
              <input
                type="text"
                value={agencyWebsite}
                onChange={(e) => setAgencyWebsite(e.target.value)}
                placeholder="agency.ru"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Вводный комментарий эксперта (отобразится вверху PDF):
            </label>
            <textarea
              rows={3}
              value={customNotes}
              onChange={(e) => setCustomNotes(e.target.value)}
              placeholder="Например: «Провели технический аудит рекламы. Обнаружен критический перекос в РСЯ. Предлагаем план корректировок с гарантией окупаемости.»"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 resize-none"
            />
          </div>

          <div className="p-3 rounded-xl bg-purple-50/60 border border-purple-100 text-[11px] text-purple-900 flex items-start gap-2">
            <Sparkles className="w-4 h-4 text-purple-600 shrink-0 mt-0.5" />
            <span>
              Данные будут автоматически подставлены в титульный лист и колонтитулы при экспорте в PDF.
            </span>
          </div>

          <div className="pt-2 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
            >
              Отмена
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl text-xs font-semibold text-white bg-purple-600 hover:bg-purple-700 shadow-xs flex items-center gap-1.5 transition-all"
            >
              {saved ? (
                <>
                  <Check className="w-4 h-4 text-white" />
                  <span>Сохранено!</span>
                </>
              ) : (
                <span>Сохранить брендинг</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
