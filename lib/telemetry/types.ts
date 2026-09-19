export type TelemetryEventType =
  | 'page_view'
  | 'audit_init'
  | 'audit_completed'
  | 'pricing_open'
  | 'pricing_tier_clicked'
  | 'auth_registered'
  | 'payment_completed'
  | 'custom_action';

export interface TelemetryEventPayload {
  id?: string;
  visitorId: string;
  userId?: string | null;
  eventName: TelemetryEventType;
  pagePath: string;
  utmSource?: string | null;
  utmMedium?: string | null;
  utmCampaign?: string | null;
  utmContent?: string | null;
  utmTerm?: string | null;
  referrer?: string | null;
  metadata?: Record<string, any>;
  userAgent?: string | null;
  createdAt?: string;
}

export interface FunnelStepData {
  stepId: string;
  stepNumber: number;
  title: string;
  description: string;
  count: number;
  conversionFromFirst: number; // Конверсия от 1-го шага (%)
  conversionFromPrev: number;  // Конверсия от предыдущего шага (%)
  dropOffCount: number;
  dropOffPercent: number;
  color: string;
}

export interface FunnelStatsResponse {
  period: 'today' | '7d' | '30d' | 'all';
  totalVisitors: number;
  steps: FunnelStepData[];
  utmSources: Array<{ source: string; visitors: number; audits: number; signups: number; payments: number; conversionRate: number }>;
  dropOffAnalysis: Array<{ reason: string; count: number; percent: number; color: string }>;
  dailyDynamics: Array<{ date: string; label: string; visits: number; audits: number; signups: number; payments: number }>;
  conversionRateOverall: number;
}
