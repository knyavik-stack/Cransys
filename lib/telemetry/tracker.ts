'use client';

import { TelemetryEventType } from './types';

const VISITOR_COOKIE_KEY = 'cransys_vis_id';
const UTM_STORAGE_KEY = 'cransys_utm_data';

function getOrCreateVisitorId(): string {
  if (typeof window === 'undefined') return 'server_placeholder';

  // 1. Проверяем localStorage
  try {
    let vid = localStorage.getItem(VISITOR_COOKIE_KEY);
    if (!vid) {
      vid = 'vis_' + Math.random().toString(36).substring(2, 10) + '_' + Date.now().toString(36);
      localStorage.setItem(VISITOR_COOKIE_KEY, vid);
    }
    return vid;
  } catch {
    return 'vis_fallback_' + Date.now();
  }
}

interface UtmData {
  source?: string | null;
  medium?: string | null;
  campaign?: string | null;
  content?: string | null;
  term?: string | null;
}

function captureUtmParams(): UtmData {
  if (typeof window === 'undefined') return {};

  try {
    const urlParams = new URLSearchParams(window.location.search);
    const utmSource = urlParams.get('utm_source');
    const utmMedium = urlParams.get('utm_medium');
    const utmCampaign = urlParams.get('utm_campaign');
    const utmContent = urlParams.get('utm_content');
    const utmTerm = urlParams.get('utm_term');

    if (utmSource || utmMedium || utmCampaign) {
      const utmObj: UtmData = {
        source: utmSource,
        medium: utmMedium,
        campaign: utmCampaign,
        content: utmContent,
        term: utmTerm,
      };
      sessionStorage.setItem(UTM_STORAGE_KEY, JSON.stringify(utmObj));
      return utmObj;
    }

    const saved = sessionStorage.getItem(UTM_STORAGE_KEY);
    if (saved) {
      return JSON.parse(saved);
    }
  } catch {}

  // Определение органического реферера
  if (typeof document !== 'undefined' && document.referrer) {
    const ref = document.referrer.toLowerCase();
    if (ref.includes('yandex.') || ref.includes('ya.ru')) {
      return { source: 'yandex_organic', medium: 'organic' };
    }
    if (ref.includes('google.')) {
      return { source: 'google_organic', medium: 'organic' };
    }
    if (ref.includes('t.me') || ref.includes('telegram')) {
      return { source: 'telegram', medium: 'social' };
    }
    if (ref.includes('vk.com')) {
      return { source: 'vk', medium: 'social' };
    }
  }

  return { source: 'direct', medium: 'none' };
}

/**
 * Отправка события телеметрии без блокировки интерфейса (Prior-Consent aware)
 */
export function trackProductEvent(
  eventName: TelemetryEventType,
  options?: {
    userId?: string | null;
    pagePath?: string;
    metadata?: Record<string, any>;
  }
) {
  if (typeof window === 'undefined') return;

  try {
    const visitorId = getOrCreateVisitorId();
    const utm = captureUtmParams();
    const pagePath = options?.pagePath || window.location.pathname;

    const payload = {
      visitorId,
      userId: options?.userId || null,
      eventName,
      pagePath,
      utmSource: utm.source || null,
      utmMedium: utm.medium || null,
      utmCampaign: utm.campaign || null,
      utmContent: utm.content || null,
      utmTerm: utm.term || null,
      referrer: document.referrer || null,
      metadata: options?.metadata || {},
      userAgent: navigator.userAgent || null,
    };

    const endpoint = '/api/telemetry/event';
    const jsonStr = JSON.stringify(payload);

    // Предпочитаем navigator.sendBeacon для максимальной надежности при уходе со страницы
    if (navigator.sendBeacon) {
      const blob = new Blob([jsonStr], { type: 'application/json' });
      navigator.sendBeacon(endpoint, blob);
    } else {
      fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: jsonStr,
        keepalive: true,
      }).catch(() => {});
    }
  } catch (e) {
    console.warn('Telemetry track error:', e);
  }
}
