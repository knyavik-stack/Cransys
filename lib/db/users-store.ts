import fs from 'fs';
import path from 'path';
import { UserTier, getTierConfig } from '@/lib/billing/tiers';
import { getDb, ensureDatabaseReady } from '@/db';

export interface StoredUser {
  id: string;
  email: string;
  passwordHash: string;
  name: string;
  role: 'ADMIN' | 'TESTER_ADMIN' | 'USER';
  tier: UserTier;
  hasPaid: boolean;
  reportsUsed: number;
  reportsLimit: number;
  isBlocked: boolean;
  revenue: number;
  createdAt: string;
  lastActive: string;
  emailVerified: boolean;
  verificationCode?: string;
  verificationExpires?: string;
  agencyName?: string;
  agencyContact?: string;
  agencyWebsite?: string;
  customNotes?: string;
}

const DATA_DIR = path.join(process.cwd(), '.data');
const USERS_FILE = path.join(DATA_DIR, 'users.json');

function ensureDataDir() {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
  } catch (e) {
    console.warn('Could not create .data directory:', e);
  }
}

export const DEFAULT_USERS: StoredUser[] = [
  {
    id: 'admin_root_master',
    email: (process.env.ADMIN_EMAIL || 'admin@cransys.ru').toLowerCase(),
    passwordHash: process.env.ADMIN_PASSWORD || '',
    name: 'Главный Администратор',
    role: 'ADMIN',
    tier: 'CORP',
    hasPaid: true,
    reportsUsed: 0,
    reportsLimit: 500,
    isBlocked: false,
    revenue: 0,
    createdAt: '2026-01-01T00:00:00.000Z',
    lastActive: new Date().toISOString().split('T')[0],
    emailVerified: true,
    agencyName: 'Cransys Analytics Headquarter',
  },
  {
    id: 'test_owner_account',
    email: (process.env.TEST_USER_EMAIL || 'test-owner@cransys-audit.ru').toLowerCase(),
    passwordHash: process.env.TEST_USER_PASSWORD || '',
    name: 'Тестовый аккаунт (Собственник)',
    role: 'TESTER_ADMIN',
    tier: 'MAX',
    hasPaid: true,
    reportsUsed: 2,
    reportsLimit: 30,
    isBlocked: false,
    revenue: 0,
    createdAt: '2026-08-15T00:00:00.000Z',
    lastActive: new Date().toISOString().split('T')[0],
    emailVerified: true,
    agencyName: 'Digital Direct Agency',
    agencyContact: '@direct_expert / +7 (999) 000-00-00',
    agencyWebsite: 'https://agency-direct.ru',
    customNotes: 'Аудит проведен ведущим контекстологом агентства.',
  },
];

// In-memory cache
let memoryUsers: StoredUser[] = [...DEFAULT_USERS];
let isDbSeeded = false;

// Чтение локального дискового кэша
function loadLocalFile(): StoredUser[] | null {
  try {
    ensureDataDir();
    if (fs.existsSync(USERS_FILE)) {
      const content = fs.readFileSync(USERS_FILE, 'utf-8');
      const parsed = JSON.parse(content);
      if (Array.isArray(parsed) && parsed.length > 0) {
        // Никогда не восстанавливаем пароли из файла
        return parsed.map((u: any) => ({
          ...u,
          passwordHash: '',
          verificationCode: undefined,
        }));
      }
    }
  } catch (e) {
    console.warn('Error reading local users file:', e);
  }
  return null;
}

function writeLocalFile(users: StoredUser[]) {
  try {
    ensureDataDir();
    // СТРОГО ИСКЛЮЧАЕМ пароли и секреты перед любой записью на диск!
    const sanitized = users.map((u) => {
      const { passwordHash, verificationCode, ...safeUser } = u;
      return safeUser;
    });
    fs.writeFileSync(USERS_FILE, JSON.stringify(sanitized, null, 2), 'utf-8');
  } catch (e) {
    console.warn('Error writing local users file:', e);
  }
}

