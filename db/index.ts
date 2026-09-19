import { neon, NeonQueryFunction } from '@neondatabase/serverless';
import { SQL_INIT_SCHEMA } from './schema';

let sqlClient: NeonQueryFunction<false, false> | null = null;

export function isDatabaseConfigured(): boolean {
  return Boolean(process.env.DATABASE_URL && process.env.DATABASE_URL.startsWith('postgres'));
}

export function getDatabaseConnectionString(): string | null {
  return process.env.DATABASE_URL || null;
}

export function getDb() {
  const url = getDatabaseConnectionString();
  if (!url) {
    return null;
  }
  if (!sqlClient) {
    sqlClient = neon(url);
  }
  return sqlClient;
}

let isSchemaReady = false;

/**
 * Автоматическая накатка схемы БД (app_users, profiles, audit_jobs, audit_reports, payments)
 */
export async function initializeDatabaseSchema(): Promise<{ success: boolean; message: string }> {
  const sql = getDb();
  if (!sql) {
    return {
      success: false,
      message: 'DATABASE_URL не настроен в переменных окружения.',
    };
  }

  try {
    const statements = SQL_INIT_SCHEMA.split(';')
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    for (const statement of statements) {
      try {
        if (typeof (sql as any).query === 'function') {
          await (sql as any).query(statement);
        } else {
          await (sql as any)([statement] as any);
        }
      } catch {
        await (sql as any)([statement] as any);
      }
    }
    isSchemaReady = true;
    return {
      success: true,
      message: 'Таблицы Cransys (app_users, profiles, audit_jobs, audit_reports, payments) успешно инициализированы в Neon.',
    };
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Неизвестная ошибка инициализации БД';
    return {
      success: false,
      message: `Ошибка при создании таблиц: ${msg}`,
    };
  }
}

export async function ensureDatabaseReady(): Promise<boolean> {
  if (isSchemaReady) return true;
  const res = await initializeDatabaseSchema();
  return res.success;
}
