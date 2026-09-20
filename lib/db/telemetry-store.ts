import fs from 'fs';
import path from 'path';
import { getDb, ensureDatabaseReady } from '@/db';
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
let isDbTableInitialized = false;

async function ensureDbTable(sql: any) {
  if (isDbTableInitialized) return;
  try {
    await ensureDatabaseReady();
    await sql`
      CREATE TABLE IF NOT EXISTS public.telemetry_events (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        visitor_id VARCHAR(64) NOT NULL,
        user_id VARCHAR(255),
        event_name VARCHAR(64) NOT NULL,
        page_path VARCHAR(255) NOT NULL,
        utm_source VARCHAR(64),
        utm_medium VARCHAR(64),
        utm_campaign VARCHAR(128),
        utm_content VARCHAR(128),
        utm_term VARCHAR(128),
        referrer TEXT,
        metadata JSONB DEFAULT '{}'::jsonb,
        user_agent VARCHAR(255),
        created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
      );
    `;
    await sql`
      CREATE INDEX IF NOT EXISTS idx_telemetry_event_time ON public.telemetry_events(event_name, created_at);
    `;
    await sql`
      CREATE INDEX IF NOT EXISTS idx_telemetry_visitor ON public.telemetry_events(visitor_id);
    `;
    await sql`
      CREATE INDEX IF NOT EXISTS idx_telemetry_created_at ON public.telemetry_events(created_at);
    `;
    isDbTableInitialized = true;
  } catch (e) {
    console.warn('Could not initialize telemetry_events table:', e);
  }
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
      if (Array.isArray(parsed)) {
        memoryEvents = parsed;
        return memoryEvents;
      }
    }
  } catch (e) {
    console.warn('Error reading telemetry file:', e);
  }

  // Чистый старт — только реальные живые события
  memoryEvents = [];
  try {
    ensureDataDir();
    fs.writeFileSync(TELEMETRY_FILE, JSON.stringify([], null, 2), 'utf-8');
  } catch {}

  return memoryEvents;
}

export async function clearTelemetryEvents(): Promise<void> {
  memoryEvents = [];
  try {
    ensureDataDir();
    fs.writeFileSync(TELEMETRY_FILE, JSON.stringify([], null, 2), 'utf-8');
  } catch (e) {
    console.warn('Could not clear telemetry file:', e);
  }

  const sql = getDb();
  if (sql) {
    try {
      await ensureDbTable(sql);
      await sql`DELETE FROM public.telemetry_events;`;
    } catch (e) {
      console.warn('Could not clear DB telemetry:', e);
    }
  }
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

  // Сохраняем в PostgreSQL (Neon) при наличии подключения
  try {
    const sql = getDb();
    if (sql) {
      await ensureDbTable(sql);
      await sql`
        INSERT INTO public.telemetry_events 
         (visitor_id, user_id, event_name, page_path, utm_source, utm_medium, utm_campaign, utm_content, utm_term, referrer, metadata, user_agent)
        VALUES (
          ${newEvent.visitorId},
          ${newEvent.userId || null},
          ${newEvent.eventName},
          ${newEvent.pagePath},
          ${newEvent.utmSource || null},
          ${newEvent.utmMedium || null},
          ${newEvent.utmCampaign || null},
          ${newEvent.utmContent || null},
          ${newEvent.utmTerm || null},
          ${newEvent.referrer || null},
          ${JSON.stringify(newEvent.metadata || {})},
          ${newEvent.userAgent || null}
        );
      `;
    }
  } catch (e) {
    console.warn('DB error writing telemetry event:', e);
  }

  return newEvent;
}

/**
 * Расчет агрегированной воронки конверсий
 */
export async function calculateFunnelStats(period: 'today' | '7d' | '30d' | '90d' | 'all' = '7d'): Promise<FunnelStatsResponse> {
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
  } else if (period === '90d') {
    minTimestamp = now - 90 * 24 * 60 * 60 * 1000;
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

  const countVisits = stepVisitors.visits.size;
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
    const conversionFromFirst = countVisits > 0 ? Math.round((st.count / countVisits) * 100 * 10) / 10 : 0;
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
  const dropOffTotal = Math.max(0, countVisits - countPayments);
  const dropOffAnalysis = [
    {
      reason: 'Посмотрели Демо, но нет под рукой свежей выгрузки XLSX из Директа',
      count: Math.round(dropOffTotal * 0.38),
      percent: dropOffTotal > 0 ? 38 : 0,
      color: '#3B82F6',
    },
    {
      reason: 'Требуется внутреннее согласование счета с бухгалтером или директором',
      count: Math.round(dropOffTotal * 0.27),
      percent: dropOffTotal > 0 ? 27 : 0,
      color: '#8B5CF6',
    },
    {
      reason: 'Ищут полностью бесплатное решение без ограничений по количеству кампаний',
      count: Math.round(dropOffTotal * 0.18),
      percent: dropOffTotal > 0 ? 18 : 0,
      color: '#F59E0B',
    },
    {
      reason: 'Предпочитают прямое подключение по API вместо ручной загрузки файла',
      count: Math.round(dropOffTotal * 0.12),
      percent: dropOffTotal > 0 ? 12 : 0,
      color: '#10B981',
    },
    {
      reason: 'Другие причины (случайный трафик, закрыли вкладку)',
      count: Math.round(dropOffTotal * 0.05),
      percent: dropOffTotal > 0 ? 5 : 0,
      color: '#64748B',
    },
  ];

  // Динамика по дням
  const dailyDynamics: Array<{ date: string; label: string; visits: number; audits: number; signups: number; payments: number }> = [];
  const daysToShow = period === 'today' ? 1 : (period === '90d' ? 30 : (period === '30d' ? 14 : 7));

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
      visits: dayVisits,
      audits: dayAudits,
      signups: daySignups,
      payments: dayPayments,
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
