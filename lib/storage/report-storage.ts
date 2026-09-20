import fs from 'fs';
import path from 'path';
import { S3Client, PutObjectCommand, GetObjectCommand, HeadBucketCommand, ListObjectsV2Command } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { getR2Config } from '@/lib/r2';

const DATA_DIR = path.join(process.cwd(), '.data');
const REPORTS_DIR = path.join(DATA_DIR, 'reports');

function ensureReportsDir() {
  try {
    if (!fs.existsSync(REPORTS_DIR)) {
      fs.mkdirSync(REPORTS_DIR, { recursive: true });
    }
  } catch (e) {
    console.warn('Could not create reports directory:', e);
  }
}

let s3ClientInstance: S3Client | null = null;

function getS3Client(): S3Client | null {
  const config = getR2Config();
  if (!config) return null;

  if (!s3ClientInstance) {
    s3ClientInstance = new S3Client({
      region: 'auto',
      endpoint: `https://${config.accountId}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: config.accessKeyId,
        secretAccessKey: config.secretAccessKey,
      },
    });
  }

  return s3ClientInstance;
}

export interface StoredReportMetadata {
  id: string;
  userId?: string;
  userEmail?: string;
  fileName: string;
  createdAt: string;
  score: number;
  totalLossRub: number;
  totalSpendRub: number;
  tier: string;
  storage: 'R2_AND_LOCAL' | 'LOCAL_ONLY';
  r2Key?: string;
  fileSizeBytes: number;
}

/**
 * Сохранение полного отчета аудита в R2 Storage + локальный защищенный кэш
 */
export async function saveReportToStorage(
  reportId: string,
  reportData: Record<string, any>,
  meta: {
    userId?: string;
    userEmail?: string;
    fileName: string;
    score: number;
    totalLossRub: number;
    totalSpendRub: number;
    tier: string;
  }
): Promise<{ success: boolean; r2Key?: string; storage: 'R2_AND_LOCAL' | 'LOCAL_ONLY'; error?: string }> {
  ensureReportsDir();
  const serialized = JSON.stringify({ metadata: meta, report: reportData }, null, 2);
  const localFilePath = path.join(REPORTS_DIR, `${reportId}.json`);

  // 1. Локальное сохранение (всегда надежный fallback)
  try {
    fs.writeFileSync(localFilePath, serialized, 'utf-8');
  } catch (e) {
    console.warn('Local file write error:', e);
  }

  // 2. Cloudflare R2 Upload
  const client = getS3Client();
  const config = getR2Config();

  if (client && config) {
    try {
      const r2Key = `audits/${new Date().getFullYear()}/${reportId}.json`;
      await client.send(
        new PutObjectCommand({
          Bucket: config.bucketName,
          Key: r2Key,
          Body: Buffer.from(serialized, 'utf-8'),
          ContentType: 'application/json',
          Metadata: {
            'report-id': reportId,
            'user-email': meta.userEmail || 'guest',
            'created-at': new Date().toISOString(),
          },
        })
      );

      return {
        success: true,
        r2Key,
        storage: 'R2_AND_LOCAL',
      };
    } catch (r2Error) {
      const msg = r2Error instanceof Error ? r2Error.message : 'Ошибка загрузки в R2';
      console.warn('Cloudflare R2 upload failed, retained in local storage:', msg);
      return {
        success: true,
        storage: 'LOCAL_ONLY',
        error: msg,
      };
    }
  }

  return {
    success: true,
    storage: 'LOCAL_ONLY',
  };
}

/**
 * Получение отчета по ID
 */
export async function getReportFromStorage(reportId: string): Promise<any | null> {
  ensureReportsDir();
  const localFilePath = path.join(REPORTS_DIR, `${reportId}.json`);

  // Сначала проверяем локальный кэш
  if (fs.existsSync(localFilePath)) {
    try {
      const content = fs.readFileSync(localFilePath, 'utf-8');
      return JSON.parse(content);
    } catch {}
  }

  // Если локально нет — пробуем выгрузить из Cloudflare R2
  const client = getS3Client();
  const config = getR2Config();
  if (client && config) {
    try {
      const r2Key = `audits/${new Date().getFullYear()}/${reportId}.json`;
      const res = await client.send(
        new GetObjectCommand({
          Bucket: config.bucketName,
          Key: r2Key,
        })
      );
      if (res.Body) {
        const str = await res.Body.transformToString();
        const parsed = JSON.parse(str);
        // кэшируем локально
        try {
          fs.writeFileSync(localFilePath, str, 'utf-8');
        } catch {}
        return parsed;
      }
    } catch (e) {
      console.warn('R2 getObject error:', e);
    }
  }

  return null;
}

/**
 * Получение Presigned URL для скачивания отчета из R2
 */
export async function getReportDownloadUrl(r2Key: string): Promise<string | null> {
  const client = getS3Client();
  const config = getR2Config();
  if (!client || !config) return null;

  try {
    const command = new GetObjectCommand({
      Bucket: config.bucketName,
      Key: r2Key,
    });
    return await getSignedUrl(client, command, { expiresIn: 3600 }); // Ссылка на 1 час
  } catch {
    return null;
  }
}

/**
 * Проверка статуса хранилища R2 для админки
 */
export async function getStorageDiagnostics(): Promise<{
  r2Configured: boolean;
  r2Connected: boolean;
  bucketName: string;
  localReportsCount: number;
  totalLocalBytes: number;
  latencyMs: number;
  error?: string;
}> {
  ensureReportsDir();
  let localCount = 0;
  let totalBytes = 0;

  try {
    const files = fs.readdirSync(REPORTS_DIR);
    localCount = files.filter((f) => f.endsWith('.json')).length;
    files.forEach((f) => {
      try {
        const st = fs.statSync(path.join(REPORTS_DIR, f));
        totalBytes += st.size;
      } catch {}
    });
  } catch {}

  const config = getR2Config();
  if (!config) {
    return {
      r2Configured: false,
      r2Connected: false,
      bucketName: 'cransys-audit-reports (не настроен)',
      localReportsCount: localCount,
      totalLocalBytes: totalBytes,
      latencyMs: 0,
    };
  }

  const client = getS3Client();
  let connected = false;
  let latencyMs = 0;
  let errorMsg: string | undefined;

  if (client) {
    const start = Date.now();
    try {
      await client.send(new HeadBucketCommand({ Bucket: config.bucketName }));
      connected = true;
      latencyMs = Date.now() - start;
    } catch (e) {
      latencyMs = Date.now() - start;
      errorMsg = e instanceof Error ? e.message : 'Не удалось подключиться к R2';
    }
  }

  return {
    r2Configured: true,
    r2Connected: connected,
    bucketName: config.bucketName,
    localReportsCount: localCount,
    totalLocalBytes: totalBytes,
    latencyMs,
    error: errorMsg,
  };
}
