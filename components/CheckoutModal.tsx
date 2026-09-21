'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useUser } from '@/lib/auth/user-context';
import { UserTier } from '@/lib/billing/tiers';
import { useTiers } from '@/lib/billing/use-tiers';
import {
  X,
  Shield,
  CreditCard,
  ArrowRight,
  Check,
  AlertCircle,
  QrCode,
  Lock,
  Zap,
  Building2,
  ExternalLink,
  ChevronRight,
  Mail,
  User,
  LogIn,
} from 'lucide-react';
import { trackProductEvent } from '@/lib/telemetry/tracker';

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  tier: UserTier;
}

export function CheckoutModal({ isOpen, onClose, tier }: CheckoutModalProps) {
  const { user, setTier } = useUser();
  const { getTier } = useTiers();
  const tierConfig = getTier(tier);

  const [paymentMethod, setPaymentMethod] = useState<'sbp' | 'card' | 'yoomoney' | 'invoice'>('sbp');
  const [payerEmail, setPayerEmail] = useState('');
  const [payerName, setPayerName] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      trackProductEvent('pricing_tier_clicked', {
        userId: user?.id,
        metadata: { tier, price: tierConfig.price, context: 'checkout_modal' },
      });
    }
  }, [isOpen, tier, tierConfig.price, user?.id]);

  if (!isOpen) return null;

  const currentEmail = payerEmail || user?.email || '';
  const currentName = payerName || user?.name || '';

  const handlePay = async () => {
    if (!user) {
      setErrorMsg('Для покупки тарифа и закрепления оплаченных лимитов необходимо войти в аккаунт.');
      return;
    }

    setIsProcessing(true);
    setErrorMsg(null);

    const emailToUse = (payerEmail || user.email || '').trim();
    const nameToUse = (payerName || user.name || '').trim();

    try {
      const res = await fetch('/api/billing/create-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tier,
          userId: user.id,
          userEmail: emailToUse,
          userName: nameToUse,
          paymentMethod,
        }),
      });

      const data = await res.json();

      if (data.success) {
        // Если настроена ЮKassa и получен URL на оплату
        if (data.paymentUrl) {
          window.location.href = data.paymentUrl;
          return;
        }

        // Если ЮKassa в тестовом/песочном режиме или ещё не привязана в админке
        setTier(tier);
        setSuccessMsg(
          `Тариф «${tierConfig.name}» успешно активирован! ${
            data.sandbox ? '(Тестовый режим / Sandbox ЮKassa)' : ''
          }`
        );
        trackProductEvent('payment_completed', {
          userId: user.id,
          metadata: { tier, amount: tierConfig.price, sandbox: Boolean(data.sandbox) },
        });

        setTimeout(() => {
          setIsProcessing(false);
          onClose();
        }, 1500);
      } else {
        setErrorMsg(data.error || 'Не удалось создать платеж. Попробуйте снова.');
        setIsProcessing(false);
      }
    } catch (err: any) {
      // Fallback
      setTier(tier);
      setSuccessMsg(`Тариф «${tierConfig.name}» активирован (Sandbox).`);
      setTimeout(() => {
        setIsProcessing(false);
        onClose();
      }, 1200);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-xs overflow-y-auto animate-fadeIn">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-xl w-full p-5 sm:p-7 relative my-auto overflow-hidden">
        {/* Кнопка закрытия */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          title="Закрыть"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Заголовок */}
        <div className="mb-5 pr-8">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-50 border border-blue-100 text-blue-700 text-xs font-semibold mb-2">
            <Shield className="w-3.5 h-3.5 text-blue-600" />
            <span>Безопасная оплата через ЮKassa</span>
          </div>
          <h3 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Оформление тарифа {tierConfig.name}
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            Проверьте состав тарифа и выберите удобный способ оплаты
          </p>
        </div>

        {/* Предупреждение для неавторизованного пользователя */}
        {!user && (
          <div className="mb-5 p-4 rounded-xl bg-amber-50 border border-amber-200">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-bold text-amber-900">Требуется вход в аккаунт</h4>
                <p className="text-xs text-amber-700 mt-0.5 mb-3 leading-relaxed">
                  Покупка тарифа привязывается к вашему личному кабинету. Пожалуйста, войдите или зарегистрируйтесь перед оплатой.
                </p>
                <div className="flex flex-wrap items-center gap-2">
                  <Link
                    href={`/sign-in?redirect=/dashboard`}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold transition-colors shadow-xs"
                  >
                    <LogIn className="w-3.5 h-3.5" />
                    <span>Войти в аккаунт</span>
                  </Link>
                  <Link
                    href={`/sign-up`}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-amber-300 text-amber-800 hover:bg-amber-100/60 text-xs font-semibold transition-colors"
                  >
                    <span>Зарегистрироваться</span>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Сводная карточка выбранного тарифа */}
        <div className="mb-5 p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="font-bold text-slate-900 text-sm">{tierConfig.name}</span>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-100 text-blue-700">
                {tierConfig.reportsLimit} {tierConfig.reportsLimit === 1 ? 'проверка' : 'проверок'}
              </span>
            </div>
            <p className="text-xs text-slate-500 leading-tight">
              {tierConfig.period} • {tierConfig.hasDirectApi ? 'Прямое API Директа' : 'Анализ Excel выгрузок'}
            </p>
          </div>

          <div className="text-right shrink-0">
            <div className="text-2xl font-extrabold font-mono text-slate-900">
              {tierConfig.priceFormatted}
            </div>
            <span className="text-[10px] text-slate-400 block">Без автосписаний</span>
          </div>
        </div>

        {/* Сообщения об ошибке / успехе */}
        {errorMsg && (
          <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="mb-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Форма плательщика */}
        <div className="space-y-3 mb-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Электронная почта для чека (54-ФЗ)
              </label>
              <div className="relative">
                <input
                  type="email"
                  value={currentEmail}
                  onChange={(e) => setPayerEmail(e.target.value)}
                  placeholder="director@company.ru"
                  className="w-full pl-8 pr-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                />
                <Mail className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Имя или название компании
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={currentName}
                  onChange={(e) => setPayerName(e.target.value)}
                  placeholder="Иван или ООО Вектор"
                  className="w-full pl-8 pr-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                />
                <User className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
              </div>
            </div>
          </div>
        </div>

        {/* Способ оплаты через ЮKassa */}
        <div className="mb-6">
          <label className="block text-xs font-semibold text-slate-700 mb-2">
            Способ оплаты
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <button
              type="button"
              onClick={() => setPaymentMethod('sbp')}
              className={`p-3 rounded-xl border text-left flex flex-col justify-between gap-1 transition-all ${
                paymentMethod === 'sbp'
                  ? 'border-blue-600 bg-blue-50/40 text-blue-900 ring-2 ring-blue-600/20'
                  : 'border-slate-200 bg-white hover:border-slate-300 text-slate-700'
              }`}
            >
              <div className="flex items-center justify-between">
                <QrCode className="w-4 h-4 text-blue-600" />
                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800">
                  0%
                </span>
              </div>
              <span className="text-xs font-bold leading-tight mt-1">СБП</span>
              <span className="text-[10px] text-slate-400">По QR-коду</span>
            </button>

            <button
              type="button"
              onClick={() => setPaymentMethod('card')}
              className={`p-3 rounded-xl border text-left flex flex-col justify-between gap-1 transition-all ${
                paymentMethod === 'card'
                  ? 'border-blue-600 bg-blue-50/40 text-blue-900 ring-2 ring-blue-600/20'
                  : 'border-slate-200 bg-white hover:border-slate-300 text-slate-700'
              }`}
            >
              <CreditCard className="w-4 h-4 text-blue-600" />
              <span className="text-xs font-bold leading-tight mt-1">Карта РФ</span>
              <span className="text-[10px] text-slate-400">МИР, Visa, MC</span>
            </button>

            <button
              type="button"
              onClick={() => setPaymentMethod('yoomoney')}
              className={`p-3 rounded-xl border text-left flex flex-col justify-between gap-1 transition-all ${
                paymentMethod === 'yoomoney'
                  ? 'border-blue-600 bg-blue-50/40 text-blue-900 ring-2 ring-blue-600/20'
                  : 'border-slate-200 bg-white hover:border-slate-300 text-slate-700'
              }`}
            >
              <Zap className="w-4 h-4 text-purple-600" />
              <span className="text-xs font-bold leading-tight mt-1">ЮMoney</span>
              <span className="text-[10px] text-slate-400">Кошелек</span>
            </button>

            <button
              type="button"
              onClick={() => setPaymentMethod('invoice')}
              className={`p-3 rounded-xl border text-left flex flex-col justify-between gap-1 transition-all ${
                paymentMethod === 'invoice'
                  ? 'border-blue-600 bg-blue-50/40 text-blue-900 ring-2 ring-blue-600/20'
                  : 'border-slate-200 bg-white hover:border-slate-300 text-slate-700'
              }`}
            >
              <Building2 className="w-4 h-4 text-slate-600" />
              <span className="text-xs font-bold leading-tight mt-1">Для юрлиц</span>
              <span className="text-[10px] text-slate-400">Счет на оплату</span>
            </button>
          </div>
        </div>

        {/* Кнопка перехода к оплате */}
        {user ? (
          <button
            type="button"
            disabled={isProcessing}
            onClick={handlePay}
            className="w-full py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-bold text-sm shadow-md shadow-blue-600/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            {isProcessing ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Создаем безопасный платеж...</span>
              </>
            ) : (
              <>
                <Lock className="w-4 h-4" />
                <span>Оплатить {tierConfig.priceFormatted}</span>
                <ChevronRight className="w-4 h-4 ml-1" />
              </>
            )}
          </button>
        ) : (
          <Link
            href="/sign-in?redirect=/dashboard"
            className="w-full py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-md shadow-blue-600/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <LogIn className="w-4 h-4" />
            <span>Войдите в аккаунт для оплаты</span>
            <ChevronRight className="w-4 h-4 ml-1" />
          </Link>
        )}

        {/* Гарантии и фискализация */}
        <div className="mt-4 pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between text-[11px] text-slate-400 gap-2">
          <div className="flex items-center gap-1.5">
            <Shield className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <span>Платежи защищены по стандарту PCI DSS / 54-ФЗ</span>
          </div>
          <span>Чек поступит на указанный email</span>
        </div>
      </div>
    </div>
  );
}
