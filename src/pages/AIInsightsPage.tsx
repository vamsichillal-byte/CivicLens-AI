import React, { useState, useEffect } from 'react';
import { AIInsightsResponse, CivicReport } from '../types/index.js';
import {
  Sparkles,
  Flame,
  Copy,
  Building2,
  ShieldCheck,
  AlertTriangle,
  Lightbulb,
  ArrowRight,
  ExternalLink,
  Layers,
  Info,
} from 'lucide-react';
import { fetchAIInsights } from '../services/api.js';

interface AIInsightsPageProps {
  reports: CivicReport[];
  onOpenReportModal: (report: CivicReport) => void;
}

export const AIInsightsPage: React.FC<AIInsightsPageProps> = ({
  reports,
  onOpenReportModal,
}) => {
  const [insights, setInsights] = useState<AIInsightsResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAIInsights()
      .then((data) => {
        setInsights(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Failed to load insights:', err);
        setLoading(false);
      });
  }, [reports]);

  const findReport = (id: string): CivicReport | undefined => {
    return reports.find((r) => r.id === id);
  };

  if (loading || !insights) {
    return (
      <div className="p-12 text-center text-xs text-slate-400">
        Aggregating AI insights across city complaints...
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-900">AI Intelligence & Triage Insights</h1>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-100 text-blue-900 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-blue-600" />
              Gemini Supervised
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Operational recommendations, hotspot duplicate clusters, and preventive infrastructure
            actions.
          </p>
        </div>
      </div>

      {/* Transparency Disclaimer Card */}
      <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-600 flex items-start gap-2.5">
        <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
        <div>
          <strong className="text-slate-800">Operational Integrity Note: </strong>
          Recommendations are computed from reported civic complaints, geospatial proximity, and
          documented safety factor weights. CivicLens avoids speculative predictions and references
          verifiable citizen report IDs for all suggestions.
        </div>
      </div>

      {/* Section 1: Urgent Complaints Requiring Review */}
      <section className="bg-white rounded-xl border border-slate-200 p-5 sm:p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Flame className="w-4 h-4 text-red-600" />
            High-Priority Complaints Requiring Urgent Review
          </h2>
          <span className="text-xs text-slate-400">Score &ge; 70</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {insights.urgentReviewItems.map((item) => {
            const report = findReport(item.reportId);
            return (
              <div
                key={item.reportId}
                className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-3 hover:border-slate-300 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold text-slate-800 bg-white px-2 py-0.5 rounded border border-slate-200">
                    {item.reportId}
                  </span>
                  <span className="text-xs font-bold text-red-700 bg-red-100/70 px-2 py-0.5 rounded-full">
                    Priority {item.priorityScore}/100
                  </span>
                </div>

                <h3 className="text-xs font-bold text-slate-900 line-clamp-1">{item.title}</h3>

                <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                  {item.urgencyReasons}
                </p>

                <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-200/60">
                  <span className="text-slate-500">
                    Dept: <strong>{item.recommendedDepartment}</strong>
                  </span>
                  {report && (
                    <button
                      onClick={() => onOpenReportModal(report)}
                      className="text-blue-600 hover:text-blue-800 font-semibold flex items-center gap-1"
                    >
                      Open Report <ArrowRight className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Section 2: Duplicate Clusters & Spatial Concentrations */}
      <section className="bg-white rounded-xl border border-slate-200 p-5 sm:p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Copy className="w-4 h-4 text-purple-600" />
            Detected Geospatial Duplicate Clusters
          </h2>
          <span className="text-xs text-slate-400">Radius &lt; 200m</span>
        </div>

        {insights.duplicateClusters.length === 0 ? (
          <div className="p-6 text-center text-xs text-slate-400">
            No active duplicate clusters detected across the city.
          </div>
        ) : (
          <div className="space-y-3">
            {insights.duplicateClusters.map((cluster) => {
              const primary = findReport(cluster.primaryReportId);
              return (
                <div
                  key={cluster.clusterId}
                  className="p-4 rounded-xl border border-purple-200 bg-purple-50/40 space-y-3"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-purple-900 bg-purple-100 px-2 py-0.5 rounded">
                        {cluster.clusterId}
                      </span>
                      <span className="text-xs font-semibold text-slate-800">
                        Primary: {cluster.primaryTitle}
                      </span>
                    </div>

                    {primary && (
                      <button
                        onClick={() => onOpenReportModal(primary)}
                        className="text-xs text-purple-800 hover:text-purple-950 font-bold flex items-center gap-1"
                      >
                        Inspect Master <ExternalLink className="w-3 h-3" />
                      </button>
                    )}
                  </div>

                  <p className="text-xs text-slate-700">{cluster.detectedPattern}</p>

                  <div className="flex flex-wrap items-center gap-2 text-xs">
                    <span className="text-slate-500 font-medium">Linked Complaints:</span>
                    <span className="font-mono text-xs font-bold text-purple-950 bg-white px-2 py-0.5 rounded border border-purple-200">
                      {cluster.primaryReportId}
                    </span>
                    {cluster.relatedReportIds.map((id) => (
                      <span
                        key={id}
                        className="font-mono text-xs font-bold text-slate-700 bg-white px-2 py-0.5 rounded border border-slate-200"
                      >
                        {id}
                      </span>
                    ))}
                    <span className="text-slate-400 text-[11px] ml-1">
                      ({cluster.locationArea})
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Section 3: Recommended Resource Allocations & Preventive Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Resource Allocation Recommendations */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 sm:p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Building2 className="w-4 h-4 text-blue-600" />
              Department Resource Allocations
            </h2>
            <span className="text-xs text-slate-400">Operational Priority</span>
          </div>

          <div className="space-y-3">
            {insights.resourceAllocationRecommendations.map((rec, i) => (
              <div
                key={i}
                className="p-3.5 rounded-lg border border-slate-200 bg-slate-50 space-y-2 text-xs"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900">{rec.department}</span>
                  <span
                    className={`font-semibold px-2 py-0.5 rounded-full text-[10px] ${
                      rec.urgencyLevel === 'High'
                        ? 'bg-red-100 text-red-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {rec.urgencyLevel} Urgency
                  </span>
                </div>

                <p className="text-slate-600 leading-relaxed">{rec.reasoning}</p>

                <div className="text-[11px] text-slate-400 flex items-center gap-1.5 pt-1">
                  <span>Supporting Evidence:</span>
                  <span className="font-mono font-semibold text-slate-700">
                    {rec.supportingReportIds.join(', ')}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Suggested Preventive Actions */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 sm:p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Lightbulb className="w-4 h-4 text-amber-500" />
              Suggested Preventive Maintenance
            </h2>
            <span className="text-xs text-slate-400">Proactive Care</span>
          </div>

          <div className="space-y-3">
            {insights.preventiveActionSuggestions.map((act, i) => (
              <div
                key={i}
                className="p-3.5 rounded-lg border border-slate-200 bg-slate-50 space-y-2 text-xs"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900">{act.actionTitle}</span>
                  <span className="text-[10px] font-semibold text-blue-800 bg-blue-100 px-2 py-0.5 rounded">
                    {act.category}
                  </span>
                </div>

                <p className="text-slate-600 leading-relaxed">{act.recommendation}</p>

                <div className="text-[11px] text-slate-400 flex items-center gap-1.5 pt-1">
                  <span>Targeted Complaint Corridors:</span>
                  <span className="font-mono font-semibold text-slate-700">
                    {act.supportingReportIds.join(', ')}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