// Преобразование строки БД в StoredUser
function mapDbRowToUser(row: any): StoredUser {
  return {
    id: row.id,
    email: row.email,
    passwordHash: row.password_hash || row.passwordHash || '',
    name: row.name,
    role: row.role as any,
    tier: row.tier as any,
    hasPaid: Boolean(row.has_paid ?? row.hasPaid),
    reportsUsed: Number(row.reports_used ?? row.reportsUsed) || 0,
    reportsLimit: Number(row.reports_limit ?? row.reportsLimit) || 1,
    isBlocked: Boolean(row.is_blocked ?? row.isBlocked),
    revenue: Number(row.revenue) || 0,
    createdAt: row.created_at ? new Date(row.created_at).toISOString() : new Date().toISOString(),
    lastActive: row.last_active || row.lastActive || new Date().toISOString().split('T')[0],
    emailVerified: Boolean(row.email_verified ?? row.emailVerified),
    verificationCode: row.verification_code || row.verificationCode || undefined,
    verificationExpires: row.verification_expires ? new Date(row.verification_expires).toISOString() : undefined,
    agencyName: row.agency_name || row.agencyName || undefined,
    agencyContact: row.agency_contact || row.agencyContact || undefined,
    agencyWebsite: row.agency_website || row.agencyWebsite || undefined,
    customNotes: row.custom_notes || row.customNotes || undefined,
  };
}

// Инициализация и сидинг БД при первом запуске
async function syncWithNeonDb(): Promise<StoredUser[]> {
  const sql = getDb();
  if (!sql) {
    const fromFile = loadLocalFile();
    if (fromFile) memoryUsers = fromFile;
    return memoryUsers;
  }

  try {
    await ensureDatabaseReady();

    const rows = await sql`SELECT * FROM public.app_users ORDER BY created_at DESC;`;
    if (rows && rows.length > 0) {
      const dbUsers = rows.map(mapDbRowToUser);
      memoryUsers = dbUsers;
      writeLocalFile(memoryUsers);
      isDbSeeded = true;
      return memoryUsers;
    }

    // Если таблица пустая — наполняем дефолтными пользователями
    if (!isDbSeeded) {
      for (const u of DEFAULT_USERS) {
        await sql`
          INSERT INTO public.app_users (
            id, email, password_hash, name, role, tier, has_paid,
            reports_used, reports_limit, is_blocked, revenue,
            created_at, last_active, email_verified, agency_name, agency_contact, agency_website, custom_notes
          ) VALUES (
            ${u.id}, ${u.email.toLowerCase()}, ${u.passwordHash}, ${u.name}, ${u.role}, ${u.tier},
            ${u.hasPaid}, ${u.reportsUsed}, ${u.reportsLimit}, ${u.isBlocked}, ${u.revenue},
            ${u.createdAt}, ${u.lastActive}, ${u.emailVerified}, ${u.agencyName || null},
            ${u.agencyContact || null}, ${u.agencyWebsite || null}, ${u.customNotes || null}
          )
          ON CONFLICT (email) DO NOTHING;
        `;
      }
      isDbSeeded = true;
      const refetched = await sql`SELECT * FROM public.app_users ORDER BY created_at DESC;`;
      if (refetched && refetched.length > 0) {
        memoryUsers = refetched.map(mapDbRowToUser);
        writeLocalFile(memoryUsers);
        return memoryUsers;
      }
    }
  } catch (e) {
    console.warn('Neon DB sync error, falling back to local storage:', e);
  }

  const fromFile = loadLocalFile();
  if (fromFile) memoryUsers = fromFile;
  return memoryUsers;
}

// Первоначальный синхронный разогрев кэша
const initFile = loadLocalFile();
if (initFile) {
  memoryUsers = initFile;
} else {
  writeLocalFile(memoryUsers);
}

// Получить всех пользователей (Async - приоритет БД)
export async function getAllUsersAsync(): Promise<StoredUser[]> {
  return await syncWithNeonDb();
}

// Синхронный метод для быстрых операций (читает кэш, обновляя БД в фоне)
export function getAllUsers(): StoredUser[] {
  // Запускаем фоновую синхронизацию
  syncWithNeonDb().catch(() => {});
  return memoryUsers;
}

export function saveUsers(users: StoredUser[]): boolean {
  memoryUsers = users;
  writeLocalFile(users);
  return true;
}

export async function findUserByEmail(email: string): Promise<StoredUser | null> {
  const normalized = email.trim().toLowerCase();
  const sql = getDb();

  if (sql) {
    try {
      await ensureDatabaseReady();
      const rows = await sql`
        SELECT * FROM public.app_users 
        WHERE LOWER(email) = ${normalized}
        LIMIT 1;
      `;
      if (rows && rows.length > 0) {
        const u = mapDbRowToUser(rows[0]);
        // Обновляем в локальном кэше
        const idx = memoryUsers.findIndex((x) => x.id === u.id || x.email.toLowerCase() === normalized);
        if (idx >= 0) memoryUsers[idx] = u;
        else memoryUsers.push(u);
        writeLocalFile(memoryUsers);
        return u;
      }
    } catch (e) {
      console.warn('Error querying Neon DB for user by email:', e);
    }
  }

  // Fallback к памяти
  return memoryUsers.find((u) => u.email.toLowerCase() === normalized) || null;
}

