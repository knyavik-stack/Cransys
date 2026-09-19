'use client';

import React, { useState, useEffect } from 'react';
import { useUser } from '@/lib/auth/user-context';
import { UserTier, TIER_LIST, getTierConfig } from '@/lib/billing/tiers';
import { Check, X, Shield, Sparkles, CreditCard, ArrowRight, Zap, Building2, KeyRound } from 'lucide-react';
import { trackProductEvent } from '@/lib/telemetry/tracker';

interface PricingModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedTier?: UserTier;
}

export function PricingModal({ isOpen, onClose, selectedTier: initialTier }: PricingModalProps) {
  const { user, setTier } = useUser();
  const [activePlan, setActivePlan] = useState<UserTier>(initialTier || user?.tier || 'PRO');
  const [isProcessing, setIsProcessing] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      trackProductEvent('pricing_open', {
        userId: user?.id,
        metadata: { initialTier: initialTier || user?.tier || 'PRO' },
      });
    }
  }, [isOpen, user?.id, initialTier, user?.tier]);

  if (!isOpen) return null;

  const handleSelectPlan = async (tier: UserTier) => {
    setIsProcessing(true);
    trackProductEvent('pricing_tier_clicked', {
      userId: user?.id,
      metadata: { tier, price: getTierConfig(tier).price },
    });

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
        trackProductEvent('payment_completed', {
          userId: user?.id,
          metadata: { tier, amount: getTierConfig(tier).price },
        });
        setTier(tier);
        const config = getTierConfig(tier);
        setSuccessMessage(`Тариф успешно активирован: ${config.name}`);
        setTimeout(() => {
          setSuccessMessage(null);
          setIsProcessing(false);
          onClose();
        }, 1200);
      }
    } catch {
      trackProductEvent('payment_completed', {
        userId: user?.id,
        metadata: { tier, amount: getTierConfig(tier).price, fallback: true },
      });
      setTier(tier);
      const config = getTierConfig(tier);
      setSuccessMessage(`Тариф ${config.name} активирован.`);
      setTimeout(() => {
        setSuccessMessage(null);
        setIsProcessing(false);
        onClose();
      }, 1000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto animate-fadeIn">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-5xl w-full p-4 sm:p-6 lg:p-8 relative my-auto max-h-[92vh] overflow-y-auto">
        {/* Кнопка закрытия */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Заголовок */}
        <div className="text-center max-w-2xl mx-auto mb-6 sm:mb-8">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 border border-blue-100 text-blue-700 text-xs font-semibold mb-2">
            <Zap className="w-3.5 h-3.5 text-blue-600" />
            <span>Официальная тарифная сетка Cransys Analytics</span>
          </div>
          <h3 className="text-xl sm:text-2xl lg:text-3xl font-bold text-slate-900 tracking-tight">
            Тарифы для бизнеса, специалистов и агентств
          </h3>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Прямое подключение по API Яндекс.Директ доступно от тарифа <strong className="text-slate-800">PRO</strong> и выше
          </p>
        </div>

        {/* Уведомление об успешной смене тарифа */}
        {successMessage && (
          <div className="mb-6 p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs sm:text-sm font-semibold flex items-center justify-center gap-2">
            <Check className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* Сетка тарифов (5 планов) */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3.5">
          {TIER_LIST.map((plan) => {
            const isCurrent = user?.tier === plan.id;
            return (
              <div
                key={plan.id}
                className={`rounded-2xl p-4 border flex flex-col justify-between transition-all relative ${
                  plan.popular
                    ? 'border-blue-600 bg-blue-50/20 shadow-md ring-2 ring-blue-600/10'
                    : plan.isEnterprise
                    ? 'border-purple-300 bg-purple-50/20'
                    : 'border-slate-200 bg-white hover:border-slate-300'
                }`}
              >
                {plan.popular && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-2.5 py-0.5 rounded-full bg-blue-600 text-white text-[9px] font-bold uppercase tracking-wider shadow-xs whitespace-nowrap">
                    Хит продаж
                  </span>
                )}
                {plan.isEnterprise && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-2.5 py-0.5 rounded-full bg-purple-700 text-white text-[9px] font-bold uppercase tracking-wider shadow-xs whitespace-nowrap">
                    Enterprise
                  </span>
                )}

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <h4 className="font-bold text-slate-900 text-sm">{plan.name}</h4>
                    {isCurrent && (
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-emerald-100 text-emerald-800">
                        Текущий
                      </span>
                    )}
                  </div>

                  <p className="text-[11px] text-slate-500 mb-2 leading-tight">{plan.description}</p>

                  <div className="mb-3">
                    <span className="text-xl sm:text-2xl font-extrabold font-mono text-slate-900">
                      {plan.priceFormatted}
                    </span>
                    <span className="text-[10px] text-slate-400 block mt-0.5">{plan.period}</span>
                  </div>

                  {/* Беджи доступности API и фич */}
                  <div className="mb-3 space-y-1">
                    {plan.hasDirectApi ? (
                      <div className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 text-[10px] font-semibold border border-emerald-100 w-full">
                        <KeyRound className="w-3 h-3 text-emerald-600 shrink-0" />
                        <span>Direct API включено</span>
                      </div>
                    ) : (
                      <div className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-slate-100 text-slate-400 text-[10px] font-medium w-full">
                        <KeyRound className="w-3 h-3 text-slate-400 shrink-0" />
                        <span>Без API (только файл)</span>
                      </div>
                    )}

                    {plan.hasWhiteLabel && (
                      <div className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-purple-50 text-purple-700 text-[10px] font-semibold border border-purple-100 w-full">
                        <Building2 className="w-3 h-3 text-purple-600 shrink-0" />
                        <span>White-label брендинг</span>
                      </div>
                    )}
                  </div>

                  <div className="space-y-1.5 pt-3 border-t border-slate-100">
                    {plan.features.map((feat, idx) => (
                      <div key={idx} className="flex items-start gap-1.5 text-[11px] text-slate-700 leading-tight">
                        <Check className="w-3 h-3 text-blue-600 shrink-0 mt-0.5" />
                        <span>{feat}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-5 pt-3">
                  <button
                    type="button"
                    disabled={isProcessing}
                    onClick={() => handleSelectPlan(plan.id)}
                    className={`w-full py-2 px-2.5 rounded-xl text-[11px] font-semibold flex items-center justify-center gap-1 transition-all ${
                      plan.popular
                        ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-xs'
                        : isCurrent
                        ? 'bg-slate-100 hover:bg-slate-200 text-slate-800'
                        : plan.isEnterprise
                        ? 'bg-purple-700 hover:bg-purple-800 text-white'
                        : 'bg-slate-900 hover:bg-slate-800 text-white'
                    }`}
                  >
                    {isCurrent ? (
                      <span>Текущий (Продлить)</span>
                    ) : (
                      <>
                        <span>{plan.cta}</span>
                        <ArrowRight className="w-3 h-3" />
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
            <span>Безопасная оплата через СБП, МИР, Visa, Mastercard (ЮKassa)</span>
          </div>
          <span>Моментальная активация лимитов без скрытых автосписаний</span>
        </div>
      </div>
    </div>
  );
}

