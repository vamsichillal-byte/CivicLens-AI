import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import {
  CivicReport,
  User,
  UserSession,
  AnalyticsSummary,
  AIInsightsResponse,
  IssueStatus,
  CivicIssueCategory,
  SeverityLevel,
  Department,
} from '../types/index.js';
import { INITIAL_REPORTS, INITIAL_USERS } from './seedData.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.resolve(__dirname, '../../data');
const DATA_FILE = path.join(DATA_DIR, 'civic_reports.json');
const USERS_FILE = path.join(DATA_DIR, 'civic_users.json');
const SESSIONS_FILE = path.join(DATA_DIR, 'civic_sessions.json');

function hashPassword(password: string, salt: string): string {
  return crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');
}

export function toSafeUser(user: User): User {
  const { passwordHash, passwordSalt, ...safe } = user;
  return safe;
}

class CivicDataStore {
  private reports: CivicReport[] = [];
  private users: User[] = [];
  private sessions: UserSession[] = [];

  constructor() {
    this.init();
  }

  private init() {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }

      if (fs.existsSync(DATA_FILE)) {
        const fileContent = fs.readFileSync(DATA_FILE, 'utf-8');
        this.reports = JSON.parse(fileContent);
      } else {
        this.reports = [...INITIAL_REPORTS];
        this.saveReports();
      }

      if (fs.existsSync(USERS_FILE)) {
        const userContent = fs.readFileSync(USERS_FILE, 'utf-8');
        this.users = JSON.parse(userContent);
      } else {
        // Initialize seed users with pre-hashed passwords
        this.users = INITIAL_USERS.map((u) => {
          const salt = crypto.randomBytes(16).toString('hex');
          const defaultPassword = u.role === 'admin' ? 'admin123' : 'demo123';
          return {
            ...u,
            passwordSalt: salt,
            passwordHash: hashPassword(defaultPassword, salt),
          };
        });
        this.saveUsers();
      }

      // Ensure seed users have valid password hashes
      let userUpdated = false;
      this.users = this.users.map((u) => {
        if (!u.passwordHash || !u.passwordSalt) {
          userUpdated = true;
          const salt = crypto.randomBytes(16).toString('hex');
          const defaultPassword = u.role === 'admin' ? 'admin123' : 'demo123';
          return {
            ...u,
            passwordSalt: salt,
            passwordHash: hashPassword(defaultPassword, salt),
          };
        }
        return u;
      });
      if (userUpdated) this.saveUsers();

