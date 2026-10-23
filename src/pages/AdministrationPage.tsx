import React, { useState } from 'react';
import {
  CivicReport,
  User,
  IssueStatus,
  Department,
} from '../types/index.js';
import {
  Shield,
  Filter,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Building2,
  Sparkles,
  Flame,
  Copy,
  History,
  Check,
  X,
  Lock,
  ChevronRight,
  ExternalLink,
  Edit3,
} from 'lucide-react';
import { updateReportAdmin, manageDuplicate } from '../services/api.js';

interface AdministrationPageProps {
  reports: CivicReport[];
  currentUser: User | null;
  onReportUpdated: (updated: CivicReport) => void;
  onOpenReportModal: (report: CivicReport) => void;
  onRoleSwitch: (role: 'citizen' | 'admin') => void;
  onOpenAuthModal?: () => void;
}

export const AdministrationPage: React.FC<AdministrationPageProps> = ({
  reports,
  currentUser,
  onReportUpdated,
  onOpenReportModal,
  onRoleSwitch,
  onOpenAuthModal,
}) => {
  const [activeFilter, setActiveFilter] = useState<
    'all' | 'unassigned' | 'urgent' | 'duplicates' | 'resolved'
  >('unassigned');
  const [selectedReportId, setSelectedReportId] = useState<string | null>(null);

  // Quick edit modal states
  const [editingReport, setEditingReport] = useState<CivicReport | null>(null);
  const [statusVal, setStatusVal] = useState<IssueStatus>('Under Review');
  const [deptVal, setDeptVal] = useState<Department>('Roads & Infrastructure');
  const [prioVal, setPrioVal] = useState<number>(75);
  const [prioReason, setPrioReason] = useState<string>('');
  const [resolutionText, setResolutionText] = useState<string>('');
  const [rejectionText, setRejectionText] = useState<string>('');
  const [isSaving, setIsSaving] = useState(false);

  const isAdmin = currentUser?.role === 'admin';

  if (!isAdmin) {
    return (
      <div className="max-w-2xl mx-auto my-12 bg-white p-8 rounded-2xl border border-slate-200 shadow-sm text-center space-y-4">
        <div className="w-12 h-12 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center mx-auto">
          <Lock className="w-6 h-6" />
        </div>
        <h2 className="text-xl font-bold text-slate-900">Administrator Console Restricted</h2>
        <p className="text-xs text-slate-600 leading-relaxed max-w-md mx-auto">
          {currentUser ? (
            <>
              You are currently authenticated as citizen <strong>{currentUser.name}</strong>.
              Municipal dispatch, triage adjustments, and resolution updates are reserved for verified city administrators.
            </>
          ) : (
            <>
              You are currently viewing as a public guest. Please sign in with an administrator account or use the pre-configured judge demo account to access municipal dispatch operations.
            </>
          )}
        </p>
        <div className="pt-2 flex flex-wrap items-center justify-center gap-2">
          {onOpenAuthModal && !currentUser && (
            <button
              onClick={onOpenAuthModal}
              className="px-4 py-2.5 rounded-lg bg-blue-900 hover:bg-blue-800 text-white font-semibold text-xs shadow-xs transition-colors"
            >
              Sign In to Staff Console
            </button>
          )}
          <button
            onClick={() => onRoleSwitch('admin')}
            className="px-5 py-2.5 rounded-lg bg-blue-800 hover:bg-blue-700 text-white font-semibold text-xs shadow-xs transition-colors"
          >
            Switch to Administrator Persona (Dir. Marcus Vance)
          </button>
        </div>
      </div>
    );
  }

  // Filtered queue
  const queue = reports.filter((r) => {
    if (activeFilter === 'unassigned') return r.assignedDepartment === 'Unassigned';
    if (activeFilter === 'urgent') return r.priorityScore >= 75 && r.status !== 'Resolved';
    if (activeFilter === 'duplicates')
      return r.duplicateMatches && r.duplicateMatches.length > 0;
    if (activeFilter === 'resolved') return r.status === 'Resolved';
    return true;
  });

  const openQuickEdit = (report: CivicReport) => {
    setEditingReport(report);
    setStatusVal(report.status);
    setDeptVal(
      report.assignedDepartment !== 'Unassigned'
        ? report.assignedDepartment
        : report.aiAnalysis.recommendedDepartment
    );
    setPrioVal(report.priorityScore);
    setPrioReason(report.priorityOverrideReason || '');
    setResolutionText(report.resolutionNotes || '');
    setRejectionText(report.rejectionReason || '');
  };

  const saveQuickEdit = async () => {
    if (!editingReport) return;
    setIsSaving(true);
    try {
      const updates: any = {};
      if (statusVal !== editingReport.status) updates.status = statusVal;
      if (deptVal !== editingReport.assignedDepartment) updates.assignedDepartment = deptVal;
      if (prioVal !== editingReport.priorityScore) {
        if (!prioReason.trim()) {
          alert('Please enter a justification reason for overriding the AI priority score.');
          setIsSaving(false);
          return;
        }
        updates.priorityScore = prioVal;
        updates.priorityOverrideReason = prioReason.trim();
      }
      if (statusVal === 'Resolved' && resolutionText.trim()) {
        updates.resolutionNotes = resolutionText.trim();
      }
      if (statusVal === 'Rejected' && rejectionText.trim()) {
        updates.rejectionReason = rejectionText.trim();
      }

      const res = await updateReportAdmin(editingReport.id, updates);
      onReportUpdated(res.report);
      setEditingReport(null);
    } catch (err: any) {
      alert(err.message || 'Failed to update report');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDuplicateAction = async (reportId: string, dupId: string, action: 'confirm' | 'dismiss') => {
    try {
      const res = await manageDuplicate(reportId, dupId, action);
      onReportUpdated(res.report);
    } catch (err: any) {
      alert(err.message || 'Failed to update duplicate');
    }
  };

  return (
    <div className="space-y-6 pb-12 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-900">Municipal Operations Console</h1>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-100 text-blue-900 uppercase">
              Admin Authorized
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            AI recommendations remain suggestions until an authorized human supervisor approves and
            commits the decision.
          </p>
        </div>

        <div className="text-xs text-slate-500 bg-white p-2.5 rounded-lg border border-slate-200 shadow-xs">
          Active Supervisor: <strong>{currentUser.name}</strong>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 pb-3">
        <button
          onClick={() => setActiveFilter('unassigned')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 ${
            activeFilter === 'unassigned'
              ? 'bg-blue-900 text-white shadow-xs'
              : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Building2 className="w-3.5 h-3.5" />
          <span>Needs Department ({reports.filter((r) => r.assignedDepartment === 'Unassigned').length})</span>
        </button>

        <button
          onClick={() => setActiveFilter('urgent')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 ${
            activeFilter === 'urgent'
              ? 'bg-blue-900 text-white shadow-xs'
              : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Flame className="w-3.5 h-3.5 text-orange-500" />
          <span>Urgent (75+) ({reports.filter((r) => r.priorityScore >= 75 && r.status !== 'Resolved').length})</span>
        </button>

        <button
          onClick={() => setActiveFilter('duplicates')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 ${
            activeFilter === 'duplicates'
              ? 'bg-blue-900 text-white shadow-xs'
              : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Copy className="w-3.5 h-3.5 text-purple-500" />
          <span>Duplicate Review ({reports.filter((r) => r.duplicateMatches && r.duplicateMatches.length > 0).length})</span>
        </button>

        <button
          onClick={() => setActiveFilter('all')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
            activeFilter === 'all'
              ? 'bg-blue-900 text-white shadow-xs'
              : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          All Reports ({reports.length})
        </button>

        <button
          onClick={() => setActiveFilter('resolved')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
            activeFilter === 'resolved'
              ? 'bg-blue-900 text-white shadow-xs'
              : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          Resolved Archive ({reports.filter((r) => r.status === 'Resolved').length})
        </button>
      </div>

      {/* Triage Queue List */}
      <div className="space-y-4">
        {queue.length === 0 && (
          <div className="bg-white rounded-xl border border-slate-200 p-8 text-center text-xs text-slate-400">
            No complaints currently in this queue view.
          </div>
        )}

        {queue.map((report) => (
          <div
            key={report.id}
            className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 space-y-4 hover:border-slate-300 transition-all"
          >
            {/* Top row: ID, priority gauge, status, action */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded">
                  {report.id}
                </span>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-100 text-blue-900">
                  {report.status}
                </span>
                <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200 flex items-center gap-1">
                  <Flame className="w-3 h-3 text-orange-500" />
                  Score: {report.priorityScore}/100 ({report.aiAnalysis.severity})
                </span>
                {report.priorityOverridden && (
                  <span className="text-[10px] text-amber-800 bg-amber-100 px-1.5 py-0.2 rounded font-medium">
                    Overridden
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => openQuickEdit(report)}
                  className="px-3 py-1.5 rounded-md bg-blue-50 hover:bg-blue-100 text-blue-800 text-xs font-semibold border border-blue-200 flex items-center gap-1.5 transition-colors"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Update Status & Dispatch</span>
                </button>
                <button
                  onClick={() => onOpenReportModal(report)}
                  className="px-3 py-1.5 rounded-md border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold transition-colors"
                >
                  Full Inspection
                </button>
              </div>
            </div>

            {/* Middle row: Complaint Details & Gemini Recommendation */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              <div className="md:col-span-2 space-y-2">
                <h3 className="text-sm font-bold text-slate-900">{report.title}</h3>
                <p className="text-slate-600 leading-relaxed bg-slate-50 p-3 rounded-lg border border-slate-100">
                  {report.description}
                </p>

                <div className="flex flex-wrap items-center gap-3 text-slate-500 text-[11px] pt-1">
                  <span>Location: <strong className="text-slate-700">{report.location}</strong></span>
                  <span>•</span>
                  <span>Category: <strong className="text-slate-700">{report.category}</strong></span>
                  <span>•</span>
                  <span>Reporter: <strong className="text-slate-700">{report.submittedBy.name}</strong></span>
                </div>
              </div>

              {/* AI Recommendation Box */}
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 space-y-2 text-slate-700">
                <div className="flex items-center gap-1.5 text-blue-900 font-bold text-[11px] uppercase tracking-wide">
                  <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                  <span>Gemini Recommended Dispatch</span>
                </div>
                <div>
                  <span className="text-[11px] text-slate-400 block">Department:</span>
                  <span className="font-bold text-slate-900">
                    {report.aiAnalysis.recommendedDepartment}
                  </span>
                </div>
                <div>
                  <span className="text-[11px] text-slate-400 block">Target SLA Window:</span>
                  <span className="text-slate-700">
                    {report.aiAnalysis.estimatedResponseTimeframe}
                  </span>
                </div>
                <div>
                  <span className="text-[11px] text-slate-400 block">Assigned Dept:</span>
                  <span
                    className={`font-semibold ${
                      report.assignedDepartment === 'Unassigned'
                        ? 'text-rose-600'
                        : 'text-emerald-700'
                    }`}
                  >
                    {report.assignedDepartment}
                  </span>
                </div>
              </div>
            </div>

            {/* Duplicate Alerts inline if present */}
            {report.duplicateMatches && report.duplicateMatches.length > 0 && (
              <div className="p-3 bg-purple-50/70 border border-purple-200 rounded-lg text-xs space-y-2">
                <div className="font-bold text-purple-900 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Copy className="w-4 h-4 text-purple-700" />
                    Duplicate Alert: {report.duplicateMatches.length} Similar Complaint(s) Flagged
                  </span>
                </div>

                <div className="space-y-2">
                  {report.duplicateMatches.map((dup) => (
                    <div
                      key={dup.reportId}
                      className="bg-white p-2.5 rounded border border-purple-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                    >
                      <div className="space-y-0.5">
                        <div className="font-semibold text-slate-800">
                          {dup.reportId} — {dup.similarityScore}% Match
                          {dup.distanceMeters !== null && ` (${dup.distanceMeters}m away)`}
                        </div>
                        <div className="text-[11px] text-slate-500">
                          Reasons: {dup.reasons.join('; ')}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
                        <button
                          onClick={() => handleDuplicateAction(report.id, dup.reportId, 'confirm')}
                          className={`px-2.5 py-1 rounded text-[11px] font-semibold transition-colors ${
                            dup.status === 'confirmed'
                              ? 'bg-purple-700 text-white'
                              : 'bg-purple-100 text-purple-800 hover:bg-purple-200'
                          }`}
                        >
                          {dup.status === 'confirmed' ? 'Confirmed' : 'Confirm'}
                        </button>
                        <button
                          onClick={() => handleDuplicateAction(report.id, dup.reportId, 'dismiss')}
                          className={`px-2.5 py-1 rounded text-[11px] font-semibold transition-colors ${
                            dup.status === 'dismissed'
                              ? 'bg-slate-700 text-white'
                              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                          }`}
                        >
                          {dup.status === 'dismissed' ? 'Dismissed' : 'Dismiss'}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Quick Edit Dispatch Modal */}
      {editingReport && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 space-y-5 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Update Report & Dispatch: {editingReport.id}
                </h3>
                <p className="text-xs text-slate-500">{editingReport.title}</p>
              </div>
              <button
                onClick={() => setEditingReport(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              {/* Status Selector */}
              <div className="space-y-1.5">
                <label className="font-bold text-slate-800">Target Status</label>
                <select
                  value={statusVal}
                  onChange={(e) => setStatusVal(e.target.value as IssueStatus)}
                  className="w-full p-2.5 rounded-lg border border-slate-300 bg-white"
                >
                  <option value="Submitted">Submitted</option>
                  <option value="Under Review">Under Review</option>
                  <option value="Assigned">Assigned</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Resolved">Resolved</option>
                  <option value="Rejected">Rejected</option>
                </select>
              </div>

              {/* Department Selector */}
              <div className="space-y-1.5">
                <label className="font-bold text-slate-800">Assign Responsible Department</label>
                <select
                  value={deptVal}
                  onChange={(e) => setDeptVal(e.target.value as Department)}
                  className="w-full p-2.5 rounded-lg border border-slate-300 bg-white"
                >
                  <option value="Roads & Infrastructure">Roads & Infrastructure</option>
                  <option value="Waste Management">Waste Management</option>
                  <option value="Water Supply & Sanitation">Water Supply & Sanitation</option>
                  <option value="Electrical & Lighting">Electrical & Lighting</option>
                  <option value="Drainage & Flood Control">Drainage & Flood Control</option>
                  <option value="Public Safety & Enforcement">Public Safety & Enforcement</option>
                </select>
                <div className="text-[11px] text-slate-400">
                  AI suggested: {editingReport.aiAnalysis.recommendedDepartment}
                </div>
              </div>

              {/* Priority Override */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-2">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-slate-800">Priority Score: {prioVal} / 100</label>
                  <span className="text-[11px] text-slate-400">
                    AI generated: {editingReport.aiAnalysis.priorityScore}
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={prioVal}
                  onChange={(e) => setPrioVal(Number(e.target.value))}
                  className="w-full accent-blue-600"
                />
                {prioVal !== editingReport.priorityScore && (
                  <div className="space-y-1">
                    <label className="font-semibold text-slate-700">
                      Reason for Override (Mandatory for audit trail) *
                    </label>
                    <input
                      type="text"
                      value={prioReason}
                      onChange={(e) => setPrioReason(e.target.value)}
                      placeholder="e.g. Verified hazardous sinkhole with on-duty officer"
                      className="w-full p-2 rounded border border-slate-300"
                    />
                  </div>
                )}
              </div>

              {/* Resolution Notes */}
              {statusVal === 'Resolved' && (
                <div className="space-y-1">
                  <label className="font-bold text-slate-800">Resolution Summary *</label>
                  <textarea
                    value={resolutionText}
                    onChange={(e) => setResolutionText(e.target.value)}
                    placeholder="Describe field crew actions, repairs, and verification..."
                    rows={2}
                    className="w-full p-2 rounded border border-slate-300"
                  />
                </div>
              )}

              {/* Rejection Notes */}
              {statusVal === 'Rejected' && (
                <div className="space-y-1">
                  <label className="font-bold text-slate-800">Rejection Justification *</label>
                  <textarea
                    value={rejectionText}
                    onChange={(e) => setRejectionText(e.target.value)}
                    placeholder="Reason for dismissal or rejection..."
                    rows={2}
                    className="w-full p-2 rounded border border-slate-300"
                  />
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setEditingReport(null)}
                className="px-4 py-2 rounded-lg border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={saveQuickEdit}
                disabled={isSaving}
                className="px-5 py-2 rounded-lg bg-blue-900 hover:bg-blue-800 text-white text-xs font-semibold shadow-xs disabled:opacity-50"
              >
                {isSaving ? 'Logging Decision...' : 'Commit to Audit Log'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
