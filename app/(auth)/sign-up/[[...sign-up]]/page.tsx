'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Shield,
  Mail,
  User,
  CheckCircle2,
  Lock,
  AlertCircle,
  XCircle,
  KeyRound,
  RotateCcw,
  Sparkles,
} from 'lucide-react';
import { useUser } from '@/lib/auth/user-context';
import { checkPasswordSecurity } from '@/lib/auth/password-validator';
import { Footer } from '@/components/Footer';
import { Logo } from '@/components/Logo';

export default function SignUpPage() {
  const router = useRouter();
  const { setUserProfile, updateProfile } = useUser();

  // Шаг 1: форма регистрации; Шаг 2: ввод кода подтверждения email
  const [step, setStep] = useState<'REGISTER' | 'VERIFY_EMAIL'>('REGISTER');

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [receivedDebugCode, setReceivedDebugCode] = useState<string | null>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Валидация пароля в реальном времени
  const passwordStatus = useMemo(() => {
    return checkPasswordSecurity(password);
  }, [password]);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setErrorMsg('');
    setSuccessMsg('');

    if (!passwordStatus.valid) {
      setErrorMsg(passwordStatus.errors[0] || 'Пароль не удовлетворяет требованиям безопасности');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, name }),
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        setErrorMsg(data.error || 'Ошибка при регистрации');
        setIsSubmitting(false);
        return;
      }

      // Если регистрация успешна и требуется подтверждение
      if (data.verificationCode || data.debugCode) {
        const code = data.verificationCode || data.debugCode;
        setReceivedDebugCode(code);
      }

      setSuccessMsg(data.message || 'Аккаунт зарегистрирован! Введите код подтверждения, отправленный на ваш email.');
      setStep('VERIFY_EMAIL');
      setResendCooldown(60);
    } catch (err) {
      setErrorMsg('Сетевая ошибка при подключении к серверу регистрации');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!verificationCode || verificationCode.trim().length !== 6) {
      setErrorMsg('Код подтверждения должен состоять из 6 цифр');
      return;
    }

    setIsVerifying(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const response = await fetch('/api/auth/verify-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code: verificationCode.trim() }),
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        setErrorMsg(data.error || 'Неверный код подтверждения');
        setIsVerifying(false);
        return;
      }

      setSuccessMsg('Email успешно подтвержден! Перенаправляем в личный кабинет...');

      // Сохраняем пользователя в контекст и синхронизируем
      if (data.user) {
        setUserProfile(data.user);
      }

      setTimeout(() => {
        window.location.href = '/dashboard';
      }, 500);
    } catch (err) {
      setErrorMsg('Ошибка при проверке кода подтверждения');
      setIsVerifying(false);
    }
  };

  const handleResendCode = async () => {
    if (resendCooldown > 0 || isResending) return;
    setIsResending(true);
    setErrorMsg('');

    try {
      const res = await fetch('/api/auth/resend-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();
      if (data.success) {
        if (data.verificationCode || data.debugCode) {
          const code = data.verificationCode || data.debugCode;
          setReceivedDebugCode(code);
        }
        setSuccessMsg(data.message || 'Новый код отправлен на вашу почту');
        setResendCooldown(60);
      } else {
        setErrorMsg(data.error || 'Не удалось отправить код повторно');
      }
    } catch (e) {
      setErrorMsg('Сетевая ошибка при отправке кода');
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-between bg-slate-50">
      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="max-w-md w-full bg-white rounded-2xl border border-slate-200 p-8 shadow-xs">
          <div className="text-center mb-6">
            <div className="flex justify-center mx-auto mb-3">
              <Logo size={48} />
            </div>
            <div className="flex items-center justify-center gap-2 mb-1">
              <h2 className="text-2xl font-bold text-slate-900">
                {step === 'REGISTER' ? 'Регистрация в' : 'Подтверждение Email'}
              </h2>
              {step === 'REGISTER' && (
                <span className="font-extrabold text-2xl text-[#003882] tracking-[0.14em] uppercase">CRANSYS</span>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-1">
            {step === 'REGISTER'
              ? 'Создайте защищенный аккаунт для доступа к отчетам и истории'
              : `Введите 6-значный код безопасности, отправленный на ${email}`}
          </p>
        </div>

        {errorMsg && (
          <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="mb-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {step === 'REGISTER' ? (
          <form onSubmit={handleRegister} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Ваше имя или название компании
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Иван Петров"
                  className="w-full pl-9 pr-3 py-2 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <User className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Электронная почта
              </label>
              <div className="relative">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="ivan@company.ru"
                  className="w-full pl-9 pr-3 py-2 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Пароль (требования кибербезопасности)
              </label>
              <div className="relative">
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Минимум 8 символов (A-Z, a-z, 0-9)"
                  className="w-full pl-9 pr-3 py-2 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              </div>

              {/* Индикатор требований безопасности пароля */}
              <div className="mt-2.5 p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1.5">
                <div className="text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Стандарты безопасности пароля:
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-[11px]">
                  <div
                    className={`flex items-center gap-1.5 ${
                      passwordStatus.rules.minLength ? 'text-emerald-700 font-semibold' : 'text-slate-500'
                    }`}
                  >
                    {passwordStatus.rules.minLength ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    ) : (
                      <XCircle className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    )}
                    <span>От 8 символов</span>
                  </div>

                  <div
                    className={`flex items-center gap-1.5 ${
                      passwordStatus.rules.hasUppercase ? 'text-emerald-700 font-semibold' : 'text-slate-500'
                    }`}
                  >
                    {passwordStatus.rules.hasUppercase ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    ) : (
                      <XCircle className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    )}
                    <span>Заглавная буква (A-Z)</span>
                  </div>

                  <div
                    className={`flex items-center gap-1.5 ${
                      passwordStatus.rules.hasLowercase ? 'text-emerald-700 font-semibold' : 'text-slate-500'
                    }`}
                  >
                    {passwordStatus.rules.hasLowercase ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    ) : (
                      <XCircle className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    )}
                    <span>Строчная буква (a-z)</span>
                  </div>

                  <div
                    className={`flex items-center gap-1.5 ${
                      passwordStatus.rules.hasNumber ? 'text-emerald-700 font-semibold' : 'text-slate-500'
                    }`}
                  >
                    {passwordStatus.rules.hasNumber ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    ) : (
                      <XCircle className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    )}
                    <span>Цифра (0-9)</span>
                  </div>

                  <div
                    className={`flex items-center gap-1.5 sm:col-span-2 ${
                      passwordStatus.rules.isLatinOnly && password.length > 0
                        ? 'text-emerald-700 font-semibold'
                        : 'text-slate-500'
                    }`}
                  >
                    {passwordStatus.rules.isLatinOnly && password.length > 0 ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    ) : (
                      <XCircle className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    )}
                    <span>Только символы латиницы (без кириллицы)</span>
                  </div>
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting || !passwordStatus.valid}
              className={`w-full py-2.5 px-4 rounded-xl text-white font-semibold text-sm transition-all shadow-xs mt-2 ${
                passwordStatus.valid && !isSubmitting
                  ? 'bg-blue-600 hover:bg-blue-700 cursor-pointer'
                  : 'bg-slate-400 cursor-not-allowed opacity-75'
              }`}
            >
              {isSubmitting ? 'Проверка безопасности и создание...' : 'Продолжить регистрацию'}
            </button>

            <p className="text-[11px] text-slate-500 text-center leading-normal pt-1">
              Нажимая кнопку, вы соглашаетесь с{' '}
              <Link href="/legal/terms" className="text-blue-600 hover:underline">
                Пользовательским соглашением
              </Link>
              ,{' '}
              <Link href="/legal/privacy" className="text-blue-600 hover:underline">
                Политикой конфиденциальности
              </Link>{' '}
              и даете{' '}
              <Link href="/legal/consent" className="text-blue-600 hover:underline">
                согласие на обработку персональных данных (152-ФЗ)
              </Link>
              .
            </p>
          </form>
        ) : (
          /* Шаг 2: Подтверждение Email */
          <form onSubmit={handleVerifyCode} className="space-y-4">
            {receivedDebugCode && (
              <div className="p-3.5 rounded-xl bg-blue-50 border border-blue-200 text-blue-900 text-xs flex items-start gap-2.5">
                <Sparkles className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold">Код верификации: </span>
                  <span className="font-mono text-sm font-bold bg-white px-2 py-0.5 rounded border border-blue-300">
                    {receivedDebugCode}
                  </span>
                  <p className="text-[11px] text-blue-700 mt-1">
                    Код сгенерирован системой безопасности для подтверждения email.
                  </p>
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                6-значный код подтверждения
              </label>
              <div className="relative">
                <input
                  type="text"
                  maxLength={6}
                  required
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ''))}
                  placeholder="000000"
                  className="w-full pl-9 pr-3 py-2 text-center tracking-widest font-mono text-lg rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent font-bold"
                />
                <KeyRound className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
              </div>
            </div>

            <button
              type="submit"
              disabled={isVerifying || verificationCode.length !== 6}
              className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm transition-colors shadow-xs"
            >
              {isVerifying ? 'Проверяем код...' : 'Подтвердить Email и войти'}
            </button>

            <div className="flex items-center justify-between text-xs pt-2">
              <button
                type="button"
                onClick={handleResendCode}
                disabled={resendCooldown > 0 || isResending}
                className="text-blue-600 hover:underline font-semibold flex items-center gap-1 disabled:text-slate-400 disabled:no-underline"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>{resendCooldown > 0 ? `Повтор через ${resendCooldown} сек` : 'Отправить код еще раз'}</span>
              </button>

              <button
                type="button"
                onClick={() => setStep('REGISTER')}
                className="text-slate-500 hover:text-slate-700 underline text-xs"
              >
                Изменить email
              </button>
            </div>
          </form>
        )}

        <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-[11px] text-slate-600 flex items-start gap-2.5 my-6">
          <Shield className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
          <span>
            Защита аккаунта по ГОСТ/OWASP: пароли хешируются с солью, сессия изолирована, аудит и данные сохраняются в надежной БД Neon.
          </span>
        </div>

          <div className="text-center space-y-2">
            <p className="text-xs text-slate-500">
              Уже есть аккаунт?{' '}
              <Link href="/sign-in" className="text-blue-600 font-semibold hover:underline">
                Войти
              </Link>
            </p>
            <div>
              <Link
                href="/"
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Вернуться на главную</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
