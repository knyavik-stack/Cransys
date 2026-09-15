'use client';

import React, { useState } from 'react';
import { useUser } from '@/lib/auth/user-context';
import { Check, X, Shield, Sparkles, CreditCard, ArrowRight, Zap } from 'lucide-react';

interface PricingModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedTier?: 'EXPRESS' | 'PRO' | 'MAX';
}

export function PricingModal({ isOpen, onClose, selectedTier: initialTier }: PricingModalProps) {
  const { user, setTier } = useUser();
  const [activePlan, setActivePlan] = useState<'EXPRESS' | 'PRO' | 'MAX'>(initialTier || user?.tier || 'PRO');
  const [isProcessing, setIsProcessing] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSelectPlan = async (tier: 'EXPRESS' | 'PRO' | 'MAX') => {
    setIsProcessing(true);
    // Имитация / вызов платежного шлюза
    try {
      const res = await fetch('/api/billing/create-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tier,
          userId: user?.id || 'guest_user',
          userEmail: user?.email || 'guest@cransys-test.ru',
        }),
      });
      const data = await res.json();
      if (data.success) {
        setTier(tier);
        setSuccessMessage(`Тариф успешно активирован: ${tier === 'EXPRESS' ? 'Экспресс' : tier === 'PRO' ? 'PRO' : 'MAX (White-label)'}`);
        setTimeout(() => {
          setSuccessMessage(null);
          setIsProcessing(false);
          onClose();
        }, 1200);
      }
    } catch {
      // Fallback
      setTier(tier);
      setSuccessMessage(`Тариф ${tier} активирован.`);
      setTimeout(() => {
        setSuccessMessage(null);
        setIsProcessing(false);
        onClose();
      }, 1000);
    }
  };

  const plans = [
    {
      id: 'EXPRESS' as const,
      name: 'Экспресс',
      price: '990 ₽',
      period: 'разовый аудит',
      description: 'Быстрый независимый срез для собственника',
      features: [
        'Аудит по 6 критическим правилам сливов',
        'Оценка мобильного и РСЯ перекоса',
        'Готовое ТЗ подрядчику с точными цифрами',
        'Экспорт базового PDF-отчета',
      ],
      popular: false,
      cta: 'Выбрать Экспресс',
    },
    {
      id: 'PRO' as const,
      name: 'PRO',
      price: '2 990 ₽',
      period: 'в месяц',
      description: 'Для предпринимателей и маркетологов',
      features: [
        'Все возможности Экспресс-тарифа',
        'Глубокий AI-анализ на базе Gemini',
        'Кластеризация поисковых фраз и минус-слова',
        'Интерактивный симулятор окупаемости',
        'История проверок в защищенном облаке',
      ],
      popular: true,
      cta: 'Подключить PRO',
    },
    {
      id: 'MAX' as const,
      name: 'MAX / White-label',
      price: '6 990 ₽',
      period: 'в месяц',
      description: 'Для агентств, директологов и консультантов',
      features: [
        'Все возможности тарифа PRO',
        'White-label: кастомный логотип и контакты в PDF',
        'Брендированные коммерческие КП для клиентов',
        'AI-блеклист паразитных площадок и игр РСЯ',
        'Безлимитный доступ и приоритетная поддержка',
      ],
      popular: false,
      cta: 'Активировать MAX',
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto animate-fadeIn">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-4xl w-full p-4 sm:p-6 lg:p-8 relative my-auto">
        {/* Кнопка закрытия */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Заголовок */}
        <div className="text-center max-w-xl mx-auto mb-6 sm:mb-8">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 border border-blue-100 text-blue-700 text-xs font-semibold mb-2">
            <Zap className="w-3.5 h-3.5 text-blue-600" />
            <span>Прозрачные тарифы без скрытых списаний</span>
          </div>
          <h3 className="text-xl sm:text-2xl lg:text-3xl font-bold text-slate-900 tracking-tight">
            Инвестируйте в сохранение рекламного бюджета
          </h3>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Один найденный слив в Директе окупает годовую подписку в первые 48 часов
          </p>
        </div>

        {/* Уведомление об успешной смене тарифа */}
        {successMessage && (
          <div className="mb-6 p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs sm:text-sm font-semibold flex items-center justify-center gap-2">
            <Check className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* Карточки планов */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {plans.map((plan) => {
            const isCurrent = user?.tier === plan.id;
            return (
              <div
                key={plan.id}
                className={`rounded-2xl p-5 border flex flex-col justify-between transition-all relative ${
                  plan.popular
                    ? 'border-blue-600 bg-blue-50/20 shadow-md ring-2 ring-blue-600/10'
                    : 'border-slate-200 bg-white hover:border-slate-300'
                }`}
              >
                {plan.popular && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-blue-600 text-white text-[10px] font-bold uppercase tracking-wider shadow-xs">
                    Популярный выбор
                  </span>
                )}

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-bold text-slate-900 text-base">{plan.name}</h4>
                    {isCurrent && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800">
                        Текущий
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 mb-4 min-h-[32px]">{plan.description}</p>

                  <div className="mb-5">
                    <span className="text-2xl sm:text-3xl font-extrabold font-mono text-slate-900">
                      {plan.price}
                    </span>
                    <span className="text-xs text-slate-500 ml-1.5">/ {plan.period}</span>
                  </div>

                  <div className="space-y-2.5 pt-4 border-t border-slate-100">
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 block mb-2">
                      Что входит:
                    </span>
                    {plan.features.map((feat, idx) => (
                      <div key={idx} className="flex items-start gap-2 text-xs text-slate-700">
                        <Check className="w-3.5 h-3.5 text-blue-600 shrink-0 mt-0.5" />
                        <span>{feat}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-6 pt-4">
                  <button
                    type="button"
                    disabled={isProcessing}
                    onClick={() => handleSelectPlan(plan.id)}
                    className={`w-full py-2.5 px-4 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                      plan.popular
                        ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-xs'
                        : isCurrent
                        ? 'bg-slate-100 hover:bg-slate-200 text-slate-800'
                        : 'bg-slate-900 hover:bg-slate-800 text-white'
                    }`}
                  >
                    {isCurrent ? (
                      <span>Текущий тариф (Продлить)</span>
                    ) : (
                      <>
                        <span>{plan.cta}</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Защита и гарантии */}
        <div className="mt-6 pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between text-[11px] text-slate-400 gap-2">
          <div className="flex items-center gap-1.5">
            <Shield className="w-3.5 h-3.5 text-emerald-600" />
            <span>Безопасная оплата через СБП, МИР, Visa, Mastercard</span>
          </div>
          <span>Без автосписаний без вашего подтверждения</span>
        </div>
      </div>
    </div>
  );
}
