'use client';

import React, { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import Script from 'next/script';
import { SiteSettings } from '@/lib/settings/types';
import { useCookieConsent } from '@/lib/consent-client';
import { trackProductEvent } from '@/lib/telemetry/tracker';

export function AnalyticsProvider() {
  const pathname = usePathname();
  const [settings, setSettings] = useState<SiteSettings | null>(null);
  const consent = useCookieConsent();

  // Автоматический трекинг page_view для продуктовой воронки
  useEffect(() => {
    trackProductEvent('page_view', {
      pagePath: pathname || '/',
    });
  }, [pathname]);

  useEffect(() => {
    let isMounted = true;

    // 1. Загрузка настроек сайта
    async function loadSettings() {
      try {
        const res = await fetch('/api/settings');
        if (res.ok) {
          const data = await res.json();
          if (data.success && data.settings && isMounted) {
            setSettings(data.settings);
          }
        }
      } catch (err) {
        console.warn('AnalyticsProvider: error loading site settings', err);
      }
    }

    loadSettings();

    return () => {
      isMounted = false;
    };
  }, []);

  if (!settings) return null;

  const { analytics, webmasters, customScripts, cookieBanner } = settings;
  const ymId = analytics?.yandexMetrikaId?.trim();
  const gaId = analytics?.googleAnalyticsId?.trim();
  const yandexVerif = webmasters?.yandexVerificationCode?.trim();
  const googleVerif = webmasters?.googleVerificationCode?.trim();
  const headScript = customScripts?.headScript?.trim();
  const bodyScript = customScripts?.bodyScript?.trim();

  // Логика 152-ФЗ РФ: проверяем, разрешена ли аналитика и маркетинг
  // Если включен autoBlockScripts и согласия еще нет — блокируем до клика в баннере
  const isAutoBlock = cookieBanner?.autoBlockScripts ?? true;
  const isBannerEnabled = cookieBanner?.enabled ?? true;

  const canRunAnalytics = isBannerEnabled
    ? consent ? consent.analytics : !isAutoBlock
    : true;

  const canRunMarketing = isBannerEnabled
    ? consent ? consent.marketing : !isAutoBlock
    : true;

  return (
    <>
      {/* 1. Метатеги верификации поисковых систем (всегда разрешены для роботов) */}
      {yandexVerif && (
        <meta name="yandex-verification" content={yandexVerif} />
      )}
      {googleVerif && (
        <meta name="google-site-verification" content={googleVerif} />
      )}

      {/* 2. Яндекс.Метрика (срабатывает только при согласии на аналитические cookie) */}
      {ymId && canRunAnalytics && (
        <>
          <Script
            id="yandex-metrika-script"
            strategy="afterInteractive"
            dangerouslySetInnerHTML={{
              __html: `
                (function(m,e,t,r,i,k,a){m[i]=m[i]||function(){(m[i].a=m[i].a||[]).push(arguments)};
                m[i].l=1*new Date();
                for (var j = 0; j < document.scripts.length; j++) {if (document.scripts[j].src === r) { return; }}
                k=e.createElement(t),a=e.getElementsByTagName(t)[0],k.async=1,k.src=r,a.parentNode.insertBefore(k,a)})
                (window, document, "script", "https://mc.yandex.ru/metrika/tag.js", "ym");

                ym(${ymId}, "init", {
                  clickmap: true,
                  trackLinks: true,
                  accurateTrackBounce: true,
                  webvisor: ${analytics.yandexMetrikaWebvisor ? 'true' : 'false'}
                });
              `,
            }}
          />
          <noscript>
            <div>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`https://mc.yandex.ru/watch/${ymId}`}
                style={{ position: 'absolute', left: '-9999px' }}
                alt=""
              />
            </div>
          </noscript>
        </>
      )}

      {/* 3. Google Analytics 4 (gtag.js) */}
      {gaId && canRunAnalytics && (
        <>
          <Script
            src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`}
            strategy="afterInteractive"
          />
          <Script
            id="google-analytics-script"
            strategy="afterInteractive"
            dangerouslySetInnerHTML={{
              __html: `
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());
                gtag('config', '${gaId}', {
                  page_path: window.location.pathname,
                });
              `,
            }}
          />
        </>
      )}

      {/* 4. Пользовательский Head Script (маркетинговые пиксели) */}
      {headScript && canRunMarketing && (
        <Script
          id="custom-head-script"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{ __html: headScript }}
        />
      )}

      {/* 5. Пользовательский Body Script (виджеты) */}
      {bodyScript && canRunMarketing && (
        <Script
          id="custom-body-script"
          strategy="lazyOnload"
          dangerouslySetInnerHTML={{ __html: bodyScript }}
        />
      )}
    </>
  );
}
