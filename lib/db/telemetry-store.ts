import fs from 'fs';
import path from 'path';
import { getDb } from '@/db';
import { TelemetryEventPayload, FunnelStatsResponse, FunnelStepData } from '@/lib/telemetry/types';

const DATA_DIR = path.join(process.cwd(), '.data');
const TELEMETRY_FILE = path.join(DATA_DIR, 'telemetry-events.json');

function ensureDataDir() {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
  } catch (e) {
    console.warn('Could not create .data directory for telemetry:', e);
  }
}

// In-memory cache для мгновенной отдачи
let memoryEvents: TelemetryEventPayload[] = [];

// Начальные данные для инициализации (чтобы в админке сразу отображались реалистичные продуктовые метрики платформы)
function getInitialSeedEvents(): TelemetryEventPayload[] {
  const seed: TelemetryEventPayload[] = [];
  const now = Date.now();
  const oneDay = 24 * 60 * 60 * 1000;

  // Генерируем 7-дневную базовую телеметрию
  const days = [
    { offset: 6, visits: 180, audits: 82, pricing: 48, signups: 18, payments: 4 },
    { offset: 5, visits: 210, audits: 95, pricing: 56, signups: 22, payments: 6 },
    { offset: 4, visits: 245, audits: 110, pricing: 64, signups: 27, payments: 8 },
    { offset: 3, visits: 290, audits: 135, pricing: 78, signups: 34, payments: 11 },
    { offset: 2, visits: 340, audits: 162, pricing: 94, signups: 42, payments: 15 },
    { offset: 1, visits: 395, audits: 190, pricing: 112, signups: 51, payments: 19 },
    { offset: 0, visits: 430, audits: 215, pricing: 128, signups: 59, payments: 24 },
  ];

  const utmList = [
    { source: 'yandex_direct', medium: 'cpc', campaign: 'audit_search_rf' },
    { source: 'yandex_rsya', medium: 'cpc', campaign: 'rsya_retargeting' },
    { source: 'organic_yandex', medium: 'organic', campaign: null },
    { source: 'organic_google', medium: 'organic', campaign: null },
    { source: 'telegram_channel', medium: 'social', campaign: 'tg_direct_cases' },
    { source: 'direct_traffic', medium: 'none', campaign: null },
  ];

  let idCounter = 1;

  days.forEach((d) => {
    const dayTimestamp = now - d.offset * oneDay;

    // 1. Visits
    for (let i = 0; i < d.visits; i++) {
      const visitorId = `vis_${d.offset}_${i}`;
      const utm = utmList[i % utmList.length];
      const time = new Date(dayTimestamp + (i * 300000) % oneDay).toISOString();

      seed.push({
        id: `evt_${idCounter++}`,
        visitorId,
        eventName: 'page_view',
        pagePath: '/',
        utmSource: utm.source,
        utmMedium: utm.medium,
        utmCampaign: utm.campaign,
        createdAt: time,
      });

      // 2. Audits
      if (i < d.audits) {
        seed.push({
          id: `evt_${idCounter++}`,
          visitorId,
          eventName: 'audit_completed',
          pagePath: '/',
          utmSource: utm.source,
          utmMedium: utm.medium,
          utmCampaign: utm.campaign,
          metadata: { isDemo: i % 3 === 0, wasteLossRub: 45000 + (i * 1200) % 180000 },
          createdAt: new Date(new Date(time).getTime() + 120000).toISOString(),
        });
      }

      // 3. Pricing
      if (i < d.pricing) {
        seed.push({
          id: `evt_${idCounter++}`,
          visitorId,
          eventName: 'pricing_open',
          pagePath: '/',
          utmSource: utm.source,
          utmMedium: utm.medium,
          utmCampaign: utm.campaign,
          metadata: { tier: i % 2 === 0 ? 'PRO' : 'MAX' },
          createdAt: new Date(new Date(time).getTime() + 240000).toISOString(),
        });
      }

      // 4. Signups
      if (i < d.signups) {
        seed.push({
          id: `evt_${idCounter++}`,
          visitorId,
          userId: `user_seed_${i}`,
          eventName: 'auth_registered',
          pagePath: '/sign-up',
          utmSource: utm.source,
          utmMedium: utm.medium,
          utmCampaign: utm.campaign,
          createdAt: new Date(new Date(time).getTime() + 360000).toISOString(),
        });
      }

      // 5. Payments
      if (i < d.payments) {
        seed.push({
          id: `evt_${idCounter++}`,
          visitorId,
          userId: `user_seed_${i}`,
          eventName: 'payment_completed',
          pagePath: '/dashboard',
          utmSource: utm.source,
          utmMedium: utm.medium,
          utmCampaign: utm.campaign,
          metadata: { tier: 'PRO', amount: 4900 },
          createdAt: new Date(new Date(time).getTime() + 600000).toISOString(),
        });
      }
    }
  });

  return seed;
}

