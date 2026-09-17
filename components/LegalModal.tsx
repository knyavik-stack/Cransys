'use client';

import React from 'react';
import { X, Shield, FileText, CheckCircle2, Lock, Scale } from 'lucide-react';

export type LegalDocType = 'privacy' | 'terms' | 'consent';

interface LegalModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialDoc?: LegalDocType;
}

export function LegalModal({ isOpen, onClose, initialDoc = 'privacy' }: LegalModalProps) {
  const [selectedDoc, setSelectedDoc] = React.useState<LegalDocType | null>(null);
  const activeDoc = selectedDoc || initialDoc;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto animate-fadeIn">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-4xl w-full p-4 sm:p-6 lg:p-8 relative my-auto max-h-[90vh] flex flex-col">
        {/* Шапка модального окна */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-200 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-xs">
              <Scale className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
                Правовая информация Cransys
              </h3>
              <p className="text-[11px] text-slate-500">
                Официальные регламенты и требования 152-ФЗ РФ
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

        {/* Переключатель вкладок документов */}
        <div className="flex items-center gap-1.5 py-3 border-b border-slate-100 overflow-x-auto shrink-0">
          <button
            type="button"
            onClick={() => setSelectedDoc('privacy')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors flex items-center gap-1.5 ${
              activeDoc === 'privacy'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:text-slate-900 hover:bg-slate-200'
            }`}
          >
            <Shield className="w-3.5 h-3.5" />
            <span>Политика конфиденциальности</span>
          </button>

          <button
            type="button"
            onClick={() => setSelectedDoc('terms')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors flex items-center gap-1.5 ${
              activeDoc === 'terms'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:text-slate-900 hover:bg-slate-200'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Пользовательское соглашение</span>
          </button>

          <button
            type="button"
            onClick={() => setSelectedDoc('consent')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors flex items-center gap-1.5 ${
              activeDoc === 'consent'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:text-slate-900 hover:bg-slate-200'
            }`}
          >
            <Lock className="w-3.5 h-3.5" />
            <span>152-ФЗ Согласие</span>
          </button>
        </div>

        {/* Контент документа */}
        <div className="flex-1 overflow-y-auto py-4 px-1 text-xs text-slate-700 leading-relaxed space-y-4">
          {activeDoc === 'privacy' && (
            <div className="space-y-4">
              <div className="p-3 bg-blue-50/70 border border-blue-100 rounded-xl text-blue-900 text-xs">
                <strong>Политика обработки персональных данных (152-ФЗ РФ)</strong>
                <p className="text-[11px] text-blue-800 mt-0.5">Редакция от 16 сентября 2026 года. Действует для сервиса Cransys Direct Analytics.</p>
              </div>

              <div>
                <h4 className="font-bold text-slate-900 text-sm mb-1">1. Общие положения</h4>
                <p>
                  1.1. Настоящая Политика конфиденциальности определяет порядок обработки и защиты персональной информации пользователей сервиса Cransys (далее — «Оператор»), зарегистрированных на сайте и использующих функционал автоматизированного анализа рекламных кампаний Яндекс.Директ.
                </p>
                <p className="mt-1">
                  1.2. Оператор ставит важнейшей целью и условием осуществления своей деятельности соблюдение прав и свобод человека и гражданина при обработке его персональных данных, в том числе защиты прав на неприкосновенность частной жизни, личную и семейную тайну в соответствии с Федеральным законом РФ № 152-ФЗ «О персональных данных».
                </p>
              </div>

              <div>
                <h4 className="font-bold text-slate-900 text-sm mb-1">2. Обрабатываемые данные и принцип Zero-Retention</h4>
                <p>
                  2.1. Оператор обрабатывает следующие категории данных:
                </p>
                <ul className="list-disc list-inside space-y-1 pl-2 text-slate-600 mt-1">
                  <li>Адрес электронной почты (Email) — для авторизации, отправки кодов верификации и системных уведомлений;</li>
                  <li>Имя пользователя / Название агентства — для персонализации отчетов и White-label PDF;</li>
                  <li>Обезличенные статистические выгрузки Яндекс.Директ (CSV/XLSX), загружаемые пользователем либо получаемые через Direct API v5 по явной OAuth-авторизации.</li>
                </ul>
                <p className="mt-2">
                  2.2. <strong>Обезличенность маркетинговых данных:</strong> Загружаемые отчеты Яндекс.Директ содержат исключительно агрегированные показатели рекламы (клики, показы, фразы, CPC, расход, площадки) и не содержат персональных данных конечных потребителей товаров или услуг Пользователя.
                </p>
              </div>

              <div>
                <h4 className="font-bold text-slate-900 text-sm mb-1">3. Безопасность и хранение данных</h4>
                <p>
                  3.1. Все данные передаются по защищенным каналам связи с использованием протокола TLS 1.3 и криптографического шифрования AES-256.
                </p>
                <p className="mt-1">
                  3.2. Базы данных сервиса размещены на территории Российской Федерации и соответствуют требованиям ст. 18 Федерального закона № 152-ФЗ.
                </p>
                <p className="mt-1">
                  3.3. Оператор обязуется не передавать полученные персональные данные третьим лицам, за исключением случаев, прямо предусмотренных действующим законодательством РФ.
                </p>
              </div>

              <div>
                <h4 className="font-bold text-slate-900 text-sm mb-1">4. Права субъекта данных и контакты</h4>
                <p>
                  Пользователь имеет право в любой момент отозвать согласие на обработку персональных данных или потребовать их удаления из базы данных, направив запрос на официальный электронный адрес: <strong className="text-blue-700">cransys@yandex.ru</strong>.
                </p>
              </div>
            </div>
          )}

          {activeDoc === 'terms' && (
            <div className="space-y-4">
              <div className="p-3 bg-slate-100 border border-slate-200 rounded-xl text-slate-900 text-xs">
                <strong>Пользовательское соглашение и условия предоставления сервиса</strong>
                <p className="text-[11px] text-slate-600 mt-0.5">Публичная оферта на использование SaaS-платформы Cransys Direct Analytics.</p>
              </div>

              <div>
                <h4 className="font-bold text-slate-900 text-sm mb-1">1. Предмет соглашения</h4>
                <p>
                  1.1. Сервис Cransys предоставляет Пользователю программный комплекс для независимого аудита, выявления неэффективных расходов, перекосов в мобильном трафике, паразитных площадок РСЯ и формирования рекомендаций по рекламе Яндекс.Директ.
                </p>
                <p className="mt-1">
                  1.2. Использование сервиса регулируется настоящим Соглашением и законодательством Российской Федерации.
                </p>
              </div>

              <div>
                <h4 className="font-bold text-slate-900 text-sm mb-1">2. Порядок использования и тарифы</h4>
                <p>
                  2.1. Доступ к базовому ДЕМО-аудиту предоставляется на ознакомительной основе без взимания платы.
                </p>
                <p className="mt-1">
                  2.2. Полные расширенные аудиты, доступ к Direct API, White-label PDF и AI-аналитике предоставляются в соответствии с выбранным тарифным планом (Экспресс, Экспресс Пакет, PRO, MAX, Corporate).
                </p>
                <p className="mt-1">
                  2.3. Оплата производится банковскими картами через защищенный шлюз ЮKassa / Банковский эквайринг РФ.
                </p>
              </div>

              <div>
                <h4 className="font-bold text-slate-900 text-sm mb-1">3. Ограничение ответственности</h4>
                <p>
                  3.1. Cransys является независимым алгоритмическим инструментом аналитики и не является официальным продуктом ООО «ЯНДЕКС».
                </p>
                <p className="mt-1">
                  3.2. Рекомендации алгоритмов и AI-ассистента носят аналитический характер. Окончательное решение о применении корректировок ставок и минус-фраз в рекламном кабинете принимает Пользователь.
                </p>
              </div>

              <div>
                <h4 className="font-bold text-slate-900 text-sm mb-1">4. Служба поддержки</h4>
                <p>
                  По всем техническим и организационным вопросам: <strong className="text-blue-700">cransys@yandex.ru</strong>.
                </p>
              </div>
            </div>
          )}

          {activeDoc === 'consent' && (
            <div className="space-y-4">
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-900 text-xs">
                <strong>Согласие на обработку персональных данных (Федеральный закон № 152-ФЗ)</strong>
                <p className="text-[11px] text-emerald-700 mt-0.5">Предоставляется Пользователем при регистрации и использовании сервиса Cransys.</p>
              </div>

              <div>
                <p>
                  Настоящим я, действуя свободно, своей волей и в своем интересе, выражаю согласие на обработку сервисом Cransys моих персональных данных со следующими условиями:
                </p>
              </div>

              <div className="space-y-2">
                <div className="flex items-start gap-2 p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-slate-900">Перечень данных:</strong>
                    <p className="text-slate-600 text-[11px] mt-0.5">Адрес электронной почты (e-mail), имя/псевдоним, IP-адрес, файлы cookie, технические параметры браузера и загружаемые файлы отчетов рекламных кампаний.</p>
                  </div>
                </div>

                <div className="flex items-start gap-2 p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-slate-900">Цели обработки:</strong>
                    <p className="text-slate-600 text-[11px] mt-0.5">Регистрация и идентификация в сервисе, расчет аудиторских отчетов, доставка кодов безопасности и сервисных уведомлений, исполнение обязательств по тарифам.</p>
                  </div>
                </div>

                <div className="flex items-start gap-2 p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-slate-900">Действия с данными:</strong>
                    <p className="text-slate-600 text-[11px] mt-0.5">Сбор, запись, систематизация, накопление, хранение, уточнение, использование, обезличивание, блокирование, удаление и уничтожение персональных данных.</p>
                  </div>
                </div>
              </div>

              <p className="text-[11px] text-slate-500 pt-2">
                Согласие действует бессрочно с момента регистрации на сайте и может быть отозвано в любой момент путем отправки письменного заявления на e-mail: <strong>cransys@yandex.ru</strong>.
              </p>
            </div>
          )}
        </div>

        {/* Подвал модалки */}
        <div className="pt-3 border-t border-slate-200 flex items-center justify-between gap-3 shrink-0">
          <span className="text-[11px] text-slate-400">
            Cransys Analytics © 2026. Защита по 152-ФЗ РФ.
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold transition-colors"
          >
            Понятно, закрыть
          </button>
        </div>
      </div>
    </div>
  );
}
