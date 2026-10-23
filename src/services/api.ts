import {
  CivicReport,
  CivicIssueCategory,
  Department,
  IssueStatus,
  User,
  AnalyticsSummary,
  AIInsightsResponse,
  AIAnalysis,
  DuplicateMatch,
} from '../types/index.js';

const STORAGE_KEY_USER = 'civiclens_user';
const STORAGE_KEY_TOKEN = 'civiclens_token';

export function getStoredUser(): User | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_USER);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error('Failed to read stored user:', e);
  }
  return null;
}

export function getStoredToken(): string | null {
  try {
    return localStorage.getItem(STORAGE_KEY_TOKEN);
  } catch (e) {
    return null;
  }
}

export function setStoredAuth(user: User, token: string): void {
  try {
    localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(user));
    localStorage.setItem(STORAGE_KEY_TOKEN, token);
  } catch (e) {
    console.error('Failed to store auth:', e);
  }
}

export function setStoredUser(user: User): void {
  try {
    localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(user));
  } catch (e) {
    console.error('Failed to store user:', e);
  }
}

export function clearStoredAuth(): void {
  try {
    localStorage.removeItem(STORAGE_KEY_USER);
    localStorage.removeItem(STORAGE_KEY_TOKEN);
  } catch (e) {
    console.error('Failed to clear auth:', e);
  }
}

function getAuthHeaders(): HeadersInit {
  const token = getStoredToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
    headers['x-session-token'] = token;
  }

  return headers;
}

export async function fetchHealth(): Promise<{
  status: string;
  geminiConfigured: boolean;
  geminiModel: string;
  storageBackend: string;
  currentReportsCount: number;
}> {
  const res = await fetch('/api/health');
  if (!res.ok) throw new Error('Health check failed');
  return res.json();
}

export async function demoLogin(role: 'citizen' | 'admin'): Promise<{ user: User; token: string }> {
  const res = await fetch('/api/auth/demo-login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ role }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Demo login failed');
  }
  const data = await res.json();
  setStoredAuth(data.user, data.token);
  return { user: data.user, token: data.token };
}

export async function switchDemoRole(role: 'citizen' | 'admin'): Promise<User> {
  const result = await demoLogin(role);
  return result.user;
}

export async function signIn(email: string, password: string): Promise<{ user: User; token: string }> {
  const res = await fetch('/api/auth/signin', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Invalid credentials. Please verify your email and password.');
  }
  const data = await res.json();
  setStoredAuth(data.user, data.token);
  return { user: data.user, token: data.token };
}

export async function signUp(
  name: string,
  email: string,
  password: string,
  role: 'citizen' | 'admin' = 'citizen'
): Promise<{ user: User; token: string }> {
  const res = await fetch('/api/auth/signup', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, email, password, role }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Registration failed');
  }
  const data = await res.json();
  setStoredAuth(data.user, data.token);
  return { user: data.user, token: data.token };
}

export async function signOut(): Promise<void> {
  try {
    await fetch('/api/auth/signout', {
      method: 'POST',
      headers: getAuthHeaders(),
    });
  } catch (err) {
    console.error('Sign out request failed:', err);
  } finally {
    clearStoredAuth();
  }
}

export async function fetchReports(filters?: {
  category?: string;
  status?: string;
  department?: string;
  minPriority?: number;
  search?: string;
}): Promise<{ reports: CivicReport[]; totalCount: number; viewerRole: string }> {
  const params = new URLSearchParams();
  if (filters?.category && filters.category !== 'All') params.set('category', filters.category);
  if (filters?.status && filters.status !== 'All') params.set('status', filters.status);
  if (filters?.department && filters.department !== 'All') params.set('department', filters.department);
  if (filters?.minPriority) params.set('minPriority', filters.minPriority.toString());
  if (filters?.search) params.set('search', filters.search);

  const res = await fetch(`/api/reports?${params.toString()}`, {
    headers: getAuthHeaders(),
  });
  if (!res.ok) throw new Error('Failed to load reports');
  return res.json();
}

export async function fetchReportById(id: string): Promise<CivicReport> {
  const res = await fetch(`/api/reports/${id}`, {
    headers: getAuthHeaders(),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `Failed to fetch report ${id}`);
  }
  const data = await res.json();
  return data.report;
}

export async function submitReport(reportData: {
  title: string;
  description: string;
  category: CivicIssueCategory;
  location: string;
  coordinates?: { latitude: number; longitude: number };
  imageUrl?: string;
}): Promise<{
  report: CivicReport;
  isRealAI: boolean;
  errorNotice?: string;
  message: string;
}> {
  const res = await fetch('/api/reports', {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(reportData),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    const msg = err.details ? err.details.join(', ') : err.error || 'Failed to submit report';
    throw new Error(msg);
  }
  return res.json();
}

export async function preScreenReport(data: {
  title: string;
  description: string;
  category?: CivicIssueCategory;
  location?: string;
}): Promise<{
  analysis: AIAnalysis;
  isRealAI: boolean;
  errorNotice?: string;
  suggestedDuplicates: DuplicateMatch[];
}> {
  const res = await fetch('/api/reports/pre-screen', {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Pre-screen failed');
  }
  return res.json();
}

export async function updateReportAdmin(
  id: string,
  updates: {
    status?: IssueStatus;
    assignedDepartment?: Department;
    priorityScore?: number;
    priorityOverrideReason?: string;
    resolutionNotes?: string;
    rejectionReason?: string;
  }
): Promise<{ report: CivicReport; message: string }> {
  const res = await fetch(`/api/reports/${id}`, {
    method: 'PATCH',
    headers: getAuthHeaders(),
    body: JSON.stringify(updates),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to update report');
  }
  return res.json();
}

export async function manageDuplicate(
  id: string,
  dupId: string,
  action: 'confirm' | 'dismiss'
): Promise<{ report: CivicReport; message: string }> {
  const res = await fetch(`/api/reports/${id}/duplicates/${dupId}`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ action }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to update duplicate');
  }
  return res.json();
}

export async function fetchAnalytics(): Promise<AnalyticsSummary> {
  const res = await fetch('/api/analytics', {
    headers: getAuthHeaders(),
  });
  if (!res.ok) throw new Error('Failed to load analytics');
  return res.json();
}

export async function fetchAIInsights(): Promise<AIInsightsResponse> {
  const res = await fetch('/api/ai-insights', {
    headers: getAuthHeaders(),
  });
  if (!res.ok) throw new Error('Failed to load AI insights');
  return res.json();
}

export async function resetDemoData(): Promise<void> {
  const res = await fetch('/api/reset-data', {
    method: 'POST',
    headers: getAuthHeaders(),
  });
  if (!res.ok) throw new Error('Failed to reset demo data');
}