export function findUserByEmailSync(email: string): StoredUser | null {
  const normalized = email.trim().toLowerCase();
  return memoryUsers.find((u) => u.email.toLowerCase() === normalized) || null;
}

export async function findUserById(id: string): Promise<StoredUser | null> {
  const sql = getDb();
  if (sql) {
    try {
      await ensureDatabaseReady();
      const rows = await sql`
        SELECT * FROM public.app_users 
        WHERE id = ${id}
        LIMIT 1;
      `;
      if (rows && rows.length > 0) {
        const u = mapDbRowToUser(rows[0]);
        return u;
      }
    } catch (e) {
      console.warn('Error querying user by ID in Neon DB:', e);
    }
  }

  return memoryUsers.find((u) => u.id === id) || null;
}

export async function createUser(userData: {
  email: string;
  password: string;
  name: string;
  tier?: UserTier;
  role?: 'ADMIN' | 'TESTER_ADMIN' | 'USER';
  hasPaid?: boolean;
  emailVerified?: boolean;
  verificationCode?: string;
  verificationExpires?: string;
}): Promise<StoredUser> {
  const normalizedEmail = userData.email.trim().toLowerCase();
  const tier: UserTier = userData.tier || 'EXPRESS_SINGLE';
  const config = getTierConfig(tier);

  const newUser: StoredUser = {
    id: `usr_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    email: normalizedEmail,
    passwordHash: userData.password,
    name: userData.name.trim() || normalizedEmail.split('@')[0] || 'Пользователь',
    role: userData.role || 'USER',
    tier: tier,
    hasPaid: userData.hasPaid ?? false,
    reportsUsed: 0,
    reportsLimit: config.reportsLimit,
    isBlocked: false,
    revenue: userData.hasPaid ? config.price : 0,
    createdAt: new Date().toISOString(),
    lastActive: new Date().toISOString().split('T')[0],
    emailVerified: userData.emailVerified ?? false,
    verificationCode: userData.verificationCode,
    verificationExpires: userData.verificationExpires,
  };

  // Обновляем локальный кэш
  const existingIdx = memoryUsers.findIndex((u) => u.email.toLowerCase() === normalizedEmail);
  if (existingIdx >= 0) {
    memoryUsers[existingIdx] = newUser;
  } else {
    memoryUsers.unshift(newUser);
  }
  writeLocalFile(memoryUsers);

  // Сохраняем в Neon PostgreSQL
  const sql = getDb();
  if (sql) {
    try {
      await ensureDatabaseReady();
      await sql`
        INSERT INTO public.app_users (
          id, email, password_hash, name, role, tier, has_paid,
          reports_used, reports_limit, is_blocked, revenue,
          created_at, last_active, email_verified, verification_code, verification_expires
        ) VALUES (
          ${newUser.id}, ${newUser.email}, ${newUser.passwordHash}, ${newUser.name},
          ${newUser.role}, ${newUser.tier}, ${newUser.hasPaid}, ${newUser.reportsUsed},
          ${newUser.reportsLimit}, ${newUser.isBlocked}, ${newUser.revenue},
          ${newUser.createdAt}, ${newUser.lastActive}, ${newUser.emailVerified},
          ${newUser.verificationCode || null}, ${newUser.verificationExpires || null}
        )
        ON CONFLICT (email) DO UPDATE SET
          password_hash = EXCLUDED.password_hash,
          name = EXCLUDED.name,
          verification_code = EXCLUDED.verification_code,
          verification_expires = EXCLUDED.verification_expires;
      `;

      // Также создаем запись в profiles
      try {
        await sql`
          INSERT INTO public.profiles (id, email, first_name)
          VALUES (${newUser.id}, ${newUser.email}, ${newUser.name})
          ON CONFLICT (id) DO NOTHING;
        `;
      } catch {}
    } catch (e) {
      console.error('Error inserting user to Neon DB:', e);
    }
  }

  return newUser;
}

export async function updateUser(
  id: string,
  patch: Partial<Omit<StoredUser, 'id'>>
): Promise<StoredUser | null> {
  // Сначала обновляем в памяти
  const index = memoryUsers.findIndex((u) => u.id === id);
  let updatedUser: StoredUser | null = null;

  if (index !== -1) {
    memoryUsers[index] = {
      ...memoryUsers[index],
      ...patch,
    };
    updatedUser = memoryUsers[index];
    writeLocalFile(memoryUsers);
  }

  // Обновляем в Neon PostgreSQL
  const sql = getDb();
  if (sql) {
    try {
      await ensureDatabaseReady();

      if (patch.passwordHash !== undefined) {
        await sql`UPDATE public.app_users SET password_hash = ${patch.passwordHash} WHERE id = ${id};`;
      }
      if (patch.name !== undefined) {
        await sql`UPDATE public.app_users SET name = ${patch.name} WHERE id = ${id};`;
      }
      if (patch.email !== undefined) {
        await sql`UPDATE public.app_users SET email = ${patch.email.toLowerCase()} WHERE id = ${id};`;
      }
      if (patch.tier !== undefined) {
        await sql`UPDATE public.app_users SET tier = ${patch.tier} WHERE id = ${id};`;
      }
      if (patch.reportsLimit !== undefined) {
        await sql`UPDATE public.app_users SET reports_limit = ${patch.reportsLimit} WHERE id = ${id};`;
      }
      if (patch.reportsUsed !== undefined) {
        await sql`UPDATE public.app_users SET reports_used = ${patch.reportsUsed} WHERE id = ${id};`;
      }
      if (patch.isBlocked !== undefined) {
        await sql`UPDATE public.app_users SET is_blocked = ${patch.isBlocked} WHERE id = ${id};`;
      }
      if (patch.revenue !== undefined) {
        await sql`UPDATE public.app_users SET revenue = ${patch.revenue} WHERE id = ${id};`;
      }
      if (patch.lastActive !== undefined) {
        await sql`UPDATE public.app_users SET last_active = ${patch.lastActive} WHERE id = ${id};`;
      }
      if (patch.emailVerified !== undefined) {
        await sql`UPDATE public.app_users SET email_verified = ${patch.emailVerified} WHERE id = ${id};`;
      }
      if (patch.verificationCode !== undefined) {
        await sql`UPDATE public.app_users SET verification_code = ${patch.verificationCode} WHERE id = ${id};`;
      }
      if (patch.verificationExpires !== undefined) {
        await sql`UPDATE public.app_users SET verification_expires = ${patch.verificationExpires} WHERE id = ${id};`;
      }
      if (patch.agencyName !== undefined) {
        await sql`UPDATE public.app_users SET agency_name = ${patch.agencyName} WHERE id = ${id};`;
      }

      const rows = await sql`SELECT * FROM public.app_users WHERE id = ${id} LIMIT 1;`;
      if (rows && rows.length > 0) {
        updatedUser = mapDbRowToUser(rows[0]);
        if (index !== -1) memoryUsers[index] = updatedUser;
        writeLocalFile(memoryUsers);
      }
    } catch (e) {
      console.error('Error updating user in Neon DB:', e);
    }
  }

  return updatedUser;
}

export async function deleteUser(id: string): Promise<boolean> {
  const prevLen = memoryUsers.length;
  memoryUsers = memoryUsers.filter((u) => u.id !== id);
  writeLocalFile(memoryUsers);

  const sql = getDb();
  if (sql) {
    try {
      await ensureDatabaseReady();
      await sql`DELETE FROM public.app_users WHERE id = ${id};`;
    } catch (e) {
      console.error('Error deleting user from Neon DB:', e);
    }
  }

  return memoryUsers.length < prevLen;
}

// Генерация 6-значного кода подтверждения email
export function generateVerificationCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Проверка кода верификации email
export async function verifyUserEmailCode(
  email: string,
  code: string
): Promise<{ success: boolean; error?: string; user?: StoredUser }> {
  const normalized = email.trim().toLowerCase();
  const user = await findUserByEmail(normalized);

  if (!user) {
    return { success: false, error: 'Пользователь с таким email не найден' };
  }

  if (user.emailVerified) {
    return { success: true, user };
  }

  if (!user.verificationCode) {
    return { success: false, error: 'Код подтверждения не был запрошен' };
  }

  if (user.verificationCode !== code.trim()) {
    return { success: false, error: 'Неверный код подтверждения' };
  }

  if (user.verificationExpires) {
    const exp = new Date(user.verificationExpires).getTime();
    if (Date.now() > exp) {
      return { success: false, error: 'Срок действия кода истек. Запросите новый код.' };
    }
  }

  const updated = await updateUser(user.id, {
    emailVerified: true,
    verificationCode: undefined,
    verificationExpires: undefined,
    lastActive: new Date().toISOString(),
  });

  return { success: true, user: updated || user };
}
