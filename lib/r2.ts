/**
 * Cloudflare R2 Клиент хранения отчетов и выгрузок
 * 10 GB бесплатного хранения, 0$ за исходящий трафик (egress).
 */

export interface R2Config {
  accountId: string;
  accessKeyId: string;
  secretAccessKey: string;
  bucketName: string;
}

export function getR2Config(): R2Config | null {
  const accountId = process.env.R2_ACCOUNT_ID;
  const accessKeyId = process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
  const bucketName = process.env.R2_BUCKET_NAME || 'cransys-audit-reports';

  if (!accountId || !accessKeyId || !secretAccessKey) {
    return null;
  }

  return { accountId, accessKeyId, secretAccessKey, bucketName };
}

export function isR2Configured(): boolean {
  return Boolean(getR2Config());
}
