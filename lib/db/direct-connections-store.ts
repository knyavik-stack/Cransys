import fs from 'fs';
import path from 'path';
import { getDb, ensureDatabaseReady } from '@/db';

export interface YandexDirectConnection {
  id: string;
  userId: string;
  userEmail?: string;
  accessToken: string;
  refreshToken?: string;
  expiresIn?: number;
  login?: string;
  connectedAt: string;
  lastSyncAt?: string;
  status: 'ACTIVE' | 'REVOKED' | 'EXPIRED';
}

export interface DirectSlotUsageRecord {
  id: string;
  userId: string;
  login: string;
  connectedAt: string;
  monthPeriod: string; // e.g. "2026-09"
}

const DATA_DIR = path.join(process.cwd(), '.data');
const CONNECTIONS_FILE = path.join(DATA_DIR, 'direct_connections.json');
const SLOTS_USAGE_FILE = path.join(DATA_DIR, 'direct_slots_usage.json');

function ensureDataDir() {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
  } catch (e) {
    console.warn('Could not create .data directory for direct connections:', e);
  }
}

function loadLocalSlots(): DirectSlotUsageRecord[] {
  try {
    ensureDataDir();
    if (fs.existsSync(SLOTS_USAGE_FILE)) {
      const content = fs.readFileSync(SLOTS_USAGE_FILE, 'utf-8');
      const parsed = JSON.parse(content);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (e) {
    console.warn('Error reading local slots usage:', e);
  }
  return [];
}

function saveLocalSlots(items: DirectSlotUsageRecord[]) {
  try {
    ensureDataDir();
    fs.writeFileSync(SLOTS_USAGE_FILE, JSON.stringify(items, null, 2), 'utf-8');
  } catch (e) {
    console.warn('Error writing local slots usage:', e);
  }
}

let memorySlotsUsage: DirectSlotUsageRecord[] = loadLocalSlots();

function loadLocalConnections(): YandexDirectConnection[] {
  try {
    ensureDataDir();
    if (fs.existsSync(CONNECTIONS_FILE)) {
      const content = fs.readFileSync(CONNECTIONS_FILE, 'utf-8');
      const parsed = JSON.parse(content);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (e) {
    console.warn('Error reading local direct connections:', e);
  }
  return [];
}

function saveLocalConnections(items: YandexDirectConnection[]) {
  try {
    ensureDataDir();
    fs.writeFileSync(CONNECTIONS_FILE, JSON.stringify(items, null, 2), 'utf-8');
  } catch (e) {
    console.warn('Error writing local direct connections:', e);
  }
}

let memoryConnections: YandexDirectConnection[] = loadLocalConnections();

export async function saveDirectConnection(conn: Omit<YandexDirectConnection, 'id' | 'connectedAt' | 'status'> & { id?: string }): Promise<YandexDirectConnection> {
  const newConn: YandexDirectConnection = {
    id: conn.id || `yd_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    connectedAt: new Date().toISOString(),
    status: 'ACTIVE',
    ...conn,
  };

  const sql = getDb();
  if (sql) {
    try {
      await ensureDatabaseReady();
      await sql`
        CREATE TABLE IF NOT EXISTS public.yandex_connections (
          id TEXT PRIMARY KEY,
          user_id TEXT NOT NULL,
          user_email TEXT,
          access_token TEXT NOT NULL,
          refresh_token TEXT,
          expires_in INTEGER,
          login TEXT,
          connected_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          last_sync_at TIMESTAMP WITH TIME ZONE,
          status TEXT DEFAULT 'ACTIVE'
        );
      `;

      // Проверяем, есть ли уже подключение для этого user_id и login
      const existingRows = await sql`
        SELECT id FROM public.yandex_connections
        WHERE user_id = ${newConn.userId} AND login = ${newConn.login || ''}
        LIMIT 1;
      `;

      if (existingRows && existingRows.length > 0) {
        // Обновляем существующую запись
        const existingId = existingRows[0].id;
        newConn.id = existingId;
        await sql`
          UPDATE public.yandex_connections
          SET
            access_token = ${newConn.accessToken},
            refresh_token = ${newConn.refreshToken || null},
            expires_in = ${newConn.expiresIn || 31536000},
            user_email = ${newConn.userEmail || null},
            status = 'ACTIVE',
            connected_at = NOW(),
            last_sync_at = NOW()
          WHERE id = ${existingId};
        `;
      } else {
        // Создаем новую запись
        await sql`
          INSERT INTO public.yandex_connections (
            id, user_id, user_email, access_token, refresh_token, expires_in, login, connected_at, status
          ) VALUES (
            ${newConn.id}, ${newConn.userId}, ${newConn.userEmail || null}, ${newConn.accessToken},
            ${newConn.refreshToken || null}, ${newConn.expiresIn || 31536000}, ${newConn.login || null},
            NOW(), 'ACTIVE'
          )
          ON CONFLICT (id) DO UPDATE SET
            access_token = EXCLUDED.access_token,
            refresh_token = EXCLUDED.refresh_token,
            login = EXCLUDED.login,
            status = 'ACTIVE',
            last_sync_at = NOW();
        `;
      }
    } catch (e) {
      console.warn('Error saving Yandex connection to Neon DB, using fallback:', e);
    }
  }

  // Обновляем локальную память (сопоставляем по userId + login)
  const idx = memoryConnections.findIndex(
    (c) => c.userId === newConn.userId && (c.login === newConn.login || (!c.login && !newConn.login))
  );
  if (idx >= 0) {
    memoryConnections[idx] = newConn;
  } else {
    memoryConnections.push(newConn);
  }
  saveLocalConnections(memoryConnections);

  return newConn;
}

/**
 * Получение всех активных подключений пользователей в системе (для админки и аналитики)
 */
export async function getAllDirectConnections(): Promise<YandexDirectConnection[]> {
  const sql = getDb();
  if (sql) {
    try {
      await ensureDatabaseReady();
      const rows = await sql`
        SELECT 
          id,
          user_id as "userId",
          user_email as "userEmail",
          access_token as "accessToken",
          refresh_token as "refreshToken",
          expires_in as "expiresIn",
          login,
          connected_at as "connectedAt",
          last_sync_at as "lastSyncAt",
          status
        FROM public.yandex_connections
        WHERE status = 'ACTIVE'
        ORDER BY connected_at DESC;
      `;
      if (rows && rows.length > 0) {
        return rows as YandexDirectConnection[];
      }
    } catch (e) {
      console.warn('Error querying all Yandex connections for admin from DB:', e);
    }
  }

  return memoryConnections.filter((c) => c.status === 'ACTIVE');
}

/**
 * Получение всех активных подключений пользователя (для мульти-аккаунтов в CORP / MAX)
 */
export async function getAllDirectConnectionsForUser(userId: string): Promise<YandexDirectConnection[]> {
  if (!userId || userId === 'guest' || userId === 'guest_account') {
    return [];
  }

  const sql = getDb();
  if (sql) {
    try {
      await ensureDatabaseReady();
      const rows = await sql`
        SELECT 
          id,
          user_id as "userId",
          user_email as "userEmail",
          access_token as "accessToken",
          refresh_token as "refreshToken",
          expires_in as "expiresIn",
          login,
          connected_at as "connectedAt",
          last_sync_at as "lastSyncAt",
          status
        FROM public.yandex_connections
        WHERE user_id = ${userId} AND status = 'ACTIVE'
        ORDER BY connected_at DESC;
      `;

      if (rows && rows.length > 0) {
        // Оставляем уникальные по login
        const seen = new Set<string>();
        const unique: YandexDirectConnection[] = [];
        for (const r of rows) {
          const item = r as YandexDirectConnection;
          const key = item.login || item.id;
          if (!seen.has(key)) {
            seen.add(key);
            unique.push(item);
          }
        }
        return unique;
      }
    } catch (e) {
      console.warn('Error querying all Yandex connections from DB:', e);
    }
  }

  return memoryConnections.filter(
    (c) => c.userId === userId && c.status === 'ACTIVE'
  );
}

export async function getDirectConnectionByUserId(
  userId: string,
  connectionIdOrLogin?: string
): Promise<YandexDirectConnection | null> {
  if (!userId || userId === 'guest' || userId === 'guest_account') {
    return null;
  }

  const sql = getDb();
  if (sql) {
    try {
      await ensureDatabaseReady();

      if (connectionIdOrLogin) {
        const rows = await sql`
          SELECT 
            id,
            user_id as "userId",
            user_email as "userEmail",
            access_token as "accessToken",
            refresh_token as "refreshToken",
            expires_in as "expiresIn",
            login,
            connected_at as "connectedAt",
            last_sync_at as "lastSyncAt",
            status
          FROM public.yandex_connections
          WHERE (id = ${connectionIdOrLogin} OR login = ${connectionIdOrLogin})
            AND user_id = ${userId}
            AND status = 'ACTIVE'
          ORDER BY connected_at DESC
          LIMIT 1;
        `;
        if (rows && rows.length > 0) {
          return rows[0] as YandexDirectConnection;
        }
      }

      // 1. Точный поиск по userId
      const rows = await sql`
        SELECT 
          id,
          user_id as "userId",
          user_email as "userEmail",
          access_token as "accessToken",
          refresh_token as "refreshToken",
          expires_in as "expiresIn",
          login,
          connected_at as "connectedAt",
          last_sync_at as "lastSyncAt",
          status
        FROM public.yandex_connections
        WHERE user_id = ${userId} AND status = 'ACTIVE'
        ORDER BY connected_at DESC
        LIMIT 1;
      `;

      if (rows && rows.length > 0) {
        return rows[0] as YandexDirectConnection;
      }
    } catch (e) {
      console.warn('Error querying Yandex connection from Neon DB:', e);
    }
  }

  if (connectionIdOrLogin) {
    const match = memoryConnections.find(
      (c) =>
        (c.id === connectionIdOrLogin || c.login === connectionIdOrLogin) &&
        c.userId === userId &&
        c.status === 'ACTIVE'
    );
    if (match) return match;
  }

  const exact = memoryConnections
    .filter((c) => c.userId === userId && c.status === 'ACTIVE')
    .sort((a, b) => new Date(b.connectedAt).getTime() - new Date(a.connectedAt).getTime())[0];

  return exact || null;
}

export async function disconnectDirect(userId: string, connectionIdOrLogin?: string): Promise<boolean> {
  if (!userId || userId === 'guest' || userId === 'guest_account') {
    return false;
  }

  const sql = getDb();
  if (sql) {
    try {
      await ensureDatabaseReady();
      if (connectionIdOrLogin) {
        // Удаляем конкретный кабинет (по id или логину)
        await sql`
          DELETE FROM public.yandex_connections
          WHERE (id = ${connectionIdOrLogin} OR login = ${connectionIdOrLogin})
            AND user_id = ${userId};
        `;
      } else {
        // Удаляем все кабинеты пользователя
        await sql`
          DELETE FROM public.yandex_connections
          WHERE user_id = ${userId};
        `;
      }
    } catch (e) {
      console.warn('Error deleting Yandex connection in DB:', e);
    }
  }

  if (connectionIdOrLogin) {
    memoryConnections = memoryConnections.filter(
      (c) => (c.id !== connectionIdOrLogin && c.login !== connectionIdOrLogin) || c.userId !== userId
    );
  } else {
    memoryConnections = memoryConnections.filter(
      (c) => c.userId !== userId
    );
  }
  saveLocalConnections(memoryConnections);
  return true;
}

/**
 * Получить список уникальных кабинетов, подключенных за текущий расчетный месяц
 */
export async function getDirectSlotsUsageForMonth(
  userId: string,
  monthPeriod: string = new Date().toISOString().slice(0, 7) // "YYYY-MM"
): Promise<{ usedLogins: string[]; count: number }> {
  if (!userId || userId === 'guest' || userId === 'guest_account') {
    return { usedLogins: [], count: 0 };
  }

  const sql = getDb();
  if (sql) {
    try {
      await ensureDatabaseReady();
      await sql`
        CREATE TABLE IF NOT EXISTS public.direct_slots_history (
          id TEXT PRIMARY KEY,
          user_id TEXT NOT NULL,
          login TEXT NOT NULL,
          connected_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          month_period TEXT NOT NULL
        );
      `;

      const rows = await sql`
        SELECT DISTINCT login
        FROM public.direct_slots_history
        WHERE user_id = ${userId}
          AND month_period = ${monthPeriod};
      `;

      if (rows) {
        const logins = rows.map((r: any) => String(r.login)).filter(Boolean);
        return { usedLogins: logins, count: logins.length };
      }
    } catch (e) {
      console.warn('Error querying direct_slots_history from DB:', e);
    }
  }

  const matches = memorySlotsUsage.filter(
    (s) =>
      s.userId === userId &&
      s.monthPeriod === monthPeriod
  );
  const unique = Array.from(new Set(matches.map((m) => m.login)));
  return { usedLogins: unique, count: unique.length };
}

/**
 * Зафиксировать подключение кабинета в слотную историю расчетного месяца
 */
export async function recordDirectSlotUsage(
  userId: string,
  login: string,
  monthPeriod: string = new Date().toISOString().slice(0, 7)
): Promise<void> {
  const normLogin = (login || '').trim();
  if (!normLogin || !userId || userId === 'guest' || userId === 'guest_account') return;

  const record: DirectSlotUsageRecord = {
    id: `slot_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    userId,
    login: normLogin,
    connectedAt: new Date().toISOString(),
    monthPeriod,
  };

  const sql = getDb();
  if (sql) {
    try {
      await ensureDatabaseReady();
      await sql`
        CREATE TABLE IF NOT EXISTS public.direct_slots_history (
          id TEXT PRIMARY KEY,
          user_id TEXT NOT NULL,
          login TEXT NOT NULL,
          connected_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          month_period TEXT NOT NULL
        );
      `;

      // Проверяем, есть ли уже этот логин за данный месяц
      const existing = await sql`
        SELECT id FROM public.direct_slots_history
        WHERE user_id = ${userId}
          AND login = ${normLogin}
          AND month_period = ${monthPeriod}
        LIMIT 1;
      `;

      if (!existing || existing.length === 0) {
        await sql`
          INSERT INTO public.direct_slots_history (
            id, user_id, login, connected_at, month_period
          ) VALUES (
            ${record.id}, ${userId}, ${normLogin}, NOW(), ${monthPeriod}
          );
        `;
      }
    } catch (e) {
      console.warn('Error recording direct slot in DB:', e);
    }
  }

  // Обновляем локальную память
  const alreadyInLocal = memorySlotsUsage.some(
    (s) =>
      s.userId === userId &&
      s.login === normLogin &&
      s.monthPeriod === monthPeriod
  );
  if (!alreadyInLocal) {
    memorySlotsUsage.push(record);
    saveLocalSlots(memorySlotsUsage);
  }
}