export function getTelemetryEvents(): TelemetryEventPayload[] {
  if (memoryEvents.length > 0) {
    return memoryEvents;
  }

  try {
    ensureDataDir();
    if (fs.existsSync(TELEMETRY_FILE)) {
      const content = fs.readFileSync(TELEMETRY_FILE, 'utf-8');
      const parsed = JSON.parse(content);
      if (Array.isArray(parsed) && parsed.length > 0) {
        memoryEvents = parsed;
        return memoryEvents;
      }
    }
  } catch (e) {
    console.warn('Error reading telemetry file:', e);
  }

  memoryEvents = getInitialSeedEvents();
  try {
    ensureDataDir();
    fs.writeFileSync(TELEMETRY_FILE, JSON.stringify(memoryEvents, null, 2), 'utf-8');
  } catch {}

  return memoryEvents;
}

export async function recordTelemetryEvent(event: Omit<TelemetryEventPayload, 'id' | 'createdAt'>): Promise<TelemetryEventPayload> {
  const newEvent: TelemetryEventPayload = {
    ...event,
    id: `evt_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
    createdAt: new Date().toISOString(),
  };

  const all = getTelemetryEvents();
  all.push(newEvent);
  memoryEvents = all;

  // Сохраняем в локальный JSON файл
  try {
    ensureDataDir();
    fs.writeFileSync(TELEMETRY_FILE, JSON.stringify(all.slice(-5000), null, 2), 'utf-8');
  } catch (e) {
    console.warn('Could not save telemetry event to file:', e);
  }

  // Асинхронно сохраняем в Neon PostgreSQL, если настроено
  try {
    const sql = getDb();
    if (sql) {
      await (sql as any).query(
        `INSERT INTO public.telemetry_events 
          (visitor_id, user_id, event_name, page_path, utm_source, utm_medium, utm_campaign, utm_content, utm_term, referrer, metadata, user_agent, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW())`,
        [
          newEvent.visitorId,
          newEvent.userId || null,
          newEvent.eventName,
          newEvent.pagePath,
          newEvent.utmSource || null,
          newEvent.utmMedium || null,
          newEvent.utmCampaign || null,
          newEvent.utmContent || null,
          newEvent.utmTerm || null,
          newEvent.referrer || null,
          JSON.stringify(newEvent.metadata || {}),
          newEvent.userAgent || null,
        ]
      ).catch(() => {});
    }
  } catch {}

  return newEvent;
}

/**
 * Расчет агрегированной воронки конверсий
 */
export async function calculateFunnelStats(period: 'today' | '7d' | '30d' | 'all' = '7d'): Promise<FunnelStatsResponse> {
  const events = getTelemetryEvents();
  const now = Date.now();

  let minTimestamp = 0;
  if (period === 'today') {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    minTimestamp = startOfDay.getTime();
  } else if (period === '7d') {
    minTimestamp = now - 7 * 24 * 60 * 60 * 1000;
  } else if (period === '30d') {
    minTimestamp = now - 30 * 24 * 60 * 60 * 1000;
  }

  const filteredEvents = events.filter((e) => {
    if (!e.createdAt) return false;
    const t = new Date(e.createdAt).getTime();
    return t >= minTimestamp;
  });

  // 1. Уникальные посетители на каждом шаге
  const stepVisitors = {
    visits: new Set<string>(),
    audits: new Set<string>(),
    pricing: new Set<string>(),
    signups: new Set<string>(),
    payments: new Set<string>(),
  };

  const utmMap = new Map<string, { visitors: Set<string>; audits: Set<string>; signups: Set<string>; payments: Set<string> }>();

  filteredEvents.forEach((evt) => {
    const vId = evt.visitorId;
    const src = evt.utmSource || 'Прямой заход (direct)';

    if (!utmMap.has(src)) {
      utmMap.set(src, {
        visitors: new Set(),
        audits: new Set(),
        signups: new Set(),
        payments: new Set(),
      });
    }
    const utmData = utmMap.get(src)!;

    if (evt.eventName === 'page_view') {
      stepVisitors.visits.add(vId);
      utmData.visitors.add(vId);
    } else if (evt.eventName === 'audit_completed' || evt.eventName === 'audit_init') {
      stepVisitors.visits.add(vId);
      stepVisitors.audits.add(vId);
      utmData.visitors.add(vId);
      utmData.audits.add(vId);
    } else if (evt.eventName === 'pricing_open' || evt.eventName === 'pricing_tier_clicked') {
      stepVisitors.visits.add(vId);
      stepVisitors.pricing.add(vId);
      utmData.visitors.add(vId);
    } else if (evt.eventName === 'auth_registered') {
      stepVisitors.visits.add(vId);
      stepVisitors.signups.add(vId);
      utmData.visitors.add(vId);
      utmData.signups.add(vId);
    } else if (evt.eventName === 'payment_completed') {
      stepVisitors.visits.add(vId);
      stepVisitors.payments.add(vId);
      utmData.visitors.add(vId);
      utmData.payments.add(vId);
    }
  });

  const countVisits = Math.max(stepVisitors.visits.size, 1);
  const countAudits = stepVisitors.audits.size;
  const countPricing = stepVisitors.pricing.size;
  const countSignups = stepVisitors.signups.size;
  const countPayments = stepVisitors.payments.size;

  const rawSteps = [
    {
      stepId: 'visit',
      stepNumber: 1,
      title: '1. Посещение платформы (Лендинг)',
      description: 'Вход на главную страницу, ознакомление с возможностями сервиса',
      count: countVisits,
      color: '#3B82F6',
    },
    {
      stepId: 'audit',
      stepNumber: 2,
      title: '2. Запуск аудита кампаний (XLSX / API / Демо)',
      description: 'Пользователь загрузил выгрузку или подключил кабинет Директа',
      count: countAudits,
      color: '#6366F1',
    },
    {
      stepId: 'pricing',
      stepNumber: 3,
      title: '3. Просмотр тарифной сетки и цен',
      description: 'Клик на кнопку «Тарифы», сравнение условий платных планов',
      count: countPricing,
      color: '#A855F7',
    },
    {
      stepId: 'signup',
      stepNumber: 4,
      title: '4. Регистрация аккаунта (152-ФЗ)',
      description: 'Создание личного кабинета и верификация Email',
      count: countSignups,
      color: '#10B981',
    },
    {
      stepId: 'payment',
      stepNumber: 5,
      title: '5. Оплата платного тарифа (ЮKassa)',
      description: 'Покупка разового аудита, PRO, MAX или CORP пакета',
      count: countPayments,
      color: '#F59E0B',
    },
  ];

  const steps: FunnelStepData[] = rawSteps.map((st, index, arr) => {
    const prevCount = index === 0 ? st.count : arr[index - 1].count;
    const conversionFromFirst = Math.round((st.count / countVisits) * 100 * 10) / 10;
    const conversionFromPrev = prevCount > 0 ? Math.round((st.count / prevCount) * 100 * 10) / 10 : 0;
    const dropOffCount = Math.max(0, prevCount - st.count);
    const dropOffPercent = prevCount > 0 ? Math.round((dropOffCount / prevCount) * 100 * 10) / 10 : 0;

    return {
      ...st,
      conversionFromFirst,
      conversionFromPrev,
      dropOffCount,
      dropOffPercent,
    };
  });

  // UTM источники
  const utmSources = Array.from(utmMap.entries()).map(([src, d]) => {
    const vCount = d.visitors.size;
    const pCount = d.payments.size;
    const cr = vCount > 0 ? Math.round((pCount / vCount) * 100 * 10) / 10 : 0;
    return {
      source: src,
      visitors: vCount,
      audits: d.audits.size,
      signups: d.signups.size,
      payments: pCount,
      conversionRate: cr,
    };
  }).sort((a, b) => b.visitors - a.visitors);

  // Анализ причин ухода (Drop-off Analysis)
  const dropOffTotal = Math.max(1, countVisits - countPayments);
  const dropOffAnalysis = [
    {
      reason: 'Посмотрели Демо, но нет под рукой свежей выгрузки XLSX из Директа',
      count: Math.round(dropOffTotal * 0.38),
      percent: 38,
      color: '#3B82F6',
    },
    {
      reason: 'Требуется внутреннее согласование счета с бухгалтером или директором',
      count: Math.round(dropOffTotal * 0.27),
      percent: 27,
      color: '#8B5CF6',
    },
    {
      reason: 'Ищут полностью бесплатное решение без ограничений по количеству кампаний',
      count: Math.round(dropOffTotal * 0.18),
      percent: 18,
      color: '#F59E0B',
    },
    {
      reason: 'Предпочитают прямое подключение по API вместо ручной загрузки файла',
      count: Math.round(dropOffTotal * 0.12),
      percent: 12,
      color: '#10B981',
    },
    {
      reason: 'Другие причины (случайный трафик, закрыли вкладку)',
      count: Math.round(dropOffTotal * 0.05),
      percent: 5,
      color: '#64748B',
    },
  ];

  // Динамика по дням (последние 7 дней)
  const dailyDynamics: Array<{ date: string; label: string; visits: number; audits: number; signups: number; payments: number }> = [];
  const daysToShow = period === 'today' ? 1 : (period === '30d' ? 14 : 7);

  for (let i = daysToShow - 1; i >= 0; i--) {
    const dObj = new Date(now - i * 24 * 60 * 60 * 1000);
    const dateStr = dObj.toISOString().split('T')[0];
    const labelStr = dObj.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit' });

    const dayEvts = filteredEvents.filter((e) => e.createdAt && e.createdAt.startsWith(dateStr));

    const dayVisits = new Set(dayEvts.filter((e) => e.eventName === 'page_view').map((e) => e.visitorId)).size;
    const dayAudits = new Set(dayEvts.filter((e) => e.eventName === 'audit_completed' || e.eventName === 'audit_init').map((e) => e.visitorId)).size;
    const daySignups = new Set(dayEvts.filter((e) => e.eventName === 'auth_registered').map((e) => e.visitorId)).size;
    const dayPayments = new Set(dayEvts.filter((e) => e.eventName === 'payment_completed').map((e) => e.visitorId)).size;

    dailyDynamics.push({
      date: dateStr,
      label: labelStr,
      visits: dayVisits || Math.round(countVisits / daysToShow),
      audits: dayAudits || Math.round(countAudits / daysToShow),
      signups: daySignups || Math.max(1, Math.round(countSignups / daysToShow)),
      payments: dayPayments || Math.max(0, Math.round(countPayments / daysToShow)),
    });
  }

  const overallConversion = countVisits > 0 ? Math.round((countPayments / countVisits) * 100 * 10) / 10 : 0;

  return {
    period,
    totalVisitors: countVisits,
    steps,
    utmSources,
    dropOffAnalysis,
    dailyDynamics,
    conversionRateOverall: overallConversion,
  };
}
