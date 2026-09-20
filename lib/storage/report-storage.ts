import fs from 'fs';
import path from 'path';

export interface ReportStorageOptions {
  userId?: string;
  userEmail?: string;
  fileName?: string;
  score?: number;
  totalLossRub?: number;
  totalSpendRub?: number;
  tier?: string;
  isDemo?: boolean;
  [key: string]: any;
}

export interface StoredReportMeta {
  reportId: string;
  userId?: string;
  userEmail?: string;
  fileName: string;
  sizeBytes: number;
  uploadedAt: string;
  provider: 'r2' | 'local';
}

const LOCAL_STORAGE_DIR = path.join(process.cwd(), '.data', 'reports');

function ensureLocalStorage() {
  try {
    if (!fs.existsSync(LOCAL_STORAGE_DIR)) {
      fs.mkdirSync(LOCAL_STORAGE_DIR, { recursive: true });
    }
  } catch (e) {
    console.warn('Could not initialize local reports storage directory:', e);
  }
}

export async function saveAuditReport(
  reportId: string,
  reportData: Record<string, any>,
  meta?: ReportStorageOptions
): Promise<StoredReportMeta> {
  const isR2 = !!(process.env.R2_ACCOUNT_ID && process.env.R2_ACCESS_KEY_ID && process.env.R2_SECRET_ACCESS_KEY);

  ensureLocalStorage();
  const filePath = path.join(LOCAL_STORAGE_DIR, `${reportId}.json`);
  const content = JSON.stringify(reportData, null, 2);

  try {
    fs.writeFileSync(filePath, content, 'utf-8');
  } catch (e) {
    console.warn('Error saving report to local disk:', e);
  }

  return {
    reportId,
    userId: meta?.userId,
    userEmail: meta?.userEmail,
    fileName: meta?.fileName || `${reportId}.json`,
    sizeBytes: Buffer.byteLength(content),
    uploadedAt: new Date().toISOString(),
    provider: isR2 ? 'r2' : 'local',
  };
}

// Alias для совместимости
export const saveReportToStorage = saveAuditReport;

export async function getAuditReport(reportId: string): Promise<Record<string, any> | null> {
  ensureLocalStorage();
  const filePath = path.join(LOCAL_STORAGE_DIR, `${reportId}.json`);
  try {
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, 'utf-8');
      return JSON.parse(content);
    }
  } catch (e) {
    console.warn(`Error reading report ${reportId}:`, e);
  }
  return null;
}

// Alias для совместимости
export const getReportFromStorage = getAuditReport;

export async function getStorageStatus() {
  const isR2 = !!(process.env.R2_ACCOUNT_ID && process.env.R2_ACCESS_KEY_ID);
  return {
    provider: isR2 ? 'r2' : 'local',
    r2Configured: isR2,
    bucketName: process.env.R2_BUCKET_NAME || 'cransys-reports',
  };
}
