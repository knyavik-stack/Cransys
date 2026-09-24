'use client';

import React, { useState } from 'react';
import {
  X,
  Building2,
  Phone,
  Globe,
  FileText,
  Printer,
  Copy,
  Check,
  Sparkles,
  ShieldAlert,
  TrendingUp,
  DollarSign,
  CheckCircle2,
} from 'lucide-react';
import { useUser } from '@/lib/auth/user-context';
import { AuditReportData } from '@/lib/audit/types';

interface CommercialProposalModalProps {
  isOpen: boolean;
  onClose: () => void;
  report: AuditReportData;
  clientName?: string;
}

export function CommercialProposalModal({
  isOpen,
  onClose,
  report,
  clientName = 'Уважаемый партнер',
}: CommercialProposalModalProps) {
  const { user } = useUser();
  const [servicePrice, setServicePrice] = useState<string>('35 000');
  const [targetClient, setTargetClient] = useState<string>(clientName);
  const [isCopied, setIsCopied] = useState<boolean>(false);

  if (!isOpen) return null;

  const agencyName = user?.agencyName || 'Digital-агентство полного цикла';
  const agencyContact = user?.agencyContact || '+7 (999) 000-00-00 / @agency_lead';
  const agencyWebsite = user?.agencyWebsite || 'agency.ru';

  const flaggedRules = report.rules.filter((r) => r.flagged);
  const savedBudget = report.totalLossRub;

  const proposalText = `КОММЕРЧЕСКОЕ ПРЕДЛОЖЕНИЕ
по оптимизации рекламных кампаний Яндекс.Директ

От: ${agencyName}
Контакты: ${agencyContact} | ${agencyWebsite}
Кому: ${targetClient}
Дата: ${new Date().toLocaleDateString('ru-RU')}

1. РЕЗУЛЬТАТЫ ЭКСПЕРТНОГО АУДИТА:
В ходе независимого аудита рекламного кабинета зафиксировано:
- Общий анализируемый бюджет: ${report.totalSpendRub.toLocaleString('ru-RU')} ₽
- Зафиксированный слив на нецелевых показах: ${report.totalLossRub.toLocaleString('ru-RU')} ₽ / мес.
- Текущий индекс качества кампаний: ${report.overallScore}/100

Ключевые точки потерь:
${flaggedRules.map((r, i) => `${i + 1}. ${r.title} (~${r.estimatedLossRub.toLocaleString('ru-RU')} ₽)`).join('\n')}

2. ЧТО МЫ ПРЕДЛАГАЕМ СДЕЛАТЬ:
- Разделить показы на Поиске и в сетях (РСЯ) для защиты бюджета от случайных кликов.
- Применить корректировки ставок на мобильные устройства (-50% / -100%).
- Заблокировать 10 000+ мусорных площадок РСЯ (детские игры, спам-приложения).
- Настроить оптимизацию автостратегий с оплатой за подтвержденные заявки (CPA).

3. ОЖИДАЕМЫЙ БИЗНЕС-ЭФФЕКТ:
- Сохранение бюджета: до ${savedBudget.toLocaleString('ru-RU')} ₽ ежемесячно.
- Рост количества целевых обращений: на +35% ... +60% без увеличения расходов.
- Снижение стоимости привлечения клиента (CPA): на 30–50%.

4. СТОИМОСТЬ И СРОКИ КОМПЛЕКСНОЙ НАСТРОЙКИ:
- Стоимость работ по оптимизации: ${servicePrice} ₽ (единоразово).
- Срок внедрения всех правок: 3–5 рабочих дней.

Готовы приступить к работе и согласовать план действий!
С уважением, ${agencyName}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(proposalText);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto animate-fadeIn">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-3xl w-full p-5 sm:p-7 relative my-auto max-h-[92vh] flex flex-col overflow-hidden">
        {/* Шапка */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-purple-50 border border-purple-100 text-purple-600 flex items-center justify-center">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-slate-900">Брендированное Коммерческое Предложение (КП)</h3>
                <span className="px-2 py-0.5 rounded-full bg-purple-100 text-purple-800 text-[10px] font-bold uppercase tracking-wider">
                  White-label
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Готовое персонализированное предложение для отправки клиенту от имени вашего агентства
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

        {/* Настройки параметров КП */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 py-3.5 border-b border-slate-100 shrink-0 bg-purple-50/40 -mx-5 sm:-mx-7 px-5 sm:px-7">
          <div>
            <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
              Клиент / Заказчик (Кому):
            </label>
            <input
              type="text"
              value={targetClient}
              onChange={(e) => setTargetClient(e.target.value)}
              placeholder="ООО «СтройГрупп» / Иван Иванович"
              className="w-full px-3 py-1.5 rounded-xl border border-slate-200 text-xs text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-purple-500/20"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
              Стоимость услуг оптимизации (₽):
            </label>
            <input
              type="text"
              value={servicePrice}
              onChange={(e) => setServicePrice(e.target.value)}
              placeholder="35 000"
              className="w-full px-3 py-1.5 rounded-xl border border-slate-200 text-xs text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-purple-500/20"
            />
          </div>
        </div>

        {/* Текст КП с красивым отображением */}
        <div className="flex-1 overflow-y-auto py-4 space-y-4 font-mono text-xs leading-relaxed bg-slate-50 p-4 rounded-xl border border-slate-200 whitespace-pre-wrap select-all text-slate-800">
          {proposalText}
        </div>

        {/* Подвал с кнопками */}
        <div className="pt-4 border-t border-slate-100 shrink-0 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <Building2 className="w-4 h-4 text-purple-600" />
            <span>Оформлено с реквизитами: <strong>{agencyName}</strong></span>
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
                  <span>Скопировать КП</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={() => window.print()}
              className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold shadow-xs transition-colors flex items-center gap-1.5"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Печать / В PDF</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
