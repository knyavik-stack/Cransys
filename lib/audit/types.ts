export type RuleSeverity = 'CRITICAL' | 'WARNING' | 'INFO';

export interface RuleResult {
  ruleId: string;
  severity: RuleSeverity;
  title: string;
  fact: string;
  flagged: boolean;
  estimatedLossRub: number;
  recommendation: string;
  isLockedInExpress: boolean;
}

export interface CampaignData {
  id: string;
  name: string;
  type: 'SEARCH' | 'RSYA' | 'SMART' | 'UNKNOWN';
  strategy: string;
  spendRub: number;
  clicks: number;
  impressions: number;
  conversions: number;
  desktopSpendRub?: number;
  desktopConversions?: number;
  mobileSpendRub?: number;
  mobileConversions?: number;
}

export interface AuditInputData {
  campaigns: CampaignData[];
  totalSpendRub: number;
  totalConversions: number;
  currency?: string;
  period?: {
    from: string;
    to: string;
  };
}

export interface AuditReportData {
  overallScore: number; // 0..100 Health Score
  totalSpendRub: number;
  totalLossRub: number;
  healthyBudgetRub: number;
  rules: RuleResult[];
  campaignsCount: number;
  generatedAt: string;
}

export interface IAuditRule {
  readonly id: string;
  readonly name: string;
  execute(data: AuditInputData): Promise<RuleResult> | RuleResult;
}
