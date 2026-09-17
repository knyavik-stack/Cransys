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

const DATA_DIR = path.join(process.cwd(), '.data');
const CONNECTIONS_FILE = path.join(DATA_DIR, 'direct_connections.json');

function ensureDataDir() {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
  } catch (e) {
    console.warn('Could not create .data directory for direct connections:', e);
  }
}

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

      await sql`
        INSERT INTO public.yandex_connections (
          id, user_id, user_email, access_token, refresh_token, expires_in, login, connected_at, status
        ) VALUES (
          ${newConn.id}, ${newConn.userId}, ${newConn.userEmail || null}, ${newConn.accessToken},
          ${newConn.refreshToken || null}, ${newConn.expiresIn || 31536000}, ${newConn.login || null},
          NOW(), ${newConn.status}
        )
        ON CONFLICT (id) DO UPDATE SET
          access_token = EXCLUDED.access_token,
          refresh_token = EXCLUDED.refresh_token,
          login = EXCLUDED.login,
          status = EXCLUDED.status,
          last_sync_at = NOW();
      `;
    } catch (e) {
      console.warn('Error saving Yandex connection to Neon DB, using fallback:', e);
    }
  }

  // Обновляем локальную память
  const idx = memoryConnections.findIndex((c) => c.userId === newConn.userId);
  if (idx >= 0) {
    memoryConnections[idx] = newConn;
  } else {
    memoryConnections.push(newConn);
  }
  saveLocalConnections(memoryConnections);

  return newConn;
}

export async function getDirectConnectionByUserId(userId: string): Promise<YandexDirectConnection | null> {
  const sql = getDb();
  if (sql) {
    try {
      await ensureDatabaseReady();
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

      // 2. Fallback: поиск по current_user или последнему активному подключению
      const fallbackRows = await sql`
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
        WHERE (user_id = 'current_user' OR user_id LIKE 'usr_%') AND status = 'ACTIVE'
        ORDER BY connected_at DESC
        LIMIT 1;
      `;

      if (fallbackRows && fallbackRows.length > 0) {
        return fallbackRows[0] as YandexDirectConnection;
      }
    } catch (e) {
      console.warn('Error querying Yandex connection from Neon DB:', e);
    }
  }

  const exact = memoryConnections.find((c) => c.userId === userId && c.status === 'ACTIVE');
  if (exact) return exact;

  // Fallback в памяти: последнее активное подключение
  const fallback = memoryConnections
    .filter((c) => c.status === 'ACTIVE')
    .sort((a, b) => new Date(b.connectedAt).getTime() - new Date(a.connectedAt).getTime())[0];

  return fallback || null;
}

export async function disconnectDirect(userId: string): Promise<boolean> {
  const sql = getDb();
  if (sql) {
    try {
      await ensureDatabaseReady();
      await sql`
        UPDATE public.yandex_connections
        SET status = 'REVOKED'
        WHERE user_id = ${userId};
      `;
    } catch (e) {
      console.warn('Error revoking Yandex connection in DB:', e);
    }
  }

  memoryConnections = memoryConnections.map((c) =>
    c.userId === userId ? { ...c, status: 'REVOKED' as const } : c
  );
  saveLocalConnections(memoryConnections);
  return true;
}