      if (fs.existsSync(SESSIONS_FILE)) {
        const sessionContent = fs.readFileSync(SESSIONS_FILE, 'utf-8');
        this.sessions = JSON.parse(sessionContent);
      } else {
        this.sessions = [];
        this.saveSessions();
      }
    } catch (err) {
      console.warn('Could not initialize file-based persistence, using memory cache:', err);
      this.reports = [...INITIAL_REPORTS];
      this.users = [...INITIAL_USERS];
      this.sessions = [];
    }
  }

  private saveReports() {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      fs.writeFileSync(DATA_FILE, JSON.stringify(this.reports, null, 2), 'utf-8');
    } catch (err) {
      console.error('Failed to save reports to disk:', err);
    }
  }

  private saveUsers() {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      fs.writeFileSync(USERS_FILE, JSON.stringify(this.users, null, 2), 'utf-8');
    } catch (err) {
      console.error('Failed to save users to disk:', err);
    }
  }

  private saveSessions() {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      fs.writeFileSync(SESSIONS_FILE, JSON.stringify(this.sessions, null, 2), 'utf-8');
    } catch (err) {
      console.error('Failed to save sessions to disk:', err);
    }
  }

  public resetToSeedData() {
    this.reports = [...INITIAL_REPORTS];
    this.users = INITIAL_USERS.map((u) => {
      const salt = crypto.randomBytes(16).toString('hex');
      const defaultPassword = u.role === 'admin' ? 'admin123' : 'demo123';
      return {
        ...u,
        passwordSalt: salt,
        passwordHash: hashPassword(defaultPassword, salt),
      };
    });
    this.sessions = [];
    this.saveReports();
    this.saveUsers();
    this.saveSessions();
  }

  // Authentication & Session methods
  public authenticateUser(
    email: string,
    password: string
  ): { user: User; token: string } | null {
    const user = this.findUserByEmail(email);
    if (!user || !user.passwordHash || !user.passwordSalt) {
      return null;
    }

    const testHash = hashPassword(password, user.passwordSalt);
    if (!crypto.timingSafeEqual(Buffer.from(testHash, 'hex'), Buffer.from(user.passwordHash, 'hex'))) {
      return null;
    }

    const session = this.createSession(user.id);
    return {
      user: toSafeUser(user),
      token: session.token,
    };
  }

  public registerUser(
    name: string,
    email: string,
    password: string,
    role: 'citizen' | 'admin' = 'citizen'
  ): { user: User; token: string } {
    const trimmedEmail = email.toLowerCase().trim();
    if (this.findUserByEmail(trimmedEmail)) {
      throw new Error('An account with this email already exists');
    }

    if (password.length < 6) {
      throw new Error('Password must be at least 6 characters long');
    }

    const salt = crypto.randomBytes(16).toString('hex');
    const hash = hashPassword(password, salt);

    const newUser: User = {
      id: `usr_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      name: name.trim(),
      email: trimmedEmail,
      role,
      passwordSalt: salt,
      passwordHash: hash,
    };

    this.users.push(newUser);
    this.saveUsers();

    const session = this.createSession(newUser.id);
    return {
      user: toSafeUser(newUser),
      token: session.token,
    };
  }

  public createSession(userId: string): UserSession {
    const token = `cvl_sess_${crypto.randomBytes(32).toString('hex')}`;
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString(); // 7 days

    const session: UserSession = {
      token,
      userId,
      createdAt: now.toISOString(),
      expiresAt,
    };

    // Clean expired sessions
    this.sessions = this.sessions.filter(
      (s) => new Date(s.expiresAt).getTime() > Date.now()
    );

    this.sessions.push(session);
    this.saveSessions();
    return session;
  }

  public getUserByToken(token: string): User | null {
    if (!token) return null;

    const session = this.sessions.find((s) => s.token === token);
    if (!session) return null;

    // Check expiration
    if (new Date(session.expiresAt).getTime() <= Date.now()) {
      this.revokeSession(token);
      return null;
    }

    const user = this.findUserById(session.userId);
    return user ? toSafeUser(user) : null;
  }

  public revokeSession(token: string): boolean {
    const initialLen = this.sessions.length;
    this.sessions = this.sessions.filter((s) => s.token !== token);
    if (this.sessions.length !== initialLen) {
      this.saveSessions();
      return true;
    }
    return false;
  }

  public getUsers(): User[] {
    return this.users.map(toSafeUser);
  }

  public findUserByEmail(email: string): User | undefined {
    return this.users.find((u) => u.email.toLowerCase() === email.toLowerCase());
  }

  public findUserById(id: string): User | undefined {
    return this.users.find((u) => u.id === id);
  }

  public addUser(user: User): User {
    this.users.push(user);
    this.saveUsers();
    return toSafeUser(user);
  }

  // Report methods
  public getAllReports(): CivicReport[] {
    return [...this.reports].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  public getReportsForUser(userId: string): CivicReport[] {
    return this.reports
      .filter((r) => r.submittedBy.id === userId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  public getReportById(id: string): CivicReport | undefined {
    return this.reports.find((r) => r.id === id);
  }

  public createReport(report: CivicReport): CivicReport {
    this.reports.unshift(report);
    this.saveReports();
    return report;
  }

  public updateReport(id: string, updates: Partial<CivicReport>): CivicReport | null {
    const index = this.reports.findIndex((r) => r.id === id);
    if (index === -1) return null;

    const existing = this.reports[index];
    const updated: CivicReport = {
      ...existing,
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    this.reports[index] = updated;
    this.saveReports();
    return updated;
  }

  // Analytics Computation
  public computeAnalytics(): AnalyticsSummary {
    const totalReports = this.reports.length;

    const statusCounts: Record<IssueStatus, number> = {
      Submitted: 0,
      'Under Review': 0,
      Assigned: 0,
      'In Progress': 0,
      Resolved: 0,
      Rejected: 0,
    };

    const categoryCounts: Record<CivicIssueCategory, number> = {
      'Pothole / Damaged Road': 0,
      'Garbage / Waste': 0,
      'Water Leakage': 0,
      'Broken Streetlight': 0,
      'Drainage / Flooding': 0,
      Other: 0,
    };

    const severityCounts: Record<SeverityLevel, number> = {
      Low: 0,
      Medium: 0,
      High: 0,
      Critical: 0,
    };

    const priorityDistribution = {
      low: 0,
      medium: 0,
      high: 0,
      critical: 0,
    };

    let unresolvedHighPriorityCount = 0;
    let potentialDuplicateCount = 0;

    let totalResolutionHours = 0;
    let resolvedCountWithTimestamps = 0;

    const departmentMap = new Map<
      Department,
      { activeCount: number; resolvedCount: number; totalPriority: number }
    >();

    const departments: Department[] = [
      'Roads & Infrastructure',
      'Waste Management',
      'Water Supply & Sanitation',
      'Electrical & Lighting',
      'Drainage & Flood Control',
      'Public Safety & Enforcement',
    ];

    departments.forEach((dept) => {
      departmentMap.set(dept, { activeCount: 0, resolvedCount: 0, totalPriority: 0 });
    });

    const trendMap = new Map<string, number>();

    for (const report of this.reports) {
      if (statusCounts[report.status] !== undefined) {
        statusCounts[report.status]++;
      }
      if (categoryCounts[report.category] !== undefined) {
        categoryCounts[report.category]++;
      }
      const sev = report.aiAnalysis.severity;
      if (severityCounts[sev] !== undefined) {
        severityCounts[sev]++;
      }

      const score = report.priorityScore;
      if (score >= 85) priorityDistribution.critical++;
      else if (score >= 66) priorityDistribution.high++;
      else if (score >= 36) priorityDistribution.medium++;
      else priorityDistribution.low++;

      const isResolved = report.status === 'Resolved';
      const isRejected = report.status === 'Rejected';

      if (!isResolved && !isRejected && score >= 75) {
        unresolvedHighPriorityCount++;
      }

      if (report.duplicateMatches && report.duplicateMatches.length > 0) {
        potentialDuplicateCount++;
      }

      // Compute actual resolution time from timestamps
      if (isResolved && report.resolvedAt) {
        const createdMs = new Date(report.createdAt).getTime();
        const resolvedMs = new Date(report.resolvedAt).getTime();
        if (resolvedMs > createdMs) {
          const hours = (resolvedMs - createdMs) / (1000 * 60 * 60);
          totalResolutionHours += hours;
          resolvedCountWithTimestamps++;
        }
      }

      // Department workload
      const dept = report.assignedDepartment !== 'Unassigned' ? report.assignedDepartment : report.aiAnalysis.recommendedDepartment;
      if (dept && dept !== 'Unassigned') {
        const stats = departmentMap.get(dept) || { activeCount: 0, resolvedCount: 0, totalPriority: 0 };
        if (isResolved) {
          stats.resolvedCount++;
        } else if (!isRejected) {
          stats.activeCount++;
        }
        stats.totalPriority += score;
        departmentMap.set(dept, stats);
      }

      // Trend by date
      const dateKey = report.createdAt.slice(0, 10);
      trendMap.set(dateKey, (trendMap.get(dateKey) || 0) + 1);
    }

    const avgResolutionTimeHours =
      resolvedCountWithTimestamps > 0
        ? Math.round((totalResolutionHours / resolvedCountWithTimestamps) * 10) / 10
        : null;

    const departmentWorkload = Array.from(departmentMap.entries()).map(([department, data]) => {
      const totalDeptReports = data.activeCount + data.resolvedCount;
      return {
        department,
        activeCount: data.activeCount,
        resolvedCount: data.resolvedCount,
        avgPriority: totalDeptReports > 0 ? Math.round(data.totalPriority / totalDeptReports) : 0,
      };
    });

    const recentTrends = Array.from(trendMap.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([date, count]) => ({ date, count }));

    return {
      totalReports,
      statusCounts,
      categoryCounts,
      severityCounts,
      priorityDistribution,
      unresolvedHighPriorityCount,
      avgResolutionTimeHours,
      departmentWorkload,
      recentTrends,
      potentialDuplicateCount,
      isSampleData: false,
    };
  }

  // AI Insights Generation
  public getAIInsights(): AIInsightsResponse {
    const reports = this.reports;

    // 1. High priority items requiring review
    const urgentReviewItems = reports
      .filter((r) => r.status !== 'Resolved' && r.status !== 'Rejected' && r.priorityScore >= 70)
      .sort((a, b) => b.priorityScore - a.priorityScore)
      .slice(0, 5)
      .map((r) => ({
        reportId: r.id,
        title: r.title,
        priorityScore: r.priorityScore,
        safetyRisks: r.aiAnalysis.safetyRisks,
        urgencyReasons: r.aiAnalysis.urgencyReasons,
        recommendedDepartment: r.aiAnalysis.recommendedDepartment,
      }));

    // 2. Category percentages
    const categoryTotals: Record<string, number> = {};
    for (const r of reports) {
      categoryTotals[r.category] = (categoryTotals[r.category] || 0) + 1;
    }
    const topCategories = Object.entries(categoryTotals)
      .map(([category, count]) => ({
        category: category as CivicIssueCategory,
        count,
        percentage: Math.round((count / (reports.length || 1)) * 100),
      }))
      .sort((a, b) => b.count - a.count);

    // 3. Duplicate clusters
    const duplicateClusters: AIInsightsResponse['duplicateClusters'] = [];
    const visited = new Set<string>();

    for (const r of reports) {
      if (visited.has(r.id)) continue;
      if (r.duplicateMatches && r.duplicateMatches.length > 0) {
        const relatedIds = r.duplicateMatches.map((m) => m.reportId);
        visited.add(r.id);
        relatedIds.forEach((id) => visited.add(id));

        duplicateClusters.push({
          clusterId: `CLUST-${r.id.split('-').pop()}`,
          primaryReportId: r.id,
          primaryTitle: r.title,
          relatedReportIds: relatedIds,
          locationArea: r.location,
          detectedPattern: `High co-location density for ${r.category} reported within 200m radius.`,
        });
      }
    }

    // 4. Resource Allocation
    const activeRoads = reports.filter(
      (r) => r.assignedDepartment === 'Roads & Infrastructure' && r.status !== 'Resolved'
    ).length;
    const activeWater = reports.filter(
      (r) => r.assignedDepartment === 'Water Supply & Sanitation' && r.status !== 'Resolved'
    ).length;
    const activeDrainage = reports.filter(
      (r) => r.assignedDepartment === 'Drainage & Flood Control' && r.status !== 'Resolved'
    ).length;

    const resourceAllocationRecommendations: AIInsightsResponse['resourceAllocationRecommendations'] = [
      {
        department: 'Water Supply & Sanitation',
        urgencyLevel: activeWater > 1 ? 'High' : 'Medium',
        reasoning: `Identified ${activeWater} active pressurized water and main-break events with severe structural cavity and foundation erosion potential.`,
        supportingReportIds: reports
          .filter((r) => r.category === 'Water Leakage' && r.status !== 'Resolved')
          .map((r) => r.id),
      },
      {
        department: 'Roads & Infrastructure',
        urgencyLevel: activeRoads > 0 ? 'High' : 'Low',
        reasoning: `School crosswalk zones experiencing critical vehicular swerving and high rim-damage impact. Rapid pothole patching deployment needed.`,
        supportingReportIds: reports
          .filter((r) => r.category === 'Pothole / Damaged Road' && r.status !== 'Resolved')
          .map((r) => r.id),
      },
      {
        department: 'Drainage & Flood Control',
        urgencyLevel: 'Medium',
        reasoning: `Upcoming seasonal precipitation necessitates preemptive clearing of underpass catch basins to prevent recurrent multi-lane hydroplaning ponding.`,
        supportingReportIds: reports
          .filter((r) => r.category === 'Drainage / Flooding')
          .map((r) => r.id),
      },
    ];

    // 5. Preventive Actions
    const preventiveActionSuggestions: AIInsightsResponse['preventiveActionSuggestions'] = [
      {
        actionTitle: 'Pre-Storm Lateral Culvert Jetting',
        category: 'Drainage / Flooding',
        recommendation:
          'Concentrated leaf and debris clogs on Bayview underpasses indicate need for bi-weekly municipal street-sweeping and vacuum maintenance prior to forecast weather events.',
        supportingReportIds: reports
          .filter((r) => r.category === 'Drainage / Flooding')
          .map((r) => r.id),
      },
      {
        actionTitle: 'Targeted School-Zone Road Resurfacing',
        category: 'Pothole / Damaged Road',
        recommendation:
          'Recurring potholes along Elm Street crosswalk point to sub-base asphalt fatigue under repeated bus axle loads. Recommend full thermal mill-and-inlay repaving.',
        supportingReportIds: reports
          .filter((r) => r.category === 'Pothole / Damaged Road')
          .map((r) => r.id),
      },
      {
        actionTitle: 'Substation Circuit Breaker Diagnostics',
        category: 'Broken Streetlight',
        recommendation:
          'Multiple simultaneous luminaire blackouts on 14th & Mission reflect central breaker trip rather than individual lamp burnouts. Inspect 14-M control relay enclosure.',
        supportingReportIds: reports
          .filter((r) => r.category === 'Broken Streetlight')
          .map((r) => r.id),
      },
    ];

    return {
      urgentReviewItems,
      topCategories,
      duplicateClusters,
      resourceAllocationRecommendations,
      preventiveActionSuggestions,
    };
  }
}

export const dataStore = new CivicDataStore();
