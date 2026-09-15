/**
 * Подключение к базе данных Neon.tech (Serverless PostgreSQL)
 * Безопасная инициализация с защитой от сбоя при отсутствии DATABASE_URL
 */

export function isDatabaseConfigured(): boolean {
  return Boolean(process.env.DATABASE_URL && process.env.DATABASE_URL.startsWith('postgres'));
}

export function getDatabaseConnectionString(): string | null {
  return process.env.DATABASE_URL || null;
}
