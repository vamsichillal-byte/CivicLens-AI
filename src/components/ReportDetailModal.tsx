import React, { useState } from 'react';
import {
  CivicReport,
  User,
  IssueStatus,
  Department,
} from '../types/index.js';
import {
  X,
  ShieldAlert,
  Clock,
  MapPin,
  CheckCircle2,
  AlertTriangle,
  Building2,
  Sparkles,
  Copy,
  History,
  FileText,
  HelpCircle,
  ExternalLink,
  ChevronRight,
  User as UserIcon,
  Check,
  Ban,
  Wrench,
  Flame,
} from 'lucide-react';
import { updateReportAdmin, manageDuplicate } from '../services/api.js';

interface ReportDetailModalProps {
  report: CivicReport;
  currentUser: User | null;
  onClose: () => void;
  onReportUpdated: (updated: CivicReport) => void;
  onOpenReport?: (reportId: string) => void;
}

export const ReportDetailModal: React.FC<ReportDetailModalProps> = ({
  report,
  currentUser,
  onClose,
  onReportUpdated,
  onOpenReport,
}) => {
  const [activeTab, setActiveTab] = useState<'ai' | 'duplicates' | 'audit' | 'admin'>('ai');
  const [updating, setUpdating] = useState(false);
  const [updateMsg, setUpdateMsg] = useState<string | null>(null);

  // Admin inline edit states
  const [newStatus, setNewStatus] = useState<IssueStatus>(report.status);
  const [newDepartment, setNewDepartment] = useState<Department>(report.assignedDepartment);
  const [newPriority, setNewPriority] = useState<number>(report.priorityScore);
  const [overrideReason, setOverrideReason] = useState<string>(report.priorityOverrideReason || '');
  const [resolutionNotes, setResolutionNotes] = useState<string>(report.resolutionNotes || '');
  const [rejectionReason, setRejectionReason] = useState<string>(report.rejectionReason || '');

  const isAdmin = currentUser?.role === 'admin';
  const ai = report.aiAnalysis;

  const handleAdminSave = async () => {
    setUpdating(true);
    setUpdateMsg(null);
    try {
      const updates: any = {};
      if (newStatus !== report.status) updates.status = newStatus;
      if (newDepartment !== report.assignedDepartment) updates.assignedDepartment = newDepartment;
      if (newPriority !== report.priorityScore) {
        if (!overrideReason.trim()) {
          alert('Please provide a justification reason for overriding the AI priority score.');
          setUpdating(false);
          return;
        }
        updates.priorityScore = newPriority;
        updates.priorityOverrideReason = overrideReason.trim();
      }
      if (newStatus === 'Resolved' && resolutionNotes.trim()) {
        updates.resolutionNotes = resolutionNotes.trim();
      }
      if (newStatus === 'Rejected' && rejectionReason.trim()) {
        updates.rejectionReason = rejectionReason.trim();
      }

      const res = await updateReportAdmin(report.id, updates);
      onReportUpdated(res.report);
      setUpdateMsg('Report updated successfully with audit trail.');
    } catch (err: any) {
      alert(err.message || 'Failed to update report');
    } finally {
      setUpdating(false);
    }
  };

  const handleDuplicateAction = async (dupId: string, action: 'confirm' | 'dismiss') => {
    try {
      const res = await manageDuplicate(report.id, dupId, action);
      onReportUpdated(res.report);
    } catch (err: any) {
      alert(err.message || 'Failed to update duplicate');
    }
  };

  const getPriorityColor = (score: number) => {
    if (score >= 85) return 'text-red-700 bg-red-50 border-red-200';
    if (score >= 66) return 'text-amber-700 bg-amber-50 border-amber-200';
    if (score >= 36) return 'text-blue-700 bg-blue-50 border-blue-200';
    return 'text-slate-700 bg-slate-50 border-slate-200';
  };

  const getStatusColor = (status: IssueStatus) => {
    switch (status) {
      case 'Submitted':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'Under Review':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'Assigned':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'In Progress':
        return 'bg-indigo-100 text-indigo-800 border-indigo-200';
      case 'Resolved':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'Rejected':
        return 'bg-rose-100 text-rose-800 border-rose-200';
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5">
      <div className="relative bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[92vh] flex flex-col border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-start justify-between p-5 border-b border-slate-200 bg-slate-50/80">
          <div className="space-y-1 pr-4">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono text-xs font-semibold px-2.5 py-0.5 rounded bg-slate-200 text-slate-800">
                {report.id}
              </span>
              <span
                className={`text-xs font-medium px-2.5 py-0.5 rounded-full border ${getStatusColor(
                  report.status
                )}`}
              >
                {report.status}
              </span>
              <span
                className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border ${getPriorityColor(
                  report.priorityScore
                )}`}
              >
                Priority {report.priorityScore}/100 ({ai.severity})
              </span>
              {report.priorityOverridden && (
                <span className="text-[11px] font-medium text-amber-700 bg-amber-100/70 px-2 py-0.5 rounded">
                  Admin Overridden
                </span>
              )}
            </div>
            <h2 className="text-xl font-bold text-slate-900 leading-snug">{report.title}</h2>
            <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 pt-1">
              <span className="flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-slate-400" />
                {report.location}
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                Reported {new Date(report.createdAt).toLocaleString()}
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <UserIcon className="w-3.5 h-3.5 text-slate-400" />
                {report.submittedBy.name}
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 rounded-lg transition-colors"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-200 bg-white px-5 gap-6 text-sm font-medium">
          <button
            onClick={() => setActiveTab('ai')}
            className={`py-3 flex items-center gap-2 border-b-2 transition-colors ${
              activeTab === 'ai'
                ? 'border-blue-600 text-blue-600 font-semibold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Sparkles className="w-4 h-4 text-blue-600" />
            Gemini AI Assessment
          </button>

          <button
            onClick={() => setActiveTab('duplicates')}
            className={`py-3 flex items-center gap-2 border-b-2 transition-colors ${
              activeTab === 'duplicates'
                ? 'border-blue-600 text-blue-600 font-semibold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Copy className="w-4 h-4" />
            Duplicate Matches
            {report.duplicateMatches && report.duplicateMatches.length > 0 && (
              <span className="ml-1 text-xs px-1.5 py-0.2 rounded-full bg-amber-100 text-amber-800 font-bold">
                {report.duplicateMatches.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('audit')}
            className={`py-3 flex items-center gap-2 border-b-2 transition-colors ${
              activeTab === 'audit'
                ? 'border-blue-600 text-blue-600 font-semibold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <History className="w-4 h-4" />
            Audit Trail ({report.auditHistory?.length || 0})
          </button>

          {isAdmin && (
            <button
              onClick={() => setActiveTab('admin')}
              className={`py-3 flex items-center gap-2 border-b-2 transition-colors ${
                activeTab === 'admin'
                  ? 'border-blue-600 text-blue-600 font-semibold'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <Wrench className="w-4 h-4 text-slate-600" />
              Administrative Actions
            </button>
          )}
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
          {/* Main Description & Photo if present */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div className={`space-y-3 ${report.imageUrl ? 'md:col-span-2' : 'md:col-span-3'}`}>
              <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Citizen Description
              </h3>
              <p className="text-sm text-slate-700 leading-relaxed bg-slate-50 p-3.5 rounded-lg border border-slate-200">
                {report.description}
              </p>

              <div className="flex flex-wrap gap-4 text-xs text-slate-600 pt-1">
                <div>
                  <span className="text-slate-400">Assigned Department: </span>
                  <span className="font-semibold text-slate-800">
                    {report.assignedDepartment}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400">Category: </span>
                  <span className="font-semibold text-slate-800">{report.category}</span>
                </div>
                {report.coordinates && (
                  <div>
                    <span className="text-slate-400">GPS Coordinates: </span>
                    <span className="font-mono text-slate-800">
                      {report.coordinates.latitude.toFixed(4)}, {report.coordinates.longitude.toFixed(4)}
                    </span>
                  </div>
                )}
              </div>

              {/* Status explanation notes */}
              {report.status === 'Resolved' && report.resolutionNotes && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs space-y-1">
                  <div className="font-semibold text-emerald-800 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4" />
                    Resolution Summary
                  </div>
                  <p className="text-emerald-700">{report.resolutionNotes}</p>
                  {report.resolvedAt && (
                    <p className="text-[11px] text-emerald-600">
                      Resolved on {new Date(report.resolvedAt).toLocaleString()}
                    </p>
                  )}
                </div>
              )}

              {report.status === 'Rejected' && report.rejectionReason && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs space-y-1">
                  <div className="font-semibold text-rose-800 flex items-center gap-1.5">
                    <Ban className="w-4 h-4" />
                    Rejection / Dismissal Notice
                  </div>
                  <p className="text-rose-700">{report.rejectionReason}</p>
                </div>
              )}
            </div>

            {report.imageUrl && (
              <div className="space-y-1.5">
                <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Attached Photo
                </h3>
                <div className="rounded-lg border border-slate-200 overflow-hidden bg-slate-100 max-h-52">
                  <img
                    src={report.imageUrl}
                    alt={report.title}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLElement).style.display = 'none';
                    }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* TAB 1: AI ASSESSMENT */}
          {activeTab === 'ai' && (
            <div className="space-y-5 animate-in fade-in duration-150">
              {/* AI Source Verification Badge */}
              <div className="flex items-center justify-between p-3 rounded-lg border border-blue-100 bg-blue-50/60 text-xs">
                <div className="flex items-center gap-2 text-blue-900">
                  <Sparkles className="w-4 h-4 text-blue-600 shrink-0" />
                  <span>
                    Analysis Engine:{' '}
                    <strong className="font-semibold">
                      {ai.source === 'gemini-3.8-flash'
                        ? 'Google Gemini 3.8 Flash (Live Model Call)'
                        : 'Civic Deterministic Rule Engine (Demo Fallback)'}
                    </strong>
                  </span>
                </div>
                <span className="text-[11px] text-blue-700 font-mono">
                  Confidence: {Math.round(ai.confidenceScore * 100)}%
                </span>
              </div>

              {/* Priority & Transparent Scoring Breakdown */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <Flame className="w-4 h-4 text-orange-500" />
                    Transparent Priority Score: {ai.priorityScore} / 100
                  </h4>
                  <span className="text-xs text-slate-500">
                    Calculated from 4 verifiable municipal risk factors
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                    <div className="text-[11px] text-slate-500">1. Safety Impact</div>
                    <div className="text-lg font-bold text-slate-900">
                      {ai.scoreFactors.safetyImpact}{' '}
                      <span className="text-xs font-normal text-slate-400">/ 35</span>
                    </div>
                    <div className="text-[10px] text-slate-400">Direct injury/hazard</div>
                  </div>

                  <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                    <div className="text-[11px] text-slate-500">2. Infrastructure Damage</div>
                    <div className="text-lg font-bold text-slate-900">
                      {ai.scoreFactors.infrastructureDamage}{' '}
                      <span className="text-xs font-normal text-slate-400">/ 25</span>
                    </div>
                    <div className="text-[10px] text-slate-400">Structural degradation</div>
                  </div>

                  <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                    <div className="text-[11px] text-slate-500">3. Population Exposure</div>
                    <div className="text-lg font-bold text-slate-900">
                      {ai.scoreFactors.affectedPopulationRisk}{' '}
                      <span className="text-xs font-normal text-slate-400">/ 25</span>
                    </div>
                    <div className="text-[10px] text-slate-400">Traffic & public density</div>
                  </div>

                  <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                    <div className="text-[11px] text-slate-500">4. Age / Recency Factor</div>
                    <div className="text-lg font-bold text-slate-900">
                      {ai.scoreFactors.ageFactor}{' '}
                      <span className="text-xs font-normal text-slate-400">/ 15</span>
                    </div>
                    <div className="text-[10px] text-slate-400">Time without intervention</div>
                  </div>
                </div>

                <p className="text-xs text-slate-600 bg-white p-2.5 rounded-lg border border-slate-200">
                  <span className="font-semibold text-slate-700">Scoring Rationale: </span>
                  {ai.scoreFactors.rationale}
                </p>
              </div>

              {/* Urgency & Safety Risks */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="border border-slate-200 rounded-xl p-4 bg-white space-y-2.5">
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-900 uppercase tracking-wide">
                    <AlertTriangle className="w-4 h-4 text-amber-500" />
                    Urgency & Reasons ({ai.urgency})
                  </div>
                  <p className="text-xs text-slate-700 leading-relaxed">{ai.urgencyReasons}</p>
                  <div className="pt-1 text-[11px] text-slate-500 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    <span>
                      Suggested Target Timeframe:{' '}
                      <strong className="text-slate-800">{ai.estimatedResponseTimeframe}</strong>
                    </span>
                  </div>
                </div>

                <div className="border border-slate-200 rounded-xl p-4 bg-white space-y-2.5">
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-900 uppercase tracking-wide">
                    <ShieldAlert className="w-4 h-4 text-rose-500" />
                    Potential Safety Risks
                  </div>
                  <ul className="text-xs text-slate-700 space-y-1.5">
                    {ai.safetyRisks.map((risk, idx) => (
                      <li key={idx} className="flex items-start gap-1.5">
                        <span className="text-rose-500 font-bold">•</span>
                        <span>{risk}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* 3 Concrete Recommended Actions */}
              <div className="border border-slate-200 rounded-xl p-4 bg-white space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-900 uppercase tracking-wide">
                    <Building2 className="w-4 h-4 text-blue-600" />
                    AI Recommended Dispatch Actions
                  </div>
                  <span className="text-xs text-slate-500">
                    Recommended Dept:{' '}
                    <strong className="text-slate-800">{ai.recommendedDepartment}</strong>
                  </span>
                </div>
                <div className="space-y-2">
                  {ai.recommendedActions.map((action, idx) => (
                    <div
                      key={idx}
                      className="flex items-start gap-3 p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-800"
                    >
                      <span className="flex items-center justify-center w-5 h-5 rounded-full bg-blue-100 text-blue-800 font-bold text-[11px] shrink-0">
                        {idx + 1}
                      </span>
                      <span className="pt-0.5">{action}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Missing Information Note */}
              {ai.missingInformation && ai.missingInformation.length > 0 && (
                <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-lg text-xs space-y-1">
                  <div className="font-semibold text-amber-800 flex items-center gap-1.5">
                    <HelpCircle className="w-4 h-4" />
                    Uncertain or Missing Information Identified
                  </div>
                  <ul className="list-disc list-inside text-amber-700 text-[11px] pl-1">
                    {ai.missingInformation.map((m, i) => (
                      <li key={i}>{m}</li>
                    ))}
                  </ul>
                  <p className="text-[10px] text-amber-600 italic">
                    Per municipal safety standards, AI avoids inventing unverified parameters.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: DUPLICATES */}
          {activeTab === 'duplicates' && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-600">
                CivicLens analyzes text overlap, category classification, and geographic coordinates
                (Haversine formula). Reports are never automatically rejected—administrators make
                the final determination.
              </div>

              {(!report.duplicateMatches || report.duplicateMatches.length === 0) && (
                <div className="p-8 text-center text-slate-400 space-y-2">
                  <CheckCircle2 className="w-8 h-8 text-slate-300 mx-auto" />
                  <p className="text-sm font-medium text-slate-600">No Potential Duplicates Found</p>
                  <p className="text-xs text-slate-400 max-w-sm mx-auto">
                    This report appears unique based on current active complaints in this area.
                  </p>
                </div>
              )}

              {report.duplicateMatches && report.duplicateMatches.length > 0 && (
                <div className="space-y-3">
                  {report.duplicateMatches.map((dup) => (
                    <div
                      key={dup.reportId}
                      className="border border-slate-200 rounded-xl p-4 bg-white space-y-3 hover:border-slate-300 transition-colors"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded">
                            {dup.reportId}
                          </span>
                          <span
                            className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                              dup.similarityScore >= 80
                                ? 'bg-red-100 text-red-800'
                                : 'bg-amber-100 text-amber-800'
                            }`}
                          >
                            {dup.similarityScore}% Match
                          </span>
                          <span
                            className={`text-[11px] px-2 py-0.5 rounded font-medium ${
                              dup.status === 'confirmed'
                                ? 'bg-purple-100 text-purple-800'
                                : dup.status === 'dismissed'
                                ? 'bg-slate-100 text-slate-600'
                                : 'bg-amber-50 text-amber-700 border border-amber-200'
                            }`}
                          >
                            Status: {dup.status.toUpperCase()}
                          </span>
                        </div>

                        {onOpenReport && (
                          <button
                            onClick={() => onOpenReport(dup.reportId)}
                            className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1 font-medium"
                          >
                            Open Report <ExternalLink className="w-3 h-3" />
                          </button>
                        )}
                      </div>

                      {dup.reportTitle && (
                        <p className="text-xs font-semibold text-slate-800">{dup.reportTitle}</p>
                      )}

                      <div className="space-y-1">
                        <div className="text-[11px] font-semibold text-slate-500">
                          Matching Criteria:
                        </div>
                        <ul className="text-xs text-slate-600 space-y-1">
                          {dup.reasons.map((reason, i) => (
                            <li key={i} className="flex items-center gap-1.5">
                              <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
                              <span>{reason}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      {dup.distanceMeters !== null && (
                        <div className="text-[11px] text-slate-500">
                          Geo Proximity: <strong>{dup.distanceMeters} meters</strong> from this
                          report
                        </div>
                      )}

                      {/* Admin Duplicate confirmation controls */}
                      {isAdmin && (
                        <div className="pt-2 border-t border-slate-100 flex items-center gap-2">
                          <button
                            onClick={() => handleDuplicateAction(dup.reportId, 'confirm')}
                            className={`px-3 py-1 rounded text-xs font-medium flex items-center gap-1 transition-colors ${
                              dup.status === 'confirmed'
                                ? 'bg-purple-600 text-white'
                                : 'bg-purple-50 text-purple-700 hover:bg-purple-100 border border-purple-200'
                            }`}
                          >
                            <Check className="w-3 h-3" />
                            {dup.status === 'confirmed' ? 'Confirmed Duplicate' : 'Confirm Duplicate'}
                          </button>
                          <button
                            onClick={() => handleDuplicateAction(dup.reportId, 'dismiss')}
                            className={`px-3 py-1 rounded text-xs font-medium flex items-center gap-1 transition-colors ${
                              dup.status === 'dismissed'
                                ? 'bg-slate-700 text-white'
                                : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200'
                            }`}
                          >
                            <X className="w-3 h-3" />
                            {dup.status === 'dismissed' ? 'Dismissed' : 'Dismiss Match'}
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: AUDIT TRAIL */}
          {activeTab === 'audit' && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div className="text-xs text-slate-500">
                Immutable audit history recording all citizen actions, AI model executions, and
                authorized administrative decisions.
              </div>

              <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
                {(report.auditHistory || []).map((entry, index) => (
                  <div key={entry.id || index} className="relative">
                    <div className="absolute -left-[25px] top-1 w-3 h-3 rounded-full border-2 border-white bg-blue-600 shadow-xs"></div>
                    <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 space-y-1">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="text-xs font-bold text-slate-900">{entry.action}</span>
                        <span className="text-[11px] text-slate-400 font-mono">
                          {new Date(entry.timestamp).toLocaleString()}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-500">
                        Actor:{' '}
                        <strong className="text-slate-700">
                          {entry.actor} ({entry.actorRole})
                        </strong>
                      </div>
                      <p className="text-xs text-slate-700 pt-1">{entry.details}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 4: ADMINISTRATIVE ACTIONS (ADMIN ONLY) */}
          {activeTab === 'admin' && isAdmin && (
            <div className="space-y-5 animate-in fade-in duration-150">
              {updateMsg && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg text-xs font-medium flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  {updateMsg}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Status Dropdown */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">Update Report Status</label>
                  <select
                    value={newStatus}
                    onChange={(e) => setNewStatus(e.target.value as IssueStatus)}
                    className="w-full text-xs p-2.5 rounded-lg border border-slate-300 bg-white focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="Submitted">Submitted</option>
                    <option value="Under Review">Under Review</option>
                    <option value="Assigned">Assigned</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Resolved">Resolved</option>
                    <option value="Rejected">Rejected</option>
                  </select>
                </div>

                {/* Department Assignment */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">Assign Department</label>
                  <select
                    value={newDepartment}
                    onChange={(e) => setNewDepartment(e.target.value as Department)}
                    className="w-full text-xs p-2.5 rounded-lg border border-slate-300 bg-white focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="Unassigned">Unassigned</option>
                    <option value="Roads & Infrastructure">Roads & Infrastructure</option>
                    <option value="Waste Management">Waste Management</option>
                    <option value="Water Supply & Sanitation">Water Supply & Sanitation</option>
                    <option value="Electrical & Lighting">Electrical & Lighting</option>
                    <option value="Drainage & Flood Control">Drainage & Flood Control</option>
                    <option value="Public Safety & Enforcement">Public Safety & Enforcement</option>
                  </select>
                </div>
              </div>

              {/* Priority Override Section */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <Flame className="w-4 h-4 text-orange-500" />
                    Human Override AI Priority Score: {newPriority} / 100
                  </label>
                  <span className="text-[11px] text-slate-500">
                    AI recommendation was {ai.priorityScore}
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={newPriority}
                  onChange={(e) => setNewPriority(Number(e.target.value))}
                  className="w-full accent-blue-600"
                />
                {newPriority !== report.priorityScore && (
                  <div className="space-y-1 pt-1">
                    <label className="text-[11px] font-semibold text-slate-700">
                      Mandatory Justification for Priority Override *
                    </label>
                    <textarea
                      value={overrideReason}
                      onChange={(e) => setOverrideReason(e.target.value)}
                      placeholder="Explain why municipal supervisor adjusted priority score..."
                      rows={2}
                      className="w-full text-xs p-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                )}
              </div>

              {/* Resolution or Rejection Notes */}
              {newStatus === 'Resolved' && (
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">
                    Resolution Notes (Visible to Citizen) *
                  </label>
                  <textarea
                    value={resolutionNotes}
                    onChange={(e) => setResolutionNotes(e.target.value)}
                    placeholder="Describe municipal actions taken, repairs made, and date completed..."
                    rows={3}
                    className="w-full text-xs p-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              )}

              {newStatus === 'Rejected' && (
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">
                    Rejection / Dismissal Justification *
                  </label>
                  <textarea
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    placeholder="Reason for dismissal (e.g. duplicate of CVL-2026-1038, private property jurisdiction)..."
                    rows={3}
                    className="w-full text-xs p-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-rose-500"
                  />
                </div>
              )}

              <div className="pt-2">
                <button
                  onClick={handleAdminSave}
                  disabled={updating}
                  className="px-5 py-2.5 rounded-lg bg-blue-700 hover:bg-blue-800 text-white text-xs font-semibold shadow-xs disabled:opacity-50 transition-colors"
                >
                  {updating ? 'Saving Administrative Decision...' : 'Commit Decision to Audit Log'}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
          <div className="text-xs text-slate-500">
            Current Viewer: <strong>{currentUser.name}</strong> ({currentUser.role})
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-100 rounded-lg transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
