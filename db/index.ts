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

/**
 * Автоматическая накатка схемы БД (profiles, audit_jobs, audit_reports, payments)
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
    // Выполняем создание таблиц
    const template = [SQL_INIT_SCHEMA] as unknown as TemplateStringsArray;
    await sql(template);
    return {
      success: true,
      message: 'Таблицы Cransys (profiles, audit_jobs, audit_reports, payments) успешно инициализированы в Neon.',
    };
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Неизвестная ошибка инициализации БД';
    return {
      success: false,
      message: `Ошибка при создании таблиц: ${msg}`,
    };
  }
}
