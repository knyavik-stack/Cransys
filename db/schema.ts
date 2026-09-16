/**
 * Схема БД Cransys (Neon PostgreSQL 15 + Drizzle ORM)
 * В соответствии с архитектурной картой v2
 */

export interface ProfileRecord {
  id: string; // Clerk User ID (user_2bX...)
  email: string;
  firstName?: string | null;
  lastName?: string | null;
  createdAt: string;
}

export interface AuditJobRecord {
  id: string; // UUID
  userId?: string | null;
  fileName: string;
  sourceType: 'YANDEX_DIRECT_XLSX' | 'YANDEX_DIRECT_CSV';
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  createdAt: string;
}

export interface AuditReportRecord {
  id: string; // UUID
  auditJobId: string;
  tier: 'EXPRESS' | 'PRO' | 'MAX';
  totalSpendRub: number;
  totalLossRub: number;
  overallScore: number;
  rulesSummary: Record<string, unknown>;
  r2ObjectKey?: string | null;
  createdAt: string;
}

export interface PaymentRecord {
  id: string; // UUID
  reportId?: string | null;
  userId?: string | null;
  amountRub: number;
  tariffTarget: 'PRO' | 'MAX';
  paymentStatus: 'PENDING' | 'SUCCEEDED' | 'CANCELLED';
  yookassaPaymentId?: string | null;
  createdAt: string;
}

// SQL DDL Schema для миграций Neon.tech:
export const SQL_INIT_SCHEMA = `
CREATE TABLE IF NOT EXISTS public.app_users (
  id VARCHAR(255) PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  role VARCHAR(50) DEFAULT 'USER' NOT NULL,
  tier VARCHAR(50) DEFAULT 'EXPRESS_SINGLE' NOT NULL,
  has_paid BOOLEAN DEFAULT FALSE NOT NULL,
  reports_used INT DEFAULT 0 NOT NULL,
  reports_limit INT DEFAULT 1 NOT NULL,
  is_blocked BOOLEAN DEFAULT FALSE NOT NULL,
  revenue NUMERIC(12, 2) DEFAULT 0 NOT NULL,
  email_verified BOOLEAN DEFAULT FALSE NOT NULL,
  verification_code VARCHAR(10),
  verification_expires TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  last_active VARCHAR(50),
  agency_name VARCHAR(255),
  agency_contact VARCHAR(255),
  agency_website VARCHAR(255),
  custom_notes TEXT
);

CREATE TABLE IF NOT EXISTS public.profiles (
  id VARCHAR(255) PRIMARY KEY,
  email VARCHAR(255) NOT NULL,
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.audit_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id VARCHAR(255),
  user_email VARCHAR(255),
  file_name VARCHAR(255) NOT NULL,
  source_type VARCHAR(50) DEFAULT 'YANDEX_DIRECT_XLSX' NOT NULL,
  status VARCHAR(20) DEFAULT 'COMPLETED' NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.audit_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  audit_job_id UUID REFERENCES public.audit_jobs(id) ON DELETE CASCADE NOT NULL,
  tier VARCHAR(50) DEFAULT 'EXPRESS_SINGLE' NOT NULL,
  total_spend_rub NUMERIC(14, 2) NOT NULL,
  total_loss_rub NUMERIC(14, 2) NOT NULL,
  overall_score INT NOT NULL,
  rules_summary JSONB NOT NULL,
  r2_object_key VARCHAR(500),
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id UUID REFERENCES public.audit_reports(id),
  user_id VARCHAR(255),
  amount_rub NUMERIC(10, 2) NOT NULL,
  tariff_target VARCHAR(20) NOT NULL,
  payment_status VARCHAR(20) DEFAULT 'PENDING' NOT NULL,
  yookassa_payment_id VARCHAR(255) UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_audit_jobs_user ON public.audit_jobs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_jobs_email ON public.audit_jobs(user_email);
CREATE INDEX IF NOT EXISTS idx_audit_reports_job ON public.audit_reports(audit_job_id);
CREATE INDEX IF NOT EXISTS idx_app_users_email ON public.app_users(email);
`;
