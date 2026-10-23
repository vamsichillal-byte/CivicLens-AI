import React, { useState } from 'react';
import { User } from '../types/index.js';
import {
  Settings,
  Sparkles,
  Database,
  Shield,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  Lock,
  User as UserIcon,
  Code2,
  FileText,
  Key,
} from 'lucide-react';
import { resetDemoData } from '../services/api.js';

interface SettingsPageProps {
  currentUser: User | null;
  geminiConfigured: boolean;
  onRoleSwitch: (role: 'citizen' | 'admin') => void;
  onRefreshData: () => void;
  reportsCount: number;
}

export const SettingsPage: React.FC<SettingsPageProps> = ({
  currentUser,
  geminiConfigured,
  onRoleSwitch,
  onRefreshData,
  reportsCount,
}) => {
  const [resetting, setResetting] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);

  const handleReset = async () => {
    if (
      !confirm(
        'Are you sure you want to restore the pristine hackathon demonstration dataset? Any custom reports you created will be reset.'
      )
    ) {
      return;
    }

    setResetting(true);
    try {
      await resetDemoData();
      setResetSuccess(true);
      onRefreshData();
      setTimeout(() => setResetSuccess(false), 3000);
    } catch (err: any) {
      alert(err.message || 'Failed to reset demo data');
    } finally {
      setResetting(false);
    }
  };

  return (
    <div className="space-y-6 pb-12 max-w-4xl mx-auto">
      {/* Header */}
      <div className="border-b border-slate-200 pb-4">
        <h1 className="text-2xl font-bold text-slate-900">Platform Settings & System Health</h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Verify connected AI services, security configurations, and judge demonstration tools.
        </p>
      </div>

      {resetSuccess && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-semibold flex items-center gap-2 animate-in fade-in duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          Pristine demonstration dataset restored successfully.
        </div>
      )}

      {/* System Status Card */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 sm:p-6 shadow-xs space-y-4">
        <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-blue-600" />
          Live Service Health
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-lg space-y-1">
            <div className="text-[11px] text-slate-500 font-medium">Gemini AI Model</div>
            <div className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
              <span
                className={`w-2 h-2 rounded-full ${
                  geminiConfigured ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'
                }`}
              ></span>
              <span>{geminiConfigured ? 'gemini-3.8-flash' : 'Rule Engine Fallback'}</span>
            </div>
            <div className="text-[10px] text-slate-400">
              {geminiConfigured
                ? 'Server-side API key verified'
                : 'Deterministic rule fallback active'}
            </div>
          </div>

          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-lg space-y-1">
            <div className="text-[11px] text-slate-500 font-medium">Data Storage Engine</div>
            <div className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
              <Database className="w-3.5 h-3.5 text-blue-600" />
              <span>File-Backed JSON Store</span>
            </div>
            <div className="text-[10px] text-slate-400">
              Persistent across server reboots (/data/)
            </div>
          </div>

          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-lg space-y-1">
            <div className="text-[11px] text-slate-500 font-medium">Current Stored Reports</div>
            <div className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-purple-600" />
              <span>{reportsCount} Records</span>
            </div>
            <div className="text-[10px] text-slate-400">Includes historical audit events</div>
          </div>
        </div>
      </div>

      {/* Demo Persona Switcher */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 sm:p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <UserIcon className="w-4 h-4 text-slate-700" />
            Hackathon Judge Persona Switcher
          </h2>
          <span className="text-xs text-slate-400">One-click role toggle</span>
        </div>

        <p className="text-xs text-slate-600 leading-relaxed">
          Switch between roles to evaluate the separate experiences for residents submitting reports
          and municipal supervisors dispatching crews.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
          <div
            onClick={() => onRoleSwitch('citizen')}
            className={`p-4 rounded-xl border cursor-pointer transition-all ${
              currentUser?.role === 'citizen'
                ? 'border-blue-600 bg-blue-50/70 shadow-xs'
                : 'border-slate-200 bg-white hover:bg-slate-50'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-900">Citizen Persona</span>
              {currentUser?.role === 'citizen' && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-600 text-white">
                  Active
                </span>
              )}
            </div>
            <p className="text-xs text-slate-600 font-medium mt-1">Elena Ramos</p>
            <p className="text-[11px] text-slate-400">citizen@civiclens.gov</p>
            <p className="text-[11px] text-slate-500 mt-2">
              Can report issues, track personal submissions, and view transparent AI urgency
              scores.
            </p>
          </div>

          <div
            onClick={() => onRoleSwitch('admin')}
            className={`p-4 rounded-xl border cursor-pointer transition-all ${
              currentUser?.role === 'admin'
                ? 'border-blue-900 bg-blue-50/70 shadow-xs'
                : 'border-slate-200 bg-white hover:bg-slate-50'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-900">Administrator Persona</span>
              {currentUser?.role === 'admin' && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-900 text-white">
                  Active
                </span>
              )}
            </div>
            <p className="text-xs text-slate-600 font-medium mt-1">Dir. Marcus Vance</p>
            <p className="text-[11px] text-slate-400">admin@civiclens.gov</p>
            <p className="text-[11px] text-slate-500 mt-2">
              Full access to citywide triage queue, department dispatch, priority overrides, and
              audit logs.
            </p>
          </div>
        </div>
      </div>

      {/* Dataset Reset Tool */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 sm:p-6 shadow-xs space-y-4">
        <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
          <RefreshCw className="w-4 h-4 text-slate-600" />
          Demonstration Dataset Reset
        </h2>
        <p className="text-xs text-slate-600 leading-relaxed">
          Restore the database to its clean initial state with diverse complaints (potholes near
          schools, high-pressure water main breaks, duplicate reports on 5th Ave, and resolved
          streetlights) to evaluate the complete platform flow cleanly.
        </p>

        <div>
          <button
            onClick={handleReset}
            disabled={resetting}
            className="px-4 py-2.5 rounded-lg border border-slate-300 hover:bg-slate-100 text-slate-700 text-xs font-semibold flex items-center gap-2 disabled:opacity-50 transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${resetting ? 'animate-spin' : ''}`} />
            <span>{resetting ? 'Resetting Data...' : 'Reset to Initial Demo State'}</span>
          </button>
        </div>
      </div>

      {/* Architecture & Security Summary */}
      <div className="bg-slate-50 rounded-xl border border-slate-200 p-5 sm:p-6 space-y-3 text-xs text-slate-700">
        <h3 className="font-bold text-slate-900 flex items-center gap-2">
          <Shield className="w-4 h-4 text-emerald-600" />
          Security & Privacy Architecture
        </h3>
        <ul className="space-y-1.5 list-disc list-inside text-slate-600">
          <li>
            <strong>Server-Side Secret Isolation:</strong> Gemini API keys are held exclusively on
            the backend server. Zero credentials or keys are exposed to client browser bundles.
          </li>
          <li>
            <strong>Role-Based Data Partitioning:</strong> The `/api/reports` endpoint enforces
            strict role authorization—citizens receive strictly their own submitted records,
            preventing unauthorized access to neighbors&apos; private contact info.
          </li>
          <li>
            <strong>Transparent Priority Formula:</strong> Priority score = Safety Impact (0-35) +
            Infrastructure Damage (0-25) + Population Exposure (0-25) + Recency (0-15).
          </li>
          <li>
            <strong>Immutable Audit Trail:</strong> Every status transition, priority override, and
            department assignment records the actor, timestamp, and justification reason.
          </li>
        </ul>
      </div>
    </div>
  );
};
