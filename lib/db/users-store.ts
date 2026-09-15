import fs from 'fs';
import path from 'path';
import { UserTier, getTierConfig } from '@/lib/billing/tiers';

export interface StoredUser {
  id: string;
  email: string;
  passwordHash: string; // В нашей безопасной среде храним пароль/хэш
  name: string;
  role: 'ADMIN' | 'TESTER_ADMIN' | 'USER';
  tier: UserTier;
  hasPaid: boolean; // Оплачен ли тариф
  reportsUsed: number;
  reportsLimit: number;
  isBlocked: boolean;
  revenue: number;
  createdAt: string;
  lastActive: string;
  agencyName?: string;
  agencyContact?: string;
  agencyWebsite?: string;
  customNotes?: string;
}

const DATA_DIR = path.join(process.cwd(), '.data');
const USERS_FILE = path.join(DATA_DIR, 'users.json');

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    try {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    } catch (e) {
      console.warn('Could not create .data directory:', e);
    }
  }
}

const DEFAULT_USERS: StoredUser[] = [
  {
    id: 'admin_root_master',
    email: (process.env.ADMIN_EMAIL || 'admin@cransys.ru').toLowerCase(),
    passwordHash: process.env.ADMIN_PASSWORD || 'AdminCransys2026!',
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
    agencyName: 'Cransys Analytics Headquarter',
  },
  {
    id: 'test_owner_account',
    email: (process.env.TEST_USER_EMAIL || 'test-owner@cransys-audit.ru').toLowerCase(),
    passwordHash: process.env.TEST_USER_PASSWORD || 'CransysTest2026!',
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
    agencyName: 'Digital Direct Agency',
    agencyContact: '@direct_expert / +7 (999) 000-00-00',
    agencyWebsite: 'https://agency-direct.ru',
    customNotes: 'Аудит проведен ведущим контекстологом агентства.',
  },
  {
    id: 'usr_alex_001',
    email: 'alex.director@avto-podbor.ru',
    passwordHash: 'Client2026Pass!',
    name: 'Александр (Автоподбор РФ)',
    role: 'USER',
    tier: 'PRO',
    hasPaid: true,
    reportsUsed: 4,
    reportsLimit: 10,
    isBlocked: false,
    revenue: 2990,
    createdAt: '2026-09-02',
    lastActive: '2026-09-15',
    agencyName: 'Автоподбор РФ',
  },
  {
    id: 'usr_agency_002',
    email: 'agency.lead@digital-scale.pro',
    passwordHash: 'ScalePro2026!',
    name: 'Максим (Digital Scale Agency)',
    role: 'USER',
    tier: 'MAX',
    hasPaid: true,
    reportsUsed: 18,
    reportsLimit: 30,
    isBlocked: false,
    revenue: 6990,
    createdAt: '2026-08-28',
    lastActive: '2026-09-14',
    agencyName: 'Digital Scale Agency',
    agencyContact: '+7 (495) 777-88-99',
    agencyWebsite: 'https://digital-scale.pro',
  },
  {
    id: 'usr_corp_003',
    email: 'ceo@holding-group.ru',
    passwordHash: 'Holding2026Secret!',
    name: 'Елена (Холдинг Групп)',
    role: 'USER',
    tier: 'CORP',
    hasPaid: true,
    reportsUsed: 84,
    reportsLimit: 500,
    isBlocked: false,
    revenue: 29900,
    createdAt: '2026-09-01',
    lastActive: '2026-09-15',
    agencyName: 'Holding Group Media',
  },
  {
    id: 'usr_single_004',
    email: 'ivan.stroy@mebel-dom.ru',
    passwordHash: 'MebelDom123!',
    name: 'Иван Сергеев',
    role: 'USER',
    tier: 'EXPRESS_SINGLE',
    hasPaid: true,
    reportsUsed: 1,
    reportsLimit: 1,
    isBlocked: false,
    revenue: 399,
    createdAt: '2026-09-10',
    lastActive: '2026-09-12',
  },
];

// In-memory fallback
let memoryUsers: StoredUser[] = [...DEFAULT_USERS];

export function getAllUsers(): StoredUser[] {
  try {
    ensureDataDir();
    if (fs.existsSync(USERS_FILE)) {
      const content = fs.readFileSync(USERS_FILE, 'utf-8');
      const parsed = JSON.parse(content);
      if (Array.isArray(parsed) && parsed.length > 0) {
        memoryUsers = parsed;
        return memoryUsers;
      }
    }
  } catch (e) {
    console.warn('Error reading users file, using memory:', e);
  }
  saveUsers(memoryUsers);
  return memoryUsers;
}

export function saveUsers(users: StoredUser[]): boolean {
  memoryUsers = users;
  try {
    ensureDataDir();
    fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2), 'utf-8');
    return true;
  } catch (e) {
    console.warn('Error writing users file:', e);
    return false;
  }
}

export function findUserByEmail(email: string): StoredUser | null {
  const users = getAllUsers();
  const normalized = email.trim().toLowerCase();
  return users.find((u) => u.email.toLowerCase() === normalized) || null;
}

export function findUserById(id: string): StoredUser | null {
  const users = getAllUsers();
  return users.find((u) => u.id === id) || null;
}

export function createUser(userData: {
  email: string;
  password: string;
  name: string;
  tier?: UserTier;
  role?: 'ADMIN' | 'TESTER_ADMIN' | 'USER';
  hasPaid?: boolean;
}): StoredUser {
  const users = getAllUsers();
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
    createdAt: new Date().toISOString().split('T')[0],
    lastActive: new Date().toISOString().split('T')[0],
  };

  users.push(newUser);
  saveUsers(users);
  return newUser;
}

export function updateUser(
  id: string,
  patch: Partial<Omit<StoredUser, 'id'>>
): StoredUser | null {
  const users = getAllUsers();
  const index = users.findIndex((u) => u.id === id);
  if (index === -1) return null;

  users[index] = {
    ...users[index],
    ...patch,
  };
  saveUsers(users);
  return users[index];
}

export function deleteUser(id: string): boolean {
  const users = getAllUsers();
  const filtered = users.filter((u) => u.id !== id);
  if (filtered.length === users.length) return false;
  saveUsers(filtered);
  return true;
}
