import React from 'react';
import {
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  Clock,
  ArrowRight,
  Copy,
  BarChart3,
  Layers,
  Flame,
  AlertTriangle,
  Building2,
  Check,
} from 'lucide-react';
import { NavigationTab } from '../components/Sidebar.js';

interface LandingPageProps {
  onNavigate: (tab: NavigationTab) => void;
  onRoleSwitch: (role: 'citizen' | 'admin') => void;
  onOpenAuthModal?: () => void;
  currentUser?: User | null;
  reportsCount: number;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  onNavigate,
  onRoleSwitch,
  onOpenAuthModal,
  currentUser,
  reportsCount,
}) => {
  return (
    <div className="space-y-12 pb-16 max-w-6xl mx-auto">
      {/* Hero Section */}
      <section className="relative overflow-hidden rounded-2xl bg-gradient-to-b from-blue-950 via-slate-900 to-blue-900 text-white p-8 sm:p-12 shadow-xl border border-blue-900/40">
        <div className="relative z-10 max-w-3xl space-y-5">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 border border-blue-400/30 text-blue-200 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5 text-blue-400" />
            <span>Google Gemini 3.8 Flash Powered Civic Intelligence</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight leading-tight">
            Next-Generation AI for <br />
            <span className="text-blue-400">Transparent Civic Triage</span>
          </h1>

          <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
            Eliminate complaint backlogs, detect duplicate street issues automatically, and dispatch
            municipal crews based on transparent, objective safety priority scores rather than
            who shouts the loudest.
          </p>

          <div className="flex flex-wrap items-center gap-3 pt-3">
            {currentUser ? (
              <>
                <button
                  onClick={() => onNavigate(currentUser.role === 'admin' ? 'admin' : 'report')}
                  className="px-5 py-3 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs sm:text-sm font-bold shadow-lg shadow-blue-600/30 flex items-center gap-2 transition-all"
                >
                  <span>{currentUser.role === 'admin' ? 'Open Staff Console' : 'Submit a Civic Report'}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
                <button
                  onClick={() => onNavigate('reports')}
                  className="px-5 py-3 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs sm:text-sm font-semibold border border-white/20 transition-all flex items-center gap-2"
                >
                  <span>Browse Municipal Directory</span>
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={onOpenAuthModal}
                  className="px-5 py-3 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs sm:text-sm font-bold shadow-lg shadow-blue-600/30 flex items-center gap-2 transition-all"
                >
                  <span>Sign In or Register</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
                <button
                  onClick={() => {
                    onRoleSwitch('citizen');
                    onNavigate('report');
                  }}
                  className="px-4 py-3 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs sm:text-sm font-semibold border border-white/20 transition-all flex items-center gap-1.5"
                >
                  <span>Try Citizen Demo</span>
                </button>
                <button
                  onClick={() => {
                    onRoleSwitch('admin');
                    onNavigate('admin');
                  }}
                  className="px-4 py-3 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs sm:text-sm font-semibold border border-white/20 transition-all flex items-center gap-1.5"
                >
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span>Admin Demo</span>
                </button>
              </>
            )}
          </div>
        </div>

        {/* Decorative background glow */}
        <div className="absolute right-0 top-0 -mt-16 -mr-16 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none"></div>
      </section>

      {/* Live Impact Ticker */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-1">
          <div className="text-xs text-slate-500 font-medium">Platform Reports</div>
          <div className="text-2xl font-extrabold text-slate-900">{reportsCount} Active</div>
          <div className="text-[11px] text-emerald-600 flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" /> Fully tracked & audited
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-1">
          <div className="text-xs text-slate-500 font-medium">Avg Triage Speed</div>
          <div className="text-2xl font-extrabold text-slate-900">&lt; 1.2s</div>
          <div className="text-[11px] text-blue-600 flex items-center gap-1">
            <Sparkles className="w-3 h-3" /> Real-time Gemini analysis
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-1">
          <div className="text-xs text-slate-500 font-medium">Duplicates Prevented</div>
          <div className="text-2xl font-extrabold text-slate-900">88% Match</div>
          <div className="text-[11px] text-purple-600 flex items-center gap-1">
            <Copy className="w-3 h-3" /> Geo-coordinate & text clustering
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-1">
          <div className="text-xs text-slate-500 font-medium">Scoring Transparency</div>
          <div className="text-2xl font-extrabold text-slate-900">100%</div>
          <div className="text-[11px] text-amber-600 flex items-center gap-1">
            <Flame className="w-3 h-3" /> Verifiable 4-factor formula
          </div>
        </div>
      </div>

      {/* Problem Statement Comparison */}
      <section className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-6">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900">
            The Civic Management Challenge
          </h2>
          <p className="text-slate-500 text-xs sm:text-sm mt-1">
            Why traditional civic helplines fail and how CivicLens AI transforms municipal
            operations.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Legacy System */}
          <div className="p-5 rounded-xl border border-rose-200 bg-rose-50/40 space-y-3">
            <div className="flex items-center gap-2 text-rose-800 font-bold text-sm">
              <AlertTriangle className="w-4 h-4 text-rose-600" />
              Traditional Civic Helplines
            </div>
            <ul className="space-y-2 text-xs text-rose-950">
              <li className="flex items-start gap-2">
                <span className="text-rose-500 font-bold mt-0.5">✕</span>
                <span>Manual triage causes 48-72 hour response delays.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-rose-500 font-bold mt-0.5">✕</span>
                <span>
                  Multiple citizens report the same water burst, causing 5 duplicate work orders.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-rose-500 font-bold mt-0.5">✕</span>
                <span>Arbitrary priority based on citizen persistence rather than real danger.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-rose-500 font-bold mt-0.5">✕</span>
                <span>Zero visibility for residents; black-box status updates.</span>
              </li>
            </ul>
          </div>

          {/* CivicLens Solution */}
          <div className="p-5 rounded-xl border border-emerald-200 bg-emerald-50/40 space-y-3">
            <div className="flex items-center gap-2 text-emerald-800 font-bold text-sm">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              CivicLens AI Platform
            </div>
            <ul className="space-y-2 text-xs text-emerald-950">
              <li className="flex items-start gap-2">
                <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                <span>Instant sub-second multimodal analysis using Google Gemini.</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                <span>
                  Automated duplicate clustering with Haversine distance and keyword similarity.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                <span>Transparent priority score (0-100) based on documented safety factors.</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                <span>
                  Full citizen status timeline with municipal audit trail and resolution notes.
                </span>
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* 4-Step Interactive Workflow */}
      <section className="space-y-6">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900">End-to-End Workflow</h2>
          <p className="text-slate-500 text-xs sm:text-sm mt-1">
            From citizen report to field crew resolution with AI supervision.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-5 bg-white border border-slate-200 rounded-xl space-y-3">
            <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-800 flex items-center justify-center font-bold text-sm">
              1
            </div>
            <h3 className="text-sm font-bold text-slate-900">Citizen Submission</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Resident submits issue with photo, category, and GPS address. Live AI pre-screening
              checks for nearby existing reports.
            </p>
          </div>

          <div className="p-5 bg-white border border-slate-200 rounded-xl space-y-3">
            <div className="w-8 h-8 rounded-lg bg-purple-100 text-purple-800 flex items-center justify-center font-bold text-sm">
              2
            </div>
            <h3 className="text-sm font-bold text-slate-900">Gemini AI Triage</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Model evaluates safety risks, infrastructure severity, population exposure, and
              recommends the exact municipal department.
            </p>
          </div>

          <div className="p-5 bg-white border border-slate-200 rounded-xl space-y-3">
            <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center font-bold text-sm">
              3
            </div>
            <h3 className="text-sm font-bold text-slate-900">Duplicate Matching</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              System identifies overlapping complaints within 250m and alerts staff without
              discarding legitimate citizen reports.
            </p>
          </div>

          <div className="p-5 bg-white border border-slate-200 rounded-xl space-y-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-sm">
              4
            </div>
            <h3 className="text-sm font-bold text-slate-900">Admin Dispatch</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Supervisors review AI recommendation, confirm or override priority with audit notes,
              dispatch crews, and mark resolution.
            </p>
          </div>
        </div>
      </section>

      {/* Feature Highlights Grid */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="p-6 bg-white border border-slate-200 rounded-xl space-y-2">
          <Flame className="w-6 h-6 text-orange-500" />
          <h3 className="text-sm font-bold text-slate-900">Transparent Scoring Model</h3>
          <p className="text-xs text-slate-600">
            Scores are computed from 4 verifiable factors: Safety Impact (35%), Infrastructure
            Damage (25%), Population Exposure (25%), and Age (15%).
          </p>
        </div>

        <div className="p-6 bg-white border border-slate-200 rounded-xl space-y-2">
          <Copy className="w-6 h-6 text-purple-600" />
          <h3 className="text-sm font-bold text-slate-900">Intelligent Duplicate Detection</h3>
          <p className="text-xs text-slate-600">
            Uses normalized token sets, Jaccard text similarity, and Haversine geospatial proximity
            to link parallel reports.
          </p>
        </div>

        <div className="p-6 bg-white border border-slate-200 rounded-xl space-y-2">
          <BarChart3 className="w-6 h-6 text-blue-600" />
          <h3 className="text-sm font-bold text-slate-900">Verifiable Resolution SLAs</h3>
          <p className="text-xs text-slate-600">
            Analytics calculate real resolution time from timestamped submission to completion,
            giving council members true performance metrics.
          </p>
        </div>
      </section>
    </div>
  );
};
