import fs from 'fs';
import path from 'path';
import { getDb, ensureDatabaseReady } from '@/db';
import { AuditReportData } from '@/lib/audit/types';

export interface StoredAuditItem {
  id: string;
  userId?: string | null;
  userEmail?: string | null;
  fileName: string;
  createdAt: string;
  status: string;
  tier: string;
  totalSpendRub: number;
  totalLossRub: number;
  overallScore: number;
  rulesSummary: any;
}

const DATA_DIR = path.join(process.cwd(), '.data');
const AUDITS_FILE = path.join(DATA_DIR, 'audits.json');

function ensureDataDir() {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
  } catch (e) {
    console.warn('Could not create .data directory for audits:', e);
  }
}

function loadLocalAudits(): StoredAuditItem[] {
  try {
    ensureDataDir();
    if (fs.existsSync(AUDITS_FILE)) {
      const content = fs.readFileSync(AUDITS_FILE, 'utf-8');
      const parsed = JSON.parse(content);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (e) {
    console.warn('Error reading local audits:', e);
  }
  return [];
}

function saveLocalAudits(items: StoredAuditItem[]) {
  try {
    ensureDataDir();
    fs.writeFileSync(AUDITS_FILE, JSON.stringify(items, null, 2), 'utf-8');
  } catch (e) {
    console.warn('Error writing local audits:', e);
  }
}

let memoryAudits: StoredAuditItem[] = loadLocalAudits();

export async function saveAuditRecord(data: {
  userId?: string | null;
  userEmail?: string | null;
  fileName: string;
  report: AuditReportData;
  tier?: string;
}): Promise<string> {
  const jobId = `job_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
  const now = new Date().toISOString();

  const auditItem: StoredAuditItem = {
    id: jobId,
    userId: data.userId || null,
    userEmail: data.userEmail ? data.userEmail.toLowerCase() : null,
    fileName: data.fileName,
    createdAt: now,
    status: 'COMPLETED',
    tier: data.tier || 'EXPRESS_SINGLE',
    totalSpendRub: Number(data.report.totalSpendRub) || 0,
    totalLossRub: Number(data.report.totalLossRub) || 0,
    overallScore: Number(data.report.overallScore) || 50,
    rulesSummary: data.report,
  };

  memoryAudits.unshift(auditItem);
  saveLocalAudits(memoryAudits);

  const sql = getDb();
  if (sql) {
    try {
      await ensureDatabaseReady();
      const insertJob = await sql`
        INSERT INTO public.audit_jobs (user_id, user_email, file_name, source_type, status, created_at)
        VALUES (
          ${data.userId || null},
          ${data.userEmail ? data.userEmail.toLowerCase() : null},
          ${data.fileName},
          'YANDEX_DIRECT_XLSX',
          'COMPLETED',
          NOW()
        )
        RETURNING id, created_at;
      `;

      if (insertJob && insertJob[0]) {
        const dbJobId = insertJob[0].id;
        auditItem.id = dbJobId;
        auditItem.createdAt = insertJob[0].created_at ? new Date(insertJob[0].created_at).toISOString() : now;

        await sql`
          INSERT INTO public.audit_reports (
            audit_job_id, tier, total_spend_rub, total_loss_rub, overall_score, rules_summary, created_at
          )
          VALUES (
            ${dbJobId},
            ${auditItem.tier},
            ${auditItem.totalSpendRub},
            ${auditItem.totalLossRub},
            ${auditItem.overallScore},
            ${JSON.stringify(data.report)},
            NOW()
          );
        `;
        saveLocalAudits(memoryAudits);
        return dbJobId;
      }
    } catch (e) {
      console.error('Error persisting audit to Neon DB:', e);
    }
  }

  return jobId;
}

export async function getUserAuditHistory(params: {
  userId?: string | null;
  userEmail?: string | null;
}): Promise<StoredAuditItem[]> {
  const { userId, userEmail } = params;
  const normalizedEmail = userEmail ? userEmail.trim().toLowerCase() : null;

  const sql = getDb();
  if (sql) {
    try {
      await ensureDatabaseReady();

      let rows: any[] = [];
      if (userId && normalizedEmail) {
        rows = await sql`
          SELECT 
            j.id,
            j.user_id as "userId",
            j.user_email as "userEmail",
            j.file_name as "fileName",
            j.created_at as "createdAt",
            j.status,
            COALESCE(r.tier, 'EXPRESS_SINGLE') as tier,
            COALESCE(r.total_spend_rub, 0) as "totalSpendRub",
            COALESCE(r.total_loss_rub, 0) as "totalLossRub",
            COALESCE(r.overall_score, 50) as "overallScore",
            r.rules_summary as "rulesSummary"
          FROM public.audit_jobs j
          LEFT JOIN public.audit_reports r ON r.audit_job_id = j.id
          WHERE j.user_id = ${userId} OR LOWER(j.user_email) = ${normalizedEmail}
          ORDER BY j.created_at DESC
          LIMIT 50;
        `;
      } else if (userId) {
        rows = await sql`
          SELECT 
            j.id,
            j.user_id as "userId",
            j.user_email as "userEmail",
            j.file_name as "fileName",
            j.created_at as "createdAt",
            j.status,
            COALESCE(r.tier, 'EXPRESS_SINGLE') as tier,
            COALESCE(r.total_spend_rub, 0) as "totalSpendRub",
            COALESCE(r.total_loss_rub, 0) as "totalLossRub",
            COALESCE(r.overall_score, 50) as "overallScore",
            r.rules_summary as "rulesSummary"
          FROM public.audit_jobs j
          LEFT JOIN public.audit_reports r ON r.audit_job_id = j.id
          WHERE j.user_id = ${userId}
          ORDER BY j.created_at DESC
          LIMIT 50;
        `;
      } else if (normalizedEmail) {
        rows = await sql`
          SELECT 
            j.id,
            j.user_id as "userId",
            j.user_email as "userEmail",
            j.file_name as "fileName",
            j.created_at as "createdAt",
            j.status,
            COALESCE(r.tier, 'EXPRESS_SINGLE') as tier,
            COALESCE(r.total_spend_rub, 0) as "totalSpendRub",
            COALESCE(r.total_loss_rub, 0) as "totalLossRub",
            COALESCE(r.overall_score, 50) as "overallScore",
            r.rules_summary as "rulesSummary"
          FROM public.audit_jobs j
          LEFT JOIN public.audit_reports r ON r.audit_job_id = j.id
          WHERE LOWER(j.user_email) = ${normalizedEmail}
          ORDER BY j.created_at DESC
          LIMIT 50;
        `;
      }

      if (rows && rows.length > 0) {
        const formatted: StoredAuditItem[] = rows.map((r) => ({
          id: r.id,
          userId: r.userId,
          userEmail: r.userEmail,
          fileName: r.fileName,
          createdAt: r.createdAt ? new Date(r.createdAt).toISOString() : new Date().toISOString(),
          status: r.status || 'COMPLETED',
          tier: r.tier || 'EXPRESS_SINGLE',
          totalSpendRub: Number(r.totalSpendRub) || 0,
          totalLossRub: Number(r.totalLossRub) || 0,
          overallScore: Number(r.overallScore) || 50,
          rulesSummary: typeof r.rulesSummary === 'string' ? JSON.parse(r.rulesSummary) : r.rulesSummary,
        }));
        return formatted;
      }
    } catch (e) {
      console.warn('Error fetching audit history from Neon DB:', e);
    }
  }

  // Fallback к локальной памяти
  return memoryAudits.filter((a) => {
    if (userId && a.userId === userId) return true;
    if (normalizedEmail && a.userEmail && a.userEmail.toLowerCase() === normalizedEmail) return true;
    return false;
  });
}

export async function getAuditById(id: string): Promise<StoredAuditItem | null> {
  const sql = getDb();
  if (sql) {
    try {
      await ensureDatabaseReady();
      const rows = await sql`
        SELECT 
          j.id,
          j.user_id as "userId",
          j.user_email as "userEmail",
          j.file_name as "fileName",
          j.created_at as "createdAt",
          j.status,
          COALESCE(r.tier, 'EXPRESS_SINGLE') as tier,
          COALESCE(r.total_spend_rub, 0) as "totalSpendRub",
          COALESCE(r.total_loss_rub, 0) as "totalLossRub",
          COALESCE(r.overall_score, 50) as "overallScore",
          r.rules_summary as "rulesSummary"
        FROM public.audit_jobs j
        LEFT JOIN public.audit_reports r ON r.audit_job_id = j.id
        WHERE j.id = ${id}
        LIMIT 1;
      `;

      if (rows && rows.length > 0) {
        const r = rows[0];
        return {
          id: r.id,
          userId: r.userId,
          userEmail: r.userEmail,
          fileName: r.fileName,
          createdAt: r.createdAt ? new Date(r.createdAt).toISOString() : new Date().toISOString(),
          status: r.status || 'COMPLETED',
          tier: r.tier || 'EXPRESS_SINGLE',
          totalSpendRub: Number(r.totalSpendRub) || 0,
          totalLossRub: Number(r.totalLossRub) || 0,
          overallScore: Number(r.overallScore) || 50,
          rulesSummary: typeof r.rulesSummary === 'string' ? JSON.parse(r.rulesSummary) : r.rulesSummary,
        };
      }
    } catch (e) {
      console.warn('Error fetching single audit by id from Neon DB:', e);
    }
  }

  // Fallback
  const found = memoryAudits.find((a) => a.id === id);
  return found || null;
}

