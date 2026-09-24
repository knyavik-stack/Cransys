import { SearchQueryItem, SearchQueryAiReport } from '../ai/search-query-analyst';

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
  searchQueries?: SearchQueryItem[];
  period?: {
    from: string;
    to: string;
  };
}

export interface AiFindingItem {
  title: string;
  severity: 'CRITICAL' | 'WARNING' | 'INFO';
  campaignName?: string;
  description: string;
  actionRequired: string;
}

export interface AiAnalysisData {
  summary: string;
  nicheAssessment: string;
  wastedBudgetRub: number;
  topIssues: AiFindingItem[];
  growthPotential: {
    potentialLeadsIncreasePercent: number;
    recommendedMonthlyBudgetRub: number;
    forecastExplanation: string;
  };
  contractorChecklist: string[];
}

export interface ExecutiveSummary {
  headline: string;
  verdictText: string;
  criticalIssuesCount: number;
  warningsCount: number;
  potentialGrowthLeads: number;
  targetCpaBenchmarkRub: number;
  quickActionSteps: string[];
}

export interface AuditReportData {
  overallScore: number; // 0..100 Health Score
  totalSpendRub: number;
  totalConversions?: number;
  totalClicks?: number;
  totalImpressions?: number;
  avgCtr?: number;
  avgCpc?: number;
  avgCr?: number;
  avgCpa?: number;
  totalLossRub: number;
  totalPotentialLossRub?: number;
  totalWasteRub?: number;
  healthyBudgetRub: number;
  rules: RuleResult[];
  campaignsCount: number;
  generatedAt: string;
  campaigns?: CampaignData[];
  aiAnalysis?: AiAnalysisData;
  searchQueryAnalysis?: SearchQueryAiReport;
  executiveSummary?: ExecutiveSummary;
  isDemo?: boolean;
}

export type AuditReport = AuditReportData;

export interface IAuditRule {
  readonly id: string;
  readonly name: string;
  execute(data: AuditInputData): Promise<RuleResult> | RuleResult;
}

