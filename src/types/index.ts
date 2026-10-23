export type CivicIssueCategory =
  | 'Pothole / Damaged Road'
  | 'Garbage / Waste'
  | 'Water Leakage'
  | 'Broken Streetlight'
  | 'Drainage / Flooding'
  | 'Other';

export type IssueStatus =
  | 'Submitted'
  | 'Under Review'
  | 'Assigned'
  | 'In Progress'
  | 'Resolved'
  | 'Rejected';

export type SeverityLevel = 'Low' | 'Medium' | 'High' | 'Critical';

export type Department =
  | 'Roads & Infrastructure'
  | 'Waste Management'
  | 'Water Supply & Sanitation'
  | 'Electrical & Lighting'
  | 'Drainage & Flood Control'
  | 'Public Safety & Enforcement'
  | 'Unassigned';

export interface ScoreFactors {
  safetyImpact: number; // 0 - 35
  infrastructureDamage: number; // 0 - 25
  affectedPopulationRisk: number; // 0 - 25
  ageFactor: number; // 0 - 15
  rationale: string;
}

export interface AIAnalysis {
  summary: string;
  predictedCategory: CivicIssueCategory;
  severity: SeverityLevel;
  safetyRisks: string[];
  urgency: 'Low' | 'Medium' | 'High' | 'Critical';
  urgencyReasons: string;
  priorityScore: number; // 0 - 100
  scoreFactors: ScoreFactors;
  recommendedDepartment: Department;
  recommendedActions: [string, string, string] | string[];
  estimatedResponseTimeframe: string; // explicitly marked as estimate
  confidenceScore: number; // 0 - 1
  missingInformation: string[];
  source: 'gemini-3.8-flash' | 'rule-engine-fallback';
  analyzedAt: string;
}

export interface DuplicateMatch {
  reportId: string;
  reportTitle?: string;
  reportCategory?: CivicIssueCategory;
  similarityScore: number; // 0 to 100%
  reasons: string[];
  distanceMeters: number | null;
  status: 'suggested' | 'confirmed' | 'dismissed';
}

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  actor: string;
  actorRole: 'citizen' | 'admin' | 'system';
  action: string;
  details: string;
}

export interface CivicReport {
  id: string;
  title: string;
  description: string;
  category: CivicIssueCategory;
  location: string;
  coordinates?: {
    latitude: number;
    longitude: number;
  };
  imageUrl?: string;
  status: IssueStatus;
  createdAt: string;
  updatedAt: string;
  resolvedAt?: string;
  submittedBy: {
    id: string;
    name: string;
    email: string;
  };
  assignedDepartment: Department;
  priorityScore: number;
  priorityOverridden: boolean;
  priorityOverrideReason?: string;
  aiAnalysis: AIAnalysis;
  duplicateMatches: DuplicateMatch[];
  rejectionReason?: string;
  resolutionNotes?: string;
  auditHistory: AuditLogEntry[];
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'citizen' | 'admin';
  department?: Department;
  organization?: string;
  passwordHash?: string;
  passwordSalt?: string;
}

export interface UserSession {
  token: string;
  userId: string;
  createdAt: string;
  expiresAt: string;
}

export interface AnalyticsSummary {
  totalReports: number;
  statusCounts: Record<IssueStatus, number>;
  categoryCounts: Record<CivicIssueCategory, number>;
  severityCounts: Record<SeverityLevel, number>;
  priorityDistribution: {
    low: number; // 0 - 35
    medium: number; // 36 - 65
    high: number; // 66 - 84
    critical: number; // 85 - 100
  };
  unresolvedHighPriorityCount: number;
  avgResolutionTimeHours: number | null; // null if no resolved issues
  departmentWorkload: Array<{
    department: Department;
    activeCount: number;
    resolvedCount: number;
    avgPriority: number;
  }>;
  recentTrends: Array<{
    date: string;
    count: number;
  }>;
  potentialDuplicateCount: number;
  isSampleData: boolean;
}

export interface AIInsightsResponse {
  urgentReviewItems: Array<{
    reportId: string;
    title: string;
    priorityScore: number;
    safetyRisks: string[];
    urgencyReasons: string;
    recommendedDepartment: Department;
  }>;
  topCategories: Array<{
    category: CivicIssueCategory;
    count: number;
    percentage: number;
  }>;
  duplicateClusters: Array<{
    clusterId: string;
    primaryReportId: string;
    primaryTitle: string;
    relatedReportIds: string[];
    locationArea: string;
    detectedPattern: string;
  }>;
  resourceAllocationRecommendations: Array<{
    department: Department;
    urgencyLevel: 'High' | 'Medium' | 'Low';
    reasoning: string;
    supportingReportIds: string[];
  }>;
  preventiveActionSuggestions: Array<{
    actionTitle: string;
    category: CivicIssueCategory;
    recommendation: string;
    supportingReportIds: string[];
  }>;
}
