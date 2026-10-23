import React from 'react';
import { AnalyticsSummary, CivicReport } from '../types/index.js';
import {
  BarChart3,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Building2,
  Flame,
  Layers,
  Sparkles,
  TrendingUp,
  FileText,
  Calendar,
} from 'lucide-react';

interface AnalyticsPageProps {
  analytics: AnalyticsSummary | null;
  reports: CivicReport[];
  onOpenReportModal: (report: CivicReport) => void;
}

export const AnalyticsPage: React.FC<AnalyticsPageProps> = ({
  analytics,
  reports,
  onOpenReportModal,
}) => {
  if (!analytics) {
    return (
      <div className="p-12 text-center text-slate-400 text-xs">
        Loading platform analytics from server records...
      </div>
    );
  }

  const categoryEntries = Object.entries(analytics.categoryCounts).sort(
    (a, b) => b[1] - a[1]
  );
  const maxCategoryCount = Math.max(...categoryEntries.map((e) => e[1]), 1);

  const statusEntries = Object.entries(analytics.statusCounts);

  const prio = analytics.priorityDistribution;
  const totalPrio = prio.critical + prio.high + prio.medium + prio.low || 1;

  // Unresolved high priority reports
  const urgentUnresolved = reports.filter(
    (r) => r.priorityScore >= 75 && r.status !== 'Resolved' && r.status !== 'Rejected'
  );

  return (
    <div className="space-y-6 pb-12 max-w-6xl mx-auto">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-900">Municipal Analytics & SLA Metrics</h1>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
              Live Stored Database Records
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time aggregate calculations from actual complaint records and municipal timestamps.
          </p>
        </div>
      </div>

      {/* Primary KPI row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Total Reports */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-1">
          <div className="text-xs text-slate-500 font-medium">Total Complaints Filed</div>
          <div className="text-2xl font-extrabold text-slate-900">{analytics.totalReports}</div>
          <div className="text-[11px] text-slate-400">100% indexed in audit log</div>
        </div>

        {/* Real Resolution Time */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-1">
          <div className="text-xs text-slate-500 font-medium">Avg Resolution Time</div>
          <div className="text-2xl font-extrabold text-blue-900">
            {analytics.avgResolutionTimeHours !== null ? (
              <span>{analytics.avgResolutionTimeHours} hrs</span>
            ) : (
              <span className="text-sm font-normal text-slate-400">No resolved records yet</span>
            )}
          </div>
          <div className="text-[11px] text-slate-400">
            Calculated: (resolvedAt - createdAt)
          </div>
        </div>

        {/* Unresolved High Priority */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-1">
          <div className="text-xs text-slate-500 font-medium">Unresolved High-Risk</div>
          <div className="text-2xl font-extrabold text-rose-600">
            {analytics.unresolvedHighPriorityCount}
          </div>
          <div className="text-[11px] text-rose-600 flex items-center gap-1">
            <Flame className="w-3 h-3" /> Priority &ge; 75/100
          </div>
        </div>

        {/* Duplicate Signals */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-1">
          <div className="text-xs text-slate-500 font-medium">Potential Duplicates</div>
          <div className="text-2xl font-extrabold text-purple-700">
            {analytics.potentialDuplicateCount}
          </div>
          <div className="text-[11px] text-purple-700">Clustered by proximity</div>
        </div>
      </div>

      {/* Row 2: Category Breakdown & Priority Severity Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Reports by Category (SVG Bar Chart) */}
        <div className="bg-white p-5 sm:p-6 rounded-xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Layers className="w-4 h-4 text-blue-600" />
              Complaints by Infrastructure Category
            </h2>
            <span className="text-xs text-slate-400">Volume</span>
          </div>

          <div className="space-y-3 pt-2">
            {categoryEntries.map(([cat, count]) => {
              const pct = Math.round((count / (analytics.totalReports || 1)) * 100);
              const barWidth = Math.max(6, Math.round((count / maxCategoryCount) * 100));

              return (
                <div key={cat} className="space-y-1 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-700">{cat}</span>
                    <span className="text-slate-500 font-mono">
                      {count} ({pct}%)
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                    <div
                      className="bg-blue-800 h-2.5 rounded-full transition-all duration-500"
                      style={{ width: `${barWidth}%` }}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Priority Severity Distribution */}
        <div className="bg-white p-5 sm:p-6 rounded-xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Flame className="w-4 h-4 text-orange-500" />
              AI Priority Score Tiers
            </h2>
            <span className="text-xs text-slate-400">Severity Breakdown</span>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-2">
            <div className="p-3.5 rounded-xl border border-red-200 bg-red-50/50 space-y-1">
              <div className="text-[11px] font-bold text-red-800 flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-red-600"></span>
                Critical (85 - 100)
              </div>
              <div className="text-2xl font-extrabold text-red-950">{prio.critical}</div>
              <div className="text-[10px] text-red-700">Immediate roadbed/water safety hazard</div>
            </div>

            <div className="p-3.5 rounded-xl border border-amber-200 bg-amber-50/50 space-y-1">
              <div className="text-[11px] font-bold text-amber-800 flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-amber-600"></span>
                High (66 - 84)
              </div>
              <div className="text-2xl font-extrabold text-amber-950">{prio.high}</div>
              <div className="text-[10px] text-amber-700">Public density exposure & hazards</div>
            </div>

            <div className="p-3.5 rounded-xl border border-blue-200 bg-blue-50/50 space-y-1">
              <div className="text-[11px] font-bold text-blue-800 flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-blue-600"></span>
                Medium (36 - 65)
              </div>
              <div className="text-2xl font-extrabold text-blue-950">{prio.medium}</div>
              <div className="text-[10px] text-blue-700">Standard scheduled SLA intervention</div>
            </div>

            <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 space-y-1">
              <div className="text-[11px] font-bold text-slate-700 flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-slate-400"></span>
                Low (0 - 35)
              </div>
              <div className="text-2xl font-extrabold text-slate-800">{prio.low}</div>
              <div className="text-[10px] text-slate-500">Cosmetic or minor civic impact</div>
            </div>
          </div>

          {/* Stacked visualization bar */}
          <div className="w-full h-3 rounded-full overflow-hidden flex bg-slate-100">
            <div
              style={{ width: `${(prio.critical / totalPrio) * 100}%` }}
              className="bg-red-600 h-full"
              title={`Critical: ${prio.critical}`}
            ></div>
            <div
              style={{ width: `${(prio.high / totalPrio) * 100}%` }}
              className="bg-amber-500 h-full"
              title={`High: ${prio.high}`}
            ></div>
            <div
              style={{ width: `${(prio.medium / totalPrio) * 100}%` }}
              className="bg-blue-600 h-full"
              title={`Medium: ${prio.medium}`}
            ></div>
            <div
              style={{ width: `${(prio.low / totalPrio) * 100}%` }}
              className="bg-slate-300 h-full"
              title={`Low: ${prio.low}`}
            ></div>
          </div>
        </div>
      </div>

      {/* Row 3: Department Workload & Status Progression */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Department Workload Table */}
        <div className="bg-white p-5 sm:p-6 rounded-xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Building2 className="w-4 h-4 text-slate-700" />
              Municipal Department Workload
            </h2>
            <span className="text-xs text-slate-400">Active vs Resolved</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-200 text-slate-500 font-semibold text-[10px] uppercase">
                <tr>
                  <th className="pb-2">Department</th>
                  <th className="pb-2 text-center">Active</th>
                  <th className="pb-2 text-center">Resolved</th>
                  <th className="pb-2 text-right">Avg Prio</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {analytics.departmentWorkload.map((dw) => (
                  <tr key={dw.department}>
                    <td className="py-2.5 font-medium text-slate-800">{dw.department}</td>
                    <td className="py-2.5 text-center font-bold text-amber-700">
                      {dw.activeCount}
                    </td>
                    <td className="py-2.5 text-center font-bold text-emerald-700">
                      {dw.resolvedCount}
                    </td>
                    <td className="py-2.5 text-right font-mono font-semibold text-slate-700">
                      {dw.avgPriority}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Status Pipeline */}
        <div className="bg-white p-5 sm:p-6 rounded-xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              Status Pipeline Distribution
            </h2>
            <span className="text-xs text-slate-400">Current Phase</span>
          </div>

          <div className="space-y-3 pt-2">
            {statusEntries.map(([status, count]) => {
              const pct = Math.round((count / (analytics.totalReports || 1)) * 100);
              return (
                <div key={status} className="space-y-1 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-700">{status}</span>
                    <span className="text-slate-500 font-mono">
                      {count} ({pct}%)
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                    <div
                      className={`h-2 rounded-full transition-all duration-500 ${
                        status === 'Resolved'
                          ? 'bg-emerald-600'
                          : status === 'Rejected'
                          ? 'bg-rose-500'
                          : 'bg-blue-600'
                      }`}
                      style={{ width: `${Math.max(4, pct)}%` }}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Row 4: Unresolved High Priority Reports Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Flame className="w-4 h-4 text-red-600" />
              Urgent Unresolved Reports (Score &ge; 75)
            </h2>
            <p className="text-[11px] text-slate-500">
              High-risk issues requiring active supervisory monitoring and field crew deployment.
            </p>
          </div>
          <span className="text-xs font-bold text-red-700 bg-red-50 border border-red-200 px-2.5 py-1 rounded-full">
            {urgentUnresolved.length} Critical / High Pending
          </span>
        </div>

        {urgentUnresolved.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-400">
            No unresolved high-priority issues at this time.
          </div>
        ) : (
          <div className="divide-y divide-slate-100 text-xs">
            {urgentUnresolved.map((report) => (
              <div
                key={report.id}
                onClick={() => onOpenReportModal(report)}
                className="p-4 hover:bg-slate-50 cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3 group transition-colors"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded">
                      {report.id}
                    </span>
                    <span className="font-semibold text-rose-700 bg-rose-50 px-2 py-0.5 rounded">
                      Score {report.priorityScore} ({report.aiAnalysis.severity})
                    </span>
                    <span className="text-slate-500">{report.category}</span>
                  </div>
                  <h3 className="font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                    {report.title}
                  </h3>
                  <div className="text-[11px] text-slate-500">
                    Location: <strong>{report.location}</strong> • Dept:{' '}
                    <strong>{report.assignedDepartment}</strong>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <button className="text-xs text-blue-600 font-semibold group-hover:underline">
                    Inspect Report →
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
