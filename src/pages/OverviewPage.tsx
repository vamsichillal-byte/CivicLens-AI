import React from 'react';
import {
  CivicReport,
  User,
  AnalyticsSummary,
  IssueStatus,
} from '../types/index.js';
import {
  LayoutDashboard,
  CheckCircle2,
  Clock,
  AlertTriangle,
  ArrowRight,
  Flame,
  PlusCircle,
  Copy,
  Building2,
  Sparkles,
  MapPin,
  ChevronRight,
  Shield,
  FileText,
} from 'lucide-react';
import { NavigationTab } from '../components/Sidebar.js';

interface OverviewPageProps {
  reports: CivicReport[];
  currentUser: User | null;
  analytics: AnalyticsSummary | null;
  onNavigate: (tab: NavigationTab) => void;
  onOpenReportModal: (report: CivicReport) => void;
  onRoleSwitch: (role: 'citizen' | 'admin') => void;
}

export const OverviewPage: React.FC<OverviewPageProps> = ({
  reports,
  currentUser,
  analytics,
  onNavigate,
  onOpenReportModal,
  onRoleSwitch,
}) => {
  const isAdmin = currentUser?.role === 'admin';

  // Citizen stats
  const citizenReports = reports;
  const submittedCount = citizenReports.filter((r) => r.status === 'Submitted').length;
  const inProgressCount = citizenReports.filter(
    (r) => r.status === 'In Progress' || r.status === 'Assigned' || r.status === 'Under Review'
  ).length;
  const resolvedCount = citizenReports.filter((r) => r.status === 'Resolved').length;
  const highPriorityCount = citizenReports.filter((r) => r.priorityScore >= 75).length;

  const latestReport = citizenReports.length > 0 ? citizenReports[0] : null;

  const statusSteps: IssueStatus[] = [
    'Submitted',
    'Under Review',
    'Assigned',
    'In Progress',
    'Resolved',
  ];

  const getStepIndex = (status: IssueStatus) => {
    switch (status) {
      case 'Submitted':
        return 0;
      case 'Under Review':
        return 1;
      case 'Assigned':
        return 2;
      case 'In Progress':
        return 3;
      case 'Resolved':
        return 4;
      case 'Rejected':
        return -1;
    }
  };

  return (
    <div className="space-y-6 pb-12 max-w-6xl mx-auto">
      {/* Welcome Banner */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 sm:p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900">
              {currentUser ? `Welcome back, ${currentUser.name}` : 'Welcome to CivicLens AI'}
            </h1>
            <span
              className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                isAdmin
                  ? 'bg-blue-100 text-blue-900'
                  : currentUser
                  ? 'bg-emerald-100 text-emerald-900'
                  : 'bg-slate-100 text-slate-700'
              }`}
            >
              {currentUser ? currentUser.role : 'Public Visitor'}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            {isAdmin
              ? 'Citywide Operations Console: Review AI triage scores, dispatch municipal units, and resolve citizen complaints.'
              : currentUser
              ? 'Citizen Portal: Track your submitted complaints, view automated AI assessments, and receive resolution updates.'
              : 'Public Overview: Explore municipal civic complaints, live triage status, and transparent resolution metrics.'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {isAdmin ? (
            <button
              onClick={() => onNavigate('admin')}
              className="px-4 py-2.5 rounded-lg bg-blue-900 hover:bg-blue-800 text-white font-semibold text-xs shadow-xs flex items-center gap-2 transition-colors"
            >
              <Shield className="w-4 h-4" />
              <span>Open Triage Queue</span>
            </button>
          ) : (
            <button
              onClick={() => onNavigate('report')}
              className="px-4 py-2.5 rounded-lg bg-blue-900 hover:bg-blue-800 text-white font-semibold text-xs shadow-xs flex items-center gap-2 transition-colors"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Report an Issue</span>
            </button>
          )}
        </div>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-1">
          <div className="text-xs text-slate-500 font-medium">
            {isAdmin ? 'Total City Reports' : 'My Total Reports'}
          </div>
          <div className="text-2xl font-extrabold text-slate-900">{reports.length}</div>
          <div className="text-[11px] text-slate-400">Recorded in audit database</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-1">
          <div className="text-xs text-slate-500 font-medium">In Triage & Progress</div>
          <div className="text-2xl font-extrabold text-amber-600">{inProgressCount}</div>
          <div className="text-[11px] text-amber-600 flex items-center gap-1">
            <Clock className="w-3 h-3" /> Active field workflows
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-1">
          <div className="text-xs text-slate-500 font-medium">Resolved Successfully</div>
          <div className="text-2xl font-extrabold text-emerald-600">{resolvedCount}</div>
          <div className="text-[11px] text-emerald-600 flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" /> With completion notes
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-1">
          <div className="text-xs text-slate-500 font-medium">High / Critical Priority</div>
          <div className="text-2xl font-extrabold text-rose-600">{highPriorityCount}</div>
          <div className="text-[11px] text-rose-600 flex items-center gap-1">
            <Flame className="w-3 h-3" /> Score &ge; 75/100
          </div>
        </div>
      </div>

      {/* Citizen View: Latest Report Timeline Tracker */}
      {!isAdmin && latestReport && (
        <div className="bg-white rounded-xl border border-slate-200 p-5 sm:p-6 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded">
                Active Tracking: {latestReport.id}
              </span>
              <h2 className="text-base font-bold text-slate-900 mt-1">{latestReport.title}</h2>
            </div>
            <button
              onClick={() => onOpenReportModal(latestReport)}
              className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1 self-start sm:self-auto"
            >
              <span>View Full AI Breakdown</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Interactive Progress Pipeline */}
          {latestReport.status === 'Rejected' ? (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-800 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <strong>Report Closed / Rejected:</strong>{' '}
                {latestReport.rejectionReason || 'Duplicate or invalid submission.'}
              </div>
            </div>
          ) : (
            <div className="pt-3">
              <div className="grid grid-cols-5 gap-2 text-center">
                {statusSteps.map((step, idx) => {
                  const currentIdx = getStepIndex(latestReport.status);
                  const isPassed = currentIdx >= idx;
                  const isCurrent = currentIdx === idx;

                  return (
                    <div key={step} className="space-y-1.5">
                      <div
                        className={`h-2 rounded-full transition-all ${
                          isPassed ? 'bg-blue-600' : 'bg-slate-200'
                        }`}
                      ></div>
                      <span
                        className={`text-[10px] block ${
                          isCurrent
                            ? 'font-bold text-blue-900'
                            : isPassed
                            ? 'font-medium text-slate-700'
                            : 'text-slate-400'
                        }`}
                      >
                        {step}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Admin Quick Triage Banner */}
      {isAdmin && (
        <div className="bg-gradient-to-r from-blue-900 to-indigo-950 text-white rounded-xl p-5 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-blue-400" />
              <h2 className="text-sm font-bold tracking-wide uppercase">
                Supervisor Dispatch Alert
              </h2>
            </div>
            <span className="text-xs text-blue-300 font-mono">
              {reports.filter((r) => r.assignedDepartment === 'Unassigned').length} Unassigned
            </span>
          </div>
          <p className="text-xs text-slate-200 leading-relaxed">
            The Gemini AI model has triaged incoming citizen reports and flagged high-urgency items
            requiring departmental dispatch.
          </p>
          <div className="pt-1">
            <button
              onClick={() => onNavigate('admin')}
              className="px-4 py-2 bg-white text-blue-950 hover:bg-blue-50 font-bold text-xs rounded-lg transition-colors flex items-center gap-1.5"
            >
              <span>Manage Administration Queue</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Recent Reports List */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-slate-900">
              {isAdmin ? 'Latest Incoming City Reports' : 'Your Recent Submissions'}
            </h2>
            <p className="text-[11px] text-slate-500">
              Click any report to view AI analysis, priority calculation, and duplicate signals.
            </p>
          </div>

          <button
            onClick={() => onNavigate('reports')}
            className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1"
          >
            <span>View All</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        <div className="divide-y divide-slate-100">
          {reports.slice(0, 5).map((report) => (
            <div
              key={report.id}
              onClick={() => onOpenReportModal(report)}
              className="p-4 hover:bg-slate-50 cursor-pointer transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3 group"
            >
              <div className="space-y-1 flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-[11px] font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded">
                    {report.id}
                  </span>
                  <span className="text-[11px] text-slate-500">{report.category}</span>
                  {report.duplicateMatches && report.duplicateMatches.length > 0 && (
                    <span className="text-[10px] text-purple-700 bg-purple-50 px-1.5 py-0.2 rounded font-semibold flex items-center gap-1">
                      <Copy className="w-2.5 h-2.5" /> Duplicate Alert
                    </span>
                  )}
                </div>
                <h3 className="text-xs font-bold text-slate-900 truncate group-hover:text-blue-600 transition-colors">
                  {report.title}
                </h3>
                <div className="flex items-center gap-3 text-[11px] text-slate-400">
                  <span className="flex items-center gap-1 truncate max-w-[200px]">
                    <MapPin className="w-3 h-3" />
                    {report.location}
                  </span>
                  <span>•</span>
                  <span>{new Date(report.createdAt).toLocaleDateString()}</span>
                </div>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <div className="text-right">
                  <div className="text-xs font-bold text-slate-900">
                    Priority {report.priorityScore}/100
                  </div>
                  <div className="text-[11px] text-slate-500">{report.status}</div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-blue-600 transition-colors" />
              </div>
            </div>
          ))}

          {reports.length === 0 && (
            <div className="p-8 text-center text-slate-400 text-xs">
              No reports filed yet. Click &ldquo;Report an Issue&rdquo; to begin.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
